const RAW_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const NORMALIZED_BASE_URL = RAW_BASE_URL.replace(/\/$/, '');

// Debug: Log API configuration on load
console.log('🔧 [API Config] VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('🔧 [API Config] RAW_BASE_URL:', RAW_BASE_URL);
console.log('🔧 [API Config] NORMALIZED_BASE_URL:', NORMALIZED_BASE_URL);
console.log('🔧 [API Config] Environment:', import.meta.env.MODE);

export const getApiBaseUrl = () => NORMALIZED_BASE_URL;

export const buildApiUrl = (path: string) => {
  if (!path) return NORMALIZED_BASE_URL;
  const fullUrl = `${NORMALIZED_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  console.log(`🌐 [API Request] ${path} → ${fullUrl}`);
  return fullUrl;
};

export interface ApiRequestOptions extends RequestInit {
  token?: string | null;
  skipContentType?: boolean;
}

export async function apiFetch(path: string, options: ApiRequestOptions = {}) {
  const { token, skipContentType = false, headers, ...rest } = options;
  const requestHeaders = new Headers(headers ?? {});

  if (!skipContentType && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(buildApiUrl(path), {
    ...rest,
    headers: requestHeaders,
  });

  return response;
}
