/**
 * Public API Client
 * For public endpoints that don't require authentication
 * Uses the public backend API (api.contrezz.com)
 */

// Public API Base URL
const PUBLIC_API_URL =
  import.meta.env.VITE_PUBLIC_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5001/api"
    : "https://api.contrezz.com/api");

export interface PublicApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Make a request to the public API (no authentication)
 */
async function publicRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<PublicApiResponse<T>> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const config: RequestInit = {
    ...options,
    headers,
    cache: "no-store",
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(`${PUBLIC_API_URL}${endpoint}`, {
      ...config,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse JSON response
    const contentType = response.headers.get("content-type") || "";
    let data: any = {};

    if (response.status === 204 || response.status === 205) {
      data = {};
    } else {
      const raw = await response.text().catch(() => "");
      if (raw && raw.trim() !== "") {
        try {
          data = contentType.includes("application/json")
            ? JSON.parse(raw)
            : { message: raw };
        } catch {
          data = { message: raw };
        }
      }
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Request failed",
        message: data.message || data.error || "Request failed",
        details: data.details, // Include validation details if available
      };
    }

    return {
      success: true,
      data: data.data || data,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      return {
        success: false,
        error: "Request timeout",
        message: "The request took too long to complete",
      };
    }

    return {
      success: false,
      error: error.message || "Network error",
      message: "Failed to connect to the server",
    };
  }
}

/**
 * Public API Client methods
 */
export const publicApi = {
  /**
   * GET request (no auth)
   */
  get: <T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<PublicApiResponse<T>> => {
    const queryString = params
      ? "?" + new URLSearchParams(params as any).toString()
      : "";
    return publicRequest<T>(`${endpoint}${queryString}`, {
      method: "GET",
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    });
  },

  /**
   * POST request (no auth)
   */
  post: <T>(endpoint: string, body?: any): Promise<PublicApiResponse<T>> => {
    return publicRequest<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    });
  },
};

export default publicApi;
