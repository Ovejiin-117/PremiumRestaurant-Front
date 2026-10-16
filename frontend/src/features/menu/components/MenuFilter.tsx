import React, { useState } from 'react';
import CustomSelect from '../../../components/ui/CustomSelect';

interface MenuFilterProps {
    onFilterChange: (filters: {
        name: string;
        minPrice: string;
        maxPrice: string;
        category: string;
        subcategory: string;
        section: string;
        type: string;
    }) => void;
    categories: string[];
    subcategories: Record<string, string[]>;
    sections: Record<string, string[]>;
    onToggleAll: () => void;
    globalCollapseState: 'expanded' | 'collapsed' | null;
    hideToggle?: boolean;
}

const MenuFilter: React.FC<MenuFilterProps> = ({
    onFilterChange,
    categories,
    subcategories,
    sections,
    onToggleAll,
    globalCollapseState,
    hideToggle = false
}) => {
    const [showFilters, setShowFilters] = useState(false);
    const [pulse, setPulse] = useState(false);
    const [name, setName] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [category, setCategory] = useState("");
    const [subcategory, setSubcategory] = useState("");
    const [section, setSection] = useState("");
    const [itemType, setItemType] = useState("");

    const handleFilterChange = (updates: Record<string, string>) => {
        const newFilters = {
            name,
            minPrice,
            maxPrice,
            category,
            subcategory,
            section,
            type: itemType,
            ...updates
        };
        onFilterChange(newFilters);
    };

    const clearFilters = () => {
        setName("");
        setMinPrice("");
        setMaxPrice("");
        setCategory("");
        setSubcategory("");
        setSection("");
        setItemType("");
        onFilterChange({
            name: "",
            minPrice: "",
            maxPrice: "",
            category: "",
            subcategory: "",
            section: "",
            type: ""
        });
    };

    const hasActiveFilters = name || minPrice || maxPrice || category || subcategory || section || itemType;

    return (
        <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
                        border: '1px solid var(--card-border)', background: showFilters ? 'var(--primary-color)' : 'var(--card-hover-bg)',
                        color: showFilters ? 'white' : 'var(--text-color)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9em'
                    }}
                >
                    <span style={{
                        fontSize: '12px', transition: 'transform 0.3s ease', transform: showFilters ? 'rotate(0deg)' : 'rotate(-90deg)',
                        display: 'inline-block', lineHeight: '1'
                    }}>
                        ▼
                    </span>
                    Filtrar Menú
                </button>

                {!hideToggle && (
                    <button
                        onClick={() => {
                            onToggleAll();
                            if (globalCollapseState === 'collapsed') {
                                setPulse(true);
                                setTimeout(() => setPulse(false), 500);
                            }
                        }}
                        className={pulse ? 'pulse' : ''}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
                            border: '1px solid var(--card-border)', background: (globalCollapseState === 'expanded') ? 'var(--primary-color)' : 'var(--card-hover-bg)',
                            color: (globalCollapseState === 'expanded') ? 'white' : 'var(--text-color)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9em'
                        }}
                    >
                        <span style={{
                            fontSize: '12px', transition: 'transform 0.3s ease', transform: globalCollapseState === 'collapsed' ? 'rotate(-90deg)' : 'rotate(0deg)',
                            display: 'inline-block', lineHeight: '1'
                        }}>
                            ▼
                        </span>
                        {(globalCollapseState === 'collapsed') ? 'Abrir Todo' : 'Cerrar Todo'}
                    </button>
                )}
            </div>

            {hasActiveFilters && !showFilters && (
                <div style={{ fontSize: '0.75em', marginTop: '1rem', color: 'var(--primary-color)', background: 'var(--primary-color-alpha-20)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontWeight: 'bold' }}>
                    Filtros activos
                </div>
            )}


            {
                showFilters && (
                    <div className="glass-card" style={{
                        marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-end', padding: '1.25rem'
                    }}>
                        {/* Filtro por nombre */}
                        <div style={{ flex: '2 1 280px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label className="form-label" style={{ fontSize: '0.7em', fontWeight: 'bold', color: 'var(--text-secondary)' }}>NOMBRE</label>
                            <input
                                type="text"
                                placeholder="Buscar producto..."
                                value={name}
                                onChange={e => { setName(e.target.value); handleFilterChange({ name: e.target.value }); }}
                                style={{ padding: '0.75em', borderRadius: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-color)', fontSize: '0.95em', width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>

                        {/* Filtro por precio */}
                        <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label className="form-label" style={{ fontSize: '0.7em' }}>PRECIO ($)</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={minPrice}
                                    onChange={e => { setMinPrice(e.target.value); handleFilterChange({ minPrice: e.target.value }); }}
                                    style={{ flex: 1, padding: '0.75em', borderRadius: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-color)', fontSize: '0.95em', minWidth: '0' }}
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={maxPrice}
                                    onChange={e => { setMaxPrice(e.target.value); handleFilterChange({ maxPrice: e.target.value }); }}
                                    style={{ flex: 1, padding: '0.75em', borderRadius: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-color)', fontSize: '0.95em', minWidth: '0' }}
                                />
                            </div>
                        </div>

                        {/* Filtro por tipo de producto */}
                        <div style={{ flex: '1 1 180px' }}>
                            <CustomSelect
                                label="Tipo de Item"
                                value={itemType}
                                onChange={(val: string) => {
                                    setItemType(val);
                                    handleFilterChange({ type: val });
                                }}
                                options={[
                                    { value: "", label: "Todos" },
                                    { value: "alimento", label: "Alimentos" },
                                    { value: "bebida", label: "Bebidas" },
                                    { value: "objeto", label: "Objetos" }
                                ]}
                                width="100%"
                            />
                        </div>

                        {/* Filtro por categoría */}
                        <div style={{ flex: '1 1 180px' }}>
                            <CustomSelect
                                label="Categoría"
                                value={category}
                                onChange={(val: string) => {
                                    setCategory(val);
                                    setSubcategory("");
                                    setSection("");
                                    handleFilterChange({ category: val, subcategory: "", section: "" });
                                }}
                                options={[
                                    { value: "", label: "Todas" },
                                    ...categories.map(cat => ({ value: cat, label: cat }))
                                ]}
                                width="100%"
                            />
                        </div>

                        {/* Filtro por subcategoría */}
                        <div style={{ flex: '1 1 180px' }}>
                            <CustomSelect
                                label="Subcategoría"
                                value={subcategory}
                                onChange={(val: string) => {
                                    setSubcategory(val);
                                    setSection("");
                                    handleFilterChange({ subcategory: val, section: "" });
                                }}
                                options={[
                                    { value: "", label: "Todas" },
                                    ...(category ? subcategories[category]?.map(sub => ({ value: sub, label: sub })) || [] : [])
                                ]}
                                disabled={!category}
                                width="100%"
                            />
                        </div>

                        {/* Filtro por sección */}
                        <div style={{ flex: '1 1 180px' }}>
                            <CustomSelect
                                label="Sección"
                                value={section}
                                onChange={(val: string) => {
                                    setSection(val);
                                    handleFilterChange({ section: val });
                                }}
                                options={[
                                    { value: "", label: "Todas" },
                                    ...(subcategory ? sections[`${category}::${subcategory}`]?.map(sec => ({ value: sec, label: sec })) || [] : [])
                                ]}
                                disabled={!subcategory}
                                width="100%"
                            />
                        </div>


                        {/* Botón limpiar */}
                        <div style={{ flex: '0 0 100px' }}>
                            <button
                                onClick={clearFilters}
                                style={{ width: '100%', padding: '0.75em', borderRadius: '0.5rem', border: 'none', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                                LIMPIAR
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default MenuFilter;
