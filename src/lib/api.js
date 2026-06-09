function apiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (import.meta.env.DEV) {
    return "/api";
  }

  return window.location.pathname.includes("/dist") ? "../api" : "api";
}

export function apiUrl(path) {
  return `${apiBaseUrl()}/${path}`;
}

export function publicAssetUrl(url) {
  if (!url || /^(https?:)?\/\//.test(url) || url.startsWith("data:")) {
    return url;
  }

  const cleanUrl = url.replace(/^\/+/, "");
  if (cleanUrl.startsWith("public/")) {
    const publicPath = cleanUrl.replace(/^public\//, "");
    if (import.meta.env.DEV) {
      return `/${publicPath}`;
    }

    return publicPath;
  }

  if (import.meta.env.DEV) {
    return `/${cleanUrl}`;
  }

  return window.location.pathname.includes("/dist") ? `../${cleanUrl}` : cleanUrl;
}

export async function api(path, options = {}) {
  const config = {
    method: options.method || "GET",
    credentials: "include",
    headers: options.headers ? { ...options.headers } : {},
  };

  if (options.body instanceof FormData) {
    config.body = options.body;
  } else if (options.body) {
    config.headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${apiBaseUrl()}/${path}`, config);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}
