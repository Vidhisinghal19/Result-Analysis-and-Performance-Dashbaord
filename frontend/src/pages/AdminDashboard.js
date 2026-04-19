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
    const [activeTab, setActiveTab] = useState("overview");

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
    const [allFaculty, setAllFaculty] = useState([]);
    const [batches, setBatches] = useState([]);
    const [allCourses, setAllCourses] = useState([]);
    const [coursesList, setCoursesList] = useState([]);
    const [batchesList, setBatchesList] = useState([]);
    const [semesters, setSemesters] = useState([]);

    // Search & pagination
    const [searchStudent, setSearchStudent] = useState("");
    const [searchFaculty, setSearchFaculty] = useState("");
    const [searchSubject, setSearchSubject] = useState("");
    const [searchCourse, setSearchCourse] = useState("");
    const [searchBatch, setSearchBatch] = useState("");
    const [searchUser, setSearchUser] = useState("");

    // Filters
    const [fStudentCourse, setFStudentCourse] = useState("");
    const [fStudentBatch, setFStudentBatch] = useState("");
    const [fFacultyDept, setFFacultyDept] = useState("");
    const [fSubjectSem, setFSubjectSem] = useState("");
    const [fSubjectFaculty, setFSubjectFaculty] = useState("");
    const [fUserRole, setFUserRole] = useState("");
    const [fBatchCourse, setFBatchCourse] = useState("");
    const [pageStudent, setPageStudent] = useState(1);
    const [pageFaculty, setPageFaculty] = useState(1);
    const [pageUser, setPageUser] = useState(1);
    const [pageSubject, setPageSubject] = useState(1);
    const [pageCourse, setPageCourse] = useState(1);
    const [pageBatch, setPageBatch] = useState(1);
    const [totalPagesStudent, setTotalPagesStudent] = useState(1);
    const [totalPagesFaculty, setTotalPagesFaculty] = useState(1);
    const [totalPagesUser, setTotalPagesUser] = useState(1);
    const [totalPagesSubject, setTotalPagesSubject] = useState(1);
    const [totalPagesCourse, setTotalPagesCourse] = useState(1);
    const [totalPagesBatch, setTotalPagesBatch] = useState(1);

    // Profile edit state
    const [profileForm, setProfileForm] = useState({ name: "", email: "", current_password: "", new_password: "", confirm_password: "" });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMessage, setProfileMessage] = useState({ text: "", type: "" });

    // CRUD Modal state
    const [crudModal, setCrudModal] = useState({ open: false, action: "add", type: "" });
    const [crudForm, setCrudForm] = useState({});
    const [crudLoading, setCrudLoading] = useState(false);
    const [crudMessage, setCrudMessage] = useState({ text: "", type: "" });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, type: "" });

    // ─── Data Fetchers ───────────────────────────────────────────────────────

    const fetchStudentsData = useCallback(async (page) => {
        try {
            const res = await axios.get(`${API_BASE}/api/dashboard/students-list?page=${page}&search=${searchStudent}&course_id=${fStudentCourse}&batch_id=${fStudentBatch}`);
            setStudents(res.data.data); setTotalPagesStudent(res.data.pages); setPageStudent(page);
        } catch (_) { }
    }, [searchStudent, fStudentCourse, fStudentBatch]);

    const fetchFacultyData = useCallback(async (page) => {
        try {
            const res = await axios.get(`${API_BASE}/api/dashboard/faculty-list?page=${page}&search=${searchFaculty}&department=${fFacultyDept}`);
            setFaculty(res.data.data); setTotalPagesFaculty(res.data.pages); setPageFaculty(page);
        } catch (_) { }
    }, [searchFaculty, fFacultyDept]);

    const fetchUsersData = useCallback(async (page) => {
        try {
            const res = await axios.get(`${API_BASE}/api/dashboard/users?page=${page}&search=${searchUser}&role=${fUserRole}`);
            setUsers(res.data.data); setTotalPagesUser(res.data.pages); setPageUser(page);
        } catch (_) { }
    }, [searchUser, fUserRole]);

    const fetchSubjectsData = useCallback(async (page) => {
        try {
            const res = await axios.get(`${API_BASE}/api/dashboard/subjects-list?page=${page}&search=${searchSubject}&faculty_id=${fSubjectFaculty}&semester_id=${fSubjectSem}`);
            setSubjects(res.data.data); setTotalPagesSubject(res.data.pages); setPageSubject(page);
        } catch (_) { }
    }, [searchSubject, fSubjectFaculty, fSubjectSem]);

    const fetchAllFaculty = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/dashboard/all-faculty`);
            setAllFaculty(res.data);
        } catch (_) { }
    }, []);

    const fetchBatches = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/admin/batches`);
            setBatches(res.data);
        } catch (_) { }
    }, []);

    const fetchAllCourses = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/admin/courses`);
            setAllCourses(res.data);
        } catch (_) { }
    }, []);

    const fetchCoursesListData = useCallback(async (page) => {
        try {
            const res = await axios.get(`${API_BASE}/api/dashboard/courses-list?page=${page}&search=${searchCourse}`);
            setCoursesList(res.data.data); setTotalPagesCourse(res.data.pages); setPageCourse(page);
        } catch (_) { }
    }, [searchCourse]);

    const fetchBatchesListData = useCallback(async (page) => {
        try {
            const res = await axios.get(`${API_BASE}/api/dashboard/batches-list?page=${page}&search=${searchBatch}&course_id=${fBatchCourse}`);
            setBatchesList(res.data.data); setTotalPagesBatch(res.data.pages); setPageBatch(page);
        } catch (_) { }
    }, [searchBatch, fBatchCourse]);

    const fetchSemesters = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/admin/semesters`);
            setSemesters(res.data);
        } catch (_) { }
    }, []);

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
            fetchStudentsData(1); fetchFacultyData(1); fetchUsersData(1); fetchSubjectsData(1); fetchAllFaculty(); fetchBatches(); fetchSemesters();
            fetchCoursesListData(1); fetchBatchesListData(1); fetchAllCourses();
        } catch (err) { console.error("Dashboard fetch error:", err); }
    }, [fetchStudentsData, fetchFacultyData, fetchUsersData, fetchSubjectsData, fetchAllFaculty, fetchBatches, fetchSemesters, fetchCoursesListData, fetchBatchesListData, fetchAllCourses]);

    useEffect(() => {
        if (activeTab === "students") fetchStudentsData(1);
        if (activeTab === "faculty") fetchFacultyData(1);
        if (activeTab === "subjects") fetchSubjectsData(1);
        if (activeTab === "users") fetchUsersData(1);
        if (activeTab === "batches") fetchBatchesListData(1);
        if (activeTab === "courses") fetchCoursesListData(1);
    }, [activeTab, searchStudent, searchFaculty, searchSubject, searchCourse, searchBatch, searchUser,
        fStudentCourse, fStudentBatch, fFacultyDept, fSubjectSem, fSubjectFaculty, fUserRole, fBatchCourse,
        fetchStudentsData, fetchFacultyData, fetchSubjectsData, fetchUsersData, fetchBatchesListData, fetchCoursesListData]);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (!userData) { navigate("/login"); return; }
        const parsed = JSON.parse(userData);
        if (parsed.role !== "admin") { navigate("/"); return; }
        setUser(parsed);
        setProfileForm(f => ({ ...f, name: parsed.name || "", email: parsed.email || "" }));
        fetchDashboardData();
    }, [navigate, fetchDashboardData]);

    // ─── CRUD Handlers ──────────────────────────────────────────────────────

    const openCrudModal = (action, type, item = null) => {
        setCrudForm(item || {});
        setCrudMessage({ text: "", type: "" });
        setCrudModal({ open: true, action, type });
    };

    const closeCrudModal = useCallback(() => {
        setCrudModal({ open: false, action: "", type: "" });
        setCrudForm({});
        setCrudMessage({ text: "", type: "" });
    }, []);

    const handleCrudFormChange = useCallback((e) => {
        setCrudForm(f => ({ ...f, [e.target.name]: e.target.value }));
    }, []);

    const handleCrudSave = async () => {
        setCrudLoading(true);
        setCrudMessage({ text: "", type: "" });
        try {
            let endpoint = "";
            let method = "";
            let payload = {};

            // Build payload based on type
            if (crudModal.type === "student") {
                // Validate required fields for students
                if (!crudForm.name || !crudForm.email || !crudForm.enrollment_number) {
                    setCrudMessage({ text: "Name, Email, and Enrollment Number are required!", type: "error" });
                    setCrudLoading(false);
                    return;
                }
                payload = {
                    name: crudForm.name,
                    email: crudForm.email,
                    enrollment_number: crudForm.enrollment_number,
                    batch_id: crudForm.batch_id,
                    current_semester_id: crudForm.current_semester_id || null
                };
                if (crudModal.action === "add") {
                    endpoint = `${API_BASE}/api/admin/student`;
                    method = "POST";
                    payload.password = crudForm.password || "jims@123456";
                } else {
                    endpoint = `${API_BASE}/api/admin/student/${crudForm.id}`;
                    method = "PUT";
                }
            } else if (crudModal.type === "faculty") {
                // Validate required fields for faculty
                if (!crudForm.name || !crudForm.email) {
                    setCrudMessage({ text: "Name and Email are required!", type: "error" });
                    setCrudLoading(false);
                    return;
                }
                payload = {
                    name: crudForm.name,
                    email: crudForm.email,
                    department: crudForm.department || ""
                };
                if (crudModal.action === "add") {
                    endpoint = `${API_BASE}/api/admin/faculty`;
                    method = "POST";
                    payload.password = crudForm.password || "jims@123456";
                } else {
                    endpoint = `${API_BASE}/api/admin/faculty/${crudForm.id}`;
                    method = "PUT";
                }
            } else if (crudModal.type === "user") {
                // Validate required fields for users
                if (!crudForm.name || !crudForm.email || !crudForm.role) {
                    setCrudMessage({ text: "Name, Email, and Role are required!", type: "error" });
                    setCrudLoading(false);
                    return;
                }
                payload = {
                    name: crudForm.name,
                    email: crudForm.email,
                    role: crudForm.role
                };
                if (crudModal.action === "add") {
                    endpoint = `${API_BASE}/api/admin/user`;
                    method = "POST";
                    payload.password = crudForm.password || "jims@123456";
                } else {
                    endpoint = `${API_BASE}/api/admin/user/${crudForm.id}`;
                    method = "PUT";
                }
            } else if (crudModal.type === "subject") {
                if (!crudForm.name || !crudForm.code) {
                    setCrudMessage({ text: "Name and Code are required!", type: "error" });
                    setCrudLoading(false);
                    return;
                }
                payload = {
                    name: crudForm.name,
                    code: crudForm.code,
                    faculty_id: crudForm.faculty_id || null,
                    semester_id: crudForm.semester_id || null
                };

                if (crudModal.action === "add") {
                    endpoint = `${API_BASE}/api/admin/subject`;
                    method = "POST";
                } else {
                    endpoint = `${API_BASE}/api/admin/subject/${crudForm.id}`;
                    method = "PUT";
                }
            } else if (crudModal.type === "course") {
                if (!crudForm.name || !crudForm.code) {
                    setCrudMessage({ text: "Name and Code are required!", type: "error" });
                    setCrudLoading(false); return;
                }
                payload = { name: crudForm.name, code: crudForm.code };
                if (crudModal.action === "add") {
                    endpoint = `${API_BASE}/api/admin/course`;
                    method = "POST";
                } else {
                    endpoint = `${API_BASE}/api/admin/course/${crudForm.id}`;
                    method = "PUT";
                }
            } else if (crudModal.type === "batch") {
                if (!crudForm.name || !crudForm.course_id) {
                    setCrudMessage({ text: "Name and Course are required!", type: "error" });
                    setCrudLoading(false); return;
                }
                payload = {
                    name: crudForm.name,
                    course_id: crudForm.course_id,
                    start_year: crudForm.start_year,
                    end_year: crudForm.end_year,
                    num_semesters: crudForm.num_semesters || 0
                };
                if (crudModal.action === "add") {
                    endpoint = `${API_BASE}/api/admin/batch`;
                    method = "POST";
                } else {
                    endpoint = `${API_BASE}/api/admin/batch/${crudForm.id}`;
                    method = "PUT";
                }
            }

            if (!endpoint) {
                setCrudMessage({ text: "Invalid operation type!", type: "error" });
                setCrudLoading(false);
                return;
            }

            const res = method === "POST" ? await axios.post(endpoint, payload) : await axios.put(endpoint, payload);
            setCrudMessage({ text: res.data.message || "Updated successfully!", type: "success" });

            // Immediately refresh the relevant table data so changes are visible
            const refreshAndClose = async () => {
                try {
                    if (crudModal.type === "student") {
                        await fetchStudentsData(pageStudent);
                        fetchDashboardData();
                    } else if (crudModal.type === "faculty") {
                        await fetchFacultyData(pageFaculty);
                        fetchDashboardData();
                    } else if (crudModal.type === "user") {
                        await fetchUsersData(pageUser);
                    } else if (crudModal.type === "subject") {
                        await fetchSubjectsData(pageSubject);
                    } else if (crudModal.type === "course") {
                        await fetchCoursesListData(pageCourse);
                        fetchDashboardData();
                    } else if (crudModal.type === "batch") {
                        await fetchBatchesListData(pageBatch);
                        await fetchBatches();
                        fetchDashboardData();
                    }
                } finally {
                    // Close modal after refresh is done
                    setTimeout(() => closeCrudModal(), 600);
                }
            };

            setTimeout(() => refreshAndClose(), 400);

        } catch (err) {
            console.error("CRUD Error:", err);
            const msg = err.response?.data?.error || err.message || "Operation failed!";
            setCrudMessage({ text: msg, type: "error" });
        } finally {
            setCrudLoading(false);
        }
    };

    const handleDelete = async () => {
        setCrudLoading(true);
        try {
            let endpoint = `${API_BASE}/api/admin/${deleteConfirm.type}/${deleteConfirm.id}`;
            await axios.delete(endpoint);
            setCrudMessage({ text: "Deleted successfully!", type: "success" });

            setTimeout(() => {
                setDeleteConfirm({ open: false, id: null, type: "" });

                // Only refresh the relevant data
                if (deleteConfirm.type === "student") {
                    fetchStudentsData(pageStudent);
                } else if (deleteConfirm.type === "faculty") {
                    fetchFacultyData(pageFaculty);
                } else if (deleteConfirm.type === "user") {
                    fetchUsersData(pageUser);
                } else if (deleteConfirm.type === "subject") {
                    fetchSubjectsData(pageSubject);
                } else if (deleteConfirm.type === "course") {
                    fetchCoursesListData(pageCourse);
                    fetchDashboardData();
                } else if (deleteConfirm.type === "batch") {
                    fetchBatchesListData(pageBatch);
                    fetchBatches();
                    fetchDashboardData();
                }

                // Update stats without full refresh
                axios.get(`${API_BASE}/api/dashboard/stats`).then(res => setStats(res.data)).catch(() => { });
            }, 1000);
        } catch (err) {
            const msg = err.response?.data?.error || "Delete failed!";
            setCrudMessage({ text: msg, type: "error" });
            setTimeout(() => setDeleteConfirm({ open: false, id: null, type: "" }), 2000);
        } finally {
            setCrudLoading(false);
        }
    };

    // ─── Other Handlers ─────────────────────────────────────────────────────

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
        } catch (err) {
            const msg = err.response?.data?.error || "Upload failed";
            setUploadUserMessage(msg);
            setTimeout(() => setUploadUserMessage(""), 5000);
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
        } catch (err) {
            const msg = err.response?.data?.error || "Upload failed";
            setUploadSubjectMessage(msg);
            setTimeout(() => setUploadSubjectMessage(""), 5000);
        } finally { setUploadSubjectLoading(false); event.target.value = ""; }
    };

    const logout = () => { localStorage.removeItem("user"); navigate("/login"); };

    if (!user) return null;

    // ─── DELETE CONFIRM MODAL ───────────────────────────────────────────────

    const DeleteConfirmModal = () => {
        if (!deleteConfirm.open) return null;

        return (
            <div className="modal-overlay" onClick={(e) => {
                if (e.target === e.currentTarget && !crudLoading) {
                    setDeleteConfirm({ open: false, id: null, type: "" });
                }
            }}>
                <div className="modal-content modal-confirm" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>Confirm Delete</h3>
                    </div>
                    <div className="modal-body">
                        <p>Are you sure you want to delete this {deleteConfirm.type}? This action cannot be undone.</p>
                    </div>
                    <div className="modal-footer">
                        <button className="btn-cancel" onClick={() => setDeleteConfirm({ open: false, id: null, type: "" })} disabled={crudLoading}>Cancel</button>
                        <button className="btn-delete" onClick={handleDelete} disabled={crudLoading}>
                            {crudLoading ? "Deleting..." : "Delete"}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="premium-dashboard">
            <CrudFormComponent
                crudModal={crudModal}
                crudForm={crudForm}
                crudLoading={crudLoading}
                crudMessage={crudMessage}
                handleCrudFormChange={handleCrudFormChange}
                handleCrudSave={handleCrudSave}
                closeCrudModal={closeCrudModal}
                allFaculty={allFaculty}
                batches={batches}
                semesters={semesters}
                allCourses={allCourses}
            />
            <DeleteConfirmModal />

            {/* SIDEBAR */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <span className="logo-icon">JIMS</span>
                    <h2>ADMIN PANEL</h2>
                </div>
                <nav className="sidebar-nav">
                    <div className="nav-group-separator">CORE</div>
                    <button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>
                        <span className="nav-icon">🏠</span> Dashboard
                    </button>
                    <button className={activeTab === "analytics" ? "active" : ""} onClick={() => setActiveTab("analytics")}>
                        <span className="nav-icon">📊</span> Analytics
                    </button>

                    <div className="nav-group-separator">MANAGEMENT</div>
                    <button className={activeTab === "students" ? "active" : ""} onClick={() => setActiveTab("students")}>
                        <span className="nav-icon">🎓</span> Students
                    </button>
                    <button className={activeTab === "faculty" ? "active" : ""} onClick={() => setActiveTab("faculty")}>
                        <span className="nav-icon">👨‍🏫</span> Faculty
                    </button>
                    <button className={activeTab === "subjects" ? "active" : ""} onClick={() => setActiveTab("subjects")}>
                        <span className="nav-icon">📘</span> Subjects
                    </button>
                    <button className={activeTab === "users" ? "active" : ""} onClick={() => setActiveTab("users")}>
                        <span className="nav-icon">👥</span> User Access
                    </button>

                    <div className="nav-group-separator">CONFIGURATION</div>
                    <button className={activeTab === "courses" ? "active" : ""} onClick={() => setActiveTab("courses")}>
                        <span className="nav-icon">🏫</span> Courses
                    </button>
                    <button className={activeTab === "batches" ? "active" : ""} onClick={() => setActiveTab("batches")}>
                        <span className="nav-icon">📅</span> Batches
                    </button>

                    <div className="nav-group-separator">RESOURCES</div>
                    <button className={activeTab === "uploads" ? "active" : ""} onClick={() => setActiveTab("uploads")}>
                        <span className="nav-icon">📤</span> Bulk Upload
                    </button>
                    <button className={activeTab === "guidelines" ? "active" : ""} onClick={() => setActiveTab("guidelines")}>
                        <span className="nav-icon">📋</span> Instructions
                    </button>

                    <div className="nav-group-separator">PREFERENCES</div>
                    <button className={activeTab === "profile" ? "active" : ""} onClick={() => setActiveTab("profile")}>
                        <span className="nav-icon">👤</span> My Profile
                    </button>

                    <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                        <button onClick={logout} className="btn-logout">
                            <span>🚪</span> Logout
                        </button>
                    </div>
                </nav>
            </aside>

            {/* MAIN */}
            <main className="main-content">
                <header className="main-header">
                    <div className="header-info">
                        <h1>{
                            activeTab === "overview" ? "Admin Command Center" :
                                activeTab === "analytics" ? "System Analytics" :
                                    activeTab === "profile" ? "Edit Profile" :
                                        activeTab === "guidelines" ? "Upload Guidelines" :
                                            activeTab === "uploads" ? "Bulk Upload" :
                                                "Data Repository"
                        }</h1>
                        <p>{
                            activeTab === "overview" ? "Real-time system overview and key metrics" :
                                activeTab === "analytics" ? "In-depth distribution and enrollment analysis" :
                                    activeTab === "profile" ? "Manage your account details and security" :
                                        activeTab === "guidelines" ? "Instructions for CSV data preparation" :
                                            activeTab === "uploads" ? "Bulk import users and subjects via CSV" :
                                                `Managing ${activeTab} — Intelligent Result Analysis System`
                        }</p>
                    </div>
                    <div className="header-profile glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 1.25rem', borderRadius: '12px' }}>
                        <div className="profile-info" style={{ textAlign: 'right' }}>
                            <span className="name" style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', color: 'var(--accent-primary)' }}>{user.name}</span>
                            <span className="role" style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>System Administrator</span>
                        </div>
                        <div className="profile-avatar" style={{ width: '38px', height: '38px', fontSize: '0.9rem', borderRadius: '10px' }}>
                            {user.name?.[0]?.toUpperCase() || "A"}
                        </div>
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

                {/* ── GUIDELINES TAB ── */}
                {activeTab === "guidelines" && (
                    <section className="guidelines-section">
                        <div className="glass-card guidelines-card">
                            <div className="guidelines-header">
                                <h2>Bulk Upload Instructions</h2>
                                <p>Follow these structural requirements to ensure successful CSV uploads.</p>
                            </div>

                            <div className="guidelines-grid">
                                <div className="guideline-item">
                                    <div className="guideline-icon">👥</div>
                                    <h3>Users CSV</h3>
                                    <ul>
                                        <li><strong>name:</strong> Required (Full Name)</li>
                                        <li><strong>email:</strong> Required (Unique Email)</li>
                                        <li><strong>password:</strong> Optional (Default: jims@123456)</li>
                                        <li><strong>role:</strong> Required (student / faculty / admin)</li>
                                        <li><strong>enrollment_number:</strong> Required for students</li>
                                        <li><strong>batch_name:</strong> Required for students (e.g. 2024-2027)</li>
                                        <li><strong>department:</strong> Required for faculty</li>
                                    </ul>
                                </div>

                                <div className="guideline-item">
                                    <div className="guideline-icon">📘</div>
                                    <h3>Subjects CSV</h3>
                                    <ul>
                                        <li><strong>name:</strong> Required (Subject Title)</li>
                                        <li><strong>code:</strong> Required (Unique Code)</li>
                                        <li><strong>batch_name:</strong> Required (Target Batch)</li>
                                        <li><strong>semester_number:</strong> Required (e.g. 1, 2)</li>
                                        <li><strong>faculty_email:</strong> Optional (Assigns Teacher)</li>
                                        <li><strong>type:</strong> Optional (core / elective)</li>
                                        <li><strong>credits:</strong> Optional (Number)</li>
                                    </ul>
                                </div>

                                <div className="guideline-item">
                                    <div className="guideline-icon">📊</div>
                                    <h3>Marks Upload</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '10px' }}>
                                        Marks are now uploaded within an <strong>Exam Context</strong> through the Faculty Dashboard.
                                    </p>
                                    <ul>
                                        <li><strong>enrollment_number:</strong> Required (Unique ID)</li>
                                        <li><strong>marks_obtained:</strong> Required (Score)</li>
                                        <li><strong>Note:</strong> Subject and Max Marks are automatically derived from the selected Exam context.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="guidelines-footer">
                                <div className="info-alert">
                                    <span>ℹ️</span>
                                    <p>Ensure that all Batches and Courses are created in the system BEFORE uploading Students or Subjects that reference them.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── OVERVIEW TAB ── */}
                {activeTab === "overview" && (
                    <>
                        <section className="stats-section">
                            {[
                                { label: "Total Users", icon: "👥", value: stats.total_users, sub: "Registered accounts", color: "rgba(59, 130, 246, 0.1)" },
                                { label: "Active Students", icon: "🎓", value: stats.total_students, sub: "Total enrollment", color: "rgba(16, 185, 129, 0.1)" },
                                { label: "Faculty Members", icon: "👨‍🏫", value: stats.total_faculty, sub: "Teaching staff", color: "rgba(139, 92, 246, 0.1)" },
                                { label: "System Admins", icon: "🛡️", value: stats.total_admins, sub: "Platform managers", color: "rgba(244, 63, 94, 0.1)" },
                            ].map(({ label, icon, value, sub, color }) => (
                                <div key={label} className="glass-card stat-card-p" style={{ borderLeft: `4px solid ${color === 'rgba(59, 130, 246, 0.1)' ? '#3b82f6' : color === 'rgba(16, 185, 129, 0.1)' ? '#10b981' : color === 'rgba(139, 92, 246, 0.1)' ? '#8b5cf6' : '#f43f5e'}` }}>
                                    <div className="stat-p-header">
                                        <span className="stat-p-label">{label}</span>
                                        <div style={{ background: color, padding: '8px', borderRadius: '10px' }}>
                                            <span className="stat-p-icon">{icon}</span>
                                        </div>
                                    </div>
                                    <div className="stat-p-value">{value}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '6px', opacity: 0.7 }}>{sub}</div>
                                </div>
                            ))}
                        </section>

                        <section style={{ marginBottom: '2rem' }}>
                            <div className="glass-card" style={{ padding: '2rem' }}>
                                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.2rem' }}>🚀</span> Quick Access Management
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                    {[
                                        { icon: '🎓', label: 'Students', tab: 'students', color: '#3b82f6', desc: 'Manage profiles' },
                                        { icon: '👨‍🏫', label: 'Faculty', tab: 'faculty', color: '#10b981', desc: 'Staff directory' },
                                        { icon: '📘', label: 'Subjects', tab: 'subjects', color: '#8b5cf6', desc: 'Curriculum' },
                                        { icon: '🏫', label: 'Courses', tab: 'courses', color: '#f59e0b', desc: 'Degree programs' },
                                        { icon: '📅', label: 'Batches', tab: 'batches', color: '#ec4899', desc: 'Session cohorts' },
                                        { icon: '📤', label: 'Upload Data', tab: 'uploads', color: '#06b6d4', desc: 'Bulk CSV import' },
                                    ].map(({ icon, label, tab, color, desc }) => (
                                        <button key={tab} onClick={() => setActiveTab(tab)} style={{
                                            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-card)',
                                            borderRadius: '16px', padding: '1.25rem', textAlign: 'left',
                                            cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '8px'
                                        }} className="quick-action-card">
                                            <div style={{ fontSize: '1.5rem', background: `${color}15`, width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>{icon}</div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{label}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', opacity: 0.6 }}>{desc}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section className="glass-card" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>System Performance & Analytics</h3>
                                <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-dim)' }}>Monitor enrollment trends and distribution details in the analytics section.</p>
                            </div>
                            <button onClick={() => setActiveTab('analytics')} className="btn-add" style={{ background: 'transparent', border: '1.5px solid var(--accent-primary)', color: 'var(--accent-primary)', borderRadius: '10px' }}>
                                View Detailed Reports →
                            </button>
                        </section>
                    </>
                )}

                {/* ── ANALYTICS TAB ── */}
                {activeTab === "analytics" && (
                    <>
                        <section className="stats-section">
                            {[
                                { label: "Total Users", icon: "👥", value: stats.total_users },
                                { label: "Active Students", icon: "🎓", value: stats.total_students },
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
                        <section className="charts-section">
                            <div className="glass-card chart-container">
                                <h3>Distribution by Role</h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                            {roleDistribution.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="glass-card chart-container">
                                <h3>Students Enrolled per Course</h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={courseData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="course" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" allowDecimals={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                                        <Bar dataKey="count" name="Students" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </section>
                        <section className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>📈 Enrollment Summary</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem' }}>
                                {[
                                    { label: 'Student-to-Faculty Ratio', value: stats.total_faculty > 0 ? (stats.total_students / stats.total_faculty).toFixed(1) + ':1' : 'N/A', icon: '⚖️' },
                                    { label: 'Total Courses', value: courseData.length, icon: '🏫' },
                                    { label: 'Avg Students/Course', value: courseData.length > 0 ? (courseData.reduce((a, b) => a + b.count, 0) / courseData.length).toFixed(1) : '0', icon: '📊' },
                                ].map(({ label, value, icon }) => (
                                    <div key={label} style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(59,130,246,0.08)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{icon}</div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-primary)' }}>{value}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>{label}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}

                {/* ── UPLOADS TAB ── */}
                {activeTab === "uploads" && (
                    <section className="glass-card" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
                        <h2 style={{ marginBottom: '0.5rem' }}>📤 Bulk Upload Center</h2>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem' }}>Import multiple users or subjects at once using CSV files.</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div style={{ padding: '2rem', background: 'rgba(59,130,246,0.08)', borderRadius: '16px', border: '1px solid rgba(59,130,246,0.2)' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👥</div>
                                <h3 style={{ marginBottom: '0.5rem' }}>Bulk Users Upload</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '1.5rem' }}>Upload students and faculty in one go using a CSV file.</p>
                                <input type="file" id="up-users" hidden onChange={handleUserUpload} />
                                <label htmlFor="up-users" className={uploadUserLoading ? "upload-btn loading" : "upload-btn"} style={{ display: 'inline-block' }}>
                                    {uploadUserLoading ? "⏳ Syncing..." : "📂 Choose CSV File"}
                                </label>
                                {uploadUserMessage && <p className="msg-ok" style={{ marginTop: '1rem' }}>{uploadUserMessage}</p>}
                            </div>
                            <div style={{ padding: '2rem', background: 'rgba(139,92,246,0.08)', borderRadius: '16px', border: '1px solid rgba(139,92,246,0.2)' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📘</div>
                                <h3 style={{ marginBottom: '0.5rem' }}>Bulk Subjects Upload</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '1.5rem' }}>Import the subject catalogue for a batch and semester.</p>
                                <input type="file" id="up-subjects" hidden onChange={handleSubjectUpload} />
                                <label htmlFor="up-subjects" className={uploadSubjectLoading ? "upload-btn loading" : "upload-btn"} style={{ display: 'inline-block' }}>
                                    {uploadSubjectLoading ? "⏳ Syncing..." : "📂 Choose CSV File"}
                                </label>
                                {uploadSubjectMessage && <p className="msg-ok" style={{ marginTop: '1rem' }}>{uploadSubjectMessage}</p>}
                            </div>
                        </div>
                        <div style={{ marginTop: '2rem', padding: '1rem 1.5rem', background: 'rgba(245,158,11,0.1)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.3)', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                            ℹ️ Create all <strong>Courses</strong> and <strong>Batches</strong> before uploading students or subjects. See <button onClick={() => setActiveTab('guidelines')} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 700, padding: 0 }}>CSV Guidelines</button> for format details.
                        </div>
                    </section>
                )}

                {/* ── DATA REPOSITORY TABS ── */}
                {["students", "faculty", "subjects", "courses", "batches", "users"].includes(activeTab) && (
                    <section className="table-section">
                        <div className="glass-card table-container-p" style={{ padding: '0', overflow: 'hidden' }}>
                            <div className="table-header-p" style={{ padding: '1.5rem 2rem', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border-card)', margin: '0' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{activeTab.toUpperCase()} REPOSITORY</h3>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', opacity: 0.6 }}>Manage and view your system data efficiently</span>
                                </div>
                                <div className="table-header-controls" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                                    {/* SEARCH */}
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            placeholder={`Quick search ${activeTab}...`}
                                            style={{ paddingLeft: '2.5rem', width: '220px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-card)', color: '#000' }}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (activeTab === "students") setSearchStudent(val);
                                                if (activeTab === "faculty") setSearchFaculty(val);
                                                if (activeTab === "subjects") setSearchSubject(val);
                                                if (activeTab === "courses") setSearchCourse(val);
                                                if (activeTab === "batches") setSearchBatch(val);
                                                if (activeTab === "users") setSearchUser(val);
                                            }}
                                        />
                                        <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                                    </div>

                                    {/* DYNAMIC FILTERS */}
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {activeTab === "students" && (
                                            <>
                                                <select style={{ width: '140px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-card)', borderRadius: '10px', fontSize: '0.8rem', color: '#000' }} value={fStudentCourse} onChange={(e) => setFStudentCourse(e.target.value)}>
                                                    <option value="">All Courses</option>
                                                    {allCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                                <select style={{ width: '140px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-card)', borderRadius: '10px', fontSize: '0.8rem', color: '#000' }} value={fStudentBatch} onChange={(e) => setFStudentBatch(e.target.value)}>
                                                    <option value="">All Batches</option>
                                                    {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                                </select>
                                            </>
                                        )}
                                        {activeTab === "faculty" && (
                                            <select style={{ width: '160px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-card)', borderRadius: '10px', fontSize: '0.8rem', color: '#000' }} value={fFacultyDept} onChange={(e) => setFFacultyDept(e.target.value)}>
                                                <option value="">All Departments</option>
                                                {[...new Set(faculty.map(f => f.department).filter(Boolean))].map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        )}
                                        {activeTab === "subjects" && (
                                            <>
                                                <select style={{ width: '140px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-card)', borderRadius: '10px', fontSize: '0.8rem', color: '#000' }} value={fSubjectFaculty} onChange={(e) => setFSubjectFaculty(e.target.value)}>
                                                    <option value="">All Faculty</option>
                                                    {allFaculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                                </select>
                                                <select style={{ width: '140px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-card)', borderRadius: '10px', fontSize: '0.8rem', color: '#000' }} value={fSubjectSem} onChange={(e) => setFSubjectSem(e.target.value)}>
                                                    <option value="">All Semesters</option>
                                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                                                </select>
                                            </>
                                        )}
                                        {activeTab === "batches" && (
                                            <select style={{ width: '140px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-card)', borderRadius: '10px', fontSize: '0.8rem', color: '#000' }} value={fBatchCourse} onChange={(e) => setFBatchCourse(e.target.value)}>
                                                <option value="">All Courses</option>
                                                {allCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        )}
                                        {activeTab === "users" && (
                                            <select style={{ width: '140px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-card)', borderRadius: '10px', fontSize: '0.8rem', color: '#000' }} value={fUserRole} onChange={(e) => setFUserRole(e.target.value)}>
                                                <option value="">All Roles</option>
                                                <option value="student">Student</option>
                                                <option value="faculty">Faculty</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        )}
                                        <button onClick={() => {
                                            setFStudentCourse(""); setFStudentBatch(""); setFFacultyDept(""); setFSubjectSem(""); setFSubjectFaculty(""); setFUserRole(""); setFBatchCourse("");
                                        }} style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)', padding: '0 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Reset</button>
                                    </div>

                                    <button className="btn-add" style={{ borderRadius: '10px', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 'fit-content' }} onClick={() => {
                                        const type = activeTab === "students" ? "student" : activeTab === "faculty" ? "faculty" : activeTab === "subjects" ? "subject" : activeTab === "courses" ? "course" : activeTab === "batches" ? "batch" : "user";
                                        openCrudModal("add", type);
                                    }}>
                                        <span style={{ fontSize: '1.1rem' }}>+</span>
                                        <span>New {activeTab.slice(0, -1)}</span>
                                    </button>
                                </div>
                            </div>
                            <div className="p-table-wrapper" style={{ padding: '0 1rem' }}>
                                <table className="p-table" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                    <thead style={{ background: 'transparent' }}>
                                        {activeTab === "students" && <tr><th style={{ paddingLeft: '1.5rem' }}>Name</th><th>Email</th><th>Enrollment</th><th>Course</th><th>Batch</th><th style={{ textAlign: 'center' }}>Actions</th></tr>}
                                        {activeTab === "faculty" && <tr><th style={{ paddingLeft: '1.5rem' }}>Name</th><th>Email</th><th>Department</th><th style={{ textAlign: 'center' }}>Actions</th></tr>}
                                        {activeTab === "subjects" && <tr><th style={{ paddingLeft: '1.5rem' }}>Subject</th><th>Code</th><th>Sem</th><th>Faculty</th><th style={{ textAlign: 'center' }}>Actions</th></tr>}
                                        {activeTab === "courses" && <tr><th style={{ paddingLeft: '1.5rem' }}>Name</th><th>Code</th><th>Created At</th><th style={{ textAlign: 'center' }}>Actions</th></tr>}
                                        {activeTab === "batches" && <tr><th style={{ paddingLeft: '1.5rem' }}>Batch Name</th><th>Duration</th><th>Course</th><th style={{ textAlign: 'center' }}>Actions</th></tr>}
                                        {activeTab === "users" && <tr><th style={{ paddingLeft: '1.5rem' }}>Name</th><th>Email</th><th>Role</th><th style={{ textAlign: 'center' }}>Actions</th></tr>}
                                    </thead>
                                    <tbody>
                                        {activeTab === "students" && students.map(s => (
                                            <tr key={s.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                                                <td style={{ paddingLeft: '1.5rem' }}><strong>{s.name}</strong></td>
                                                <td style={{ opacity: 0.7 }}>{s.email}</td>
                                                <td><span style={{ background: 'rgba(0,0,0,0.1)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>{s.enrollment_number}</span></td>
                                                <td>{s.course}</td><td>{s.batch}</td>
                                                <td className="action-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'center', border: 'none' }}>
                                                    <button className="btn-edit" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', padding: '5px 10px', borderRadius: '8px', fontSize: '0.85rem' }} onClick={() => openCrudModal("edit", "student", s)}>Edit</button>
                                                    <button className="btn-delete" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)', padding: '5px 10px', borderRadius: '8px', fontSize: '0.85rem' }} onClick={() => setDeleteConfirm({ open: true, id: s.id, type: "student" })}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {activeTab === "faculty" && faculty.map(f => (
                                            <tr key={f.id} style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                <td style={{ paddingLeft: '1.5rem' }}><strong>{f.name}</strong></td>
                                                <td style={{ opacity: 0.7 }}>{f.email}</td><td>{f.department}</td>
                                                <td className="action-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'center', border: 'none' }}>
                                                    <button className="btn-edit" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', padding: '5px 10px', borderRadius: '8px', fontSize: '0.85rem' }} onClick={() => openCrudModal("edit", "faculty", f)}>Edit</button>
                                                    <button className="btn-delete" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)', padding: '5px 10px', borderRadius: '8px', fontSize: '0.85rem' }} onClick={() => setDeleteConfirm({ open: true, id: f.id, type: "faculty" })}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {activeTab === "subjects" && subjects.map(s => (
                                            <tr key={s.id} style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                <td style={{ paddingLeft: '1.5rem' }}><strong>{s.name}</strong></td>
                                                <td><code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{s.code}</code></td>
                                                <td style={{ textAlign: 'center' }}>{s.semester}</td><td>{s.faculty_name}</td>
                                                <td className="action-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'center', border: 'none' }}>
                                                    <button className="btn-edit" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', padding: '5px 10px', borderRadius: '8px', fontSize: '0.85rem' }} onClick={() => openCrudModal("edit", "subject", s)}>Edit</button>
                                                    <button className="btn-delete" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)', padding: '5px 10px', borderRadius: '8px', fontSize: '0.85rem' }} onClick={() => setDeleteConfirm({ open: true, id: s.id, type: "subject" })}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {activeTab === "courses" && coursesList.map(c => (
                                            <tr key={c.id} style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                <td style={{ paddingLeft: '1.5rem' }}><strong>{c.name}</strong></td>
                                                <td>{c.code}</td><td style={{ opacity: 0.6 }}>{c.created_at}</td>
                                                <td className="action-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'center', border: 'none' }}>
                                                    <button className="btn-edit" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', padding: '5px 10px', borderRadius: '8px', fontSize: '0.85rem' }} onClick={() => openCrudModal("edit", "course", c)}>Edit</button>
                                                    <button className="btn-delete" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)', padding: '5px 10px', borderRadius: '8px', fontSize: '0.85rem' }} onClick={() => setDeleteConfirm({ open: true, id: c.id, type: "course" })}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {activeTab === "batches" && batchesList.map(b => (
                                            <tr key={b.id} style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                <td style={{ paddingLeft: '1.5rem' }}><strong>{b.name}</strong></td>
                                                <td>{b.start_year} - {b.end_year}</td><td>{b.course}</td>
                                                <td className="action-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'center', border: 'none' }}>
                                                    <button className="btn-edit" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', padding: '5px 10px', borderRadius: '8px', fontSize: '0.85rem' }} onClick={() => openCrudModal("edit", "batch", b)}>Edit</button>
                                                    <button className="btn-delete" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)', padding: '5px 10px', borderRadius: '8px', fontSize: '0.85rem' }} onClick={() => setDeleteConfirm({ open: true, id: b.id, type: "batch" })}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {activeTab === "users" && users.map(u => (
                                            <tr key={u.id} style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                <td style={{ paddingLeft: '1.5rem' }}><strong>{u.name}</strong></td>
                                                <td style={{ opacity: 0.7 }}>{u.email}</td>
                                                <td><span className={`badge-p ${u.role}`} style={{ fontSize: '0.7rem', padding: '2px 10px' }}>{u.role.toUpperCase()}</span></td>
                                                <td className="action-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'center', border: 'none' }}>
                                                    <button className="btn-edit" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', padding: '5px 10px', borderRadius: '8px', fontSize: '0.85rem' }} onClick={() => openCrudModal("edit", "user", u)}>Edit</button>
                                                    <button className="btn-delete" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)', padding: '5px 10px', borderRadius: '8px', fontSize: '0.85rem' }} onClick={() => setDeleteConfirm({ open: true, id: u.id, type: "user" })}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="pagination" style={{ padding: '1.5rem', borderTop: '1px solid var(--border-card)', justifyContent: 'center', background: 'rgba(0,0,0,0.01)' }}>
                                {activeTab === "students" && totalPagesStudent > 1 && Array.from({ length: totalPagesStudent }, (_, i) => i + 1).map(p => (
                                    <button key={p} className={p === pageStudent ? "active" : ""} style={{ width: '36px', height: '36px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 700 }} onClick={() => fetchStudentsData(p)}>{p}</button>
                                ))}
                                {activeTab === "faculty" && totalPagesFaculty > 1 && Array.from({ length: totalPagesFaculty }, (_, i) => i + 1).map(p => (
                                    <button key={p} className={p === pageFaculty ? "active" : ""} style={{ width: '36px', height: '36px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 700 }} onClick={() => fetchFacultyData(p)}>{p}</button>
                                ))}
                                {activeTab === "users" && totalPagesUser > 1 && Array.from({ length: totalPagesUser }, (_, i) => i + 1).map(p => (
                                    <button key={p} className={p === pageUser ? "active" : ""} style={{ width: '36px', height: '36px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 700 }} onClick={() => fetchUsersData(p)}>{p}</button>
                                ))}
                                {activeTab === "subjects" && totalPagesSubject > 1 && Array.from({ length: totalPagesSubject }, (_, i) => i + 1).map(p => (
                                    <button key={p} className={p === pageSubject ? "active" : ""} style={{ width: '36px', height: '36px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 700 }} onClick={() => fetchSubjectsData(p)}>{p}</button>
                                ))}
                                {activeTab === "courses" && totalPagesCourse > 1 && Array.from({ length: totalPagesCourse }, (_, i) => i + 1).map(p => (
                                    <button key={p} className={p === pageCourse ? "active" : ""} style={{ width: '36px', height: '36px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 700 }} onClick={() => fetchCoursesListData(p)}>{p}</button>
                                ))}
                                {activeTab === "batches" && totalPagesBatch > 1 && Array.from({ length: totalPagesBatch }, (_, i) => i + 1).map(p => (
                                    <button key={p} className={p === pageBatch ? "active" : ""} style={{ width: '36px', height: '36px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 700 }} onClick={() => fetchBatchesListData(p)}>{p}</button>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

// ─── CRUD Form Component ───────────────────────────────────────

const CrudFormComponent = ({ crudModal, crudForm, crudLoading, crudMessage, handleCrudFormChange, handleCrudSave, closeCrudModal, allFaculty = [], batches = [], semesters = [], allCourses = [] }) => {
    if (!crudModal.open) return null;

    const getTitle = () => {
        const action = crudModal.action === "add" ? "Add" : "Edit";
        return `${action} ${crudModal.type.charAt(0).toUpperCase() + crudModal.type.slice(1)}`;
    };

    const getFormFields = () => {
        if (crudModal.type === "student") {
            return (
                <>
                    <div className="form-group-crud">
                        <label>Name</label>
                        <input type="text" name="name" value={crudForm.name || ""} onChange={handleCrudFormChange} placeholder="Full Name" autoComplete="off" />
                    </div>
                    <div className="form-group-crud">
                        <label>Email</label>
                        <input type="email" name="email" value={crudForm.email || ""} onChange={handleCrudFormChange} placeholder="Email" autoComplete="off" />
                    </div>
                    <div className="form-group-crud">
                        <label>Enrollment Number</label>
                        <input type="text" name="enrollment_number" value={crudForm.enrollment_number || ""} onChange={handleCrudFormChange} placeholder="Enrollment Number" autoComplete="off" />
                    </div>
                    <div className="form-group-crud">
                        <label>Batch</label>
                        <select name="batch_id" value={crudForm.batch_id || ""} onChange={handleCrudFormChange} style={{ outline: "none" }}>
                            <option value="">Select Batch</option>
                            {batches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group-crud">
                        <label>Current Semester</label>
                        <select name="current_semester_id" value={crudForm.current_semester_id || ""} onChange={handleCrudFormChange} style={{ outline: "none" }}>
                            <option value="">Select Semester (Not Set)</option>
                            {semesters.filter(s => !crudForm.batch_id || s.batch_id === parseInt(crudForm.batch_id)).map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({batches.find(b => b.id === s.batch_id)?.name})</option>
                            ))}
                        </select>
                    </div>
                    {crudModal.action === "add" && (
                        <div className="form-group-crud">
                            <label>Password</label>
                            <input type="password" name="password" value={crudForm.password || ""} onChange={handleCrudFormChange} placeholder="Default: jims@123456" autoComplete="new-password" />
                        </div>
                    )}
                </>
            );
        } else if (crudModal.type === "faculty") {
            return (
                <>
                    <div className="form-group-crud">
                        <label>Name</label>
                        <input type="text" name="name" value={crudForm.name || ""} onChange={handleCrudFormChange} placeholder="Full Name" autoComplete="off" />
                    </div>
                    <div className="form-group-crud">
                        <label>Email</label>
                        <input type="email" name="email" value={crudForm.email || ""} onChange={handleCrudFormChange} placeholder="Email" autoComplete="off" />
                    </div>
                    <div className="form-group-crud">
                        <label>Department</label>
                        <input type="text" name="department" value={crudForm.department || ""} onChange={handleCrudFormChange} placeholder="Department" autoComplete="off" />
                    </div>
                    {crudModal.action === "add" && (
                        <div className="form-group-crud">
                            <label>Password</label>
                            <input type="password" name="password" value={crudForm.password || ""} onChange={handleCrudFormChange} placeholder="Default: jims@123456" autoComplete="new-password" />
                        </div>
                    )}
                </>
            );
        } else if (crudModal.type === "user") {
            return (
                <>
                    <div className="form-group-crud">
                        <label>Name</label>
                        <input type="text" name="name" value={crudForm.name || ""} onChange={handleCrudFormChange} placeholder="Full Name" autoComplete="off" />
                    </div>
                    <div className="form-group-crud">
                        <label>Email</label>
                        <input type="email" name="email" value={crudForm.email || ""} onChange={handleCrudFormChange} placeholder="Email" autoComplete="off" />
                    </div>
                    <div className="form-group-crud">
                        <label>Role</label>
                        <select name="role" value={crudForm.role || "admin"} onChange={handleCrudFormChange} style={{ outline: "none" }}>
                            <option value="admin">Admin</option>
                            <option value="faculty">Faculty</option>
                            <option value="student">Student</option>
                        </select>
                    </div>
                    {crudModal.action === "add" && (
                        <div className="form-group-crud">
                            <label>Password</label>
                            <input type="password" name="password" value={crudForm.password || ""} onChange={handleCrudFormChange} placeholder="Default: jims@123456" autoComplete="new-password" />
                        </div>
                    )}
                </>
            );
        } else if (crudModal.type === "subject") {
            return (
                <>
                    <div className="form-group-crud">
                        <label>Subject Name</label>
                        <input type="text" name="name" value={crudForm.name || ""} onChange={handleCrudFormChange} placeholder="e.g. Data Structures" autoComplete="off" />
                    </div>
                    <div className="form-group-crud">
                        <label>Subject Code</label>
                        <input type="text" name="code" value={crudForm.code || ""} onChange={handleCrudFormChange} placeholder="e.g. CS101" autoComplete="off" />
                    </div>
                    <div className="form-group-crud">
                        <label>Semester</label>
                        <select name="semester_id" value={crudForm.semester_id || ""} onChange={handleCrudFormChange} style={{ outline: "none" }}>
                            <option value="">Select Semester</option>
                            {semesters.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({batches.find(b => b.id === s.batch_id)?.name})</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group-crud">
                        <label>Assign Faculty</label>
                        <select name="faculty_id" value={crudForm.faculty_id || ""} onChange={handleCrudFormChange} style={{ outline: "none" }}>
                            <option value="">Unassigned</option>
                            {allFaculty.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>
                </>
            );
        } else if (crudModal.type === "course") {
            return (
                <>
                    <div className="form-group-crud">
                        <label>Course Name</label>
                        <input type="text" name="name" value={crudForm.name || ""} onChange={handleCrudFormChange} placeholder="e.g. Bachelor of Commerce" autoComplete="off" />
                    </div>
                    <div className="form-group-crud">
                        <label>Course Code</label>
                        <input type="text" name="code" value={crudForm.code || ""} onChange={handleCrudFormChange} placeholder="e.g. BCOM-001" autoComplete="off" />
                    </div>
                </>
            );
        } else if (crudModal.type === "batch") {
            return (
                <>
                    <div className="form-group-crud">
                        <label>Batch Name</label>
                        <input type="text" name="name" value={crudForm.name || ""} onChange={handleCrudFormChange} placeholder="e.g. 2024-2027" autoComplete="off" />
                    </div>
                    <div className="form-group-crud">
                        <label>Course</label>
                        <select name="course_id" value={crudForm.course_id || ""} onChange={handleCrudFormChange} style={{ outline: "none" }}>
                            <option value="">Select Course</option>
                            {(allCourses || []).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group-crud">
                        <label>Start Year</label>
                        <input type="number" name="start_year" value={crudForm.start_year || ""} onChange={handleCrudFormChange} placeholder="e.g. 2024" autoComplete="off" />
                    </div>
                    <div className="form-group-crud">
                        <label>End Year</label>
                        <input type="number" name="end_year" value={crudForm.end_year || ""} onChange={handleCrudFormChange} placeholder="e.g. 2027" autoComplete="off" />
                    </div>
                    <div className="form-group-crud">
                        <label>Number of Semesters</label>
                        <input type="number" name="num_semesters" value={crudForm.num_semesters || ""} onChange={handleCrudFormChange} placeholder="e.g. 6" autoComplete="off" />
                    </div>
                </>
            );
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) {
                closeCrudModal();
            }
        }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{getTitle()}</h3>
                    <button className="modal-close" onClick={closeCrudModal} disabled={crudLoading} style={{ opacity: crudLoading ? 0.5 : 1, cursor: crudLoading ? "not-allowed" : "pointer" }}>×</button>
                </div>
                <div className="modal-body">
                    {getFormFields()}
                    {crudMessage.text && (
                        <div className={`form-message ${crudMessage.type}`}>
                            {crudMessage.type === "success" ? "✅" : "❌"} {crudMessage.text}
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={closeCrudModal} disabled={crudLoading}>Cancel</button>
                    <button className="btn-save" onClick={handleCrudSave} disabled={crudLoading}>
                        {crudLoading ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
