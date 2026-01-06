import { useQuery } from '@tanstack/react-query';
import { Package, Warehouse, AlertTriangle, ArrowLeftRight, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { inventoryService } from '../services/inventoryService';

export default function Dashboard() {
    const { data: products } = useQuery({
        queryKey: ['products'],
        queryFn: () => inventoryService.getProducts({ size: 1 })
    });

    const { data: lowStock } = useQuery({
        queryKey: ['lowStock'],
        queryFn: () => inventoryService.getLowStockAlerts()
    });

    const { data: transactions } = useQuery({
        queryKey: ['recentTransactions'],
        queryFn: () => inventoryService.getTransactions({ size: 5 })
    });

    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: () => inventoryService.getLocations()
    });

    // Mock chart data
    const chartData = [
        { name: 'Mon', in: 120, out: 80 },
        { name: 'Tue', in: 95, out: 110 },
        { name: 'Wed', in: 150, out: 90 },
        { name: 'Thu', in: 80, out: 120 },
        { name: 'Fri', in: 200, out: 150 },
        { name: 'Sat', in: 60, out: 40 },
        { name: 'Sun', in: 30, out: 20 },
    ];

    const stats = [
        { label: 'Total Products', value: products?.total || 0, icon: Package, color: '#3b82f6' },
        { label: 'Locations', value: locations?.total || 0, icon: Warehouse, color: '#8b5cf6' },
        { label: 'Low Stock Alerts', value: lowStock?.total || 0, icon: AlertTriangle, color: '#f59e0b' },
        { label: 'Transactions Today', value: transactions?.total || 0, icon: ArrowLeftRight, color: '#10b981' },
    ];

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {stats.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="stat-card">
                        <div className="stat-icon" style={{ background: `${color}20` }}>
                            <Icon size={24} style={{ color }} />
                        </div>
                        <div className="stat-content">
                            <h3>{label}</h3>
                            <p>{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts and Alerts */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
                {/* Stock Movement Chart */}
                <div className="card">
                    <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-lg)' }}>Stock Movement (Last 7 Days)</h2>
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                                <Area type="monotone" dataKey="in" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" name="Stock In" />
                                <Area type="monotone" dataKey="out" stroke="#ef4444" fillOpacity={1} fill="url(#colorOut)" name="Stock Out" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="card">
                    <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <AlertTriangle size={20} style={{ color: 'var(--color-warning)' }} />
                        Low Stock Alerts
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {lowStock?.items?.length > 0 ? (
                            lowStock.items.slice(0, 5).map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm)', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-md)' }}>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{item.location_name}</div>
                                    </div>
                                    <span className="badge badge-warning">{item.current_quantity} left</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-muted">No low stock alerts</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="card">
                <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-lg)' }}>Recent Transactions</h2>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Type</th>
                            <th>Quantity</th>
                            <th>Location</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions?.items?.length > 0 ? (
                            transactions.items.map((t) => (
                                <tr key={t.id}>
                                    <td>{t.product_name || 'N/A'}</td>
                                    <td>
                                        <span className={`badge ${t.type === 'stock_in' ? 'badge-success' : t.type === 'stock_out' ? 'badge-danger' : 'badge-info'}`}>
                                            {t.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                        {t.type === 'stock_in' ? <TrendingUp size={16} className="text-success" /> : <TrendingDown size={16} className="text-danger" />}
                                        {t.quantity}
                                    </td>
                                    <td>{t.location_name || 'N/A'}</td>
                                    <td className="text-muted">{new Date(t.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} className="text-center text-muted">No recent transactions</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
