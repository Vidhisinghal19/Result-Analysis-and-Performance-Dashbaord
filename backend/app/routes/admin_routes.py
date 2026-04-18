from flask import Blueprint, request, jsonify
import csv
import os
import traceback
from app import db
from app.models.user import User
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.subject import Subject
from app.models.semester import Semester
from app.models.course import Course
from app.models.batch import Batch

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
        with open(filepath, newline='', encoding='utf-8-sig') as csvfile:
            reader = csv.DictReader(csvfile)
            if not reader.fieldnames:
                return jsonify({"error": "CSV file is missing headers"}), 400

            created = 0
            updated = 0
            batch_warnings = []

            def clean_val(v):
                return v.replace(' ', '').replace('\u2013', '-').replace('\u2014', '-').lower()

            all_batches = Batch.query.all()

            for row in reader:
                norm = {k.strip().lower().replace(' ', '_'): (v.strip() if v else '') for k, v in row.items()}

                role = norm.get("role", "student").lower()
                email = norm.get("email", "").lower()
                if not email:
                    continue

                # Create or get user
                user = User.query.filter_by(email=email).first()
                is_new = user is None
                if is_new:
                    user = User(
                        name=norm.get("name", email),
                        email=email,
                        password=norm.get("password", "jims@123456"),
                        role=role
                    )
                    db.session.add(user)
                    db.session.flush()

                if role == "student":
                    enrollment = norm.get("enrollment_number", "")
                    batch_name = norm.get("batch_name") or norm.get("batch", "")

                    # Find batch (fuzzy match)
                    batch_id = None
                    if batch_name:
                        clean_target = clean_val(batch_name)
                        matched = next((b for b in all_batches if clean_val(b.name) == clean_target), None)
                        if matched:
                            batch_id = matched.id
                        else:
                            batch_warnings.append(f"Batch '{batch_name}' not found for {email}")

                    # Always create/update student record
                    student = Student.query.filter_by(user_id=user.id).first()
                    if not student:
                        if not enrollment:
                            enrollment = f"ENR-{user.id}"
                        db.session.add(Student(user_id=user.id, enrollment_number=enrollment, batch_id=batch_id))
                        created += 1
                    else:
                        if enrollment:
                            student.enrollment_number = enrollment
                        if batch_id:
                            student.batch_id = batch_id
                        updated += 1

                elif role == "faculty":
                    faculty = Faculty.query.filter_by(user_id=user.id).first()
                    if not faculty:
                        db.session.add(Faculty(user_id=user.id, department=norm.get("department", "")))
                        created += 1
                    else:
                        faculty.department = norm.get("department", "")
                        updated += 1

            db.session.commit()

            msg = f"Upload complete: {created} created, {updated} updated."
            if batch_warnings:
                msg += f" Warnings ({len(batch_warnings)}): " + "; ".join(batch_warnings[:3])
                if len(batch_warnings) > 3:
                    msg += f" ...and {len(batch_warnings)-3} more."

            return jsonify({"message": msg, "created": created, "updated": updated, "warnings": batch_warnings})

    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
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
                norm = {k.strip().lower().replace(' ', '_'): (v.strip() if v else v) for k, v in row.items()}
                
                # Support multi-format headers
                name = (norm.get("subject") or norm.get("name") or "").strip()
                code = norm.get("code", "").strip()
                f_email = (norm.get("faculty") or norm.get("faculty_email") or "").strip().lower()
                batch_name = norm.get("batch_name") or norm.get("batch") or ""
                sem_val = norm.get("sem") or norm.get("semester_number") or norm.get("semester")

                if not name or not code or not batch_name or not sem_val:
                    print(f"DEBUG: Skipping subject {name} due to missing fields")
                    continue

                # Normalize batch name: remove all spaces and standardise dashes
                # e.g. "2025 - 2027" -> "2025-2027"
                def clean_val(v): return v.replace(' ', '').replace('–', '-').replace('—', '-')
                clean_batch_target = clean_val(batch_name)

                all_batches = Batch.query.all()
                batch = next((b for b in all_batches if clean_val(b.name) == clean_batch_target), None)
                
                if not batch:
                    print(f"DEBUG: Batch not found for subject: {batch_name}")
                    continue

                sem = Semester.query.filter_by(batch_id=batch.id, number=int(sem_val)).first()
                if not sem:
                    print(f"DEBUG: Semester {sem_val} not found in batch {batch_name}")
                    continue

                f_id = None
                if f_email:
                    f_user = User.query.filter_by(email=f_email).first()
                    if f_user and f_user.faculty_profile:
                        f_id = f_user.faculty_profile.id

                subject = Subject.query.filter_by(code=code, semester_id=sem.id).first()
                if not subject:
                    subject = Subject(
                        name=name, code=code, faculty_id=f_id, semester_id=sem.id,
                        type=norm.get("type", "core").lower(), 
                        credits=int(norm.get("credits", 0))
                    )
                    db.session.add(subject)
                    print(f"DEBUG: Created subject {code}")
                else:
                    subject.name, subject.faculty_id, subject.semester_id = name, f_id, sem.id
                    subject.type = norm.get("type", "core").lower()
                    subject.credits = int(norm.get("credits", 0))
                    print(f"DEBUG: Updated subject {code}")
                
                count += 1
            db.session.commit()
        return jsonify({"message": f"Successfully processed {count} subjects"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ─── COURSE CRUD ─────────────────────────────────────────────────────────

@admin_bp.route("/api/admin/courses", methods=["GET"])
def get_courses():
    courses = Course.query.all()
    return jsonify([c.to_dict() for c in courses])

@admin_bp.route("/api/admin/course", methods=["POST"])
def create_course():
    data = request.get_json()
    if not data.get("name") or not data.get("code"):
        return jsonify({"error": "Name and code are required"}), 400
    
    if Course.query.filter_by(code=data.get("code")).first():
        return jsonify({"error": "Course code already exists"}), 400
        
    course = Course(name=data.get("name"), code=data.get("code"))
    db.session.add(course)
    db.session.commit()
    return jsonify(course.to_dict()), 201

@admin_bp.route("/api/admin/course/<int:id>", methods=["PUT"])
def update_course(id):
    data = request.get_json()
    course = Course.query.get_or_404(id)
    if "name" in data: course.name = data["name"]
    if "code" in data: course.code = data["code"]
    db.session.commit()
    return jsonify(course.to_dict())

@admin_bp.route("/api/admin/course/<int:id>", methods=["DELETE"])
def delete_course(id):
    course = Course.query.get_or_404(id)
    db.session.delete(course)
    db.session.commit()
    return jsonify({"message": "Course deleted"})


# ─── BATCH CRUD ──────────────────────────────────────────────────────────

@admin_bp.route("/api/admin/batches", methods=["GET"])
def get_batches():
    course_id = request.args.get("course_id")
    query = Batch.query
    if course_id:
        query = query.filter_by(course_id=course_id)
    batches = query.all()
    return jsonify([b.to_dict() for b in batches])

@admin_bp.route("/api/admin/batch", methods=["POST"])
def create_batch():
    data = request.get_json()
    if not data.get("course_id") or not data.get("name"):
        return jsonify({"error": "course_id and name are required"}), 400
        
    batch = Batch(
        course_id=data["course_id"],
        name=data["name"],
        start_year=data.get("start_year"),
        end_year=data.get("end_year")
    )
    db.session.add(batch)
    db.session.flush()

    # Automatically create semesters for this batch if requested
    num_semesters = int(data.get("num_semesters", 0))
    for i in range(1, num_semesters + 1):
        sem = Semester(batch_id=batch.id, name=f"Semester {i}", number=i)
        db.session.add(sem)

    db.session.commit()
    return jsonify(batch.to_dict()), 201

@admin_bp.route("/api/admin/batch/<int:id>", methods=["DELETE"])
def delete_batch(id):
    batch = Batch.query.get_or_404(id)
    db.session.delete(batch)
    db.session.commit()
    return jsonify({"message": "Batch deleted"})


# ─── SEMESTER CRUD ───────────────────────────────────────────────────────

@admin_bp.route("/api/admin/semesters", methods=["GET"])
def get_all_semesters():
    batch_id = request.args.get("batch_id")
    query = Semester.query
    if batch_id:
        query = query.filter_by(batch_id=batch_id)
    semesters = query.all()
    return jsonify([s.to_dict() for s in semesters])


# ─── STUDENT CRUD ────────────────────────────────────────────────────────

@admin_bp.route("/api/admin/student", methods=["POST"])
def create_student():
    """Create a new student with associated user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get("email") or not data.get("enrollment_number"):
            return jsonify({"error": "Email and enrollment number are required"}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=data.get("email")).first()
        if existing_user:
            return jsonify({"error": "User with this email already exists"}), 400
        
        # Check if enrollment number already exists
        existing_student = Student.query.filter_by(enrollment_number=data.get("enrollment_number")).first()
        if existing_student:
            return jsonify({"error": "Enrollment number already exists"}), 400
        
        # Create user
        user = User(
            name=data.get("name"),
            email=data.get("email"),
            password=data.get("password", "jims@123456"),
            role="student"
        )
        db.session.add(user)
        db.session.flush()
        
        # Create student
        batch_id = data.get("batch_id")
        if not batch_id:
            return jsonify({"error": "Batch ID is required"}), 400

        student = Student(
            user_id=user.id,
            enrollment_number=data.get("enrollment_number"),
            batch_id=batch_id,
            current_semester_id=data.get("current_semester_id")
        )
        db.session.add(student)
        db.session.commit()
        
        return jsonify({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "enrollment_number": student.enrollment_number,
            "batch_id": student.batch_id,
            "current_semester_id": student.current_semester_id,
            "message": "Student created successfully"
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/api/admin/student/<int:user_id>", methods=["PUT"])
def update_student(user_id):
    """Update student details"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        user = User.query.get(user_id)
        if not user or user.role != "student":
            return jsonify({"error": "Student not found"}), 404
        
        student = Student.query.filter_by(user_id=user_id).first()
        if not student:
            return jsonify({"error": "Student record not found"}), 404
        
        # Update user fields
        if "name" in data and data.get("name"):
            user.name = data.get("name").strip()
        if "email" in data and data.get("email"):
            new_email = data.get("email").strip().lower()
            if new_email != user.email:
                existing = User.query.filter_by(email=new_email).first()
                if existing:
                    return jsonify({"error": "Email already in use"}), 400
                user.email = new_email
        
        # Update student fields
        if "enrollment_number" in data and data.get("enrollment_number"):
            new_enrollment = data.get("enrollment_number").strip()
            if new_enrollment != student.enrollment_number:
                existing = Student.query.filter_by(enrollment_number=new_enrollment).first()
                if existing:
                    return jsonify({"error": "Enrollment number already exists"}), 400
                student.enrollment_number = new_enrollment
        
        if "batch_id" in data and data.get("batch_id"):
            student.batch_id = data.get("batch_id")
        
        if "current_semester_id" in data:
            student.current_semester_id = data.get("current_semester_id")
        
        db.session.commit()
        
        return jsonify({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "enrollment_number": student.enrollment_number,
            "batch_id": student.batch_id,
            "current_semester_id": student.current_semester_id,
            "message": "Student updated successfully"
        }), 200
    except ValueError as e:
        db.session.rollback()
        return jsonify({"error": "Invalid data format"}), 400
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/api/admin/student/<int:user_id>", methods=["DELETE"])
def delete_student(user_id):
    """Delete a student"""
    try:
        user = User.query.get(user_id)
        if not user or user.role != "student":
            return jsonify({"error": "Student not found"}), 404
        
        student = Student.query.filter_by(user_id=user_id).first()
        if student:
            db.session.delete(student)
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({"message": "Student deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ─── FACULTY CRUD ────────────────────────────────────────────────────────

@admin_bp.route("/api/admin/faculty", methods=["POST"])
def create_faculty():
    """Create a new faculty member"""
    try:
        data = request.get_json()
        
        if not data.get("email"):
            return jsonify({"error": "Email is required"}), 400
        
        existing_user = User.query.filter_by(email=data.get("email")).first()
        if existing_user:
            return jsonify({"error": "User with this email already exists"}), 400
        
        user = User(
            name=data.get("name"),
            email=data.get("email"),
            password=data.get("password", "jims@123456"),
            role="faculty"
        )
        db.session.add(user)
        db.session.flush()
        
        faculty = Faculty(
            user_id=user.id,
            department=data.get("department")
        )
        db.session.add(faculty)
        db.session.commit()
        
        return jsonify({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "department": faculty.department,
            "message": "Faculty created successfully"
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/api/admin/faculty/<int:user_id>", methods=["PUT"])
def update_faculty(user_id):
    """Update faculty details"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        user = User.query.get(user_id)
        if not user or user.role != "faculty":
            return jsonify({"error": "Faculty not found"}), 404
        
        faculty = Faculty.query.filter_by(user_id=user_id).first()
        if not faculty:
            return jsonify({"error": "Faculty record not found"}), 404
        
        if "name" in data and data.get("name"):
            user.name = data.get("name").strip()
        if "email" in data and data.get("email"):
            new_email = data.get("email").strip().lower()
            if new_email != user.email:
                existing = User.query.filter_by(email=new_email).first()
                if existing:
                    return jsonify({"error": "Email already in use"}), 400
                user.email = new_email
        if "department" in data and data.get("department"):
            faculty.department = data.get("department").strip()
        
        db.session.commit()
        
        return jsonify({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "department": faculty.department,
            "message": "Faculty updated successfully"
        }), 200
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/api/admin/faculty/<int:user_id>", methods=["DELETE"])
def delete_faculty(user_id):
    """Delete a faculty member"""
    try:
        user = User.query.get(user_id)
        if not user or user.role != "faculty":
            return jsonify({"error": "Faculty not found"}), 404
        
        faculty = Faculty.query.filter_by(user_id=user_id).first()
        if faculty:
            db.session.delete(faculty)
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({"message": "Faculty deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ─── USER CRUD ────────────────────────────────────────────────────────

@admin_bp.route("/api/admin/user", methods=["POST"])
def create_user():
    """Create a new user (admin or custom role)"""
    try:
        data = request.get_json()
        
        if not data.get("email"):
            return jsonify({"error": "Email is required"}), 400
        
        existing_user = User.query.filter_by(email=data.get("email")).first()
        if existing_user:
            return jsonify({"error": "User with this email already exists"}), 400
        
        user = User(
            name=data.get("name"),
            email=data.get("email"),
            password=data.get("password", "jims@123456"),
            role=data.get("role", "admin")
        )
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "message": "User created successfully"
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/api/admin/user/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    """Update user details"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Update name
        if "name" in data and data.get("name"):
            user.name = data.get("name").strip()
        
        # Update email with duplicate check
        if "email" in data and data.get("email"):
            new_email = data.get("email").strip().lower()
            if new_email != user.email:
                existing = User.query.filter_by(email=new_email).first()
                if existing:
                    return jsonify({"error": "Email already in use"}), 400
                user.email = new_email
        
        # Update role
        if "role" in data and data.get("role"):
            role = data.get("role").strip().lower()
            if role not in ['admin', 'faculty', 'student']:
                return jsonify({"error": "Invalid role. Must be admin, faculty, or student"}), 400
            user.role = role
        
        db.session.commit()
        
        return jsonify({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "message": "User updated successfully"
        }), 200
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/api/admin/user/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    """Delete a user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({"message": "User deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ─── SUBJECT CRUD ────────────────────────────────────────────────────────

@admin_bp.route("/api/admin/subject", methods=["POST"])
def create_subject():
    """Create a new subject"""
    try:
        data = request.get_json()
        if not data.get("name") or not data.get("code"):
            return jsonify({"error": "Name and code are required"}), 400
        
        semester_id = data.get("semester_id")
        if not semester_id:
            return jsonify({"error": "Semester is required"}), 400

        existing = Subject.query.filter_by(code=data.get("code"), semester_id=semester_id).first()
        if existing:
            return jsonify({"error": "Subject code already exists in this semester"}), 400

        subject = Subject(
            name=data.get("name"),
            code=data.get("code"),
            faculty_id=data.get("faculty_id") if data.get("faculty_id") else None,
            semester_id=semester_id,
            type=data.get("type", "core"),
            credits=data.get("credits", 0)
        )
        db.session.add(subject)
        db.session.commit()
        
        return jsonify({"message": "Subject created successfully", "id": subject.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/api/admin/subject/<int:id>", methods=["PUT"])
def update_subject(id):
    """Update subject details"""
    try:
        data = request.get_json()
        subject = Subject.query.get(id)
        if not subject:
            return jsonify({"error": "Subject not found"}), 404
        
        if "name" in data: subject.name = data.get("name")
        if "code" in data: 
            new_code = data.get("code")
            if new_code != subject.code:
                # Check uniqueness within the current semester of the subject
                existing = Subject.query.filter_by(code=new_code, semester_id=subject.semester_id).first()
                if existing: return jsonify({"error": "Code already exists in this semester"}), 400
                subject.code = new_code
        
        if "type" in data: subject.type = data.get("type")
        if "credits" in data: subject.credits = data.get("credits")
        
        if "semester_id" in data:
            subject.semester_id = data.get("semester_id")

        db.session.commit()
        return jsonify({"message": "Subject updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/api/admin/subject/<int:id>", methods=["DELETE"])
def delete_subject(id):
    """Delete a subject"""
    try:
        subject = Subject.query.get(id)
        if not subject:
            return jsonify({"error": "Subject not found"}), 404
        db.session.delete(subject)
        db.session.commit()
        return jsonify({"message": "Subject deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500