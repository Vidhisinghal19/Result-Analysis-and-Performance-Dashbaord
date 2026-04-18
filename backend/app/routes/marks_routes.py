from flask import Blueprint, request, jsonify
import csv
import os
from app import db
from app.models.student import Student
from app.models.subject import Subject
from app.models.marks import Marks
from app.models.exam import Exam

marks_bp = Blueprint('marks', __name__, url_prefix='/api/marks')
UPLOAD_FOLDER = "backend/app/uploads"

@marks_bp.route("/upload", methods=["POST"])
def upload_marks():
    file = request.files.get("file")
    exam_id = request.form.get("exam_id") # Get exam_id from form data
    
    if not file: return jsonify({"error": "No file provided"}), 400
    if not exam_id: return jsonify({"error": "No exam context selected. Please select an exam first."}), 400

    exam = Exam.query.get(exam_id)
    if not exam: return jsonify({"error": "Invalid Exam ID"}), 404

    # Ensure upload folder exists
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    try:
        with open(filepath, newline='') as csvfile:
            reader = csv.DictReader(csvfile)
            count = 0
            for row in reader:
                # Normalize headers: strip, lower, replace spaces/dashes with underscores
                norm = {k.strip().lower().replace(' ', '_').replace('-', '_'): v for k, v in row.items()}
                
                # Check for various possible column names
                enr = norm.get("enrollment_number") or norm.get("enrollment") or norm.get("enr_no")
                obt = norm.get("marks_obtained") or norm.get("marks") or norm.get("score")

                if not enr or not obt: continue

                student = Student.query.filter_by(enrollment_number=enr).first()
                if not student: continue

                # Check if marks already exist for this student and exam
                mark = Marks.query.filter_by(student_id=student.id, exam_id=exam_id).first()
                if not mark:
                    mark = Marks(
                        student_id=student.id, 
                        subject_id=exam.subject_id, 
                        exam_id=exam_id, 
                        marks_obtained=float(obt)
                    )
                    db.session.add(mark)
                else:
                    mark.marks_obtained = float(obt)
                count += 1
            db.session.commit()
        return jsonify({"message": f"Successfully processed {count} records for {exam.name}"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
