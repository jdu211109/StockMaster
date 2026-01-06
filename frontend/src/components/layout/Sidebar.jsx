import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    Warehouse,
    Users,
    ArrowLeftRight,
    LogOut,
    Settings
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/products', icon: Package, label: 'Products' },
    { path: '/inventory', icon: Warehouse, label: 'Inventory' },
    { path: '/suppliers', icon: Users, label: 'Suppliers' },
    { path: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
];

export default function Sidebar() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header" style={{ marginBottom: 'var(--space-xl)' }}>
                <h1 style={{
                    fontSize: 'var(--font-size-xl)',
                    fontWeight: 700,
                    background: 'var(--color-accent-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    StockMaster
                </h1>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(({ path, icon: Icon, label }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-md)',
                            padding: 'var(--space-md)',
                            borderRadius: 'var(--radius-md)',
                            color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                            background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                            marginBottom: 'var(--space-xs)',
                            transition: 'all var(--transition-fast)',
                        })}
                    >
                        <Icon size={20} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: 'var(--space-xl)', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    marginBottom: 'var(--space-md)',
                    padding: 'var(--space-sm)'
                }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--color-accent-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600
                    }}>
                        {user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{user?.full_name}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{user?.role}</div>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="btn btn-secondary"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>
        </aside>
    );
}
