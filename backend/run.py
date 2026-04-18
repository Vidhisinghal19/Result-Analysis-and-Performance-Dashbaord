import time
import sqlalchemy
from app import create_app, db
from app.models.user import User

app = create_app()

# Wait for MySQL to be ready before creating tables
max_retries = 10
for attempt in range(max_retries):
    try:
        with app.app_context():
            db.create_all()
            if not User.query.filter_by(role='admin').first():
                admin = User(name="Admin", email="admin@example.com", password="password", role="admin")
                db.session.add(admin)
                db.session.commit()
                print("Admin user created.")
        break
    except sqlalchemy.exc.OperationalError:
        print(f"Database not ready. Retrying ({attempt + 1}/{max_retries})...")
        time.sleep(3)
else:
    print("Could not connect to database after retries. Exiting.")
    exit(1)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)