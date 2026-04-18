from flask import Blueprint, request, jsonify
from datetime import datetime
from app import db
from app.models.faculty import Faculty
from app.models.subject import Subject
from app.models.semester import Semester
from app.models.batch import Batch
from app.models.course import Course
from app.models.student import Student
from app.models.user import User
from app.models.marks import Marks
from app.models.exam import Exam
from app.models.mentorship import Mentorship

faculty_bp = Blueprint('faculty', __name__, url_prefix='/api/faculty')

@faculty_bp.route('/my-subjects/<int:user_id>', methods=['GET'])
def get_my_subjects(user_id):
    try:
        faculty = Faculty.query.filter_by(user_id=user_id).first()
        if not faculty:
            return jsonify({"error": "Faculty record not found"}), 404
        
        query = db.session.query(
            Subject.id,
            Subject.name,
            Subject.code,
            Course.id.label('course_id'),
            Course.name.label('course_name'),
            Batch.id.label('batch_id'),
            Batch.name.label('batch_name'),
            Semester.id.label('semester_id'),
            Semester.name.label('semester_name'),
            db.func.count(Student.id).label('student_count')
        ).join(Semester, Subject.semester_id == Semester.id)\
         .join(Batch, Semester.batch_id == Batch.id)\
         .join(Course, Batch.course_id == Course.id)\
         .outerjoin(Student, Student.batch_id == Batch.id)\
         .filter(Subject.faculty_id == faculty.id)\
         .group_by(Subject.id, Course.id, Course.name, Batch.id, Batch.name, Semester.id, Semester.name)
        
        subjects = query.all()
        result = []
        for s in subjects:
            result.append({
                "id": s.id,
                "name": s.name,
                "code": s.code,
                "course": s.course_name,
                "course_id": s.course_id,
                "batch": s.batch_name,
                "batch_id": s.batch_id,
                "semester": s.semester_name,
                "semester_id": s.semester_id,
                "total_students": s.student_count
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@faculty_bp.route('/subject-students/<int:subject_id>', methods=['GET'])
def get_subject_students(subject_id):
    try:
        subject = Subject.query.get(subject_id)
        if not subject: return jsonify({"error": "Subject not found"}), 404
        semester = Semester.query.get(subject.semester_id)
        if not semester: return jsonify({"error": "Semester not found"}), 404
        students = db.session.query(
            Student.id,
            User.name,
            Student.enrollment_number
        ).join(User, Student.user_id == User.id)\
         .filter(Student.batch_id == semester.batch_id).all()
        return jsonify([{"id": s.id, "name": s.name, "enrollment_number": s.enrollment_number} for s in students]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@faculty_bp.route('/subject-marks/<int:subject_id>', methods=['GET'])
def get_subject_marks(subject_id):
    try:
        marks = db.session.query(
            Marks.student_id,
            Marks.marks_obtained,
            Exam.name.label('exam_name'),
            Exam.max_marks
        ).join(Exam, Marks.exam_id == Exam.id).filter(Marks.subject_id == subject_id).all()
        result = [{
            "student_id": m.student_id,
            "exam_name": m.exam_name,
            "marks_obtained": m.marks_obtained,
            "max_marks": m.max_marks
        } for m in marks]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@faculty_bp.route('/exams', methods=['POST'])
def create_exam():
    data = request.get_json()
    try:
        new_exam = Exam(
            subject_id=data['subject_id'],
            name=data['name'],
            type=data['type'],
            max_marks=data['max_marks'],
            exam_date=datetime.strptime(data['exam_date'], '%Y-%m-%d') if data.get('exam_date') else datetime.utcnow().date()
        )
        db.session.add(new_exam)
        db.session.commit()
        return jsonify(new_exam.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@faculty_bp.route('/subject-exams/<int:subject_id>', methods=['GET'])
def get_subject_exams(subject_id):
    try:
        exams = Exam.query.filter_by(subject_id=subject_id).order_by(Exam.exam_date.desc()).all()
        return jsonify([e.to_dict() for e in exams]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@faculty_bp.route('/exams/<int:exam_id>', methods=['DELETE'])
def delete_exam(exam_id):
    try:
        exam = Exam.query.get(exam_id)
        if not exam: return jsonify({"error": "Exam not found"}), 404
        db.session.delete(exam)
        db.session.commit()
        return jsonify({"message": "Exam deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
@faculty_bp.route('/mentorship/<int:subject_id>', methods=['GET'])
def get_subject_mentorship(subject_id):
    try:
        records = Mentorship.query.filter_by(subject_id=subject_id).all()
        return jsonify([r.to_dict() for r in records]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@faculty_bp.route('/mentorship', methods=['POST'])
def save_mentorship():
    data = request.get_json()
    try:
        # Get faculty ID from user ID
        faculty = Faculty.query.filter_by(user_id=data['user_id']).first()
        if not faculty: return jsonify({"error": "Faculty not found"}), 404
        
        record = Mentorship.query.filter_by(
            student_id=data['student_id'],
            subject_id=data['subject_id']
        ).first()

        if not record:
            record = Mentorship(
                student_id=data['student_id'],
                subject_id=data['subject_id'],
                faculty_id=faculty.id
            )
            db.session.add(record)

        record.performance_rating = data.get('performance_rating', record.performance_rating)
        record.remarks = data.get('remarks', record.remarks)
        record.feedback = data.get('feedback', record.feedback)
        
        db.session.commit()
        return jsonify(record.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
