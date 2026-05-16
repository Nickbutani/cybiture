# Cybiture Mobile App

This is the first true mobile app MVP for Cybiture. It is built with Expo and React Native so it can become both an iOS and Android app.

## What is included now

- Client dashboard with lead, reply, review, and automation stats
- Lead inbox with tappable lead details
- Automation activity view
- Client setup checklist
- Support screen with Cybiture contact actions
- Local demo data so the app can be shown before the backend is connected

## Run locally

```bash
cd mobile-app
npm install
npm start
```

Then scan the Expo QR code with the Expo app or run it in an iOS/Android simulator.

## Next production step

Connect Supabase for authentication and database storage:

- clients
- leads
- automations
- activity events
- setup checklist items
- support requests

