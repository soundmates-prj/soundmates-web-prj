import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1/`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add access token to headers
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

// Response interceptor - Handle token refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip token refresh for auth endpoints — let the component handle the error
      const isAuthRequest =
        originalRequest.url?.includes("auth/login") ||
        originalRequest.url?.includes("auth/google-login") ||
        originalRequest.url?.includes("auth/refresh-token");

      if (isAuthRequest) {
        return Promise.reject(error);
      }

      // Skip for guest: if user has NO tokens at all, they are a pure guest.
      // Just reject the error so the component can handle gracefully (show empty
      // state / fallback UI) — do NOT redirect to login.
      const hasAnyToken =
        !!localStorage.getItem("accessToken") ||
        !!localStorage.getItem("refreshToken");

      if (!hasAnyToken) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        // accessToken had expired but no refreshToken → session is broken.
        // Clean up stale data and redirect to login only if there WAS an
        // access token (i.e. user was previously logged in, not a guest).
        const hadAccessToken = !!localStorage.getItem("accessToken");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userInfo");
        localStorage.removeItem("liveGuestIdentifier");
        window.dispatchEvent(new Event("authChange"));
        if (hadAccessToken) {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      try {
        // Call refresh token endpoint
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/v1/auth/refresh-token`,
          { refreshToken }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data.data;

        // Update tokens
        localStorage.setItem("accessToken", newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        // Update authorization header
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Process queued requests
        processQueue(null, newAccessToken);

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout
        processQueue(refreshError, null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userInfo");
        localStorage.removeItem("liveGuestIdentifier");
        window.dispatchEvent(new Event("authChange"));
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
