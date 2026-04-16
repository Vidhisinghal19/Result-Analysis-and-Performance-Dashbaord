<div align="center">
  <h1>🎓 Result Analysis System</h1>
  <p><strong>A Full-Stack Web Application for Managing and Analyzing Student Performance</strong></p>

  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
  ![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
  ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
</div>

---

## 🚀 Overview

The **Result Analysis System** is tailored to streamline the tracking and analysis of student marks and metrics. Designed with distinct portals for Admins, Faculty, and Students, this system completely digitizes performance management using modern full-stack web technologies.

## ✨ Features

### 👤 Admin capabilities
* **Bulk Uploads:** Easily ingest users via CSV (Admin / Faculty / Student accounts).
* **System Management:** Modify, disable, or alter system user credentials and privileges.
* **Master Records:** Upload core student curricular data for tracking.

### 👩‍🏫 Faculty tools
* **CIE Uploads:** Batch upload Continuous Internal Evaluation (CIE) marks via CSV.
* **Subject Analysis:** View metrics and aggregated subject-wise performance.
* **Class Insights:** Broadly analyze class performance visually and statistically.

### 🎓 Student portal
* **Secure Access:** Securely login and review personal results.
* **Performance Dashboard:** View clean, responsive analytics regarding performance per subject.
* **Interactive Charts:** Review progress dynamically over the course of the semester.

---

## 🧠 Technology Stack

* **Frontend:** React.js, Recharts, Axios, React Router v7
* **Backend:** Flask (Python), Flask-SQLAlchemy, Flask-CORS
* **Database:** MySQL v8 (Relational Database)
* **DevOps/Containerization:** Docker & Docker Compose

---

## 📁 Repository Structure

```text
.
├── backend/            # Flask REST API, routing, models, and uploads module
├── database/           # MySQL init schema and seed scripts
├── frontend/           # React frontend built with Create React App
├── docker-compose.yml  # Multi-container orchestration 
└── README.md           # Documentation
```

---

## 🐳 Quick Start (Using Docker)

The easiest way to run the full application locally is via Docker Compose. Ensure you have Docker Desktop running.

```bash
# 1. Clone the repository
git clone https://github.com/Vidhisinghal19/Result-Analysis-and-Performance-Dashbaord.git
cd Result-Analysis-and-Performance-Dashbaord

# 2. Build and launch all services
docker-compose up --build
```

**Service Endpoints:**
* 🎨 **Frontend UI:** [http://localhost:3000](http://localhost:3000)
* ⚙️ **Backend API:** [http://localhost:5001](http://localhost:5001)
* 🗄️ **MySQL Database:** Connected internally via Port `3306` (Exposed to host on `3307`)

---

## 💻 Local Development Setup (Without Docker)

### Frontend
```bash
cd frontend
npm install
npm start
```

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py
```
*(Note: Requires a local MySQL server matching the credentials found in `backend/config.py`)*

---

## 📊 Result Format (CSV Standard)

System-wide ingestion of CSV data for Continuous Internal Evaluations uses the following uniform standard format:
```csv
enrollment_number,student_name,subject,cie_number,marks,max_marks,date
```

---

## ⚙️ Recent Updates & Status

- **Refactoring & Cleanup:** ✅ Pruned boilerplate UI files (`setupTests.js`, `App.css`, `logo.svg`), cleared duplicate module directories, removed unused python packages (`pandas`, `cryptography`), and eliminated stale `.pyc` caches for a streamlined codebase.
- **Git Tracking Fixed:** ✅ Fully migrated the React application to a monorepo structure, ensuring smooth cloning and unified progress tracking.
- **Docker Ready:** ✔ Completed database schemas and container bridging.

## 🚧 Upcoming Features

* Authentication middleware (JWT implementation).
* Expanding granular Role-based Dashboard components.
* ML-based performance prediction.
* Automated report generation in PDF format.
* Dynamic Attendance integration logic.

---

<div align="center">
  <b>Developed by Vidhi Singhal</b><br/>
  <i>MCA Student Project – Result Analysis System</i>
</div>
