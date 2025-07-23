require('dotenv').config();
const mariadb = require('mariadb');

// Simple debug script to test database connection
async function testConnection() {
  console.log('Testing database connection...');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_NAME:', process.env.DB_NAME);
  
  try {
    const pool = mariadb.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 15000
    });
    
    console.log('Pool created, attempting connection...');
    const conn = await pool.getConnection();
    console.log('Connected successfully!');
    
    const tables = await conn.query('SHOW TABLES');
    console.log('Tables in database:', tables);
    
    conn.release();
    console.log('Connection released');
  } catch (error) {
    console.error('CONNECTION ERROR:', error);
  }
}

testConnection();