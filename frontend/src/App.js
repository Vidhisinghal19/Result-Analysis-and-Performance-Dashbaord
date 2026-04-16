import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import StudentDashboard from "./pages/StudentDashboard";

// Protected Route Component
function ProtectedRoute({ element, requiredRole }) {
  const user = localStorage.getItem("user");

  if (!user) {
    return <Navigate to="/login" />;
  }

  const userData = JSON.parse(user);

  if (requiredRole && userData.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  return element;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/admin"
          element={<ProtectedRoute element={<AdminDashboard />} requiredRole="admin" />}
        />
        <Route
          path="/faculty"
          element={<ProtectedRoute element={<FacultyDashboard />} requiredRole="faculty" />}
        />
        <Route
          path="/student"
          element={<ProtectedRoute element={<StudentDashboard />} requiredRole="student" />}
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;