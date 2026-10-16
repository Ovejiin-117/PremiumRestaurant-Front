import React from 'react';
import { createPortal } from 'react-dom';
import type { ItemType, MenuItem } from '../../../types';
import CustomSelect from '../../../components/ui/CustomSelect';
import ConfirmDiscardModal from '../../../components/ui/ConfirmDiscardModal';

export interface MenuItemModalProps {
    item?: MenuItem; // Si se provee, modo Edición; si no, modo Creación
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
    initialCategory?: string;
    initialSubcategory?: string;
    initialSection?: string;
    title?: string;
}

const TYPE_OPTIONS = [
    { value: 'alimento', label: 'Alimento' },
    { value: 'bebida', label: 'Bebida' },
    { value: 'objeto', label: 'Objeto' }
];

export const MenuItemModal: React.FC<MenuItemModalProps> = ({
    item,
    onSave,
    onCancel,
    categories,
    subCategories,
    sections,
    initialCategory = '',
    initialSubcategory = '',
    initialSection = '',
    title
}) => {
    const isEdit = !!item;
    const modalTitle = title || (isEdit ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO');

    // Valores iniciales
    const initCat = item ? item.category : initialCategory;
    const initSub = item ? (item.subcategory || '') : initialSubcategory;
    const initSec = item ? (item.section || '') : initialSection;

    const [localName, setLocalName] = React.useState(item ? item.name : '');
    const [localPrice, setLocalPrice] = React.useState(item ? String(item.price) : '');
    const [localDesc, setLocalDesc] = React.useState(item ? (item.description || '') : '');
    const [localImage, setLocalImage] = React.useState(item ? (item.image || '') : '');
    const [localType, setLocalType] = React.useState<ItemType>(item ? (item.type || 'alimento') : 'alimento');

    // Selección taxonómica
    const [selectedCat, setSelectedCat] = React.useState(initCat);
    const [selectedSub, setSelectedSub] = React.useState(initSub);
    const [selectedSec, setSelectedSec] = React.useState(initSec);

    const [showConfirmDiscard, setShowConfirmDiscard] = React.useState(false);

    const hasChanges = isEdit
        ? (
            localName !== item.name ||
            localPrice !== String(item.price) ||
            localDesc !== (item.description || '') ||
            localImage !== (item.image || '') ||
            localType !== (item.type || 'alimento') ||
            selectedCat !== item.category ||
            selectedSub !== (item.subcategory || '') ||
            selectedSec !== (item.section || '')
        )
        : (
            localName !== '' ||
            localPrice !== '' ||
            localDesc !== '' ||
            localImage !== '' ||
            localType !== 'alimento' ||
            selectedCat !== initialCategory ||
            selectedSub !== initialSubcategory ||
            selectedSec !== initialSection
        );

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
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '1.25rem',
                    width: '100%',
                    maxWidth: '550px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '90vh'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Cabecera */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: '800',
                        letterSpacing: '0.05em',
                        color: 'white',
                        textTransform: 'uppercase'
                    }}>
                        {modalTitle}
                    </h3>
                    <button
                        onClick={handleCancelClick}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Formulario scrolleable */}
                <div style={{
                    padding: '1.5rem',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem'
                }}>
                    {/* Nombre del Producto */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Nombre del Producto *
                        </label>
                        <input
                            type="text"
                            value={localName}
                            onChange={e => setLocalName(e.target.value)}
                            placeholder="Ej. Hamburguesa Doble Clásica"
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: '0.75rem',
                                background: 'rgba(0, 0, 0, 0.35)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                fontSize: '0.9rem',
                                boxSizing: 'border-box',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Precio y Tipo */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Precio ($) *
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="9999"
                                step="any"
                                value={localPrice}
                                onChange={handlePriceChange}
                                placeholder="0.00"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '0.75rem',
                                    background: 'rgba(0, 0, 0, 0.35)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    boxSizing: 'border-box',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Tipo
                            </label>
                            <CustomSelect
                                value={localType}
                                onChange={val => setLocalType(val as ItemType)}
                                options={TYPE_OPTIONS}
                                width="100%"
                                height="2.8em"
                                customStyle={selectStyle}
                            />
                        </div>
                    </div>

                    {/* Ubicación / Categorización */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '0.85rem',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.85rem'
                    }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Ubicación en el Menú
                        </div>

                        {/* Categoría */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#64748b', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                                Categoría Principal *
                            </label>
                            <CustomSelect
                                value={selectedCat}
                                onChange={cat => {
                                    setSelectedCat(cat);
                                    setSelectedSub('');
                                    setSelectedSec('');
                                }}
                                options={categories.map(c => ({ value: c, label: c }))}
                                placeholder="-- Seleccionar Categoría --"
                                width="100%"
                                height="2.8em"
                                customStyle={selectStyle}
                            />
                        </div>

                        {/* Subcategoría */}
                        {availableSubs.length > 0 && (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#64748b', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                                    Subcategoría (Opcional)
                                </label>
                                <CustomSelect
                                    value={selectedSub}
                                    onChange={sub => {
                                        setSelectedSub(sub);
                                        setSelectedSec('');
                                    }}
                                    options={[
                                        { value: '', label: '-- Ninguna --' },
                                        ...availableSubs.map(s => ({ value: s, label: s }))
                                    ]}
                                    width="100%"
                                    height="2.8em"
                                    customStyle={selectStyle}
                                />
                            </div>
                        )}

                        {/* Sección */}
                        {availableSecs.length > 0 && selectedSub && (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#64748b', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                                    Sección (Opcional)
                                </label>
                                <CustomSelect
                                    value={selectedSec}
                                    onChange={sec => setSelectedSec(sec)}
                                    options={[
                                        { value: '', label: '-- Ninguna --' },
                                        ...availableSecs.map(s => ({ value: s, label: s }))
                                    ]}
                                    width="100%"
                                    height="2.8em"
                                    customStyle={selectStyle}
                                />
                            </div>
                        )}
                    </div>

                    {/* URL de Imagen */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            URL de Imagen (Opcional)
                        </label>
                        <input
                            type="text"
                            value={localImage}
                            onChange={e => setLocalImage(e.target.value)}
                            placeholder="https://ejemplo.com/imagen.jpg"
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: '0.75rem',
                                background: 'rgba(0, 0, 0, 0.35)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                fontSize: '0.9rem',
                                boxSizing: 'border-box',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Descripción */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Descripción (Opcional)
                        </label>
                        <textarea
                            value={localDesc}
                            onChange={e => setLocalDesc(e.target.value)}
                            placeholder="Detalles de ingredientes, porciones o preparación..."
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: '0.75rem',
                                background: 'rgba(0, 0, 0, 0.35)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                fontSize: '0.9rem',
                                boxSizing: 'border-box',
                                outline: 'none',
                                resize: 'none'
                            }}
                        />
                    </div>
                </div>

                {/* Botones de acción */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem'
                }}>
                    <button
                        onClick={handleCancelClick}
                        style={{
                            padding: '0.65rem 1.25rem',
                            borderRadius: '0.65rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#cbd5e1',
                            fontWeight: '700',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!localName.trim() || !localPrice || !selectedCat}
                        style={{
                            padding: '0.65rem 1.5rem',
                            borderRadius: '0.65rem',
                            background: (!localName.trim() || !localPrice || !selectedCat)
                                ? 'rgba(255, 255, 255, 0.1)'
                                : 'var(--primary-color)',
                            border: 'none',
                            color: 'white',
                            fontWeight: '800',
                            fontSize: '0.85rem',
                            cursor: (!localName.trim() || !localPrice || !selectedCat) ? 'not-allowed' : 'pointer',
                            opacity: (!localName.trim() || !localPrice || !selectedCat) ? 0.5 : 1
                        }}
                    >
                        {isEdit ? 'GUARDAR CAMBIOS' : 'GUARDAR PRODUCTO'}
                    </button>
                </div>
            </div>

            {showConfirmDiscard && (
                <ConfirmDiscardModal
                    isOpen={showConfirmDiscard}
                    onClose={() => setShowConfirmDiscard(false)}
                    onDiscard={() => {
                        setShowConfirmDiscard(false);
                        onCancel();
                    }}
                />
            )}
        </div>
    );

    return createPortal(modalUI, document.body);
};

export default MenuItemModal;
