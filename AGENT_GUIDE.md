# AI Agent Coordination Guide: COMPCHEM Platform

Welcome, fellow AI. This document explains the architecture, design philosophy, and data management of the COMPCHEM laboratory platform.

## 🚀 Tech Stack
- **Frontend**: React (Vite)
- **Database**: Firebase Firestore (Real-time)
- **Icons**: Lucide-React
- **Molecular Rendering**: Smiles-Drawer
- **Styling**: Vanilla CSS (`index.css`)
- **Authentication**: Custom AuthContext with session-based persistence and bcrypt hashing.

## 📂 Project Structure
- `/src/db.js`: **Critical File.** Contains the Firebase configuration and the `db` DAO (Data Access Object). Use this to interact with collections.
- `/src/context/AuthContext.jsx`: Handles login, roles (master, admin, researcher), and session restoration.
- `/src/components/SmilesViewer.jsx`: A helper component to render chemical structures from SMILES strings.
- `/src/utils/csvUtils.js`: Logic for parsing and generating CSV files for bulk data operations.
- `/src/pages/`: Contains all view logic (Dashboard, Chat, Devices, etc.).

## 💾 Data Layer (db.js)
The database uses a standardized `db` object to prevent direct Firestore calls in components. 
- **Real-time Data**: Use the `useLiveCollection(collectionName)` hook.
- **Mutations**: Use `db.collectionName.add()`, `.update()`, or `.delete()`.
- **Collections**: `scientists`, `chemicals`, `usage_logs`, `devices`, `tasks`, `messages`.

## 🎨 Design Philosophy
The user has requested a specific mix:
1.  **Professional Core**: All functional pages (Chemicals, Devices, Tracking, Profile) must look premium, clean, and corporate. Avoid emojis in buttons or headers. Use monotone Lucide icons.
2.  **Funny Leaderboard**: The **Leaderboard section on the Dashboard** is the only place allowed to be playful. It uses gamified ranks (e.g., "Beaker Breaker", "Lab Rat") and emojis.
3.  **Molecular Graphics**: Always include chemical structure previews where possible using the SMILES data.

## 📱 Responsiveness
The app uses a custom `Layout.jsx` with:
- **Desktop**: Standard top navigation header.
- **Mobile**: A native-feeling bottom tab bar (Home, Register, Chat, Team, Profile).
- **Cards**: Avoid tables. Use the `.mobile-card-list` and `.mobile-list-item` CSS classes for data displays.

## 🛠 Maintenance
- Always run `npm run build` after major changes to verify the Vite bundle.
- Ensure any new interactive elements have unique IDs for testing.
- When adding new chemicals or devices, maintain the CSV import/export capability.

## 🔑 Login for Debugging
- **Master Admin**: `master` / `master123`
- **System Admin**: `admin` / `admin123`
