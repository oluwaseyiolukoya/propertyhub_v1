# Maintenance Reply Fix - Tenant Cannot See Manager Replies

## Problem
Tenants could not see replies from Property Managers when viewing maintenance tickets. The updates/replies section was empty even after managers responded.

## Root Cause
When a tenant clicked "View" on a maintenance ticket, the component was setting `selectedRequest` to the ticket object from the list, which only contained basic information without the `updates` field. The backend's `GET /api/maintenance/:id` endpoint includes the full ticket details with updates, but the frontend was not calling this endpoint when viewing a ticket.

## Solution

### Frontend Changes (`src/components/TenantMaintenanceRequests.tsx`)

1. **Added `getMaintenanceRequest` import** to fetch full ticket details
2. **Created `handleViewTicket` function** that:
   - Calls `GET /api/maintenance/:id` to fetch full ticket details including updates
   - Sets the selected request with complete data
   - Shows loading state while fetching

3. **Updated `handleReply` function** to:
   - After sending a reply, fetch the updated ticket details from the backend
   - This ensures the tenant sees their own reply and any new manager replies

4. **Enhanced real-time updates** to:
   - When a `maintenance:updated` event is received, check if the updated ticket is currently open
   - If yes, automatically refresh the ticket details to show new replies instantly

5. **Updated all "View" buttons** to call `handleViewTicket(request)` instead of `setSelectedRequest(request)`

### Backend Changes (`backend/src/routes/maintenance.ts`)

The backend was already correctly configured:
- `GET /api/maintenance/:id` includes the `updates` relation with `updatedBy` user information
- Updates are ordered by `createdAt: 'desc'` (newest first)
- Socket events are emitted on create/update/reply to notify all relevant users

## How It Works Now

1. **Tenant views a ticket**:
   - Frontend calls `GET /api/maintenance/:id`
   - Backend returns full ticket with all updates/replies
   - Tenant sees complete conversation thread

2. **Manager replies to ticket**:
   - Manager posts reply via `POST /api/maintenance/:id/replies`
   - Backend creates update record and emits `maintenance:updated` event
   - Tenant's browser receives socket event and refreshes ticket details
   - Tenant instantly sees manager's reply

3. **Tenant replies back**:
   - Tenant posts reply via `POST /api/maintenance/:id/replies`
   - After successful reply, frontend fetches updated ticket details
   - Tenant sees their own reply in the thread
   - Manager and owner receive socket notification

## Thread Display Format

Updates are displayed with:
- **User name**: Who made the update (from `updatedBy.name`)
- **Timestamp**: When the update was created
- **Message**: The reply/note content

Example:
```
John Manager
11/2/2025, 3:45 PM
We'll send someone to check this tomorrow morning.
```

## Real-time Communication Flow

```
Tenant creates ticket
    ↓
Manager/Owner receives notification (socket)
    ↓
Manager replies to ticket
    ↓
Backend emits maintenance:updated
    ↓
Tenant's browser receives event
    ↓
Tenant's view auto-refreshes
    ↓
Tenant sees manager's reply instantly
```

## Testing Checklist

- [x] Tenant can view ticket details with updates
- [x] Tenant sees manager replies in the thread
- [x] Tenant can reply to manager's response
- [x] Real-time updates work (tenant sees new replies without refresh)
- [x] Owner can see the full conversation thread
- [x] Updates are ordered correctly (newest first)
- [x] User names are displayed correctly in the thread

## Files Modified

1. `src/components/TenantMaintenanceRequests.tsx`
   - Added `handleViewTicket` function
   - Updated `handleReply` to refresh ticket details
   - Enhanced real-time event handling
   - Updated all View button click handlers

2. `backend/src/routes/maintenance.ts`
   - Already had correct implementation with updates included
   - Socket events properly emitted on all actions

## Status
✅ **FIXED** - Tenants can now see manager replies and the full conversation thread works as expected, similar to support tickets.

