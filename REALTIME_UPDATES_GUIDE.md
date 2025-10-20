# Real-Time Updates System - PropertyHub

## 🚀 Overview

PropertyHub now features a **real-time data synchronization system** powered by Socket.io and Redis. This ensures that all users see data updates immediately without needing to refresh their browser.

---

## 🔧 Technology Stack

- **Backend:** Socket.io with Redis Adapter (fallback to single-server mode without Redis)
- **Frontend:** Socket.io Client
- **Database:** PostgreSQL (for persistent data)
- **Message Broker:** Redis Pub/Sub (optional, for horizontal scaling)

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Users                                 │
│  Admin Dashboard  │  Owner Dashboard  │  Manager Dashboard  │
└────────┬──────────┴──────────┬────────┴─────────┬──────────┘
         │                     │                   │
         │ WebSocket           │ WebSocket         │ WebSocket
         │                     │                   │
┌────────▼─────────────────────▼───────────────────▼─────────┐
│              Socket.io Server (Port 5000)                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Authentication Middleware (JWT)                    │    │
│  │  Room Management (user, customer, role-based)       │    │
│  └────────────────────────────────────────────────────┘    │
└────────┬─────────────────────────────────────────────────────┘
         │
┌────────▼─────────────────────────────────────────────────────┐
│              Redis Pub/Sub (Optional)                         │
│  Enables horizontal scaling across multiple servers          │
└────────┬─────────────────────────────────────────────────────┘
         │
┌────────▼─────────────────────────────────────────────────────┐
│              PostgreSQL Database                              │
│  Source of truth for all data                                │
└───────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication & Authorization

### Socket Authentication
All Socket.io connections require JWT authentication:

```typescript
// Frontend
const token = localStorage.getItem('token');
initializeSocket(token);

// Backend
socket.data.user = jwt.verify(token, process.env.JWT_SECRET);
```

### Room-Based Authorization
Users are automatically joined to appropriate rooms based on their role:

| Room Type | Users | Purpose |
|-----------|-------|---------|
| `user:{userId}` | All users | User-specific notifications |
| `customer:{customerId}` | Owner, Managers, Tenants | Customer-specific updates |
| `admins` | Super Admin, Internal Admins | Admin-only events |
| `owners` | Property Owners | Owner-specific broadcasts |
| `managers` | Property Managers | Manager-specific broadcasts |
| `tenants` | Tenants | Tenant-specific broadcasts |

---

## 📡 Real-Time Events

### Customer Events (Admin Dashboard)

#### 1. `customer:created`
**Triggered when:** A new customer is added
**Emitted to:** All admins
**Payload:**
```typescript
{
  customer: {
    id: string;
    company: string;
    owner: string;
    email: string;
    status: string;
    plan: {
      name: string;
      monthlyPrice: number;
    };
    _count: {
      properties: number;
      users: number;
    };
    // ... other customer fields
  }
}
```

**Frontend Handler:**
```typescript
subscribeToCustomerEvents({
  onCreated: (data) => {
    toast.success(`New customer ${data.customer.company} was added`);
    setCustomers((prev) => [data.customer, ...prev]);
  }
});
```

---

#### 2. `customer:updated`
**Triggered when:** A customer's information is modified
**Emitted to:** All admins
**Payload:**
```typescript
{
  customer: {
    // Updated customer object with all fields
  }
}
```

**Frontend Handler:**
```typescript
subscribeToCustomerEvents({
  onUpdated: (data) => {
    toast.info(`Customer ${data.customer.company} was updated`);
    setCustomers((prev) =>
      prev.map((c) => (c.id === data.customer.id ? data.customer : c))
    );
  }
});
```

---

#### 3. `customer:deleted`
**Triggered when:** A customer is deleted
**Emitted to:** All admins
**Payload:**
```typescript
{
  customerId: string;
}
```

**Frontend Handler:**
```typescript
subscribeToCustomerEvents({
  onDeleted: (data) => {
    toast.info('A customer was deleted');
    setCustomers((prev) => prev.filter((c) => c.id !== data.customerId));
  }
});
```

---

### User Events (Admin Dashboard)

#### 1. `user:created`
**Triggered when:** A new internal admin user is added
**Emitted to:** All admins
**Payload:**
```typescript
{
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
    company?: string;
    permissions?: string[];
    isActive: boolean;
    status: string;
    // ... other user fields (no password)
  }
}
```

**Frontend Handler:**
```typescript
subscribeToUserEvents({
  onCreated: (data) => {
    toast.success(`New user ${data.user.name} was added`);
    fetchUsersData(); // Refresh users list
  }
});
```

---

#### 2. `user:updated`
**Triggered when:** An internal admin user is modified (role change, status change, etc.)
**Emitted to:** All admins
**Payload:**
```typescript
{
  user: {
    // Updated user object with all fields (no password)
  }
}
```

