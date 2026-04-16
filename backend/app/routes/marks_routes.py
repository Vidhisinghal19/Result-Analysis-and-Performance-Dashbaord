from flask import Blueprint, request, jsonify
import csv
import os
from app import db
from app.models.student import Student
from app.models.subject import Subject
from app.models.marks import Marks

marks_bp = Blueprint('marks', __name__, url_prefix='/api/marks')
UPLOAD_FOLDER = "backend/app/uploads"

@marks_bp.route("/upload", methods=["POST"])
def upload_marks():
    file = request.files.get("file")
    if not file: return jsonify({"error": "No file"}), 400

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    try:
        with open(filepath, newline='') as csvfile:
            reader = csv.DictReader(csvfile)
            count = 0
            for row in reader:
                norm = {k.strip().lower(): v for k, v in row.items()}
                enr, code, cie, obt, max_m = norm.get("enrollment_number"), norm.get("subject_code"), norm.get("cie_number"), norm.get("marks_obtained"), norm.get("max_marks")

                if not all([enr, code, cie, obt, max_m]): continue

                student = Student.query.filter_by(enrollment_number=enr).first()
                subject = Subject.query.filter_by(code=code).first()
                if not student or not subject: continue

                mark = Marks.query.filter_by(student_id=student.id, subject_id=subject.id, cie_number=cie).first()
                if not mark:
                    mark = Marks(student_id=student.id, subject_id=subject.id, cie_number=cie, marks_obtained=float(obt), max_marks=float(max_m), exam_date=norm.get("exam_date"))
                    db.session.add(mark)
                else:
                    mark.marks_obtained, mark.max_marks, mark.exam_date = float(obt), float(max_m), norm.get("exam_date")
                count += 1
            db.session.commit()
        return jsonify({"message": f"Processed {count} entries"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
