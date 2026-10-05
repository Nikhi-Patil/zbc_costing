import API_BASE_URL from "../config/api";

// SESSION
export const login = (userData) => {
  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("user", JSON.stringify(userData));
};
export const logout = () => {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("user");
};
export const isAuthenticated = () => {
  return localStorage.getItem("isLoggedIn") === "true";
};
export const getUser = () => {
  if (!isAuthenticated()) {
    return null;
  }
  const user = localStorage.getItem("user");
  if (!user) {
    return null;
  }
  try {
    return JSON.parse(user);
  } catch (error) {
    console.error("Invalid stored user:", error);
    logout();
    return null;
  }
};

// SAFE JSON RESPONSE
const getResponseData = async (response) => {
  const text = await response.text();

  // Backend returned nothing
  if (!text.trim()) {
    throw new Error(
      `Server returned an empty response. HTTP ${response.status}`
    );
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("Server returned non-JSON response:", text);
    throw new Error(
      `Server returned invalid JSON. HTTP ${response.status}`
    );
  }
};

// VERIFY EMPLOYEE
export const verifyEmployee = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });
  const data = await getResponseData(response);
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Invalid credentials");
  }
  return data;
};

// GET SUB DEPARTMENTS
export const getEmployeeSubDepartments = async (email, unit) => {
  const response = await fetch(
    `${API_BASE_URL}/auth/employee-sub-departments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        unit,
      }),
    }
  );
  const data = await getResponseData(response);
  if (!response.ok || !data.success) {
    throw new Error(
      data.message || "Failed to load sub departments"
    );
  }
  return data;
};

// LOGIN
export const loginUser = async ({
  email,
  password,
  unit,
  sub_department,
}) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      unit,
      sub_department,
    }),
  });
  const data = await getResponseData(response);
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Login failed");
  }
  // Save session permanently until Logout
  login(data.user);
  return data;
};