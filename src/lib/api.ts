let API_URLS: Record<string, string> = {};

try {
  const modules = import.meta.glob("/backend/func2url.json", { eager: true });
  const raw = Object.values(modules)[0] as
    | { default?: Record<string, string> }
    | Record<string, string>
    | undefined;
  if (raw) {
    API_URLS =
      (raw as { default?: Record<string, string> }).default ||
      (raw as Record<string, string>);
  }
} catch (_e) {
  /* func2url not available */
}

export const getApiUrl = (name: string): string => API_URLS[name] || "";

export const apiFetch = async (
  funcName: string,
  options?: RequestInit
): Promise<Response> => {
  const url = getApiUrl(funcName);
  if (!url) throw new Error(`Backend function "${funcName}" not found`);
  return fetch(url, options);
};

export default API_URLS;