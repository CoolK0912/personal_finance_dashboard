import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function Accounts() {
    const { getAuthHeaders } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [formData, setFormData] = useState({ name_account: '', balance: '' });
    const [error, setError] = useState('');

    const API_URL = 'http://127.0.0.1:8000/api';

    const fetchData = async () => {
        try {
            const headers = getAuthHeaders();
            const [accountsRes, transactionsRes] = await Promise.all([
                fetch(`${API_URL}/accounts/`, { headers }),
                fetch(`${API_URL}/transactions/`, { headers }),
            ]);
            const [accountsData, transactionsData] = await Promise.all([
                accountsRes.json(),
                transactionsRes.json(),
            ]);
            setAccounts(accountsData.results || accountsData || []);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const url = editingAccount ? `${API_URL}/accounts/${editingAccount.id}/` : `${API_URL}/accounts/`;
        const method = editingAccount ? 'PUT' : 'POST';

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
            setEditingAccount(null);
            setFormData({ name_account: '', balance: '' });
            fetchData();
        } catch (err) {
            setError('Failed to save account. Please try again.');
        }
    };

    const handleEdit = (account) => {
        setEditingAccount(account);
        setFormData({
            name_account: account.name_account,
            balance: account.balance,
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this account?')) return;

        try {
            const response = await fetch(`${API_URL}/accounts/${id}/`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                if (selectedAccount === id) {
                    setSelectedAccount(null);
                }
                fetchData();
            }
        } catch (err) {
            console.error('Error deleting account:', err);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingAccount(null);
        setFormData({ name_account: '', balance: '' });
        setError('');
    };

    const getAccountTransactions = (accountId) => {
        return transactions.filter(t => t.account === accountId);
    };

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    const selectedAccountData = accounts.find(a => a.id === selectedAccount);
    const accountTransactions = selectedAccount ? getAccountTransactions(selectedAccount) : [];

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">My Accounts</h1>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        + Add Account
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="text-xl font-semibold mb-4">
                        {editingAccount ? 'Edit Account' : 'Add New Account'}
                    </h2>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Name
                            </label>
                            <input
                                type="text"
                                value={formData.name_account}
                                onChange={(e) => setFormData({ ...formData, name_account: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="e.g., Checking, Savings, Credit Card"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Balance
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.balance}
                                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                            >
                                {editingAccount ? 'Update' : 'Create'} Account
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
                </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
                {/* Account List */}
                <div className="md:col-span-1">
                    <h2 className="text-lg font-semibold mb-4">Select an Account</h2>
                    {accounts.length === 0 ? (
                        <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
                            <p>No accounts yet.</p>
                            <p className="mt-2 text-sm">Click "Add Account" to create your first account.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {accounts.map(account => (
                                <div
                                    key={account.id}
                                    onClick={() => setSelectedAccount(account.id)}
                                    className={`bg-white p-4 rounded-lg shadow cursor-pointer transition ${
                                        selectedAccount === account.id
                                            ? 'ring-2 ring-blue-500 bg-blue-50'
                                            : 'hover:shadow-md'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{account.name_account}</h3>
                                            <p className="text-xl font-bold text-blue-600">
                                                ${parseFloat(account.balance).toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEdit(account); }}
                                                className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-100"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(account.id); }}
                                                className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-100"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Total Balance */}
                    {accounts.length > 0 && (
                        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-600">Total Balance</h3>
                            <p className="text-2xl font-bold text-blue-600">
                                ${accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0).toFixed(2)}
                            </p>
                        </div>
                    )}
                </div>

                {/* Account Details & Transactions */}
                <div className="md:col-span-2">
                    {selectedAccount ? (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="border-b border-gray-200 pb-4 mb-4">
                                <h2 className="text-2xl font-bold text-gray-900">{selectedAccountData?.name_account}</h2>
                                <p className="text-4xl font-bold text-blue-600 mt-2">
                                    ${parseFloat(selectedAccountData?.balance || 0).toFixed(2)}
                                </p>
                                <p className="text-gray-500 text-sm mt-1">Current Balance</p>
                            </div>

                            <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
                            {accountTransactions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No transactions for this account yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {accountTransactions.map((transaction, index) => (
                                        <div
                                            key={transaction.id}
                                            className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'} {index + 1}
                                                </p>
                                                <p className="text-sm text-gray-500">{transaction.description}</p>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(transaction.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className={`text-lg font-bold ${
                                                transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {transaction.type === 'deposit' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Account Summary */}
                            {accountTransactions.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-gray-200">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <p className="text-sm text-gray-500">Deposits</p>
                                            <p className="text-lg font-bold text-green-600">
                                                +${accountTransactions
                                                    .filter(t => t.type === 'deposit')
                                                    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                                                    .toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-gray-500">Withdrawals</p>
                                            <p className="text-lg font-bold text-red-600">
                                                -${accountTransactions
                                                    .filter(t => t.type === 'withdrawal')
                                                    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                                                    .toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-gray-500">Transactions</p>
                                            <p className="text-lg font-bold text-gray-700">
                                                {accountTransactions.length}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                            <div className="text-6xl mb-4">🏦</div>
                            <h3 className="text-lg font-semibold mb-2">Select an Account</h3>
                            <p>Click on an account from the list to view its balance and transaction history.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Accounts;
