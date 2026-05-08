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
            'total_students': Student.query.count(),
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
    try:
        page = int(request.args.get('page', 1))
        search = request.args.get('search', '').strip()
        course_id = request.args.get('course_id')
        batch_id = request.args.get('batch_id')
        semester_id = request.args.get('semester_id')

        query = db.session.query(
            Student.id,
            Student.enrollment_number,
            Student.current_semester_id,
            User.id.label('user_id'),
            User.name,
            User.email,
            Batch.name.label('batch'),
            Course.name.label('course'),
            Semester.name.label('sem_name'),
            Batch.id.label('b_id'),
            Course.id.label('c_id')
        ).join(User, Student.user_id == User.id)\
         .outerjoin(Batch, Student.batch_id == Batch.id)\
         .outerjoin(Course, Batch.course_id == Course.id)\
         .outerjoin(Semester, Student.current_semester_id == Semester.id)

        if search:
            query = query.filter(db.or_(
                User.name.ilike(f'%{search}%'),
                User.email.ilike(f'%{search}%'),
                Student.enrollment_number.ilike(f'%{search}%')
            ))
        
        if course_id: query = query.filter(Course.id == course_id)
        if batch_id: query = query.filter(Batch.id == batch_id)
        if semester_id: query = query.filter(Semester.id == semester_id)

        total = query.count()
        rows = query.offset((page - 1) * 10).limit(10).all()

        return jsonify({
            'data': [{
                'id': r.user_id,
                'student_id': r.id,
                'name': r.name,
                'email': r.email,
                'enrollment_number': r.enrollment_number,
                'course': r.course or 'N/A',
                'batch': r.batch or 'N/A',
                'current_semester_id': r.current_semester_id,
                'current_semester': r.sem_name or 'Not Set'
            } for r in rows],
            'total': total,
            'pages': max(1, (total + 9) // 10),
            'page': page
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/faculty-list', methods=['GET'])
def faculty_list():
    dept = request.args.get('department', '').strip()
    query = db.session.query(User.id, User.name, User.email, Faculty.department).join(Faculty, Faculty.user_id == User.id)
    def faculty_search(q, s):
        res = q.filter(db.or_(User.name.ilike(f'%{s}%'), User.email.ilike(f'%{s}%')))
        if dept: res = res.filter(Faculty.department == dept)
        return res
    
    # Check for direct filter if no search
    search = request.args.get('search', '').strip()
    if dept and not search:
        query = query.filter(Faculty.department == dept)
        
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
    role = request.args.get('role', '').strip()
    query = User.query
    if search: query = query.filter(db.or_(User.name.ilike(f'%{search}%'), User.email.ilike(f'%{search}%')))
    if role: query = query.filter(User.role == role)
    total = query.count()
    rows = query.offset((page - 1) * 10).limit(10).all()
    return jsonify({'data': [{'id': u.id, 'name': u.name, 'email': u.email, 'role': u.role} for u in rows], 'total': total, 'pages': max(1, (total + 9) // 10), 'page': page})

@dashboard_bp.route('/subjects-list', methods=['GET'])
def subjects_list():
    from app.models.batch import Batch
    from app.models.course import Course
    page = int(request.args.get('page', 1))
    search = request.args.get('search', '').strip()
    faculty_id = request.args.get('faculty_id')
    semester_id = request.args.get('semester_id')
    batch_id = request.args.get('batch_id')
    course_id = request.args.get('course_id')

    query = db.session.query(
        Subject.id, Subject.name, Subject.code,
        Subject.faculty_id, Subject.semester_id,
        Semester.number.label('semester'),
        User.name.label('f_name')
    ).outerjoin(Faculty, Subject.faculty_id == Faculty.id)\
     .outerjoin(User, Faculty.user_id == User.id)\
     .outerjoin(Semester, Subject.semester_id == Semester.id)\
     .outerjoin(Batch, Semester.batch_id == Batch.id)\
     .outerjoin(Course, Batch.course_id == Course.id)
    
    if search: query = query.filter(db.or_(Subject.name.ilike(f'%{search}%'), Subject.code.ilike(f'%{search}%')))
    if faculty_id: query = query.filter(Subject.faculty_id == faculty_id)
    if semester_id: query = query.filter(Subject.semester_id == semester_id)
    if batch_id: query = query.filter(Semester.batch_id == batch_id)
    if course_id: query = query.filter(Batch.course_id == course_id)

    total = query.count()
    rows = query.offset((page - 1) * 10).limit(10).all()
    return jsonify({
        'data': [{
            'id': r.id,
            'name': r.name,
            'code': r.code,
            'faculty_id': r.faculty_id,
            'semester_id': r.semester_id,
            'semester': r.semester or "NA",
            'faculty_name': r.f_name or "NA"
        } for r in rows],
        'total': total,
        'pages': max(1, (total + 9) // 10),
        'page': page
    })
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
    course_id = request.args.get('course_id')
    query = db.session.query(Batch.id, Batch.name, Batch.start_year, Batch.end_year, Course.name.label('course_name'))\
        .join(Course, Batch.course_id == Course.id)
    
    def batch_search(q, s):
        res = q.filter(db.or_(Batch.name.ilike(f'%{s}%'), Course.name.ilike(f'%{s}%')))
        if course_id: res = res.filter(Batch.course_id == course_id)
        return res
    
    if course_id and not request.args.get('search'):
        query = query.filter(Batch.course_id == course_id)
        
    return paginate_query(query, lambda r: {
        'id': r.id, 'name': r.name, 'start_year': r.start_year, 'end_year': r.end_year, 'course': r.course_name
    }, batch_search)
