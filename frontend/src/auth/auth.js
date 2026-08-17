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
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};