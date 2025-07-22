require('dotenv').config();
const mariadb = require('mariadb');

async function checkDatabase() {
    try {
        const pool = mariadb.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            connectionLimit: 5
        });

        const conn = await pool.getConnection();
        
        console.log('=== DATABASE CHECK ===');
        
        // Check users
        const users = await conn.query('SELECT id, email, name FROM users');
        console.log('Users:', users);
        
        // Check boards
        const boards = await conn.query('SELECT * FROM boards');
        console.log('Boards:', boards);
        
        // Check tasks
        const tasks = await conn.query('SELECT * FROM tasks');
        console.log('Tasks:', tasks);
        
        conn.release();
        pool.end();
        
    } catch (error) {
        console.error('Database error:', error);
    }
}

checkDatabase();