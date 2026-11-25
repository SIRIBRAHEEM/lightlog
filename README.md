# LightLog

Know when the light will come.

LightLog is a small web app for students who plan their day around
unpredictable electricity. You tap one button when power comes on and
one button when it goes off. After a few days, LightLog shows you the
pattern for your area and tells you the best time to charge your phone,
laptop and power bank.

Built for LaunchPad Hacks 2026 by Ibrahim Yahaya (solo).

## What it does

- **Today screen:** live status (light on or off, and for how long),
  one-tap logging, today's total light hours, longest stretch, and a
  timeline of every change. You can also add a change you noticed late,
  with the real time it happened.
- **Patterns screen:** a 24-hour chart showing how likely light is at
  each hour of the day based on your own logs, your most reliable
  hours, and a 7-day chart of light hours per day with your daily
  average.
- **Charge planner:** pick a device (phone, laptop, power bank), set
  your current battery level, and get the time needed for a full charge
  plus the best upcoming window to start, based on your pattern.
- **Sample week:** a built-in demo dataset so you can see every screen
  working right away.
- Everything is stored in the browser with localStorage. No account,
  no server, no tracking.

## Run it

```bash
npm install
npm run dev
```

Then open the local address Vite prints (usually http://localhost:5173).

## Build for production

```bash
npm run build
npm run preview
```

## Tests

The core logic (period building, hourly coverage, charge estimates,
best-window search) lives in `src/lib.js` as pure functions and is
covered by tests:

```bash
npm test
```

## Tech

- React 19 and Vite
- Tailwind CSS with a small shadcn-style design system built for this
  project (`src/components/ui.jsx`): warm night-lamp dark theme, deep
  charcoal-navy with amber and gold glow accents, rounded cards and
  big friendly numbers
- Fonts: Baloo 2 for headings and Nunito for body text (Google Fonts,
  self-hosted in `public/fonts`)
- localStorage for persistence

## Credits

- React, Vite and Tailwind CSS (open source)
- Baloo 2 and Nunito fonts (Google Fonts, OFL licence)

## Screenshots

See the `docs` folder: welcome screen, Today, Patterns, Charge
planner, and the mobile view.
