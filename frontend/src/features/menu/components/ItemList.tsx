import React from 'react';
import type { MenuItem } from '../../../types';
import ConfirmButton from '../../../components/ui/ConfirmButton';
import { getPromotionalPrice } from '../../../utils/promotionUtils';

interface ItemListProps {
    items: MenuItem[];
    cat: string;
    canEdit: boolean;
    showOrderingUI: boolean;
    deleteItemMode: Record<string, boolean>;
    editItemMode: Record<string, boolean>;
    confirmDeleteId: string | null;
    setConfirmDeleteId: (id: string | null) => void;
    handleDeleteItem: (id: string) => void;
    startEdit: (item: MenuItem) => void;
    handleAddToOrder: (item: MenuItem) => void;
    variant?: 'list' | 'grid' | 'detailed-list';
    isShiftOpen: boolean;
    showBreadcrumbs?: boolean;
    promotions: import('../../../types').Promotion[];
    onShowDetails?: (item: MenuItem) => void;
    showImages?: boolean;
    setSelectedItemForMenu: (item: MenuItem | null) => void;
}

const ItemList: React.FC<ItemListProps> = ({
    items, cat, canEdit, showOrderingUI,
    deleteItemMode, editItemMode, confirmDeleteId, setConfirmDeleteId,
    handleDeleteItem, startEdit,
    handleAddToOrder,
    variant = 'list', isShiftOpen, showBreadcrumbs = false,
    promotions, onShowDetails, showImages = true,
    setSelectedItemForMenu
}) => {
    const isGrid = variant === 'grid';
    const isDetailedList = variant === 'detailed-list';

    return (
        <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: isGrid ? 'grid' : 'flex',
            flexDirection: 'column',
            gridTemplateColumns: isGrid ? 'repeat(auto-fill, minmax(140px, 1fr))' : 'none',
            gap: isGrid ? '1rem' : '0.5rem'
        }}>
            {items.map(item => (
                <li
                    key={item.id}
                    style={{
                        display: 'flex',
                        flexDirection: isGrid ? 'column' : 'row',
                        justifyContent: isGrid ? 'center' : 'space-between',
                        alignItems: 'center',
                        background: 'var(--card-hover-bg)',
                        padding: (isGrid || isDetailedList) ? '1rem' : '0.6rem 0.85rem',
                        borderRadius: (isDetailedList) ? '10px' : '0.5rem',
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: (showOrderingUI && isShiftOpen) ? 'pointer' : (showOrderingUI ? 'not-allowed' : 'default'),
                        opacity: showOrderingUI && (!item.available || !isShiftOpen) ? 0.5 : 1,
                        transition: 'all 0.2s',
                        aspectRatio: isGrid ? '1/1' : 'auto',
                        textAlign: isGrid ? 'center' : 'left',
                        border: '1px solid var(--card-border)',
                        gap: isDetailedList ? '1rem' : undefined
                    }}
                    onClick={showOrderingUI ? () => handleAddToOrder(item) : undefined}
                >
                    {/* SUPERPOSICIÓN DE ELIMINACIÓN DE PRODUCTO */}
                    {deleteItemMode[cat] && canEdit && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ConfirmButton
                                id={item.id}
                                activeId={confirmDeleteId}
                                setActiveId={setConfirmDeleteId}
                                onAction={() => handleDeleteItem(item.id)}
                                label="ELIMINAR"
                            />
                        </div>
                    )}

                    {/* SUPERPOSICIÓN DE EDICIÓN DE PRODUCTO */}
                    {editItemMode[cat] && canEdit && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ConfirmButton
                                id={'edit:' + item.id}
                                activeId={confirmDeleteId}
                                setActiveId={setConfirmDeleteId}
                                onAction={() => startEdit(item)}
                                label="EDITAR"
                                color="var(--primary-color)"
                                confirmColor="var(--primary-color)"
                            />
                        </div>
                    )}

                    {isDetailedList ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1 }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '8px',
                                background: 'rgba(128, 128, 128, 0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--text-secondary)',
                                fontSize: '14px', fontWeight: 'bold',
                                border: '1px solid rgba(128, 128, 128, 0.2)',
                                overflow: 'hidden',
                                flexShrink: 0
                            }}>
                                {(showImages && item.image) ? (
                                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    item.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{
                                    fontWeight: 'bold',
                                    color: 'var(--text-color)',
                                    fontSize: '1em'
                                }}>{item.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.6, display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span>{item.category} {item.subcategory ? `> ${item.subcategory}` : ''}</span>
                                    <span style={{
                                        background: 'var(--primary-color-alpha-10)',
                                        color: 'var(--primary-color)',
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.65rem',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase'
                                    }}>
                                        {item.type === 'alimento' ? 'Alimento' : item.type === 'bebida' ? 'Bebida' : 'Objeto'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ flex: isGrid ? 'none' : 1, marginBottom: isGrid ? '0.5rem' : '0' }}>
                            <div style={{
                                fontWeight: '600',
                                fontSize: isGrid ? '1.1em' : '1em',
                                color: 'var(--text-color)',
                                display: '-webkit-box',
                                WebkitLineClamp: isGrid ? 3 : 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: '1.2'
                            }}>{item.name}</div>
                            {showBreadcrumbs && (
                                <div style={{ fontSize: '0.65em', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--primary-color)', marginTop: '0.1rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>{item.section || item.subcategory || item.category}</span>
                                    <span style={{ opacity: 0.6 }}>•</span>
                                    <span>{item.type === 'alimento' ? 'Alimento' : item.type === 'bebida' ? 'Bebida' : 'Objeto'}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sección de precio */}
                    {(!isDetailedList && !isGrid) && (() => {
                        const promoPrice = getPromotionalPrice(item, promotions);
                        if (promoPrice !== null) {
                            return (
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.9em', marginLeft: 'auto', marginRight: '1rem' }}>
                                    <span style={{ textDecoration: 'line-through', opacity: 0.5, color: 'var(--text-secondary)' }}>${item.price}</span>
                                    <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>${promoPrice.toFixed(0)}</span>
                                </div>
                            );
                        }
                        return <div style={{ fontSize: '1em', color: 'var(--primary-color)', fontWeight: 'bold', marginLeft: 'auto', marginRight: '1rem' }}>${item.price}</div>;
                    })()}

                    {/* Acciones/Estado del lado derecho */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: isGrid ? 'auto' : '0' }}>
                        {isDetailedList && (
                            <div style={{ fontWeight: 'bold', color: 'var(--primary-color)', marginRight: '0.5rem' }}>
                                {(() => {
                                    const promoPrice = getPromotionalPrice(item, promotions);
                                    if (promoPrice !== null) {
                                        return (
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <span style={{ textDecoration: 'line-through', opacity: 0.5, color: 'var(--text-secondary)', fontSize: '0.85em', fontWeight: 'normal' }}>${item.price}</span>
                                                <span>${promoPrice.toFixed(0)}</span>
                                            </div>
                                        );
                                    }
                                    return `$${item.price}`;
                                })()}
                            </div>
                        )}

                        {/* Indicador de disponibilidad (Mini) */}
                        <div
                            title={item.available ? 'En Stock' : 'Agotado'}
                            style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: item.available ? 'var(--success-color)' : 'var(--danger-color)',
                                boxShadow: `0 0 8px ${item.available ? 'var(--success-color-alpha-50)' : 'var(--danger-color-alpha-50)'}`
                            }}
                        />

                        {canEdit && !showOrderingUI && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedItemForMenu(item);
                                }}
                                title="Opciones"
                                style={{
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: 'var(--text-secondary)',
                                    cursor: 'pointer', fontSize: '1.2rem', width: '32px', height: '32px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-color-alpha-10)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            >
                                ⋮
                            </button>
                        )}

                        {isDetailedList && showOrderingUI && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onShowDetails) onShowDetails(item);
                                }}
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
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default ItemList;
