require('dotenv').config();
const express = require('express');
const mariadb = require('mariadb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection with detailed error logging
let pool;
try {
    console.log('Initializing database connection...');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_NAME:', process.env.DB_NAME);
    
    pool = mariadb.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'kanban_tracker',
        connectionLimit: 5,
        connectTimeout: 20000,
        trace: true
    });
    
    // Test database connection
    pool.getConnection()
        .then(conn => {
            console.log('Database connected successfully!');
            conn.query('SHOW TABLES')
                .then(tables => {
                    console.log('Tables in database:', tables);
                    conn.release();
                })
                .catch(err => {
                    console.error('Error querying tables:', err);
                    conn.release();
                });
        })
        .catch(err => {
            console.error('Database connection error:', err);
            console.error('Error code:', err.code);
            console.error('Error number:', err.errno);
            console.error('SQL state:', err.sqlState);
        });
} catch (error) {
    console.error('Failed to create database pool:', error);
}

// Middleware
app.use(cors({
    origin: '*', // Allow all origins for now
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Handle preflight OPTIONS requests
app.options('*', cors());

// Add security headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(new LocalStrategy({
    usernameField: 'email'
}, async (email, password, done) => {
    try {
        const conn = await pool.getConnection();
        const user = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
        conn.release();
        
        if (user.length === 0) return done(null, false);
        
        const isValid = await bcrypt.compare(password, user[0].password);
        return isValid ? done(null, user[0]) : done(null, false);
    } catch (error) {
        return done(error);
    }
}));

// Only use Google strategy if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const conn = await pool.getConnection();
            let user = await conn.query('SELECT * FROM users WHERE google_id = ?', [profile.id]);
            
            if (user.length === 0) {
                await conn.query('INSERT INTO users (email, google_id, name) VALUES (?, ?, ?)', 
                    [profile.emails[0].value, profile.id, profile.displayName]);
                user = await conn.query('SELECT * FROM users WHERE google_id = ?', [profile.id]);
            }
            
            conn.release();
            return done(null, user[0]);
        } catch (error) {
            return done(error);
        }
    }));
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const conn = await pool.getConnection();
        const user = await conn.query('SELECT * FROM users WHERE id = ?', [id]);
        conn.release();
        done(null, user[0]);
    } catch (error) {
        done(error);
    }
});

// Auth middleware
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ error: 'Access denied' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log('Token verification failed:', err.message);
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        console.log('Authenticated user:', user.id);
        next();
    });
};

// Routes
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const conn = await pool.getConnection();
        await conn.query('INSERT INTO users (email, password, name) VALUES (?, ?, ?)', 
            [email, hashedPassword, name]);
        conn.release();
        
        res.json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Registration failed' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const conn = await pool.getConnection();
        const user = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
        conn.release();
        
        if (user.length === 0 || !await bcrypt.compare(password, user[0].password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ id: user[0].id, email: user[0].email }, process.env.JWT_SECRET);
        res.json({ token, user: { id: user[0].id, email: user[0].email, name: user[0].name } });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Only add Google routes if Google auth is configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
    app.get('/auth/google/callback', passport.authenticate('google'), (req, res) => {
        const token = jwt.sign({ id: req.user.id, email: req.user.email }, process.env.JWT_SECRET);
        res.redirect(`/?token=${token}`);
    });
}

// Board routes
app.get('/api/boards', authenticateToken, async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const boards = await conn.query('SELECT * FROM boards WHERE user_id = ?', [req.user.id]);
        conn.release();
        console.log(`Found ${boards.length} boards for user ${req.user.id}`);
        res.json(boards);
    } catch (error) {
        console.error('Error fetching boards:', error);
        res.status(500).json({ error: 'Failed to fetch boards' });
    }
});

app.post('/api/boards', authenticateToken, async (req, res) => {
    try {
        const { name, type } = req.body;
        console.log('Creating board:', { name, type, userId: req.user.id });
        
        if (!name || !type) {
            return res.status(400).json({ error: 'Name and type are required' });
        }
        
        if (!['challenges', 'hackathons', 'certifications'].includes(type)) {
            return res.status(400).json({ error: 'Invalid board type' });
        }
        
        const conn = await pool.getConnection();
        const result = await conn.query('INSERT INTO boards (name, type, user_id) VALUES (?, ?, ?)', 
            [name, type, req.user.id]);
        conn.release();
        
        console.log('Board created with ID:', result.insertId);
        res.json({ id: Number(result.insertId), name, type, message: 'Board created successfully' });
    } catch (error) {
        console.error('Error creating board:', error);
        res.status(500).json({ error: 'Failed to create board: ' + error.message });
    }
});

// Task routes
app.get('/api/boards/:boardId/tasks', authenticateToken, async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const tasks = await conn.query('SELECT * FROM tasks WHERE board_id = ? ORDER BY position', 
            [req.params.boardId]);
        conn.release();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

app.post('/api/boards/:boardId/tasks', authenticateToken, async (req, res) => {
    try {
        const { title, description, status = 'todo' } = req.body;
        console.log('Creating task:', { title, description, status, boardId: req.params.boardId });
        
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        
        const conn = await pool.getConnection();
        const result = await conn.query('INSERT INTO tasks (title, description, status, board_id) VALUES (?, ?, ?, ?)', 
            [title, description, status, req.params.boardId]);
        conn.release();
        
        console.log('Task created with ID:', result.insertId);
        res.json({ id: Number(result.insertId), title, description, status });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task: ' + error.message });
    }
});

app.put('/api/tasks/:taskId', authenticateToken, async (req, res) => {
    try {
        const { status, title, description } = req.body;
        console.log('Updating task:', { taskId: req.params.taskId, status, title, description });
        
        const conn = await pool.getConnection();
        
        if (status && title && description) {
            // Full update
            await conn.query('UPDATE tasks SET status = ?, title = ?, description = ? WHERE id = ?', 
                [status, title, description, req.params.taskId]);
        } else if (status) {
            // Status only update (for drag and drop)
            await conn.query('UPDATE tasks SET status = ? WHERE id = ?', 
                [status, req.params.taskId]);
        }
        
        conn.release();
        console.log('Task updated successfully');
        res.json({ message: 'Task updated' });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task: ' + error.message });
    }
});

app.delete('/api/tasks/:taskId', authenticateToken, async (req, res) => {
    try {
        const conn = await pool.getConnection();
        await conn.query('DELETE FROM tasks WHERE id = ?', [req.params.taskId]);
        conn.release();
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
    res.status(500).json({ error: errorMsg });
});

// Fallback route
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`Access at: http://localhost:${PORT}`);
}).on('error', (err) => {
    console.error('Server failed to start:', err);
});