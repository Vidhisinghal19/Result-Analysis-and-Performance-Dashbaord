from app import db

class Student(db.Model):
    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    batch_id = db.Column(db.Integer, db.ForeignKey('batches.id'), nullable=True)
    current_semester_id = db.Column(db.Integer, db.ForeignKey('semesters.id'))
    enrollment_number = db.Column(db.String(50), unique=True, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "batch_id": self.batch_id,
            "current_semester_id": self.current_semester_id,
            "enrollment_number": self.enrollment_number,
            "name": self.user.name if self.user else None,
            "email": self.user.email if self.user else None
        }