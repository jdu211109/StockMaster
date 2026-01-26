import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, TrendingUp, TrendingDown, Download } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';

export default function Transactions() {
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState({ type: '' });
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['transactions', filter],
        queryFn: () => {
            const params = { size: 100 };
            if (filter.type) params.type = filter.type;
            return inventoryService.getTransactions(params);
        }
    });

    const { data: products } = useQuery({ 
        queryKey: ['products'], 
        queryFn: () => inventoryService.getProducts({ size: 100 }) 
    });

    const createMutation = useMutation({
        mutationFn: inventoryService.createTransaction,
        onSuccess: () => { 
            queryClient.invalidateQueries(['transactions']); 
            queryClient.invalidateQueries(['products']);
            queryClient.invalidateQueries(['lowStock']);
            setShowModal(false); 
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            product_id: parseInt(formData.get('product_id')),
            type: formData.get('type'),
            quantity: parseInt(formData.get('quantity')),
            reference: formData.get('reference') || null,
            notes: formData.get('notes') || null,
        };
        createMutation.mutate(data);
    };

    const exportToCSV = () => {
        if (!data?.items?.length) return;
        
        const headers = ['Date', 'Type', 'Product', 'Quantity', 'Reference', 'Notes'];
        const rows = data.items.map(t => [
            new Date(t.created_at).toLocaleString(),
            t.type === 'stock_in' ? 'Stock In' : 'Stock Out',
            t.product_name,
            t.quantity,
            t.reference || '',
            t.notes || ''
        ]);
        
        const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const getTypeBadge = (type) => {
        if (type === 'stock_in') {
            return <span className="badge badge-success">Stock In</span>;
        }
        return <span className="badge badge-danger">Stock Out</span>;
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Stock In / Stock Out</h1>
                <div className="flex gap-md">
                    <button className="btn btn-secondary" onClick={exportToCSV}>
                        <Download size={18} /> Export CSV
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} /> New Transaction
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="flex gap-md">
                    <select 
                        className="input" 
                        style={{ width: 200 }} 
                        value={filter.type} 
                        onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                    >
                        <option value="">All Transactions</option>
                        <option value="stock_in">Stock In</option>
                        <option value="stock_out">Stock Out</option>
                    </select>
                </div>
            </div>

            <div className="card">
                {isLoading ? (
                    <p className="text-muted text-center">Loading...</p>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Reference</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.items?.map((t) => (
                                <tr key={t.id}>
                                    <td className="text-muted">
                                        {new Date(t.created_at).toLocaleString()}
                                    </td>
                                    <td>{getTypeBadge(t.type)}</td>
                                    <td>{t.product_name}</td>
                                    <td className="flex items-center gap-xs">
                                        {t.type === 'stock_in' ? (
                                            <TrendingUp size={16} style={{ color: 'var(--color-success)' }} />
                                        ) : (
                                            <TrendingDown size={16} style={{ color: 'var(--color-danger)' }} />
                                        )}
                                        <strong>{t.quantity}</strong>
                                    </td>
                                    <td className="text-muted">{t.reference || '-'}</td>
                                    <td className="text-muted">{t.notes || '-'}</td>
                                </tr>
                            ))}
                            {!data?.items?.length && (
                                <tr>
                                    <td colSpan={6} className="text-center text-muted">
                                        No transactions
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">New Transaction</h2>
                            <button 
                                className="btn btn-secondary" 
                                style={{ padding: '0.25rem' }} 
                                onClick={() => setShowModal(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Transaction Type</label>
                                <select name="type" className="input" required>
                                    <option value="stock_in">Stock In</option>
                                    <option value="stock_out">Stock Out</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Product</label>
                                <select name="product_id" className="input" required>
                                    <option value="">Select product</option>
                                    {products?.items?.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.sku}) - Stock: {p.total_stock}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Quantity</label>
                                <input 
                                    name="quantity" 
                                    type="number" 
                                    className="input" 
                                    required 
                                    min="1" 
                                    placeholder="Enter quantity"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Reference (invoice, receipt, etc.)</label>
                                <input 
                                    name="reference" 
                                    className="input" 
                                    placeholder="Document number"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes</label>
                                <textarea 
                                    name="notes" 
                                    className="input" 
                                    rows={2} 
                                    placeholder="Additional information"
                                />
                            </div>
                            <div className="form-actions">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
