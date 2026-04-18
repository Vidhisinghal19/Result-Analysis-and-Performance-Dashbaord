from app import db

class Subject(db.Model):
    __tablename__ = "subjects"

    id = db.Column(db.Integer, primary_key=True)
    semester_id = db.Column(db.Integer, db.ForeignKey('semesters.id', ondelete='CASCADE'), nullable=False)
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculty.id', ondelete='SET NULL'))
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(50), nullable=False)
    type = db.Column(db.Enum('core', 'elective'), default='core')
    credits = db.Column(db.Integer, default=0)

    __table_args__ = (db.UniqueConstraint('semester_id', 'code', name='_semester_code_uc'),)

    # Relationships
    marks = db.relationship('Marks', backref='subject', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            "id": self.id,
            "semester_id": self.semester_id,
            "faculty_id": self.faculty_id,
            "name": self.name,
            "code": self.code,
            "type": self.type,
            "credits": self.credits
        }