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
    const [facultyProfile, setFacultyProfile] = useState(null);

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

    // Student Repository
    const [studentRepository, setStudentRepository] = useState([]);
    const [repoSearch, setRepoSearch] = useState("");
    const [repoCourse, setRepoCourse] = useState("");
    const [repoBatch, setRepoBatch] = useState("");
    const [repoSem, setRepoSem] = useState("");


    // Modals & UI
    const [showExamForm, setShowExamForm] = useState(false);
    const [examForm, setExamForm] = useState({ name: "", type: "CIE", max_marks: 100, exam_date: new Date().toISOString().split('T')[0] });
    const [uploadMessage, setUploadMessage] = useState("");
    const [uploadWarning, setUploadWarning] = useState("");


    const fetchData = useCallback(async (userId) => {
        try {
            const [subRes, profileRes, repoRes] = await Promise.all([
                axios.get(`${API_BASE}/api/faculty/my-subjects/${userId}`),
                axios.get(`${API_BASE}/api/faculty/profile/${userId}`),
                axios.get(`${API_BASE}/api/faculty/student-repository/${userId}`)
            ]);
            setSubjects(Array.isArray(subRes.data) ? subRes.data : []);
            setFacultyProfile(profileRes.data);
            setStudentRepository(Array.isArray(repoRes.data) ? repoRes.data : []);
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
            setUploadMessage(res.data.message || "Upload successful.");
            setUploadWarning(res.data.warning || "");
            fetchTracker(selectedContext.id);
        } catch (err) {
            setUploadMessage(err.response?.data?.error || "Upload Error. Check file format.");
        } finally {
            setTimeout(() => { setUploadMessage(""); setUploadWarning(""); }, 8000);
        }
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

                    <div className="nav-group-separator">DIRECTORY</div>
                    <button className={activeTab === "repository" ? "active" : ""} onClick={() => { setActiveTab("repository"); setSelectedContext(null); }}>🗂️ Student Repository</button>

                    <div className="nav-group-separator">ACCOUNT</div>
                    <button className={activeTab === "profile" ? "active" : ""} onClick={() => { setActiveTab("profile"); setSelectedContext(null); }}>👤 My Profile</button>

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

                    <div className="header-profile glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '0.6rem 1rem', borderRadius: '15px' }}>
                        <div className="profile-info" style={{ textAlign: 'right' }}>
                            <span className="name" style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem' }}>{user.name}</span>
                            <span className="role" style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Faculty</span>
                        </div>
                        <div className="profile-avatar" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                            {user.name[0].toUpperCase()}
                        </div>
                        <div style={{ height: '24px', width: '1px', background: 'rgba(0,0,0,0.1)' }}></div>
                        <button
                            onClick={logout}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                padding: '4px 8px',
                                display: 'flex',
                                alignItems: 'center',
                                color: '#f43f5e',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}
                        >
                            Sign Out
                        </button>
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
                        <div className="table-header-p" style={{ padding: "1.5rem 2rem", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>Assessment Registry</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-dim)' }}>{selectedContext.name} • {selectedContext.batch} • {selectedContext.semester}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <span className="badge" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-primary)' }}>{contextStudents.length} Students</span>
                                <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>{subjectExams.length} Exams</span>
                            </div>
                        </div>
                        <div className="p-table-wrapper">
                            {detailsLoading ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>⏳ Loading student data...</div>
                            ) : contextStudents.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                                    <strong>No students found for this batch.</strong>
                                    <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Ensure students are enrolled with the correct Batch ID via the Admin Dashboard.</p>
                                </div>
                            ) : subjectExams.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                                    <strong>No exams defined yet.</strong>
                                    <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Go to the <strong>Exams</strong> tab to create assessment modules for this subject.</p>
                                </div>
                            ) : (
                                <table className="p-table">
                                    <thead>
                                        <tr>
                                            <th style={{ paddingLeft: '2rem' }}>Enrollment</th>
                                            <th>Name</th>
                                            {subjectExams.map(ex => <th key={ex.id}>{ex.name} <span style={{ opacity: 0.5, fontWeight: 400 }}>/{ex.max_marks}</span></th>)}
                                            <th>Total %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contextStudents.map((student, idx) => {
                                            const marks = contextMarks[student.id] || {};
                                            let obt = 0; let max = 0;
                                            const cells = subjectExams.map(ex => {
                                                const m = marks[ex.name];
                                                if (m !== undefined) { obt += m; max += ex.max_marks; }
                                                const color = m === undefined ? 'var(--text-dim)' : m >= ex.max_marks * 0.4 ? '#10b981' : '#f43f5e';
                                                return <td key={ex.id}><span style={{ fontWeight: 600, color }}>{m !== undefined ? m : '—'}</span></td>;
                                            });
                                            const pct = max > 0 ? ((obt / max) * 100).toFixed(1) : null;
                                            return (
                                                <tr key={student.id}>
                                                    <td style={{ paddingLeft: '2rem' }}>
                                                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.85rem' }}>{student.enrollment_number}</span>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: `hsl(${(idx * 47) % 360}, 60%, 88%)`, color: `hsl(${(idx * 47) % 360}, 60%, 32%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                                                                {student.name[0].toUpperCase()}
                                                            </div>
                                                            <span style={{ fontWeight: 600 }}>{student.name}</span>
                                                        </div>
                                                    </td>
                                                    {cells}
                                                    <td>
                                                        {pct !== null
                                                            ? <span style={{ fontWeight: 800, color: parseFloat(pct) >= 40 ? '#10b981' : '#f43f5e' }}>{pct}%</span>
                                                            : <span style={{ color: 'var(--text-dim)' }}>No marks</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
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

                {/* 5️⃣ DYNAMIC EXAM SYSTEM - PREMIUM SETUP */}
                {activeTab === "exams" && selectedContext && (
                    <section className="exams-setup-view" style={{ animation: "slideUp 0.4s ease" }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-card)', paddingBottom: '1.5rem' }}>
                            <div>
                                <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Assessment Orchestration</h1>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '5px' }}>
                                    Orchestrating evaluation modules for <strong>{selectedContext.name}</strong> • {selectedContext.batch} • Sem {selectedContext.semester}
                                </p>
                            </div>
                            {!showExamForm && (
                                <button className="btn-add" onClick={() => setShowExamForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>+</span> Define New Assessment
                                </button>
                            )}
                        </div>

                        {showExamForm && (
                            <div className="glass-card" style={{ padding: "3rem", marginBottom: "3rem", border: "1px solid var(--accent-primary)", background: 'rgba(59, 130, 246, 0.03)', animation: 'slideUp 0.3s ease' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2.5rem' }}>
                                    <div className="profile-avatar" style={{ width: '50px', height: '50px', background: 'var(--accent-primary)', color: 'white', borderRadius: '12px', fontSize: '1.5rem' }}>✏️</div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Define Evaluation Module</h3>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)' }}>This will be linked to Faculty: {user.name}</p>
                                    </div>
                                </div>
                                
                                <form onSubmit={handleCreateExam}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", marginBottom: '2.5rem' }}>
                                        <div className="profile-form-group">
                                            <label className="profile-label">Assessment Title / Label</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Unit Test 1, Sessional" 
                                                className="profile-input"
                                                value={examForm.name} 
                                                onChange={e => setExamForm({ ...examForm, name: e.target.value })} 
                                                required
                                            />
                                        </div>
                                        <div className="profile-form-group">
                                            <label className="profile-label">Flexible Exam Type</label>
                                            <select 
                                                className="profile-input"
                                                value={examForm.type} 
                                                onChange={e => setExamForm({ ...examForm, type: e.target.value })} 
                                                required
                                            >
                                                <option value="CIE">CIE 1 (30 Marks)</option>
                                                <option value="CIE">CIE 2 (30 Marks)</option>
                                                <option value="CIE">CIE 3 (30 Marks)</option>
                                                <option value="Class Test">Class Test / Assignment</option>
                                                <option value="Quiz">Interactive Quiz</option>
                                                <option value="Mid-Term">Mid-Term Examination</option>
                                                <option value="Terminal">Final Terminal Exam</option>
                                            </select>
                                        </div>
                                        <div className="profile-form-group">
                                            <label className="profile-label">Maximum Scaling (Full Marks)</label>
                                            <input 
                                                type="number" 
                                                className="profile-input"
                                                value={examForm.max_marks} 
                                                onChange={e => setExamForm({ ...examForm, max_marks: e.target.value })} 
                                                required
                                            />
                                        </div>
                                        <div className="profile-form-group">
                                            <label className="profile-label">Assessment Date</label>
                                            <input 
                                                type="date" 
                                                className="profile-input"
                                                value={examForm.exam_date} 
                                                onChange={e => setExamForm({ ...examForm, exam_date: e.target.value })} 
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="info-alert" style={{ marginBottom: '2.5rem', opacity: 0.8 }}>
                                        <p style={{ margin: 0, fontSize: '0.8rem' }}>
                                            ⚠️ This assessment is strictly linked to <strong>{selectedContext.name}</strong> ({selectedContext.code}) for the <strong>{selectedContext.batch}</strong> batch.
                                        </p>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                        <button type="button" className="btn-cancel" style={{ padding: '1rem 2rem' }} onClick={() => setShowExamForm(false)}>Discard</button>
                                        <button type="submit" className="btn-save" style={{ padding: '1rem 2.5rem' }}>Register Assessment</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '1.5rem 2.5rem', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border-card)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '1.25rem' }}>🧾</span>
                                <h3 style={{ margin: 0 }}>Subject Assessment Registry</h3>
                            </div>
                            <div className="p-table-wrapper">
                                <table className="p-table">
                                    <thead>
                                        <tr>
                                            <th style={{ paddingLeft: '2.5rem' }}>MODULE NAME</th>
                                            <th>CATEGORY</th>
                                            <th>MAX SCALE</th>
                                            <th>DATE</th>
                                            <th style={{ textAlign: 'right', paddingRight: '2.5rem' }}>OPERATIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subjectExams.length > 0 ? subjectExams.map(ex => (
                                            <tr key={ex.id}>
                                                <td style={{ paddingLeft: '2.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem' }}>
                                                            {ex.type ? ex.type.substring(0, 2).toUpperCase() : 'EX'}
                                                        </div>
                                                        <span style={{ fontWeight: 700 }}>{ex.name}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', fontSize: '0.7rem' }}>{ex.type || 'Standard'}</span>
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: 600 }}>{ex.max_marks} Marks</span>
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{new Date(ex.exam_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </td>
                                                <td style={{ textAlign: 'right', paddingRight: '2.5rem' }}>
                                                    <button 
                                                        onClick={() => handleDeleteExam(ex.id)}
                                                        style={{ 
                                                            background: 'rgba(244, 63, 94, 0.1)', 
                                                            color: '#f43f5e', 
                                                            border: 'none', 
                                                            padding: '8px 16px', 
                                                            borderRadius: '8px', 
                                                            fontSize: '0.75rem', 
                                                            fontWeight: 700,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
                                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                                                    No assessment modules defined for this context yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
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
                                    {uploadWarning && <div className="glass-card" style={{ marginTop: "0.75rem", padding: "1rem", background: 'rgba(245, 158, 11, 0.1)', color: "#f59e0b", border: '1px solid #f59e0b', fontSize: '0.85rem' }}>⚠️ {uploadWarning}</div>}
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

                        {/* LIVE MARKS PREVIEW */}
                        {contextStudents.length > 0 && (
                            <div style={{ marginTop: '2.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
                                    <h3 style={{ margin: 0 }}>📊 Current Marks Registry</h3>
                                    <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>{contextStudents.length} Students</span>
                                    {uploadMessage && <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>✓ {uploadMessage}</span>}
                                </div>
                                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                                    <div className="p-table-wrapper">
                                        <table className="p-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ paddingLeft: '2rem' }}>ENROLLMENT</th>
                                                    <th>STUDENT NAME</th>
                                                    {subjectExams.map(ex => <th key={ex.id}>{ex.name} <span style={{ opacity: 0.5, fontWeight: 400 }}>/{ex.max_marks}</span></th>)}
                                                    <th>TOTAL %</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {contextStudents.map((student, idx) => {
                                                    const marks = contextMarks[student.id] || {};
                                                    let obt = 0; let max = 0;
                                                    subjectExams.forEach(ex => {
                                                        const m = marks[ex.name];
                                                        if (m !== undefined) { obt += m; max += ex.max_marks; }
                                                    });
                                                    const pct = max > 0 ? ((obt / max) * 100).toFixed(1) : null;
                                                    return (
                                                        <tr key={student.id}>
                                                            <td style={{ paddingLeft: '2rem' }}><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.85rem' }}>{student.enrollment_number}</span></td>
                                                            <td>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `hsl(${(idx * 47) % 360}, 60%, 88%)`, color: `hsl(${(idx * 47) % 360}, 60%, 32%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>{student.name[0].toUpperCase()}</div>
                                                                    <span style={{ fontWeight: 600 }}>{student.name}</span>
                                                                </div>
                                                            </td>
                                                            {subjectExams.map(ex => {
                                                                const m = marks[ex.name];
                                                                const color = m === undefined ? 'var(--text-dim)' : m >= ex.max_marks * 0.4 ? '#10b981' : '#f43f5e';
                                                                return <td key={ex.id}><span style={{ fontWeight: 700, color }}>{m !== undefined ? m : '—'}</span></td>;
                                                            })}
                                                            <td>{pct !== null ? <span style={{ fontWeight: 800, color: parseFloat(pct) >= 40 ? '#10b981' : '#f43f5e' }}>{pct}%</span> : <span style={{ color: 'var(--text-dim)' }}>—</span>}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                    </section>
                )}
                {/* STUDENT REPOSITORY — TABLE FORMAT WITH FILTERS */}
                {activeTab === "repository" && (() => {
                    // Flatten all students from the hierarchy, enriched with context
                    const allRows = [];
                    studentRepository.forEach(course => {
                        Object.values(course.batches).forEach(batch => {
                            Object.values(batch.semesters).forEach(sem => {
                                sem.students.forEach(st => {
                                    allRows.push({
                                        ...st,
                                        course: course.name,
                                        course_id: course.id,
                                        batch: batch.name,
                                        batch_id: batch.id,
                                        semester: sem.name,
                                        semester_id: sem.id,
                                        subjects: sem.subjects.map(s => s.code).join(', ')
                                    });
                                });
                            });
                        });
                    });

                    // Unique filter options derived from data
                    const courses    = [...new Map(allRows.map(r => [r.course_id, r.course])).entries()];
                    const batchesFor = [...new Map(allRows.filter(r => !repoCourse || String(r.course_id) === repoCourse).map(r => [r.batch_id, r.batch])).entries()];
                    const semsFor    = [...new Map(allRows.filter(r => (!repoCourse || String(r.course_id) === repoCourse) && (!repoBatch || String(r.batch_id) === repoBatch)).map(r => [r.semester_id, r.semester])).entries()];

                    const filtered = allRows.filter(r =>
                        (!repoCourse || String(r.course_id) === repoCourse) &&
                        (!repoBatch  || String(r.batch_id)  === repoBatch) &&
                        (!repoSem    || String(r.semester_id) === repoSem) &&
                        (repoSearch === "" || r.name.toLowerCase().includes(repoSearch.toLowerCase()) || r.enrollment_number.toLowerCase().includes(repoSearch.toLowerCase()))
                    );

                    // De-duplicate by student id
                    const seen = new Set();
                    const unique = filtered.filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });

                    return (
                        <section style={{ animation: "slideUp 0.4s ease" }}>
                            <div style={{ marginBottom: '2rem' }}>
                                <h1 style={{ margin: 0, fontSize: '1.75rem' }}>🗂️ Student Repository</h1>
                                <p style={{ margin: '5px 0 0', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                                    Complete institutional directory of all students under your teaching portfolio.
                                </p>
                            </div>

                            {/* FILTER BAR */}
                            <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px' }}>
                                    <span style={{ fontSize: '1.1rem' }}>🏢</span>
                                    <select value={repoCourse} onChange={e => { setRepoCourse(e.target.value); setRepoBatch(""); setRepoSem(""); }}
                                        style={{ flex: 1, padding: '0.7rem 1rem', borderRadius: '10px', border: '1px solid var(--border-card)', background: 'white', fontWeight: 600 }}>
                                        <option value="">All Programs</option>
                                        {courses.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '180px' }}>
                                    <span style={{ fontSize: '1.1rem' }}>📅</span>
                                    <select value={repoBatch} onChange={e => { setRepoBatch(e.target.value); setRepoSem(""); }} disabled={!repoCourse}
                                        style={{ flex: 1, padding: '0.7rem 1rem', borderRadius: '10px', border: '1px solid var(--border-card)', background: 'white', fontWeight: 600, opacity: !repoCourse ? 0.5 : 1 }}>
                                        <option value="">All Batches</option>
                                        {batchesFor.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '180px' }}>
                                    <span style={{ fontSize: '1.1rem' }}>🎓</span>
                                    <select value={repoSem} onChange={e => setRepoSem(e.target.value)} disabled={!repoBatch}
                                        style={{ flex: 1, padding: '0.7rem 1rem', borderRadius: '10px', border: '1px solid var(--border-card)', background: 'white', fontWeight: 600, opacity: !repoBatch ? 0.5 : 1 }}>
                                        <option value="">All Semesters</option>
                                        {semsFor.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 2, minWidth: '220px' }}>
                                    <input type="text" placeholder="🔍  Name or Enrollment No." value={repoSearch} onChange={e => setRepoSearch(e.target.value)}
                                        style={{ flex: 1, padding: '0.7rem 1rem', borderRadius: '10px', border: '1px solid var(--border-card)', background: 'white', fontWeight: 500 }} />
                                </div>
                                {(repoCourse || repoBatch || repoSem || repoSearch) && (
                                    <button onClick={() => { setRepoCourse(""); setRepoBatch(""); setRepoSem(""); setRepoSearch(""); }}
                                        style={{ padding: '0.7rem 1.2rem', borderRadius: '10px', border: 'none', background: 'rgba(244,63,94,0.1)', color: '#f43f5e', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        ✕ Clear
                                    </button>
                                )}
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                                    Showing <strong style={{ color: 'var(--text-main)' }}>{unique.length}</strong> of <strong style={{ color: 'var(--text-main)' }}>{allRows.length}</strong> enrolled students
                                </span>
                            </div>

                            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div className="p-table-wrapper">
                                    <table className="p-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '50px', paddingLeft: '2rem' }}>#</th>
                                                <th>STUDENT</th>
                                                <th>ENROLLMENT NO.</th>
                                                <th>EMAIL</th>
                                                <th>PROGRAM</th>
                                                <th>BATCH</th>
                                                <th>SEMESTER</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {unique.length > 0 ? unique.map((st, idx) => (
                                                <tr key={`${st.id}-${st.semester_id}`}>
                                                    <td style={{ paddingLeft: '2rem', color: 'var(--text-dim)', fontWeight: 600 }}>{idx + 1}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `hsl(${(idx * 47) % 360}, 60%, 88%)`, color: `hsl(${(idx * 47) % 360}, 60%, 32%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                                                                {st.name[0].toUpperCase()}
                                                            </div>
                                                            <span style={{ fontWeight: 700 }}>{st.name}</span>
                                                        </div>
                                                    </td>
                                                    <td><span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '1px', fontSize: '0.85rem' }}>{st.enrollment_number}</span></td>
                                                    <td style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{st.email}</td>
                                                    <td><span className="badge" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-primary)' }}>{st.course}</span></td>
                                                    <td><span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>{st.batch}</span></td>
                                                    <td><span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>{st.semester}</span></td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="7" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
                                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                                                        No students match the selected filters.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    );
                })()}

                {activeTab === "profile" && facultyProfile && (
                    <section className="profile-view" style={{ animation: "slideUp 0.4s ease" }}>
                        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '3rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '2rem' }}>
                                <div className="profile-avatar" style={{ width: '100px', height: '100px', fontSize: '2.5rem' }}>
                                    {facultyProfile.name?.[0].toUpperCase()}
                                </div>
                                <div>
                                    <h1 style={{ margin: 0, fontSize: '2.2rem' }}>{facultyProfile.name}</h1>
                                    <p style={{ margin: '5px 0 0', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Registered Faculty Member
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
                                <div className="info-group">
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, opacity: 0.5, marginBottom: '8px' }}>FULL NAME</label>
                                    <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)' }}>{facultyProfile.name}</div>
                                </div>
                                <div className="info-group">
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, opacity: 0.5, marginBottom: '8px' }}>EMAIL ADDRESS</label>
                                    <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)' }}>{facultyProfile.email}</div>
                                </div>
                                <div className="info-group">
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, opacity: 0.5, marginBottom: '8px' }}>DEPARTMENT</label>
                                    <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)' }}>{facultyProfile.department || "Not Assigned"}</div>
                                </div>
                                <div className="info-group">
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, opacity: 0.5, marginBottom: '8px' }}>EMPLOYEE ID</label>
                                    <div className="glass-card" style={{
                                        padding: '1rem',
                                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05))',
                                        border: '1px solid rgba(59, 130, 246, 0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.2rem', color: 'var(--accent-primary)', letterSpacing: '2px' }}>
                                            FAC-{facultyProfile.id.toString().padStart(4, '0')}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '6px' }}>
                                            ✓ VERIFIED
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="info-alert" style={{ marginTop: '3rem', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '15px' }}>
                                <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Read-Only Mode</h4>
                                    <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>Profile details are managed by the institutional administrator. Please contact the IT department for any corrections.</p>
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
