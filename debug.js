require('dotenv').config();
const express = require('express');
const mariadb = require('mariadb');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5
});

// Test login and get token
app.post('/test/login', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const users = await conn.query('SELECT * FROM users LIMIT 1');
        conn.release();
        
        if (users.length > 0) {
            const token = jwt.sign({ id: users[0].id, email: users[0].email }, process.env.JWT_SECRET);
            res.json({ token, user: users[0] });
        } else {
            res.json({ error: 'No users found' });
        }
    } catch (error) {
        res.json({ error: error.message });
    }
});

// Test board creation
app.post('/test/board', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const conn = await pool.getConnection();
        const result = await conn.query('INSERT INTO boards (name, type, user_id) VALUES (?, ?, ?)', 
            ['Debug Board', 'challenges', decoded.id]);
        
        const boards = await conn.query('SELECT * FROM boards WHERE user_id = ?', [decoded.id]);
        conn.release();
        
        res.json({ created: result.insertId, boards });
    } catch (error) {
        res.json({ error: error.message });
    }
});

app.listen(3001, () => console.log('Debug server on port 3001'));