import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import "./Login.css";

function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-container">

      {/* Left Panel */}
      <div className="left-panel">
        <div className="overlay">
          <h1>
            Welcome to
            <br />
            Jayashree Polymers
          </h1>
        </div>
      </div>

      {/* Right Panel */}
      <div className="right-panel">

        <form className="login-form">

          <h2>Login</h2>

          {/* Username */}
          <div className="login-input-group">
            <label htmlFor="username">
              Username
            </label>

            <input
              id="username"
              type="text"
              placeholder="Enter Username"
            />
          </div>

          {/* Password */}
          <div className="login-input-group">
            <label htmlFor="password">
              Password
            </label>

            <div className="password-box">

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
              />

              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>

            </div>
          </div>

          {/* Unit */}
          <div className="login-input-group">
            <label htmlFor="unit">
              Unit
            </label>

            <select
              id="unit"
              className="login-select"
              defaultValue=""
            >
              <option value="" disabled>
                Select Unit
              </option>

              <option value="unit1">
                Unit 1
              </option>

              <option value="unit2">
                Unit 2
              </option>

              <option value="unit3">
                Unit 3
              </option>
            </select>
          </div>

          {/* Department */}
          <div className="login-input-group">
            <label htmlFor="department">
              Department
            </label>

            <select
              id="department"
              className="login-select"
              defaultValue=""
            >
              <option value="" disabled>
                Select Department
              </option>

              <option value="it">
                IT
              </option>

              <option value="hr">
                HR
              </option>

              <option value="finance">
                Finance
              </option>
            </select>
          </div>

          {/* Forgot Password */}
          <div className="options">
            <a href="#">
              Forgot Password?
            </a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="login-btn"
          >
            Login
          </button>

        </form>

      </div>

    </div>
  );
}

export default Login;