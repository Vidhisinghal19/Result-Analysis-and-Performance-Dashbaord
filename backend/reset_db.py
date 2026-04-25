from app import create_app, db
from app.models.user import User
from app.models.course import Course
from app.models.batch import Batch
from app.models.semester import Semester
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.marks import Marks
from app.models.subject import Subject

app = create_app()

def reset_database():
    with app.app_context():
        print("Dropping all tables...")
        db.drop_all()
        print("Creating all tables...")
        db.create_all()
        
        # Add default admin
        print("Adding default admin...")
        admin = User(
            name="Admin", 
            email="admin@example.com", 
            role="admin"
        )
        admin.set_password("password")
        db.session.add(admin)
        db.session.commit()
        print("Database reset successfully!")

if __name__ == "__main__":
    reset_database()
