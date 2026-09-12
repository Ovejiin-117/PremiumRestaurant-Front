import { useState, useMemo } from 'react';
import MenuFilter from '../../menu/components/MenuFilter';
import SecurityModal from '../../../components/ui/SecurityModal';
import SettingsControls from '../../../components/ui/SettingsControls';
import type { MenuItem, Promotion, PromotionType, UIScale, LayoutOrientation } from '../../../types';

interface Props {
    back: () => void;
    promotions: Promotion[];
    setPromotions: (promotions: Promotion[]) => void;
    menu: MenuItem[];
    categories: string[];
    subCategories: Record<string, string[]>;
    sections: Record<string, string[]>;
    uiScale: UIScale;
    setUiScale: (s: UIScale) => void;
    layoutOrientation: LayoutOrientation;
    setLayoutOrientation: (o: LayoutOrientation) => void;
    logAction: (action: import('../../../types').AuditAction, details: string, entityId?: string) => void;
    user: import('../../../types').User;
}

export default function Promotions({
    back, promotions, setPromotions, menu, categories, subCategories, sections,
    uiScale, setUiScale, layoutOrientation, setLayoutOrientation, logAction, user
}: Props) {
    // --- Estado ---
    const [viewMode, setViewMode] = useState<'list' | 'select_type' | 'create' | 'edit'>('list');
    const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
    const [selectedItemForDetails, setSelectedItemForDetails] = useState<MenuItem | null>(null);
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: 'create' | 'edit' | 'delete' | 'toggle', promo?: Promotion } | null>(null);
    const [isConfirmingEdit, setIsConfirmingEdit] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState<{ active: boolean, onConfirm: () => void } | null>(null);

    // Estado del formulario
    const [formData, setFormData] = useState<{
        name: string;
        type: PromotionType;
        value: string;
        pay: string;
        take: string;
        targetItemIds: string[];
        active: boolean;
        validityMode: 'permanent' | 'date_range';
        startDate: string;
        endDate: string;
        daysOfWeek: number[];
    }>({
        name: '',
        type: 'percentage',
        value: '',
        pay: '',
        take: '',
        targetItemIds: [],
        active: true,
        validityMode: 'permanent',
        startDate: '',
        endDate: '',
        daysOfWeek: [] // Vacío significa todos los días
    });

    // Verificar cambios sin guardar
    const hasUnsavedChanges = useMemo(() => {
        if (viewMode === 'list' || viewMode === 'select_type') return false;

        if (viewMode === 'create') {
            return formData.name !== '' ||
                formData.value !== '' ||
                formData.pay !== '' ||
                formData.take !== '' ||
                formData.targetItemIds.length > 0 ||
                formData.daysOfWeek.length > 0 ||
                formData.validityMode !== 'permanent';
        }

        if (viewMode === 'edit' && editingPromotion) {
            const p = editingPromotion;
            return formData.name !== p.name ||
                formData.value !== (p.value?.toString() || '') ||
                formData.pay !== (p.pay?.toString() || '') ||
                formData.take !== (p.take?.toString() || '') ||
                formData.targetItemIds.length !== p.targetItemIds.length ||
                !formData.targetItemIds.every(id => p.targetItemIds.includes(id)) ||
                formData.active !== p.active ||
                formData.validityMode !== p.validityMode ||
                formData.startDate !== (p.startDate || '') ||
                formData.endDate !== (p.endDate || '') ||
                (p.daysOfWeek && formData.daysOfWeek.length !== p.daysOfWeek.length);
        }
        return false;
    }, [formData, viewMode, editingPromotion]);

    const handleExitAttempt = (target: () => void) => {
        if (hasUnsavedChanges) {
            setShowExitConfirm({ active: true, onConfirm: target });
        } else {
            target();
        }
    };

    const [filters, setFilters] = useState({
        name: "",
        minPrice: "",
        maxPrice: "",
        category: "",
        subcategory: "",
        section: ""
    });

    // --- Lógica de filtrado ---
    const getFilterScore = (item: MenuItem) => {
        if (!filters.name) return 0;
        const name = item.name.toLowerCase();
        const search = filters.name.toLowerCase();
        if (name === search) return 100;
        if (name.startsWith(search)) return 50;
        if (name.includes(search)) return 10;
        return 0;
    };

    const filteredItems = useMemo(() => {
        return menu
            .filter(m => {
                if (filters.category && m.category !== filters.category) return false;
                if (filters.subcategory && m.subcategory !== filters.subcategory) return false;
                if (filters.section && m.section !== filters.section) return false;
                if (filters.name && !m.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
                if (filters.minPrice && m.price < Number(filters.minPrice)) return false;
                if (filters.maxPrice && m.price > Number(filters.maxPrice)) return false;
                return true;
            })
            .sort((a, b) => getFilterScore(b) - getFilterScore(a));
    }, [menu, filters]);

    // Validaciones y manejadores
    const resetForm = () => {
        setFormData({
            name: '',
            type: 'percentage',
            value: '',
            pay: '',
            take: '',
            targetItemIds: [],
            active: true,
            validityMode: 'permanent',
            startDate: '',
            endDate: '',
            daysOfWeek: []
        });
        setEditingPromotion(null);
        setIsConfirmingEdit(false);
    };

    const handleSave = () => {
        if (!formData.name.trim()) return;

        if (formData.type === 'percentage') {
            if (formData.targetItemIds.length === 0) return;
            const val = Number(formData.value);
            if (isNaN(val) || val < 1 || val > 100) return;
        } else if (formData.type === 'quantity_offer') {
            if (formData.targetItemIds.length === 0) return;
            if (!formData.pay || !formData.take) return;
        } else if (formData.type === 'combo') {
            if (formData.targetItemIds.length < 2) return;
            const val = Number(formData.value);
            if (isNaN(val) || val <= 0) return;
        }

        const newPromo: Promotion = {
            id: editingPromotion ? editingPromotion.id : crypto.randomUUID(),
            name: formData.name,
            type: formData.type,
            value: (formData.type === 'percentage' || formData.type === 'combo') ? Number(formData.value) : undefined,
            pay: formData.type === 'quantity_offer' ? Number(formData.pay) : undefined,
            take: formData.type === 'quantity_offer' ? Number(formData.take) : undefined,
            targetItemIds: formData.targetItemIds,
            active: formData.active,
            validityMode: formData.validityMode,
            startDate: formData.validityMode === 'date_range' ? formData.startDate : undefined,
            endDate: formData.validityMode === 'date_range' ? formData.endDate : undefined,
            daysOfWeek: formData.daysOfWeek.length > 0 ? formData.daysOfWeek : undefined
        };

        if (editingPromotion) {
            if (!isConfirmingEdit) {
                setIsConfirmingEdit(true);
                return;
            }
            setPromotions(promotions.map(p => p.id === newPromo.id ? newPromo : p));
            logAction('promotion_update', `Promoción actualizada: ${newPromo.name}`, newPromo.id);
            setIsConfirmingEdit(false);
        } else {
            setPromotions([...promotions, newPromo]);
            logAction('promotion_create', `Promoción creada: ${newPromo.name}`, newPromo.id);
        }

        setViewMode('list');
        resetForm();
    };

    const handleDelete = (id: string) => {
        const promo = promotions.find(p => p.id === id);
        setPromotions(promotions.filter(p => p.id !== id));
        logAction('promotion_delete', `Promoción eliminada: ${promo?.name}`, id);
    };

    const handleToggleActive = (id: string) => {
        const promo = promotions.find(p => p.id === id);
        if (promo) {
            const updated = { ...promo, active: !promo.active };
            setPromotions(promotions.map(p => p.id === id ? updated : p));
            logAction('promotion_toggle', `Promoción ${updated.active ? 'activada' : 'desactivada'}: ${promo.name}`, id);
        }
    };

    // --- Auxiliares de renderizado ---
    const getDaysLabel = (days?: number[]) => {
        if (!days || days.length === 0) return "Todos los día";
        const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
        return days.map(d => dayNames[d]).join(", ");
    };

    const actionButtonStyle = (color: string) => ({
        background: color,
        color: 'white',
        border: '1px solid rgba(255,255,255,0.3)',
        fontWeight: 'bold' as const,
        cursor: 'pointer',
        transition: 'all 0.2s',
        padding: '0.625em 1.25em',
        fontSize: '0.875em',
        borderRadius: '0.5em',
    });


    return (
        <div className={`scale-${uiScale}`}>
            <div className="page-container">
                <div className="title-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75em' }}>
                        <button onClick={() => handleExitAttempt(back)} className="btn-back">
                            ← Volver al panel
                        </button>
                        <SettingsControls
                            uiScale={uiScale}
                            setUiScale={setUiScale}
                            layoutOrientation={layoutOrientation}
                            setLayoutOrientation={setLayoutOrientation}
                            showOrientation={false}
                        />
                    </div>

                    <h1 style={{ margin: 0 }}>Gestión de Promociones</h1>
                </div>

                {viewMode === 'list' && (
                    <div className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>Promociones Activas</h2>
                            <button
                                onClick={() => {
                                    setPendingAction({ type: 'create' });
                                    setShowSecurityModal(true);
                                }}
                                style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                + Nueva Promoción
                            </button>
                        </div>

                        {promotions.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                No hay promociones creadas.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {promotions.map(promo => (
                                    <div key={promo.id} style={{
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--card-border)',
                                        borderRadius: '16px',
                                        padding: '1.25rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'all 0.3s ease',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                                    }}>
                                        {/* Línea indicadora de estado */}
                                        <div style={{
                                            position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                                            background: promo.active ? 'var(--primary-color)' : 'var(--text-secondary)',
                                            opacity: 0.6
                                        }} />

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                            {/* Ícono de tipo */}
                                            <div style={{
                                                width: '50px', height: '50px', borderRadius: '12px',
                                                background: promo.active ? 'var(--primary-color-alpha-10)' : 'var(--card-hover-bg)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1.2rem', fontWeight: '900', flexShrink: 0,
                                                border: '1px solid var(--card-border)',
                                                color: promo.active ? 'var(--primary-color)' : 'var(--text-secondary)'
                                            }}>
                                                {promo.type === 'percentage' ? '%' : promo.type === 'quantity_offer' ? 'NxM' : 'CBO'}
                                            </div>


                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <h3 style={{ margin: 0, color: 'var(--text-color)', fontWeight: '600' }}>{promo.name}</h3>
                                                    <span style={{
                                                        background: promo.active ? 'var(--success-color-alpha-10)' : 'var(--danger-color-alpha-10)',
                                                        color: promo.active ? 'var(--success-color)' : 'var(--danger-color)',
                                                        fontSize: '0.65rem', padding: '3px 10px', borderRadius: '20px',
                                                        fontWeight: 'bold', border: `1px solid ${promo.active ? 'var(--success-color-alpha-20)' : 'var(--danger-color-alpha-20)'}`,
                                                        textTransform: 'uppercase', letterSpacing: '0.05em'
                                                    }}>
                                                        {promo.active ? 'Activa' : 'Inactiva'}
                                                    </span>
                                                </div>
                                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85em', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
                                                        {promo.type === 'percentage' ? `${promo.value}% Descuento` :
                                                            promo.type === 'quantity_offer' ? `Oferta ${promo.take}x${promo.pay}` :
                                                                `Combo por $${promo.value}`}
                                                    </span>
                                                    <span style={{ opacity: 0.3 }}>•</span>
                                                    <span>{promo.validityMode === 'permanent' ? 'Permanente' : `${promo.startDate} a ${promo.endDate}`}</span>
                                                    <span style={{ opacity: 0.3 }}>•</span>
                                                    <span>{getDaysLabel(promo.daysOfWeek)}</span>
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', opacity: 0.7 }}>
                                                    Aplicada a <b>{new Set(promo.targetItemIds).size}</b> productos del menú
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => {
                                                    setPendingAction({ type: 'toggle', promo });
                                                    setShowSecurityModal(true);
                                                }}
                                                style={actionButtonStyle(promo.active ? "var(--warning-color)" : "var(--success-color)")}
                                            >
                                                {promo.active ? "DESACTIVAR" : "ACTIVAR"}
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setPendingAction({ type: 'edit', promo });
                                                    setShowSecurityModal(true);
                                                }}
                                                style={actionButtonStyle("var(--primary-color)")}
                                            >
                                                EDITAR
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setPendingAction({ type: 'delete', promo });
                                                    setShowSecurityModal(true);
                                                }}
                                                style={actionButtonStyle("var(--danger-color)")}
                                            >
                                                ELIMINAR
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {viewMode === 'select_type' && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)'
                    }}>
                        <div className="glass-card" style={{ maxWidth: '400px', width: '90%', textAlign: 'center', padding: '2rem' }}>
                            <h2 style={{ marginTop: 0 }}>Tipo de Promoción</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>¿Qué tipo de oferta deseas crear?</p>

                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <button
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, type: 'percentage', targetItemIds: [] }));
                                        setViewMode('create');
                                    }}
                                    style={{
                                        padding: '1.5rem', borderRadius: '12px', background: 'var(--primary-color-alpha-20)',
                                        border: '1px solid var(--primary-color)', color: 'var(--primary-color)', cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center'
                                    }}
                                >
                                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>%</span>
                                    <span style={{ fontWeight: 'bold' }}>Porcentaje de Descuento</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, type: 'quantity_offer', targetItemIds: [] }));
                                        setViewMode('create');
                                    }}
                                    style={{
                                        padding: '1.5rem', borderRadius: '12px', background: 'var(--success-color-alpha-20)',
                                        border: '1px solid var(--success-color)', color: 'var(--success-color)', cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center'
                                    }}
                                >
                                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>NxM</span>
                                    <span style={{ fontWeight: 'bold' }}>Cantidad (Oferta NxM)</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, type: 'combo', targetItemIds: [] }));
                                        setViewMode('create');
                                    }}
                                    style={{
                                        padding: '1.5rem', borderRadius: '12px', background: 'var(--warning-color-alpha-20)',
                                        border: '1px solid var(--warning-color)', color: 'var(--warning-color)', cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center'
                                    }}
                                >
                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>CBO</span>
                                    <span style={{ fontWeight: 'bold' }}>Combo (Precio Fijo)</span>
                                </button>
                            </div>

                            <button
                                onClick={() => { setViewMode('list'); resetForm(); }}
                                style={{ marginTop: '2rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {(viewMode === 'create' || viewMode === 'edit') && (
                    <div className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <div>
                                <h2 style={{ margin: 0 }}>{viewMode === 'create' ? 'Nueva Promoción' : 'Editar Promoción'}</h2>
                                <div style={{
                                    display: 'inline-block', marginTop: '0.5rem', padding: '4px 10px', borderRadius: '6px',
                                    background: formData.type === 'percentage' ? 'var(--primary-color-alpha-20)' :
                                        formData.type === 'quantity_offer' ? 'var(--success-color-alpha-20)' : 'var(--warning-color-alpha-20)',
                                    color: formData.type === 'percentage' ? 'var(--primary-color)' :
                                        formData.type === 'quantity_offer' ? 'var(--success-color)' : 'var(--warning-color)',
                                    fontSize: '0.85em', fontWeight: 'bold'
                                }}>
                                    {formData.type === 'percentage' ? 'DESCUENTO POR PORCENTAJE' :
                                        formData.type === 'quantity_offer' ? 'OFERTA POR CANTIDAD (NxM)' : 'COMBO DE PRODUCTOS'}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button
                                    onClick={() => handleExitAttempt(() => { setViewMode('list'); resetForm(); })}
                                    className="btn-back"
                                    style={{ height: '42px', minWidth: '140px', fontSize: '0.95rem', fontWeight: 900 }}
                                >
                                    ← Volver
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: '1.5rem', width: '100%' }}>
                            {/* Común: Nombre */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Nombre de la Promoción</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej. Martes de Hamburguesas"
                                    style={{ width: '100%', maxWidth: '600px', padding: '10px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-color)', borderRadius: '6px', boxSizing: 'border-box' }}
                                />
                            </div>

                            {/* Campos específicos del tipo */}
                            {formData.type === 'percentage' && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Porcentaje de Descuento (%)</label>
                                    <div style={{ position: 'relative', width: '100%', maxWidth: '600px', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}>
                                        <input
                                            type="number"
                                            min="1" max="100"
                                            value={formData.value}
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (val === "") {
                                                    setFormData({ ...formData, value: "" });
                                                    return;
                                                }
                                                const num = Number(val);
                                                if (num > 100) setFormData({ ...formData, value: "100" });
                                                else if (num < 0) setFormData({ ...formData, value: "1" });
                                                else setFormData({ ...formData, value: val });
                                            }}
                                            placeholder="0"
                                            style={{ width: '100%', padding: '10px', paddingRight: '40px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-color)', borderRadius: '6px', boxSizing: 'border-box' }}
                                        />
                                        <span style={{ position: 'absolute', right: '15px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>%</span>
                                    </div>
                                </div>
                            )}

                            {formData.type === 'quantity_offer' && (
                                <div className="glass-card" style={{ background: 'var(--success-color-alpha-05)', borderStyle: 'dashed', display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Lleva (M)</label>
                                        <input
                                            type="number"
                                            min="2"
                                            value={formData.take}
                                            onChange={e => setFormData({ ...formData, take: e.target.value })}
                                            placeholder="2"
                                            style={{ width: '100px', padding: '12px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-color)', borderRadius: '6px', fontSize: '1.2rem', fontWeight: 'bold' }}
                                        />
                                    </div>
                                    <div style={{ fontSize: '2rem', color: 'var(--text-secondary)', fontWeight: '300' }}>/</div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Paga (N)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.pay}
                                            onChange={e => setFormData({ ...formData, pay: e.target.value })}
                                            placeholder="1"
                                            style={{ width: '100px', padding: '12px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-color)', borderRadius: '6px', fontSize: '1.2rem', fontWeight: 'bold' }}
                                        />
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>
                                        Ej: 2x1, 3x2, etc.
                                    </div>
                                </div>
                            )}

                            {formData.type === 'combo' && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Precio Fijo del Combo ($)</label>
                                    <div style={{ position: 'relative', width: '100%', maxWidth: '600px', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.value}
                                            onChange={e => setFormData({ ...formData, value: e.target.value })}
                                            placeholder="Ej. 150"
                                            style={{ width: '100%', padding: '10px', paddingRight: '40px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-color)', borderRadius: '6px', boxSizing: 'border-box' }}
                                        />
                                        <span style={{ position: 'absolute', right: '15px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>$</span>
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85em', marginTop: '0.4rem' }}>
                                        Este será el precio total a pagar al llevar todos los productos seleccionados.
                                    </div>
                                </div>
                            )}

                            {/* Común: Artículos objetivo */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                    {formData.type === 'percentage' ? "Productos a Descontar" :
                                        formData.type === 'combo' ? "Productos del Combo" : "Productos de la Oferta"}
                                </label>
                                <div style={{ fontSize: '0.85em', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                    {formData.type === 'percentage' && "Selecciona uno o varios productos a los que se aplicará este descuento."}
                                    {formData.type === 'quantity_offer' && "Selecciona uno o varios productos a los que se aplicará esta oferta."}
                                    {formData.type === 'combo' && "Selecciona el grupo de productos que conformarán este combo a precio fijo."}
                                </div>

                                <MenuFilter
                                    onFilterChange={setFilters}
                                    categories={categories}
                                    subcategories={subCategories}
                                    sections={sections}
                                    onToggleAll={() => { }}
                                    globalCollapseState={null}
                                    hideToggle={true}
                                />

                                <div className="glass-card" style={{ marginTop: '1.5rem', maxHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                Catálogo de Productos
                                                <span style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 'normal' }}>({filteredItems.length} items)</span>
                                            </h3>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        </div>
                                    </div>

                                    <div style={{ overflowY: 'auto', paddingRight: '0.5rem', maxHeight: '500px' }}>
                                        {filteredItems.length === 0 ? (
                                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', opacity: 0.5 }}>No hay resultados</div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {filteredItems.map(item => {
                                                    const isSelected = formData.targetItemIds.includes(item.id);
                                                    const comboQty = formData.type === 'combo' ? formData.targetItemIds.filter(id => id === item.id).length : 0;
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            onClick={() => {
                                                                if (formData.type === 'combo') {
                                                                    if (isSelected) {
                                                                        setFormData({ ...formData, targetItemIds: formData.targetItemIds.filter(id => id !== item.id) });
                                                                    } else {
                                                                        setFormData({ ...formData, targetItemIds: [...formData.targetItemIds, item.id] });
                                                                    }
                                                                    return;
                                                                }
                                                                let newIds = [...formData.targetItemIds];
                                                                if (isSelected) {
                                                                    newIds = newIds.filter(id => id !== item.id);
                                                                } else {
                                                                    newIds.push(item.id);
                                                                }
                                                                setFormData({ ...formData, targetItemIds: newIds });
                                                            }}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                                padding: '0.75rem 1rem', borderRadius: '10px', cursor: 'pointer',
                                                                background: isSelected ? 'var(--primary-color-alpha-10)' : 'var(--card-hover-bg)',
                                                                border: isSelected ? '1px solid var(--primary-color)' : '1px solid var(--card-border)',
                                                                transition: 'all 0.2s',
                                                                gap: '1rem',
                                                                userSelect: 'none'
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1 }}>
                                                                <div style={{
                                                                    width: '32px', height: '32px', borderRadius: '8px',
                                                                    background: isSelected ? 'var(--primary-color)' : 'rgba(128, 128, 128, 0.1)',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    color: isSelected ? 'white' : 'var(--text-secondary)',
                                                                    fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s',
                                                                    border: isSelected ? '1px solid var(--primary-color)' : '1px solid rgba(128, 128, 128, 0.2)'
                                                                }}>
                                                                    {formData.type !== 'combo' && isSelected ? '' : ''}
                                                                </div>
                                                                <div style={{ textAlign: 'left' }}>
                                                                    <div style={{
                                                                        fontWeight: 'bold',
                                                                        color: isSelected ? 'var(--primary-color)' : 'var(--text-color)',
                                                                        fontSize: '0.95rem'
                                                                    }}>{item.name}</div>
                                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.6 }}>
                                                                        {item.category} {item.subcategory ? `> ${item.subcategory}` : ''}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                                                {/* El contador de combo aparece antes del precio para que el precio y puntos nunca se muevan */}
                                                                {formData.type === 'combo' && isSelected && (
                                                                    <div
                                                                        style={{
                                                                            display: 'flex', alignItems: 'center',
                                                                            background: 'var(--card-bg)',
                                                                            borderRadius: '8px',
                                                                            border: '1px solid var(--card-border)',
                                                                        }}
                                                                        onClick={e => e.stopPropagation()}
                                                                    >
                                                                        <button
                                                                            onClick={() => {
                                                                                const newIds = [...formData.targetItemIds];
                                                                                const idx = newIds.lastIndexOf(item.id);
                                                                                if (idx !== -1) newIds.splice(idx, 1);
                                                                                setFormData({ ...formData, targetItemIds: newIds });
                                                                            }}
                                                                            style={{
                                                                                width: '28px', height: '28px',
                                                                                background: 'transparent',
                                                                                border: 'none', outline: 'none',
                                                                                color: 'var(--text-secondary)',
                                                                                cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold',
                                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            }}
                                                                        >−</button>
                                                                        <span style={{
                                                                            width: '26px', textAlign: 'center',
                                                                            fontWeight: 'bold', fontSize: '0.9rem',
                                                                            color: 'var(--text-color)',
                                                                        }}>{comboQty}</span>
                                                                        <button
                                                                            onClick={() => {
                                                                                setFormData({ ...formData, targetItemIds: [...formData.targetItemIds, item.id] });
                                                                            }}
                                                                            style={{
                                                                                width: '28px', height: '28px',
                                                                                background: 'transparent',
                                                                                border: 'none', outline: 'none',
                                                                                color: 'var(--text-secondary)',
                                                                                cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold',
                                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            }}
                                                                        >+</button>
                                                                    </div>
                                                                )}

                                                                <div style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>${item.price}</div>

                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedItemForDetails(item); }}
                                                                    style={{
                                                                        background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-secondary)',
                                                                        cursor: 'pointer', fontSize: '1.1rem', width: '28px', height: '28px',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px',
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-color-alpha-20)'}
                                                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                                >
                                                                    ⋮
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>

                            {/* Común: Vigencia */}
                            <div className="glass-card" style={{ background: 'var(--card-hover-bg)' }}>
                                <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 'bold' }}>Vigencia y Horarios</label>

                                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input type="radio" checked={formData.validityMode === 'permanent'} onChange={() => setFormData({ ...formData, validityMode: 'permanent' })} />
                                        Permanente
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input type="radio" checked={formData.validityMode === 'date_range'} onChange={() => setFormData({ ...formData, validityMode: 'date_range' })} />
                                        Rango de Fechas
                                    </label>
                                </div>

                                {formData.validityMode === 'date_range' && (
                                    <div style={{ display: 'flex', gap: '3rem', marginBottom: '1.5rem' }}>
                                        <div style={{ width: '200px' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8em', color: 'var(--text-secondary)' }}>Fecha Inicio</label>
                                            <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-color)', boxSizing: 'border-box' }} />
                                        </div>
                                        <div style={{ width: '200px' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8em', color: 'var(--text-secondary)' }}>Fecha Fin</label>
                                            <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-color)', boxSizing: 'border-box' }} />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8em' }}>Días de la Semana</label>
                                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day, index) => (
                                            <label key={index} style={{
                                                padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--card-border)',
                                                background: formData.daysOfWeek.includes(index) ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                                                color: formData.daysOfWeek.includes(index) ? 'white' : 'var(--text-secondary)',
                                                cursor: 'pointer', fontSize: '0.85em', fontWeight: 'bold'
                                            }}>
                                                <input type="checkbox" checked={formData.daysOfWeek.includes(index)} onChange={() => {
                                                    const newDays = formData.daysOfWeek.includes(index) ? formData.daysOfWeek.filter(d => d !== index) : [...formData.daysOfWeek, index].sort();
                                                    setFormData({ ...formData, daysOfWeek: newDays });
                                                }} style={{ display: 'none' }} />
                                                {day}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Acciones */}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    onClick={handleSave}
                                    style={{
                                        flex: 1,
                                        background: viewMode === 'create' ? 'var(--primary-color)' : (isConfirmingEdit ? 'var(--warning-color)' : 'var(--success-color)'),
                                        color: 'white',
                                        border: 'none',
                                        padding: '14px',
                                        borderRadius: '10px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        fontSize: '1.1rem'
                                    }}
                                >
                                    {viewMode === 'create' ? 'Crear Promoción' : (isConfirmingEdit ? 'Confirmar' : 'Actualizar')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de detalles del producto */}
            {selectedItemForDetails && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)'
                }} onClick={() => setSelectedItemForDetails(null)}>
                    <div className="glass-card" style={{
                        maxWidth: '400px', width: '90%', padding: '2rem', textAlign: 'center',
                        position: 'relative', border: '1px solid var(--primary-color-alpha-50)'
                    }} onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedItemForDetails(null)}
                            style={{
                                position: 'absolute', top: '15px', right: '15px', background: 'none',
                                border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem'
                            }}
                        >
                            ✕
                        </button>

                        <div style={{
                            width: '100%', aspectRatio: '16/9', borderRadius: '12px',
                            background: 'var(--card-hover-bg)', marginBottom: '1.5rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden', border: '1px solid var(--card-border)'
                        }}>
                            {selectedItemForDetails.image ? (
                                <img
                                    src={selectedItemForDetails.image}
                                    alt={selectedItemForDetails.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <div style={{ color: 'var(--text-secondary)', opacity: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '3rem' }}>🖼️</span>
                                    <span>No hay imagen disponible</span>
                                </div>
                            )}
                        </div>

                        <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-color)' }}>{selectedItemForDetails.name}</h2>
                        <div style={{ color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '1rem' }}>
                            ${selectedItemForDetails.price}
                        </div>

                        <div style={{
                            textAlign: 'left', background: 'rgba(255,255,255,0.05)',
                            padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem',
                            maxHeight: '150px', overflowY: 'auto'
                        }}>
                            <label style={{ display: 'block', fontSize: '0.75em', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Descripción</label>
                            <p style={{ margin: 0, color: 'var(--text-color)', lineHeight: '1.4', fontSize: '0.9em' }}>
                                {selectedItemForDetails.description || "Sin descripción disponible para este producto."}
                            </p>
                        </div>

                        <button
                            onClick={() => setSelectedItemForDetails(null)}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px',
                                background: 'var(--primary-color)', color: 'white',
                                border: 'none', fontWeight: 'bold', cursor: 'pointer'
                            }}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

            {showSecurityModal && (
                <SecurityModal
                    isOpen={showSecurityModal}
                    onClose={() => {
                        setShowSecurityModal(false);
                        setPendingAction(null);
                    }}
                    onConfirm={() => {
                        if (pendingAction) {
                            if (pendingAction.type === 'create') {
                                resetForm();
                                setViewMode('select_type');
                            } else if (pendingAction.type === 'edit' && pendingAction.promo) {
                                const p = pendingAction.promo;
                                setEditingPromotion(p);
                                setFormData({
                                    name: p.name,
                                    type: p.type,
                                    value: p.value?.toString() || '',
                                    pay: p.pay?.toString() || '',
                                    take: p.take?.toString() || '',
                                    targetItemIds: p.targetItemIds,
                                    active: p.active,
                                    validityMode: p.validityMode,
                                    startDate: p.startDate || '',
                                    endDate: p.endDate || '',
                                    daysOfWeek: p.daysOfWeek || []
                                });
                                setViewMode('edit');
                            } else if (pendingAction.type === 'delete' && pendingAction.promo) {
                                handleDelete(pendingAction.promo.id);
                            } else if (pendingAction.type === 'toggle' && pendingAction.promo) {
                                handleToggleActive(pendingAction.promo.id);
                            }
                            setPendingAction(null);
                        }
                        setShowSecurityModal(false);
                    }}
                    userPassword={user.password}
                    title={
                        pendingAction?.type === 'create' ? "Nueva Promoción" :
                            pendingAction?.type === 'edit' ? "Editar Promoción" :
                                pendingAction?.type === 'toggle' ? "Cambiar Estado" : "Eliminar Promoción"
                    }
                    message={`Ingresa **tu contraseña** para ${pendingAction?.type === 'create' ? "crear una nueva promoción." :
                        pendingAction?.type === 'edit' ? "editar esta promoción." :
                            pendingAction?.type === 'toggle' ? "activar/desactivar esta promoción." : "eliminar esta promoción."
                        }`}
                />
            )}

            {showExitConfirm && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 10000, padding: '2rem'
                }}>
                    <div className="glass-card" style={{
                        maxWidth: '450px', width: '100%', padding: '3.5rem 2.5rem',
                        textAlign: 'center', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: '1.5rem', boxShadow: '0 0 50px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2.5rem', background: 'rgba(255,255,255,0.05)',
                            border: '2px dashed rgba(255,255,255,0.3)', marginBottom: '0.5rem',
                            boxShadow: '0 0 20px rgba(255,255,255,0.05)'
                        }}>
                            📢
                        </div>

                        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>
                            Promoción en Curso
                        </h2>

                        <p style={{
                            fontSize: '1rem', opacity: 0.8, lineHeight: '1.5',
                            margin: 0, maxWidth: '320px'
                        }}>
                            Tienes cambios sin guardar en esta promoción. Si sales ahora, se perderán estos cambios. ¿Estás seguro de que deseas salir?
                        </p>

                        <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1rem' }}>
                            <button
                                onClick={() => setShowExitConfirm(null)}
                                style={{
                                    flex: 1, padding: '1rem', borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.05)', color: 'white',
                                    fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            >
                                Seguir Editando
                            </button>
                            <button
                                onClick={() => {
                                    showExitConfirm.onConfirm();
                                    setShowExitConfirm(null);
                                }}
                                style={{
                                    flex: 1, padding: '1rem', borderRadius: '12px',
                                    border: 'none', background: '#ef4444', color: 'white',
                                    fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 20px rgba(239, 68, 68, 0.2)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                Salir y Borrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
