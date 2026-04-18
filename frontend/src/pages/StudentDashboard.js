import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from "recharts";
import "./Dashboard.css";

const API_BASE = "http://localhost:5001";

function StudentDashboard() {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        total_subjects: 0,
        overall_percentage: 0,
        rank: 0,
        total_students_in_batch: 0,
        grade: 'N/A'
    });
    const [results, setResults] = useState([]);
    const [hierarchy, setHierarchy] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [subjectPerformance, setSubjectPerformance] = useState({ marks: [], mentorship: {} });
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // UI State
    const [activeTab, setActiveTab] = useState("overview"); // overview, analysis
    const [expandedPaths, setExpandedPaths] = useState([]);
    
    const navigate = useNavigate();

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (!userData) {
            navigate("/login");
            return;
        }
        
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== "student") {
            navigate("/login");
            return;
        }
        
        setUser(parsedUser);
        fetchDashboardData(parsedUser.id);
        fetchHierarchy(parsedUser.id);
    }, [navigate]);

    const fetchDashboardData = async (userId) => {
        setLoading(true);
        try {
            const [overviewRes, resultsRes] = await Promise.all([
                fetch(`${API_BASE}/api/student/dashboard-overview/${userId}`),
                fetch(`${API_BASE}/api/student/results/${userId}`)
            ]);

            if (!overviewRes.ok || !resultsRes.ok) throw new Error("Failed to fetch dashboard data");

            const overviewData = await overviewRes.json();
            const resultsData = await resultsRes.json();

            setStats(overviewData);
            setResults(resultsData);
        } catch (err) {
            console.error(err);
            setError("Error loading dashboard data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const fetchHierarchy = async (userId) => {
        try {
            const res = await fetch(`${API_BASE}/api/student/hierarchy/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setHierarchy(data);
                // Expand the first semester by default
                if (data.semesters?.length > 0) {
                    setExpandedPaths([`sem-${data.semesters[0].id}`]);
                }
            }
        } catch (err) { console.error("Hierarchy fetch error:", err); }
    };

    const fetchSubjectDetails = async (subjectId) => {
        if (!user) return;
        setDetailsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/student/subject-performance/${user.id}/${subjectId}`);
            if (res.ok) {
                const data = await res.json();
                setSubjectPerformance(data);
                setActiveTab("analysis");
            }
        } catch (err) { console.error("Subject details fetch error:", err); }
        finally { setDetailsLoading(false); }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/");
    };

    const togglePath = (path) => {
        setExpandedPaths(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
    };

    const handleSelectSubject = (sub) => {
        setSelectedSubject(sub);
        fetchSubjectDetails(sub.id);
    };

    const getGradeColor = (grade) => {
        if (grade.includes("A")) return "#10b981";
        if (grade.includes("B")) return "#3b82f6";
        if (grade.includes("C")) return "#f59e0b";
        return "#ef4444";
    };

    const chartData = useMemo(() => {
        return (subjectPerformance.marks || []).map(p => ({
            name: p.exam_name,
            obtained: p.obtained,
            max: p.max_marks,
            percentage: ((p.obtained / p.max_marks) * 100).toFixed(1)
        }));
    }, [subjectPerformance]);

    if (loading) {
        return (
            <div className="premium-dashboard" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div className="loader">Synchronizing your academic records...</div>
            </div>
        );
    }

    return (
        <div className="premium-dashboard">
            {/* SIDEBAR */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <span className="logo-icon">📊</span>
                    <h2>STUDENT HUB</h2>
                </div>
                
                <nav className="sidebar-nav">
                    <button className={activeTab === "overview" ? "active" : ""} onClick={() => { setActiveTab("overview"); setSelectedSubject(null); }}>
                        <span className="nav-icon">🏠</span> Overview
                    </button>

                    {hierarchy && (
                        <div className="hierarchy-container">
                            <div className="nav-group-separator">MY ACADEMICS</div>
                            <div className="hierarchy-node">
                                <button className="hierarchy-parent expanded" style={{ cursor: 'default' }}>
                                    🏢 {hierarchy.course}
                                </button>
                                <div className="hierarchy-node batch">
                                    <button className="hierarchy-parent expanded" style={{ cursor: 'default' }}>
                                        📅 {hierarchy.batch}
                                    </button>
                                    {hierarchy.semesters.map(sem => (
                                        <div key={sem.id} className="hierarchy-node semester">
                                            <button className={`hierarchy-parent ${expandedPaths.includes(`sem-${sem.id}`) ? 'expanded' : ''}`} onClick={() => togglePath(`sem-${sem.id}`)}>
                                                🎓 {sem.name} <span className="node-chevron">{expandedPaths.includes(`sem-${sem.id}`) ? '▼' : '▶'}</span>
                                            </button>
                                            {expandedPaths.includes(`sem-${sem.id}`) && (
                                                <div className="hierarchy-leafs">
                                                    {sem.subjects.map(sub => (
                                                        <button 
                                                            key={sub.id} 
                                                            className={`hierarchy-leaf ${selectedSubject?.id === sub.id ? 'active' : ''}`}
                                                            onClick={() => handleSelectSubject(sub)}
                                                        >
                                                            📚 {sub.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="nav-group-separator" style={{ marginTop: 'auto' }}>ACCOUNT</div>
                    <button className="btn-logout" onClick={handleLogout}>Logout</button>
                </nav>
            </aside>

            {/* MAIN CONTENT */}
            <main className="main-content">
                <header className="main-header">
                    <div className="header-info">
                        <h1>{selectedSubject ? selectedSubject.name : "Academic Command Center"}</h1>
                        <p>{selectedSubject ? `${selectedSubject.code} | Performance Analysis` : `Welcome back, ${user?.name}!`}</p>
                    </div>
                    <div className="header-profile">
                        <div className="profile-info">
                            <span className="name">{user?.name}</span>
                            <span className="role">{stats.enrollment_number}</span>
                        </div>
                        <div className="profile-avatar">
                            {user?.name?.charAt(0) || "S"}
                        </div>
                    </div>
                </header>

                {error && <div className="profile-message error">{error}</div>}

                {activeTab === "overview" ? (
                    <div style={{ animation: "slideUp 0.4s ease" }}>
                        <div className="stats-section">
                            <div className="glass-card stat-card-p">
                                <div className="stat-p-header">
                                    <span className="stat-p-label">Total Subjects</span>
                                    <span className="stat-p-icon">📚</span>
                                </div>
                                <div className="stat-p-value">{stats.total_subjects}</div>
                            </div>
                            <div className="glass-card stat-card-p">
                                <div className="stat-p-header">
                                    <span className="stat-p-label">Overall Score</span>
                                    <span className="stat-p-icon">📈</span>
                                </div>
                                <div className="stat-p-value">{stats.overall_percentage}%</div>
                            </div>
                            <div className="glass-card stat-card-p">
                                <div className="stat-p-header">
                                    <span className="stat-p-label">Class Rank</span>
                                    <span className="stat-p-icon">🏅</span>
                                </div>
                                <div className="stat-p-value">#{stats.rank}</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.4rem' }}>Out of {stats.total_students_in_batch}</div>
                            </div>
                            <div className="glass-card stat-card-p">
                                <div className="stat-p-header">
                                    <span className="stat-p-label">Grade</span>
                                    <span className="stat-p-icon">⭐</span>
                                </div>
                                <div className="stat-p-value" style={{ color: getGradeColor(stats.grade) }}>{stats.grade}</div>
                            </div>
                        </div>

                        <div className="glass-card" style={{ marginTop: '2rem' }}>
                            <div className="table-header-p">
                                <h3>📋 Recent Performance</h3>
                            </div>
                            <div className="p-table-wrapper">
                                <table className="p-table">
                                    <thead>
                                        <tr>
                                            <th>Subject</th>
                                            <th>Code</th>
                                            <th>Marks</th>
                                            <th>Total</th>
                                            <th>Percentage</th>
                                            <th>Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((res, idx) => (
                                            <tr key={idx} onClick={() => handleSelectSubject({ id: res.id, name: res.subject, code: res.code })} style={{ cursor: 'pointer' }}>
                                                <td><strong>{res.subject}</strong></td>
                                                <td>{res.code}</td>
                                                <td>{res.marks}</td>
                                                <td>{res.total}</td>
                                                <td>{res.percentage}%</td>
                                                <td>
                                                    <span className="badge-p" style={{ 
                                                        background: `${getGradeColor(res.grade)}20`,
                                                        color: getGradeColor(res.grade)
                                                    }}>
                                                        {res.grade}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ animation: "slideUp 0.4s ease" }}>
                        {detailsLoading ? (
                            <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>Crunching assessment data...</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                                    <div className="glass-card" style={{ height: '400px', padding: '2rem' }}>
                                        <h3>📊 Assessment Trajectory</h3>
                                        <ResponsiveContainer width="100%" height="90%">
                                            <AreaChart data={chartData}>
                                                <defs>
                                                    <linearGradient id="colorO" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                                <YAxis axisLine={false} tickLine={false} unit="%" />
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                                <Area type="monotone" dataKey="percentage" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorO)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="glass-card" style={{ padding: '2rem' }}>
                                        <h3>🎯 Milestone Summary</h3>
                                        <div className="p-table-wrapper" style={{ marginTop: '1rem' }}>
                                            <table className="p-table">
                                                <thead>
                                                    <tr>
                                                        <th>Exams</th>
                                                        <th>Obtained</th>
                                                        <th>Grade</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {chartData.map((d, i) => (
                                                        <tr key={i}>
                                                            <td style={{ fontWeight: 600 }}>{d.name}</td>
                                                            <td>{d.obtained}/{d.max}</td>
                                                            <td>
                                                                <span style={{ 
                                                                    color: getGradeColor(stats.grade), // Should probably calculate per-exam grade but using overall for now
                                                                    fontWeight: 800
                                                                }}>
                                                                    {parseInt(d.percentage) >= 40 ? "PASS" : "FAIL"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {chartData.length === 0 && (
                                                        <tr><td colSpan="3" style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>No milestones recorded.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-card" style={{ padding: '2.5rem', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: 'white', display: 'grid', gridTemplateColumns: subjectPerformance.mentorship?.rating ? '1fr 1fr' : '1fr', gap: '2rem' }}>
                                    <div>
                                        <h2 style={{ marginBottom: '1rem' }}>Subject Mastery: {selectedSubject?.percentage || stats.overall_percentage}%</h2>
                                        <p style={{ opacity: 0.9 }}>
                                            You are currently showing {stats.overall_percentage > 75 ? "exceptional" : "consistent"} performance in {selectedSubject?.name}. 
                                            {chartData.length > 1 && parseFloat(chartData[chartData.length-1].percentage) > parseFloat(chartData[0].percentage) 
                                                ? " Your learning curve is trending upwards. Keep it up!" 
                                                : " Reviewing earlier CIE concepts might help stabilize your future scores."}
                                        </p>
                                    </div>

                                    {subjectPerformance.mentorship?.rating && (
                                        <div className="glass-card" style={{ background: 'rgba(255,255,255,0.15)', border: 'none', padding: '1.5rem' }}>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Faculty Feedback</div>
                                            <h4 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>⭐ {subjectPerformance.mentorship.rating}</h4>
                                            <p style={{ margin: 0, fontSize: '0.9rem', fontStyle: 'italic' }}>
                                                "{subjectPerformance.mentorship.feedback || subjectPerformance.mentorship.remarks}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <style>{`
                .hierarchy-container { padding: 0.5rem 0.25rem; }
                .hierarchy-node { margin-bottom: 2px; }
                .hierarchy-parent { display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 0.75rem; width: 100%; border: none; background: transparent; color: var(--text-dim); font-size: 0.82rem; font-weight: 600; cursor: pointer; text-align: left; border-radius: 8px; }
                .hierarchy-parent.expanded { color: var(--accent-primary); font-weight: 700; }
                .hierarchy-node.batch, .hierarchy-node.semester { margin-left: 0.75rem; border-left: 1px solid rgba(59, 130, 246, 0.1); }
                .hierarchy-leafs { display: flex; flex-direction: column; gap: 1px; margin-left: 0.75rem; border-left: 1px solid rgba(59, 130, 246, 0.1); padding: 0.25rem 0; }
                .hierarchy-leaf { padding: 0.5rem 0.75rem; font-size: 0.78rem; font-weight: 600; color: var(--text-dim); border: none; background: transparent; text-align: left; cursor: pointer; border-radius: 6px; margin-left: 0.5rem; }
                .hierarchy-leaf.active { background: var(--accent-primary); color: white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15); }
                .nav-group-separator { font-size: 0.6rem; font-weight: 800; color: var(--text-dim); margin: 1.5rem 0 0.5rem 0.75rem; opacity: 0.5; letter-spacing: 1px; }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
}

export default StudentDashboard;
