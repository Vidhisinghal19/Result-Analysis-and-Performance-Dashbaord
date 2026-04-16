from flask import Blueprint, request, jsonify
import csv
import os
import traceback
from app import db
from app.models.user import User
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.subject import Subject

admin_bp = Blueprint('admin', __name__)

UPLOAD_FOLDER = "backend/app/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@admin_bp.route("/upload/users", methods=["POST"])
def upload_users():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    try:
        with open(filepath, newline='') as csvfile:
            reader = csv.DictReader(csvfile)
            if not reader.fieldnames:
                return jsonify({"error": "CSV file is missing headers"}), 400

            count = 0
            for row in reader:
                norm = {k.strip().lower(): v for k, v in row.items()}
                role = norm.get("role", "student").lower()
                email = norm.get("email")

                if not email: continue

                user = User.query.filter_by(email=email).first()
                if not user:
                    user = User(
                        name=norm.get("name"),
                        email=email,
                        password=norm.get("password", "jims@123456"),
                        role=role
                    )
                    db.session.add(user)
                    db.session.flush()

                if role == "student":
                    enrollment = norm.get("enrollment_number")
                    if not enrollment: continue
                    
                    student = Student.query.filter_by(user_id=user.id).first()
                    if not student:
                        student = Student(
                            user_id=user.id,
                            enrollment_number=enrollment,
                            course=norm.get("course"),
                            semester=norm.get("semester")
                        )
                        db.session.add(student)
                
                elif role == "faculty":
                    faculty = Faculty.query.filter_by(user_id=user.id).first()
                    if not faculty:
                        faculty = Faculty(
                            user_id=user.id,
                            department=norm.get("department")
                        )
                        db.session.add(faculty)

                count += 1
            db.session.commit()

        return jsonify({"message": f"Successfully processed {count} users", "count": count})

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/upload/subjects", methods=["POST"])
def upload_subjects():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    try:
        with open(filepath, newline='') as csvfile:
            reader = csv.DictReader(csvfile)
            count = 0
            for row in reader:
                norm = {k.strip().lower(): v for k, v in row.items()}
                name, code, f_email = norm.get("name"), norm.get("code"), norm.get("faculty_email")

                if not name or not code: continue

                f_id = None
                if f_email:
                    f_user = User.query.filter_by(email=f_email).first()
                    if f_user:
                        faculty = Faculty.query.filter_by(user_id=f_user.id).first()
                        if faculty: f_id = faculty.id

                subject = Subject.query.filter_by(code=code).first()
                if not subject:
                    subject = Subject(name=name, code=code, faculty_id=f_id, semester=norm.get("semester"))
                    db.session.add(subject)
                else:
                    subject.name, subject.faculty_id, subject.semester = name, f_id, norm.get("semester")
                
                count += 1
            db.session.commit()
        return jsonify({"message": f"Successfully processed {count} subjects"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500