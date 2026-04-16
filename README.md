# 🎓 Result Analysis System

A **full-stack web application** for managing and analyzing student performance using **Flask, React, MySQL, and Docker**.

---

## 🚀 Features

### 👤 Admin

* Upload users via CSV (Admin / Faculty / Student)
* Manage system users
* Upload student data

### 👩‍🏫 Faculty

* Upload CIE-based marks (CSV)
* View subject-wise student performance
* Analyze class performance

### 🎓 Student

* Login and view results
* See subject-wise performance
* Dashboard with analytics

---

## 🧠 Tech Stack

* **Frontend:** React
* **Backend:** Flask (Python)
* **Database:** MySQL
* **ORM:** SQLAlchemy
* **Containerization:** Docker

---

## 📁 Project Structure

```
backend/        → Flask backend
frontend/       → React frontend
database/       → MySQL schema
```

---

## 🗄️ Database Design

### Tables:

* users (admin, faculty, student)
* students
* faculty
* subjects
* marks (CIE-based)

---

## 📊 Result Format (CSV)

```
enrollment_number,student_name,subject,cie_number,marks,max_marks,date
```

---

## 🐳 Running the Project

### Step 1: Build and Run

```
docker-compose up --build
```

---

### Step 2: Access Services

* Frontend → http://localhost:3000
* Backend → http://localhost:5001
* MySQL → Port 3307

---

## ⚙️ Current Status

✔ Docker setup complete
✔ Database schema created
✔ Flask connected to MySQL
✔ Models implemented

---

## 🚧 Upcoming Features

* CSV Upload API (Admin & Faculty)
* Authentication (JWT)
* Role-based dashboards
* Data analysis (class + student)
* Graph visualization

---

## 💡 Future Enhancements

* ML-based performance prediction
* Attendance integration
* Ranking system
* Export reports (PDF)

---

## 👨‍💻 Author

MCA Student Project – Result Analysis System

---
