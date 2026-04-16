from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import Config

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]}})
    db.init_app(app)

    from app.routes.admin_routes import admin_bp
    from app.routes.dashboard_routes import dashboard_bp
    from app.routes.auth_routes import auth_bp
    from app.routes.marks_routes import marks_bp

    app.register_blueprint(admin_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(marks_bp)

    return app