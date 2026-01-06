import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Suppliers from './pages/Suppliers';
import Transactions from './pages/Transactions';

function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuthStore();

    if (isLoading) {
        return (
            <div className="flex items-center" style={{ justifyContent: 'center', minHeight: '100vh' }}>
                <div className="text-muted">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function App() {
    const { initialize, isLoading } = useAuthStore();

    useEffect(() => {
        initialize();
    }, [initialize]);

    if (isLoading) {
        return (
            <div className="flex items-center" style={{ justifyContent: 'center', minHeight: '100vh' }}>
                <div className="text-muted">Loading...</div>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
                path="/*"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/products" element={<Products />} />
                                <Route path="/inventory" element={<Inventory />} />
                                <Route path="/suppliers" element={<Suppliers />} />
                                <Route path="/transactions" element={<Transactions />} />
                            </Routes>
                        </Layout>
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}

export default App;
