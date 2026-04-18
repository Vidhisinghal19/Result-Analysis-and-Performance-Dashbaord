from app import db
from datetime import datetime

class Exam(db.Model):
    __tablename__ = "exams"

    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False) # e.g. "Quiz 1", "Mid-Term"
    type = db.Column(db.String(50), nullable=False) # e.g. "Quiz", "CIE", "Assignment"
    max_marks = db.Column(db.Float, nullable=False)
    exam_date = db.Column(db.Date, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    marks = db.relationship('Marks', backref='exam', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "subject_id": self.subject_id,
            "name": self.name,
            "type": self.type,
            "max_marks": self.max_marks,
            "exam_date": self.exam_date.isoformat() if self.exam_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
