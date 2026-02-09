import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api/v1/",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  function (config) {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },

  function (error) {
    return Promise.reject(error);
  },
);

export default api;
