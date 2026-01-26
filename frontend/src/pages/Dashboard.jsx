import { useQuery } from '@tanstack/react-query';
import { Package, AlertTriangle, ArrowLeftRight, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { inventoryService } from '../services/inventoryService';

export default function Dashboard() {
    const { data: products } = useQuery({
        queryKey: ['products'],
        queryFn: () => inventoryService.getProducts({ size: 100 })
    });

    const { data: lowStock } = useQuery({
        queryKey: ['lowStock'],
        queryFn: () => inventoryService.getLowStockAlerts()
    });

    const { data: transactions } = useQuery({
        queryKey: ['recentTransactions'],
        queryFn: () => inventoryService.getTransactions({ size: 10 })
    });

    // Calculate total warehouse value
    const totalStockValue = products?.items?.reduce((sum, p) => 
        sum + (parseFloat(p.unit_price) * p.total_stock), 0
    ) || 0;

    // Chart data based on recent transactions
    const chartData = [
        { name: 'Mon', in: 0, out: 0 },
        { name: 'Tue', in: 0, out: 0 },
        { name: 'Wed', in: 0, out: 0 },
        { name: 'Thu', in: 0, out: 0 },
        { name: 'Fri', in: 0, out: 0 },
        { name: 'Sat', in: 0, out: 0 },
        { name: 'Sun', in: 0, out: 0 },
    ];

    // Fill data from transactions
    transactions?.items?.forEach(t => {
        const date = new Date(t.created_at);
        const dayIndex = date.getDay();
        const ruDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        if (t.type === 'stock_in') {
            chartData[ruDayIndex].in += t.quantity;
        } else {
            chartData[ruDayIndex].out += t.quantity;
        }
    });

    const stats = [
        { label: 'Total Products', value: products?.total || 0, icon: Package, color: '#3b82f6' },
        { label: 'Stock Value', value: `$${totalStockValue.toLocaleString()}`, icon: DollarSign, color: '#8b5cf6' },
        { label: 'Low Stock', value: lowStock?.total || 0, icon: AlertTriangle, color: '#f59e0b' },
        { label: 'Transactions', value: transactions?.total || 0, icon: ArrowLeftRight, color: '#10b981' },
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
                    <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-lg)' }}>Stock Movement (Week)</h2>
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
                        Low Stock
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', maxHeight: 280, overflowY: 'auto' }}>
                        {lowStock?.items?.length > 0 ? (
                            lowStock.items.map((item, i) => (
                                <div key={i} style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    padding: 'var(--space-sm)', 
                                    background: item.current_quantity <= 5 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                                    borderRadius: 'var(--radius-md)',
                                    border: item.current_quantity <= 5 ? '1px solid rgba(239, 68, 68, 0.3)' : 'none'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                            Min. level: {item.reorder_level}
                                        </div>
                                    </div>
                                    <span className={`badge ${item.current_quantity <= 5 ? 'badge-danger' : 'badge-warning'}`}>
                                        {item.current_quantity} pcs
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                                ✓ All products are in sufficient quantity
                            </p>
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
                            <th>Reference</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions?.items?.length > 0 ? (
                            transactions.items.map((t) => (
                                <tr key={t.id}>
                                    <td>{t.product_name || '-'}</td>
                                    <td>
                                        <span className={`badge ${t.type === 'stock_in' ? 'badge-success' : 'badge-danger'}`}>
                                            {t.type === 'stock_in' ? 'Stock In' : 'Stock Out'}
                                        </span>
                                    </td>
                                    <td style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                        {t.type === 'stock_in' ? (
                                            <TrendingUp size={16} style={{ color: 'var(--color-success)' }} />
                                        ) : (
                                            <TrendingDown size={16} style={{ color: 'var(--color-danger)' }} />
                                        )}
                                        {t.quantity}
                                    </td>
                                    <td className="text-muted">{t.reference || '-'}</td>
                                    <td className="text-muted">{new Date(t.created_at).toLocaleString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} className="text-center text-muted">No transactions</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
