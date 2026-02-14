import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function Transactions() {
    const { getAuthHeaders } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        type: 'withdrawal',
        account: '',
        budget_category: '',
    });
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');

    const API_URL = 'http://127.0.0.1:8000/api';

    const fetchData = async () => {
        try {
            const headers = getAuthHeaders();
            const [transRes, accRes, catRes] = await Promise.all([
                fetch(`${API_URL}/transactions/`, { headers }),
                fetch(`${API_URL}/accounts/`, { headers }),
                fetch(`${API_URL}/categories/`, { headers }),
            ]);

            const [transData, accData, catData] = await Promise.all([
                transRes.json(),
                accRes.json(),
                catRes.json(),
            ]);

            setTransactions(transData.results || transData || []);
            setAccounts(accData.results || accData || []);
            setCategories(catData.results || catData || []);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const url = editingTransaction
            ? `${API_URL}/transactions/${editingTransaction.id}/`
            : `${API_URL}/transactions/`;
        const method = editingTransaction ? 'PUT' : 'POST';

        const payload = {
            ...formData,
            budget_category: formData.budget_category || null,
        };

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(JSON.stringify(errorData));
            }

            setShowForm(false);
            setEditingTransaction(null);
            setFormData({
                description: '',
                amount: '',
                type: 'withdrawal',
                account: '',
                budget_category: '',
            });
            fetchData();
        } catch (err) {
            setError('Failed to save transaction. Please check all fields.');
        }
    };

    const handleEdit = (transaction) => {
        setEditingTransaction(transaction);
        setFormData({
            description: transaction.description,
            amount: transaction.amount,
            type: transaction.type,
            account: transaction.account,
            budget_category: transaction.budget_category || '',
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this transaction?')) return;

        try {
            const response = await fetch(`${API_URL}/transactions/${id}/`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                fetchData();
            }
        } catch (err) {
            console.error('Error deleting transaction:', err);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingTransaction(null);
        setFormData({
            description: '',
            amount: '',
            type: 'withdrawal',
            account: '',
            budget_category: '',
        });
        setError('');
    };

    const filteredTransactions = transactions.filter(t => {
        if (filter === 'all') return true;
        return t.type === filter;
    });

    const totalIncome = transactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpenses = transactions
        .filter(t => t.type === 'withdrawal')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">My Transactions</h1>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        + Add Transaction
                    </button>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-green-600 text-sm font-medium">Total Income</p>
                    <p className="text-2xl font-bold text-green-700">+${totalIncome.toFixed(2)}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-red-600 text-sm font-medium">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-700">-${totalExpenses.toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-blue-600 text-sm font-medium">Net</p>
                    <p className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        ${(totalIncome - totalExpenses).toFixed(2)}
                    </p>
                </div>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="text-xl font-semibold mb-4">
                        {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
                    </h2>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    {accounts.length === 0 ? (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4">
                            You need to create an account first before adding transactions.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="e.g., Grocery shopping, Salary"
                                    required
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Amount
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Type
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        required
                                    >
                                        <option value="withdrawal">Expense (Withdrawal)</option>
                                        <option value="deposit">Income (Deposit)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
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
                                                {acc.name_account} (${parseFloat(acc.balance).toFixed(2)})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category (Optional)
                                    </label>
                                    <select
                                        value={formData.budget_category}
                                        onChange={(e) => setFormData({ ...formData, budget_category: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    >
                                        <option value="">No category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                                >
                                    {editingTransaction ? 'Update' : 'Create'} Transaction
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

            {/* Filter */}
            <div className="mb-4 flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg transition ${
                        filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('deposit')}
                    className={`px-4 py-2 rounded-lg transition ${
                        filter === 'deposit' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Income
                </button>
                <button
                    onClick={() => setFilter('withdrawal')}
                    className={`px-4 py-2 rounded-lg transition ${
                        filter === 'withdrawal' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Expenses
                </button>
            </div>

            {filteredTransactions.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                    <p className="text-lg">No transactions found.</p>
                    <p className="mt-2">Click "Add Transaction" to create your first transaction.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredTransactions.map(transaction => (
                        <div key={transaction.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg">{transaction.description}</h3>
                                        {transaction.budget_category_name && (
                                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                                {transaction.budget_category_name}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-500 text-sm">
                                        {new Date(transaction.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                        {transaction.account_name && ` • ${transaction.account_name}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`text-xl font-bold ${
                                        transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {transaction.type === 'deposit' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                                    </span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEdit(transaction)}
                                            className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(transaction.id)}
                                            className="text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Transactions;