**Frontend Handler:**
```typescript
subscribeToUserEvents({
  onUpdated: (data) => {
    toast.info(`User ${data.user.name} was updated`);
    setUsers((prev) =>
      prev.map((u) => (u.id === data.user.id ? data.user : u))
    );
  }
});
```

---

#### 3. `user:deleted`
**Triggered when:** An internal admin user is deleted
**Emitted to:** All admins
**Payload:**
```typescript
{
  userId: string;
}
```

**Frontend Handler:**
```typescript
subscribeToUserEvents({
  onDeleted: (data) => {
    toast.info('A user was deleted');
    setUsers((prev) => prev.filter((u) => u.id !== data.userId));
  }
});
```

---

### Account Events (Owner/Manager Dashboard)

#### `account:updated`
**Triggered when:** Admin updates customer account information
**Emitted to:** All users of that customer (owner, managers, tenants)
**Payload:**
```typescript
{
  customer: {
    // Updated customer object
  }
}
```

**Frontend Handler:**
```typescript
subscribeToAccountEvents({
  onUpdated: (data) => {
    toast.info('Your account information was updated');
    setAccountInfo(data.customer);
  }
});
```

---

## 🔨 Implementation Guide

### Backend: Emitting Events

When data changes in your backend routes, emit events using the socket utilities:

```typescript
// In backend/src/routes/customers.ts
import { emitToAdmins, emitToCustomer } from '../lib/socket';

// After creating a customer
emitToAdmins('customer:created', {
  customer: newCustomer
});

// After updating a customer
emitToAdmins('customer:updated', { customer: updatedCustomer });
emitToCustomer(customerId, 'account:updated', { customer: updatedCustomer });

// After deleting a customer
emitToAdmins('customer:deleted', { customerId: id });
```

**Available Backend Functions:**
- `emitToAdmins(event, data)` - Send to all admins
- `emitToCustomer(customerId, event, data)` - Send to all users of a customer
- `emitToUser(userId, event, data)` - Send to specific user
- `emitToOwners(event, data)` - Send to all owners
- `emitToManagers(event, data)` - Send to all managers
- `emitToTenants(event, data)` - Send to all tenants
- `emitToRoom(room, event, data)` - Send to specific room
- `emitToAll(event, data)` - Broadcast to all connected clients

---

### Frontend: Subscribing to Events

#### Admin Dashboard

```typescript
import { 
  initializeSocket, 
  subscribeToCustomerEvents, 
  unsubscribeFromCustomerEvents 
} from '../lib/socket';

useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    initializeSocket(token);

    subscribeToCustomerEvents({
      onCreated: (data) => {
        // Handle new customer
        setCustomers((prev) => [data.customer, ...prev]);
      },
      onUpdated: (data) => {
        // Handle customer update
        setCustomers((prev) =>
          prev.map((c) => (c.id === data.customer.id ? data.customer : c))
        );
      },
      onDeleted: (data) => {
        // Handle customer deletion
        setCustomers((prev) => prev.filter((c) => c.id !== data.customerId));
      }
    });
  }

  return () => {
    unsubscribeFromCustomerEvents();
  };
}, []);
```

---

#### Owner/Manager Dashboard

```typescript
import { 
  initializeSocket, 
  subscribeToAccountEvents, 
  unsubscribeFromAccountEvents 
} from '../lib/socket';

useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    initializeSocket(token);

    subscribeToAccountEvents({
      onUpdated: (data) => {
        // Handle account update
        setAccountInfo(data.customer);
        toast.info('Your account information was updated');
      }
    });
  }

  return () => {
    unsubscribeFromAccountEvents();
  };
}, []);
```

---

## 🧪 Testing Real-Time Updates

### Test Scenario 1: Admin Updates Customer

1. **Open two browser tabs:**
   - Tab 1: Admin Dashboard
   - Tab 2: Owner Dashboard (logged in as that customer)

2. **In Admin Dashboard (Tab 1):**
   - Edit a customer's information
   - Change company name, plan, or any other field
   - Click "Save"

3. **Expected Results:**
   - ✅ **Admin Dashboard (Tab 1):** Customer list updates immediately
   - ✅ **Owner Dashboard (Tab 2):** Account settings update immediately
   - ✅ **Toast notification appears** in both dashboards
   - ✅ **No page refresh required**

---

### Test Scenario 2: Admin Creates Customer

1. **Open Admin Dashboard**
2. **Create a new customer**
3. **In another admin tab/window:**
   - ✅ New customer appears in the list immediately
   - ✅ Customer count updates
   - ✅ Toast notification shows

---

### Test Scenario 3: Admin Deletes Customer

1. **Open two admin dashboard tabs**
2. **In one tab, delete a customer**
3. **In the other tab:**
   - ✅ Customer disappears from the list immediately
   - ✅ Customer count updates
   - ✅ Toast notification shows

---

### Test Scenario 4: Admin Changes User Role

1. **Open two admin dashboard tabs**
   - Both tabs showing User Management page

