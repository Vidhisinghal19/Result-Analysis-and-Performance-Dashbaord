from flask import Blueprint, request, jsonify
import csv
import os
from app import db
from app.models.student import Student
from app.models.subject import Subject
from app.models.marks import Marks
from app.models.exam import Exam

marks_bp = Blueprint('marks', __name__, url_prefix='/api/marks')
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'uploads')

@marks_bp.route("/upload", methods=["POST"])
def upload_marks():
    file = request.files.get("file")
    exam_id = request.form.get("exam_id")

    if not file:
        return jsonify({"error": "No file provided"}), 400
    if not exam_id:
        return jsonify({"error": "No exam context selected. Please select an exam first."}), 400

    exam = Exam.query.get(exam_id)
    if not exam:
        return jsonify({"error": "Invalid Exam ID"}), 404

    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    try:
        with open(filepath, newline='', encoding='utf-8-sig') as csvfile:
            # Auto-detect delimiter: handles comma, tab, and semicolon
            sample = csvfile.read(4096)
            csvfile.seek(0)
            try:
                dialect = csv.Sniffer().sniff(sample, delimiters=',\t;')
            except csv.Error:
                dialect = csv.excel  # fallback to standard comma

            reader = csv.DictReader(csvfile, dialect=dialect)
            count = 0
            not_found = []

            for row in reader:
                # Strip ALL whitespace from keys and values to handle trailing tabs/spaces
                norm = {
                    k.strip().lower().replace(' ', '_').replace('-', '_'): (v.strip() if v else '')
                    for k, v in row.items() if k is not None
                }

                # Accept multiple common column name variants
                enr = (norm.get("enrollment_number") or norm.get("enrollment")
                       or norm.get("enr_no") or norm.get("enr"))
                obt = (norm.get("marks_obtained") or norm.get("marks")
                       or norm.get("score"))

                # Skip blank rows
                if not enr and not obt:
                    continue
                if not enr or not obt:
                    continue

                student = Student.query.filter_by(enrollment_number=enr).first()
                if not student:
                    not_found.append(enr)
                    continue

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

        response = {"message": f"Successfully processed {count} record(s) for '{exam.name}'."}
        if not_found:
            response["warning"] = (
                f"{len(not_found)} enrollment number(s) not found in system: "
                + ', '.join(not_found)
            )
        return jsonify(response), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
