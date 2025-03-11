import express from 'express';
import cors from 'cors';
import { format } from 'date-fns';
import initSqlJs from 'sql.js';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'finance.sqlite');

const app = express();
let db;

app.use(cors());
app.use(express.json());

// Initialize database
async function initDatabase() {
  const SQL = await initSqlJs();

  try {
    const data = await fs.readFile(dbPath);
    db = new SQL.Database(data);
  } catch (err) {
    db = new SQL.Database();

    // Initialize database tables
    // This should be executed when your application starts
    db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    budget DECIMAL(10,2) DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
    FOREIGN KEY(category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    amount DECIMAL(10,2) NOT NULL,
    period TEXT CHECK(period IN ('weekly', 'monthly')) NOT NULL,
    start_date TEXT NOT NULL,
    FOREIGN KEY(category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_income DECIMAL(10,2) DEFAULT 0,
    total_expenses DECIMAL(10,2) DEFAULT 0,
    current_balance DECIMAL(10,2) DEFAULT 0
  );
`);


    // Initialize default categories
    const defaultCategories = [
      'Food', 'Transportation', 'Housing', 'Entertainment',
      'Shopping', 'Healthcare', 'Utilities', 'Income'
    ];

    const stmt = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
    defaultCategories.forEach(category => {
      stmt.run([category]);
    });
    stmt.free();
  }

  // Save database periodically
  setInterval(async () => {
    const data = db.export();
    await fs.writeFile(dbPath, Buffer.from(data));
  }, 5000);
}

// Helper function to run queries and return results
function runQuery(sql, params = []) {
  const stmt = db.prepare(sql);
  const result = stmt.run(params);
  stmt.free();
  return result;
}

function getAll(sql, params = []) {
  const stmt = db.prepare(sql);
  const result = stmt.getAsObject(params);
  stmt.free();
  return result;
}



// Initialize database before starting server
initDatabase().then(() => {
  // API Routes
  app.get('/api/categories', (req, res) => {
    const categories = db.exec('SELECT * FROM categories')[0]?.values.map(row => ({
      id: row[0],
      name: row[1],
      budget: row[2]
    })) || [];
    res.json(categories);
  });

  // app.post('/api/transactions', (req, res) => {
  //   const { category_id, amount, description, type } = req.body;
  //   const date = format(new Date(), 'yyyy-MM-dd');

  //   const result = runQuery(
  //     'INSERT INTO transactions (category_id, amount, description, date, type) VALUES (?, ?, ?, ?, ?)',
  //     [category_id, amount, description, date, type]
  //   );

  //   res.json({ id: db.exec('SELECT last_insert_rowid()')[0].values[0][0] });
  // });

  app.post('/api/transactions', (req, res) => {
    const { category_id, amount, description, type } = req.body;
    const date = format(new Date(), 'yyyy-MM-dd');

    // Insert transaction
    runQuery(
      'INSERT INTO transactions (category_id, amount, description, date, type) VALUES (?, ?, ?, ?, ?)',
      [category_id, amount, description, date, type]
    );

    // Update summary table
    if (type === 'income') {
      runQuery('UPDATE summary SET total_income = total_income + ?, current_balance = current_balance + ?', [amount, amount]);
    } else if (type === 'expense') {
      runQuery('UPDATE summary SET total_expenses = total_expenses + ?, current_balance = current_balance - ?', [amount, amount]);
    }

    res.json({ message: 'Transaction added successfully' });
  });



  app.get('/api/transactions', (req, res) => {
    const transactions = db.exec(`
      SELECT t.*, c.name as category_name 
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      ORDER BY date DESC
    `)[0]?.values.map(row => ({
      id: row[0],
      category_id: row[1],
      amount: row[2],
      description: row[3],
      date: row[4],
      type: row[5],
      category_name: row[6]
    })) || [];

    res.json(transactions);
  });

  app.post('/api/budgets', (req, res) => {
    const { category_id, amount, period } = req.body;
    const start_date = format(new Date(), 'yyyy-MM-dd');

    const result = runQuery(
      'INSERT INTO budgets (category_id, amount, period, start_date) VALUES (?, ?, ?, ?)',
      [category_id, amount, period, start_date]
    );

    res.json({ id: db.exec('SELECT last_insert_rowid()')[0].values[0][0] });
  });

  app.get('/api/budgets', (req, res) => {
    const budgets = db.exec(`
      SELECT b.*, c.name as category_name 
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
    `)[0]?.values.map(row => ({
      id: row[0],
      category_id: row[1],
      amount: row[2],
      period: row[3],
      start_date: row[4],
      category_name: row[5]
    })) || [];

    res.json(budgets);
  });

  app.get('/api/summary', (req, res) => {
    const currentMonth = format(new Date(), 'yyyy-MM');

    const monthlyExpenses = db.exec(`
      SELECT category_id, c.name as category_name, SUM(amount) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE type = 'expense' AND date LIKE '${currentMonth}%'
      GROUP BY category_id
    `)[0]?.values.map(row => ({
      category_id: row[0],
      category_name: row[1],
      total: row[2]
    })) || [];

    const totalIncome = db.exec(`
      SELECT SUM(amount) as total
      FROM transactions
      WHERE type = 'income' AND date LIKE '${currentMonth}%'
    `)[0]?.values[0][0] || 0;

    const totalExpenses = db.exec(`
      SELECT SUM(amount) as total
      FROM transactions
      WHERE type = 'expense' AND date LIKE '${currentMonth}%'
    `)[0]?.values[0][0] || 0;

    res.json({
      monthlyExpenses,
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses
    });
  });

  app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      runQuery('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]);
      res.json({ message: 'User registered!' });
    } catch (err) {
      res.status(400).json({ message: 'User already exists' });
    }
  });

  app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.getAsObject([email]);
    stmt.free();

    if (!user.id || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  });


  const PORT = 3009;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});