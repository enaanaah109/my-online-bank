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
            <title>Sign In - Bank of America (Secure)</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
                .login-container { background: #fff; width: 100%; max-width: 380px; padding: 40px; border-radius: 4px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-top: 5px solid #da291c; }
                .logo { font-size: 20px; font-weight: bold; color: #012169; margin-bottom: 30px; text-align: center; }
                .logo span { color: #da291c; }
                .form-group { margin-bottom: 20px; }
                label { display: block; font-size: 13px; color: #333; margin-bottom: 6px; font-weight: bold; }
                input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; font-size: 14px; }
                button { width: 100%; background: #012169; color: white; padding: 12px; border: none; border-radius: 4px; font-size: 15px; font-weight: bold; cursor: pointer; }
                button:hover { background: #001545; }
                .error { background: #fde8e8; color: #c53030; padding: 10px; font-size: 13px; border-radius: 4px; margin-bottom: 20px; text-align: center; }
            </style>
        </head>
        <body>
            <div class="login-container">
                <div class="logo">Bank of <span>America</span></div>
                ${req.query.error ? '<div class="error">Invalid User ID or Password.</div>' : ''}
                <form action="/login" method="POST">
                    <div class="form-group">
                        <label>User ID</label>
                        <input type="text" name="username" required placeholder="Enter username">
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" name="password" required placeholder="Enter password">
                    </div>
                    <button type="submit">Log In</button>
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

    const sender = accounts.find(acc => acc.accountNumber === currentUser.accountNumber);
    const recipient = accounts.find(acc => acc.accountNumber === recipientAccount);

    if (transferAmount <= 0 || isNaN(transferAmount)) {
        return res.redirect('/dashboard?error=invalid_amount');
    }

    if (sender.balance < transferAmount) {
        return res.redirect('/dashboard?error=insufficient_funds');
    }

    sender.balance -= transferAmount;
    transactions.push({
        id: transactions.length + 1,
        account: sender.accountNumber,
        type: `Transfer to ${recipientAccount}`,
        amount: -transferAmount,
        date: new Date().toLocaleDateString()
    });

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

    req.session.user = sender;
    res.redirect('/dashboard?success=true');
});

// --- Customer Dashboard ---
app.get('/dashboard', isAuthenticated, (req, res) => {
    const user = accounts.find(acc => acc.accountNumber === req.session.user.accountNumber);
    req.session.user = user;
    const userTransactions = transactions.filter(t => t.account === user.accountNumber);

    let alertHtml = '';
    if (req.query.error === 'insufficient_funds') {
        alertHtml = '<div style="background:#fde8e8; color:#c53030; padding:12px; border-radius:4px; margin-bottom:20px; font-size:14px;">Transaction Failed: Insufficient available balance.</div>';
    } else if (req.query.error === 'invalid_amount') {
        alertHtml = '<div style="background:#fde8e8; color:#c53030; padding:12px; border-radius:4px; margin-bottom:20px; font-size:14px;">Transaction Failed: Enter a valid transfer amount.</div>';
    } else if (req.query.success === 'true') {
        alertHtml = '<div style="background:#e6f4ea; color:#137333; padding:12px; border-radius:4px; margin-bottom:20px; font-size:14px;">Success: Your transfer was completed successfully.</div>';
    }

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Accounts - Bank of America</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; background: #f4f6f8; color: #333; }
                .header { background: #012169; color: white; padding: 15px 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #da291c; }
                .logo { font-size: 22px; font-weight: bold; }
                .logo span { color: #da291c; }
                .user-info { font-size: 14px; display: flex; align-items: center; gap: 20px; }
                .logout-btn { color: white; text-decoration: none; background: rgba(255,255,255,0.15); padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 13px; }
                .logout-btn:hover { background: rgba(255,255,255,0.25); }
                .main-container { max-width: 1000px; margin: 30px auto; padding: 0 20px; }
                .accounts-card { background: white; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 25px; border-top: 3px solid #012169; overflow: hidden; }
                .account-header { padding: 20px; background: #fafbfc; border-bottom: 1px solid #e1e4e8; display: flex; justify-content: space-between; align-items: center; }
                .account-body { padding: 20px; display: flex; justify-content: space-between; align-items: center; }
                .balance-amount { font-size: 28px; font-weight: bold; color: #012169; }
                .grid-section { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 30px; }
                .card { background: white; padding: 25px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .card h3 { margin-top: 0; color: #012169; font-size: 16px; border-bottom: 2px solid #f0f2f5; padding-bottom: 10px; }
                .form-group { margin-bottom: 15px; }
                label { display: block; font-size: 12px; font-weight: bold; color: #555; margin-bottom: 5px; }
                input { width: 100%; padding: 9px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; font-size: 14px; }
                .btn-transfer { background: #da291c; color: white; border: none; padding: 10px 15px; border-radius: 4px; font-weight: bold; cursor: pointer; width: 100%; }
                .btn-transfer:hover { background: #b51f14; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e1e4e8; font-size: 13px; }
                th { background: #f4f6f8; color: #012169; font-weight: bold; }
                .positive { color: #107c41; font-weight: bold; }
                .negative { color: #a80000; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">Bank of <span>America</span></div>
                <div class="user-info">
                    <span>Welcome, <strong>${user.name}</strong></span>
                    <a class="logout-btn" href="/logout">Sign Out</a>
                </div>
            </div>

            <div class="main-container">
                ${alertHtml}

                <div class="accounts-card">
                    <div class="account-header">
                        <strong>Checking Account (${user.accountNumber})</strong>
                        <span style="color: #555; font-size: 13px;">Active</span>
                    </div>
                    <div class="account-body">
                        <div>
                            <div style="font-size: 12px; color: #666; text-transform: uppercase;">Available Balance</div>
                            <div class="balance-amount">$${user.balance.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                <div class="grid-section">
                    <div class="card">
                        <h3>Transfer Money</h3>
                        <form action="/transfer" method="POST">
                            <div class="form-group">
                                <label>Recipient Account Number</label>
                                <input type="text" name="recipientAccount" required placeholder="e.g. ACC1002">
                            </div>
                            <div class="form-group">
                                <label>Amount ($)</label>
                                <input type="number" step="0.01" name="amount" required placeholder="0.00">
                            </div>
                            <button type="submit" class="btn-transfer">Send Transfer</button>
                        </form>
                    </div>

                    <div class="card">
                        <h3>Quick Links</h3>
                        <ul style="padding-left: 20px; line-height: 2.2; font-size: 14px; color: #012169;">
                            <li><a href="#" style="color:#012169; text-decoration:none;">Statements & Documents</a></li>
                            <li><a href="#" style="color:#012169; text-decoration:none;">Set Up Account Alerts</a></li>
                            <li><a href="#" style="color:#012169; text-decoration:none;">Order Checkbooks</a></li>
                            <li><a href="#" style="color:#012169; text-decoration:none;">Customer Support & Help</a></li>
                        </ul>
                    </div>
                </div>

                <div class="card">
                    <h3>Recent Transaction History</h3>
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
                                    <td class="${t.amount >= 0 ? 'positive' : 'negative'}">
                                        ${t.amount >= 0 ? '+' : ''}$${t.amount.toFixed(2)}
                                    </td>
                                </tr>
                            `).join('') : '<tr><td colspan="3" style="text-align:center; color:#777;">No transaction history available.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Root route redirects to login
app.get('/', (req, res) => {
    res.redirect('/login');
});

// --- ADMIN FEATURES ---

// Admin: Add a new user account
app.post('/admin/add-user', (req, res) => {
    const { name, username, password, initialBalance, accountNumber } = req.body;
    
    accounts.push({
        id: accounts.length + 1,
        name,
        username,
        password,
        balance: parseFloat(initialBalance) || 0.00,
        accountNumber
    });

    if (parseFloat(initialBalance) > 0) {
        transactions.push({
            id: transactions.length + 1,
            account: accountNumber,
            type: "Initial Deposit (Admin)",
            amount: parseFloat(initialBalance),
            date: new Date().toLocaleDateString()
        });
    }

    res.redirect('/admin');
});

// Admin: Add money to a user's account
app.post('/admin/add-funds', (req, res) => {
    const { accountNumber, amount } = req.body;
    const depositAmount = parseFloat(amount);
    const targetAccount = accounts.find(acc => acc.accountNumber === accountNumber);

    if (targetAccount && depositAmount > 0) {
        targetAccount.balance += depositAmount;
        transactions.push({
            id: transactions.length + 1,
            account: targetAccount.accountNumber,
            type: "Admin Deposit",
            amount: depositAmount,
            date: new Date().toLocaleDateString()
        });
    }

    res.redirect('/admin');
});

// --- Admin Console Interface (Full Management Features) ---
app.get('/admin', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Admin Console - SecureBank</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; background: #1a1a2e; color: #e1e1e6; }
                .container { max-width: 1100px; margin: 40px auto; padding: 30px; background: #161622; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
                h1 { color: #e94560; margin-top: 0; }
                h2 { color: #4ecca3; font-size: 18px; margin-top: 30px; border-bottom: 1px solid #2a2a40; padding-bottom: 8px; }
                p { color: #8a8a9e; }
                .admin-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                .admin-card { background: #1f1f2e; padding: 20px; border-radius: 6px; border: 1px solid #2a2a40; }
                .form-group { margin-bottom: 12px; }
                label { display: block; font-size: 12px; color: #8a8a9e; margin-bottom: 4px; font-weight: bold; }
                input, select { width: 100%; padding: 8px; background: #161622; border: 1px solid #2a2a40; color: white; border-radius: 4px; box-sizing: border-box; font-size: 13px; }
                button { background: #e94560; color: white; border: none; padding: 10px 15px; border-radius: 4px; font-weight: bold; cursor: pointer; width: 100%; margin-top: 5px; }
                button:hover { background: #d73852; }
                table { width: 100%; margin-top: 15px; border-collapse: collapse; background: #1f1f2e; border-radius: 6px; overflow: hidden; }
                th, td { padding: 12px 15px; border-bottom: 1px solid #2a2a40; text-align: left; font-size: 13px; }
                th { background: #242438; color: #e94560; font-weight: bold; }
                tr:last-child td { border-bottom: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Admin Console</h1>
                <p>Complete System Management, Client Accounts, and Transactions Control</p>

                <div class="admin-grid">
                    <div class="admin-card">
                        <h2>Add New Customer</h2>
                        <form action="/admin/add-user" method="POST">
                            <div class="form-group">
                                <label>Full Name</label>
                                <input type="text" name="name" required placeholder="e.g. Alex Johnson">
                            </div>
                            <div class="form-group">
                                <label>Username ID</label>
                                <input type="text" name="username" required placeholder="e.g. alexj">
                            </div>
                            <div class="form-group">
                                <label>Password</label>
                                <input type="text" name="password" required placeholder="e.g. pass123">
                            </div>
                            <div class="form-group">
                                <label>Account Number</label>
                                <input type="text" name="accountNumber" required placeholder="e.g. ACC1003">
                            </div>
                            <div class="form-group">
                                <label>Initial Balance ($)</label>
                                <input type="number" step="0.01" name="initialBalance" required placeholder="0.00">
                            </div>
                            <button type="submit">Create User Account</button>
                        </form>
                    </div>

                    <div class="admin-card">
                        <h2>Add Money to Account</h2>
                        <form action="/admin/add-funds" method="POST">
                            <div class="form-group">
                                <label>Select Account Number</label>
                                <select name="accountNumber" required>
                                    ${accounts.map(acc => `<option value="${acc.accountNumber}">${acc.name} (${acc.accountNumber})</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Deposit Amount ($)</label>
                                <input type="number" step="0.01" name="amount" required placeholder="0.00">
                            </div>
                            <button type="submit" style="background: #4ecca3; color: #161622;">Deposit Funds</button>
                        </form>
                    </div>
                </div>

                <h2>Registered Client Accounts</h2>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Username</th>
                            <th>Password</th>
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

                <h2>All System Transactions Log</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Transaction ID</th>
                            <th>Account Number</th>
                            <th>Type / Description</th>
                            <th>Amount</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${transactions.map(tx => `
                            <tr>
                                <td>${tx.id}</td>
                                <td>${tx.account}</td>
                                <td>${tx.type}</td>
                                <td style="color: ${tx.amount >= 0 ? '#4ecca3' : '#e94560'}; font-weight: bold;">
                                    ${tx.amount >= 0 ? '+' : ''}$${tx.amount.toFixed(2)}
                                </td>
                                <td>${tx.date}</td>
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
