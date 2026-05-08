# Topline Academy MVP

This repository contains the Topline Academy MVP, a branded online classroom platform for Pakistani students.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and set your PostgreSQL and email credentials.

3. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000` in your browser.

## Project Structure

- `src/app` - Next.js app pages and API routes
- `src/components` - Shared UI components
- `src/lib` - Database and helper utilities
- `prisma/schema.prisma` - Database schema

## Stack Configuration

- Database: Supabase (PostgreSQL)
- Email: Resend (free tier: 3,000 emails/month)
- Live streaming: Daily.co SDK
- Hosting: Vercel

## Environment Variables

Copy `.env.example` to `.env` and set these values:

- `DATABASE_URL` — Supabase PostgreSQL connection string
- `JWT_SECRET` — random secret for JWT signing
- `RESEND_API_KEY` — your Resend API key
- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_KEY` — Supabase service role key (server only)
- `DAILY_API_KEY` — Daily.co API key for server-side room management
- `NEXT_PUBLIC_DAILY_DOMAIN` — your Daily domain (e.g. `toplineacademy.daily.co`)
- `NEXT_PUBLIC_DAILY_ROOM` — default Daily room name

## Vercel Deployment

1. Create a new Vercel project and connect your Git repository.
2. Add the same environment variables under Vercel project settings.
3. Use `npm run build` as the build command.
4. Deploy and open the published URL.

## MVP Focus

- Student, instructor, and admin roles
- Live and recorded class management
- Manual payment proof upload
- Student enrollment and approval workflow
- Email notifications and PKT timezone handling
