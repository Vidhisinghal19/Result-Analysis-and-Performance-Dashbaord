from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from app.models.student import Student
from app.models.faculty import Faculty

auth_bp = Blueprint('auth', __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        if not data: return jsonify({"error": "No data"}), 400

        if User.query.filter_by(email=data.get("email")).first():
            return jsonify({"error": "Email already registered"}), 400

        role = data.get("role", "student")
        if role == "student" and not data.get("enrollment_number"):
            return jsonify({"error": "Enrollment number is required"}), 400

        user = User(name=data.get("name"), email=data.get("email"), password=data.get("password"), role=role)
        db.session.add(user)
        db.session.flush()

        if role == "student":
            db.session.add(Student(user_id=user.id, enrollment_number=data.get("enrollment_number"), course=data.get("course"), semester=data.get("semester")))
        elif role == "faculty":
            db.session.add(Faculty(user_id=user.id, department=data.get("department")))

        db.session.commit()
        return jsonify({"message": "User registered", "id": user.id, "name": user.name, "email": user.email, "role": user.role}), 201
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Registration failed"}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        email, password = data.get("email"), data.get("password")
        if not email or not password: return jsonify({"error": "Credentials required"}), 400

        user = User.query.filter_by(email=email).first()
        if not user or user.password != password:
            return jsonify({"error": "Invalid credentials"}), 401

        return jsonify({"message": "Login success", "id": user.id, "name": user.name, "email": user.email, "role": user.role}), 200
    except Exception:
        return jsonify({"error": "Internal error"}), 500

@auth_bp.route("/api/admin/profile", methods=["PUT", "OPTIONS"])
def update_profile():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data received"}), 400

        user_id = data.get("id")
        if not user_id:
            return jsonify({"error": "User ID required"}), 400

        user = User.query.filter_by(id=int(user_id)).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        if user.role != "admin":
            return jsonify({"error": "Not an admin user"}), 403

        new_name = data.get("name", "").strip()
        new_email = data.get("email", "").strip()
        new_password = data.get("new_password", "").strip()
        current_password = data.get("current_password", "").strip()

        if not new_name or not new_email:
            return jsonify({"error": "Name and email are required"}), 400

        existing = User.query.filter(User.email == new_email, User.id != user.id).first()
        if existing:
            return jsonify({"error": "Email already in use by another account"}), 400

        if new_password:
            if not current_password:
                return jsonify({"error": "Current password is required to set a new password"}), 400
            if user.password != current_password:
                return jsonify({"error": "Current password is incorrect"}), 401
            if len(new_password) < 6:
                return jsonify({"error": "New password must be at least 6 characters"}), 400
            user.password = new_password

        user.name = new_name
        user.email = new_email
        db.session.commit()

        return jsonify({
            "message": "Profile updated successfully",
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"PROFILE UPDATE ERROR: {e}")
        return jsonify({"error": f"Update failed: {str(e)}"}), 500
