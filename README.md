# 🎓 Result Analysis & Performance Dashboard

A **Premium Full-Stack Intelligent Result Analysis System** designed for educational institutions to track, analyze, and mentor student performance using data-driven insights. Built with a modern tech stack and a sophisticated **Glassmorphism Design System**.

---

## 🚀 Project Overview
This project is an institutional command center that bridges the gap between administrators, faculty members, and students. By automating data digestion via bulk CSV imports and displaying performance metrics through beautiful, interactive Recharts visualizations, it allows faculty to provide active mentorship and students to track their academic trajectory transparently.

---

## 🔑 Key Features by User Role

### 🏢 Admin Command Center
*   **System Analytics Suite**: Real-time graphs for student role distribution, course enrollment, and faculty engagement.
*   **Smart Data Repositories**: Fluid card-row tables with full search, sorting, and filtering capabilities.
*   **Bulk CSV Orchestration**: High-throughput file upload system for registering students, faculty, and entire course catalogues.
*   **Advanced Filtering Engine**: Precise server-side query filters (filter students by batch/course, faculty by department, subjects by semester).

### 🧠 Faculty Intelligent Workspace
*   **Performance Monitoring Loop**: Personal portal showcasing teaching portfolios and enrollment lists.
*   **Smart Grade Management**: Interface to create assessments and upload student marks in bulk via CSV.
*   **Mentorship & Feedback**: Qualitative remarks and rating system to provide performance-improving notes to students.
*   **Analytical Panels**: Automatic calculation of top performers, student intervention alerts, pass/fail ratios, and progression curves.

### 📉 Student Performance Portal
*   **360° Academic Transparency**: Clear visibility into grades, ratings, and assessment logs.
*   **Interactive Trajectories**: Visual progression line charts showing student growth from internal assessments (CIEs) to final exams.
*   **Mentorship Feedback**: Real-time notification of faculty remarks and academic guidance.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | `React 19` • `React Router 7` • `Recharts` • `Axios` • `Vanilla CSS` |
| **Backend** | `Flask (Python 3.10)` • `Flask-SQLAlchemy` (ORM) • `Flask-Bcrypt` • `Flask-CORS` |
| **Database** | `MySQL 8.0` with Optimized Relational Schema |
| **DevOps** | `Docker` • `Docker Compose` |
| **Design** | **Glassmorphism UI** (harmonious dark/light modes, premium micro-animations) |

---

## 📂 Project Structure

```bash
📦 result-analysis-system
 ┣ 📂 backend
 ┃ ┣ 📂 app
 ┃ ┃ ┣ 📂 models           # SQLAlchemy Relational Models (MySQL Schema)
 ┃ ┃ ┃ ┣ 📜 batch.py
 ┃ ┃ ┃ ┣ 📜 course.py
 ┃ ┃ ┃ ┣ 📜 exam.py
 ┃ ┃ ┃ ┣ 📜 faculty.py
 ┃ ┃ ┃ ┣ 📜 marks.py
 ┃ ┃ ┃ ┣ 📜 mentorship.py
 ┃ ┃ ┃ ┣ 📜 semester.py
 ┃ ┃ ┃ ┣ 📜 student.py
 ┃ ┃ ┃ ┣ 📜 subject.py
 ┃ ┃ ┃ ┗ 📜 user.py         # Unified User Model with Bcrypt password hashing
 ┃ ┃ ┣ 📂 routes           # Flask Blueprints (REST API Endpoints)
 ┃ ┃ ┃ ┣ 📜 admin_routes.py # Bulk CSV imports, user management, and DB seeding
 ┃ ┃ ┃ ┣ 📜 auth_routes.py  # User authentication, registration, profile updates
 ┃ ┃ ┃ ┣ 📜 dashboard_routes.py # Analytical aggregate queries for charts
 ┃ ┃ ┃ ┣ 📜 faculty_routes.py # Course records, assessments, and mentorship inputs
 ┃ ┃ ┃ ┣ 📜 marks_routes.py # Subject marks lookup and bulk exam marks entry
 ┃ ┃ ┃ ┗ 📜 student_routes.py # Student performance history and feedback views
 ┃ ┃ ┣ 📂 uploads          # Temporary storage for bulk CSV uploads
 ┃ ┃ ┗ 📜 __init__.py      # App factory, CORS setup, Blueprint registration
 ┃ ┣ 📜 config.py          # Environment configuration (DB connection details)
 ┃ ┣ 📜 Dockerfile         # Python environment containerization
 ┃ ┣ 📜 requirements.txt   # Python package dependencies
 ┃ ┗ 📜 run.py             # Main entry point; handles DB auto-creation & admin seed
 ┣ 📂 database
 ┃ ┗ 📜 init.sql           # Schema definition (foreign keys, unique constraints, indices)
 ┣ 📂 frontend
 ┃ ┣ 📂 public             # Static assets & HTML template
 ┃ ┣ 📂 src
 ┃ ┃ ┣ 📂 pages            # Core Dashboard components
 ┃ ┃ ┃ ┣ 📜 AdminDashboard.js
 ┃ ┃ ┃ ┣ 📜 FacultyDashboard.js
 ┃ ┃ ┃ ┣ 📜 StudentDashboard.js
 ┃ ┃ ┃ ┣ 📜 Home.js        # Landing page
 ┃ ┃ ┃ ┣ 📜 Login.js       # Auth interfaces
 ┃ ┃ ┃ ┣ 📜 Register.js
 ┃ ┃ ┃ ┗ 📜 *.css          # Custom Vanilla CSS styling (Glassmorphism layout)
 ┃ ┃ ┣ 📜 App.js           # React Router 7 setup & role-based protected routes
 ┃ ┃ ┣ 📜 index.js         # DOM mounting
 ┃ ┃ ┗ 📜 index.css        # Global CSS rules
 ┃ ┣ 📜 Dockerfile         # Node.js environment containerization
 ┃ ┗ 📜 package.json       # Frontend project metadata and dependencies
 ┗ 📜 docker-compose.yml   # Multi-container orchestrator (backend, frontend, db)
```

