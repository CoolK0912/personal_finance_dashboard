import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function Categories() {
    const { getAuthHeaders } = useAuth();
    const [categories, setCategories] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        budget: '',
    });
    const [error, setError] = useState('');

    const API_URL = 'http://127.0.0.1:8000/api';

    const fetchData = async () => {
        try {
            const headers = getAuthHeaders();
            const [categoriesRes, budgetsRes] = await Promise.all([
                fetch(`${API_URL}/categories/`, { headers }),
                fetch(`${API_URL}/budgets/`, { headers }),
            ]);

            const [categoriesData, budgetsData] = await Promise.all([
                categoriesRes.json(),
                budgetsRes.json(),
            ]);

            setCategories(categoriesData.results || categoriesData || []);
            setBudgets(budgetsData.results || budgetsData || []);
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

        const url = editingCategory
            ? `${API_URL}/categories/${editingCategory.id}/`
            : `${API_URL}/categories/`;
        const method = editingCategory ? 'PUT' : 'POST';

        const payload = {
            ...formData,
            budget: formData.budget || null,
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
            setEditingCategory(null);
            setFormData({ name: '', description: '', budget: '' });
            fetchData();
        } catch (err) {
            setError('Failed to save category. Please try again.');
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            budget: category.budget || '',
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            const response = await fetch(`${API_URL}/categories/${id}/`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                fetchData();
            }
        } catch (err) {
            console.error('Error deleting category:', err);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '', budget: '' });
        setError('');
    };

    const getBudgetName = (budgetId) => {
        const budget = budgets.find(b => b.id === budgetId);
        return budget ? budget.name : null;
    };

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Categories</h1>
                    <p className="text-gray-600 mt-1">Organize your transactions with categories</p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        + Add Category
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="text-xl font-semibold mb-4">
                        {editingCategory ? 'Edit Category' : 'Add New Category'}
                    </h2>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="e.g., Groceries, Entertainment, Utilities"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description (Optional)
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="Add a description for this category..."
                                rows="3"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Link to Budget (Optional)
                            </label>
                            <select
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            >
                                <option value="">No linked budget</option>
                                {budgets.map(budget => (
                                    <option key={budget.id} value={budget.id}>
                                        {budget.name} (${parseFloat(budget.total_amount).toFixed(2)})
                                    </option>
                                ))}
                            </select>
                            <p className="text-sm text-gray-500 mt-1">
                                Link this category to a budget to track spending against it.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                            >
                                {editingCategory ? 'Update' : 'Create'} Category
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

            {categories.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                    <p className="text-lg">No categories yet.</p>
                    <p className="mt-2">Click "Add Category" to create categories for organizing your transactions.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {categories.map(category => (
                        <div key={category.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg text-gray-900">{category.name}</h3>
                                    {category.description && (
                                        <p className="text-gray-600 text-sm mt-1">{category.description}</p>
                                    )}
                                    {category.budget && (
                                        <div className="mt-2">
                                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                                                Budget: {getBudgetName(category.budget)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-1 ml-4">
                                    <button
                                        onClick={() => handleEdit(category)}
                                        className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition text-sm"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category.id)}
                                        className="text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Quick Stats */}
            {categories.length > 0 && (
                <div className="mt-8 bg-blue-50 p-6 rounded-lg">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700">Total Categories</h3>
                            <p className="text-3xl font-bold text-blue-600">{categories.length}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700">Linked to Budgets</h3>
                            <p className="text-3xl font-bold text-blue-600">
                                {categories.filter(c => c.budget).length}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Categories;
