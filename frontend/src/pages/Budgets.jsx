import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function Budgets() {
    const { getAuthHeaders } = useAuth();
    const [budgets, setBudgets] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        total_amount: '',
        spent_amount: '0',
        account: '',
        start_date: '',
        end_date: '',
    });
    const [error, setError] = useState('');

    // Category limit form
    const [showLimitForm, setShowLimitForm] = useState(false);
    const [limitData, setLimitData] = useState({
        category: '',
        limit: '',
    });

    const API_URL = 'http://127.0.0.1:8000/api';
    const categoryColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

    const fetchData = async () => {
        try {
            const headers = getAuthHeaders();
            const [budgetsRes, accountsRes, categoriesRes, transactionsRes] = await Promise.all([
                fetch(`${API_URL}/budgets/`, { headers }),
                fetch(`${API_URL}/accounts/`, { headers }),
                fetch(`${API_URL}/categories/`, { headers }),
                fetch(`${API_URL}/transactions/`, { headers }),
            ]);

            const [budgetsData, accountsData, categoriesData, transactionsData] = await Promise.all([
                budgetsRes.json(),
                accountsRes.json(),
                categoriesRes.json(),
                transactionsRes.json(),
            ]);

            setBudgets(budgetsData.results || budgetsData || []);
            setAccounts(accountsData.results || accountsData || []);
            setCategories(categoriesData.results || categoriesData || []);
            setTransactions(transactionsData.results || transactionsData || []);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Calculate spending by category for selected account
    const getSpendingByCategory = () => {
        let filtered = transactions.filter(t => t.type === 'withdrawal');
        if (selectedAccount) {
            filtered = filtered.filter(t => t.account === selectedAccount);
        }
        return filtered.reduce((acc, t) => {
            const cat = t.budget_category_name || 'Uncategorized';
            acc[cat] = (acc[cat] || 0) + parseFloat(t.amount);
            return acc;
        }, {});
    };

    // Get biggest purchases for selected account
    const getBiggestPurchases = () => {
        let filtered = transactions.filter(t => t.type === 'withdrawal');
        if (selectedAccount) {
            filtered = filtered.filter(t => t.account === selectedAccount);
        }
        return filtered.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount)).slice(0, 5);
    };

    const spendingByCategory = getSpendingByCategory();
    const biggestPurchases = getBiggestPurchases();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const url = editingBudget
            ? `${API_URL}/budgets/${editingBudget.id}/`
            : `${API_URL}/budgets/`;
        const method = editingBudget ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(JSON.stringify(errorData));
            }

            setShowForm(false);
            setEditingBudget(null);
            setFormData({
                name: '',
                total_amount: '',
                spent_amount: '0',
                account: '',
                start_date: '',
                end_date: '',
            });
            fetchData();
        } catch (err) {
            setError('Failed to save budget. Please check all fields.');
        }
    };

    const handleEdit = (budget) => {
        setEditingBudget(budget);
        setFormData({
            name: budget.name,
            total_amount: budget.total_amount,
            spent_amount: budget.spent_amount,
            account: budget.account,
            start_date: budget.start_date,
            end_date: budget.end_date,
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this budget?')) return;

        try {
            const response = await fetch(`${API_URL}/budgets/${id}/`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                fetchData();
            }
        } catch (err) {
            console.error('Error deleting budget:', err);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingBudget(null);
        setFormData({
            name: '',
            total_amount: '',
            spent_amount: '0',
            account: '',
            start_date: '',
            end_date: '',
        });
        setError('');
    };

    const handleSetLimit = async (e) => {
        e.preventDefault();
        // Create a new budget for the selected category
        const today = new Date();
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const budgetData = {
            name: `${categories.find(c => c.id === parseInt(limitData.category))?.name || 'Category'} Limit`,
            total_amount: limitData.limit,
            spent_amount: '0',
            account: selectedAccount || accounts[0]?.id,
            start_date: today.toISOString().split('T')[0],
            end_date: endOfMonth.toISOString().split('T')[0],
        };

        try {
            const response = await fetch(`${API_URL}/budgets/`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(budgetData),
            });

            if (response.ok) {
                setShowLimitForm(false);
                setLimitData({ category: '', limit: '' });
                fetchData();
            }
        } catch (err) {
            console.error('Error setting limit:', err);
        }
    };

    const getProgressColor = (spent, total) => {
        const percentage = (spent / total) * 100;
        if (percentage > 100) return 'bg-red-500';
        if (percentage > 80) return 'bg-yellow-500';
        return 'bg-blue-600';
    };

    const getStatusBadge = (budget) => {
        const percentage = (budget.spent_amount / budget.total_amount) * 100;
        const today = new Date();
        const endDate = new Date(budget.end_date);

        if (percentage > 100) {
            return <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">Over Budget</span>;
        }
        if (endDate < today) {
            return <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">Ended</span>;
        }
        if (percentage > 80) {
            return <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">Warning</span>;
        }
        return <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">On Track</span>;
    };

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    const totalBudgeted = budgets.reduce((sum, b) => sum + parseFloat(b.total_amount), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + parseFloat(b.spent_amount), 0);
    const remaining = totalBudgeted - totalSpent;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">My Budgets</h1>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        + Add Budget
                    </button>
                )}
            </div>

            {/* Account Selection - "Which Account would you like to budget?" */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-lg font-semibold mb-4">Which account would you like to budget?</h2>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setSelectedAccount(null)}
                        className={`px-4 py-2 rounded-lg transition ${
                            selectedAccount === null
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        All Accounts
                    </button>
                    {accounts.map(acc => (
                        <button
                            key={acc.id}
                            onClick={() => setSelectedAccount(acc.id)}
                            className={`px-4 py-2 rounded-lg transition ${
                                selectedAccount === acc.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {acc.name_account}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            {budgets.length > 0 && (
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-blue-600 text-sm font-medium">Total Budgeted</p>
                        <p className="text-2xl font-bold text-blue-700">${totalBudgeted.toFixed(2)}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <p className="text-orange-600 text-sm font-medium">Total Spent</p>
                        <p className="text-2xl font-bold text-orange-700">${totalSpent.toFixed(2)}</p>
                    </div>
                    <div className={`p-4 rounded-lg border ${remaining >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <p className={`text-sm font-medium ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>Remaining</p>
                        <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            ${remaining.toFixed(2)}
                        </p>
                    </div>
                </div>
            )}

            {/* Spending Analysis Section */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Biggest Recent Purchases */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-4">Biggest Recent Purchases</h2>
                    {biggestPurchases.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No purchases yet</p>
                    ) : (
                        <div className="space-y-2">
                            {biggestPurchases.map(purchase => (
                                <div key={purchase.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                    <span className="text-gray-700">${parseFloat(purchase.amount).toFixed(2)} - {purchase.description}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sectors of Purchases - Pie Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-4">Sectors of Purchases</h2>
                    {Object.keys(spendingByCategory).length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No categorized spending yet</p>
                    ) : (
                        <div className="flex gap-6">
                            {/* Pie Chart */}
                            <div className="w-32 h-32 relative flex-shrink-0">
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
                            <div className="flex-1 space-y-1">
                                {Object.entries(spendingByCategory).map(([cat, amount], index) => (
                                    <div key={cat} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                                            ></div>
                                            <span className="truncate">{cat}</span>
                                        </div>
                                        <span className="font-medium">${amount.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Set Category Limit Section */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-lg font-semibold mb-4">What sector should be limited?</h2>
                {!showLimitForm ? (
                    <button
                        onClick={() => setShowLimitForm(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Set a Category Limit
                    </button>
                ) : (
                    <form onSubmit={handleSetLimit} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Category</label>
                                <div className="space-y-2">
                                    {categories.length === 0 ? (
                                        <p className="text-gray-500 text-sm">No categories created yet</p>
                                    ) : (
                                        categories.map(cat => (
                                            <label key={cat.id} className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="category"
                                                    value={cat.id}
                                                    checked={limitData.category === String(cat.id)}
                                                    onChange={(e) => setLimitData({ ...limitData, category: e.target.value })}
                                                    className="text-blue-600"
                                                />
                                                <span>{cat.name}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">What's the limit?</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={limitData.limit}
                                        onChange={(e) => setLimitData({ ...limitData, limit: e.target.value })}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={!limitData.category || !limitData.limit}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                Set
                            </button>
                            <button
                                type="button"
                                onClick={() => { setShowLimitForm(false); setLimitData({ category: '', limit: '' }); }}
                                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Budget Creation Form */}
            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="text-xl font-semibold mb-4">
                        {editingBudget ? 'Edit Budget' : 'Add New Budget'}
                    </h2>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    {accounts.length === 0 ? (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4">
                            You need to create an account first before adding budgets.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Budget Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="e.g., Monthly Groceries, Entertainment"
                                    required
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Total Budget Amount
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={formData.total_amount}
                                        onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Amount Spent
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.spent_amount}
                                        onChange={(e) => setFormData({ ...formData, spent_amount: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Account
                                </label>
                                <select
                                    value={formData.account}
                                    onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    required
                                >
                                    <option value="">Select an account</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name_account}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                                >
                                    {editingBudget ? 'Update' : 'Create'} Budget
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* Budget List */}
            {budgets.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                    <p className="text-lg">No budgets yet.</p>
                    <p className="mt-2">Click "Add Budget" to create your first budget and start tracking your spending.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {budgets.map(budget => {
                        const percentage = Math.min((budget.spent_amount / budget.total_amount) * 100, 100);
                        const budgetRemaining = budget.total_amount - budget.spent_amount;

                        return (
                            <div key={budget.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-lg">{budget.name}</h3>
                                            {getStatusBadge(budget)}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {new Date(budget.start_date).toLocaleDateString()} - {new Date(budget.end_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(budget)}
                                            className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 transition text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(budget.id)}
                                            className="text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50 transition text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">
                                            Spent: <span className="font-semibold">${parseFloat(budget.spent_amount).toFixed(2)}</span>
                                        </span>
                                        <span className="text-gray-600">
                                            Budget: <span className="font-semibold">${parseFloat(budget.total_amount).toFixed(2)}</span>
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            className={`h-3 rounded-full transition-all ${getProgressColor(budget.spent_amount, budget.total_amount)}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className={`font-medium ${budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {budgetRemaining >= 0 ? 'Remaining' : 'Over budget'}: ${Math.abs(budgetRemaining).toFixed(2)}
                                    </span>
                                    <span className="text-gray-500">{percentage.toFixed(0)}% used</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Budgets;
