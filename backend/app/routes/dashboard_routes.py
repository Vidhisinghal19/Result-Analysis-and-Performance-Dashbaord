from flask import Blueprint, request, jsonify
import traceback
from app import db
from app.models.user import User
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.subject import Subject
from app.models.semester import Semester

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/stats', methods=['GET'])
def get_stats():
    try:
        return jsonify({
            'total_users': User.query.count(),
            'total_students': User.query.filter_by(role='student').count(),
            'total_faculty': User.query.filter_by(role='faculty').count(),
            'total_admins': User.query.filter_by(role='admin').count(),
        })
    except Exception as e: return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/role-distribution', methods=['GET'])
def role_distribution():
    try:
        return jsonify({
            'students': User.query.filter_by(role='student').count(),
            'faculty': User.query.filter_by(role='faculty').count(),
            'admins': User.query.filter_by(role='admin').count()
        })
    except Exception as e: return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/students-by-course', methods=['GET'])
def students_by_course():
    try:
        from app.models.batch import Batch
        from app.models.course import Course
        results = db.session.query(Course.name, db.func.count(Student.id).label('count'))\
            .join(Batch, Student.batch_id == Batch.id)\
            .join(Course, Batch.course_id == Course.id)\
            .group_by(Course.name).all()
        return jsonify([{'course': r.name, 'count': r.count} for r in results])
    except Exception as e: 
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def paginate_query(query, model_extractor, search_filter=None):
    page = int(request.args.get('page', 1))
    search = request.args.get('search', '').strip()
    per_page = 10
    
    if search and search_filter:
        query = search_filter(query, search)
    
    total = query.count()
    pages = max(1, (total + per_page - 1) // per_page)
    rows = query.offset((page - 1) * per_page).limit(per_page).all()
    return jsonify({'data': [model_extractor(r) for r in rows], 'total': total, 'pages': pages, 'page': page})

@dashboard_bp.route('/students-list', methods=['GET'])
def students_list():
    from app.models.batch import Batch
    from app.models.course import Course
    query = db.session.query(
        User.id, 
        User.name, 
        User.email, 
        Student.enrollment_number, 
        Course.name.label('course'),
        Batch.name.label('batch')
    ).join(Student, Student.user_id == User.id)\
     .join(Batch, Student.batch_id == Batch.id)\
     .join(Course, Batch.course_id == Course.id)
    
    def student_search(q, s):
        return q.filter(db.or_(User.name.ilike(f'%{s}%'), User.email.ilike(f'%{s}%'), Student.enrollment_number.ilike(f'%{s}%')))

    return paginate_query(query, lambda r: {
        'id': r.id, 
        'name': r.name, 
        'email': r.email, 
        'enrollment_number': r.enrollment_number, 
        'course': r.course,
        'batch': r.batch
    }, student_search)

@dashboard_bp.route('/faculty-list', methods=['GET'])
def faculty_list():
    query = db.session.query(User.id, User.name, User.email, Faculty.department).join(Faculty, Faculty.user_id == User.id)
    def faculty_search(q, s):
        return q.filter(db.or_(User.name.ilike(f'%{s}%'), User.email.ilike(f'%{s}%')))
    
    return paginate_query(query, lambda r: {'id': r.id, 'name': r.name, 'email': r.email, 'department': r.department}, faculty_search)

@dashboard_bp.route('/all-faculty', methods=['GET'])
def all_faculty():
    try:
        faculty = db.session.query(Faculty.id, User.name).join(User, Faculty.user_id == User.id).all()
        return jsonify([{'id': f.id, 'name': f.name} for f in faculty])
    except Exception as e: return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/users', methods=['GET'])
def users_list():
    page = int(request.args.get('page', 1))
    search = request.args.get('search', '').strip()
    query = User.query
    if search: query = query.filter(db.or_(User.name.ilike(f'%{search}%'), User.email.ilike(f'%{search}%')))
    total = query.count()
    rows = query.offset((page - 1) * 10).limit(10).all()
    return jsonify({'data': [{'id': u.id, 'name': u.name, 'email': u.email, 'role': u.role} for u in rows], 'total': total, 'pages': max(1, (total + 9) // 10), 'page': page})

@dashboard_bp.route('/subjects-list', methods=['GET'])
def subjects_list():
    page = int(request.args.get('page', 1))
    search = request.args.get('search', '').strip()
    query = db.session.query(Subject.id, Subject.name, Subject.code, Subject.faculty_id, Semester.number.label('semester'), User.name.label('f_name')).outerjoin(Faculty, Subject.faculty_id == Faculty.id).outerjoin(User, Faculty.user_id == User.id).outerjoin(Semester, Subject.semester_id == Semester.id)
    if search: query = query.filter(db.or_(Subject.name.ilike(f'%{search}%'), Subject.code.ilike(f'%{search}%')))
    total = query.count()
    rows = query.offset((page - 1) * 10).limit(10).all()
    return jsonify({'data': [{'id': r.id, 'name': r.name, 'code': r.code, 'faculty_id': r.faculty_id, 'semester': r.semester or "NA", 'faculty_name': r.f_name or "NA"} for r in rows], 'total': total, 'pages': max(1, (total + 9) // 10), 'page': page})
@dashboard_bp.route('/courses-list', methods=['GET'])
def courses_list():
    from app.models.course import Course
    query = Course.query
    def course_search(q, s):
        return q.filter(db.or_(Course.name.ilike(f'%{s}%'), Course.code.ilike(f'%{s}%')))
    
    return paginate_query(query, lambda r: r.to_dict(), course_search)

@dashboard_bp.route('/batches-list', methods=['GET'])
def batches_list():
    from app.models.batch import Batch
    from app.models.course import Course
    query = db.session.query(Batch.id, Batch.name, Batch.start_year, Batch.end_year, Course.name.label('course_name'))\
        .join(Course, Batch.course_id == Course.id)
    
    def batch_search(q, s):
        return q.filter(db.or_(Batch.name.ilike(f'%{s}%'), Course.name.ilike(f'%{s}%')))
    
    return paginate_query(query, lambda r: {
        'id': r.id, 'name': r.name, 'start_year': r.start_year, 'end_year': r.end_year, 'course': r.course_name
    }, batch_search)
