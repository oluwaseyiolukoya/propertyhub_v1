import { apiClient, ApiResponse } from '../api-client';

export interface Notification {
  id: string;
  customer_id: string;
  user_id: string | null;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  read_at: string | null;
  action_url: string | null;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  customer_id: string;
  email_enabled: boolean;
  email_invoice_approval: boolean;
  email_invoice_approved: boolean;
  email_invoice_rejected: boolean;
  email_invoice_paid: boolean;
  email_team_invitation: boolean;
  email_delegation: boolean;
  email_daily_digest: boolean;
  email_weekly_summary: boolean;
  inapp_enabled: boolean;
  inapp_invoice_approval: boolean;
  inapp_invoice_approved: boolean;
  inapp_invoice_rejected: boolean;
  inapp_invoice_paid: boolean;
  inapp_team_invitation: boolean;
  inapp_delegation: boolean;
  push_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  quiet_hours_timezone: string;
  created_at: string;
  updated_at: string;
}

export interface GetNotificationsParams {
  unread?: boolean;
  type?: string;
  limit?: number;
  offset?: number;
}

export interface UpdatePreferencesData {
  email_enabled?: boolean;
  email_invoice_approval?: boolean;
  email_invoice_approved?: boolean;
  email_invoice_rejected?: boolean;
  email_invoice_paid?: boolean;
  email_team_invitation?: boolean;
  email_delegation?: boolean;
  email_daily_digest?: boolean;
  email_weekly_summary?: boolean;
  inapp_enabled?: boolean;
  inapp_invoice_approval?: boolean;
  inapp_invoice_approved?: boolean;
  inapp_invoice_rejected?: boolean;
  inapp_invoice_paid?: boolean;
  inapp_team_invitation?: boolean;
  inapp_delegation?: boolean;
  push_enabled?: boolean;
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  quiet_hours_timezone?: string;
}

/**
 * Get notifications for the current user
 */
export async function getNotifications(params?: GetNotificationsParams): Promise<ApiResponse<{ data: Notification[]; count: number }>> {
  const queryParams = new URLSearchParams();

  if (params?.unread) queryParams.append('unread', 'true');
  if (params?.type) queryParams.append('type', params.type);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const query = queryParams.toString();
  return apiClient.get(`/api/notifications${query ? `?${query}` : ''}`);
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
  return apiClient.get('/api/notifications/unread-count');
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<ApiResponse<{ message: string }>> {
  return apiClient.put(`/api/notifications/${notificationId}/read`, {});
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<ApiResponse<{ message: string; count: number }>> {
  return apiClient.put('/api/notifications/read-all', {});
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<ApiResponse<{ message: string }>> {
  return apiClient.delete(`/api/notifications/${notificationId}`);
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(): Promise<ApiResponse<NotificationPreferences>> {
  return apiClient.get('/api/notifications/preferences');
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(data: UpdatePreferencesData): Promise<ApiResponse<{ data: NotificationPreferences; message: string }>> {
  return apiClient.put('/api/notifications/preferences', data);
}

/**
 * Send a test notification
 */
export async function sendTestNotification(): Promise<ApiResponse<{ data: Notification; message: string }>> {
  return apiClient.post('/api/notifications/test', {});
}

