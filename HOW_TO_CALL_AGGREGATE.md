# How to Call the Aggregate Function

This guide shows you exactly how to call the aggregate edge function.

---

## Method 1: Using Supabase JS Client (Recommended)

This is the easiest and most secure way:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://lxdpznxcdkhiqlwhbhwf.supabase.co',
  'your-anon-key'
)

// Get current session
const { data: { session }, error: sessionError } = await supabase.auth.getSession()
if (sessionError || !session) {
  throw new Error('Not authenticated')
}

// Call the function
const { data, error } = await supabase.functions.invoke('aggregate', {
  body: {
    userId: session.user.id,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    jwt: session.access_token,
    mode: 'visualize',
    granularity: 'hourly',
    casinoId: 'roobet'  // Optional
  }
})

if (error) {
  console.error('Function error:', error)
  return
}

console.log('Data:', data)
```

**Why this works:** The Supabase JS client automatically adds the Authorization header with the JWT token when calling Edge Functions.

---

## Method 2: Direct Fetch (Manual Headers)

If you need to use direct fetch, you MUST include the Authorization header:

```typescript
// Get JWT first
const { data: { session } } = await supabase.auth.getSession()

const response = await fetch(
  'https://lxdpznxcdkhiqlwhbhwf.supabase.co/functions/v1/aggregate',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,  // ← REQUIRED!
    },
    body: JSON.stringify({
      userId: session.user.id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      jwt: session.access_token,  // Still pass in body
      mode: 'visualize',
      granularity: 'hourly'
    })
  }
)

const data = await response.json()
```

**Important:** When using direct fetch, you MUST include `Authorization: Bearer <JWT>` in the headers.

---

## Method 3: Supabase Dashboard Testing

1. Go to **Edge Functions** → **aggregate**
2. Click **"Invoke"** or **"Test function"**
3. Paste this (replace with real values):

```json
{
  "userId": "real-user-id",
  "jwt": "real-jwt-token",
  "granularity": "hourly",
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-01-31T23:59:59Z",
  "mode": "visualize"
}
```

---

## Quick Examples

### Summary Mode:
```typescript
const { data } = await supabase.functions.invoke('aggregate', {
  body: {
    userId: user.id,
    jwt: session.access_token,
    granularity: 'daily',
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-01-31T23:59:59Z',
    mode: 'summary'
  }
})
```

### Visualize Mode (with charts):
```typescript
const { data } = await supabase.functions.invoke('aggregate', {
  body: {
    userId: user.id,
    jwt: session.access_token,
    granularity: 'hourly',
    startDate: '2025-01-27T00:00:00Z',
    endDate: '2025-01-27T23:59:59Z',
    mode: 'visualize'
  }
})

// data.timeSeries contains chart data
```

### Users Mode (per-player totals):
```typescript
const { data } = await supabase.functions.invoke('aggregate', {
  body: {
    userId: user.id,
    jwt: session.access_token,
    granularity: 'daily',
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-01-31T23:59:59Z',
    mode: 'users'
  }
})

// data.users contains per-player stats
```

---

## Error Handling

```typescript
const { data, error } = await supabase.functions.invoke('aggregate', {
  body: { /* ... */ }
})

if (error) {
  console.error('Function error:', error.message)
  
  if (error.message.includes('401')) {
    console.error('Authentication failed - check your JWT')
  } else if (error.message.includes('403')) {
    console.error('Permission denied')
  }
  
  return
}

if (!data.success) {
  console.error('Request failed:', data.error)
  return
}

// Success!
console.log('Total wagered:', data.summary.totalWagered)
```

---

## Complete Example

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://lxdpznxcdkhiqlwhbhwf.supabase.co',
  'your-anon-key'
)

async function getCasinoStats(startDate: Date, endDate: Date, mode = 'visualize') {
  // 1. Get session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Please sign in')
  }

  // 2. Call aggregate function
  const { data, error } = await supabase.functions.invoke('aggregate', {
    body: {
      userId: session.user.id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      jwt: session.access_token,
      mode,
      granularity: 'hourly'
    }
  })

  if (error) throw error
  if (!data.success) throw new Error(data.error)

  return data
}

// Usage
const stats = await getCasinoStats(
  new Date('2025-01-01'),
  new Date('2025-01-31'),
  'visualize'
)

console.log('Total wagered:', stats.summary.totalWagered)
console.log('Time series:', stats.timeSeries)
```

---

## Key Points

✅ **Use Method 1** (Supabase JS client) - it's the easiest  
✅ **JWT is required** - get it from `session.access_token`  
✅ **Include userId** - must match the authenticated user  
✅ **Authorization header** - automatically added by JS client  

❌ **Don't skip the JWT** - function will return 401  
❌ **Don't use wrong user ID** - will return 403  

---

**Function URL:** `https://lxdpznxcdkhiqlwhbhwf.supabase.co/functions/v1/aggregate`

**Status:** ✅ Deployed and working

---

**End of Guide**

