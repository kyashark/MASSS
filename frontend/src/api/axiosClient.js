import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

//  Inject user_id=1 automatically
axiosClient.interceptors.request.use((config) => {
  const userId = 1; // TEMP until auth exists

  // For GET requests → query params
  if (config.method === "get") {
    config.params = {
      ...(config.params || {}),
      user_id: userId,
    };
  }

  // For POST / PUT / PATCH → body
  if (["post", "put", "patch"].includes(config.method)) {
    config.data = {
      ...(config.data || {}),
      user_id: userId,
    };
  }

  return config;
});

export default axiosClient;
