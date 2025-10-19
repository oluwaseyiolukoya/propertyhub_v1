/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

// API Base URL - Update this based on environment
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    VERIFY: '/api/auth/verify',
    SETUP_PASSWORD: '/api/auth/setup-password',
  },
  
  // Dashboard
  DASHBOARD: {
    MANAGER_OVERVIEW: '/api/dashboard/manager/overview',
    MANAGER_PERFORMANCE: '/api/dashboard/manager/property-performance',
    OWNER_OVERVIEW: '/api/dashboard/owner/overview',
  },
  
  // Properties
  PROPERTIES: {
    LIST: '/api/properties',
    GET: (id: string) => `/api/properties/${id}`,
    CREATE: '/api/properties',
    UPDATE: (id: string) => `/api/properties/${id}`,
    DELETE: (id: string) => `/api/properties/${id}`,
    ANALYTICS: (id: string) => `/api/properties/${id}/analytics`,
  },
  
  // Units
  UNITS: {
    LIST: '/api/units',
    GET: (id: string) => `/api/units/${id}`,
    CREATE: '/api/units',
    UPDATE: (id: string) => `/api/units/${id}`,
    DELETE: (id: string) => `/api/units/${id}`,
  },
  
  // Leases
  LEASES: {
    LIST: '/api/leases',
    GET: (id: string) => `/api/leases/${id}`,
    CREATE: '/api/leases',
    UPDATE: (id: string) => `/api/leases/${id}`,
    TERMINATE: (id: string) => `/api/leases/${id}/terminate`,
  },
  
  // Maintenance
  MAINTENANCE: {
    LIST: '/api/maintenance',
    GET: (id: string) => `/api/maintenance/${id}`,
    CREATE: '/api/maintenance',
    UPDATE: (id: string) => `/api/maintenance/${id}`,
    ASSIGN: (id: string) => `/api/maintenance/${id}/assign`,
    COMPLETE: (id: string) => `/api/maintenance/${id}/complete`,
    STATS: '/api/maintenance/stats/overview',
  },
  
  // Payments
  PAYMENTS: {
    LIST: '/api/payments',
    GET: (id: string) => `/api/payments/${id}`,
    CREATE: '/api/payments',
    UPDATE: (id: string) => `/api/payments/${id}`,
    STATS: '/api/payments/stats/overview',
    OVERDUE: '/api/payments/overdue/list',
  },
  
  // Tenant
  TENANT: {
    DASHBOARD: '/api/tenant/dashboard/overview',
    PROFILE: '/api/tenant/profile',
    UPDATE_PROFILE: '/api/tenant/profile',
    CHANGE_PASSWORD: '/api/tenant/change-password',
    LEASE: '/api/tenant/lease',
    PAYMENT_HISTORY: '/api/tenant/payment-history',
    SUBMIT_PAYMENT: '/api/tenant/submit-payment',
    DOCUMENTS: '/api/tenant/documents',
  },
  
  // Users
  USERS: {
    LIST: '/api/users',
    GET: (id: string) => `/api/users/${id}`,
    CREATE: '/api/users',
    UPDATE: (id: string) => `/api/users/${id}`,
    DELETE: (id: string) => `/api/users/${id}`,
    SEND_INVITATION: '/api/users/send-invitation',
  },
  
  // Customers (Admin)
  CUSTOMERS: {
    LIST: '/api/customers',
    GET: (id: string) => `/api/customers/${id}`,
    CREATE: '/api/customers',
    UPDATE: (id: string) => `/api/customers/${id}`,
    DELETE: (id: string) => `/api/customers/${id}`,
    STATS: '/api/customers/stats',
  },
  
  // Support Tickets
  SUPPORT: {
    LIST: '/api/support-tickets',
    GET: (id: string) => `/api/support-tickets/${id}`,
    CREATE: '/api/support-tickets',
    UPDATE: (id: string) => `/api/support-tickets/${id}`,
    REPLY: (id: string) => `/api/support-tickets/${id}/reply`,
    CLOSE: (id: string) => `/api/support-tickets/${id}/close`,
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: '/api/notifications',
    MARK_READ: (id: string) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/mark-all-read',
  },
  
  // Analytics
  ANALYTICS: {
    OVERVIEW: '/api/analytics/overview',
    REVENUE: '/api/analytics/revenue',
    OCCUPANCY: '/api/analytics/occupancy',
  },
  
  // Plans (Admin)
  PLANS: {
    LIST: '/api/plans',
    GET: (id: string) => `/api/plans/${id}`,
    CREATE: '/api/plans',
    UPDATE: (id: string) => `/api/plans/${id}`,
    DELETE: (id: string) => `/api/plans/${id}`,
  },
};

// Request timeout (30 seconds)
export const REQUEST_TIMEOUT = 30000;

// Storage keys
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_data',
  USER_TYPE: 'user_type',
};

