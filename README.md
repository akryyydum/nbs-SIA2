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
In each folder (`dash` and `server`), run:
```bash
npm install
```


### 3. Environment Variables (if needed)
If `.env.example` exists, copy it to `.env` and update values as needed.

- For local development, you can set your database URL to `mongodb://localhost:27017/<your-db-name>`.
- If you want to use MongoDB Atlas or connect from another network, replace the database URL with your Atlas connection string.
- Make sure to update any other environment variables (e.g., API keys, ports) as required for your setup.



## Starting the System

**Backend:**
```bash
cd server
npm start
```

**Frontend:**
```bash
cd dash
npm run dev
```

- Backend: [http://localhost:3000](http://localhost:3000)
- Frontend: [http://localhost:5173](http://localhost:5173)


**Tip:** Use two terminals to run both at once.



