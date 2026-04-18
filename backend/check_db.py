from app import create_app, db
from app.models.user import User
from app.models.faculty import Faculty
from app.models.subject import Subject

app = create_app()
with app.app_context():
    print("--- USERS ---")
    users = User.query.all()
    for u in users:
        print(f"ID: {u.id}, Name: {u.name}, Email: {u.email}, Role: {u.role}")
    
    print("\n--- FACULTY ---")
    faculty = Faculty.query.all()
    for f in faculty:
        print(f"ID: {f.id}, UserID: {f.user_id}, Dept: {f.department}")
    
    print("\n--- SUBJECTS ---")
    subjects = Subject.query.all()
    for s in subjects:
        print(f"ID: {s.id}, Name: {s.name}, Code: {s.code}, FacultyID: {s.faculty_id}")
