from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.subject import Subject

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
        results = db.session.query(Student.course, db.func.count(Student.id).label('count')).filter(Student.course.isnot(None)).group_by(Student.course).all()
        return jsonify([{'course': r.course, 'count': r.count} for r in results])
    except Exception as e: return jsonify({'error': str(e)}), 500

def paginate_query(query, model_extractor):
    page = int(request.args.get('page', 1))
    search = request.args.get('search', '').strip()
    per_page = 10
    
    if search:
        query = query.filter(db.or_(User.name.ilike(f'%{search}%'), User.email.ilike(f'%{search}%')))
    
    total = query.count()
    pages = max(1, (total + per_page - 1) // per_page)
    rows = query.offset((page - 1) * per_page).limit(per_page).all()
    return jsonify({'data': [model_extractor(r) for r in rows], 'total': total, 'pages': pages, 'page': page})

@dashboard_bp.route('/students-list', methods=['GET'])
def students_list():
    query = db.session.query(User.id, User.name, User.email, Student.enrollment_number, Student.course, Student.semester).join(Student, Student.user_id == User.id)
    return paginate_query(query, lambda r: {'id': r.id, 'name': r.name, 'email': r.email, 'enrollment_number': r.enrollment_number, 'course': r.course, 'semester': r.semester})

@dashboard_bp.route('/faculty-list', methods=['GET'])
def faculty_list():
    query = db.session.query(User.id, User.name, User.email, Faculty.department).join(Faculty, Faculty.user_id == User.id)
    return paginate_query(query, lambda r: {'id': r.id, 'name': r.name, 'email': r.email, 'department': r.department})

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
    query = db.session.query(Subject.id, Subject.name, Subject.code, Subject.semester, User.name.label('f_name')).outerjoin(Faculty, Subject.faculty_id == Faculty.id).outerjoin(User, Faculty.user_id == User.id)
    if search: query = query.filter(db.or_(Subject.name.ilike(f'%{search}%'), Subject.code.ilike(f'%{search}%')))
    total = query.count()
    rows = query.offset((page - 1) * 10).limit(10).all()
    return jsonify({'data': [{'id': r.id, 'name': r.name, 'code': r.code, 'semester': r.semester, 'faculty_name': r.f_name or "NA"} for r in rows], 'total': total, 'pages': max(1, (total + 9) // 10), 'page': page})
