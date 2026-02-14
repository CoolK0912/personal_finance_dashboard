import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
    const { user, getAuthHeaders } = useAuth();
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showQuickTransaction, setShowQuickTransaction] = useState(false);
    const [quickTransactionData, setQuickTransactionData] = useState({
        description: '',
        amount: '',
        type: 'withdrawal',
        account: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const headers = {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json',
                };

                const [accountsRes, transactionsRes, budgetsRes, categoriesRes] = await Promise.all([
                    fetch('http://127.0.0.1:8000/api/accounts/', { headers }),
                    fetch('http://127.0.0.1:8000/api/transactions/', { headers }),
                    fetch('http://127.0.0.1:8000/api/budgets/', { headers }),
                    fetch('http://127.0.0.1:8000/api/categories/', { headers }),
                ]);

                const [accountsData, transactionsData, budgetsData, categoriesData] = await Promise.all([
                    accountsRes.json(),
                    transactionsRes.json(),
                    budgetsRes.json(),
                    categoriesRes.json(),
                ]);

                setAccounts(accountsData.results || accountsData || []);
                setTransactions(transactionsData.results || transactionsData || []);
                setBudgets(budgetsData.results || budgetsData || []);
                setCategories(categoriesData.results || categoriesData || []);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [user, getAuthHeaders]);

    const handleQuickTransaction = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://127.0.0.1:8000/api/transactions/', {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(quickTransactionData),
            });

            if (response.ok) {
                setShowQuickTransaction(false);
                setQuickTransactionData({ description: '', amount: '', type: 'withdrawal', account: '' });
                // Refresh data
                const headers = getAuthHeaders();
                const [transRes, accRes] = await Promise.all([
                    fetch('http://127.0.0.1:8000/api/transactions/', { headers }),
                    fetch('http://127.0.0.1:8000/api/accounts/', { headers }),
                ]);
                const [transData, accData] = await Promise.all([transRes.json(), accRes.json()]);
                setTransactions(transData.results || transData || []);
                setAccounts(accData.results || accData || []);
            }
        } catch (err) {
            console.error('Error creating transaction:', err);
        }
    };

    // Calculate totals
    const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
    const totalIncome = transactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const totalExpenses = transactions
        .filter(t => t.type === 'withdrawal')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const recentTransactions = transactions.slice(0, 5);

    // Calculate spending by category
    const spendingByCategory = transactions
        .filter(t => t.type === 'withdrawal' && t.budget_category_name)
        .reduce((acc, t) => {
            const cat = t.budget_category_name;
            acc[cat] = (acc[cat] || 0) + parseFloat(t.amount);
            return acc;
        }, {});

    // Get biggest recent purchases (withdrawals)
    const biggestPurchases = [...transactions]
        .filter(t => t.type === 'withdrawal')
        .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
        .slice(0, 5);

    // Colors for pie chart segments
    const categoryColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

    if (!user) {
        return (
            <div className="p-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Welcome to Financial Tracker
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Take control of your finances. Track spending, manage budgets, and reach your financial goals.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link
                            to="/register"
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                            Get Started
                        </Link>
                        <Link
                            to="/login"
                            className="bg-white text-blue-600 px-8 py-3 rounded-lg border border-blue-600 hover:bg-blue-50 transition font-medium"
                        >
                            Sign In
                        </Link>
                    </div>

                    <p className="text-gray-500 mt-4">No account? Register here!</p>

                    <div className="mt-16 grid md:grid-cols-3 gap-8">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <div className="text-blue-600 text-4xl mb-4">💰</div>
                            <h3 className="font-semibold text-lg mb-2">Track Accounts</h3>
                            <p className="text-gray-600">Monitor all your bank accounts and balances in one place.</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <div className="text-blue-600 text-4xl mb-4">📊</div>
                            <h3 className="font-semibold text-lg mb-2">Manage Budgets</h3>
                            <p className="text-gray-600">Set spending limits and track your progress towards goals.</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <div className="text-blue-600 text-4xl mb-4">📈</div>
                            <h3 className="font-semibold text-lg mb-2">Analyze Spending</h3>
                            <p className="text-gray-600">Understand where your money goes with detailed insights.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar Menu */}
            <div className="w-64 bg-white shadow-lg p-6 hidden md:block">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Menu</h2>
                <nav className="space-y-2">
                    <button
                        onClick={() => setShowQuickTransaction(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                        <span className="text-xl">+</span>
                        <span>Add Transaction</span>
                    </button>
                    <Link
                        to="/budgets"
                        className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 transition text-gray-700"
                    >
                        <span className="text-xl">📊</span>
                        <span>Budgets</span>
                    </Link>
                    <Link
                        to="/accounts"
                        className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 transition text-gray-700"
                    >
                        <span className="text-xl">🏦</span>
                        <span>Accounts</span>
                    </Link>
                    <Link
                        to="/categories"
                        className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 transition text-gray-700"
                    >
                        <span className="text-xl">🏷️</span>
                        <span>Categories</span>
                    </Link>
                    <Link
                        to="/transactions"
                        className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 transition text-gray-700"
                    >
                        <span className="text-xl">📝</span>
                        <span>All Transactions</span>
                    </Link>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                    <p className="text-gray-600 mb-6">Welcome back, {user.first_name || user.username}!</p>

                    {/* Quick Transaction Modal */}
                    {showQuickTransaction && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                                <h2 className="text-xl font-semibold mb-4">New Transaction</h2>
                                {accounts.length === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-gray-600 mb-4">You need to create an account first.</p>
                                        <button
                                            onClick={() => { setShowQuickTransaction(false); navigate('/accounts'); }}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                                        >
                                            Create Account
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleQuickTransaction} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                            <select
                                                value={quickTransactionData.type}
                                                onChange={(e) => setQuickTransactionData({ ...quickTransactionData, type: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="withdrawal">Withdraw / Expense</option>
                                                <option value="deposit">Deposit / Income</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                                            <select
                                                value={quickTransactionData.account}
                                                onChange={(e) => setQuickTransactionData({ ...quickTransactionData, account: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                required
                                            >
                                                <option value="">Select account (Checking, Savings...)</option>
                                                {accounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>{acc.name_account}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={quickTransactionData.amount}
                                                onChange={(e) => setQuickTransactionData({ ...quickTransactionData, amount: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
                                            <input
                                                type="text"
                                                value={quickTransactionData.description}
                                                onChange={(e) => setQuickTransactionData({ ...quickTransactionData, description: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="What's this for?"
                                                required
                                            />
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                                                Add Transaction
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowQuickTransaction(false)}
                                                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Mobile Quick Actions */}
                    <div className="md:hidden flex gap-3 mb-6">
                        <button
                            onClick={() => setShowQuickTransaction(true)}
                            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                            + Add Transaction
                        </button>
                        <Link
                            to="/budgets"
                            className="flex-1 bg-white text-gray-700 py-3 rounded-lg border hover:bg-gray-50 transition font-medium text-center"
                        >
                            Budgets
                        </Link>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white p-5 rounded-lg shadow-md border-l-4 border-blue-600">
                            <p className="text-gray-500 text-sm font-medium">Total Balance</p>
                            <p className="text-2xl font-bold text-gray-900">${totalBalance.toFixed(2)}</p>
                        </div>
                        <div className="bg-white p-5 rounded-lg shadow-md border-l-4 border-green-500">
                            <p className="text-gray-500 text-sm font-medium">Total Income</p>
                            <p className="text-2xl font-bold text-green-600">+${totalIncome.toFixed(2)}</p>
                        </div>
                        <div className="bg-white p-5 rounded-lg shadow-md border-l-4 border-red-500">
                            <p className="text-gray-500 text-sm font-medium">Total Expenses</p>
                            <p className="text-2xl font-bold text-red-600">-${totalExpenses.toFixed(2)}</p>
                        </div>
                        <div className="bg-white p-5 rounded-lg shadow-md border-l-4 border-purple-500">
                            <p className="text-gray-500 text-sm font-medium">Net Flow</p>
                            <p className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${(totalIncome - totalExpenses).toFixed(2)}
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        {/* Transaction History */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold">Transaction History</h2>
                                <Link to="/transactions" className="text-blue-600 hover:underline text-sm">
                                    View all
                                </Link>
                            </div>
                            {recentTransactions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No transactions yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {recentTransactions.map(transaction => (
                                        <div key={transaction.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                            <div>
                                                <p className="font-medium text-sm">{transaction.description}</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(transaction.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className={`font-semibold ${
                                                transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {transaction.type === 'deposit' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Summary / Accounts */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold">Accounts Summary</h2>
                                <Link to="/accounts" className="text-blue-600 hover:underline text-sm">
                                    Manage
                                </Link>
                            </div>
                            {accounts.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No accounts added</p>
                                    <Link to="/accounts" className="text-blue-600 hover:underline mt-2 inline-block">
                                        Add your first account
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {accounts.map(account => (
                                        <div key={account.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="font-medium">{account.name_account}</span>
                                            <span className="text-xl font-bold text-blue-600">${parseFloat(account.balance).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Biggest Recent Purchases */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-lg font-semibold mb-4">Biggest Recent Purchases</h2>
                            {biggestPurchases.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No purchases yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {biggestPurchases.map(purchase => (
                                        <div key={purchase.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                            <span className="text-gray-700">{purchase.description}</span>
                                            <span className="font-bold text-red-600">${parseFloat(purchase.amount).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sectors of Purchases (Spending by Category) */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-lg font-semibold mb-4">Spending by Category</h2>
                            {Object.keys(spendingByCategory).length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No categorized spending yet</p>
                                    <Link to="/categories" className="text-blue-600 hover:underline mt-2 inline-block">
                                        Create categories
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex gap-6">
                                    {/* Simple Pie Chart Visualization */}
                                    <div className="w-32 h-32 relative">
                                        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                            {(() => {
                                                const total = Object.values(spendingByCategory).reduce((a, b) => a + b, 0);
                                                let cumulativePercent = 0;
                                                return Object.entries(spendingByCategory).map(([cat, amount], index) => {
                                                    const percent = (amount / total) * 100;
                                                    const startAngle = cumulativePercent * 3.6;
                                                    cumulativePercent += percent;
                                                    const endAngle = cumulativePercent * 3.6;
                                                    const largeArc = percent > 50 ? 1 : 0;
                                                    const startX = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                                                    const startY = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                                                    const endX = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                                                    const endY = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);

                                                    return (
                                                        <path
                                                            key={cat}
                                                            d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`}
                                                            fill={categoryColors[index % categoryColors.length]}
                                                        />
                                                    );
                                                });
                                            })()}
                                        </svg>
                                    </div>
                                    {/* Legend */}
                                    <div className="flex-1 space-y-2">
                                        {Object.entries(spendingByCategory).map(([cat, amount], index) => (
                                            <div key={cat} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                                                    ></div>
                                                    <span>{cat}</span>
                                                </div>
                                                <span className="font-medium">${amount.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Budget Progress */}
                    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Budget Progress</h2>
                            <Link to="/budgets" className="text-blue-600 hover:underline text-sm">
                                View all
                            </Link>
                        </div>
                        {budgets.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p>No budgets set up</p>
                                <Link to="/budgets" className="text-blue-600 hover:underline mt-2 inline-block">
                                    Create your first budget
                                </Link>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {budgets.slice(0, 4).map(budget => {
                                    const percentage = Math.min((budget.spent_amount / budget.total_amount) * 100, 100);
                                    const isOverBudget = budget.spent_amount > budget.total_amount;
                                    return (
                                        <div key={budget.id} className="p-4 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="font-medium">{budget.name}</span>
                                                <span className={isOverBudget ? 'text-red-600 font-medium' : 'text-gray-600'}>
                                                    ${parseFloat(budget.spent_amount).toFixed(2)} / ${parseFloat(budget.total_amount).toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${
                                                        isOverBudget ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-blue-600'
                                                    }`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
