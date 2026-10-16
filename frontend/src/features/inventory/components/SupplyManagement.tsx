import React, { useState } from 'react';
import type { SupplyItem, AuditAction } from '../../../types';
import CustomSelect from '../../../components/ui/CustomSelect';

interface Props {
    supplies: SupplyItem[];
    setSupplies: React.Dispatch<React.SetStateAction<SupplyItem[]>>;
    logAction: (action: AuditAction, details: string, entityId?: string) => void;
    back: () => void;
}

const UNITS = [
    { value: 'gr', label: 'Gramos (gr)' },
    { value: 'ml', label: 'Mililitros (ml)' },
    { value: 'unit', label: 'Unidades (unit)' },
    { value: 'kg', label: 'Kilogramos (kg)' },
    { value: 'lt', label: 'Litros (lt)' }
];

export default function SupplyManagement({ supplies, setSupplies, logAction, back }: Props) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<SupplyItem>>({
        name: '',
        currentStock: 0,
        unit: 'unit',
        minStock: 0,
        category: 'Insumos General'
    });

    const handleSave = () => {
        if (!formData.name) return;

        if (editingId) {
            setSupplies(prev => prev.map(s => s.id === editingId ? { ...s, ...formData } as SupplyItem : s));
            logAction('supply_update', `Insumo actualizado: ${formData.name}. Stock: ${formData.currentStock}${formData.unit}`, editingId);
            setEditingId(null);
        } else {
            const newSupply: SupplyItem = {
                id: Date.now().toString(),
                name: formData.name!,
                currentStock: formData.currentStock || 0,
                unit: (formData.unit as SupplyItem['unit']) || 'unit',
                minStock: formData.minStock || 0,
                category: formData.category || 'Insumos General'
            };
            setSupplies(prev => [...prev, newSupply]);
            logAction('supply_create', `Insumo creado: ${newSupply.name} (${newSupply.currentStock}${newSupply.unit})`, newSupply.id);
            setIsAdding(false);
        }
        setFormData({ name: '', currentStock: 0, unit: 'unit', minStock: 0, category: 'Insumos General' });
    };

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`¿Seguro que desea eliminar el insumo "${name}"?`)) {
            setSupplies(prev => prev.filter(s => s.id !== id));
            logAction('supply_delete', `Insumo eliminado: ${name}`, id);
        }
    };

    const getStatusColor = (supply: SupplyItem) => {
        if (supply.currentStock <= supply.minStock) return 'var(--danger-color)';
        if (supply.currentStock <= supply.minStock * 1.5) return 'var(--warning-color)';
        return 'var(--success-color)';
    };

    return (
        <div className="page-container animate-fade-in" style={{ padding: 'clamp(1rem, 3vw, 2rem)' }}>
            {/* Encabezado */}
            <div className="title-bar">
                <button onClick={back} className="btn-back">
                    <span style={{ fontSize: '1.2em' }}>←</span> VOLVER AL PANEL
                </button>
                <button
                    onClick={() => setIsAdding(true)}
                    className="btn-primary"
                    style={{ borderRadius: '4px', padding: '0.8rem 1.5rem', fontWeight: 'bold' }}
                >
                    + NUEVO INSUMO
                </button>
            </div>

            <h1 className="page-main-title">CONTROL DE BODEGA & INSUMOS</h1>

            {/* Contenido principal */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {supplies.length === 0 && !isAdding && (
                    <div className="glass-card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', opacity: 0.5 }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                        <h2 style={{ margin: 0 }}>No hay insumos registrados</h2>
                        <p>Comience agregando los ingredientes base de sus productos.</p>
                    </div>
                )}

                {supplies.sort((a, b) => a.currentStock / a.minStock - b.currentStock / b.minStock).map(supply => (
                    <div key={supply.id} className="glass-card" style={{
                        borderLeft: `4px solid ${getStatusColor(supply)}`,
                        padding: '1.5rem',
                        position: 'relative'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: '900', color: 'var(--primary-color)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                    {supply.category}
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{supply.name}</h3>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => { setEditingId(supply.id); setFormData(supply); }}
                                    style={{ background: 'var(--card-border)', border: 'none', color: 'var(--text-color)', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                    EDITAR
                                </button>
                                <button
                                    onClick={() => handleDelete(supply.id, supply.name)}
                                    style={{ background: 'rgba(220, 38, 38, 0.1)', border: 'none', color: '#ef4444', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                    ELIMINAR
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: '900', lineHeight: 1, color: getStatusColor(supply) }}>
                                {supply.currentStock}
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 'bold', opacity: 0.6, marginBottom: '6px' }}>
                                {supply.unit}
                            </div>
                        </div>

                        <div style={{ width: '100%', height: '6px', background: 'var(--card-border)', borderRadius: '3px', marginBottom: '1rem', overflow: 'hidden' }}>
                            <div style={{
                                width: `${Math.min(100, (supply.currentStock / (supply.minStock * 2)) * 100)}%`,
                                height: '100%',
                                background: getStatusColor(supply),
                                transition: 'width 0.3s ease'
                            }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            <span style={{ opacity: 0.5 }}>MÍNIMO REQUERIDO:</span>
                            <span>{supply.minStock} {supply.unit}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Agregar/Editar */}
            {(isAdding || editingId) && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000
                }}>
                    <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: 'min(92vw, 34rem)', padding: 'clamp(1.75rem, 4vw, 2.5rem)', boxSizing: 'border-box' }}>
                        <h2 style={{ marginTop: 0, marginBottom: '2rem', textAlign: 'center' }}>
                            {editingId ? 'EDITAR INSUMO' : 'REGISTRAR NUEVO INSUMO'}
                        </h2>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label" style={{ fontSize: '0.7rem' }}>NOMBRE DEL INSUMO</label>
                            <input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej. Carne de Res, Sal, Harina..."
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontSize: '0.7rem' }}>STOCK ACTUAL</label>
                                <input
                                    type="number"
                                    value={formData.currentStock}
                                    onChange={e => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontSize: '0.7rem' }}>UNIDAD</label>
                                <CustomSelect
                                    value={formData.unit || 'unit'}
                                    onChange={val => setFormData({ ...formData, unit: val as SupplyItem['unit'] })}
                                    options={UNITS}
                                    width="100%"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontSize: '0.7rem' }}>STOCK MÍNIMO (ALERTA)</label>
                                <input
                                    type="number"
                                    value={formData.minStock}
                                    onChange={e => setFormData({ ...formData, minStock: Number(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontSize: '0.7rem' }}>CATEGORÍA</label>
                                <input
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => { setIsAdding(false); setEditingId(null); }}
                                className="btn-back"
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                CANCELAR
                            </button>
                            <button
                                onClick={handleSave}
                                className="btn-primary"
                                style={{ flex: 2, borderRadius: '4px', fontWeight: 'bold' }}
                            >
                                {editingId ? 'GUARDAR CAMBIOS' : 'REGISTRAR INSUMO'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