---

## 🛡️ Security & Relational Data Integrity

*   **Cryptographic Password Security**: Uses `Flask-Bcrypt` to ensure all passwords are salted and hashed using the Blowfish cipher before database storage.
*   **Role-Based Access Control (RBAC)**: All route components on the frontend are wrapped in role-guarded wrappers (`ProtectedRoute`), while backend endpoints validate access tokens and request fields to enforce role isolation.
*   **Strict Relational Schema**: Enforces transactional consistency in MySQL using `ON DELETE CASCADE` / `ON DELETE SET NULL` constraints.
*   **Duplication Prevention**: Enforces database-level `UniqueConstraints` on student profiles, assessments, and grades to prevent double-entry and preserve historical integrity.
*   **Security Best Practices**: Configured with controlled CORS mappings mapping explicit verbs and exposed headers.

---

## 🔌 API Architecture (Key Endpoints)

| Route | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/login` | `POST` | Public | Authenticate users and return session info |
| `/register` | `POST` | Public | Register new students/faculty |
| `/api/admin/profile` | `PUT` | Admin | Update current user credentials |
| `/upload/users` | `POST` | Admin | Bulk upload CSV file of users |
| `/upload/subjects` | `POST` | Admin | Bulk upload CSV file of subjects |
| `/api/admin/batches` | `GET` | Admin | Fetch academic batches list |
| `/api/faculty/assessments` | `POST` | Faculty | Create new exams/assessments |
| `/api/faculty/marks` | `POST` | Faculty | Upload CSV grades for assessments |
| `/api/student/performance` | `GET` | Student | Retrieve overall marks progression & feedback |

---

## 🚀 Quick Start Guide (Docker Development)

Ensure you have [Docker Desktop](https://www.docker.com/products/docker-desktop) installed.

### 1. Launch the Stack
Run the following command in the project root:
```bash
docker-compose up --build
```
This automatically compiles the frontend node environment, builds the python backend, sets up the MySQL 8 database service, runs database migrations, and seeds a default administrator.

### 2. Port Allocation
Once running, you can access the application components:
*   **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
*   **Backend REST API**: [http://localhost:5001](http://localhost:5001)
*   **MySQL Server (Host Port)**: `localhost:3307` (Credentials: `root` / `root`)

### 3. Default Credentials
Use these to log into the Admin Command Center:
*   **Email**: `admin@example.com`
*   **Password**: `password`

---

## 👨‍💻 Project Development
**Author**: Vidhisinghal19  
**Status**: Stable / Modernized UI  
**Focus**: Academic Result Orchestration & Mentorship Tracking

---

## 📄 License
Institutional performance management system. All rights reserved.
