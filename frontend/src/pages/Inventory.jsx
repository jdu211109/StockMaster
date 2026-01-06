import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, AlertTriangle, Package, X, Edit } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';

export default function Inventory() {
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['inventory', search],
        queryFn: () => inventoryService.getInventory({ size: 50 })
    });

    const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => inventoryService.getProducts({ size: 100 }) });
    const { data: locations } = useQuery({ queryKey: ['locations'], queryFn: inventoryService.getLocations });

    const createMutation = useMutation({
        mutationFn: inventoryService.createInventory,
        onSuccess: () => { queryClient.invalidateQueries(['inventory']); setShowModal(false); }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => inventoryService.updateInventory(id, data),
        onSuccess: () => { queryClient.invalidateQueries(['inventory']); setShowModal(false); setEditingItem(null); }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            product_id: parseInt(formData.get('product_id')),
            location_id: parseInt(formData.get('location_id')),
            quantity: parseInt(formData.get('quantity')) || 0,
            reorder_level: parseInt(formData.get('reorder_level')) || 10,
            reorder_quantity: parseInt(formData.get('reorder_quantity')) || 50,
        };
        editingItem ? updateMutation.mutate({ id: editingItem.id, data: { quantity: data.quantity, reorder_level: data.reorder_level, reorder_quantity: data.reorder_quantity } }) : createMutation.mutate(data);
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Inventory</h1>
                <button className="btn btn-primary" onClick={() => { setEditingItem(null); setShowModal(true); }}>
                    <Plus size={18} /> Add Inventory
                </button>
            </div>

            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input type="text" className="input" style={{ paddingLeft: 40 }} placeholder="Search inventory..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </div>

            <div className="card">
                {isLoading ? <p className="text-muted text-center">Loading...</p> : (
                    <table className="table">
                        <thead><tr><th>Product</th><th>Location</th><th>Quantity</th><th>Reorder Level</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {data?.items?.map((item) => (
                                <tr key={item.id}>
                                    <td><div className="flex items-center gap-sm"><Package size={18} style={{ color: 'var(--color-accent-primary)' }} />{item.product_name}</div></td>
                                    <td>{item.location_name}</td>
                                    <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                                    <td className="text-muted">{item.reorder_level}</td>
                                    <td>{item.is_low_stock ? <span className="badge badge-warning"><AlertTriangle size={12} /> Low Stock</span> : <span className="badge badge-success">In Stock</span>}</td>
                                    <td><button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => { setEditingItem(item); setShowModal(true); }}><Edit size={16} /></button></td>
                                </tr>
                            ))}
                            {!data?.items?.length && <tr><td colSpan={6} className="text-center text-muted">No inventory records</td></tr>}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h2 className="modal-title">{editingItem ? 'Edit Inventory' : 'Add Inventory'}</h2><button className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => setShowModal(false)}><X size={20} /></button></div>
                        <form onSubmit={handleSubmit}>
                            {!editingItem && (
                                <>
                                    <div className="form-group"><label className="form-label">Product</label><select name="product_id" className="input" required><option value="">Select product</option>{products?.items?.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}</select></div>
                                    <div className="form-group"><label className="form-label">Location</label><select name="location_id" className="input" required><option value="">Select location</option>{locations?.items?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
                                </>
                            )}
                            <div className="form-group"><label className="form-label">Quantity</label><input name="quantity" type="number" className="input" required min="0" defaultValue={editingItem?.quantity || 0} /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                <div className="form-group"><label className="form-label">Reorder Level</label><input name="reorder_level" type="number" className="input" min="0" defaultValue={editingItem?.reorder_level || 10} /></div>
                                <div className="form-group"><label className="form-label">Reorder Qty</label><input name="reorder_quantity" type="number" className="input" min="0" defaultValue={editingItem?.reorder_quantity || 50} /></div>
                            </div>
                            <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editingItem ? 'Update' : 'Create'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
