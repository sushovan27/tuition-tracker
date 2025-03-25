const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const db = new sqlite3.Database('./database.db', (err) => {
  if (err) console.error(err.message);
  console.log('Connected to SQLite database.');
});

db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)`);
db.run(`CREATE TABLE IF NOT EXISTS tuition (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER, balance REAL, daysLeft INTEGER, FOREIGN KEY (userId) REFERENCES users(id))`);

db.get('SELECT * FROM users WHERE username = ?', ['sushovan27'], (err, row) => {
  if (!row) {
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['sushovan27', 'password123']);
    db.run('INSERT INTO tuition (userId, balance, daysLeft) VALUES (?, ?, ?)', [1, 4000, 4]);
  }
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ userId: row.id });
  });
});

app.get('/tuition/:userId', (req, res) => {
  const { userId } = req.params;
  db.get('SELECT * FROM tuition WHERE userId = ?', [userId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(row || { balance: 0, daysLeft: 0 });
  });
});

app.post('/tuition/:userId', (req, res) => {
  const { userId } = req.params;
  const { balance, daysLeft } = req.body;
  db.run(
    'INSERT OR REPLACE INTO tuition (id, userId, balance, daysLeft) VALUES ((SELECT id FROM tuition WHERE userId = ?), ?, ?, ?)',
    [userId, userId, balance, daysLeft],
    (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ balance, daysLeft });
    }
  );
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});