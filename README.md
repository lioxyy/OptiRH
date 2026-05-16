# OptiRH — Modern Desktop HRIS

OptiRH is a premium, offline-capable Human Resource Information System (HRIS) designed for high-performance desktop environments. It features a sleek, standardized interface and a robust monorepo architecture built for safety, speed, and offline consistency.

## 🚀 Optimized Technology Stack

OptiRH leverages a cutting-edge, native-feeling stack:

- **Desktop Shell**: [Electron](https://www.electronjs.org/) for a secure, native application experience.
- **Frontend**: [React](https://react.dev/) + [Vite](https://vitejs.dev/) + [Tailwind CSS v4](https://tailwindcss.com/) + [Shadcn UI v4](https://ui.shadcn.com/).
- **Backend API**: [Express](https://expressjs.com/) with [Prisma ORM](https://www.prisma.io/).
- **Persistence**: [SQLite](https://www.sqlite.org/) for atomic, local-first database transactions.
- **Language**: [TypeScript](https://www.typescriptlang.org/) enforced across all layers (Shared/Renderer/Electron).

## 📂 Project Structure

The project uses a monorepo pattern to maintain type safety across the stack:

```text
├── electron/     # Main process logic, preload scripts, and IPC bridges
├── renderer/     # Frontend SPA (React/Vite/Shadcn)
├── shared/       # Shared type definitions and utility logic
├── prisma/       # Database schema and migration history
└── package.json  # Global monorepo dependencies
```

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)

### Quick Start

OptiRH is designed for zero-config onboarding. Use the automation scripts to handle installation, database migrations, and concurrent execution.

| Objective | Windows (CMD) | Linux / macOS / Git Bash |
| :--- | :--- | :--- |
| **1. Installation** | `setup.bat` | `./setup.sh` |
| **2. Run App** | `run.bat` | `./run.sh` |

> [!TIP]
> The **Setup Script** automatically installs all monorepo dependencies, generates your `.env` configuration, and initializes the local SQLite database with seed data (Admin: `admin@optirh.com` / `admin123`).
> To specifically reset or re-seed the test data for leaves, you can run: `npx prisma db seed`. This executes the dedicated [leaves-test-data.ts](file:///C:/Users/Lenoovo/Desktop/projetORAd/prisma/leaves-test-data.ts) script.

---
*Built with ❤️ by the OptiRH Development Team.*