2. **In Admin Dashboard (Tab 1):**
   - Find an internal admin user
   - Edit the user
   - Change role from "Super Admin" to "Support"
   - Click "Save"

3. **Expected Results:**
   - ✅ **Tab 1:** User list updates with new role immediately
   - ✅ **Tab 2:** User list updates with new role immediately
   - ✅ **Toast notification appears** in both tabs
   - ✅ **No page refresh required**
   - ✅ **User count remains the same** (only role changed)

---

## 🔍 Debugging

### Enable Socket.io Debug Logs

**Backend:**
```bash
cd backend
DEBUG=socket.io:* npm run dev
```

**Frontend (Browser Console):**
```javascript
localStorage.setItem('debug', 'socket.io-client:*');
// Refresh page
```

### Check Socket Connection Status

**Frontend:**
```typescript
import { isConnected, getSocket } from '../lib/socket';

console.log('Connected:', isConnected());
console.log('Socket:', getSocket());
```

### Common Issues

#### Issue: "Socket not connecting"
**Solution:**
- Verify backend is running on port 5000
- Check CORS settings in backend
- Ensure token is valid and not expired

#### Issue: "Events not received"
**Solution:**
- Check room subscriptions (user might not be in the right room)
- Verify event names match between emit and subscribe
- Check authentication token

#### Issue: "Multiple socket connections"
**Solution:**
- Call `disconnectSocket()` before re-initializing
- Use `useEffect` cleanup functions properly

---

## 🚀 Performance Considerations

### 1. Connection Pooling
- Socket.io automatically manages connection pooling
- Reconnects automatically on disconnect
- Max 5 reconnection attempts

### 2. Message Throttling
- Consider implementing rate limiting for high-frequency events
- Use debouncing for rapid updates

### 3. Room Management
- Users automatically join/leave rooms on connect/disconnect
- No manual cleanup required

### 4. Scaling with Redis
To enable horizontal scaling:

1. **Install Redis:**
```bash
brew install redis  # macOS
brew services start redis
```

2. **Update `.env`:**
```env
REDIS_URL=redis://localhost:6379
```

3. **Restart backend:**
```bash
npm run dev
```

Socket.io will automatically use Redis adapter for multi-server support.

---

## 📈 Monitoring

### Get Connected Clients Count

**Backend:**
```typescript
import { getConnectedClientsCount, getRoomClientsCount } from '../lib/socket';

const total = await getConnectedClientsCount();
const admins = await getRoomClientsCount('admins');
console.log(`Total: ${total}, Admins: ${admins}`);
```

### Connection Events

**Frontend:**
```typescript
import { on, off } from '../lib/socket';

// Listen for connection status
on('connect', () => console.log('Connected!'));
on('disconnect', (reason) => console.log('Disconnected:', reason));
on('error', (error) => console.error('Error:', error));
```

---

## 🔮 Future Enhancements

1. **Property Events** - Real-time updates when properties are added/updated
2. **Payment Events** - Notify when payments are received
3. **Maintenance Events** - Real-time ticket updates
4. **Notification System** - In-app notifications via Socket.io
5. **Presence Indicators** - Show who's online
6. **Typing Indicators** - For chat/support features
7. **Activity Feeds** - Real-time activity logs

---

## 📝 Event Naming Convention

Follow this pattern for consistency:

```
{entity}:{action}

Examples:
- customer:created
- customer:updated
- customer:deleted
- property:created
- payment:received
- maintenance:updated
- notification (standalone event)
```

---

## 🛡️ Security Best Practices

1. **Always authenticate** - Never allow unauthenticated connections
2. **Use rooms** - Don't broadcast sensitive data to all users
3. **Validate payloads** - Sanitize data before emitting
4. **Rate limiting** - Prevent socket spam
5. **Token expiration** - Disconnect sockets with expired tokens

---

## 📚 Additional Resources

- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Redis Documentation](https://redis.io/documentation)
- [Socket.io Redis Adapter](https://socket.io/docs/v4/redis-adapter/)

---

## ✅ Current Implementation Status

### ✅ Implemented
- Socket.io server with authentication
- Room-based authorization
- Customer events (create, update, delete)
- Account events (update)
- User events (create, update, delete)
- Frontend Socket.io client
- Admin Dashboard integration (Customer & User Management)
- Owner Dashboard integration
- Toast notifications for real-time updates
- Automatic reconnection
- Fallback mode (works without Redis)

### 🔄 Pending
- Property events
- Payment events
- Maintenance events
- Manager Dashboard integration (real-time)
- Tenant Dashboard integration (real-time)
- Notification center integration

---

## 🎯 Quick Start

1. **Backend is already configured** - Socket.io runs automatically when you start the server
2. **Redis is optional** - Works in fallback mode without Redis
3. **Frontend components already integrated** - Admin and Owner dashboards have real-time support
4. **Test immediately** - Open two tabs and try editing a customer!

**That's it! Your PropertyHub application now has real-time data synchronization! 🎉**

