from flask import Blueprint, jsonify, request
from app import db
from app.models.student import Student
from app.models.marks import Marks
from app.models.subject import Subject
from app.models.semester import Semester
from app.models.batch import Batch
from sqlalchemy import func

student_bp = Blueprint('student', __name__, url_prefix='/api/student')

def calculate_grade(pct):
    if pct >= 90: return 'A+'
    if pct >= 80: return 'A'
    if pct >= 70: return 'B+'
    if pct >= 60: return 'B'
    if pct >= 50: return 'C'
    if pct >= 40: return 'P'
    return 'F'

@student_bp.route('/dashboard-overview/<int:user_id>', methods=['GET'])
def get_dashboard_overview(user_id):
    try:
        student = Student.query.filter_by(user_id=user_id).first()
        if not student:
            return jsonify({"error": "Student not found"}), 404

        from app.models.exam import Exam

        total_subjects = db.session.query(func.count(Subject.id))\
            .join(Semester, Subject.semester_id == Semester.id)\
            .filter(Semester.batch_id == student.batch_id).scalar() or 0

        student_marks = db.session.query(
            func.sum(Marks.marks_obtained).label('obtained'),
            func.sum(Exam.max_marks).label('total')
        ).join(Exam, Marks.exam_id == Exam.id)\
         .filter(Marks.student_id == student.id).first()

        obtained = student_marks.obtained if student_marks.obtained else 0
        total = student_marks.total if student_marks.total else 0
        overall_percentage = (obtained / total * 100) if total > 0 else 0

        all_students_in_batch = Student.query.filter_by(batch_id=student.batch_id).all()
        student_performances = []
        
        for s in all_students_in_batch:
            m = db.session.query(
                func.sum(Marks.marks_obtained).label('obtained'),
                func.sum(Exam.max_marks).label('total')
            ).join(Exam, Marks.exam_id == Exam.id)\
             .filter(Marks.student_id == s.id).first()
            
            s_obtained = m.obtained if m.obtained else 0
            s_total = m.total if m.total else 0
            s_percentage = (s_obtained / s_total * 100) if s_total > 0 else 0
            student_performances.append({'student_id': s.id, 'percentage': s_percentage})
        
        student_performances.sort(key=lambda x: x['percentage'], reverse=True)
        
        rank = 0
        for i, perf in enumerate(student_performances):
            if perf['student_id'] == student.id:
                rank = i + 1
                break

        return jsonify({
            "total_subjects": total_subjects,
            "overall_percentage": round(overall_percentage, 2),
            "rank": rank,
            "total_students_in_batch": len(all_students_in_batch),
            "grade": calculate_grade(overall_percentage),
            "enrollment_number": student.enrollment_number
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@student_bp.route('/results/<int:user_id>', methods=['GET'])
def get_student_results(user_id):
    try:
        student = Student.query.filter_by(user_id=user_id).first()
        if not student:
            return jsonify({"error": "Student not found"}), 404

        from app.models.exam import Exam

        results = db.session.query(
            Subject.name.label('subject'),
            Subject.code.label('code'),
            func.sum(Marks.marks_obtained).label('marks_obtained'),
            func.sum(Exam.max_marks).label('max_marks')
        ).join(Marks, Marks.subject_id == Subject.id)\
         .join(Exam, Marks.exam_id == Exam.id)\
         .filter(Marks.student_id == student.id)\
         .group_by(Subject.id).all()

        formatted_results = []
        for r in results:
            pct = (r.marks_obtained / r.max_marks * 100) if r.max_marks > 0 else 0
            formatted_results.append({
                "subject": r.subject,
                "code": r.code,
                "marks": round(r.marks_obtained, 1),
                "total": round(r.max_marks, 1),
                "percentage": round(pct, 2),
                "grade": calculate_grade(pct)
            })

        return jsonify(formatted_results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@student_bp.route('/hierarchy/<int:user_id>', methods=['GET'])
def get_student_hierarchy(user_id):
    try:
        from app.models.course import Course
        student = Student.query.filter_by(user_id=user_id).first()
        if not student:
            return jsonify({"error": "Student not found"}), 404

        batch = Batch.query.get(student.batch_id)
        if not batch: return jsonify({"error": "Batch not found"}), 404
        course = Course.query.get(batch.course_id)
        
        # Filter semesters based on current_semester_id
        current_semester = Semester.query.get(student.current_semester_id) if student.current_semester_id else None
        
        semesters_query = Semester.query.filter_by(batch_id=batch.id).order_by(Semester.number)
        if current_semester:
            semesters_query = semesters_query.filter(Semester.number <= current_semester.number)
        
        semesters = semesters_query.all()
        
        hierarchy = {
            "course": course.name,
            "batch": batch.name,
            "current_semester": current_semester.name if current_semester else "Not Set",
            "semesters": []
        }
        
        for sem in semesters:
            subjects = Subject.query.filter_by(semester_id=sem.id).all()
            hierarchy["semesters"].append({
                "id": sem.id,
                "name": sem.name,
                "number": sem.number,
                "subjects": [{"id": s.id, "name": s.name, "code": s.code} for s in subjects]
            })
            
        return jsonify(hierarchy), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@student_bp.route('/subject-performance/<int:user_id>/<int:subject_id>', methods=['GET'])
def get_subject_performance(user_id, subject_id):
    try:
        from app.models.exam import Exam
        student = Student.query.filter_by(user_id=user_id).first()
        if not student:
            return jsonify({"error": "Student not found"}), 404

        marks_list = db.session.query(
            Exam.name.label('exam_name'),
            Exam.type.label('exam_type'),
            Exam.max_marks.label('max_marks'),
            Marks.marks_obtained.label('obtained'),
            Marks.created_at.label('date')
        ).join(Exam, Marks.exam_id == Exam.id)\
         .filter(Marks.student_id == student.id, Marks.subject_id == subject_id)\
         .order_by(Marks.created_at).all()

        from app.models.mentorship import Mentorship
        mentor_record = Mentorship.query.filter_by(student_id=student.id, subject_id=subject_id).first()
        
        performance_data = [
            {
                "exam_name": r.exam_name,
                "exam_type": r.exam_type,
                "max_marks": r.max_marks,
                "obtained": r.obtained,
                "date": r.date.isoformat() if r.date else None
            } for r in marks_list
        ]

        return jsonify({
            "marks": performance_data,
            "mentorship": {
                "rating": mentor_record.performance_rating if mentor_record else None,
                "remarks": mentor_record.remarks if mentor_record else None,
                "feedback": mentor_record.feedback if mentor_record else None
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@student_bp.route('/mentorship-feedback/<int:user_id>/<int:subject_id>', methods=['GET'])
def get_mentorship_feedback(user_id, subject_id):
    try:
        student = Student.query.filter_by(user_id=user_id).first()
        if not student:
            return jsonify({"error": "Student not found"}), 404

        from app.models.mentorship import Mentorship
        record = Mentorship.query.filter_by(student_id=student.id, subject_id=subject_id).first()
        if not record:
            return jsonify(None), 200 # Return null if no record exists
            
        return jsonify(record.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
