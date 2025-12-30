# StudyBuddy Backend Setup Guide

## Prerequisites

1. Node.js (v16 or higher)
2. Supabase account with project created

## Installation Steps

1. **Install Dependencies** (Already done):
   ```bash
   npm install
   ```

2. **Environment Variables**:
   The Supabase credentials are already configured in `config/supabase.js` with fallback values.
   However, for production, create a `.env` file in the Backend directory:
   ```
   PORT=5000
   NODE_ENV=development
   SUPABASE_PROJECT_ID=xyliqfimopegckxayzgi
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SUPABASE_JWT_SECRET=your_jwt_secret
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:5173
   ```

3. **Set up Supabase Database**:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the SQL script from `sql/schema.sql`
   - Run the script to create the users table

4. **Run the Server**:
   ```bash
   npm run dev
   ```

## Project Structure

```
Backend/
├── server.js              # Main server file
├── config/                # Configuration files
│   └── supabase.js       # Supabase client configuration
├── controllers/           # Route controllers
│   ├── authController.js # Authentication logic
│   └── userController.js # User management logic
├── routes/               # API routes
│   ├── authRoutes.js     # Authentication routes
│   └── userRoutes.js     # User routes
├── middleware/           # Custom middleware
│   └── auth.js          # Authentication middleware
├── sql/                  # Database schema
│   └── schema.sql       # Users table schema
└── package.json         # Dependencies
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
  - Body: `{ name, email, password }`
- POST `/api/auth/login` - Login user
  - Body: `{ email, password }`
- GET `/api/auth/me` - Get current user (Protected)

### Users
- GET `/api/users` - Get all users (Admin only)
- GET `/api/users/:id` - Get single user
- PUT `/api/users/:id` - Update user
- DELETE `/api/users/:id` - Delete user (Admin only)

### Health Check
- GET `/api/health` - API status

## Response Format

Success Response:
```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data
  }
}
```

Error Response:
```json
{
  "success": false,
  "message": "Error message"
}
```
