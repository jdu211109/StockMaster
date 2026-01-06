import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowUpCircle, ArrowDownCircle, RefreshCw, X, TrendingUp, TrendingDown } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';

export default function Transactions() {
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState({ type: '' });
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['transactions', filter],
        queryFn: () => inventoryService.getTransactions({ ...filter, size: 50 })
    });

    const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => inventoryService.getProducts({ size: 100 }) });
    const { data: locations } = useQuery({ queryKey: ['locations'], queryFn: inventoryService.getLocations });

    const createMutation = useMutation({
        mutationFn: inventoryService.createTransaction,
        onSuccess: () => { queryClient.invalidateQueries(['transactions']); queryClient.invalidateQueries(['inventory']); setShowModal(false); }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            product_id: parseInt(formData.get('product_id')),
            location_id: parseInt(formData.get('location_id')),
            type: formData.get('type'),
            quantity: parseInt(formData.get('quantity')),
            reference: formData.get('reference') || null,
            notes: formData.get('notes') || null,
            destination_location_id: formData.get('destination_location_id') ? parseInt(formData.get('destination_location_id')) : null,
        };
        createMutation.mutate(data);
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'stock_in': return <TrendingUp size={16} style={{ color: 'var(--color-success)' }} />;
            case 'stock_out': return <TrendingDown size={16} style={{ color: 'var(--color-danger)' }} />;
            case 'transfer': return <RefreshCw size={16} style={{ color: 'var(--color-info)' }} />;
            default: return null;
        }
    };

    const getTypeBadge = (type) => {
        const classes = { stock_in: 'badge-success', stock_out: 'badge-danger', transfer: 'badge-info', adjustment: 'badge-warning', return: 'badge-success' };
        return <span className={`badge ${classes[type] || 'badge-info'}`}>{type.replace('_', ' ')}</span>;
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Transactions</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={18} /> New Transaction</button>
            </div>

            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="flex gap-md">
                    <select className="input" style={{ width: 200 }} value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}>
                        <option value="">All Types</option>
                        <option value="stock_in">Stock In</option>
                        <option value="stock_out">Stock Out</option>
                        <option value="transfer">Transfer</option>
                        <option value="adjustment">Adjustment</option>
                    </select>
                </div>
            </div>

            <div className="card">
                {isLoading ? <p className="text-muted text-center">Loading...</p> : (
                    <table className="table">
                        <thead><tr><th>Date</th><th>Type</th><th>Product</th><th>Quantity</th><th>Location</th><th>Reference</th><th>User</th></tr></thead>
                        <tbody>
                            {data?.items?.map((t) => (
                                <tr key={t.id}>
                                    <td className="text-muted">{new Date(t.created_at).toLocaleString()}</td>
                                    <td>{getTypeBadge(t.type)}</td>
                                    <td>{t.product_name}</td>
                                    <td className="flex items-center gap-xs">{getTypeIcon(t.type)} <strong>{t.quantity}</strong></td>
                                    <td>{t.location_name}{t.destination_location_name && <span className="text-muted"> → {t.destination_location_name}</span>}</td>
                                    <td className="text-muted">{t.reference || '-'}</td>
                                    <td className="text-muted">{t.user_name || '-'}</td>
                                </tr>
                            ))}
                            {!data?.items?.length && <tr><td colSpan={7} className="text-center text-muted">No transactions</td></tr>}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h2 className="modal-title">New Transaction</h2><button className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => setShowModal(false)}><X size={20} /></button></div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group"><label className="form-label">Type</label>
                                <select name="type" className="input" required>
                                    <option value="stock_in">Stock In</option>
                                    <option value="stock_out">Stock Out</option>
                                    <option value="transfer">Transfer</option>
                                    <option value="adjustment">Adjustment</option>
                                </select>
                            </div>
                            <div className="form-group"><label className="form-label">Product</label><select name="product_id" className="input" required><option value="">Select product</option>{products?.items?.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}</select></div>
                            <div className="form-group"><label className="form-label">Location</label><select name="location_id" className="input" required><option value="">Select location</option>{locations?.items?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
                            <div className="form-group"><label className="form-label">Destination (for transfers)</label><select name="destination_location_id" className="input"><option value="">Select destination</option>{locations?.items?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
                            <div className="form-group"><label className="form-label">Quantity</label><input name="quantity" type="number" className="input" required min="1" /></div>
                            <div className="form-group"><label className="form-label">Reference (PO, Invoice, etc)</label><input name="reference" className="input" /></div>
                            <div className="form-group"><label className="form-label">Notes</label><textarea name="notes" className="input" rows={2} /></div>
                            <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
