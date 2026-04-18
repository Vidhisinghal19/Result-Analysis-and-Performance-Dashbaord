import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, AreaChart, Area
} from "recharts";
import "./Dashboard.css";

const API_BASE = "http://127.0.0.1:5001";

const FacultyDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState("home");
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // Context & Exams State
    const [assignmentsExpanded, setAssignmentsExpanded] = useState(true);
    const [selectedContext, setSelectedContext] = useState(null); 
    const [subjectExams, setSubjectExams] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState("");
    
    // UI Modals/Forms
    const [showExamForm, setShowExamForm] = useState(false);
    const [examForm, setExamForm] = useState({ name: "", type: "CIE", max_marks: 100, exam_date: new Date().toISOString().split('T')[0] });

    // Assessment Data
    const [contextStudents, setContextStudents] = useState([]);
    const [contextMarks, setContextMarks] = useState({}); // { student_id: { exam_name: marks } }
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Messaging
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
            setActiveTab("home");
        }
    }, [selectedContext, fetchExams, fetchTracker]);

    const handleCreateExam = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/api/faculty/exams`, { ...examForm, subject_id: selectedContext.id });
            setShowExamForm(false)
            setExamForm({ name: "", type: "CIE", max_marks: 100, exam_date: new Date().toISOString().split('T')[0] });
            fetchExams(selectedContext.id);
        } catch (err) { alert("Failed to create exam"); }
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
        } catch (err) { setUploadMessage("Upload failed"); } 
        finally { setUploadLoading(false); setTimeout(() => setUploadMessage(""), 5000); }
    };

    // ANALYTICAL COMPUTATIONS
    const analyticalData = useMemo(() => {
        if (!selectedContext || subjectExams.length === 0) return null;

        const examStats = subjectExams.map(ex => {
            const scores = contextStudents.map(s => contextMarks[s.id]?.[ex.name]).filter(v => v !== undefined);
            const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
            const max = scores.length > 0 ? Math.max(...scores) : 0;
            const min = scores.length > 0 ? Math.min(...scores) : 0;
            const avgPerc = (avg / ex.max_marks) * 100;

            return {
                name: ex.name,
                type: ex.type,
                average: parseFloat(avg.toFixed(1)),
                highest: max,
                lowest: min,
                avgPercentage: parseFloat(avgPerc.toFixed(1)),
                maxPossible: ex.max_marks
            };
        });

        // Overall Global Stats
        const allScores = Object.values(contextMarks).flatMap(m => Object.values(m));
        const overallAvg = allScores.length > 0 ? (allScores.reduce((a,b)=>a+b,0)/allScores.length).toFixed(1) : 0;

        return { examStats, overallAvg };
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
                        <span className="nav-icon">🏠</span> Home
                    </button>

                    <div className={`nav-nested-group ${assignmentsExpanded ? 'expanded' : ''}`}>
                        <button className="nav-parent" onClick={() => setAssignmentsExpanded(!assignmentsExpanded)}>
                            <span className="nav-icon">📚</span> My Teaching <span className="chevron">{assignmentsExpanded ? '▼' : '▶'}</span>
                        </button>
                        <div className="nav-children">
                            {subjects.map(sub => (
                                <button key={sub.id} className={`nav-child ${selectedContext?.id === sub.id ? 'active' : ''}`} onClick={() => setSelectedContext(sub)}>
                                    {sub.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="nav-group-separator">SUBJECT OPERATIONS</div>
                    <button className={activeTab === "exams" ? "active" : ""} disabled={!selectedContext} onClick={() => setActiveTab("exams")}>
                        <span className="nav-icon">🎯</span> Exam Setup
                    </button>
                    <button className={activeTab === "upload" ? "active" : ""} disabled={!selectedContext} onClick={() => setActiveTab("upload")}>
                        <span className="nav-icon">📤</span> Grade Entry
                    </button>
                    <button className={activeTab === "analysis" ? "active" : ""} disabled={!selectedContext} onClick={() => setActiveTab("analysis")}>
                        <span className="nav-icon">📈</span> Result Analysis
                    </button>
                    
                    <button onClick={logout} className="btn-logout" style={{ marginTop: "auto" }}>Logout</button>
                </nav>
            </aside>

            {/* MAIN CONTENT */}
            <main className="main-content">
                <header className="main-header">
                    <div className="header-info">
                        <h1>{selectedContext ? selectedContext.name : "Faculty Dashboard"}</h1>
                        <p>{selectedContext ? `${selectedContext.course} | Batch ${selectedContext.batch}` : `Intelligent Result Analysis System`}</p>
                    </div>
                </header>

                {activeTab === "home" && !selectedContext && (
                    <section className="welcome-view glass-card" style={{ padding: "4rem", textAlign: "center" }}>
                        <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>🏢</div>
                        <h2>Department Overview</h2>
                        <p style={{ color: "var(--text-dim)", maxWidth: "600px", margin: "0 auto 2rem" }}>
                            Welcome to the Faculty Result Analysis portal. Select a course from your teaching assignments in the sidebar 
                            to manage assessments and unlock deep analytical insights.
                        </p>
                    </section>
                )}

                {/* TRACKER VIEW (HOME) */}
                {activeTab === "home" && selectedContext && (
                    <section className="tracker-view">
                        <div className="glass-card" style={{ padding: "2rem" }}>
                            <div className="table-header-p">
                                <h3>Student Performance Matrix</h3>
                                <div style={{ display: "flex", gap: "1rem" }}>
                                    <span className="badge-p faculty">Calculated Weighted Average</span>
                                </div>
                            </div>
                            <div className="p-table-wrapper" style={{ marginTop: "1.5rem" }}>
                                {detailsLoading ? <p>Syncing Registry...</p> : (
                                    <table className="p-table">
                                        <thead>
                                            <tr>
                                                <th>Enrollment</th>
                                                <th>Name</th>
                                                {subjectExams.map(ex => <th key={ex.id}>{ex.name}</th>)}
                                                <th style={{ background: "rgba(59, 130, 246, 0.05)" }}>Overall %</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {contextStudents.map(student => {
                                                const marks = contextMarks[student.id] || {};
                                                let totalObt = 0; let totalMax = 0;
                                                return (
                                                    <tr key={student.id}>
                                                        <td><strong>{student.enrollment_number}</strong></td>
                                                        <td>{student.name}</td>
                                                        {subjectExams.map(ex => {
                                                            const m = marks[ex.name];
                                                            if (m !== undefined) { totalObt += m; totalMax += ex.max_marks; }
                                                            return <td key={ex.id} style={{ opacity: m === undefined ? 0.3 : 1 }}>{m ?? "-"}</td>
                                                        })}
                                                        <td style={{ fontWeight: "700", color: "var(--accent-primary)" }}>
                                                            {totalMax > 0 ? ((totalObt/totalMax)*100).toFixed(1) + "%" : "-"}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* EXAM SETUP */}
                {activeTab === "exams" && selectedContext && (
                    <section className="exams-view">
                         <div className="glass-card" style={{ padding: "2.5rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                                <h3>Assessment Manager</h3>
                                <button className="btn-add" onClick={() => setShowExamForm(true)}>+ New Exam Definition</button>
                            </div>

                            {showExamForm && (
                                <form onSubmit={handleCreateExam} className="glass-card" style={{ padding: "2rem", marginBottom: "2rem", border: "2px solid var(--accent-primary)" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                                        <div className="form-group-crud"><label>Exam Name</label><input type="text" required value={examForm.name} onChange={e => setExamForm({...examForm, name: e.target.value})} /></div>
                                        <div className="form-group-crud"><label>Type</label><select value={examForm.type} onChange={e => setExamForm({...examForm, type: e.target.value})}><option>CIE</option><option>Quiz</option><option>Assignment</option><option>Mid-Term</option></select></div>
                                        <div className="form-group-crud"><label>Max Marks</label><input type="number" required value={examForm.max_marks} onChange={e => setExamForm({...examForm, max_marks: e.target.value})} /></div>
                                        <div className="form-group-crud"><label>Date</label><input type="date" required value={examForm.exam_date} onChange={e => setExamForm({...examForm, exam_date: e.target.value})} /></div>
                                    </div>
                                    <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
                                        <button type="submit" className="btn-add">Save Assessment</button>
                                        <button type="button" className="btn-cancel" onClick={() => setShowExamForm(false)}>Cancel</button>
                                    </div>
                                </form>
                            )}

                            <div className="p-table-wrapper">
                                <table className="p-table">
                                    <thead><tr><th>Name</th><th>Category</th><th>Max Marks</th><th>Date</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {subjectExams.map(ex => (
                                            <tr key={ex.id}>
                                                <td><strong>{ex.name}</strong></td>
                                                <td><span className="badge-p faculty">{ex.type}</span></td>
                                                <td>{ex.max_marks}</td>
                                                <td>{ex.exam_date}</td>
                                                <td><button className="btn-cancel" style={{ padding: "5px 10px" }} onClick={() => handleDeleteExam(ex.id)}>Delete</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                         </div>
                    </section>
                )}

                {/* GRADE ENTRY */}
                {activeTab === "upload" && selectedContext && (
                    <section className="upload-view">
                        <div className="glass-card" style={{ maxWidth: "600px", margin: "0 auto", padding: "3rem", textAlign: "center" }}>
                            <h2>CSV Grade Upload</h2>
                            <p style={{ color: "var(--text-dim)", marginBottom: "2rem" }}>Select the exam context and upload your student scores.</p>
                            
                            <div className="form-group-crud" style={{ textAlign: "left", marginBottom: "2rem" }}>
                                <label>Target Exam</label>
                                <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} style={{ width: "100%", padding: "1rem" }}>
                                    <option value="">-- No Exam Selected --</option>
                                    {subjectExams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                                </select>
                            </div>

                            <input type="file" id="ctx-up" hidden onChange={e => handleMarksUpload(e.target.files[0])} disabled={!selectedExamId} />
                            <label htmlFor="ctx-up" className={`btn-add ${uploadLoading ? 'loading' : ''} ${!selectedExamId ? 'disabled' : ''}`}>
                                {uploadLoading ? "Uploading Data..." : "Choose File (.csv)"}
                            </label>
                            {uploadMessage && <div className={`msg-p ${uploadMessage.includes('failed') ? 'err' : 'ok'}`} style={{ marginTop: "1.5rem" }}>{uploadMessage}</div>}
                        </div>
                    </section>
                )}

                {/* ANALYSIS DASHBOARD */}
                {activeTab === "analysis" && selectedContext && analyticalData && (
                    <section className="analysis-view" style={{ animation: "slideUp 0.4s ease" }}>
                        {/* STAT CARDS */}
                        <div className="stats-section" style={{ marginBottom: "2rem" }}>
                            <div className="glass-card stat-card-p">
                                <span className="stat-p-label">Subject Average</span>
                                <span className="stat-p-value">{analyticalData.overallAvg}</span>
                            </div>
                            <div className="glass-card stat-card-p">
                                <span className="stat-p-label">Highest Score</span>
                                <span className="stat-p-value">{Math.max(...analyticalData.examStats.map(s => s.highest), 0)}</span>
                            </div>
                            <div className="glass-card stat-card-p">
                                <span className="stat-p-label">Assessment Count</span>
                                <span className="stat-p-value">{subjectExams.length}</span>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                            {/* PERFORMANCE COMPARISON BAR CHART */}
                            <div className="glass-card" style={{ padding: "2rem", height: "450px" }}>
                                <h3 style={{ marginBottom: "1.5rem" }}>Assessment Comparison</h3>
                                <ResponsiveContainer width="100%" height="85%">
                                    <BarChart data={analyticalData.examStats}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px rgba(0,0,0,0.1)" }} />
                                        <Legend verticalAlign="top" height={36} />
                                        <Bar name="Average Score" dataKey="average" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                                        <Bar name="Highest Score" dataKey="highest" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        <Bar name="Lowest Score" dataKey="lowest" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* TREND ANALYSIS LINE CHART */}
                            <div className="glass-card" style={{ padding: "2rem", height: "450px" }}>
                                <h3 style={{ marginBottom: "1.5rem" }}>Performance Trend (%)</h3>
                                <ResponsiveContainer width="100%" height="85%">
                                    <AreaChart data={analyticalData.examStats}>
                                        <defs>
                                            <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis unit="%" axisLine={false} tickLine={false} domain={[0, 100]} />
                                        <Tooltip />
                                        <Area type="monotone" name="Avg Percentage" dataKey="avgPercentage" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorAvg)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* EXAM-WISE INSIGHTS TABLE */}
                        <div className="glass-card" style={{ marginTop: "2rem", padding: "2rem" }}>
                            <h3>Detailed Insights By Assessment</h3>
                            <div className="p-table-wrapper" style={{ marginTop: "1rem" }}>
                                <table className="p-table">
                                    <thead><tr><th>Exam</th><th>Average</th><th>Highest</th><th>Lowest</th><th>Max Marks</th><th>Pass Metric (%)</th></tr></thead>
                                    <tbody>
                                        {analyticalData.examStats.map((stat, i) => (
                                            <tr key={i}>
                                                <td><strong>{stat.name}</strong></td>
                                                <td>{stat.average}</td>
                                                <td style={{ color: "#10b981", fontWeight: "700" }}>{stat.highest}</td>
                                                <td style={{ color: "#f43f5e", fontWeight: "700" }}>{stat.lowest}</td>
                                                <td>{stat.maxPossible}</td>
                                                <td>
                                                    <div style={{ width: "100%", background: "rgba(0,0,0,0.05)", height: "8px", borderRadius: "10px", marginTop: "5px" }}>
                                                        <div style={{ width: `${stat.avgPercentage}%`, background: "var(--accent-primary)", height: "100%", borderRadius: "10px" }}></div>
                                                    </div>
                                                    <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{stat.avgPercentage}% Efficiency</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            <style>{`
                .nav-nested-group .nav-children { padding-left: 2.5rem; transition: all 0.3s; }
                .msg-p.err { color: #f43f5e; font-weight: 700; }
                .msg-p.ok { color: #10b981; font-weight: 700; }
                .btn-add.disabled { opacity: 0.5; cursor: not-allowed; }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default FacultyDashboard;
