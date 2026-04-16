from app import db

class Subject(db.Model):
    __tablename__ = "subjects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(50))
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculty.id'))
    semester = db.Column(db.Integer)