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

OptiRH requires both the frontend dev server and the Electron compiler to be active. Automation scripts are provided for ease of use.

**Choose the script for your terminal:**

| Terminal | Setup Script | Run Script |
| :--- | :--- | :--- |
| **Windows CMD** | `setup.bat` | `run.bat` |
| **Git Bash / Linux / macOS** | `./setup.sh` | `./run.sh` |

*Note: The setup script automatically generates a `.env` file to configure your local SQLite database.*

---
*Built with ❤️ by the OptiRH Development Team.*