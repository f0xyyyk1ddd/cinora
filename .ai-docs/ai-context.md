# AI Context & Instructions for Cinora

Welcome, fellow AI Agent! 🤖 
If you are reading this, you have been instantiated on a new machine to continue the development of the **Cinora** project. This document provides the critical context and rules you need to seamlessly resume work.

## 🎯 Current Mission
We are currently operating at **Phase 2** of the development roadmap (see `roadmap.md`). 
The immediate next tasks involve building social features (Comments system, Star Rating system).

## 🏗 Project Architecture & Stack
- **Framework**: Next.js 14 App Router
- **Language**: TypeScript
- **Database**: Prisma ORM with SQLite (locally). 
  - *Crucial note*: The local SQLite database is NOT tracked in Git (it's ignored). The user must supply a valid `dev.db` file from the remote server or you must guide them to generate a new one using `npx prisma db push`.
- **Auth**: NextAuth.js (Credentials Provider).
- **Styling**: Tailwind CSS (Dark theme by default, highly glassmorphic/premium UI).

## 📂 Key Directories
- `/src/app/(auth)` - Login and Register pages.
- `/src/app/api` - Backend API routes (NextAuth, Cron jobs, Admin endpoints, Ratings).
- `/src/components` - React components. Note that client components must use `"use client"` at the top.
- `/prisma/schema.prisma` - The single source of truth for the database schema.

## 💾 Database State
We have the following core models:
- `User`: Standard user data and roles (`ADMIN` vs `USER`).
- `Movie` / `Series`: Content metadata fetched from TMDB/Kinopoisk.
- `VideoSource`: External CDN links for playback. We filter out content without video sources in queries `where: { videoSources: { some: {} } }`.
- `Rating`: Used for user likes (and soon, 5-star ratings).
- `WatchHistory`: Used for the personalized hero carousel recommendations on the homepage.
- `Favorite`: For the user's watchlist.

## 📜 Development Guidelines & Rules
1. **Always use specific tools**: Prefer dedicated file reading/writing tools over generic bash commands.
2. **Aesthetics are CRITICAL**: When creating new UI components, always use modern, premium designs. Use glassmorphism (`bg-[#1a1a2e]/80 backdrop-blur-md`), smooth transitions, and polished typography. No plain or boring interfaces.
3. **No destructive database operations**: Do not run `prisma migrate dev` unless explicitly agreed upon, as the local `dev.db` might be a direct copy of the production database. Use `prisma db push` if schema changes are made, but be careful not to drop data.
4. **Client vs Server Components**: By default, pages in `/src/app` are Server Components. If you need interactivity (like a comment submission form or a like button), extract it into a separate client component in `/src/components` and import it.
5. **Environment Variables**: `.env` is ignored. If you encounter authentication or connection issues, verify the user has a valid local `.env` file with `NEXTAUTH_URL=http://localhost:3000` and `DATABASE_URL="file:./dev.db"`.

## 🚀 How to proceed
When the user asks you to start, please:
1. Briefly acknowledge that you have read `ai-context.md` and `roadmap.md`.
2. Propose the immediate next step based on the Phase 2 roadmap.
3. Execute the task with precision.
