from app import db

class Mentorship(db.Model):
    __tablename__ = "mentorship"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=False)
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculty.id'), nullable=False)
    
    performance_rating = db.Column(db.String(50), nullable=True) # e.g. "Excellent", "Improving", "Needs Support"
    remarks = db.Column(db.String(255), nullable=True)
    feedback = db.Column(db.Text, nullable=True)
    
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "subject_id": self.subject_id,
            "performance_rating": self.performance_rating or "",
            "remarks": self.remarks or "",
            "feedback": self.feedback or ""
        }
