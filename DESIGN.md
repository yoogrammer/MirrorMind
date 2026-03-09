# MirrorMind Design System

## 1. Concept & Vibe
MirrorMind is a futuristic AI emotional intelligence companion. It acts as an ambient extension of the user's operating system, continuously detecting mood and providing supportive suggestions without being intrusive.

**Keywords**: Futuristic, ambient, supportive, intelligent, glassmorphism, glowing accents, premium.

## 2. Color Palette
- **Backgrounds**: Deep obsidian (`#0b0d17`) to dark charcoal (`#151a24`).
- **Primary Accents**: Neon cyan (`#00f0ff`) for focus/productivity, soft purple (`#bd00ff`) for relaxation, and gentle amber (`#ffb800`) for warnings/reminders.
- **Surfaces**: Semi-transparent dark surfaces with strong background blur (glassmorphism: `rgba(255,255,255,0.05)`, backdrop-filter: blur).

## 3. Typography
- **Primary Font**: `Inter` or `Outfit` — clean, modern, sans-serif.
- **Headings**: Thin, tracking-wide, slightly glowing text.
- **Body**: Highly legible, soft silver (`#a1aab8`).

## 4. UI Elements
- **Containers**: Rounded corners (16px+), subtle inner borders (`1px solid rgba(255,255,255,0.1)`), heavy backdrop blur.
- **Buttons**: Pill-shaped, glowing borders on hover, fluid micro-animations.
- **Charts/Graphs**: Smooth bezier curves, glowing data points, minimal gridlines.

## 5. Animations
- Fluid, breathing-like resting states.
- Smooth transitions for expanding panels.
- Particle or wave effects representing "AI thought processes" or emotion fusing.

---
## 6. Design System Notes for Stitch Generation (REQUIRED IN PROMPT)
**Vibe**: Futuristic AI OS Companion (MirrorMind). Extremely premium, dark mode only.
**Styling**: Use Tailwind CSS. Backgrounds must be very dark slate/obsidian (`bg-slate-950`). Use intense glassmorphism (`backdrop-blur-xl bg-white/5 border border-white/10`) for all cards and panels.
**Typography**: San-serif (Inter/Outfit). White or light gray text.
**Accents**: Use subtle neon gradients (cyan/purple/amber) for active states, borders, and charts. Elements should feel alive but ambient and supportive.
**Spacing**: Generous padding, clean un-cluttered layouts. Feel like a high-end dashboard, not a dense app.
