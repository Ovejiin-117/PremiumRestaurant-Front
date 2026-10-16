import { useState, useMemo, useCallback } from 'react';
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
    const getFilterScore = useCallback((item: MenuItem) => {
        if (!filters.name) return 0;
        const name = item.name.toLowerCase();
        const search = filters.name.toLowerCase();
        if (name === search) return 100;
        if (name.startsWith(search)) return 50;
        if (name.includes(search)) return 10;
        return 0;
    }, [filters.name]);

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
    }, [menu, filters, getFilterScore]);

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

    const getActionButtonClass = (variant: 'warning' | 'success' | 'primary' | 'danger') => {
        const colors = {
            warning: 'bg-warning',
            success: 'bg-success',
            primary: 'bg-primary',
            danger: 'bg-danger',
        };
        return `text-white border border-white/30 font-bold cursor-pointer transition-all px-5 py-2.5 text-sm rounded-lg hover:brightness-110 active:scale-95 ${colors[variant]}`;
    };

    return (
        <div className={`scale-${uiScale}`}>
            <div className="page-container">
                <div className="title-bar">
                    <div className="flex items-center flex-wrap gap-3">
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
                </div>

                <h1 className="page-main-title">GESTIÓN DE PROMOCIONES</h1>

                {viewMode === 'list' && (
                    <div className="glass-card">
                        <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
                            <h2 className="m-0">Promociones Activas</h2>
                            <button
                                onClick={() => {
                                    setPendingAction({ type: 'create' });
                                    setShowSecurityModal(true);
                                }}
                                className="bg-primary text-white border-none px-5 py-2.5 rounded-lg cursor-pointer font-bold hover:brightness-110 active:scale-95 transition-all"
                            >
                                + Nueva Promoción
                            </button>
                        </div>

                        {promotions.length === 0 ? (
                            <div className="text-center py-12 text-text-secondary italic">
                                No hay promociones creadas.
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {promotions.map(promo => (
                                    <div
                                        key={promo.id}
                                        className="relative flex flex-wrap justify-between items-center gap-4 p-5 rounded-2xl bg-card border border-card-border overflow-hidden shadow-sm transition-all duration-300"
                                    >
                                        {/* Línea indicadora de estado */}
                                        <div
                                            className={`absolute left-0 top-0 bottom-0 w-1 opacity-60 ${
                                                promo.active ? 'bg-primary' : 'bg-text-secondary'
                                            }`}
                                        />

                                        <div className="flex items-center gap-5">
                                            {/* Ícono de tipo */}
                                            <div
                                                className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shrink-0 border border-card-border ${
                                                    promo.active ? 'bg-primary/10 text-primary' : 'bg-card-hover text-text-secondary'
                                                }`}
                                            >
                                                {promo.type === 'percentage' ? '%' : promo.type === 'quantity_offer' ? 'NxM' : 'CBO'}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="m-0 text-text-main font-semibold">{promo.name}</h3>
                                                    <span
                                                        className={`text-[0.65rem] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                                                            promo.active
                                                                ? 'bg-success/10 text-success border-success/20'
                                                                : 'bg-danger/10 text-danger border-danger/20'
                                                        }`}
                                                    >
                                                        {promo.active ? 'Activa' : 'Inactiva'}
                                                    </span>
                                                </div>
                                                <div className="text-text-secondary text-sm mt-1.5 flex items-center gap-2">
                                                    <span className="text-primary font-bold">
                                                        {promo.type === 'percentage' ? `${promo.value}% Descuento` :
                                                            promo.type === 'quantity_offer' ? `Oferta ${promo.take}x${promo.pay}` :
                                                                `Combo por $${promo.value}`}
                                                    </span>
                                                    <span className="opacity-30">•</span>
                                                    <span>{promo.validityMode === 'permanent' ? 'Permanente' : `${promo.startDate} a ${promo.endDate}`}</span>
                                                    <span className="opacity-30">•</span>
                                                    <span>{getDaysLabel(promo.daysOfWeek)}</span>
                                                </div>
                                                <div className="text-xs text-text-secondary mt-1 opacity-70">
                                                    Aplicada a <b>{new Set(promo.targetItemIds).size}</b> productos del menú
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 items-center" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => {
                                                    setPendingAction({ type: 'toggle', promo });
                                                    setShowSecurityModal(true);
                                                }}
                                                className={getActionButtonClass(promo.active ? "warning" : "success")}
                                            >
                                                {promo.active ? "DESACTIVAR" : "ACTIVAR"}
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setPendingAction({ type: 'edit', promo });
                                                    setShowSecurityModal(true);
                                                }}
                                                className={getActionButtonClass("primary")}
                                            >
                                                EDITAR
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setPendingAction({ type: 'delete', promo });
                                                    setShowSecurityModal(true);
                                                }}
                                                className={getActionButtonClass("danger")}
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
                    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm p-4">
                        <div className="glass-card max-w-[min(92vw,28rem)] w-[90%] text-center p-[clamp(1.5rem,4vw,2rem)] box-border">
                            <h2 className="mt-0">Tipo de Promoción</h2>
                            <p className="text-text-secondary mb-8">¿Qué tipo de oferta deseas crear?</p>

                            <div className="grid gap-4">
                                <button
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, type: 'percentage', targetItemIds: [] }));
                                        setViewMode('create');
                                    }}
                                    className="p-6 rounded-xl bg-primary/20 border border-primary text-primary cursor-pointer flex flex-col gap-2 items-center hover:brightness-110 active:scale-95 transition-all"
                                >
                                    <span className="text-2xl font-bold">%</span>
                                    <span className="font-bold">Porcentaje de Descuento</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, type: 'quantity_offer', targetItemIds: [] }));
                                        setViewMode('create');
                                    }}
                                    className="p-6 rounded-xl bg-success/20 border border-success text-success cursor-pointer flex flex-col gap-2 items-center hover:brightness-110 active:scale-95 transition-all"
                                >
                                    <span className="text-2xl font-bold">NxM</span>
                                    <span className="font-bold">Cantidad (Oferta NxM)</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, type: 'combo', targetItemIds: [] }));
                                        setViewMode('create');
                                    }}
                                    className="p-6 rounded-xl bg-warning/20 border border-warning text-warning cursor-pointer flex flex-col gap-2 items-center hover:brightness-110 active:scale-95 transition-all"
                                >
                                    <span className="text-xl font-bold">CBO</span>
                                    <span className="font-bold">Combo (Precio Fijo)</span>
                                </button>
                            </div>

                            <button
                                onClick={() => { setViewMode('list'); resetForm(); }}
                                className="mt-8 bg-transparent border-none text-text-secondary hover:text-text-main cursor-pointer"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {(viewMode === 'create' || viewMode === 'edit') && (
                    <div className="glass-card">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="m-0">{viewMode === 'create' ? 'Nueva Promoción' : 'Editar Promoción'}</h2>
                                <div className={`inline-block mt-2 px-2.5 py-1 rounded-md text-sm font-bold ${
                                    formData.type === 'percentage'
                                        ? 'bg-primary/20 text-primary'
                                        : formData.type === 'quantity_offer'
                                            ? 'bg-success/20 text-success'
                                            : 'bg-warning/20 text-warning'
                                }`}>
                                    {formData.type === 'percentage' ? 'DESCUENTO POR PORCENTAJE' :
                                        formData.type === 'quantity_offer' ? 'OFERTA POR CANTIDAD (NxM)' : 'COMBO DE PRODUCTOS'}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleExitAttempt(() => { setViewMode('list'); resetForm(); })}
                                    className="btn-back h-[42px] min-w-[140px] text-[0.95rem] font-black"
                                >
                                    ← Volver
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-6 w-full">
                            {/* Común: Nombre */}
                            <div>
                                <label className="block mb-2 text-text-secondary">Nombre de la Promoción</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej. Martes de Hamburguesas"
                                    className="w-full max-w-[600px] p-2.5 bg-input-bg border border-input-border text-text-main rounded-md box-border outline-none focus:border-primary"
                                />
                            </div>

                            {/* Campos específicos del tipo */}
                            {formData.type === 'percentage' && (
                                <div>
                                    <label className="block mb-2 text-text-secondary">Porcentaje de Descuento (%)</label>
                                    <div className="relative w-full max-w-[600px] flex items-center box-border">
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
                                            className="w-full p-2.5 pr-10 bg-input-bg border border-input-border text-text-main rounded-md box-border outline-none focus:border-primary"
                                        />
                                        <span className="absolute right-4 text-text-secondary font-bold">%</span>
                                    </div>
                                </div>
                            )}

                            {formData.type === 'quantity_offer' && (
                                <div className="glass-card bg-success/5 border-dashed flex gap-8 items-center p-6">
                                    <div>
                                        <label className="block mb-2 text-text-secondary">Lleva (M)</label>
                                        <input
                                            type="number"
                                            min="2"
                                            value={formData.take}
                                            onChange={e => setFormData({ ...formData, take: e.target.value })}
                                            placeholder="2"
                                            className="w-[100px] p-3 bg-input-bg border border-input-border text-text-main rounded-md text-xl font-bold outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div className="text-3xl text-text-secondary font-light">/</div>
                                    <div>
                                        <label className="block mb-2 text-text-secondary">Paga (N)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.pay}
                                            onChange={e => setFormData({ ...formData, pay: e.target.value })}
                                            placeholder="1"
                                            className="w-[100px] p-3 bg-input-bg border border-input-border text-text-main rounded-md text-xl font-bold outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div className="text-text-secondary text-sm">
                                        Ej: 2x1, 3x2, etc.
                                    </div>
                                </div>
                            )}

                            {formData.type === 'combo' && (
                                <div>
                                    <label className="block mb-2 text-text-secondary">Precio Fijo del Combo ($)</label>
                                    <div className="relative w-full max-w-[600px] flex items-center box-border">
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.value}
                                            onChange={e => setFormData({ ...formData, value: e.target.value })}
                                            placeholder="Ej. 150"
                                            className="w-full p-2.5 pr-10 bg-input-bg border border-input-border text-text-main rounded-md box-border outline-none focus:border-primary"
                                        />
                                        <span className="absolute right-4 text-text-secondary font-bold">$</span>
                                    </div>
                                    <div className="text-text-secondary text-sm mt-1.5">
                                        Este será el precio total a pagar al llevar todos los productos seleccionados.
                                    </div>
                                </div>
                            )}

                            {/* Común: Artículos objetivo */}
                            <div>
                                <label className="block mb-2 text-text-secondary">
                                    {formData.type === 'percentage' ? "Productos a Descontar" :
                                        formData.type === 'combo' ? "Productos del Combo" : "Productos de la Oferta"}
                                </label>
                                <div className="text-sm text-text-secondary mb-4">
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

                                <div className="glass-card mt-6 max-h-[600px] flex flex-col">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="m-0 text-base text-text-main flex items-center gap-2">
                                            Catálogo de Productos
                                            <span className="text-sm opacity-50 font-normal">({filteredItems.length} items)</span>
                                        </h3>
                                    </div>

                                    <div className="overflow-y-auto pr-2 max-h-[500px]">
                                        {filteredItems.length === 0 ? (
                                            <div className="p-8 text-center text-text-secondary opacity-50">No hay resultados</div>
                                        ) : (
                                            <div className="flex flex-col gap-2">
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
                                                            className={`flex items-center justify-between p-3 px-4 rounded-xl cursor-pointer select-none transition-all duration-200 gap-4 border ${
                                                                isSelected
                                                                    ? 'bg-primary/10 border-primary'
                                                                    : 'bg-card-hover border-card-border'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-3 flex-1">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all border ${
                                                                    isSelected
                                                                        ? 'bg-primary text-white border-primary'
                                                                        : 'bg-white/10 text-text-secondary border-white/20'
                                                                }`}>
                                                                    {formData.type !== 'combo' && isSelected ? '✓' : ''}
                                                                </div>
                                                                <div className="text-left">
                                                                    <div className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-text-main'}`}>
                                                                        {item.name}
                                                                    </div>
                                                                    <div className="text-xs text-text-secondary opacity-60">
                                                                        {item.category} {item.subcategory ? `> ${item.subcategory}` : ''}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                {/* El contador de combo aparece antes del precio para que el precio y puntos nunca se muevan */}
                                                                {formData.type === 'combo' && isSelected && (
                                                                    <div
                                                                        className="flex items-center bg-card rounded-lg border border-card-border"
                                                                        onClick={e => e.stopPropagation()}
                                                                    >
                                                                        <button
                                                                            onClick={() => {
                                                                                const newIds = [...formData.targetItemIds];
                                                                                const idx = newIds.lastIndexOf(item.id);
                                                                                if (idx !== -1) newIds.splice(idx, 1);
                                                                                setFormData({ ...formData, targetItemIds: newIds });
                                                                            }}
                                                                            className="w-7 h-7 bg-transparent border-none outline-none text-text-secondary cursor-pointer text-base font-bold flex items-center justify-center hover:text-text-main"
                                                                        >−</button>
                                                                        <span className="w-6 text-center font-bold text-sm text-text-main">{comboQty}</span>
                                                                        <button
                                                                            onClick={() => {
                                                                                setFormData({ ...formData, targetItemIds: [...formData.targetItemIds, item.id] });
                                                                            }}
                                                                            className="w-7 h-7 bg-transparent border-none outline-none text-text-secondary cursor-pointer text-base font-bold flex items-center justify-center hover:text-text-main"
                                                                        >+</button>
                                                                    </div>
                                                                )}

                                                                <div className="font-bold text-primary">${item.price}</div>

                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedItemForDetails(item); }}
                                                                    className="bg-white/5 border-none text-text-secondary cursor-pointer text-lg w-7 h-7 flex items-center justify-center rounded-md hover:bg-primary/20 hover:text-primary transition-all"
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
                            <div className="glass-card bg-card-hover">
                                <label className="block mb-4 font-bold">Vigencia y Horarios</label>

                                <div className="flex gap-8 mb-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" checked={formData.validityMode === 'permanent'} onChange={() => setFormData({ ...formData, validityMode: 'permanent' })} />
                                        Permanente
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" checked={formData.validityMode === 'date_range'} onChange={() => setFormData({ ...formData, validityMode: 'date_range' })} />
                                        Rango de Fechas
                                    </label>
                                </div>

                                {formData.validityMode === 'date_range' && (
                                    <div className="flex gap-12 mb-6">
                                        <div className="w-[200px]">
                                            <label className="block mb-2 text-xs text-text-secondary">Fecha Inicio</label>
                                            <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full p-2.5 rounded-md border border-input-border bg-input-bg text-text-main box-border outline-none focus:border-primary" />
                                        </div>
                                        <div className="w-[200px]">
                                            <label className="block mb-2 text-xs text-text-secondary">Fecha Fin</label>
                                            <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full p-2.5 rounded-md border border-input-border bg-input-bg text-text-main box-border outline-none focus:border-primary" />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block mb-2 text-xs">Días de la Semana</label>
                                    <div className="flex gap-1 flex-wrap">
                                        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day, index) => (
                                            <label key={index} className={`px-3 py-2 rounded-lg border text-sm font-bold cursor-pointer transition-all ${
                                                formData.daysOfWeek.includes(index)
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'bg-white/5 text-text-secondary border-card-border hover:bg-white/10'
                                            }`}>
                                                <input type="checkbox" checked={formData.daysOfWeek.includes(index)} onChange={() => {
                                                    const newDays = formData.daysOfWeek.includes(index) ? formData.daysOfWeek.filter(d => d !== index) : [...formData.daysOfWeek, index].sort();
                                                    setFormData({ ...formData, daysOfWeek: newDays });
                                                }} className="hidden" />
                                                {day}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Acciones */}
                            <div className="flex gap-4 mt-4">
                                <button
                                    onClick={handleSave}
                                    className={`flex-1 p-3.5 rounded-xl font-bold cursor-pointer text-lg text-white border-none transition-all shadow-md ${
                                        viewMode === 'create'
                                            ? 'bg-primary hover:brightness-110'
                                            : (isConfirmingEdit ? 'bg-warning hover:brightness-110' : 'bg-success hover:brightness-110')
                                    }`}
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
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-md"
                    onClick={() => setSelectedItemForDetails(null)}
                >
                    <div
                        className="glass-card max-w-[min(92vw,28rem)] w-[90%] p-[clamp(1.5rem,4vw,2rem)] text-center relative border border-primary/50 box-border"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedItemForDetails(null)}
                            className="absolute top-4 right-4 bg-transparent border-none text-text-secondary hover:text-text-main cursor-pointer text-2xl"
                        >
                            ✕
                        </button>

                        <div className="w-full aspect-video rounded-xl bg-card-hover mb-6 flex items-center justify-center overflow-hidden border border-card-border">
                            {selectedItemForDetails.image ? (
                                <img
                                    src={selectedItemForDetails.image}
                                    alt={selectedItemForDetails.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-text-secondary opacity-50 flex flex-col items-center gap-2.5">
                                    <span className="text-5xl">🖼️</span>
                                    <span>No hay imagen disponible</span>
                                </div>
                            )}
                        </div>

                        <h2 className="m-0 mb-2 text-text-main">{selectedItemForDetails.name}</h2>
                        <div className="text-primary font-bold text-xl mb-4">
                            ${selectedItemForDetails.price}
                        </div>

                        <div className="text-left bg-white/5 p-4 rounded-lg mb-6 max-h-[150px] overflow-y-auto">
                            <label className="block text-xs text-text-secondary mb-1 uppercase">Descripción</label>
                            <p className="m-0 text-text-main leading-relaxed text-sm">
                                {selectedItemForDetails.description || "Sin descripción disponible para este producto."}
                            </p>
                        </div>

                        <button
                            onClick={() => setSelectedItemForDetails(null)}
                            className="w-full p-3 rounded-lg bg-primary text-white border-none font-bold cursor-pointer hover:brightness-110 active:scale-98 transition-all"
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
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[10000] p-4">
                    <div className="glass-card max-w-[min(92vw,30rem)] w-full p-[clamp(1.75rem,4vw,2.5rem)] text-center flex flex-col items-center gap-6 shadow-2xl box-border">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl bg-white/5 border-2 border-dashed border-white/30 mb-2 shadow-sm">
                            📢
                        </div>

                        <h2 className="text-3xl font-extrabold m-0">
                            Promoción en Curso
                        </h2>

                        <p className="text-base opacity-80 leading-relaxed m-0 max-w-[min(90%,22rem)]">
                            Tienes cambios sin guardar en esta promoción. Si sales ahora, se perderán estos cambios. ¿Estás seguro de que deseas salir?
                        </p>

                        <div className="flex gap-4 w-full mt-4">
                            <button
                                onClick={() => setShowExitConfirm(null)}
                                className="flex-1 p-4 rounded-xl border border-white/10 bg-white/5 text-white font-bold cursor-pointer hover:bg-white/10 active:scale-98 transition-all"
                            >
                                Seguir Editando
                            </button>
                            <button
                                onClick={() => {
                                    showExitConfirm.onConfirm();
                                    setShowExitConfirm(null);
                                }}
                                className="flex-1 p-4 rounded-xl border-none bg-danger text-white font-bold cursor-pointer shadow-lg shadow-danger/20 hover:-translate-y-0.5 active:scale-98 transition-all"
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
