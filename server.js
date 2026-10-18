const express = require('express');
const session = require('express-session');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'secure-banking-secret-key',
    resave: false,
    saveUninitialized: false
}));

// In-memory data store
let accounts = [
    { id: 1, name: "John Doe", username: "johndoe", password: "password123", balance: 1500.00, accountNumber: "ACC1001" },
    { id: 2, name: "Jane Smith", username: "janesmith", password: "securepass456", balance: 3420.50, accountNumber: "ACC1002" }
];

let transactions = [
    { id: 1, account: "ACC1001", type: "Deposit", amount: 500, date: new Date().toLocaleDateString() },
    { id: 2, account: "ACC1001", type: "Transfer", amount: -150, date: new Date().toLocaleDateString() }
];

// --- Authentication Middleware ---
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// --- Customer Login Route ---
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Customer Login - SecureBank</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f2f5; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .login-card { background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); width: 100%; max-width: 400px; }
                h2 { color: #1a73e8; margin-bottom: 24px; text-align: center; }
                .form-group { margin-bottom: 20px; }
                label { display: block; margin-bottom: 8px; color: #555; font-size: 14px; }
                input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; font-size: 14px; }
                button { width: 100%; background: #1a73e8; color: white; padding: 12px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; font-weight: bold; }
                button:hover { background: #1557b0; }
                .error { color: #d93025; font-size: 13px; text-align: center; margin-bottom: 15px; }
            </style>
        </head>
        <body>
            <div class="login-card">
                <h2>SecureBank Portal</h2>
                ${req.query.error ? '<div class="error">Invalid username or password</div>' : ''}
                <form action="/login" method="POST">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" name="username" required placeholder="Enter username">
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" name="password" required placeholder="Enter password">
                    </div>
                    <button type="submit">Sign In</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = accounts.find(acc => acc.username === username && acc.password === password);
    
    if (user) {
        req.session.user = user;
        res.redirect('/dashboard');
    } else {
        res.redirect('/login?error=true');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// --- Handle Money Transfer ---
app.post('/transfer', isAuthenticated, (req, res) => {
    const { recipientAccount, amount } = req.body;
    const transferAmount = parseFloat(amount);
    const currentUser = req.session.user;

    // Find current user in the main accounts array to update balance directly
    const sender = accounts.find(acc => acc.accountNumber === currentUser.accountNumber);
    const recipient = accounts.find(acc => acc.accountNumber === recipientAccount);

    if (transferAmount <= 0 || isNaN(transferAmount)) {
        return res.redirect('/dashboard?error=invalid_amount');
    }

    if (sender.balance < transferAmount) {
        return res.redirect('/dashboard?error=insufficient_funds');
    }

    // Deduct from sender
    sender.balance -= transferAmount;
    transactions.push({
        id: transactions.length + 1,
        account: sender.accountNumber,
        type: `Transfer to ${recipientAccount}`,
        amount: -transferAmount,
        date: new Date().toLocaleDateString()
    });

    // If recipient is within the same bank system, credit their account too
    if (recipient) {
        recipient.balance += transferAmount;
        transactions.push({
            id: transactions.length + 1,
            account: recipient.accountNumber,
            type: `Transfer from ${sender.accountNumber}`,
            amount: transferAmount,
            date: new Date().toLocaleDateString()
        });
    }

    // Update session user data
    req.session.user = sender;
    res.redirect('/dashboard?success=true');
});

// --- Upgraded Customer Dashboard ---
app.get('/dashboard', isAuthenticated, (req, res) => {
    // Refresh user state from main array
    const user = accounts.find(acc => acc.accountNumber === req.session.user.accountNumber);
    req.session.user = user;
    const userTransactions = transactions.filter(t => t.account === user.accountNumber);

    let messageHtml = '';
    if (req.query.error === 'insufficient_funds') {
        messageHtml = '<div style="background:#fce8e6; color:#d93025; padding:12px; border-radius:6px; margin-bottom:20px; font-size:14px;">Error: Insufficient funds for this transfer.</div>';
    } else if (req.query.error === 'invalid_amount') {
        messageHtml = '<div style="background:#fce8e6; color:#d93025; padding:12px; border-radius:6px; margin-bottom:20px; font-size:14px;">Error: Please enter a valid transfer amount.</div>';
    } else if (req.query.success === 'true') {
        messageHtml = '<div style="background:#e6f4ea; color:#137333; padding:12px; border-radius:6px; margin-bottom:20px; font-size:14px;">Success: Transfer completed successfully!</div>';
    }

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Dashboard - SecureBank</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; background: #f8f9fa; color: #333; }
                .navbar { background: #fff; padding: 15px 40px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                .navbar h2 { margin: 0; color: #1a73e8; }
                .logout-btn { background: #f1f3f4; color: #d93025; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; }
                .logout-btn:hover { background: #fce8e6; }
                .container { max-width: 900px; margin: 40px auto; padding: 0 20px; }
                .card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                .card { background: #fff; padding: 25px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
                .card h3 { margin-top: 0; color: #5f6368; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
                .balance { font-size: 32px; font-weight: bold; color: #202124; margin-top: 10px; }
                .account-info { font-size: 14px; color: #5f6368; margin-top: 5px; }
                .section-title { font-size: 18px; font-weight: 600; margin-bottom: 15px; color: #202124; }
                .transfer-form { background: #fff; padding: 25px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-bottom: 30px; }
                .form-row { display: flex; gap: 15px; margin-bottom: 15px; }
                .form-group { flex: 1; }
                label { display: block; margin-bottom: 6px; font-size: 13px; color: #5f6368; font-weight: 600; }
                input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; font-size: 14px; }
                button { background: #1a73e8; color: white; padding: 10px 20px; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; font-weight: bold; }
                button:hover { background: #1557b0; }
                table { width: 100%; background: #fff; border-radius: 12px; border-collapse: collapse; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
                th, td { padding: 15px 20px; text-align: left; border-bottom: 1px solid #f1f3f4; font-size: 14px; }
                th { background: #f8f9fa; color: #5f6368; font-weight: 600; }
                tr:last-child td { border-bottom: none; }
                .amount-positive { color: #137333; font-weight: 600; }
                .amount-negative { color: #d93025; font-weight: 600; }
            </style>
        </head>
        <body>
            <div class="navbar">
                <h2>SecureBank</h2>
                <a class="logout-btn" href="/logout">Sign Out</a>
            </div>
            <div class="container">
                ${messageHtml}
                <div class="card-grid">
                    <div class="card">
                        <h3>Available Balance</h3>
                        <div class="balance">$${user.balance.toFixed(2)}</div>
                        <div class="account-info">Account: ${user.accountNumber}</div>
                    </div>
                    <div class="card" style="display: flex; flex-direction: column; justify-content: center;">
                        <h3>Account Holder</h3>
                        <div style="font-size: 20px; font-weight: bold; margin-top: 10px;">${user.name}</div>
                        <div class="account-info">Status: <span style="color: #137333; font-weight: 600;">Active</span></div>
                    </div>
                </div>

                <div class="transfer-form">
                    <div class="section-title" style="margin-bottom:10px;">Transfer Money</div>
                    <form action="/transfer" method="POST">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Recipient Account Number</label>
                                <input type="text" name="recipientAccount" required placeholder="e.g. ACC1002">
                            </div>
                            <div class="form-group">
                                <label>Amount ($)</label>
                                <input type="number" step="0.01" name="amount" required placeholder="0.00">
                            </div>
                        </div>
                        <button type="submit">Send Funds</button>
                    </form>
                </div>

                <div class="section-title">Transaction History</div>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${userTransactions.length > 0 ? userTransactions.map(t => `
                            <tr>
                                <td>${t.date}</td>
                                <td>${t.type}</td>
                                <td class="${t.amount >= 0 ? 'amount-positive' : 'amount-negative'}">
                                    ${t.amount >= 0 ? '+' : ''}$${t.amount.toFixed(2)}
                                </td>
                            </tr>
                        `).join('') : '<tr><td colspan="3" style="text-align:center; color:#70757a;">No recent transactions found.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
    `);
});

// Root route redirects to login
app.get('/', (req, res) => {
    res.redirect('/login');
});

// --- Admin Console Interface ---
app.get('/admin', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Admin Console - SecureBank</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; background: #1a1a2e; color: #e1e1e6; }
                .container { max-width: 1000px; margin: 40px auto; padding: 30px; background: #161622; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
                h1 { color: #e94560; margin-top: 0; }
                p { color: #8a8a9e; }
                table { width: 100%; margin-top: 25px; border-collapse: collapse; background: #1f1f2e; border-radius: 8px; overflow: hidden; }
                th, td { padding: 14px 18px; border-bottom: 1px solid #2a2a40; text-align: left; font-size: 14px; }
                th { background: #242438; color: #e94560; font-weight: 600; }
                tr:last-child td { border-bottom: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Admin Console</h1>
                <p>Manage registered customer accounts and credentials.</p>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Username</th>
                            <th>Password (Admin View)</th>
                            <th>Account #</th>
                            <th>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${accounts.map(acc => `
                            <tr>
                                <td>${acc.id}</td>
                                <td><strong>${acc.name}</strong></td>
                                <td><code>${acc.username}</code></td>
                                <td><code>${acc.password}</code></td>
                                <td>${acc.accountNumber}</td> <td style="color: #4ecca3; font-weight: bold;">$${acc.balance.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
