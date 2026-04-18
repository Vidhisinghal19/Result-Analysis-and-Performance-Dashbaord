import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Auth.css"; // Reusing Login.css

function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("student");
    const [enrollmentNumber, setEnrollmentNumber] = useState("");
    const [batchId, setBatchId] = useState("");
    const [batches, setBatches] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get("http://127.0.0.1:5001/api/admin/batches")
            .then(res => setBatches(res.data))
            .catch(err => console.error("Error fetching batches:", err));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        if (!name || !email || !password || !confirmPassword) {
            setError("Please fill in all fields");
            setLoading(false);
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        // Password strength check
        const passwordStrength = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
        if (!passwordStrength.test(password)) {
            setError("Password must contain at least one uppercase letter, one lowercase letter, and one number");
            setLoading(false);
            return;
        }

        try {
            await axios.post("http://127.0.0.1:5001/register", {
                name,
                email,
                password,
                role,
                enrollment_number: role === "student" ? enrollmentNumber : undefined,
                batch_id: role === "student" ? batchId : undefined
            });

            setSuccess("Account created successfully! Redirecting to login...");
            setTimeout(() => {
                navigate("/login");
            }, 2000);

        } catch (err) {
            setError(err.response?.data?.error || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };




    return (
        <div className="login-container">
            <div className="login-wrapper">
                {/* <div className="login-brand">
                    <div className="brand-icon">
                        <img src="/logo192.png" alt="JIMS Logo" />
                    </div>
                    <h2>JIMS Sector 5 Rohini</h2>
                    <p>Result Analysis System</p>
                </div> */}
                <div className="login-card">
                    <div className="login-header">
                        <h1>Create Account</h1>
                        <p>Join the Result Analysis System</p>
                    </div>

                    {error && (
                        <div className="error-message">
                            <i className="fas fa-exclamation-circle"></i>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="success-message">
                            <i className="fas fa-check-circle"></i>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">
                                <i className="fas fa-user"></i>
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={error && !name ? "error-input" : ""}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">
                                <i className="fas fa-envelope"></i>
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={error && !email ? "error-input" : ""}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">
                                <i className="fas fa-lock"></i>
                                Password
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter password (min 6 characters)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={error && !password ? "error-input" : ""}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                </button>
                            </div>
                            {password && (
                                <div className="password-strength">
                                    <div className={`strength-bar ${password.length >= 6 ? 'weak' : ''} ${password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/) ? 'strong' : ''}`}></div>
                                    <small>
                                        {password.length < 6 ? "Too short" :
                                            password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/) ? "Strong password" :
                                                "Add uppercase, lowercase & number"}
                                    </small>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">
                                <i className="fas fa-check-circle"></i>
                                Confirm Password
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={error && !confirmPassword ? "error-input" : ""}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <i className={showConfirmPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                </button>
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <small className="password-mismatch">Passwords do not match</small>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="role">
                                <i className="fas fa-users"></i>
                                Account Type
                            </label>
                            <select
                                id="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="role-select"
                            >
                                <option value="student"> Student - Access your results and academic data</option>
                                <option value="faculty">Faculty - Manage student results and analytics</option>
                                {/* <option value="admin">Admin - Full system control and oversight</option> */}
                            </select>
                            {/* <div className="role-info">
                                <span>{roleDetails.icon}</span>
                                <small>{roleDetails.label} access will be granted</small>
                            </div> */}
                        </div>

                        {role === "student" && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="enrollmentNumber">
                                        <i className="fas fa-id-card"></i>
                                        Enrollment Number
                                    </label>
                                    <input
                                        id="enrollmentNumber"
                                        type="text"
                                        placeholder="Enter your enrollment number"
                                        value={enrollmentNumber}
                                        onChange={(e) => setEnrollmentNumber(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="batchId">
                                        <i className="fas fa-graduation-cap"></i>
                                        Batch
                                    </label>
                                    <select
                                        id="batchId"
                                        value={batchId}
                                        onChange={(e) => setBatchId(e.target.value)}
                                        className="role-select"
                                        required
                                    >
                                        <option value="">Select your batch</option>
                                        {batches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}

                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="loading-spinner"></span>
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-user-plus"></i>
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>
                            Already have an account? <Link to="/login">Sign in here</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;