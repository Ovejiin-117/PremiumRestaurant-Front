import { useState, useMemo, useCallback } from 'react';
import MenuFilter from '../../menu/components/MenuFilter';
import type { MenuItem } from '../../../types';
import type { PromotionFormData } from '../types';
import { DAY_NAMES } from '../utils/promotionUtils';

interface Props {
    viewMode: 'create' | 'edit';
    formData: PromotionFormData;
    setFormData: React.Dispatch<React.SetStateAction<PromotionFormData>>;
    menu: MenuItem[];
    categories: string[];
    subCategories: Record<string, string[]>;
    sections: Record<string, string[]>;
    isConfirmingEdit: boolean;
    onSave: () => void;
    onBack: () => void;
    onOpenItemDetails: (item: MenuItem) => void;
}

export default function PromotionForm({
    viewMode,
    formData,
    setFormData,
    menu,
    categories,
    subCategories,
    sections,
    isConfirmingEdit,
    onSave,
    onBack,
    onOpenItemDetails
}: Props) {
    const [filters, setFilters] = useState({
        name: "",
        minPrice: "",
        maxPrice: "",
        category: "",
        subcategory: "",
        section: ""
    });

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

    return (
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
                        onClick={onBack}
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
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                                        setFormData(prev => ({ ...prev, value: "" }));
                                        return;
                                    }
                                    const num = Number(val);
                                    if (num > 100) setFormData(prev => ({ ...prev, value: "100" }));
                                    else if (num < 0) setFormData(prev => ({ ...prev, value: "1" }));
                                    else setFormData(prev => ({ ...prev, value: val }));
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
                                onChange={e => setFormData(prev => ({ ...prev, take: e.target.value }))}
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
                                onChange={e => setFormData(prev => ({ ...prev, pay: e.target.value }))}
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
                                onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
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
                                                            setFormData(prev => ({ ...prev, targetItemIds: prev.targetItemIds.filter(id => id !== item.id) }));
                                                        } else {
                                                            setFormData(prev => ({ ...prev, targetItemIds: [...prev.targetItemIds, item.id] }));
                                                        }
                                                        return;
                                                    }
                                                    let newIds = [...formData.targetItemIds];
                                                    if (isSelected) {
                                                        newIds = newIds.filter(id => id !== item.id);
                                                    } else {
                                                        newIds.push(item.id);
                                                    }
                                                    setFormData(prev => ({ ...prev, targetItemIds: newIds }));
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
                                                                    setFormData(prev => ({ ...prev, targetItemIds: newIds }));
                                                                }}
                                                                className="w-7 h-7 bg-transparent border-none outline-none text-text-secondary cursor-pointer text-base font-bold flex items-center justify-center hover:text-text-main"
                                                            >−</button>
                                                            <span className="w-6 text-center font-bold text-sm text-text-main">{comboQty}</span>
                                                            <button
                                                                onClick={() => {
                                                                    setFormData(prev => ({ ...prev, targetItemIds: [...prev.targetItemIds, item.id] }));
                                                                }}
                                                                className="w-7 h-7 bg-transparent border-none outline-none text-text-secondary cursor-pointer text-base font-bold flex items-center justify-center hover:text-text-main"
                                                            >+</button>
                                                        </div>
                                                    )}

                                                    <div className="font-bold text-primary">${item.price}</div>

                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onOpenItemDetails(item); }}
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
                            <input
                                type="radio"
                                checked={formData.validityMode === 'permanent'}
                                onChange={() => setFormData(prev => ({ ...prev, validityMode: 'permanent' }))}
                            />
                            Permanente
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                checked={formData.validityMode === 'date_range'}
                                onChange={() => setFormData(prev => ({ ...prev, validityMode: 'date_range' }))}
                            />
                            Rango de Fechas
                        </label>
                    </div>

                    {formData.validityMode === 'date_range' && (
                        <div className="flex gap-12 mb-6">
                            <div className="w-[200px]">
                                <label className="block mb-2 text-xs text-text-secondary">Fecha Inicio</label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="w-full p-2.5 rounded-md border border-input-border bg-input-bg text-text-main box-border outline-none focus:border-primary"
                                />
                            </div>
                            <div className="w-[200px]">
                                <label className="block mb-2 text-xs text-text-secondary">Fecha Fin</label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="w-full p-2.5 rounded-md border border-input-border bg-input-bg text-text-main box-border outline-none focus:border-primary"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block mb-2 text-xs">Días de la Semana</label>
                        <div className="flex gap-1 flex-wrap">
                            {DAY_NAMES.map((day, index) => (
                                <label
                                    key={index}
                                    className={`px-3 py-2 rounded-lg border text-sm font-bold cursor-pointer transition-all ${
                                        formData.daysOfWeek.includes(index)
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white/5 text-text-secondary border-card-border hover:bg-white/10'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.daysOfWeek.includes(index)}
                                        onChange={() => {
                                            const newDays = formData.daysOfWeek.includes(index)
                                                ? formData.daysOfWeek.filter(d => d !== index)
                                                : [...formData.daysOfWeek, index].sort();
                                            setFormData(prev => ({ ...prev, daysOfWeek: newDays }));
                                        }}
                                        className="hidden"
                                    />
                                    {day}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-4 mt-4">
                    <button
                        onClick={onSave}
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
    );
}
