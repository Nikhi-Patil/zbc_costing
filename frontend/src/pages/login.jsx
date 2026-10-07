import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  verifyEmployee,
  getEmployeeSubDepartments,
  loginUser,
} from "../auth/auth";

import "./login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [unitId, setUnitId] = useState("");
  const [subDepartmentId, setSubDepartmentId] = useState("");

  const [units, setUnits] = useState([]);
  const [subDepartments, setSubDepartments] = useState([]);

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingSubDepartments, setLoadingSubDepartments] = useState(false);

  // IMPORTANT:
  // Unit/Sub Department will only appear after successful verification
  const [verified, setVerified] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // VERIFY EMAIL + PASSWORD
  // =========================================================
  const handleVerify = async () => {
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return false;
    }

    if (!password) {
      setError("Please enter your password.");
      return false;
    }

    try {
      setLoading(true);

      const data = await verifyEmployee(email.trim(), password);

      // Verification successful
      setVerified(true);

      // Store authorized units
      setUnits(data.units || []);

      // Clear previous selections
      setUnitId("");
      setSubDepartmentId("");
      setSubDepartments([]);

      setSuccess(
        "Credentials verified successfully. Please select your Unit and Sub Department.",
      );

      return true;
    } catch (err) {
      // Verification failed
      setVerified(false);

      setUnits([]);
      setUnitId("");
      setSubDepartmentId("");
      setSubDepartments([]);

      setError(err.message || "Invalid Email or Password.");

      return false;
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UNIT CHANGE
  // =========================================================
  const handleUnitChange = async (e) => {
    const selectedUnitId = e.target.value;

    setUnitId(selectedUnitId);
    setSubDepartmentId("");
    setSubDepartments([]);

    setError("");
    setSuccess("");

    if (!selectedUnitId) {
      return;
    }

    try {
      setLoadingSubDepartments(true);

      const data = await getEmployeeSubDepartments(
        email.trim(),
        selectedUnitId,
      );

      const departments = data.data || [];

      setSubDepartments(departments);

      if (departments.length === 0) {
        setError("No authorized Sub Department found for this Unit.");
      }
    } catch (err) {
      setSubDepartments([]);

      setError(err.message || "Unable to load Sub Departments.");
    } finally {
      setLoadingSubDepartments(false);
    }
  };

  // =========================================================
  // LOGIN
  // =========================================================
  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // -------------------------------------------------------
    // STEP 1
    // If not verified, verify credentials first
    // -------------------------------------------------------
    if (!verified) {
      await handleVerify();
      return;
    }

    // -------------------------------------------------------
    // STEP 2
    // Credentials verified, now validate Unit
    // -------------------------------------------------------
    if (!unitId) {
      setError("Please select your Unit.");
      return;
    }

    // -------------------------------------------------------
    // STEP 3
    // Validate Sub Department
    // -------------------------------------------------------
    if (!subDepartmentId) {
      setError("Please select your Sub Department.");
      return;
    }

    try {
      setLoading(true);

      // Final backend authorization
      await loginUser({
        email: email.trim(),
        password,
        unit: unitId,
        sub_department: subDepartmentId,
      });

      // Login successful
      navigate("/dashboard", {
        replace: true,
      });
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // EMAIL CHANGE
  // =========================================================
  const handleEmailChange = (e) => {
    setEmail(e.target.value);

    // Changing credentials invalidates verification
    setVerified(false);

    setUnits([]);
    setUnitId("");
    setSubDepartmentId("");
    setSubDepartments([]);

    setError("");
    setSuccess("");
  };

  // PASSWORD CHANGE
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setVerified(false);
    setUnits([]);
    setUnitId("");
    setSubDepartmentId("");
    setSubDepartments([]);
    setError("");
    setSuccess("");
  };

  // RENDER
  return (
    <div className="login-container">
      {/* LEFT PANEL */}
      <div className="left-panel">
        <div className="overlay">
          <h1>
            Welcome to
            <br />
            Jayashree Polymers
          </h1>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel">
        <form className="login-form" onSubmit={handleLogin}>
          <h2>Login</h2>

          {/* ERROR MESSAGE */}
          {error && <div className="login-message login-error">{error}</div>}

          {/* SUCCESS MESSAGE */}
          {success && (
            <div className="login-message login-success">{success}</div>
          )}

          {/* EMAIL */}
          <div className="login-input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={handleEmailChange}
              autoComplete="username"
              disabled={loading}
            />
          </div>

          {/* PASSWORD */}
          <div className="login-input-group">
            <label htmlFor="password">Password</label>
            <div className="password-box">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                value={password}
                onChange={handlePasswordChange}
                autoComplete="current-password"
                disabled={loading}
              />

              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* UNIT + SUB DEPARTMENT */}
          {verified && (
            <>
              {/* UNIT */}
              <div className="login-input-group">
                <label htmlFor="unit">Unit</label>
                <select
                  id="unit"
                  className="login-select"
                  value={unitId}
                  onChange={handleUnitChange}
                  disabled={loading || loadingSubDepartments}
                >
                  <option value="">Select Unit</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* SUB DEPARTMENT */}
              <div className="login-input-group">
                <label htmlFor="subDepartment">Sub Department</label>
                <select
                  id="subDepartment"
                  className="login-select"
                  value={subDepartmentId}
                  onChange={(e) => setSubDepartmentId(e.target.value)}
                  disabled={!unitId || loadingSubDepartments || loading}
                >
                  <option value="">
                    {loadingSubDepartments
                      ? "Loading..."
                      : !unitId
                        ? "Select Unit first"
                        : "Select Sub Department"}
                  </option>
                  {subDepartments.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* FORGOT PASSWORD */}
          <div className="options">
            <a href="#" onClick={(e) => e.preventDefault()}>
              Forgot Password?
            </a>
          </div>

          {/* BUTTON */}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2
                  size={18}
                  style={{
                    marginRight: "8px",
                    verticalAlign: "middle",
                    animation: "spin 1s linear infinite",
                  }}
                />
                Please wait...
              </>
            ) : verified ? (
              "Login"
            ) : (
              "Verify"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
export default Login;