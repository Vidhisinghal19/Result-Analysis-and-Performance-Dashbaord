from app import db

class Faculty(db.Model):
    __tablename__ = "faculty"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    department = db.Column(db.String(100))

    # Relationships
    subjects = db.relationship('Subject', backref='faculty', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "department": self.department,
            "name": self.user.name if self.user else None,
            "email": self.user.email if self.user else None
        }