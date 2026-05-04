# Supreme Talkies - Cinematic Portal

A high-fidelity, immersive cinematic web experience for **Supreme Talkies**, a short film production house. 

## 🎬 Experience
The portal features a scroll-driven "Film Reel" metaphor, utilizing:
- **Cinematic Motion**: GSAP and Framer Motion for film-grade transitions.
- **Atmospheric UI**: Fixed grain overlays, custom crosshair cursors, and burnt-orange aesthetics.
- **Production Dashboards**: Role-specific workspaces for Writers, Technicians, and Producers.

## 🛠 Tech Stack
- **Frontend**: Vite + React + TypeScript
- **Animation**: GSAP (ScrollTrigger), Framer Motion, Lenis (Smooth Scroll)
- **Backend**: Supabase (Auth & Database)
- **Styling**: Vanilla CSS with modern cinematic typography (Playfair Display & Montserrat)

## 🚀 Getting Started
1. **Clone the repository.**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Environment Setup**:
   - Copy `.env.example` to `.env`.
   - Open `.env` and fill in your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. **Run development server**:
   ```bash
   npm run dev
   ```

## 📂 Project Structure
- `/src/pages`: Cinematic page implementations.
- `/src/components`: Reusable film-set UI components.
- `/src/context`: Auth and global state management.
- `/src/data`: Static film metadata.
- `/public`: High-resolution film stills and production assets.

---
*Stories that demand to be told.*
