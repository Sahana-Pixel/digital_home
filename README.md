# My House

A calm, room-based digital life system. **Next.js + Tailwind + Firebase.**

## Theme

- **Global:** Premium dark (deep slate/blue), soft light blue accent, rounded-xl cards, soft shadows.
- **Rooms:** Each room has its own card color and accent; the same palette continues inside that room.

## Flow

```
Landing (/) → Login (/login) or Signup (/signup)
Signup → First-Time Setup (/setup) → Dashboard (/dashboard)
Login → Setup (if not done) or Dashboard
Dashboard → Room pages (/room/[roomName])
```

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Firebase (Auth + Firestore)

## Firebase

- **Auth:** Email/password. No manual token storage; Firebase handles persistence.
- **Firestore:** User profile at `users/{uid}` with `name`, `email`, `setupCompleted`, `selectedRooms`.

Example Firestore rules so each user can only read/write their own document:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Rooms

| Room       | Theme          |
| ---------- | -------------- |
| Study      | Cream / Sand   |
| Health     | Sage green     |
| College    | Sky blue       |
| Reflection | Warm gray/Rose |
| Projects   | Purple         |
| Planner    | Amber          |
