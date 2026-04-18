from app import db

class Batch(db.Model):
    __tablename__ = "batches"

    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    start_year = db.Column(db.Integer, nullable=False)
    end_year = db.Column(db.Integer, nullable=False)

    # Relationships
    semesters = db.relationship('Semester', backref='batch', cascade='all, delete-orphan')
    students = db.relationship('Student', backref='batch', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            "id": self.id,
            "course_id": self.course_id,
            "name": self.name,
            "start_year": self.start_year,
            "end_year": self.end_year
        }
