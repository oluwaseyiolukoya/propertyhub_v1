/**
 * Public Admin API Client
 *
 * API client for public content admin endpoints.
 * Separate from main app API to maintain independence.
 */

const PUBLIC_ADMIN_API_URL =
  import.meta.env.VITE_PUBLIC_ADMIN_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5001/api/admin"
    : "https://api.contrezz.com/api/admin");

// Token storage keys
const TOKEN_KEY = "public_admin_token";
const ADMIN_KEY = "public_admin_data";

export interface PublicAdmin {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor" | "viewer";
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  admin: PublicAdmin;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: string;
}

/**
 * Get stored admin token
 */
export const getAdminToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

/**
 * Store admin token
 */
export const setAdminToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error("Failed to store admin token:", error);
  }
};

/**
 * Remove admin token
 */
export const removeAdminToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
  } catch (error) {
    console.error("Failed to remove admin token:", error);
  }
};

/**
 * Get stored admin data
 */
export const getAdminData = (): PublicAdmin | null => {
  try {
    const data = localStorage.getItem(ADMIN_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

/**
 * Store admin data
 */
export const setAdminData = (admin: PublicAdmin): void => {
  try {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
  } catch (error) {
    console.error("Failed to store admin data:", error);
  }
};

/**
 * Check if admin is authenticated
 */
export const isAdminAuthenticated = (): boolean => {
  return !!getAdminToken();
};

/**
 * Make authenticated API request
 */
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAdminToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${PUBLIC_ADMIN_API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized (token expired or invalid)
    if (response.status === 401) {
      removeAdminToken();
      throw new Error("Session expired. Please log in again.");
    }

    const data = await response.json();

    if (!response.ok) {
      const error: ApiError = {
        error: data.error || "Request failed",
        code: data.code,
        details: data.details,
      };
      throw error;
    }

    return data;
  } catch (error: any) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(error.error || "Network error");
  }
};

/**
 * Authentication API
 */
export const publicAdminApi = {
  /**
   * Login
   */
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    // Store token and admin data
    setAdminToken(response.token);
    setAdminData(response.admin);

    return response;
  },

  /**
   * Logout
   */
  logout: async (): Promise<void> => {
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always remove token locally, even if API call fails
      removeAdminToken();
    }
  },

  /**
   * Get current admin
   */
  getMe: async (): Promise<{ admin: PublicAdmin }> => {
    const response = await apiRequest<{ admin: PublicAdmin }>("/auth/me");
    setAdminData(response.admin);
    return response;
  },

  /**
   * Change password
   */
  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> => {
    return apiRequest("/auth/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  /**
   * Register new admin (admin only)
   */
  register: async (data: {
    email: string;
    name: string;
    password: string;
    role?: "admin" | "editor" | "viewer";
  }): Promise<{ message: string; admin: PublicAdmin }> => {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Landing Pages API
   */
  landingPages: {
    /**
     * List all landing pages
     */
    list: async (params?: {
      published?: boolean;
      search?: string;
    }): Promise<{ pages: any[] }> => {
      const query = new URLSearchParams();
      if (params?.published !== undefined) {
        query.append("published", String(params.published));
      }
      if (params?.search) {
        query.append("search", params.search);
      }
      const queryString = query.toString();
      return apiRequest(
        `/landing-pages${queryString ? `?${queryString}` : ""}`
      );
    },

    /**
     * Get single landing page
     */
    get: async (id: string): Promise<{ page: any }> => {
      return apiRequest(`/landing-pages/${id}`);
    },

    /**
     * Create landing page
     */
    create: async (data: any): Promise<{ message: string; page: any }> => {
      return apiRequest("/landing-pages", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    /**
     * Update landing page
     */
    update: async (
      id: string,
      data: any
    ): Promise<{ message: string; page: any }> => {
      return apiRequest(`/landing-pages/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    /**
     * Delete landing page
     */
    delete: async (id: string): Promise<{ message: string }> => {
      return apiRequest(`/landing-pages/${id}`, {
        method: "DELETE",
      });
    },

    /**
     * Publish landing page
     */
    publish: async (id: string): Promise<{ message: string; page: any }> => {
      return apiRequest(`/landing-pages/${id}/publish`, {
        method: "POST",
      });
    },

    /**
     * Unpublish landing page
     */
    unpublish: async (id: string): Promise<{ message: string; page: any }> => {
      return apiRequest(`/landing-pages/${id}/unpublish`, {
        method: "POST",
      });
    },
  },

  /**
   * Careers API
   */
  careers: {
    /**
     * List all career postings (admin view - includes drafts)
     */
    list: async (params?: {
      status?: string;
      department?: string;
      location?: string;
      type?: string;
      remote?: string;
      experience?: string;
      search?: string;
      page?: number;
      limit?: number;
    }): Promise<{ postings: any[]; pagination?: any }> => {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (
            value !== undefined &&
            value !== null &&
            value !== "" &&
            value !== "all"
          ) {
            query.append(key, String(value));
          }
        });
      }
      const queryString = query.toString();
      return apiRequest(`/careers${queryString ? `?${queryString}` : ""}`);
    },

    /**
     * Get single career posting
     */
    get: async (id: string): Promise<{ posting: any }> => {
      return apiRequest(`/careers/${id}`);
    },

    /**
     * Create career posting
     */
    create: async (data: any): Promise<{ message: string; posting: any }> => {
      return apiRequest("/careers", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    /**
     * Update career posting
     */
    update: async (
      id: string,
      data: any
    ): Promise<{ message: string; posting: any }> => {
      return apiRequest(`/careers/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    /**
     * Delete career posting
     */
    delete: async (id: string): Promise<{ message: string }> => {
      return apiRequest(`/careers/${id}`, {
        method: "DELETE",
      });
    },

    /**
     * Get career statistics
     */
    getStats: async (): Promise<any> => {
      return apiRequest("/careers/stats");
    },
    /**
     * Get applications for a career posting
     */
    getApplications: async (
      postingId: string,
      params?: {
        status?: string;
        page?: number;
        limit?: number;
      }
    ): Promise<{
      applications: any[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }> => {
      const query = new URLSearchParams();
      if (params?.status) query.append("status", params.status);
      if (params?.page) query.append("page", params.page.toString());
      if (params?.limit) query.append("limit", params.limit.toString());
      const queryString = query.toString();
      return apiRequest(
        `/careers/${postingId}/applications${
          queryString ? `?${queryString}` : ""
        }`
      );
    },
    /**
     * Update application status
     */
    updateApplication: async (
      id: string,
      data: {
        status?: string;
        notes?: string;
      }
    ): Promise<{
      message: string;
      application: any;
    }> => {
      return apiRequest(`/careers/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    /**
     * Get signed URL for resume download
     */
    getResumeUrl: async (
      applicationId: string
    ): Promise<{
      url: string;
      expiresIn: number;
    }> => {
      return apiRequest(`/careers/applications/${applicationId}/resume`);
    },
    /**
     * Get signed URL for cover letter download
     */
    getCoverLetterUrl: async (
      applicationId: string
    ): Promise<{
      url: string;
      expiresIn: number;
    }> => {
      return apiRequest(`/careers/applications/${applicationId}/cover-letter`);
    },
  },

  /**
   * Forms API - Schedule Demo submissions
   */
  forms: {
    /**
     * Get Contact Us submissions
     */
    getContactUs: async (params?: {
      status?: string;
      priority?: string;
      search?: string;
      page?: number;
      limit?: number;
      dateFrom?: string;
      dateTo?: string;
    }): Promise<{
      success: boolean;
      data: {
        submissions: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
        stats: {
          total: number;
          new: number;
          contacted: number;
          qualified: number;
          closed: number;
        };
      };
    }> => {
      const query = new URLSearchParams();
      if (params?.status) query.append("status", params.status);
      if (params?.priority) query.append("priority", params.priority);
      if (params?.search) query.append("search", params.search);
      if (params?.page) query.append("page", params.page.toString());
      if (params?.limit) query.append("limit", params.limit.toString());
      if (params?.dateFrom) query.append("dateFrom", params.dateFrom);
      if (params?.dateTo) query.append("dateTo", params.dateTo);
      const queryString = query.toString();
      return apiRequest(
        `/forms/contact-us${queryString ? `?${queryString}` : ""}`
      );
    },
    /**
     * Get Contact Us submission by ID
     */
    getContactUsById: async (
      id: string
    ): Promise<{
      success: boolean;
      data: any;
    }> => {
      return apiRequest(`/forms/contact-us/${id}`);
    },
    /**
     * Update Contact Us submission
     */
    updateContactUs: async (
      id: string,
      data: {
        status?: string;
        priority?: string;
        adminNotes?: string;
      }
    ): Promise<{
      success: boolean;
      data: any;
      message: string;
    }> => {
      return apiRequest(`/forms/contact-us/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    /**
     * Delete Contact Us submission
     */
    deleteContactUs: async (
      id: string
    ): Promise<{
      success: boolean;
      message: string;
    }> => {
      return apiRequest(`/forms/contact-us/${id}`, {
        method: "DELETE",
      });
    },
    /**
     * Get statistics for all form types
     */
    getStats: async (params?: {
      dateFrom?: string;
      dateTo?: string;
    }): Promise<{
      success: boolean;
      data: {
        overall: {
          total: number;
          new: number;
          contacted: number;
          qualified: number;
          closed: number;
        };
        byFormType: Array<{
          formType: string;
          total: number;
          byStatus: {
            new: number;
            contacted: number;
            qualified: number;
            closed: number;
          };
          byPriority: Record<string, number>;
          recent: any[];
        }>;
        trends: Array<{
          date: string;
          count: number;
        }>;
      };
    }> => {
      const query = new URLSearchParams();
      if (params?.dateFrom) query.append("dateFrom", params.dateFrom);
      if (params?.dateTo) query.append("dateTo", params.dateTo);
      const queryString = query.toString();
      return apiRequest(`/forms/stats${queryString ? `?${queryString}` : ""}`);
    },
    /**
     * Get Schedule Demo submissions
     */
    getScheduleDemo: async (params?: {
      status?: string;
      priority?: string;
      search?: string;
      page?: number;
      limit?: number;
      dateFrom?: string;
      dateTo?: string;
    }): Promise<{
      success: boolean;
      data: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
      stats: {
        total: number;
        new: number;
        contacted: number;
        qualified: number;
        closed: number;
      };
    }> => {
      const query = new URLSearchParams();
      if (params?.status) query.append("status", params.status);
      if (params?.priority) query.append("priority", params.priority);
      if (params?.search) query.append("search", params.search);
      if (params?.page) query.append("page", String(params.page));
      if (params?.limit) query.append("limit", String(params.limit));
      if (params?.dateFrom) query.append("dateFrom", params.dateFrom);
      if (params?.dateTo) query.append("dateTo", params.dateTo);
      const queryString = query.toString();
      return apiRequest(
        `/forms/schedule-demo${queryString ? `?${queryString}` : ""}`
      );
    },

    /**
     * Get single Schedule Demo submission
     */
    getScheduleDemoById: async (
      id: string
    ): Promise<{
      success: boolean;
      data: any;
    }> => {
      return apiRequest(`/forms/schedule-demo/${id}`);
    },

    /**
     * Update Schedule Demo submission
     */
    updateScheduleDemo: async (
      id: string,
      data: {
        status?: string;
        priority?: string;
        adminNotes?: string;
      }
    ): Promise<{
      success: boolean;
      data: any;
    }> => {
      return apiRequest(`/forms/schedule-demo/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    /**
     * Delete Schedule Demo submission
     */
    deleteScheduleDemo: async (
      id: string
    ): Promise<{
      success: boolean;
      message: string;
    }> => {
      return apiRequest(`/forms/schedule-demo/${id}`, {
        method: "DELETE",
      });
    },
  },
};

export default publicAdminApi;
