import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function FacultyDashboard() {
    const [user, setUser] = useState(null);
    const [classes] = useState([
        { id: 1, name: "Computer Science 101", students: 45 },
        { id: 2, name: "Data Structures", students: 38 },
        { id: 3, name: "Web Development", students: 52 }
    ]);
    const [stats] = useState({ classes: 3, students: 135, graded: 89 });
    const navigate = useNavigate();

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (!userData || JSON.parse(userData).role !== "faculty") {
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

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div className="dashboard-header-left">
                    <div className="dashboard-logo">📊 Result Analysis</div>
                    <div className="dashboard-title">Faculty Dashboard</div>
                </div>
                <div className="dashboard-header-right">
                    {user && (
                        <div className="user-info">
                            <div className="user-avatar">👨‍🏫</div>
                            <div className="user-details">
                                <div className="user-name">{user.name}</div>
                                <div className="user-role">Faculty Member</div>
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
                        <div className="card-title">My Classes</div>
                        <div className="card-value">{stats.classes}</div>
                        <div className="card-description">Classes assigned</div>
                    </div>

                    <div className="card">
                        <div className="card-icon">👥</div>
                        <div className="card-title">Total Students</div>
                        <div className="card-value">{stats.students}</div>
                        <div className="card-description">Across all classes</div>
                    </div>

                    <div className="card">
                        <div className="card-icon">✅</div>
                        <div className="card-title">Grades Submitted</div>
                        <div className="card-value">{stats.graded}</div>
                        <div className="card-description">Students with marks</div>
                    </div>
                </div>

                <div className="card">
                    <h2 style={{ marginBottom: "1.5rem" }}>📖 My Classes</h2>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Class Name</th>
                                <th>Students</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classes.map((cls) => (
                                <tr key={cls.id}>
                                    <td><strong>{cls.name}</strong></td>
                                    <td>{cls.students}</td>
                                    <td>
                                        <button className="card-link" style={{ color: "#667eea", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                                            View →
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="card" style={{ marginTop: "2rem" }}>
                    <h2 style={{ marginBottom: "1rem" }}>🎯 Quick Actions</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                        <button style={{
                            padding: "1rem",
                            background: "#667eea",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontWeight: "600"
                        }}>
                            📝 Enter Grades
                        </button>
                        <button style={{
                            padding: "1rem",
                            background: "#764ba2",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontWeight: "600"
                        }}>
                            📊 View Reports
                        </button>
                        <button style={{
                            padding: "1rem",
                            background: "#667eea",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontWeight: "600"
                        }}>
                            ✉️ Send Message
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FacultyDashboard;
