# Luzzio E-Commerce Platform

 Install Dependencies
```bash
# Root dependencies
npm install

# Server dependencies
cd server && npm install

# Client dependencies
cd ../client && npm install

# Return to root
cd ..
```

### 3. Create Environment File
Create a file named `.env` inside the `server/` folder and paste:

```env
PORT=5001
MONGO_URI=mongodb+srv://thabith2222_db_user:thabith343@cluster0.6jlgund.mongodb.net/luzzio?retryWrites=true&w=majority
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
```

### 4. Start Project
From the root directory, run:
```bash
npm run dev
```
