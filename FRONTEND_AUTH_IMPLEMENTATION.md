# Frontend Authentication Implementation Guide

**Version:** 1.0  
**Updated:** 2025-01-27  
**Purpose:** Complete guide for implementing Supabase authentication in your frontend

---

## Table of Contents

1. [Overview](#overview)
2. [Setup & Installation](#setup--installation)
3. [Initialization](#initialization)
4. [Authentication Methods](#authentication-methods)
5. [Session Management](#session-management)
6. [Making Authenticated Requests](#making-authenticated-requests)
7. [Best Practices](#best-practices)
8. [Error Handling](#error-handling)
9. [Code Examples](#code-examples)

---

## Overview

WagerDash uses Supabase authentication with Row-Level Security (RLS) to ensure users can only access their own data. The authentication flow works as follows:

1. User signs up/signs in via Supabase Auth
2. Supabase returns a JWT token containing the user's ID
3. This token is used in all API requests to authenticate
4. Supabase's RLS policies automatically filter data to the user's records

### Key Concepts

- **Session:** Contains the user's JWT token and metadata
- **JWT Token:** Sent in every request header to authenticate
- **RLS Policies:** Automatically restrict database queries to user's own data
- **Auth State:** Tracked via Supabase's reactive auth state

---

## Setup & Installation

### Step 1: Install Supabase Client

```bash
npm install @supabase/supabase-js
# or
yarn add @supabase/supabase-js
# or
pnpm add @supabase/supabase-js
```

### Step 2: Get Your Credentials

From your Supabase dashboard:
1. Go to Settings > API
2. Copy your **Project URL**
3. Copy your **anon public key**

These will be used to initialize the Supabase client.

---

## Initialization

### Create Supabase Client

Create a file: `lib/supabase.ts` (or similar)

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types' // Optional: TypeScript types

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

### Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### React/Next.js Setup

For React or Next.js, create a custom hook:

**File: `hooks/useAuth.ts`**

```typescript
import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, session, loading }
}
```

---

## Authentication Methods

### Email/Password Sign Up

```typescript
import { supabase } from '@/lib/supabase'

const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  })

  if (error) throw error
  return data
}

// Usage
try {
  await signUp('user@example.com', 'secure-password')
  // Check email for confirmation link (if enabled)
} catch (error) {
  console.error('Sign up error:', error)
}
```

### Email/Password Sign In

```typescript
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw error
  return data
}

// Usage
try {
  const { user, session } = await signIn('user@example.com', 'password')
  console.log('Signed in:', user.email)
} catch (error) {
  console.error('Sign in error:', error)
}
```

### Sign Out

```typescript
const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Usage
await signOut()
```

### Magic Link (Passwordless)

```typescript
const signInWithMagicLink = async (email: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  })

  if (error) throw error
  return data
}

// Usage
await signInWithMagicLink('user@example.com')
// User will receive an email with a magic link
```

### Social Auth (Google, GitHub, etc.)

```typescript
const signInWithProvider = async (provider: 'google' | 'github' | 'apple') => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })

  if (error) throw error
  return data
}

// Usage
await signInWithProvider('google')
```

---

## Session Management

### Get Current Session

```typescript
const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) throw error
  return session
}

// Usage
const session = await getSession()
if (session) {
  console.log('User ID:', session.user.id)
  console.log('JWT Token:', session.access_token)
}
```

### Get Current User

```typescript
const getUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) throw error
  return user
}

// Usage
const user = await getUser()
console.log('Email:', user?.email)
```

### Listen to Auth State Changes

```typescript
// In a React component or similar
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      console.log('Auth event:', event)
      console.log('Session:', session)
      
      if (event === 'SIGNED_OUT') {
        // Clear user data, redirect, etc.
      }
      
      if (event === 'SIGNED_IN') {
        // Redirect to dashboard, fetch data, etc.
      }
    }
  )

  return () => subscription.unsubscribe()
}, [])
```

---

## Making Authenticated Requests

### Call Supabase Edge Functions

When calling Supabase Edge Functions (like the backfill or aggregate functions), you need to pass the user's session:

**File: `api/wagerdash.ts`**

```typescript
import { supabase } from '@/lib/supabase'

interface AggregateParams {
  casinoId: string
  granularity: 'hourly' | 'daily'
  startDate: string
  endDate: string
  mode?: 'summary' | 'visualize' | 'full' | 'users'
  limit?: number
  offset?: number
}

export const aggregateCasinoStats = async (params: AggregateParams) => {
  // Get current session
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Not authenticated')
  }

  // Call the edge function with JWT
  const { data, error } = await supabase.functions.invoke('aggregate', {
    body: {
      userId: session.user.id,
      jwt: session.access_token, // JWT token for authentication
      ...params
    }
  })

  if (error) throw error
  return data
}

// Usage
const stats = await aggregateCasinoStats({
  casinoId: 'roobet',
  granularity: 'hourly',
  startDate: '2025-01-01T00:00:00Z',
  endDate: '2025-01-31T23:59:59Z',
  mode: 'summary'
})
```

### Call Backfill Function

```typescript
interface BackfillParams {
  userId: string
  identifier: string
  auth_data: any
  mode: 'backfill'
}

export const triggerBackfill = async (params: BackfillParams) => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase.functions.invoke('backfill', {
    body: {
      userId: session.user.id,
      jwt: session.access_token,
      ...params
    }
  })

  if (error) throw error
  return data
}

// Usage
await triggerBackfill({
  userId: session.user.id,
  identifier: 'roobet',
  auth_data: { user_id: 'abc', API_key: 'xyz' },
  mode: 'backfill'
})
```

### Direct Database Queries (With RLS)

```typescript
// Query casino_stats table
export const getCasinoStats = async (
  userId: string,
  casinoId: string,
  startDate: string,
  endDate: string
) => {
  const { data, error } = await supabase
    .from('casino_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('casino_id', casinoId)
    .gte('hour_timestamp', startDate)
    .lte('hour_timestamp', endDate)
    .order('hour_timestamp', { ascending: true })

  if (error) throw error
  
  // RLS automatically filters to user's records
  return data
}

// Usage
const stats = await getCasinoStats(
  user.id,
  'roobet',
  '2025-01-01T00:00:00Z',
  '2025-01-31T23:59:59Z'
)
```

---

## Best Practices

### 1. Never Store Tokens in localStorage for Production

Supabase handles token storage securely. Don't manually store tokens unless absolutely necessary and you understand the security implications.

### 2. Use Supabase's Auth Helpers

For Next.js, use `@supabase/auth-helpers-nextjs`:

```bash
npm install @supabase/auth-helpers-nextjs
```

### 3. Protect Routes

**Next.js Middleware:**

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect('/login')
  }

  return res
}

export const config = {
  matcher: '/dashboard/:path*'
}
```

### 4. Handle Loading States

```typescript
const { user, loading } = useAuth()

if (loading) {
  return <LoadingSpinner />
}

if (!user) {
  return <LoginScreen />
}

return <Dashboard />
```

### 5. TypeScript Types

Generate types from your Supabase schema:

```bash
supabase gen types typescript --project-id your-project-ref > types/database.ts
```

Then use them:

```typescript
import { Database } from '@/types/database'

type CasinoStats = Database['public']['Tables']['casino_stats']['Row']
```

### 6. Error Handling

Always wrap auth operations in try-catch:

```typescript
try {
  const { user, error } = await signIn(email, password)
  if (error) {
    showError(error.message)
    return
  }
  // Success
} catch (error) {
  showError('An unexpected error occurred')
  console.error(error)
}
```

---

## Error Handling

### Common Auth Errors

```typescript
const handleAuthError = (error: any) => {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Email or password is incorrect'
    case 'Email not confirmed':
      return 'Please check your email to confirm your account'
    case 'Too many requests':
      return 'Too many attempts. Please try again later'
    default:
      return error.message || 'An error occurred'
  }
}

// Usage
try {
  await signIn(email, password)
} catch (error) {
  const message = handleAuthError(error)
  showError(message)
}
```

### Session Refresh Errors

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully')
  }
  
  if (event === 'SIGNED_OUT') {
    // Redirect to login
    router.push('/login')
  }
})
```

---

## Code Examples

### Complete Auth Component (React)

```typescript
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthComponent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard')
      }
    })
  }, [router])

  const handleSignUp = async () => {
    setLoading(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) throw error
      
      alert('Check your email for the confirmation link')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async () => {
    setLoading(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      router.push('/dashboard')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <h1>WagerDash Login</h1>
      
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      
      <button onClick={handleSignIn} disabled={loading}>
        Sign In
      </button>
      
      <button onClick={handleSignUp} disabled={loading}>
        Sign Up
      </button>
    </div>
  )
}
```

### Complete API Client Example

```typescript
// lib/wagerdash-api.ts
import { supabase } from './supabase'
import type { Session } from '@supabase/supabase-js'

class WagerDashAPI {
  private async getSession(): Promise<Session> {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error || !session) {
      throw new Error('Not authenticated')
    }
    return session
  }

  async aggregate(params: {
    casinoId: string
    granularity: 'hourly' | 'daily'
    startDate: string
    endDate: string
    mode?: 'summary' | 'visualize' | 'full' | 'users'
    limit?: number
    offset?: number
  }) {
    const session = await this.getSession()
    
    const { data, error } = await supabase.functions.invoke('aggregate', {
      body: {
        userId: session.user.id,
        jwt: session.access_token,
        ...params
      }
    })

    if (error) throw error
    return data
  }

  async backfill(params: {
    identifier: string
    authData: any
  }) {
    const session = await this.getSession()
    
    const { data, error } = await supabase.functions.invoke('backfill', {
      body: {
        userId: session.user.id,
        jwt: session.access_token,
        identifier: params.identifier,
        auth_data: params.authData,
        mode: 'backfill'
      }
    })

    if (error) throw error
    return data
  }
}

export const wagerdashAPI = new WagerDashAPI()

// Usage in a component
import { wagerdashAPI } from '@/lib/wagerdash-api'

const fetchStats = async () => {
  try {
    const stats = await wagerdashAPI.aggregate({
      casinoId: 'roobet',
      granularity: 'daily',
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-01-31T23:59:59Z',
      mode: 'summary'
    })
    
    console.log('Total wagered:', stats.summary.totalWagered)
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  }
}
```

---

## Summary

### Quick Start Checklist

- [ ] Install `@supabase/supabase-js`
- [ ] Add environment variables
- [ ] Initialize Supabase client
- [ ] Create auth hook (optional but recommended)
- [ ] Implement sign up/in pages
- [ ] Add route protection
- [ ] Create API client for edge functions
- [ ] Test authentication flow
- [ ] Handle errors gracefully

### Key Points

1. **Always get the session** before making authenticated requests
2. **Pass the JWT token** in edge function calls
3. **RLS handles filtering** - queries automatically restrict to user's data
4. **Use auth state hooks** for reactive UI updates
5. **Handle loading and error states** gracefully

### Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row-Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

---

**End of Guide**

