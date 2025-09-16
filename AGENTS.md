# Agent Guidelines for skapex-dash

## Build & Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint (no dedicated test command found)

## Code Style Guidelines

### Framework & Language

- Next.js 15 with React 19, ES6+ JavaScript with JSX
- Use "use client" directive for client components
- Functional components with arrow functions and React hooks

### Imports & Naming

- Named exports over default exports
- Path aliases: `@/*` maps to `./src/*`
- Group imports: React → third-party → local imports
- camelCase for variables/functions, PascalCase for components

### Styling & Formatting

- Tailwind CSS for all styling with custom classes in `src/app/app.css`
- Prettier with Tailwind plugin for formatting
- OKLCH color space for design tokens

### Error Handling

- Try/catch with specific exception types
- AppwriteException for API errors
- Graceful error states in UI components

### File Structure

- `src/app/` - Next.js app router pages and API routes
- `src/components/` - Reusable React components
- `src/lib/` - Utilities and Appwrite client configuration
