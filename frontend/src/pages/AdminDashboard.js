import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import "./Dashboard.css";

const API_BASE = "http://127.0.0.1:5001";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState("students");

    // Upload state
    const [uploadUserLoading, setUploadUserLoading] = useState(false);
    const [uploadUserMessage, setUploadUserMessage] = useState("");
    const [uploadSubjectLoading, setUploadSubjectLoading] = useState(false);
    const [uploadSubjectMessage, setUploadSubjectMessage] = useState("");

    // Dashboard data
    const [stats, setStats] = useState({ total_users: 0, total_students: 0, total_faculty: 0, total_admins: 0 });
    const [roleDistribution, setRoleDistribution] = useState([]);
    const [courseData, setCourseData] = useState([]);

    // Table data
    const [students, setStudents] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [users, setUsers] = useState([]);
    const [subjects, setSubjects] = useState([]);

    // Search & pagination
    const [searchStudent, setSearchStudent] = useState("");
    const [searchFaculty, setSearchFaculty] = useState("");
    const [searchSubject, setSearchSubject] = useState("");
    const [pageStudent, setPageStudent] = useState(1);
    const [pageFaculty, setPageFaculty] = useState(1);
    const [pageUser, setPageUser] = useState(1);
    const [pageSubject, setPageSubject] = useState(1);
    const [totalPagesStudent, setTotalPagesStudent] = useState(1);
    const [totalPagesFaculty, setTotalPagesFaculty] = useState(1);
    const [totalPagesUser, setTotalPagesUser] = useState(1);
    const [totalPagesSubject, setTotalPagesSubject] = useState(1);

    // Profile edit state
    const [profileForm, setProfileForm] = useState({ name: "", email: "", current_password: "", new_password: "", confirm_password: "" });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMessage, setProfileMessage] = useState({ text: "", type: "" });

    // ─── Data Fetchers ───────────────────────────────────────────────────────

    const fetchStudentsData = useCallback(async (page) => {
        try {
            const res = await axios.get(`${API_BASE}/api/dashboard/students-list?page=${page}&search=${searchStudent}`);
            setStudents(res.data.data); setTotalPagesStudent(res.data.pages); setPageStudent(page);
        } catch (_) { }
    }, [searchStudent]);

    const fetchFacultyData = useCallback(async (page) => {
        try {
            const res = await axios.get(`${API_BASE}/api/dashboard/faculty-list?page=${page}&search=${searchFaculty}`);
            setFaculty(res.data.data); setTotalPagesFaculty(res.data.pages); setPageFaculty(page);
        } catch (_) { }
    }, [searchFaculty]);

    const fetchUsersData = useCallback(async (page) => {
        try {
            const res = await axios.get(`${API_BASE}/api/dashboard/users?page=${page}`);
            setUsers(res.data.data); setTotalPagesUser(res.data.pages); setPageUser(page);
        } catch (_) { }
    }, []);

    const fetchSubjectsData = useCallback(async (page) => {
        try {
            const res = await axios.get(`${API_BASE}/api/dashboard/subjects-list?page=${page}&search=${searchSubject}`);
            setSubjects(res.data.data); setTotalPagesSubject(res.data.pages); setPageSubject(page);
        } catch (_) { }
    }, [searchSubject]);

    const fetchDashboardData = useCallback(async () => {
        try {
            const [statsRes, roleRes, courseRes] = await Promise.all([
                axios.get(`${API_BASE}/api/dashboard/stats`),
                axios.get(`${API_BASE}/api/dashboard/role-distribution`),
                axios.get(`${API_BASE}/api/dashboard/students-by-course`),
            ]);
            setStats(statsRes.data);
            setRoleDistribution([
                { name: "Students", value: roleRes.data.students, fill: "#3b82f6" },
                { name: "Faculty", value: roleRes.data.faculty, fill: "#10b981" },
                { name: "Admins", value: roleRes.data.admins, fill: "#f43f5e" },
            ]);
            setCourseData(courseRes.data);
            fetchStudentsData(1); fetchFacultyData(1); fetchUsersData(1); fetchSubjectsData(1);
        } catch (err) { console.error("Dashboard fetch error:", err); }
    }, [fetchStudentsData, fetchFacultyData, fetchUsersData, fetchSubjectsData]);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (!userData) { navigate("/login"); return; }
        const parsed = JSON.parse(userData);
        if (parsed.role !== "admin") { navigate("/"); return; }
        setUser(parsed);
        setProfileForm(f => ({ ...f, name: parsed.name || "", email: parsed.email || "" }));
        fetchDashboardData();
    }, [navigate, fetchDashboardData]);

    // ─── Handlers ────────────────────────────────────────────────────────────

    const handleProfileChange = (e) => {
        setProfileForm(f => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        if (profileForm.new_password && profileForm.new_password !== profileForm.confirm_password) {
            setProfileMessage({ text: "New passwords do not match.", type: "error" });
            return;
        }
        setProfileLoading(true);
        setProfileMessage({ text: "", type: "" });
        try {
            const payload = {
                id: user.id,
                name: profileForm.name,
                email: profileForm.email,
                current_password: profileForm.current_password,
                new_password: profileForm.new_password,
            };
            const res = await axios.put(`${API_BASE}/api/admin/profile`, payload);
            const updatedUser = { ...user, name: res.data.name, email: res.data.email };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setProfileForm(f => ({ ...f, current_password: "", new_password: "", confirm_password: "" }));
            setProfileMessage({ text: "Profile updated successfully!", type: "success" });
        } catch (err) {
            const msg = err.response?.data?.error || "Update failed. Please try again.";
            setProfileMessage({ text: msg, type: "error" });
        } finally {
            setProfileLoading(false);
        }
    };

    const handleUserUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setUploadUserLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await axios.post(`${API_BASE}/upload/users`, formData, { headers: { "Content-Type": "multipart/form-data" } });
            setUploadUserMessage(res.data.message || "Upload successful!");
            setTimeout(() => { setUploadUserMessage(""); fetchDashboardData(); }, 3000);
        } catch (_) {
            setUploadUserMessage("Upload failed");
            setTimeout(() => setUploadUserMessage(""), 3000);
        } finally { setUploadUserLoading(false); event.target.value = ""; }
    };

    const handleSubjectUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setUploadSubjectLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await axios.post(`${API_BASE}/upload/subjects`, formData, { headers: { "Content-Type": "multipart/form-data" } });
            setUploadSubjectMessage(res.data.message || "Upload successful!");
            setTimeout(() => { setUploadSubjectMessage(""); fetchSubjectsData(1); }, 3000);
        } catch (_) {
            setUploadSubjectMessage("Upload failed");
            setTimeout(() => setUploadSubjectMessage(""), 3000);
        } finally { setUploadSubjectLoading(false); event.target.value = ""; }
    };

    const logout = () => { localStorage.removeItem("user"); navigate("/login"); };

    if (!user) return null;

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="premium-dashboard">
            {/* SIDEBAR */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <span className="logo-icon">💠</span>
                    <h2>JIMS ROHINI</h2>
                </div>
                <nav className="sidebar-nav">
                    {[
                        { id: "students", icon: "🎓", label: "Students" },
                        { id: "faculty", icon: "👨‍🏫", label: "Faculty" },
                        { id: "subjects", icon: "📘", label: "Subjects" },
                        { id: "users", icon: "👥", label: "Users" },
                        { id: "profile", icon: "✏️", label: "Edit Profile" },
                    ].map(({ id, icon, label }) => (
                        <button key={id} className={activeTab === id ? "active" : ""} onClick={() => setActiveTab(id)}>
                            <span className="nav-icon">{icon}</span> {label}
                        </button>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <button onClick={logout} className="btn-logout">Logout</button>
                </div>
            </aside>

            {/* MAIN */}
            <main className="main-content">
                <header className="main-header">
                    <div className="header-info">
                        <h1>{activeTab === "profile" ? "Edit Profile" : "Admin Overview"}</h1>
                        <p>{activeTab === "profile" ? "Manage your account details and password" : "Real-time system analytics and management"}</p>
                    </div>
                    <div className="header-profile">
                        <div className="profile-info">
                            <span className="name">{user.name}</span>
                            <span className="role">Administrator</span>
                        </div>
                        <div className="profile-avatar">{user.name?.[0]?.toUpperCase() || "A"}</div>
                    </div>
                </header>

                {/* ── EDIT PROFILE TAB ── */}
                {activeTab === "profile" && (
                    <section className="profile-section">
                        <div className="glass-card profile-card">
                            <div className="profile-card-header">
                                <div className="profile-avatar-lg">{user.name?.[0]?.toUpperCase() || "A"}</div>
                                <div>
                                    <h2 className="profile-card-name">{user.name}</h2>
                                    <span className="profile-card-role">Administrator</span>
                                </div>
                            </div>

                            <form className="profile-form" onSubmit={handleProfileSave}>
                                <div className="profile-form-group">
                                    <label className="profile-label">Full Name</label>
                                    <input
                                        className="profile-input"
                                        type="text"
                                        name="name"
                                        value={profileForm.name}
                                        onChange={handleProfileChange}
                                        placeholder="Your full name"
                                        required
                                    />
                                </div>
                                <div className="profile-form-group">
                                    <label className="profile-label">Email Address</label>
                                    <input
                                        className="profile-input"
                                        type="email"
                                        name="email"
                                        value={profileForm.email}
                                        onChange={handleProfileChange}
                                        placeholder="Your email"
                                        required
                                    />
                                </div>

                                <div className="profile-divider">
                                    <span>Change Password <span className="profile-optional">(optional)</span></span>
                                </div>

                                <div className="profile-form-group">
                                    <label className="profile-label">Current Password</label>
                                    <input
                                        className="profile-input"
                                        type="password"
                                        name="current_password"
                                        value={profileForm.current_password}
                                        onChange={handleProfileChange}
                                        placeholder="Required only if changing password"
                                    />
                                </div>
                                <div className="profile-form-row">
                                    <div className="profile-form-group">
                                        <label className="profile-label">New Password</label>
                                        <input
                                            className="profile-input"
                                            type="password"
                                            name="new_password"
                                            value={profileForm.new_password}
                                            onChange={handleProfileChange}
                                            placeholder="Min. 6 characters"
                                        />
                                    </div>
                                    <div className="profile-form-group">
                                        <label className="profile-label">Confirm New Password</label>
                                        <input
                                            className="profile-input"
                                            type="password"
                                            name="confirm_password"
                                            value={profileForm.confirm_password}
                                            onChange={handleProfileChange}
                                            placeholder="Repeat new password"
                                        />
                                    </div>
                                </div>

                                {profileMessage.text && (
                                    <div className={`profile-message ${profileMessage.type}`}>
                                        {profileMessage.type === "success" ? "✅" : "⚠️"} {profileMessage.text}
                                    </div>
                                )}

                                <button type="submit" className="profile-save-btn" disabled={profileLoading}>
                                    {profileLoading ? "Saving..." : "Save Changes"}
                                </button>
                            </form>
                        </div>
                    </section>
                )}

                {/* ── DASHBOARD TABS ── */}
                {activeTab !== "profile" && (
                    <>
                        {/* STATS */}
                        <section className="stats-section">
                            {[
                                { label: "Total Users", icon: "👥", value: stats.total_users },
                                { label: "Active Students", icon: "📚", value: stats.total_students },
                                { label: "Faculty Members", icon: "👨‍🏫", value: stats.total_faculty },
                                { label: "System Admins", icon: "🛡️", value: stats.total_admins },
                            ].map(({ label, icon, value }) => (
                                <div key={label} className="glass-card stat-card-p">
                                    <div className="stat-p-header">
                                        <span className="stat-p-label">{label}</span>
                                        <span className="stat-p-icon">{icon}</span>
                                    </div>
                                    <div className="stat-p-value">{value}</div>
                                </div>
                            ))}
                        </section>

                        {/* CHARTS */}
                        <section className="charts-section">
                            <div className="glass-card chart-container">
                                <h3>Distribution by Role</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {roleDistribution.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="glass-card chart-container">
                                <h3>Students per Course</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={courseData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="course" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        {/* UPLOADS */}
                        <section className="upload-section">
                            <div className="glass-card upload-mini">
                                <h4>Bulk Users</h4>
                                <input type="file" id="up-users" hidden onChange={handleUserUpload} />
                                <label htmlFor="up-users" className={uploadUserLoading ? "upload-btn loading" : "upload-btn"}>
                                    {uploadUserLoading ? "Syncing..." : "Upload CSV"}
                                </label>
                                {uploadUserMessage && <p className="msg-ok">{uploadUserMessage}</p>}
                            </div>
                            <div className="glass-card upload-mini">
                                <h4>Bulk Subjects</h4>
                                <input type="file" id="up-subjects" hidden onChange={handleSubjectUpload} />
                                <label htmlFor="up-subjects" className={uploadSubjectLoading ? "upload-btn loading" : "upload-btn"}>
                                    {uploadSubjectLoading ? "Syncing..." : "Upload CSV"}
                                </label>
                                {uploadSubjectMessage && <p className="msg-ok">{uploadSubjectMessage}</p>}
                            </div>
                        </section>

                        {/* DATA TABLE */}
                        <section className="table-section">
                            <div className="glass-card table-container-p">
                                <div className="table-header-p">
                                    <h3>Data Repository — {activeTab.toUpperCase()}</h3>
                                    <input
                                        type="text"
                                        placeholder={`Search ${activeTab}...`}
                                        onChange={(e) => {
                                            if (activeTab === "students") { setSearchStudent(e.target.value); fetchStudentsData(1); }
                                            if (activeTab === "faculty") { setSearchFaculty(e.target.value); fetchFacultyData(1); }
                                            if (activeTab === "subjects") { setSearchSubject(e.target.value); fetchSubjectsData(1); }
                                        }}
                                    />
                                </div>
                                <div className="p-table-wrapper">
                                    <table className="p-table">
                                        <thead>
                                            {activeTab === "students" && <tr><th>Name</th><th>Email</th><th>Enrollment</th><th>Course</th><th>Sem</th></tr>}
                                            {activeTab === "faculty" && <tr><th>Name</th><th>Email</th><th>Department</th></tr>}
                                            {activeTab === "subjects" && <tr><th>Subject</th><th>Code</th><th>Sem</th><th>Faculty</th></tr>}
                                            {activeTab === "users" && <tr><th>Name</th><th>Email</th><th>Role</th></tr>}
                                        </thead>
                                        <tbody>
                                            {activeTab === "students" && students.map(s => (
                                                <tr key={s.id}><td>{s.name}</td><td>{s.email}</td><td>{s.enrollment_number}</td><td>{s.course}</td><td>{s.semester}</td></tr>
                                            ))}
                                            {activeTab === "faculty" && faculty.map(f => (
                                                <tr key={f.id}><td>{f.name}</td><td>{f.email}</td><td>{f.department}</td></tr>
                                            ))}
                                            {activeTab === "subjects" && subjects.map(s => (
                                                <tr key={s.id}><td>{s.name}</td><td>{s.code}</td><td>{s.semester}</td><td>{s.faculty_name}</td></tr>
                                            ))}
                                            {activeTab === "users" && users.map(u => (
                                                <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td><span className={`badge-p ${u.role}`}>{u.role}</span></td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="pagination">
                                    {activeTab === "students" && Array.from({ length: totalPagesStudent }, (_, i) => i + 1).map(p => (
                                        <button key={p} className={p === pageStudent ? "active" : ""} onClick={() => fetchStudentsData(p)}>{p}</button>
                                    ))}
                                    {activeTab === "faculty" && Array.from({ length: totalPagesFaculty }, (_, i) => i + 1).map(p => (
                                        <button key={p} className={p === pageFaculty ? "active" : ""} onClick={() => fetchFacultyData(p)}>{p}</button>
                                    ))}
                                    {activeTab === "users" && Array.from({ length: totalPagesUser }, (_, i) => i + 1).map(p => (
                                        <button key={p} className={p === pageUser ? "active" : ""} onClick={() => fetchUsersData(p)}>{p}</button>
                                    ))}
                                    {activeTab === "subjects" && Array.from({ length: totalPagesSubject }, (_, i) => i + 1).map(p => (
                                        <button key={p} className={p === pageSubject ? "active" : ""} onClick={() => fetchSubjectsData(p)}>{p}</button>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;