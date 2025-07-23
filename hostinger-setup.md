# Hostinger Setup Guide

## Database Setup

1. **Create MySQL/MariaDB Database**:
   - Go to Hostinger control panel > MySQL Databases
   - Create a new database (e.g., `kanban_tracker`)
   - Create a database user and assign to the database
   - Note the database credentials

2. **Import Database Schema**:
   - Use phpMyAdmin to import `database.sql`
   - Or run the SQL commands manually

## Environment Variables

Create a `.env` file in your project root with:

```
DB_HOST=your_hostinger_mysql_host
DB_USER=your_database_username
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret
PORT=3000
NODE_ENV=production
```

## Node.js Setup

1. **Check Node.js Support**:
   - Ensure your Hostinger plan supports Node.js
   - Set Node.js version to 14+ in Hostinger control panel

2. **Deploy Code**:
   - Push code to GitHub
   - Connect GitHub repository to Hostinger
   - Set main branch for deployment

3. **Start Application**:
   - SSH into your Hostinger account
   - Navigate to project directory
   - Run: `npm install`
   - Run: `npm start` or use PM2: `pm2 start server.js`

## Troubleshooting

If you see 500 Internal Server Error:

1. **Check Logs**:
   - SSH into your Hostinger account
   - Check `error.log` file
   - Check Hostinger error logs

2. **Database Connection**:
   - Verify database credentials in `.env`
   - Test connection manually

3. **Port Configuration**:
   - Ensure PORT in `.env` matches Hostinger's allowed port
   - Some hosts require specific ports (e.g., 8080)

4. **File Permissions**:
   - Set proper permissions: `chmod -R 755 .`