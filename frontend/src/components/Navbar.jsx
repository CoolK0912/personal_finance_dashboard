import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-blue-600 text-white p-4 shadow-lg">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex gap-6">
                    <Link to="/" className="font-bold text-xl hover:text-blue-200">Finance Tracker</Link>
                    {user && (
                        <>
                            <Link to="/transactions" className="hover:text-blue-200 transition">Transactions</Link>
                            <Link to="/accounts" className="hover:text-blue-200 transition">Accounts</Link>
                            <Link to="/budgets" className="hover:text-blue-200 transition">Budgets</Link>
                            <Link to="/categories" className="hover:text-blue-200 transition">Categories</Link>
                        </>
                    )}
                </div>
                <div className="flex gap-4 items-center">
                    {user ? (
                        <>
                            <span className="text-blue-200">Welcome, {user.username}</span>
                            <button
                                onClick={handleLogout}
                                className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="hover:text-blue-200 transition">Login</Link>
                            <Link to="/register" className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-blue-100 transition">
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
