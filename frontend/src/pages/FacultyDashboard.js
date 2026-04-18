import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell
} from "recharts";
import "./Dashboard.css";

const API_BASE = "http://127.0.0.1:5001";

const FacultyDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState("home");
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // Sidebar & Context State
    const [selectedContext, setSelectedContext] = useState(null);
    const [expandedPaths, setExpandedPaths] = useState([]); // Tracks expanded nodes in the hierarchy e.g. ["course_1", "batch_3"]

    // Assessment Data
    const [subjectExams, setSubjectExams] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState("");
    const [contextStudents, setContextStudents] = useState([]);
    const [contextMarks, setContextMarks] = useState({}); // { student_id: { exam_name: marks } }
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Modals & UI
    const [showExamForm, setShowExamForm] = useState(false);
    const [examForm, setExamForm] = useState({ name: "", type: "CIE", max_marks: 100, exam_date: new Date().toISOString().split('T')[0] });
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState("");

    const fetchData = useCallback(async (userId) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/api/faculty/my-subjects/${userId}`);
            setSubjects(Array.isArray(res.data) ? res.data : []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
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
            const [studentsRes, marksRes] = await Promise.all([
                axios.get(`${API_BASE}/api/faculty/subject-students/${subjectId}`),
                axios.get(`${API_BASE}/api/faculty/subject-marks/${subjectId}`)
            ]);
            setContextStudents(studentsRes.data);
            const marksMap = {};
            marksRes.data.forEach(m => {
                if (!marksMap[m.student_id]) marksMap[m.student_id] = {};
                marksMap[m.student_id][m.exam_name] = m.marks_obtained;
            });
            setContextMarks(marksMap);
        } catch (err) { console.error(err); }
        finally { setDetailsLoading(false); }
    }, []);

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

    // HIERARCHY COMPUTATION
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
        setUploadLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("exam_id", selectedExamId);
            const res = await axios.post(`${API_BASE}/api/marks/upload`, formData);
            setUploadMessage(res.data.message);
            fetchTracker(selectedContext.id);
        } catch (err) { setUploadMessage("Upload Error"); }
        finally { setUploadLoading(false); setTimeout(() => setUploadMessage(""), 5000); }
    };

    // ADVANCED ANALYTICAL COMPUTATIONS
    const analyticalData = useMemo(() => {
        if (!selectedContext || subjectExams.length === 0 || contextStudents.length === 0) return null;
        
        // 1. Exam Performance Stats
        const examStats = subjectExams.map(ex => {
            const scores = contextStudents.map(s => contextMarks[s.id]?.[ex.name]).filter(v => v !== undefined);
            const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
            const max = scores.length > 0 ? Math.max(...scores) : 0;
            const min = scores.length > 0 ? Math.min(...scores) : 0;
            const avgPerc = (avg / ex.max_marks) * 100;
            return { 
                name: ex.name, 
                average: parseFloat(avg.toFixed(1)), 
                highest: max, 
                lowest: min, 
                avgPercentage: parseFloat(avgPerc.toFixed(1)), 
                maxPossible: ex.max_marks 
            };
        });

        // 2. Student Overall Percentages
        const studentOverall = contextStudents.map(student => {
            const marks = contextMarks[student.id] || {};
            let obt = 0; let totalMax = 0;
            subjectExams.forEach(ex => {
                const m = marks[ex.name];
                if (m !== undefined) { obt += m; totalMax += ex.max_marks; }
            });
            const p = totalMax > 0 ? (obt / totalMax) * 100 : 0;
            return { id: student.id, name: student.name, enrollment: student.enrollment_number, marks: obt, percentage: p };
        });

        // 3. Pass/Fail Distribution (40% threshold)
        const passed = studentOverall.filter(s => s.percentage >= 40).length;
        const failed = studentOverall.length - passed;
        const passFailData = [
            { name: "Pass", value: passed, color: "#10b981" },
            { name: "Fail", value: failed, color: "#f43f5e" }
        ];

        // 4. Histogram (Score Brackets)
        const brackets = [
            { range: "0-20", count: 0 },
            { range: "21-40", count: 0 },
            { range: "41-60", count: 0 },
            { range: "61-80", count: 0 },
            { range: "81-100", count: 0 }
        ];
        studentOverall.forEach(s => {
            const p = s.percentage;
            if (p <= 20) brackets[0].count++;
            else if (p <= 40) brackets[1].count++;
            else if (p <= 60) brackets[2].count++;
            else if (p <= 80) brackets[3].count++;
            else brackets[4].count++;
        });

        // 5. High & Low Performers
        const sorted = [...studentOverall].sort((a,b) => b.percentage - a.percentage);
        const overallAvg = (studentOverall.reduce((a,b)=>a+b.percentage,0)/studentOverall.length).toFixed(1);

        return { 
            examStats, 
            overallAvg, 
            passFailData, 
            distribution: brackets,
            top5: sorted.slice(0, 5),
            weak: sorted.filter(s => s.percentage < 40).sort((a,b)=>a.percentage - b.percentage)
        };
    }, [selectedContext, subjectExams, contextStudents, contextMarks]);

    const logout = () => { localStorage.clear(); navigate("/login"); };

    if (!user) return <div className="loading-screen">Authenticating...</div>;

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

                    {/* DRILL DOWN HIERARCHY */}
                    <div className="hierarchy-container">
                        {loading ? <div className="nav-child loading">Loading...</div> : Object.values(teachingHierarchy).map(course => (
                            <div key={`c-${course.id}`} className="hierarchy-node">
                                <button className={`hierarchy-parent course ${expandedPaths.includes(`c-${course.id}`) ? 'expanded' : ''}`} onClick={() => togglePath(`c-${course.id}`)}>
                                    <span className="node-icon">🏢</span> {course.name}
                                    <span className="node-chevron">{expandedPaths.includes(`c-${course.id}`) ? '▼' : '▶'}</span>
                                </button>

                                {expandedPaths.includes(`c-${course.id}`) && Object.values(course.batches).map(batch => (
                                    <div key={`b-${batch.id}`} className="hierarchy-node batch">
                                        <button className={`hierarchy-parent batch ${expandedPaths.includes(`b-${batch.id}`) ? 'expanded' : ''}`} onClick={() => togglePath(`b-${batch.id}`)}>
                                            <span className="node-icon">📅</span> {batch.name}
                                            <span className="node-chevron">{expandedPaths.includes(`b-${batch.id}`) ? '▼' : '▶'}</span>
                                        </button>

                                        {expandedPaths.includes(`b-${batch.id}`) && Object.values(batch.semesters).map(semester => (
                                            <div key={`s-${semester.id}`} className="hierarchy-node semester">
                                                <button className={`hierarchy-parent semester ${expandedPaths.includes(`s-${semester.id}`) ? 'expanded' : ''}`} onClick={() => togglePath(`s-${semester.id}`)}>
                                                    <span className="node-icon">🎓</span> {semester.name}
                                                    <span className="node-chevron">{expandedPaths.includes(`s-${semester.id}`) ? '▼' : '▶'}</span>
                                                </button>

                                                {expandedPaths.includes(`s-${semester.id}`) && (
                                                    <div className="hierarchy-leafs">
                                                        {semester.subjects.map(sub => (
                                                            <button
                                                                key={`sub-${sub.id}`}
                                                                className={`hierarchy-leaf ${selectedContext?.id === sub.id ? 'active' : ''}`}
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
                                ))}
                            </div>
                        ))}
                    </div>

                    <div className="nav-group-separator">OPERATIONS</div>
                    <button className={activeTab === "exams" ? "active" : ""} disabled={!selectedContext} onClick={() => setActiveTab("exams")} style={{ opacity: !selectedContext ? 0.4 : 1 }}>
                        <span className="nav-icon">🎯</span> Exam Setup
                    </button>
                    <button className={activeTab === "upload" ? "active" : ""} disabled={!selectedContext} onClick={() => setActiveTab("upload")} style={{ opacity: !selectedContext ? 0.4 : 1 }}>
                        <span className="nav-icon">📤</span> Grade entry
                    </button>
                    <button className={activeTab === "analysis" ? "active" : ""} disabled={!selectedContext} onClick={() => setActiveTab("analysis")} style={{ opacity: !selectedContext ? 0.4 : 1 }}>
                        <span className="nav-icon">📊</span> Analysis
                    </button>

                    <button onClick={logout} className="btn-logout" style={{ marginTop: "2rem" }}>Logout</button>
                </nav>
            </aside>

            {/* MAIN CONTENT */}
            <main className="main-content">
                <header className="main-header">
                    <div className="header-info">
                        <h1>{selectedContext ? selectedContext.name : "Faculty Command Center"}</h1>
                        <p>{selectedContext ? `${selectedContext.course} | ${selectedContext.batch} | ${selectedContext.semester}` : `Academic Session: 2025-26`}</p>
                    </div>
                    <div className="header-profile">
                        <div className="profile-info">
                            <span className="name">{user.name}</span>
                            <span className="role">Faculty Staff</span>
                        </div>
                        <div className="profile-avatar">{user.name?.[0].toUpperCase()}</div>
                    </div>
                </header>

                {/* OVERVIEW / WELCOME */}
                {activeTab === "home" && !selectedContext && (
                    <section className="welcome-view glass-card" style={{ padding: "4rem", textAlign: "center" }}>
                        <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>🏫</div>
                        <h2>Departmental Hub</h2>
                        <p style={{ color: "var(--text-dim)", maxWidth: "600px", margin: "0 auto 2rem" }}>
                            Drill down into your assigned Course, Batch, and Semester from the sidebar to manage specific classroom metrics and student assessments.
                        </p>
                    </section>
                )}

                {/* PERFORMANCE TRACKER (SUBJECT HOME) */}
                {activeTab === "home" && selectedContext && (
                    <section className="tracker-view glass-card" style={{ animation: "slideUp 0.4s ease" }}>
                        <div className="table-header-p" style={{ padding: "1rem" }}>
                            <h3>Class Assessment Registry</h3>
                            <span className="badge-p faculty">Batch: {selectedContext.batch}</span>
                        </div>
                        <div className="p-table-wrapper">
                            {detailsLoading ? <p>Processing matrices...</p> : (
                                <table className="p-table">
                                    <thead>
                                        <tr>
                                            <th>Enrollment</th><th>Name</th>
                                            {subjectExams.map(ex => <th key={ex.id}>{ex.name}</th>)}
                                            <th style={{ background: "rgba(59, 130, 246, 0.05)" }}>Total %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contextStudents.map(student => {
                                            const marks = contextMarks[student.id] || {};
                                            let obt = 0; let max = 0;
                                            return (
                                                <tr key={student.id}>
                                                    <td><strong>{student.enrollment_number}</strong></td>
                                                    <td>{student.name}</td>
                                                    {subjectExams.map(ex => {
                                                        const m = marks[ex.name];
                                                        if (m !== undefined) { obt += m; max += ex.max_marks; }
                                                        return <td key={ex.id}>{m ?? "-"}</td>
                                                    })}
                                                    <td style={{ fontWeight: "700", color: "var(--accent-primary)" }}>
                                                        {max > 0 ? ((obt / max) * 100).toFixed(1) + "%" : "-"}
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

                {/* EXAM SETUP */}
                {activeTab === "exams" && selectedContext && (
                    <section className="exams-view glass-card" style={{ padding: "2.5rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                            <h3>Define New Assessment</h3>
                            <button className="btn-add" onClick={() => setShowExamForm(true)}>+ New Exam</button>
                        </div>
                        {showExamForm && (
                            <form onSubmit={handleCreateExam} style={{ padding: "2rem", marginBottom: "2rem", background: "rgba(59, 130, 246, 0.03)", borderRadius: "15px", border: "1px solid var(--accent-primary)" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div className="form-group-crud"><label>Exam Name</label><input type="text" required value={examForm.name} onChange={e => setExamForm({ ...examForm, name: e.target.value })} /></div>
                                    <div className="form-group-crud"><label>Type</label><select value={examForm.type} onChange={e => setExamForm({ ...examForm, type: e.target.value })}><option>CIE</option><option>Quiz</option><option>Assignment</option><option>Mid-Term</option></select></div>
                                    <div className="form-group-crud"><label>Max Marks</label><input type="number" required value={examForm.max_marks} onChange={e => setExamForm({ ...examForm, max_marks: e.target.value })} /></div>
                                    <div className="form-group-crud"><label>Date</label><input type="date" required value={examForm.exam_date} onChange={e => setExamForm({ ...examForm, exam_date: e.target.value })} /></div>
                                </div>
                                <div style={{ marginTop: "1rem" }}><button type="submit" className="btn-add">Save Assessment</button> <button type="button" className="btn-cancel" onClick={() => setShowExamForm(false)}>Cancel</button></div>
                            </form>
                        )}
                        <div className="p-table-wrapper">
                            <table className="p-table">
                                <thead><tr><th>Exam</th><th>Type</th><th>Max</th><th>Date</th><th>Action</th></tr></thead>
                                <tbody>{subjectExams.map(ex => (<tr key={ex.id}><td><strong>{ex.name}</strong></td><td>{ex.type}</td><td>{ex.max_marks}</td><td>{ex.exam_date}</td><td><button onClick={() => handleDeleteExam(ex.id)}>Delete</button></td></tr>))}</tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* ADVANCED ANALYSIS DASHBOARD */}
                {activeTab === "analysis" && selectedContext && analyticalData && (
                    <section className="analysis-view" style={{ animation: "slideUp 0.4s ease" }}>
                        {/* STAT CARDS */}
                        <div className="stats-section" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", marginBottom: "2rem" }}>
                            <div className="glass-card stat-card-p">
                                <span className="stat-p-label">Subject Average</span>
                                <span className="stat-p-value">{analyticalData.overallAvg}%</span>
                            </div>
                            <div className="glass-card stat-card-p">
                                <span className="stat-p-label">Highest Score</span>
                                <span className="stat-p-value">{Math.max(...analyticalData.examStats.map(s => s.highest), 0)}</span>
                            </div>
                            <div className="glass-card stat-card-p">
                                <span className="stat-p-label">Passed</span>
                                <span className="stat-p-value" style={{ color: "#10b981" }}>{analyticalData.passFailData[0].value}</span>
                            </div>
                            <div className="glass-card stat-card-p">
                                <span className="stat-p-label">Failed</span>
                                <span className="stat-p-value" style={{ color: "#f43f5e" }}>{analyticalData.passFailData[1].value}</span>
                            </div>
                        </div>

                        {/* ROW 1: COMPARISON & TREND */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                            <div className="glass-card" style={{ padding: "1.5rem", height: "400px" }}>
                                <h3 style={{ marginBottom: "1rem" }}>Assessment Comparison (Avg/High/Low)</h3>
                                <ResponsiveContainer width="100%" height="85%">
                                    <BarChart data={analyticalData.examStats}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                                        <Legend />
                                        <Bar name="Average" dataKey="average" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                                        <Bar name="Highest" dataKey="highest" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        <Bar name="Lowest" dataKey="lowest" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="glass-card" style={{ padding: "1.5rem", height: "400px" }}>
                                <h3 style={{ marginBottom: "1rem" }}>Performance Trend Line (%)</h3>
                                <ResponsiveContainer width="100%" height="85%">
                                    <AreaChart data={analyticalData.examStats}>
                                        <defs>
                                            <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                        <XAxis dataKey="name" />
                                        <YAxis unit="%" domain={[0, 100]} />
                                        <Tooltip />
                                        <Area type="monotone" name="Efficiency" dataKey="avgPercentage" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* ROW 2: PASS/FAIL & DISTRIBUTION */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                            <div className="glass-card" style={{ padding: "1.5rem", height: "400px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <h3 style={{ width: "100%", textAlign: 'left', marginBottom: "1rem" }}>Pass vs Fail Distribution</h3>
                                <ResponsiveContainer width="100%" height="85%">
                                    <PieChart>
                                        <Pie data={analyticalData.passFailData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                            {analyticalData.passFailData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="glass-card" style={{ padding: "1.5rem", height: "400px" }}>
                                <h3 style={{ marginBottom: "1rem" }}>Score Distribution (Frequency)</h3>
                                <ResponsiveContainer width="100%" height="85%">
                                    <BarChart data={analyticalData.distribution}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                        <XAxis dataKey="range" label={{ value: 'Percentage Range', position: 'insideBottom', offset: -5 }} />
                                        <YAxis label={{ value: 'No. of Students', angle: -90, position: 'insideLeft' }} />
                                        <Tooltip />
                                        <Bar name="Students" dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* ROW 3: PERFORMER PANELS */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                            <div className="glass-card" style={{ padding: "1.5rem" }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    <span style={{ fontSize: '1.2rem' }}>🟢</span>
                                    <h3 style={{ margin: 0 }}>Top 5 High Performers</h3>
                                </div>
                                <div className="p-table-wrapper">
                                    <table className="p-table">
                                        <thead><tr><th>Rank</th><th>Name</th><th>Score %</th></tr></thead>
                                        <tbody>
                                            {analyticalData.top5.map((s, idx) => (
                                                <tr key={s.id}>
                                                    <td><strong>#{idx + 1}</strong></td>
                                                    <td>{s.name}</td>
                                                    <td style={{ color: "#10b981", fontWeight: "700" }}>{s.percentage.toFixed(1)}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="glass-card" style={{ padding: "1.5rem" }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    <span style={{ fontSize: '1.2rem' }}>🔴</span>
                                    <h3 style={{ margin: 0 }}>Critical: Weak Students (Below 40%)</h3>
                                </div>
                                <div className="p-table-wrapper">
                                    <table className="p-table">
                                        <thead><tr><th>Enrollment</th><th>Name</th><th>Score %</th></tr></thead>
                                        <tbody>
                                            {analyticalData.weak.length > 0 ? analyticalData.weak.map(s => (
                                                <tr key={s.id}>
                                                    <td>{s.enrollment}</td>
                                                    <td>{s.name}</td>
                                                    <td style={{ color: "#f43f5e", fontWeight: "700" }}>{s.percentage.toFixed(1)}%</td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="3" style={{ textAlign: 'center', opacity: 0.5 }}>No students below threshold.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* GRADE ENTRY */}
                {activeTab === "upload" && selectedContext && (
                    <section className="upload-view">
                        <div className="glass-card" style={{ maxWidth: "500px", margin: "2rem auto", padding: "3rem", textAlign: "center" }}>
                            <h2>Mass Grade Upload</h2>
                            <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} style={{ width: "100%", padding: "1rem", margin: "1.5rem 0", borderRadius: "10px" }}>
                                <option value="">Select Exam Context</option>
                                {subjectExams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                            </select>
                            <input type="file" id="up-f" hidden onChange={e => handleMarksUpload(e.target.files[0])} disabled={!selectedExamId} />
                            <label htmlFor="up-f" className={`btn-add ${!selectedExamId ? 'disabled' : ''}`}>
                                {uploadLoading ? "Uploading..." : "Select CSV Record"}
                            </label>
                            {uploadMessage && <p style={{ marginTop: "1rem", fontWeight: "700", color: "#10b981" }}>{uploadMessage}</p>}
                        </div>
                    </section>
                )}
            </main>

            <style>{`
                .hierarchy-container { padding: 0.5rem 0.25rem; }
                .hierarchy-node { margin-bottom: 2px; }
                .hierarchy-parent {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    padding: 0.6rem 0.75rem;
                    width: 100%;
                    border: none;
                    background: transparent;
                    color: var(--text-dim);
                    font-size: 0.82rem;
                    font-weight: 600;
                    cursor: pointer;
                    text-align: left;
                    border-radius: 8px;
                    transition: all 0.2s;
                }
                .hierarchy-parent:hover { background: rgba(59, 130, 246, 0.05); color: var(--accent-primary); }
                .hierarchy-parent.expanded { color: var(--accent-primary); font-weight: 700; }
                
                .node-chevron { margin-left: auto; font-size: 0.6rem; opacity: 0.4; }
                
                .hierarchy-node.batch { margin-left: 0.75rem; border-left: 1px solid rgba(59, 130, 246, 0.1); }
                .hierarchy-node.semester { margin-left: 0.75rem; border-left: 1px solid rgba(59, 130, 246, 0.1); }
                
                .hierarchy-leafs { 
                    display: flex; 
                    flex-direction: column; 
                    gap: 1px; 
                    margin-left: 0.75rem; 
                    border-left: 1px solid rgba(59, 130, 246, 0.1);
                    padding: 0.25rem 0;
                }
                .hierarchy-leaf {
                    padding: 0.5rem 0.75rem;
                    font-size: 0.78rem;
                    font-weight: 600;
                    color: var(--text-dim);
                    border: none;
                    background: transparent;
                    text-align: left;
                    cursor: pointer;
                    border-radius: 6px;
                    margin-left: 0.5rem;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .hierarchy-leaf:hover { background: rgba(59, 130, 246, 0.08); color: var(--accent-primary); }
                .hierarchy-leaf.active { background: var(--accent-primary); color: white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15); }
                
                .nav-group-separator { font-size: 0.6rem; font-weight: 800; color: var(--text-dim); margin: 1.5rem 0 0.5rem 0.75rem; opacity: 0.5; letter-spacing: 1px; }
                .btn-add.disabled { opacity: 0.4; cursor: not-allowed; }
            `}</style>
        </div>
    );
};

export default FacultyDashboard;
