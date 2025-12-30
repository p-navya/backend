# StudyBuddy Backend API

Backend server for StudyBuddy application built with Node.js, Express, and Supabase.

## Features

- User authentication (Register/Login)
- JWT-based authentication
- User management
- RESTful API
- Supabase database integration
- CORS enabled for frontend integration

## Prerequisites

1. Node.js (v16 or higher)
2. Supabase account and project

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_PROJECT_ID=xyliqfimopegckxayzgi
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

3. Set up Supabase database:
   - Go to your Supabase project SQL Editor
   - Run the SQL script from `sql/schema.sql` to create the users table

## Running the Server

Development mode (with nodemon):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:5000` by default.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
  - Body: `{ name, email, password }`
  
- `POST /api/auth/login` - Login user
  - Body: `{ email, password }`
  
- `GET /api/auth/me` - Get current user (Protected)
  - Headers: `Authorization: Bearer <token>`

### Users

- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Health Check

- `GET /api/health` - Check API status

## Response Format

All responses follow this format:

```json
{
  "success": true/false,
  "message": "Response message",
  "data": {
    // Response data
  }
}
```

## Error Handling

Errors return a status code and error message:

```json
{
  "success": false,
  "message": "Error message"
}
```

## Database Setup

1. In Supabase Dashboard, go to SQL Editor
2. Copy and paste the SQL from `sql/schema.sql`
3. Run the script to create the users table and set up RLS policies
