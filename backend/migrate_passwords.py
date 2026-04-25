import csv
import os
from app import create_app, db
from app.models.user import User

def migrate_passwords():
    app = create_app()
    with app.app_context():
        users = User.query.all()
        if not users:
            print("No users found to migrate.")
            return

        # Prepare to save original credentials
        # We'll save them in backend/instance/original_credentials.csv for safety
        backup_path = os.path.join(app.instance_path, 'original_credentials.csv')
        os.makedirs(app.instance_path, exist_ok=True)

        print(f"Migrating {len(users)} users...")
        
        credentials_to_save = []
        migrated_count = 0

        for user in users:
            # Check if password is already hashed (Werkzeug hashes start with pbkdf2:sha256: or similar)
            if not user.password.startswith(('pbkdf2:', 'scrypt:', 'argon2:')):
                # Save plain text password before hashing
                credentials_to_save.append({
                    'id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'role': user.role,
                    'original_password': user.password
                })
                
                # Hash the password
                user.set_password(user.password)
                migrated_count += 1
            else:
                print(f"Skipping {user.email}, already hashed.")

        if credentials_to_save:
            with open(backup_path, 'w', newline='') as csvfile:
                fieldnames = ['id', 'name', 'email', 'role', 'original_password']
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                for row in credentials_to_save:
                    writer.writerow(row)
            
            db.session.commit()
            print(f"Successfully migrated {migrated_count} users.")
            print(f"Original credentials saved to: {backup_path}")
        else:
            print("No passwords needed migration.")

if __name__ == "__main__":
    migrate_passwords()
