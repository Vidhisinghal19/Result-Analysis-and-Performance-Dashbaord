from app import create_app, db
from app.models.user import User
from app.models.student import Student

app = create_app()
with app.app_context():
    users = User.query.filter_by(role='student').all()
    print("Students Users:")
    for u in users:
        s = Student.query.filter_by(user_id=u.id).first()
        print(f"ID: {u.id}, Name: {u.name}, Student Record: {'Yes' if s else 'No'}, Batch ID: {s.batch_id if s else 'N/A'}")
