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

### Installation

1. **Install root dependencies**:
   ```bash
   npm install
   ```

2. **Setup Database**:
   ```bash
   npx prisma migrate dev
   ```

3. **Install component dependencies** (if not handled by root):
   ```bash
   cd renderer && npm install
   cd ../electron && npm install
   ```

### Running the Application

OptiRH requires both the frontend dev server and the Electron compiler to be active.

1. **Start Development Servers** (Root):
   ```bash
   npm run dev
   ```
   *This starts the Vite dev server for the frontend and the TypeScript compiler (watch mode) for the backend.*

2. **Launch the Desktop Application** (In a new terminal at Root):
   ```bash
   npm start
   ```

---
*Built with ❤️ by the OptiRH Development Team.*