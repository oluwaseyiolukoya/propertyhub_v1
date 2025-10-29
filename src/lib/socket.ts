import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

interface SocketEventCallback {
  (data: any): void;
}

/**
 * Initialize Socket.io client with authentication
 */
export const initializeSocket = (token: string): Socket => {
  // Don't create multiple connections
  if (socket?.connected) {
    console.log('✅ Socket already connected');
    return socket;
  }

  // Disconnect existing socket if any
  if (socket) {
    socket.disconnect();
  }

  const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  console.log('🔌 Initializing Socket.io connection...');

  socket = io(serverUrl, {
    auth: {
      token
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    timeout: 20000,
    autoConnect: true
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('✅ Connected to real-time server');
    console.log('📡 Socket ID:', socket?.id);
    reconnectAttempts = 0;
  });

  socket.on('connected', (data) => {
    console.log('✅ Server confirmed connection:', data);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected from real-time server:', reason);

    // Auto-reconnect for certain reasons
    if (reason === 'io server disconnect') {
      // Server disconnected us, try to reconnect manually
      console.log('🔄 Attempting manual reconnection...');
      setTimeout(() => {
        if (socket && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          socket.connect();
        }
      }, 1000);
    }
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message);

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('❌ Max reconnection attempts reached. Please refresh the page.');
    }
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`✅ Reconnected after ${attemptNumber} attempts`);
    reconnectAttempts = 0;
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
  });

  socket.on('reconnect_error', (error) => {
    console.error('❌ Reconnection error:', error.message);
  });

  socket.on('reconnect_failed', () => {
    console.error('❌ Reconnection failed. Please refresh the page.');
  });

  // Pong response for ping
  socket.on('pong', (data) => {
    console.log('🏓 Pong received:', data);
  });

  return socket;
};

/**
 * Get the current socket instance
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Check if socket is connected
 */
export const isConnected = (): boolean => {
  return socket?.connected || false;
};

/**
 * Subscribe to a specific event
 */
export const on = (event: string, callback: SocketEventCallback): void => {
  if (!socket) {
    console.warn('⚠️  Socket not initialized. Call initializeSocket() first.');
    return;
  }

  socket.on(event, callback);
  console.log(`📡 Subscribed to event: ${event}`);
};

/**
 * Unsubscribe from a specific event
 */
export const off = (event: string, callback?: SocketEventCallback): void => {
  if (!socket) {
    return;
  }

  if (callback) {
    socket.off(event, callback);
  } else {
    socket.off(event);
  }
  console.log(`📡 Unsubscribed from event: ${event}`);
};

/**
 * Emit an event to the server
 */
export const emit = (event: string, data?: any): void => {
  if (!socket) {
    console.warn('⚠️  Socket not initialized. Call initializeSocket() first.');
    return;
  }

  socket.emit(event, data);
  console.log(`📤 Emitted event: ${event}`, data);
};

/**
 * Send ping to check connection
 */
export const ping = (): void => {
  emit('ping');
};

/**
 * Disconnect socket
 */
export const disconnectSocket = (): void => {
  if (socket) {
    console.log('🔌 Disconnecting socket...');
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    reconnectAttempts = 0;
  }
};

/**
 * Reconnect socket
 */
export const reconnectSocket = (): void => {
  if (socket) {
    console.log('🔄 Reconnecting socket...');
    socket.connect();
  } else {
    console.warn('⚠️  Socket not initialized. Call initializeSocket() first.');
  }
};

/**
 * Subscribe to customer events (for admin)
 */
export const subscribeToCustomerEvents = (callbacks: {
  onCreated?: (data: any) => void;
  onUpdated?: (data: any) => void;
  onDeleted?: (data: any) => void;
}) => {
  if (callbacks.onCreated) {
    on('customer:created', callbacks.onCreated);
  }
  if (callbacks.onUpdated) {
    on('customer:updated', callbacks.onUpdated);
  }
  if (callbacks.onDeleted) {
    on('customer:deleted', callbacks.onDeleted);
  }
};

/**
 * Unsubscribe from customer events
 */
