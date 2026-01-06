import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, X } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';

export default function Products() {
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['products', search],
        queryFn: () => inventoryService.getProducts({ search, size: 50 })
    });

    const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: inventoryService.getCategories });
    const { data: suppliers } = useQuery({ queryKey: ['suppliers'], queryFn: () => inventoryService.getSuppliers() });

    const createMutation = useMutation({
        mutationFn: inventoryService.createProduct,
        onSuccess: () => { queryClient.invalidateQueries(['products']); setShowModal(false); }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => inventoryService.updateProduct(id, data),
        onSuccess: () => { queryClient.invalidateQueries(['products']); setShowModal(false); setEditingProduct(null); }
    });

    const deleteMutation = useMutation({
        mutationFn: inventoryService.deleteProduct,
        onSuccess: () => queryClient.invalidateQueries(['products'])
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            sku: formData.get('sku'), name: formData.get('name'), description: formData.get('description'),
            unit_price: parseFloat(formData.get('unit_price')) || 0, cost_price: parseFloat(formData.get('cost_price')) || 0,
            category_id: parseInt(formData.get('category_id')) || null, supplier_id: parseInt(formData.get('supplier_id')) || null,
        };
        editingProduct ? updateMutation.mutate({ id: editingProduct.id, data }) : createMutation.mutate(data);
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Products</h1>
                <button className="btn btn-primary" onClick={() => { setEditingProduct(null); setShowModal(true); }}>
                    <Plus size={18} /> Add Product
                </button>
            </div>

            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input type="text" className="input" style={{ paddingLeft: 40 }} placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </div>

            <div className="card">
                {isLoading ? <p className="text-muted text-center">Loading...</p> : (
                    <table className="table">
                        <thead>
                            <tr><th>SKU</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {data?.items?.map((p) => (
                                <tr key={p.id}>
                                    <td style={{ fontFamily: 'monospace' }}>{p.sku}</td>
                                    <td>{p.name}</td>
                                    <td>{p.category_name || '-'}</td>
                                    <td>${parseFloat(p.unit_price).toFixed(2)}</td>
                                    <td><span className={`badge ${p.total_stock < 10 ? 'badge-danger' : 'badge-success'}`}>{p.total_stock}</span></td>
                                    <td>
                                        <div className="flex gap-sm">
                                            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => { setEditingProduct(p); setShowModal(true); }}><Edit size={16} /></button>
                                            <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => deleteMutation.mutate(p.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!data?.items?.length && <tr><td colSpan={6} className="text-center text-muted">No products found</td></tr>}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                            <button className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group"><label className="form-label">SKU</label><input name="sku" className="input" required defaultValue={editingProduct?.sku} /></div>
                            <div className="form-group"><label className="form-label">Name</label><input name="name" className="input" required defaultValue={editingProduct?.name} /></div>
                            <div className="form-group"><label className="form-label">Description</label><textarea name="description" className="input" rows={3} defaultValue={editingProduct?.description} /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                <div className="form-group"><label className="form-label">Unit Price</label><input name="unit_price" type="number" step="0.01" className="input" defaultValue={editingProduct?.unit_price} /></div>
                                <div className="form-group"><label className="form-label">Cost Price</label><input name="cost_price" type="number" step="0.01" className="input" defaultValue={editingProduct?.cost_price} /></div>
                            </div>
                            <div className="form-group"><label className="form-label">Category</label>
                                <select name="category_id" className="input" defaultValue={editingProduct?.category_id || ''}><option value="">Select category</option>{categories?.items?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                            </div>
                            <div className="form-group"><label className="form-label">Supplier</label>
                                <select name="supplier_id" className="input" defaultValue={editingProduct?.supplier_id || ''}><option value="">Select supplier</option>{suppliers?.items?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                            </div>
                            <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editingProduct ? 'Update' : 'Create'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
