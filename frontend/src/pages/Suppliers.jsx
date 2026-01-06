import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, Edit, Trash2, Building2 } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';

export default function Suppliers() {
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['suppliers', search],
        queryFn: () => inventoryService.getSuppliers({ search, size: 50 })
    });

    const createMutation = useMutation({
        mutationFn: inventoryService.createSupplier,
        onSuccess: () => { queryClient.invalidateQueries(['suppliers']); setShowModal(false); }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'), contact_person: formData.get('contact_person'),
            email: formData.get('email'), phone: formData.get('phone'), address: formData.get('address'),
        };
        createMutation.mutate(data);
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Suppliers</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={18} /> Add Supplier</button>
            </div>

            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input type="text" className="input" style={{ paddingLeft: 40 }} placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </div>

            <div className="card">
                {isLoading ? <p className="text-muted text-center">Loading...</p> : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-lg)' }}>
                        {data?.items?.map((s) => (
                            <div key={s.id} className="card" style={{ background: 'var(--color-bg-tertiary)' }}>
                                <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-md)' }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--color-accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Building2 size={24} />
                                    </div>
                                    <div><h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{s.name}</h3><p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>{s.contact_person || 'No contact'}</p></div>
                                </div>
                                <div style={{ fontSize: 'var(--font-size-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                                    {s.email && <div className="text-muted">📧 {s.email}</div>}
                                    {s.phone && <div className="text-muted">📞 {s.phone}</div>}
                                </div>
                            </div>
                        ))}
                        {!data?.items?.length && <p className="text-muted">No suppliers found</p>}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h2 className="modal-title">Add Supplier</h2><button className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => setShowModal(false)}><X size={20} /></button></div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group"><label className="form-label">Company Name</label><input name="name" className="input" required /></div>
                            <div className="form-group"><label className="form-label">Contact Person</label><input name="contact_person" className="input" /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                <div className="form-group"><label className="form-label">Email</label><input name="email" type="email" className="input" /></div>
                                <div className="form-group"><label className="form-label">Phone</label><input name="phone" className="input" /></div>
                            </div>
                            <div className="form-group"><label className="form-label">Address</label><textarea name="address" className="input" rows={2} /></div>
                            <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
