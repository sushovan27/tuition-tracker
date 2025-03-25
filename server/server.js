const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Failed to connect to SQLite:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Create tables with error handling
db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)`, (err) => {
    if (err) console.error('Error creating users table:', err.message);
});

db.run(`CREATE TABLE IF NOT EXISTS tuition (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER, balance REAL, daysLeft INTEGER, FOREIGN KEY (userId) REFERENCES users(id))`, (err) => {
    if (err) console.error('Error creating tuition table:', err.message);
});

// Signup endpoint
app.post('/signup', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            console.error('Error checking username:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        if (row) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], function(err) {
            if (err) {
                console.error('Error inserting user:', err.message);
                return res.status(500).json({ error: 'Database error' });
            }
            const userId = this.lastID;
            db.run('INSERT INTO tuition (userId, balance, daysLeft) VALUES (?, ?, ?)', [userId, 4000, 4], (err) => {
                if (err) {
                    console.error('Error inserting tuition data:', err.message);
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ userId });
            });
        });
    });
});

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (err) {
            console.error('Error during login:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json({ userId: row.id });
    });
});

// Get tuition data
app.get('/tuition/:userId', (req, res) => {
    const { userId } = req.params;
    db.get('SELECT * FROM tuition WHERE userId = ?', [userId], (err, row) => {
        if (err) {
            console.error('Error fetching tuition:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(row || { balance: 0, daysLeft: 0 });
    });
});

// Update tuition data
app.post('/tuition/:userId', (req, res) => {
    const { userId } = req.params;
    const { balance, daysLeft } = req.body;
    db.run(
        'INSERT OR REPLACE INTO tuition (id, userId, balance, daysLeft) VALUES ((SELECT id FROM tuition WHERE userId = ?), ?, ?, ?)',
        [userId, userId, balance, daysLeft],
        (err) => {
            if (err) {
                console.error('Error updating tuition:', err.message);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ balance, daysLeft });
        }
    );
});

app.listen(port, () => {
    console.log(`Server running at port ${port}`);
});