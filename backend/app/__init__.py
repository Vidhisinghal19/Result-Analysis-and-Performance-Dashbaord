from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import Config

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Configure CORS with wildcard and explicit settings
    CORS(app, 
        resources={r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            "allow_headers": ["Content-Type", "Authorization", "Accept"],
            "expose_headers": ["Content-Type", "Authorization"],
            "max_age": 3600,
            "send_wildcard": True,
            "automatic_options": True,
            "vary_header": True
        }}
    )
    
    # Add after_request handler to ensure CORS headers are always set
    @app.after_request
    def after_request(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept'
        response.headers['Access-Control-Max-Age'] = '3600'
        return response
    
    db.init_app(app)

    from app.routes.admin_routes import admin_bp
    from app.routes.dashboard_routes import dashboard_bp
    from app.routes.auth_routes import auth_bp
    from app.routes.marks_routes import marks_bp
    from app.routes.faculty_routes import faculty_bp
    from app.routes.student_routes import student_bp

    app.register_blueprint(admin_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(marks_bp)
    app.register_blueprint(faculty_bp)
    app.register_blueprint(student_bp)

    return app