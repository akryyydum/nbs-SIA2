# Nature-based Solutions (NbS) System

A React + Vite application for managing and visualizing nature-based solutions data.

## Prerequisites

Before setting up the system, ensure you have the following installed:

- **Node.js** (version 16.0 or higher)
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation: `node --version` and `npm --version`
- **Git** (for version control)
  - Download from [git-scm.com](https://git-scm.com/)

## System Setup Guide

### 1. Clone or Download the Project

If using Git:
```bash
git clone <repository-url>
cd nbs-SIA2/dash
```

Or download and extract the project files to your desired location.

### 2. Install Dependencies

Navigate to the project directory and install required packages:

```bash
npm install (for both dash and server folder)
```

This will install all dependencies listed in `package.json`, including:
- React and React DOM
- Vite build tool
- ESLint for code linting
- Other project-specific dependencies

### 3. Environment Configuration (if applicable)

If the project uses environment variables:
1. Copy `.env.example` to `.env` (if exists)
2. Update the environment variables as needed
3. Ensure sensitive information is not committed to version control

## Starting the System

### Quick Start Commands

**For Backend Server:**
```bash
cd server
npm install
npm start
```

**For Frontend Dashboard:**
```bash
cd dash
npm install
npm run dev
```

The backend will typically run on `http://localhost:3000` and the frontend on `http://localhost:5173`.

### Development Mode (Frontend)

To start the frontend development server with hot module replacement (HMR):

```bash
npm run dev
```

- The application will be available at `http://localhost:5173` (default Vite port)
- The server supports hot reloading - changes will be reflected automatically
- Press `Ctrl + C` to stop the development server

### Starting Both Frontend and Backend

**Option 1: Using separate terminals (Recommended)**
1. Open first terminal:
   ```bash
   cd server
   npm install
   npm start
   ```

2. Open second terminal:
   ```bash
   cd dash
   npm install
   npm run dev
   ```

**Option 2: Using one terminal with background processes**
```bash
# Start backend in background
cd server 
npm start 

# Start frontend
cd dash 
npm run dev



