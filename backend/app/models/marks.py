from app import db
from sqlalchemy import UniqueConstraint

class Marks(db.Model):
    __tablename__ = "marks"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=False)
    cie_number = db.Column(db.Enum('CIE1','CIE2','CIE3'))
    marks_obtained = db.Column(db.Float, nullable=False)
    max_marks = db.Column(db.Float, nullable=False)
    exam_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    __table_args__ = (
        UniqueConstraint('student_id', 'subject_id', 'cie_number', name='_student_subject_cie_uc'),
    )