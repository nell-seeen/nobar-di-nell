# NOBAR - Realtime Watch Party

NOBAR is a realtime watch party application that allows a host and multiple viewers to watch synchronized video and audio via direct media URLs. The app is built with React, Vite, Tailwind CSS, and powered by Firebase Firestore and Realtime Database as the authoritative source of truth.

## Features

- **Realtime Sync**: Play, Pause, Seek, and Next commands are instantly synchronized across all clients via Firestore.
- **HLS.js Integration**: Supports `.m3u8` direct streaming along with standard video/audio formats.
- **Sync Engine**: Features intelligent drift correction allowing smooth playback without continuous jarring stutters.
- **Presence**: See who is actively online via Firebase Realtime Database.
- **Realtime Chat**: Host and viewers can chat in real-time.
- **Playlist Management**: Host can queue direct media URLs.

## Project Structure

```
src/
├── components/
│   ├── chat/        # Realtime chat panel
│   ├── player/      # Video player, controls, sync indicator, progress bar
│   ├── playlist/    # Playlist panel for direct media URLs
│   └── users/       # Active watchers panel
├── firebase/        # Firebase initialization and config
├── hooks/           # React hooks binding Firebase realtime streams
├── pages/           # Page routes (Home, WatchRoom)
├── services/        # Firebase data mutators (Room, Playback, Chat, Presence, Playlist)
├── store/           # Global local state (Zustand)
├── sync/            # Core SyncEngine handling playback drift and latency
└── utils/           # Formatting and helpers
```

## Setup & Deployment Guide

### 1. Firebase Setup
1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore**, **Realtime Database**, and **Authentication** (Anonymous Auth is required).
3. Copy the Firebase configuration and replace `firebase-applet-config.json` contents or `.env` values.

### 2. Deploy Security Rules
Use the Firebase CLI to deploy the provided rules to protect your rooms:
```bash
firebase deploy --only firestore:rules,database:rules
```
*Note: Make sure your `firestore.rules` and `database.rules.json` match the files in this repository.*

### 3. Local Development
Install dependencies and run Vite:
```bash
npm install
npm run dev
```

### 4. Production Build & Deployment
Build the React application for production:
```bash
npm run build
```
Deploy the resulting `dist/` folder to Firebase Hosting:
```bash
firebase init hosting
firebase deploy --only hosting
```
