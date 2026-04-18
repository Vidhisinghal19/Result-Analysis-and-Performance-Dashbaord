from app import db

class Semester(db.Model):
    __tablename__ = "semesters"

    id = db.Column(db.Integer, primary_key=True)
    batch_id = db.Column(db.Integer, db.ForeignKey('batches.id'), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    number = db.Column(db.Integer, nullable=False)

    # Relationships
    subjects = db.relationship('Subject', backref='semester', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            "id": self.id,
            "batch_id": self.batch_id,
            "name": self.name,
            "number": self.number
        }
