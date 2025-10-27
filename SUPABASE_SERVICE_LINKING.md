# Supabase Service Linking Implementation

This document describes the Supabase-based service linking implementation that automatically triggers backfill operations when services are connected.

## Overview

When a user connects a service (e.g., Roobet, Shuffle), the system now:
1. Inserts/updates the linked service record in Supabase
2. Immediately triggers a backfill operation to fetch historical data
3. Returns the linked API information with backfill status

## API Endpoints

### POST `/api/services/link`

Links a service to a user's account and triggers backfill.

**Request Body:**
```json
{
  "identifier": "roobet",
  "user_id": "user_123",
  "API_key": "key_123"
}
```

**Response:**
```json
{
  "success": true,
  "linked_api": {
    "id": "uuid",
    "user_id": "user_123",
    "identifier": "roobet",
    "auth_data": {
      "user_id": "user_123",
      "API_key": "key_123"
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "backfill_triggered": true
}
```

### GET `/api/services/linked`

Retrieves all linked services for the current user.

**Response:**
```json
{
  "linked": [
    {
      "id": "uuid",
      "user_id": "user_123",
      "identifier": "roobet",
      "auth_data": { ... },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST `/api/services/unlink`

Unlinks a service and deletes associated statistics.

**Request Body:**
```json
{
  "identifier": "roobet"
}
```

**Response:**
```json
{
  "success": true,
  "deleted": {
    "hourly": 120,
    "daily": 7
  }
}
```

## Database Schema

### `linked_apis` Table

```sql
CREATE TABLE linked_apis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  identifier TEXT NOT NULL,
  auth_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, identifier)
);
```

### Required Supabase Tables

- `services` - Service definitions
- `linked_apis` - Linked service records
- `profiles` - User profiles (for timezone checking)
- `statistic_hours` - Hourly statistics
- `statistic_days` - Daily statistics

## Backfill Function

When a service is linked, a Supabase Edge Function called `backfill` is automatically invoked with:

```javascript
{
  userId: linkedApi.user_id,
  identifier: linkedApi.identifier,
  auth_data: linkedApi.auth_data,
  linked_api_id: linkedApi.id
}
```

The Edge Function should:
1. Fetch historical data from the external API
2. Store statistics in `statistic_hours` and `statistic_days` tables
3. Handle errors gracefully and log progress

## Migration Notes

### Key Changes from Appwrite

1. **Database**: Migrated from Appwrite Tables to Supabase PostgreSQL
2. **Authentication**: Uses Supabase Auth instead of Appwrite Auth
3. **Permission Model**: Uses RLS (Row Level Security) policies
4. **Backfill**: Automatic triggering via Edge Functions instead of manual triggers

### Field Mappings

| Appwrite | Supabase |
|----------|----------|
| `userId` | `user_id` |
| `linked_apis` table | `linked_apis` table |
| `auth_data` (stringified) | `auth_data` (JSONB) |

## Environment Variables

Required Supabase environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Error Handling

The implementation handles errors gracefully:
- **Backfill failures** don't fail the link operation (user can retry manually)
- **Timezone validation** prevents linking without a configured timezone
- **Existing links** are updated rather than creating duplicates
- **Statistics deletion** occurs in batches to handle large datasets

## Usage Example

```javascript
// Link a service
const response = await fetch('/api/services/link', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identifier: 'roobet',
    user_id: 'your_roobet_id',
    API_key: 'your_roobet_key'
  })
});

const { success, linked_api, backfill_triggered } = await response.json();

if (success && backfill_triggered) {
  console.log('Service linked and backfill started!');
}
```

## Future Enhancements

- Add backfill status tracking in UI
- Implement retry mechanism for failed backfills
- Add manual backfill trigger button
- Show backfill progress/status in connected sites page
- Add notification when backfill completes