export const unsubscribeFromCustomerEvents = () => {
  off('customer:created');
  off('customer:updated');
  off('customer:deleted');
};

/**
 * Subscribe to account events (for customers)
 */
export const subscribeToAccountEvents = (callbacks: {
  onUpdated?: (data: any) => void;
}) => {
  if (callbacks.onUpdated) {
    on('account:updated', callbacks.onUpdated);
  }
};

/**
 * Unsubscribe from account events
 */
export const unsubscribeFromAccountEvents = () => {
  off('account:updated');
};

/**
 * Subscribe to user events (for admin)
 */
export const subscribeToUserEvents = (callbacks: {
  onCreated?: (data: any) => void;
  onUpdated?: (data: any) => void;
  onDeleted?: (data: any) => void;
}) => {
  if (callbacks.onCreated) {
    on('user:created', callbacks.onCreated);
  }
  if (callbacks.onUpdated) {
    on('user:updated', callbacks.onUpdated);
  }
  if (callbacks.onDeleted) {
    on('user:deleted', callbacks.onDeleted);
  }
};

/**
 * Unsubscribe from user events
 */
export const unsubscribeFromUserEvents = () => {
  off('user:created');
  off('user:updated');
  off('user:deleted');
};

/**
 * Subscribe to property events
 */
export const subscribeToPropertyEvents = (callbacks: {
  onCreated?: (data: any) => void;
  onUpdated?: (data: any) => void;
  onDeleted?: (data: any) => void;
}) => {
  if (callbacks.onCreated) {
    on('property:created', callbacks.onCreated);
  }
  if (callbacks.onUpdated) {
    on('property:updated', callbacks.onUpdated);
  }
  if (callbacks.onDeleted) {
    on('property:deleted', callbacks.onDeleted);
  }
};

/**
 * Unsubscribe from property events
 */
export const unsubscribeFromPropertyEvents = () => {
  off('property:created');
  off('property:updated');
  off('property:deleted');
};

/**
 * Subscribe to payment events
 */
export const subscribeToPaymentEvents = (callbacks: {
  onReceived?: (data: any) => void;
  onUpdated?: (data: any) => void;
}) => {
  if (callbacks.onReceived) {
    on('payment:received', callbacks.onReceived);
  }
  if (callbacks.onUpdated) {
    on('payment:updated', callbacks.onUpdated);
  }
};

/**
 * Unsubscribe from payment events
 */
export const unsubscribeFromPaymentEvents = () => {
  off('payment:received');
  off('payment:updated');
};

/**
 * Subscribe to maintenance events
 */
export const subscribeToMaintenanceEvents = (callbacks: {
  onCreated?: (data: any) => void;
  onUpdated?: (data: any) => void;
}) => {
  if (callbacks.onCreated) {
    on('maintenance:created', callbacks.onCreated);
  }
  if (callbacks.onUpdated) {
    on('maintenance:updated', callbacks.onUpdated);
  }
};

/**
 * Unsubscribe from maintenance events
 */
export const unsubscribeFromMaintenanceEvents = () => {
  off('maintenance:created');
  off('maintenance:updated');
};

/**
 * Subscribe to notification events
 */
export const subscribeToNotificationEvents = (callback: (data: any) => void) => {
  on('notification', callback);
};

/**
 * Unsubscribe from notification events
 */
export const unsubscribeFromNotificationEvents = () => {
  off('notification');
};

/**
 * Subscribe to force re-authentication events
 */
export const subscribeToForceReauth = (callback: (data: { reason: string; timestamp: string }) => void) => {
  on('force:reauth', callback);
};

/**
 * Unsubscribe from force re-authentication events
 */
export const unsubscribeFromForceReauth = () => {
  off('force:reauth');
};

/**
 * Subscribe to permissions updated events (customer-wide)
 */
export const subscribeToPermissionsUpdated = (callback: (data: { customerId: string; permissions: any }) => void) => {
  on('permissions:updated', callback);
};

/**
 * Unsubscribe from permissions updated events
 */
export const unsubscribeFromPermissionsUpdated = () => {
  off('permissions:updated');
};

