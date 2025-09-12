# Supabase Edge Functions

This directory contains Supabase Edge Functions for the Learnova platform backend.

## TypeScript Errors in IDE

**Important**: The TypeScript errors you see in VS Code are expected and cosmetic. These functions run in Deno (not Node.js), and VS Code doesn't recognize Deno's runtime environment by default.

### Why These Errors Occur:
- Edge Functions use Deno runtime with URL-based imports
- VS Code TypeScript service expects Node.js module resolution
- Deno has different global objects and APIs

### These Functions Will Work Correctly When:
- Deployed to Supabase (production environment)
- Run locally with `supabase functions serve`
- Tested with `supabase functions invoke`

## Available Functions

- **courses** - Course CRUD operations
- **chapters** - Chapter management
- **lessons** - Lesson management  
- **enrollments** - Student enrollment system
- **progress** - Progress tracking with auto-calculation
- **upload** - Cloudinary integration with load balancing

## Deployment

```bash
# Deploy all functions
supabase functions deploy courses
supabase functions deploy chapters
supabase functions deploy lessons
supabase functions deploy enrollments
supabase functions deploy progress
supabase functions deploy upload
```

## Local Development

```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve

# Test a function
supabase functions invoke courses --method GET
```

The TypeScript errors in your IDE do not affect functionality or deployment.
