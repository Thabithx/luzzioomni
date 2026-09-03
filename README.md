# Luzzio E-Commerce Platform

## 🚀 Setup & Development Workflow Guide

### 1. Clone & Setup Repository
**Reason:** Download the project repository from GitHub and install all required packages for root, server, and client environments.

```bash
git clone https://github.com/Thabithx/luzzioomni.git
cd luzzioomni

# Root dependencies
npm install

# Server dependencies
cd server && npm install

# Client dependencies
cd ../client && npm install

# Return to root
cd ..
```

---

### 2. Environment Configuration
Create a `.env` file inside the `server/` directory and add:

```env
PORT=5001
MONGO_URI=mongodb+srv://thabith2222_db_user:thabith343@cluster0.6jlgund.mongodb.net/luzzio?retryWrites=true&w=majority
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
```

---

### 3. Start Project
Run full stack (backend + frontend) from the root directory:
```bash
npm run dev
```

---

### 4. Git Workflow for Team Members
**Reason:** Ensure team members sync latest remote updates before making changes, stage their assigned work, record changes with a clear commit message, and push updates to the shared repository.

```bash
# Pull latest updates from main before making/pushing changes
git pull origin main

# Stage all modified and new files
git add .

# Commit changes with a descriptive message
git commit -m "Added login functionality"

# Push your changes to the GitHub repository
git push origin main
```
