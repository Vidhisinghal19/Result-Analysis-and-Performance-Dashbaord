import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function StudentDashboard() {
    const [user, setUser] = useState(null);
    const [results] = useState([
        { id: 1, subject: "Computer Science 101", marks: 85, total: 100, grade: "A" },
        { id: 2, subject: "Data Structures", marks: 78, total: 100, grade: "B+" },
        { id: 3, subject: "Web Development", marks: 92, total: 100, grade: "A+" }
    ]);
    const [stats] = useState({ courses: 3, average: 85, rank: 12 });
    const navigate = useNavigate();

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (!userData || JSON.parse(userData).role !== "student") {
            navigate("/login");
        } else {
            setUser(JSON.parse(userData));
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
        navigate("/");
    };

    const getGradeColor = (grade) => {
        if (grade.includes("A")) return "#667eea";
        if (grade.includes("B")) return "#764ba2";
        if (grade.includes("C")) return "#f59e0b";
        return "#ef4444";
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div className="dashboard-header-left">
                    <div className="dashboard-logo">📊 Result Analysis</div>
                    <div className="dashboard-title">Student Dashboard</div>
                </div>
                <div className="dashboard-header-right">
                    {user && (
                        <div className="user-info">
                            <div className="user-avatar">👨‍🎓</div>
                            <div className="user-details">
                                <div className="user-name">{user.name}</div>
                                <div className="user-role">Student</div>
                            </div>
                        </div>
                    )}
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </div>

            <div className="dashboard-content">
                <div className="dashboard-grid">
                    <div className="card">
                        <div className="card-icon">📚</div>
                        <div className="card-title">Courses</div>
                        <div className="card-value">{stats.courses}</div>
                        <div className="card-description">Enrolled courses</div>
                    </div>

                    <div className="card">
                        <div className="card-icon">📈</div>
                        <div className="card-title">Average Score</div>
                        <div className="card-value">{stats.average}%</div>
                        <div className="card-description">Overall performance</div>
                    </div>

                    <div className="card">
                        <div className="card-icon">🏅</div>
                        <div className="card-title">Class Rank</div>
                        <div className="card-value">#{stats.rank}</div>
                        <div className="card-description">Among 150 students</div>
                    </div>
                </div>

                <div className="card">
                    <h2 style={{ marginBottom: "1.5rem" }}>📋 My Results</h2>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Marks</th>
                                <th>Total</th>
                                <th>Grade</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((result) => (
                                <tr key={result.id}>
                                    <td><strong>{result.subject}</strong></td>
                                    <td>{result.marks}</td>
                                    <td>{result.total}</td>
                                    <td>
                                        <span
                                            style={{
                                                color: getGradeColor(result.grade),
                                                fontWeight: "600",
                                                fontSize: "1.1rem"
                                            }}
                                        >
                                            {result.grade}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="badge badge-success">
                                            ✓ Published
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", marginTop: "2rem" }}>
                    <div className="card">
                        <h3 style={{ marginBottom: "1rem" }}>📊 Performance Analysis</h3>
                        <div style={{
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            color: "white",
                            padding: "1.5rem",
                            borderRadius: "5px",
                            textAlign: "center"
                        }}>
                            <div style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
                                {stats.average}%
                            </div>
                            <div>Excellent Performance</div>
                            <div style={{ fontSize: "0.9rem", marginTop: "0.5rem", opacity: 0.9 }}>
                                Keep up the great work!
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ marginBottom: "1rem" }}>🎯 Upcoming</h3>
                        <div style={{ marginBottom: "1rem" }}>
                            <div style={{ fontWeight: "600", marginBottom: "0.5rem" }}>📝 Mid-term Exam</div>
                            <div style={{ color: "#666", fontSize: "0.9rem" }}>Due: April 20, 2026</div>
                        </div>
                        <div>
                            <div style={{ fontWeight: "600", marginBottom: "0.5rem" }}>📝 Final Project</div>
                            <div style={{ color: "#666", fontSize: "0.9rem" }}>Due: May 10, 2026</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentDashboard;
