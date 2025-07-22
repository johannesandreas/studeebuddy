# Kanban Progress Tracker

A Node.js Kanban-style progress tracker for AWS challenges, hackathons, and certification journeys with MariaDB backend.

## Features

- **Customizable Boards**: Challenges (9-week AWS badge program), Hackathons, Certifications
- **User Authentication**: Database auth + Google OAuth
- **Drag & Drop**: Move tasks between columns (To Do, In Progress, Done)
- **Secure**: JWT tokens, bcrypt password hashing

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Database Setup**:
   - Install MariaDB
   - Create database: `mysql -u root -p < database.sql`
   - Update `.env` with your database credentials

3. **Environment Variables**:
   - Copy `.env` and update values:
     - Database credentials
     - JWT secret
     - Google OAuth credentials (optional)

4. **Run Application**:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

5. **Access**: Open `http://localhost:3000`

## API Endpoints

- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /auth/google` - Google OAuth
- `GET /api/boards` - Get user boards
- `POST /api/boards` - Create board
- `GET /api/boards/:id/tasks` - Get board tasks
- `POST /api/boards/:id/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## Board Types

- **challenges**: 9-week AWS badge programs
- **hackathons**: Themed events and competitions
- **certifications**: Cloud Practitioner, Solutions Architect, etc.

## Usage

1. Register/Login or use Google OAuth
2. Create or select a board
3. Add tasks to columns
4. Drag tasks between To Do → In Progress → Done
5. Edit/delete tasks as needed