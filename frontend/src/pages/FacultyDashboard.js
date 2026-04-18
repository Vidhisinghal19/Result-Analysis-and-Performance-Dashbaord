import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import "./Dashboard.css";

const API_BASE = "http://127.0.0.1:5001";

const FacultyDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState("home");
    const [subjects, setSubjects] = useState([]);

    // Sidebar & Context State
    const [selectedContext, setSelectedContext] = useState(null);
    const [expandedPaths, setExpandedPaths] = useState([]);

    // Assessment Data
    const [subjectExams, setSubjectExams] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState("");
    const [contextStudents, setContextStudents] = useState([]);
    const [contextMarks, setContextMarks] = useState({});
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Student Tracking Specific
    const [selectedStudentForTrend, setSelectedStudentForTrend] = useState(null);
    const [subjectMentorship, setSubjectMentorship] = useState({});

    // Modals & UI
    const [showExamForm, setShowExamForm] = useState(false);
    const [examForm, setExamForm] = useState({ name: "", type: "CIE", max_marks: 100, exam_date: new Date().toISOString().split('T')[0] });
    const [uploadMessage, setUploadMessage] = useState("");

    const fetchData = useCallback(async (userId) => {
        try {
            const res = await axios.get(`${API_BASE}/api/faculty/my-subjects/${userId}`);
            setSubjects(Array.isArray(res.data) ? res.data : []);
        } catch (err) { console.error(err); }
    }, []);

    const fetchExams = useCallback(async (subjectId) => {
        try {
            const res = await axios.get(`${API_BASE}/api/faculty/subject-exams/${subjectId}`);
            setSubjectExams(res.data);
            if (res.data.length > 0) setSelectedExamId(res.data[0].id);
            else setSelectedExamId("");
        } catch (err) { console.error(err); }
    }, []);

    const fetchTracker = useCallback(async (subjectId) => {
        setDetailsLoading(true);
        try {
            const [studentsRes, marksRes, mentorRes] = await Promise.all([
                axios.get(`${API_BASE}/api/faculty/subject-students/${subjectId}`),
                axios.get(`${API_BASE}/api/faculty/subject-marks/${subjectId}`),
                axios.get(`${API_BASE}/api/faculty/mentorship/${subjectId}`)
            ]);
            setContextStudents(studentsRes.data);
            const marksMap = {};
            marksRes.data.forEach(m => {
                if (!marksMap[m.student_id]) marksMap[m.student_id] = {};
                marksMap[m.student_id][m.exam_name] = m.marks_obtained;
            });
            setContextMarks(marksMap);
            
            const mentorMap = {};
            mentorRes.data.forEach(m => { mentorMap[m.student_id] = m; });
            setSubjectMentorship(mentorMap);
        } catch (err) { console.error(err); }
        finally { setDetailsLoading(false); }
    }, []);

    const handleSaveMentorship = async (studentId, field, value) => {
        try {
            const payload = {
                user_id: user.id,
                student_id: studentId,
                subject_id: selectedContext.id,
                [field]: value
            };
            const res = await axios.post(`${API_BASE}/api/faculty/mentorship`, payload);
            setSubjectMentorship(prev => ({ ...prev, [studentId]: res.data }));
        } catch (err) { console.error("Mentorship save error:", err); }
    };

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (!userData) { navigate("/login"); return; }
        const parsed = JSON.parse(userData);
        if (parsed.role !== "faculty") { navigate("/"); return; }
        setUser(parsed);
        fetchData(parsed.id);
    }, [navigate, fetchData]);

    useEffect(() => {
        if (selectedContext) {
            fetchExams(selectedContext.id);
            fetchTracker(selectedContext.id);
        }
    }, [selectedContext, fetchExams, fetchTracker]);

    const teachingHierarchy = useMemo(() => {
        const hierarchy = {};
        subjects.forEach(s => {
            if (!hierarchy[s.course]) hierarchy[s.course] = { id: s.course_id, name: s.course, batches: {} };
            if (!hierarchy[s.course].batches[s.batch]) hierarchy[s.course].batches[s.batch] = { id: s.batch_id, name: s.batch, semesters: {} };
            if (!hierarchy[s.course].batches[s.batch].semesters[s.semester]) hierarchy[s.course].batches[s.batch].semesters[s.semester] = { id: s.semester_id, name: s.semester, subjects: [] };
            hierarchy[s.course].batches[s.batch].semesters[s.semester].subjects.push(s);
        });
        return hierarchy;
    }, [subjects]);

    const togglePath = (path) => {
        setExpandedPaths(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
    };

    const handleSelectSubject = (sub) => {
        setSelectedContext(sub);
        setActiveTab("home");
    };

    const handleCreateExam = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/api/faculty/exams`, { ...examForm, subject_id: selectedContext.id });
            setShowExamForm(false);
            setExamForm({ name: "", type: "CIE", max_marks: 100, exam_date: new Date().toISOString().split('T')[0] });
            fetchExams(selectedContext.id);
        } catch (err) { alert("Action failed"); }
    };

    const handleDeleteExam = async (id) => {
        if (!window.confirm("Delete this exam?")) return;
        try {
            await axios.delete(`${API_BASE}/api/faculty/exams/${id}`);
            fetchExams(selectedContext.id);
            fetchTracker(selectedContext.id);
        } catch (err) { alert("Delete failed"); }
    };

    const handleMarksUpload = async (file) => {
        if (!selectedExamId) return;
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("exam_id", selectedExamId);
            const res = await axios.post(`${API_BASE}/api/marks/upload`, formData);
            setUploadMessage(res.data.message);
            fetchTracker(selectedContext.id);
        } catch (err) { setUploadMessage("Upload Error"); }
        finally { setTimeout(() => setUploadMessage(""), 5000); }
    };

    const analyticalData = useMemo(() => {
        if (!selectedContext || subjectExams.length === 0 || contextStudents.length === 0) return null;

        const examStats = subjectExams.map(ex => {
            const scores = contextStudents.map(s => contextMarks[s.id]?.[ex.name]).filter(v => v !== undefined);
            const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
            const max = scores.length > 0 ? Math.max(...scores) : 0;
            const min = scores.length > 0 ? Math.min(...scores) : 0;
            return { name: ex.name, average: parseFloat(avg.toFixed(1)), highest: max, lowest: min, avgPercentage: (avg / ex.max_marks) * 100 };
        });

        const studentOverall = contextStudents.map(student => {
            const marks = contextMarks[student.id] || {};
            let obt = 0; let totalMax = 0;
            const performanceTrend = subjectExams.map(ex => ({ name: ex.name, score: marks[ex.name] || 0, max: ex.max_marks }));

            subjectExams.forEach(ex => {
                const m = marks[ex.name];
                if (m !== undefined) { obt += m; totalMax += ex.max_marks; }
            });
            const p = totalMax > 0 ? (obt / totalMax) * 100 : 0;
            return { id: student.id, name: student.name, enrollment: student.enrollment_number, percentage: p, trend: performanceTrend };
        });

        const passed = studentOverall.filter(s => s.percentage >= 40).length;
        const passFailData = [
            { name: "Pass", value: passed, color: "#10b981" },
            { name: "Fail", value: studentOverall.length - passed, color: "#f43f5e" }
        ];

        const brackets = [getBracket(0, 20), getBracket(21, 40), getBracket(41, 60), getBracket(61, 80), getBracket(81, 100)];
        function getBracket(min, max) { return { range: `${min}-${max}`, count: studentOverall.filter(s => s.percentage >= min && s.percentage <= max).length }; }

        const sorted = [...studentOverall].sort((a, b) => b.percentage - a.percentage);
        const overallAvg = (studentOverall.reduce((a, b) => a + b.percentage, 0) / studentOverall.length).toFixed(1);

        return {
            examStats, overallAvg, passFailData, distribution: brackets,
            top5: sorted.slice(0, 5),
            weak: sorted.filter(s => s.percentage < 40).sort((a, b) => a.percentage - b.percentage),
            studentTracking: studentOverall
        };
    }, [selectedContext, subjectExams, contextStudents, contextMarks]);

    const logout = () => { localStorage.clear(); navigate("/login"); };

    if (!user) return <div className="loading-screen">Authenticating Access...</div>;

    return (
        <div className="premium-dashboard">
            {/* SIDEBAR */}
            <aside className="sidebar">
                <div className="sidebar-logo"><h2>JIMS ROHINI</h2></div>
                <nav className="sidebar-nav">
                    <button className={activeTab === "home" && !selectedContext ? "active" : ""} onClick={() => { setActiveTab("home"); setSelectedContext(null); }}>
                        <span className="nav-icon">🏠</span> Overview
                    </button>

                    <div className="nav-group-separator">MY TEACHING</div>
                    <div className="hierarchy-container">
                        {Object.values(teachingHierarchy).map(course => (
                            <div key={`c-${course.id}`} className="hierarchy-node">
                                <button className={`hierarchy-parent ${expandedPaths.includes(`c-${course.id}`) ? 'expanded' : ''}`} onClick={() => togglePath(`c-${course.id}`)}>
                                    🏢 {course.name} <span className="node-chevron">{expandedPaths.includes(`c-${course.id}`) ? '▼' : '▶'}</span>
                                </button>
                                {expandedPaths.includes(`c-${course.id}`) && Object.values(course.batches).map(batch => (
                                    <div key={`b-${batch.id}`} className="hierarchy-node batch">
                                        <button className={`hierarchy-parent ${expandedPaths.includes(`b-${batch.id}`) ? 'expanded' : ''}`} onClick={() => togglePath(`b-${batch.id}`)}>
                                            📅 {batch.name} <span className="node-chevron">{expandedPaths.includes(`b-${batch.id}`) ? '▼' : '▶'}</span>
                                        </button>
                                        {expandedPaths.includes(`b-${batch.id}`) && Object.values(batch.semesters).map(semester => (
                                            <div key={`s-${semester.id}`} className="hierarchy-node semester">
                                                <button className={`hierarchy-parent ${expandedPaths.includes(`s-${semester.id}`) ? 'expanded' : ''}`} onClick={() => togglePath(`s-${semester.id}`)}>
                                                    🎓 {semester.name} <span className="node-chevron">{expandedPaths.includes(`s-${semester.id}`) ? '▼' : '▶'}</span>
                                                </button>
                                                {expandedPaths.includes(`s-${semester.id}`) && (
                                                    <div className="hierarchy-leafs">
                                                        {semester.subjects.map(sub => (
                                                            <button key={`sub-${sub.id}`} className={`hierarchy-leaf ${selectedContext?.id === sub.id ? 'active' : ''}`} onClick={() => handleSelectSubject(sub)}>
                                                                📚 {sub.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    <div className="nav-group-separator">OPERATIONS</div>
                    <button className={activeTab === "exams" ? "active" : ""} disabled={!selectedContext} onClick={() => setActiveTab("exams")} style={{ opacity: !selectedContext ? 0.4 : 1 }}>🎯 Exam Setup</button>
                    <button className={activeTab === "upload" ? "active" : ""} disabled={!selectedContext} onClick={() => setActiveTab("upload")} style={{ opacity: !selectedContext ? 0.4 : 1 }}>📤 Grade Entry</button>
                    <button className={activeTab === "analysis" ? "active" : ""} disabled={!selectedContext} onClick={() => setActiveTab("analysis")} style={{ opacity: !selectedContext ? 0.4 : 1 }}>📊 Analysis</button>
                    <button className={activeTab === "tracking" ? "active" : ""} disabled={!selectedContext} onClick={() => setActiveTab("tracking")} style={{ opacity: !selectedContext ? 0.4 : 1 }}>📉 Student Tracking</button>

                    <button onClick={logout} className="btn-logout" style={{ marginTop: "2rem" }}>Logout</button>
                </nav>
            </aside>

            {/* MAIN CONTENT */}
            <main className="main-content">
                <header className="main-header">
                    <div className="header-info">
                        <h1>{selectedContext ? selectedContext.name : "Faculty Command Center"}</h1>
                        <p>{selectedContext ? `${selectedContext.course} | ${selectedContext.batch}` : `Intelligent Result Analysis System`}</p>
                    </div>
                </header>

                {/* ENHANCED OVERVIEW / COMMAND CENTER */}
                {activeTab === "home" && !selectedContext && (
                    <section className="command-center-view" style={{ animation: "slideUp 0.4s ease" }}>
                        {/* PORTFOLIO STATS */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                            <div className="glass-card stat-card-p" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
                                <span className="stat-p-label">My Assignments</span>
                                <span className="stat-p-value">{subjects.length} Subjects</span>
                            </div>
                            <div className="glass-card stat-card-p" style={{ borderLeft: '4px solid #10b981' }}>
                                <span className="stat-p-label">Courses Covered</span>
                                <span className="stat-p-value">{[...new Set(subjects.map(s => s.course))].length} Programs</span>
                            </div>
                            <div className="glass-card stat-card-p" style={{ borderLeft: '4px solid #f59e0b' }}>
                                <span className="stat-p-label">Student Reach</span>
                                <span className="stat-p-value">{subjects.reduce((a, b) => a + (b.total_students || 0), 0)} Total</span>
                            </div>
                        </div>

                        {/* PORTFOLIO GRID */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ marginBottom: '0.5rem' }}>My Teaching Portfolio</h2>
                            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>A comprehensive overview of your current academic assignments and student batches.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                            {subjects.map(sub => (
                                <div key={sub.id} className="glass-card subject-card" style={{ padding: '1.5rem', transition: 'transform 0.2s' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div className="subject-icon" style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', fontSize: '1.5rem' }}>📚</div>
                                        <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', fontSize: '0.7rem', fontWeight: 800 }}>{sub.code}</span>
                                    </div>
                                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{sub.name}</h3>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span>🏢 <strong>Program:</strong> {sub.course}</span>
                                        <span>📅 <strong>Batch:</strong> {sub.batch}</span>
                                        <span>🎓 <strong>Semester:</strong> {sub.semester}</span>
                                    </div>
                                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.25rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{sub.total_students} Students</span>
                                        </div>
                                        <button 
                                            className="btn-add" 
                                            style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px' }}
                                            onClick={() => handleSelectSubject(sub)}
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* PERFORMANCE TRACKER (HOME FOR SUBJECT) */}
                {activeTab === "home" && selectedContext && (
                    <section className="tracker-view glass-card" style={{ animation: "slideUp 0.4s ease" }}>
                        <div className="table-header-p" style={{ padding: "1rem" }}><h3>Assessment Registry</h3></div>
                        <div className="p-table-wrapper">
                            {detailsLoading ? <p>Processing matrices...</p> : (
                                <table className="p-table">
                                    <thead><tr><th>Enrollment</th><th>Name</th>{subjectExams.map(ex => <th key={ex.id}>{ex.name}</th>)}<th>Total %</th></tr></thead>
                                    <tbody>{contextStudents.map(student => {
                                        const marks = contextMarks[student.id] || {};
                                        let obt = 0; let max = 0;
                                        return (
                                            <tr key={student.id}>
                                                <td><strong>{student.enrollment_number}</strong></td>
                                                <td>{student.name}</td>
                                                {subjectExams.map(ex => {
                                                    const m = marks[ex.name]; if (m !== undefined) { obt += m; max += ex.max_marks; }
                                                    return <td key={ex.id}>{m ?? "-"}</td>
                                                })}
                                                <td style={{ fontWeight: "700", color: "var(--accent-primary)" }}>{max > 0 ? ((obt / max) * 100).toFixed(1) + "%" : "-"}</td>
                                            </tr>
                                        );
                                    })}</tbody>
                                </table>
                            )}
                        </div>
                    </section>
                )}

                {/* STUDENT-WISE PROGRESS TRACKING */}
                {activeTab === "tracking" && selectedContext && analyticalData && (
                    <section className="tracking-view" style={{ animation: "slideUp 0.4s ease" }}>

                        {!selectedStudentForTrend ? (
                            <div className="glass-card" style={{ padding: "2rem" }}>
                                <div style={{ marginBottom: "2rem" }}>
                                    <h3>Individual Student Progress Monitoring</h3>
                                    <p style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>Select a student from the matrix to view their unique performance trajectory.</p>
                                </div>

                                <div className="p-table-wrapper">
                                    <table className="p-table">
                                        <thead>
                                            <tr>
                                                <th>Student Details</th>
                                                {subjectExams.map(ex => <th key={ex.id}>{ex.name}</th>)}
                                                <th>Overall %</th>
                                                <th style={{ textAlign: 'center' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analyticalData.studentTracking.map(student => (
                                                <tr key={student.id} hover="true">
                                                    <td><strong>{student.name}</strong><br /><small className="text-dim">{student.enrollment}</small></td>
                                                    {student.trend.map((t, i) => <td key={i}>{t.score}</td>)}
                                                    <td style={{ fontWeight: "700", color: "var(--accent-primary)" }}>{student.percentage.toFixed(1)}%</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <button
                                                            className="btn-add"
                                                            style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                                                            onClick={() => setSelectedStudentForTrend(student)}
                                                        >
                                                            View Graph
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            /* FULL-PAGE STUDENT TREND VIEW */
                            <div className="student-detail-view" style={{ animation: "slideUp 0.3s ease" }}>
                                <div className="glass-card" style={{ padding: "2.5rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                            <div className="profile-avatar" style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                                                {selectedStudentForTrend.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <h2 style={{ margin: 0, fontSize: '1.8rem' }}>{selectedStudentForTrend.name}</h2>
                                                <p style={{ margin: 0, color: "var(--text-dim)" }}>Enrollment: {selectedStudentForTrend.enrollment} | Cumulative: {selectedStudentForTrend.percentage.toFixed(1)}%</p>
                                            </div>
                                        </div>
                                        <button className="btn-cancel" onClick={() => setSelectedStudentForTrend(null)}>
                                            ← Back to Student List
                                        </button>
                                    </div>

                                    <div className="trend-analysis-container" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                                        <div className="graph-pane" style={{ background: 'rgba(255,255,255,0.4)', padding: '2rem', borderRadius: '20px', height: '450px' }}>
                                            <h4 style={{ marginTop: 0, marginBottom: '2rem' }}>Learning Trajectory</h4>
                                            <ResponsiveContainer width="100%" height="85%">
                                                <LineChart data={selectedStudentForTrend.trend}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} unit="%" />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: "15px", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                                                        cursor={{ stroke: 'var(--accent-primary)', strokeWidth: 2, strokeDasharray: '5 5' }}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="score"
                                                        stroke="var(--accent-primary)"
                                                        strokeWidth={5}
                                                        dot={{ r: 8, fill: "var(--accent-primary)", strokeWidth: 4, stroke: "#fff" }}
                                                        activeDot={{ r: 10, strokeWidth: 0 }}
                                                        animationDuration={1500}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>

                                        <div className="stats-pane">
                                            <h4 style={{ marginTop: 0 }}>Performance Feedback</h4>
                                            
                                            <div className="mentorship-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                                <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                                    <h5 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        🧠 Personal Mentoring
                                                    </h5>
                                                    
                                                    <div style={{ marginBottom: '1.2rem' }}>
                                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.7, display: 'block', marginBottom: '8px' }}>PERFORMANCE RATING</label>
                                                        <select 
                                                            value={subjectMentorship[selectedStudentForTrend.id]?.performance_rating || ""} 
                                                            onChange={(e) => handleSaveMentorship(selectedStudentForTrend.id, 'performance_rating', e.target.value)}
                                                            style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'white' }}
                                                        >
                                                            <option value="">Select Category</option>
                                                            <option value="Excellent">🌟 Excellent (Exceeds Expectations)</option>
                                                            <option value="Consistent">📈 Consistent / Stable Player</option>
                                                            <option value="Improving">⚡ Showing Significant Growth</option>
                                                            <option value="Needs Support">⚠️ Needs Academic Support</option>
                                                            <option value="Critical">🔴 Critical Intervention Required</option>
                                                        </select>
                                                    </div>

                                                    <div style={{ marginBottom: '1.2rem' }}>
                                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.7, display: 'block', marginBottom: '8px' }}>CORE REMARKS</label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Short feedback (e.g. Strong in logic)" 
                                                            defaultValue={subjectMentorship[selectedStudentForTrend.id]?.remarks || ""}
                                                            onBlur={(e) => handleSaveMentorship(selectedStudentForTrend.id, 'remarks', e.target.value)}
                                                            style={{ width: '100%', padding: '10px' }}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.7, display: 'block', marginBottom: '8px' }}>DETAILED FEEDBACK</label>
                                                        <textarea 
                                                            placeholder="Write personalized guidance for the student..." 
                                                            defaultValue={subjectMentorship[selectedStudentForTrend.id]?.feedback || ""}
                                                            onBlur={(e) => handleSaveMentorship(selectedStudentForTrend.id, 'feedback', e.target.value)}
                                                            style={{ width: '100%', padding: '10px', minHeight: '100px' }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--accent-primary)', color: 'white' }}>
                                                    <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Current Mastery Level</p>
                                                    <h3 style={{ margin: 0, fontSize: '1.8rem' }}>{selectedStudentForTrend.percentage.toFixed(1)}%</h3>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* ANALYSIS DASHBOARD (STAYS UNMODIFIED AS PER REQUEST) */}
                {activeTab === "analysis" && selectedContext && analyticalData && (
                    <section className="analysis-view" style={{ animation: "slideUp 0.4s ease" }}>
                        <div className="stats-section" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", marginBottom: "2rem" }}>
                            <div className="glass-card stat-card-p"><span className="stat-p-label">Subject Avg</span><span className="stat-p-value">{analyticalData.overallAvg}%</span></div>
                            <div className="glass-card stat-card-p"><span className="stat-p-label">Highest</span><span className="stat-p-value">{Math.max(...analyticalData.examStats.map(s => s.highest), 0)}</span></div>
                            <div className="glass-card stat-card-p"><span className="stat-p-label">Passed</span><span className="stat-p-value" style={{ color: "#10b981" }}>{analyticalData.passFailData[0].value}</span></div>
                            <div className="glass-card stat-card-p"><span className="stat-p-label">Failed</span><span className="stat-p-value" style={{ color: "#f43f5e" }}>{analyticalData.passFailData[1].value}</span></div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                            <div className="glass-card" style={{ padding: "1.5rem", height: "380px" }}>
                                <ResponsiveContainer><BarChart data={analyticalData.examStats}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar name="Avg" dataKey="average" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} /><Bar name="High" dataKey="highest" fill="#10b981" radius={[4, 4, 0, 0]} /><Bar name="Low" dataKey="lowest" fill="#f43f5e" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
                            </div>
                            <div className="glass-card" style={{ padding: "1.5rem", height: "380px" }}>
                                <ResponsiveContainer><AreaChart data={analyticalData.examStats}><XAxis dataKey="name" /><YAxis unit="%" /><Tooltip /><Area type="monotone" name="Trend" dataKey="avgPercentage" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={0.1} fill="var(--accent-primary)" /></AreaChart></ResponsiveContainer>
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                            <div className="glass-card" style={{ padding: "1.5rem", height: "380px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <h3 style={{ width: "100%" }}>Pass vs Fail</h3>
                                <ResponsiveContainer><PieChart><Pie data={analyticalData.passFailData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">{analyticalData.passFailData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip /><Legend verticalAlign="bottom" /></PieChart></ResponsiveContainer>
                            </div>
                            <div className="glass-card" style={{ padding: "1.5rem", height: "380px" }}>
                                <h3>Score Distribution</h3>
                                <ResponsiveContainer><BarChart data={analyticalData.distribution}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="range" /><YAxis /><Tooltip /><Bar name="Students" dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
                            </div>
                        </div>
                    </section>
                )}

                {/* OTHER TABS (RESTORED) */}
                {activeTab === "exams" && selectedContext && (
                    <section className="glass-card" style={{ padding: "2rem" }}>
                        <button className="btn-add" onClick={() => setShowExamForm(true)} style={{ marginBottom: "1.5rem" }}>+ Define New Exam</button>
                        {showExamForm && (
                            <form onSubmit={handleCreateExam} className="glass-card" style={{ padding: "2rem", marginBottom: "2rem", border: "1px solid var(--accent-primary)" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <input type="text" placeholder="Name" value={examForm.name} onChange={e => setExamForm({ ...examForm, name: e.target.value })} />
                                    <input type="number" placeholder="Max" value={examForm.max_marks} onChange={e => setExamForm({ ...examForm, max_marks: e.target.value })} />
                                </div>
                                <div style={{ marginTop: "1rem" }}><button type="submit" className="btn-add">Save</button> <button type="button" onClick={() => setShowExamForm(false)}>Cancel</button></div>
                            </form>
                        )}
                        <table className="p-table">
                            <thead><tr><th>Exam</th><th>Max</th><th>Action</th></tr></thead>
                            <tbody>{subjectExams.map(ex => <tr key={ex.id}><td>{ex.name}</td><td>{ex.max_marks}</td><td><button onClick={() => handleDeleteExam(ex.id)}>Delete</button></td></tr>)}</tbody>
                        </table>
                    </section>
                )}

                {activeTab === "upload" && selectedContext && (
                    <section className="grade-entry-view" style={{ animation: "slideUp 0.4s ease" }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
                            {/* UPLOAD FORM */}
                            <div className="glass-card" style={{ padding: "3rem", textAlign: "center", display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                                <h2>Submit Assessment Record</h2>
                                <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>Upload the final grades for the selected assessment in CSV format.</p>
                                
                                <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
                                    <label style={{ display: 'block', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px' }}>TARGET ASSESSMENT</label>
                                    <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} style={{ width: "100%", padding: "1rem", marginBottom: "2rem", borderRadius: '12px' }}>
                                        <option value="">Choose Exam...</option>
                                        {subjectExams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                                    </select>
                                    
                                    <input type="file" id="up-f" hidden onChange={e => handleMarksUpload(e.target.files[0])} disabled={!selectedExamId} />
                                    <label htmlFor="up-f" className={`btn-add ${!selectedExamId ? 'disabled' : ''}`} style={{ width: '100%', padding: '1.2rem', display: 'block', textAlign: 'center' }}>
                                        Select CSV Record
                                    </label>
                                    {uploadMessage && <div className="glass-card" style={{ marginTop: "1.5rem", padding: "1rem", background: 'rgba(16, 185, 129, 0.1)', color: "#10b981", border: '1px solid #10b981' }}>{uploadMessage}</div>}
                                </div>
                            </div>

                            {/* INSTRUCTIONS */}
                            <div className="glass-card" style={{ padding: "2rem" }}>
                                <h3 style={{ marginTop: 0 }}>📋 CSV Guidelines</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: '1.6' }}>
                                    Follow these steps to ensure your grade record is processed without errors.
                                </p>
                                
                                <div className="guideline-step" style={{ marginTop: '1.5rem' }}>
                                    <h5 style={{ margin: '0 0 5px 0', fontSize: '0.85rem' }}>1. Required Columns</h5>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Your CSV must include these two exact headers:</p>
                                    <ul style={{ fontSize: '0.8rem', paddingLeft: '1.2rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                                        <li>enrollment_number</li>
                                        <li>marks_obtained</li>
                                    </ul>
                                </div>

                                <div className="guideline-step" style={{ marginTop: '1.5rem' }}>
                                    <h5 style={{ margin: '0 0 5px 0', fontSize: '0.85rem' }}>2. Data Format</h5>
                                    <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse', marginTop: '5px' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(0,0,0,0.05)' }}>
                                                <th style={{ padding: '8px', border: '1px solid #ddd' }}>enrollment_number</th>
                                                <th style={{ padding: '8px', border: '1px solid #ddd' }}>marks_obtained</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>ENR2024001</td>
                                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>85</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>ENR2024002</td>
                                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>92</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="guideline-step" style={{ marginTop: '1.5rem' }}>
                                    <h5 style={{ margin: '0 0 5px 0', fontSize: '0.85rem' }}>3. Verification</h5>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                        Double-check that the enrollment numbers exist in the system before uploading. Duplicate entries for the same student will overwrite previous scores.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            <style>{`
                .active-row { background: rgba(59, 130, 246, 0.05); }
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
};

export default FacultyDashboard;
