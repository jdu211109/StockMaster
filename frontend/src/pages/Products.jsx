import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, X, Download, AlertTriangle } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';

export default function Products() {
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['products', search],
        queryFn: () => inventoryService.getProducts({ search, size: 100 })
    });

    const createMutation = useMutation({
        mutationFn: inventoryService.createProduct,
        onSuccess: () => { 
            queryClient.invalidateQueries(['products']); 
            queryClient.invalidateQueries(['lowStock']);
            setShowModal(false); 
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => inventoryService.updateProduct(id, data),
        onSuccess: () => { 
            queryClient.invalidateQueries(['products']); 
            queryClient.invalidateQueries(['lowStock']);
            setShowModal(false); 
            setEditingProduct(null); 
        }
    });

    const deleteMutation = useMutation({
        mutationFn: inventoryService.deleteProduct,
        onSuccess: () => { 
            queryClient.invalidateQueries(['products']); 
            setDeleteConfirm(null); 
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            sku: formData.get('sku'), 
            name: formData.get('name'), 
            description: formData.get('description') || null,
            unit_price: parseFloat(formData.get('unit_price')) || 0, 
            cost_price: parseFloat(formData.get('cost_price')) || 0,
            unit: formData.get('unit') || 'pcs',
        };
        
        const stockValue = parseInt(formData.get('stock')) || 0;
        if (editingProduct) {
            data.new_stock = stockValue;
        } else {
            data.initial_stock = stockValue;
        }
        editingProduct ? updateMutation.mutate({ id: editingProduct.id, data }) : createMutation.mutate(data);
    };

    const exportToCSV = () => {
        if (!data?.items?.length) return;
        
        const headers = ['SKU', 'Name', 'Description', 'Sale Price', 'Cost Price', 'Unit', 'Stock'];
        const rows = data.items.map(p => [
            p.sku,
            p.name,
            p.description || '',
            p.unit_price,
            p.cost_price,
            p.unit || 'pcs',
            p.total_stock
        ]);
        
        const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const handleDelete = (product) => {
        setDeleteConfirm(product);
    };

    const confirmDelete = () => {
        if (deleteConfirm) {
            deleteMutation.mutate(deleteConfirm.id);
        }
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Products</h1>
                <div className="flex gap-md">
                    <button className="btn btn-secondary" onClick={exportToCSV}>
                        <Download size={18} /> Export CSV
                    </button>
                    <button className="btn btn-primary" onClick={() => { setEditingProduct(null); setShowModal(true); }}>
                        <Plus size={18} /> Add Product
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input 
                        type="text" 
                        className="input" 
                        style={{ paddingLeft: 40 }} 
                        placeholder="Search products..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                    />
                </div>
            </div>

            <div className="card">
                {isLoading ? (
                    <p className="text-muted text-center">Loading...</p>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>Name</th>
                                <th>Price</th>
                                <th>Cost</th>
                                <th>Stock</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.items?.map((p) => (
                                <tr key={p.id}>
                                    <td style={{ fontFamily: 'monospace' }}>{p.sku}</td>
                                    <td>
                                        <div>{p.name}</div>
                                        {p.description && (
                                            <div className="text-muted" style={{ fontSize: '0.85em' }}>
                                                {p.description.substring(0, 50)}{p.description.length > 50 ? '...' : ''}
                                            </div>
                                        )}
                                    </td>
                                    <td>{parseFloat(p.unit_price).toLocaleString()} ₽</td>
                                    <td className="text-muted">{parseFloat(p.cost_price).toLocaleString()} ₽</td>
                                    <td>
                                        <span className={`badge ${p.total_stock < 10 ? 'badge-danger' : p.total_stock < 20 ? 'badge-warning' : 'badge-success'}`}>
                                            {p.total_stock} {p.unit || 'pcs'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-sm">
                                            <button 
                                                className="btn btn-secondary" 
                                                style={{ padding: '0.25rem 0.5rem' }} 
                                                onClick={() => { setEditingProduct(p); setShowModal(true); }}
                                                title="Edit"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                className="btn btn-danger" 
                                                style={{ padding: '0.25rem 0.5rem' }} 
                                                onClick={() => handleDelete(p)}
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!data?.items?.length && (
                                <tr>
                                    <td colSpan={6} className="text-center text-muted">
                                        No products found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal: Add/Edit Product */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                            <button className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">SKU</label>
                                <input name="sku" className="input" required defaultValue={editingProduct?.sku} placeholder="e.g. PRD-001" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input name="name" className="input" required defaultValue={editingProduct?.name} placeholder="Product name" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea name="description" className="input" rows={2} defaultValue={editingProduct?.description} placeholder="Product description (optional)" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                <div className="form-group">
                                    <label className="form-label">Sale Price</label>
                                    <input name="unit_price" type="number" step="0.01" className="input" defaultValue={editingProduct?.unit_price || 0} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Cost Price</label>
                                    <input name="cost_price" type="number" step="0.01" className="input" defaultValue={editingProduct?.cost_price || 0} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Unit of Measure</label>
                                <select name="unit" className="input" defaultValue={editingProduct?.unit || 'pcs'}>
                                    <option value="pcs">Pieces (pcs)</option>
                                    <option value="kg">Kilograms (kg)</option>
                                    <option value="l">Liters (l)</option>
                                    <option value="m">Meters (m)</option>
                                    <option value="box">Boxes (box)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    {editingProduct ? 'Stock on Hand' : 'Initial Stock'}
                                </label>
                                <input 
                                    name="stock" 
                                    type="number" 
                                    min="0" 
                                    className="input" 
                                    defaultValue={editingProduct?.total_stock || 0} 
                                    placeholder="Quantity" 
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingProduct ? 'Save' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Delete Confirmation */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertTriangle size={20} style={{ color: 'var(--color-danger)' }} />
                                Delete Product?
                            </h2>
                            <button className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => setDeleteConfirm(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <p style={{ marginBottom: 'var(--space-lg)' }}>
                            Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>? 
                            This action cannot be undone.
                        </p>
                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                                Cancel
                            </button>
                            <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
