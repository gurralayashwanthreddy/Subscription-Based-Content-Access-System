const API_BASE =
  import.meta.env.VITE_API_BASE?.trim() ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:5000");

export function buildAssetUrl(path = "") {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function fetchJson(path, options = {}) {
  const headers = {
    ...(options.headers || {})
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export default API_BASE;
