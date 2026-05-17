# Cybiture Mobile App

This is the first true mobile app MVP for Cybiture. It is built with Expo and React Native so it can become both an iOS and Android app.

## What is included now

- Client dashboard with lead, reply, review, and automation stats
- Lead inbox with tappable lead details
- Automation activity view
- Client setup checklist
- Support screen with Cybiture contact actions
- Supabase-ready login and client database connection
- Demo mode until Supabase environment keys are added

## Run locally

```bash
cd mobile-app
npm install
npm start
```

Then scan the Expo QR code with the Expo app or run it in an iOS/Android simulator.

For the easiest phone test, use Expo Go mode:

```bash
npm run start:go
```

If Safari says it cannot open the page, open the Expo Go app first and scan the QR code from inside Expo Go. If the phone and Mac are not on the same Wi-Fi, use:

```bash
npm run start:tunnel
```

## Connect Supabase

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Run `supabase/schema.sql`.
4. Copy `.env.example` to `.env`.
5. Add your project URL and publishable/anon key.
6. Restart Expo with `npm start`.

The app will automatically switch from demo mode to the real login screen when these environment variables exist:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

## Database tables

- `client_profiles`
- `leads`
- `automations`
- `setup_tasks`
- `activity_events`
- `support_requests`

Row-level security is included so each client only sees their own data.

## First live test

After running the SQL schema, create a user in Supabase Auth or use the app's create account screen. Then add sample rows in Supabase for that user's `client_profiles.id`.

Optional: use `supabase/sample-data.sql` after replacing `CLIENT_PROFILE_ID`.
