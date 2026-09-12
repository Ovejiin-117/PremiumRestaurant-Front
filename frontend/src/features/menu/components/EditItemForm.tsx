import React from 'react';
import { createPortal } from 'react-dom';
import type { ItemType, MenuItem } from '../../../types';
import CustomSelect from '../../../components/ui/CustomSelect';

interface EditItemFormProps {
    item: MenuItem;
    onSave: (
        name: string,
        price: string,
        type: ItemType,
        category: string,
        subcategory?: string,
        section?: string,
        description?: string,
        image?: string
    ) => void;
    onCancel: () => void;
    categories: string[];
    subCategories: Record<string, string[]>;
    sections: Record<string, string[]>;
}

const TYPE_OPTIONS = [
    { value: 'alimento', label: 'Alimento' },
    { value: 'bebida', label: 'Bebida' },
    { value: 'objeto', label: 'Objeto' }
];

const EditItemForm: React.FC<EditItemFormProps> = ({
    item, onSave, onCancel,
    categories, subCategories, sections
}) => {
    const [localName, setLocalName] = React.useState(item.name);
    const [localPrice, setLocalPrice] = React.useState(String(item.price));
    const [localDesc, setLocalDesc] = React.useState(item.description || '');
    const [localImage, setLocalImage] = React.useState(item.image || '');
    const [localType, setLocalType] = React.useState<ItemType>(item.type || 'alimento');

    // Selección taxonómica
    const [selectedCat, setSelectedCat] = React.useState(item.category);
    const [selectedSub, setSelectedSub] = React.useState(item.subcategory || '');
    const [selectedSec, setSelectedSec] = React.useState(item.section || '');

    const [showConfirmDiscard, setShowConfirmDiscard] = React.useState(false);

    const hasChanges =
        localName !== item.name ||
        localPrice !== String(item.price) ||
        localDesc !== (item.description || '') ||
        localImage !== (item.image || '') ||
        localType !== (item.type || 'alimento') ||
        selectedCat !== item.category ||
        selectedSub !== (item.subcategory || '') ||
        selectedSec !== (item.section || '');

    // Filtrar opciones disponibles
    const availableSubs = selectedCat ? (subCategories[selectedCat] || []) : [];
    const subKey = selectedCat && selectedSub ? `${selectedCat}::${selectedSub}` : '';
    const availableSecs = subKey ? (sections[subKey] || []) : [];

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '') {
            setLocalPrice('');
            return;
        }
        const num = Number(val);
        if (num < 0 || num > 9999) return;
        setLocalPrice(val);
    };

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!localName.trim() || !localPrice || !selectedCat) return;
        onSave(
            localName,
            localPrice,
            localType,
            selectedCat,
            selectedSub || undefined,
            selectedSec || undefined,
            localDesc || undefined,
            localImage || undefined
        );
    };

    const handleCancelClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasChanges) {
            setShowConfirmDiscard(true);
        } else {
            onCancel();
        }
    };

    const selectStyle: React.CSSProperties = {
        borderRadius: '0.75rem',
        background: 'rgba(0, 0, 0, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        justifyContent: 'space-between',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        minWidth: '0'
    };

    const modalUI = (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(2, 6, 23, 0.95)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 999999,
                padding: '1rem'
            }}
            onClick={handleCancelClick}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '520px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '1.25rem',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                    animation: 'modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                    cursor: 'default'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ textAlign: 'left' }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: '1.5rem',
                        fontWeight: '800',
                        color: 'white',
                        letterSpacing: '-0.02em'
                    }}>Editar Producto</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                        Modifica los detalles del producto existente
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Cuadrícula de selección taxonómica */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--primary-color)', textTransform: 'uppercase' }}>Categoría *</label>
                            <CustomSelect
                                value={selectedCat}
                                onChange={(val) => { setSelectedCat(val); setSelectedSub(''); setSelectedSec(''); }}
                                options={categories.map(c => ({ value: c, label: c }))}
                                placeholder="Elegir..."
                                width="100%"
                                height="2.8rem"
                                customStyle={selectStyle}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--primary-color)', textTransform: 'uppercase' }}>Subcategoría</label>
                            <CustomSelect
                                value={selectedSub}
                                onChange={(val) => { setSelectedSub(val); setSelectedSec(''); }}
                                options={[
                                    { value: '', label: 'Ninguna' },
                                    ...availableSubs.map(s => ({ value: s, label: s }))
                                ]}
                                placeholder="Ninguna"
                                width="100%"
                                height="2.8rem"
                                disabled={!availableSubs.length}
                                customStyle={selectStyle}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--primary-color)', textTransform: 'uppercase' }}>Sección</label>
                            <CustomSelect
                                value={selectedSec}
                                onChange={setSelectedSec}
                                options={[
                                    { value: '', label: 'Ninguna' },
                                    ...availableSecs.map(s => ({ value: s, label: s }))
                                ]}
                                placeholder="Ninguna"
                                width="100%"
                                height="2.8rem"
                                disabled={!availableSecs.length}
                                customStyle={selectStyle}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.04rem' }}>Nombre del Producto</label>
                        <input
                            placeholder="Ej. Burguesa Wagyu"
                            value={localName}
                            onChange={e => setLocalName(e.target.value)}
                            style={{
                                padding: '0.85rem 1rem',
                                background: 'rgba(0, 0, 0, 0.35)',
                                color: 'white',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '0.75rem',
                                fontSize: '1rem',
                                width: '100%',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.04rem' }}>Precio Base</label>
                            <input
                                type="number"
                                placeholder="$ 0.00"
                                value={localPrice}
                                onChange={handlePriceChange}
                                style={{
                                    padding: '0.85rem 1rem',
                                    background: 'rgba(0, 0, 0, 0.35)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '0.75rem',
                                    fontSize: '1rem',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.04rem' }}>Tipo</label>
                            <CustomSelect
                                value={localType}
                                onChange={(val) => setLocalType(val as ItemType)}
                                options={TYPE_OPTIONS}
                                width="100%"
                                height="2.8rem"
                                customStyle={selectStyle}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.04rem' }}>Descripción (Opcional)</label>
                        <textarea
                            placeholder="Detalles del producto..."
                            value={localDesc}
                            onChange={e => setLocalDesc(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.85rem 1rem',
                                background: 'rgba(0, 0, 0, 0.35)',
                                color: 'white',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '0.75rem',
                                minHeight: '80px',
                                resize: 'none',
                                fontSize: '0.95rem',
                                lineHeight: '1.4',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.04rem' }}>Imagen URL (Opcional)</label>
                        <input
                            placeholder="https://..."
                            value={localImage}
                            onChange={e => setLocalImage(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.85rem 1rem',
                                background: 'rgba(0, 0, 0, 0.35)',
                                color: 'white',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '0.75rem',
                                fontSize: '0.9rem',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'flex-end',
                    marginTop: '0.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid rgba(255,255,255,0.08)'
                }}>
                    <button
                        onClick={handleCancelClick}
                        style={{
                            padding: '0.8rem 1.6rem',
                            borderRadius: '0.75rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            fontWeight: '700',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            minWidth: '100px'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!localName.trim() || !localPrice || !selectedCat}
                        style={{
                            padding: '0.8rem 2.2rem',
                            borderRadius: '0.75rem',
                            background: 'var(--primary-color)',
                            color: 'white',
                            border: 'none',
                            fontWeight: '700',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            opacity: (!localName.trim() || !localPrice || !selectedCat) ? 0.5 : 1,
                            boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.4)'
                        }}
                    >
                        Guardar Cambios
                    </button>
                </div>
            </div>

            {showConfirmDiscard && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={e => e.stopPropagation()}>
                    <div className="glass-card" style={{
                        maxWidth: '450px', width: '90%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '2rem', padding: '3rem'
                    }}>
                        <div style={{
                            width: '4rem', height: '4rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '2em', border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}>⚠️</div>
                        <div>
                            <h2 style={{ margin: '0 0 0.75rem 0', fontSize: '1.5em', fontWeight: 'bold', color: 'white' }}>¿Descartar cambios?</h2>
                            <p style={{ margin: 0, opacity: 0.7, lineHeight: '1.6', fontSize: '1.1em', color: 'white' }}>
                                Tienes modificaciones sin guardar en este producto. Si sales ahora, se perderán estos cambios. ¿Estás seguro de que deseas salir?
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setShowConfirmDiscard(false)}
                                style={{
                                    flex: 1, padding: '1rem', borderRadius: '0.75rem', background: 'var(--card-hover-bg)', color: 'var(--text-color)',
                                    border: '1px solid var(--card-border)', fontWeight: 'bold', fontSize: '1.1em', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                Seguir Editando
                            </button>
                            <button
                                onClick={onCancel}
                                style={{
                                    flex: 1, padding: '1rem', borderRadius: '0.75rem', background: 'var(--danger-color)', color: 'white',
                                    border: 'none', fontWeight: 'bold', fontSize: '1.1em', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px var(--danger-color-alpha-20)'
                                }}
                            >
                                Descartar y Salir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return createPortal(modalUI, document.body);
};

export default EditItemForm;
