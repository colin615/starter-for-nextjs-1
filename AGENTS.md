# Agent Guidelines for skapex-dash

## Build Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Authentication Setup

### Required Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-region.cloud.appwrite.io/v1
NEXT_APPWRITE_KEY=your-api-key-with-sessions.write-scope
```

### API Key Setup

1. Go to Appwrite Console → Project Settings → API Keys
2. Create new API key with `sessions.write` scope
3. Copy the key to `NEXT_APPWRITE_KEY` in `.env.local`

### Authentication Flow

- **Login**: `/login` - Email/password authentication
- **Signup**: `/signup` - User registration
- **Account**: `/account` - Protected user dashboard
- **Logout**: Session cleanup and redirect to login

## Code Style Guidelines

### Framework & Language

- Next.js 15 with React 19
- ES6+ JavaScript with JSX
- Use "use client" directive for client components

### Authentication Patterns

- Server Components for data fetching
- API Routes for server-side authentication
- HTTP-only cookies for session management
- Server-side session validation

### Imports & Exports

- Use named exports over default exports
- Path aliases: `@/*` maps to `./src/*`
- Group imports: React, third-party libraries, then local imports

### Components

- Functional components with arrow functions
- Use React hooks: useState, useEffect, useRef, useCallback
- Next.js Image component for optimized images

### Styling

- Tailwind CSS for all styling
- Prettier with Tailwind plugin for formatting
- Custom CSS classes in `src/app/app.css`

### Error Handling

- Try/catch blocks with specific exception types
- AppwriteException for Appwrite API errors
- Graceful error states in UI

### Configuration

- Environment variables for Appwrite config
- Minimal Next.js config (next.config.mjs)
- Clean separation: lib/ for utilities, app/ for pages
