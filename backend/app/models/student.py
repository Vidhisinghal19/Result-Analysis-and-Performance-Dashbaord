from app import db

class Student(db.Model):
    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True)
    enrollment_number = db.Column(db.String(50), unique=True, nullable=False)
    course = db.Column(db.String(100))
    semester = db.Column(db.Integer)