import axiosClient from "./axiosClient";

export const registerUser = async (username, email, password) => {
  const res = await axiosClient.post("/auth/register", {
    username,
    email,
    password,
  });
  return res.data;
};

export const loginUser = async (email, password) => {
  // OAuth2PasswordRequestForm expects form data, not JSON
  const formData = new URLSearchParams();
  formData.append("username", email); // field is called username but we send email
  formData.append("password", password);

  const res = await axiosClient.post("/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  // Store the token immediately after login
  localStorage.setItem("access_token", res.data.access_token);
  return res.data;
};

export const logoutUser = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

export const getCurrentUser = async () => {
  const res = await axiosClient.get("/auth/me");
  return res.data;
};