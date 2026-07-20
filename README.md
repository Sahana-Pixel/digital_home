# Digital Home

Digital Home is a calm, room-based digital life system and organization dashboard designed to help users modularize and manage different aspects of their daily routine in dedicated visual spaces. Rather than combining all todos, habits, and calendars into a single overwhelming feed, Digital Home groups them into individual "rooms" such as Study, College, Health, Projects, Planner, and Reflection. This architectural layout creates a clean mental boundary between work, wellness, academics, and personal planning.

The project solves the problem of digital clutter and context-switching fatigue. By providing distinct room environments with dedicated styling, custom interactive widgets, and specific tracking systems, users can enter a visual state of focus tailored to their current task. With real-time syncing powered by Firebase, user profiles and room selections persist dynamically, providing a seamless progress-tracking ecosystem across devices.

Digital Home is intended for students, developers, remote workers, or anyone looking for a clean, distraction-free environment to organize their goals and track habits. Its built-in feature set includes an academic calendar, habit completion tracking with success analytics, Git-style contribution grids, multi-tier nested task lists, and a centralized reflection space that aggregates daily progress across the entire home.

## Live Demo
[https://digital-home-lemon.vercel.app](https://digital-home-lemon.vercel.app)

## Tech Stack

| Component | Technology |
| --- | --- |
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript, React 18 |
| **Styling** | Tailwind CSS, PostCSS |
| **Authentication** | Firebase Authentication |
| **Database** | Firebase Firestore (NoSQL Document Store) |
| **Hosting** | Vercel |
| **State Management** | React Context (`AuthContext`) & Hooks (`useState`, `useMemo`, `useCallback`) |
| **Icons & Assets** | Lucide React |

## Features

- **User Authentication & Profile Setup:**
  - Secure signup and login flow using Firebase Auth.
  - Multi-step onboarding (setup) for selecting specific rooms to build your personalized digital house.
  - Custom user profile creation saved in Firestore.
- **Study Room (🧠):**
  - Track daily study tasks with streaks.
  - Interactive Git-style contribution grid visualization of task completion throughout the year (365-day map).
- **Health Room (🧘):**
  - Daily habit tracking with positive (completed) and negative (missed) status recording.
  - Habit success analytics (7-day completion rate) and a weekly breakdown layout.
- **Projects Room (🗂):**
  - Nested project goal structure.
  - Add tasks to goals and complete them, with automatic incrementing of the project's completion counter and visual trophy awards.
- **Planner Room (📅):**
  - Daily planners with nesting: Create master goals with individual nested sub-tasks.
  - Snappy user experience powered by optimistic state updates.
- **College Room (🎓):**
  - Manage academic assignments, workshops, vivas, and certifications.
  - Interactive monthly calendar showing task due dates.
  - Dynamic type-based task filtering and relative due-date indicators (e.g. Overdue, due today, or number of days remaining).
- **Reflection Room (🪞):**
  - Daily overview dashboard aggregating tasks across the Study, College, and Health rooms.
  - Circular and bar progress charts showing today's completion rates.
  - Unified list of all remaining pending tasks.
- **Global Dashboard:**
  - Centralized navigation center featuring dynamic greetings based on the time of day, elegant cards for each selected room with custom glassmorphism styling, hover effects, and a simple logout/disconnect workflow.

## Project Structure

- **`src/app/`**: The Next.js App Router containing landing (`page.tsx`), authentication routes (`login/`, `signup/`), onboarding (`setup/`), main navigation (`dashboard/`), and dynamic room navigation (`room/[roomName]/`).
- **`src/components/`**: Reusable React UI elements. Contains global UI helpers (`ui/`) like buttons and inputs, and individual room pages (`rooms/`) which encapsulate all domain logic.
- **`src/contexts/`**: Context providers, specifically the `AuthContext` which manages user sessions, loading, and Firestore profile synchronization.
- **`src/lib/`**: Library utilities, including Firebase SDK initialization configuration (`firebase.ts`), type systems for error handling (`auth-errors.ts`), and global room config presets (`rooms.ts`).

## Prerequisites

Before running this project, ensure you have:
- **Node.js**: Version `18.17.0` or higher (recommended for compatibility with Next.js 14).
- **npm**: Package manager (installed by default with Node.js).
- **Firebase Project**: A Firebase web project with **Authentication (Email/Password)** and **Cloud Firestore** enabled.

## Environment Variables

To run the project, create a `.env` file in the root directory and populate it with your Firebase project credentials. You can copy the template below:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Running the Project Locally

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
Copy the `.env.example` file to `.env` and fill in your Firebase configuration keys:
```bash
# On Linux/macOS/Git Bash:
cp .env.example .env

# On Windows PowerShell:
Copy-Item .env.example .env
```

### 3. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to view the application.
