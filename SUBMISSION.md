# LightLog - Devpost submission texts for LaunchPad Hacks

Copy each block into the matching Devpost field.

## Project name

LightLog

## Tagline (short pitch)

Know when the light will come. LightLog tracks your electricity, learns the pattern, and tells you the best time to charge.

## Team members

Ibrahim Yahaya (solo)

## The problem

Where I live, electricity is not something you can plan around. Light can come at 7pm and go at 9pm, or stay all night, or not come at all. As a student I lose study time and miss deadlines because my phone or laptop dies at the wrong moment, and I never know when to charge. Everyone guesses. Nobody writes it down, so nobody sees the pattern.

## Intended users

Students and anyone at home who depends on grid power that comes and goes: students in hostels and shared rooms, people working from home, and small shops that need to plan charging and work around outages.

## The solution

LightLog is a simple web app. When power comes on, you tap one button. When it goes off, you tap again. That is all the input it needs. From those taps it builds:

- A live status screen: is light on right now, since when, how much light you have had today, and a timeline of today's changes. If you noticed a change late, you can add it with the real time.
- A patterns screen: a 24-hour chart showing how likely light is at each hour of the day based on your own logs, your most reliable hours, and how many hours of light you got each day this week.
- A charge planner: pick your phone, laptop or power bank, set the battery level, and LightLog tells you how long a full charge takes and the best upcoming window to start charging, using your own pattern.

Everything is stored on the device with localStorage, so it works offline, needs no account, and keeps your data private. There is also a sample week button so judges and new users can see every screen working immediately.

## Technologies

- React and Vite for the app
- Tailwind CSS with a small shadcn-style design system built for this project: warm night-lamp dark theme, deep charcoal-navy with amber and gold glow accents, rounded cards, big friendly numbers, Baloo 2 headings with Nunito body text
- localStorage for saving logs on the device
- The core maths (on/off periods, hourly coverage, charge estimates, best charging window) is written as pure functions in one file and covered by 13 unit tests

## Challenges

The tricky part was turning simple on/off taps into honest numbers. The state before your first log is unknown, so the app only counts time it has actually observed, and days with no logs are shown as no data instead of zero. I also had to handle double taps, changes logged late with a past time, and charges that span midnight when picking the best charging window. Writing the logic as small testable functions first, then building the screens on top, kept all of that manageable.

## What I learned

I learned how much a tiny, well-kept dataset can do. A week of two-tap logs is enough to predict charging windows with real confidence. I also practised keeping scope small: three screens that each do one job well, instead of ten half-finished features. And I learned to design for the phone first, since that is where people will actually tap when the light changes.

## Demo

- Live demo: [add the deployed link here]
- Screenshots: in the docs folder of the repo (welcome, Today, Patterns, Charge planner, mobile view)
- Demo video: [add the YouTube link here]
- Source code: [add the GitHub repo link here]

## Setup steps

```bash
npm install
npm run dev
```

Open the local address Vite prints. Click "Try it with a sample week" to see the app full of data, or "Start fresh" to log your own light changes.

## Credits

- React, Vite and Tailwind CSS (open source)
- Baloo 2 and Nunito fonts from Google Fonts (OFL licence), self-hosted in the repo
- All work on this project was done during the LaunchPad Hacks hacking period (from 16 Oct 2026).
