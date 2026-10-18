const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ==========================================
// 1. CUSTOMER DASHBOARD PAGE ROUTE (`/`)
// ==========================================
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bank of America | Online Banking</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-slate-100 text-slate-800 antialiased text-xs">
    <div id="root"></div>
    <script type="text/babel">
        const { useState } = React;

        function CustomerDashboard() {
            const [account, setAccount] = useState({
                fullName: 'Nora Hubbard',
                routingNumber: '021000021',
                accounts: [
                    { id: 'chg_01', name: 'Advantage Checking - 4321', balance: 3420.15 },
                    { id: 'svg_01', name: 'Advantage Savings - 9876', balance: 18500.00 }
                ]
            });

            const [transactions, setTransactions] = useState([
                { id: 1, date: '10/17/2026', description: 'Zelle Transfer from Friend', category: 'Banking', amount: 150.00 },
                { id: 2, date: '10/14/2026', description: 'Safeway Grocery Store', category: 'Banking', amount: -68.42 },
                { id: 3, date: '10/10/2026', description: 'Payroll Direct Deposit', category: 'Banking', amount: 2450.00 }
            ]);

            const [fromAcc, setFromAcc] = useState(account.accounts[0].id);
            const [transferAmt, setTransferAmt] = useState('');
            const [alert, setAlert] = useState({ text: '', type: '' });

            const formatCurrency = (val) => {
                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
            };

            const showAlert = (text, type = 'success') => {
                setAlert({ text, type });
                setTimeout(() => setAlert({ text: '', type: '' }), 5000);
            };

            const handleTransfer = (e) => {
                e.preventDefault();
                const amt = parseFloat(transferAmt);
                if (isNaN(amt) || amt <= 0) return showAlert('Enter a valid transfer amount.', 'error');

                const sourceAcc = account.accounts.find(a => a.id === fromAcc);
                if (!sourceAcc || sourceAcc.balance < amt) {
                    return showAlert('Insufficient funds to complete transfer.', 'error');
                }

                const updatedAccounts = account.accounts.map(a => 
                    a.id === fromAcc ? { ...a, balance: a.balance - amt } : a
                );

                setAccount({ ...account, accounts: updatedAccounts });
                setTransactions([
                    {
                        id: Date.now(),
                        date: new Date().toLocaleDateString('en-US'),
                        description: 'Outbound Remittance Transfer',
                        category: 'Transfer',
                        amount: -amt
                    },
                    ...transactions
                ]);

                setTransferAmt('');
                showAlert('Funds successfully dispatched.');
            };

            return (
                <div className="min-h-screen flex flex-col">
                    {alert.text && (
                        <div className={\`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-sm shadow-md border-l-4 font-semibold text-xs \${
                            alert.type === 'error' ? 'bg-red-50 border-red-600 text-red-900' : 'bg-emerald-50 border-emerald-600 text-emerald-900'
                        }\`}>
                            {alert.text}
                        </div>
                    )}

                    <header className="w-full bg-[#0033aa] text-white shadow-md">
                        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="bg-[#dc2626] font-serif font-black text-lg px-2.5 py-0.5 tracking-tighter rounded-sm">BA</div>
                                <span className="font-semibold text-sm tracking-tight hidden sm:inline">
                                    Bank of America <span className="text-blue-300 font-normal">| Online Banking</span>
                                </span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-slate-200 font-medium text-xs">Welcome, {account.fullName}</span>
                                <a href="/admin" className="bg-slate-800 hover:bg-slate-900 text-slate-200 px-3 py-1 text-xs rounded font-medium border border-slate-700">
                                    Admin Panel →
                                </a>
                            </div>
                        </div>
                    </header>

                    <main className="flex-grow max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 my-2">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white border border-slate-200 shadow-xs rounded-sm overflow-hidden">
                                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                                    <div>
                                        <h1 className="text-sm font-bold text-slate-900">{account.fullName}</h1>
                                        <p className="text-[10px] text-slate-500 font-mono">Routing: {account.routingNumber}</p>
                                    </div>
                                    <span className="bg-blue-100 text-[#0033aa] px-2 py-0.5 rounded-xs font-bold text-[10px]">Verified Account</span>
                                </div>

                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                                            <th className="p-3">Account Name</th>
                                            <th className="p-3 text-right">Available Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium">
                                        {account.accounts.map((acc) => (
                                            <tr key={acc.id} className="hover:bg-slate-50/80 transition">
                                                <td className="p-3 text-[#0033aa] font-semibold hover:underline cursor-pointer">{acc.name}</td>
                                                <td className="p-3 text-right text-slate-900 font-bold text-sm">{formatCurrency(acc.balance)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-white border border-slate-200 shadow-xs rounded-sm overflow-hidden">
                                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
                                    <h2 className="font-bold uppercase text-slate-700 tracking-wider text-[11px]">Recent Transaction History</h2>
                                </div>
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                                            <th className="p-3">Posting Date</th>
                                            <th className="p-3">Description</th>
                                            <th className="p-3 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium">
                                        {transactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-slate-50/50">
                                                <td className="p-3 text-slate-500">{tx.date}</td>
                                                <td className="p-3 text-slate-900 font-semibold">{tx.description}</td>
                                                <td className={\`p-3 text-right font-bold \${tx.amount < 0 ? 'text-slate-900' : 'text-emerald-700'}\`}>
                                                    {tx.amount > 0 ? \`+\${formatCurrency(tx.amount)}\` : formatCurrency(tx.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white border border-slate-200 shadow-xs rounded-sm overflow-hidden">
                                <div className="bg-[#0033aa] text-white px-4 py-3">
                                    <h3 className="font-bold uppercase text-[11px]">Quick Pay & Transfer</h3>
                                </div>
                                <form onSubmit={handleTransfer} className="p-4 space-y-4 font-semibold">
                                    <div>
                                        <label className="block text-slate-600 mb-1">From Account</label>
                                        <select 
                                            value={fromAcc} 
                                            onChange={(e) => setFromAcc(e.target.value)}
                                            className="w-full border border-slate-300 p-2 rounded-xs bg-white text-slate-900 outline-none"
                                        >
                                            {account.accounts.map(a => (
                                                <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-600 mb-1">To Destination</label>
                                        <select className="w-full border border-slate-300 p-2 rounded-xs bg-white text-slate-900 outline-none">
                                            <option value="external">External Contact (John Doe)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-600 mb-1">Amount ($ USD)</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            placeholder="0.00" 
                                            value={transferAmt} 
                                            onChange={(e) => setTransferAmt(e.target.value)} 
                                            className="w-full border border-slate-300 p-2 rounded-xs font-bold text-slate-900 outline-none focus:ring-1 focus:ring-blue-600"
                                        />
                                    </div>
                                    <button type="submit" className="w-full bg-[#dc2626] text-white font-bold py-2.5 rounded-sm uppercase tracking-wide hover:bg-red-700 transition shadow-xs">
                                        Execute Transfer
                                    </button>
                                </form>
                            </div>
                        </div>
                    </main>

                    <footer className="w-full border-t border-slate-200 bg-slate-50 text-slate-400 text-[10px] py-4 mt-12">
                        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
                            <p>© 2026 Bank of America Corporation. Member FDIC.</p>
                            <span className="text-slate-400 font-mono">Secure Client Portal</span>
                        </div>
                    </footer>
                </div>
            );
        }

        ReactDOM.createRoot(document.getElementById('root')).render(<CustomerDashboard />);
    </script>
</body>
</html>
  `);
});

// ==========================================
// 2. ADMIN CONTROL PANEL ROUTE (`/admin`)
// ==========================================
app.get('/admin', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bank of America | Admin Control Center</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-slate-900 text-slate-100 antialiased text-xs">
    <div id="root"></div>
    <script type="text/babel">
        const { useState } = React;

        function AdminControlPanel() {
            const [users, setUsers] = useState([
                {
                    uid: 'user_01',
                    username: 'nhubbard',
                    fullName: 'Nora Hubbard',
                    routingNumber: '021000021',
                    accounts: [
                        { id: 'chg_01', name: 'Advantage Checking - 4321', balance: 3420.15 },
                        { id: 'svg_01', name: 'Advantage Savings - 9876', balance: 18500.00 }
                    ]
                },
                {
                    uid: 'user_02',
                    username: 'jdoe99',
                    fullName: 'John Doe',
                    routingNumber: '051000033',
                    accounts: [
                        { id: 'chg_02', name: 'Core Checking - 1122', balance: 120.00 }
                    ]
                }
            ]);

            const [tickets, setTickets] = useState([
                { id: 'TKT-902', user: 'Nora Hubbard', subject: 'Inbound Wire Delay', text: "International transfer hasn't cleared my savings index yet." },
                { id: 'TKT-441', user: 'John Doe', subject: 'Locked Debit Card', text: 'Card declined at gas station pump.' }
            ]);

            const [fullname, setFullname] = useState('');
            const [username, setUsername] = useState('');
            const [password, setPassword] = useState('');

            const [selectedUid, setSelectedUid] = useState(users[0]?.uid || '');
            const [targetAccId, setTargetAccId] = useState(users[0]?.accounts[0]?.id || '');
            const [amount, setAmount] = useState('');
            const [actionType, setActionType] = useState('CREDIT');
            const [alert, setAlert] = useState({ text: '', type: '' });

            const formatCurrency = (val) => {
                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
            };

            const showAlert = (text, type = 'success') => {
                setAlert({ text, type });
                setTimeout(() => setAlert({ text: '', type: '' }), 5000);
            };

            const handleCreateUser = (e) => {
                e.preventDefault();
                if (!fullname || !username || !password) return showAlert('Fill out all credential fields.', 'error');

                const newUser = {
                    uid: \`user_\${Date.now()}\`,
                    username: username.toLowerCase().trim(),
                    fullName: fullname.trim(),
                    routingNumber: Math.floor(100000000 + Math.random() * 900000000).toString(),
                    accounts: [
                        { id: \`chg_\${Date.now()}\`, name: 'Standard Checking - 0000', balance: 0.00 }
                    ]
                };

                setUsers([...users, newUser]);
                setFullname('');
                setUsername('');
                setPassword('');
                showAlert(\`User created successfully for \${fullname}\`);
            };

            const handleFundAdjustment = (e) => {
                e.preventDefault();
                const amt = parseFloat(amount);
                if (isNaN(amt) || amt <= 0) return showAlert('Enter a valid positive dollar amount.', 'error');

                const multiplier = actionType === 'CREDIT' ? 1 : -1;

                const updatedUsers = users.map(u => {
                    if (u.uid === selectedUid) {
                        return {
                            ...u,
                            accounts: u.accounts.map(a => 
                                a.id === targetAccId ? { ...a, balance: a.balance + (amt * multiplier) } : a
                            )
                        };
                    }
                    return u;
                });

                setUsers(updatedUsers);
                setAmount('');
                showAlert(\`Balance \${actionType === 'CREDIT' ? 'credited' : 'debited'} successfully.\`);
            };

            const resolveTicket = (id) => {
                setTickets(tickets.filter(t => t.id !== id));
                showAlert(\`Support ticket \${id} resolved.\`);
            };

            return (
                <div className="min-h-screen flex flex-col">
                    {alert.text && (
                        <div className={\`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-sm shadow-md border-l-4 font-semibold text-xs \${
                            alert.type === 'error' ? 'bg-red-950 border-red-600 text-red-200' : 'bg-emerald-950 border-emerald-500 text-emerald-200'
                        }\`}>
                            {alert.text}
                        </div>
                    )}

                    <header className="w-full bg-slate-950 border-b border-slate-800 text-white">
                        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="bg-[#dc2626] font-serif font-black text-lg px-2.5 py-0.5 tracking-tighter rounded-sm">ADMIN</div>
                                <span className="font-bold text-sm tracking-tight">
                                    Enterprise Administration Console
                                </span>
                            </div>
                            <a href="/" className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded text-slate-200 font-semibold transition">
                                ← Return to Customer Site
                            </a>
                        </div>
                    </header>

                    <main className="flex-grow max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 my-2">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-slate-800 border border-slate-700 rounded-sm overflow-hidden">
                                <div className="bg-slate-850 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
                                    <h2 className="font-bold uppercase tracking-wider text-[11px] text-slate-300">Registered Users Registry</h2>
                                    <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono">Count: {users.length}</span>
                                </div>
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-900 text-slate-400 font-bold border-b border-slate-700 text-[10px] uppercase">
                                            <th className="p-3">User Profile</th>
                                            <th className="p-3">Username</th>
                                            <th className="p-3">Accounts & Balances</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700">
                                        {users.map((u) => (
                                            <tr key={u.uid} className="hover:bg-slate-750">
                                                <td className="p-3">
                                                    <div className="font-bold text-white">{u.fullName}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">UID: {u.uid}</div>
                                                </td>
                                                <td className="p-3 font-mono text-slate-300">@{u.username}</td>
                                                <td className="p-3 space-y-1">
                                                    {u.accounts.map(a => (
                                                        <div key={a.id} className="flex justify-between items-center bg-slate-900 border border-slate-700 px-2 py-1 rounded-xs">
                                                            <span className="text-slate-300 text-[11px]">{a.name}</span>
                                                            <span className="font-mono font-bold text-emerald-400">{formatCurrency(a.balance)}</span>
                                                        </div>
                                                    ))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-slate-800 border border-slate-700 rounded-sm overflow-hidden">
                                <div className="bg-slate-850 px-4 py-3 border-b border-slate-700">
                                    <h2 className="font-bold uppercase tracking-wider text-[11px] text-slate-300">Customer Support Ticket Desk</h2>
                                </div>
                                {tickets.length === 0 ? (
                                    <div className="p-6 text-center text-slate-500 font-medium">All support tickets resolved. Queue clear.</div>
                                ) : (
                                    <div className="divide-y divide-slate-700">
                                        {tickets.map((t) => (
                                            <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="bg-amber-900 text-amber-200 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">{t.id}</span>
                                                        <span className="font-bold text-white">{t.subject}</span>
                                                        <span className="text-slate-400">({t.user})</span>
                                                    </div>
                                                    <p className="text-slate-300 text-[11px] mt-1 italic">"{t.text}"</p>
                                                </div>
                                                <button 
                                                    onClick={() => resolveTicket(t.id)}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xs transition text-[11px] self-start sm:self-center"
                                                >
                                                    Mark Resolved
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-800 border border-slate-700 rounded-sm overflow-hidden">
                                <div className="bg-slate-850 px-4 py-3 border-b border-slate-700">
                                    <h3 className="font-bold uppercase tracking-wider text-[11px] text-slate-300">Create User Credentials</h3>
                                </div>
                                <form onSubmit={handleCreateUser} className="p-4 space-y-3 font-semibold">
                                    <div>
                                        <label className="block text-slate-400 mb-1">Full Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Nora Hubbard" 
                                            value={fullname} 
                                            onChange={(e) => setFullname(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 p-2 rounded-xs text-white outline-none focus:border-slate-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 mb-1">Username</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. nhubbard" 
                                            value={username} 
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 p-2 rounded-xs text-white font-mono outline-none focus:border-slate-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 mb-1">Password</label>
                                        <input 
                                            type="password" 
                                            placeholder="••••••••••••" 
                                            value={password} 
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 p-2 rounded-xs text-white outline-none focus:border-slate-500"
                                        />
                                    </div>
                                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xs uppercase tracking-wide transition">
                                        Create Account Credentials
                                    </button>
                                </form>
                            </div>

                            <div className="bg-slate-800 border border-slate-700 rounded-sm overflow-hidden">
                                <div className="bg-slate-850 px-4 py-3 border-b border-slate-700">
                                    <h3 className="font-bold uppercase tracking-wider text-[11px] text-slate-300">Treasury / Add Funds</h3>
                                </div>
                                <form onSubmit={handleFundAdjustment} className="p-4 space-y-3 font-semibold">
                                    <div>
                                        <label className="block text-slate-400 mb-1">Select User Account</label>
                                        <select 
                                            value={selectedUid} 
                                            onChange={(e) => {
                                                setSelectedUid(e.target.value);
                                                const found = users.find(u => u.uid === e.target.value);
                                                if (found && found.accounts.length > 0) setTargetAccId(found.accounts[0].id);
                                            }}
                                            className="w-full bg-slate-900 border border-slate-700 p-2 rounded-xs text-white outline-none"
                                        >
                                            {users.map(u => (
                                                <option key={u.uid} value={u.uid}>{u.fullName} (@{u.username})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-slate-400 mb-1">Target Account</label>
                                        <select 
                                            value={targetAccId} 
                                            onChange={(e) => setTargetAccId(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 p-2 rounded-xs text-white outline-none"
                                        >
                                            {users.find(u => u.uid === selectedUid)?.accounts.map(a => (
                                                <option key={a.id} value={a.id}>{a.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-slate-400 mb-1">Operation Type</label>
                                        <div className="grid grid-cols-2 gap-2 text-center">
                                            <button
                                                type="button"
                                                onClick={() => setActionType('CREDIT')}
                                                className={\`py-1.5 rounded-xs font-bold border transition \${actionType === 'CREDIT' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-900 text-slate-400 border-slate-700'}\`}
                                            >
                                                Add Funds
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActionType('DEBIT')}
                                                className={\`py-1.5 rounded-xs font-bold border transition \${actionType === 'DEBIT' ? 'bg-red-600 text-white border-red-600' : 'bg-slate-900 text-slate-400 border-slate-700'}\`}
                                            >
                                                Deduct Funds
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-slate-400 mb-1">Amount ($ USD)</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            placeholder="0.00" 
                                            value={amount} 
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 p-2 rounded-xs text-white font-bold outline-none focus:border-slate-500"
                                        />
                                    </div>

                                    <button type="submit" className="w-full bg-[#dc2626] hover:bg-red-700 text-white font-bold py-2 rounded-xs uppercase tracking-wide transition">
                                        Execute Vault Adjustment
                                    </button>
                                </form>
                            </div>
                        </div>
                    </main>
                </div>
            );
        }

        ReactDOM.createRoot(document.getElementById('root')).render(<AdminControlPanel />);
    </script>
</body>
</html>
  `);
});

// Fallback redirect
app.get('*', (req, res) => res.redirect('/'));

app.listen(PORT, () => console.log(`Server executing on port ${PORT}`));
