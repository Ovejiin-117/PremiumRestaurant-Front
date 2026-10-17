import React, { useState } from 'react';
import type { MenuItem, Promotion } from '../../../types';
import { isPromotionActive } from '../../../utils/promotionUtils';

interface PromotionsCategoryCardProps {
    promotions: Promotion[];
    menu: MenuItem[];
    onSelectCombo: (promo: Promotion) => void;
    onSelectItem?: (item: MenuItem) => void;
    globalCollapseState: 'expanded' | 'collapsed' | null;
    isReorderMode?: boolean;
    filters: {
        name: string;
        minPrice: string;
        maxPrice: string;
        category: string;
        subcategory: string;
        section: string;
    };
    isShiftOpen: boolean;
    showOrderingUI: boolean;
}

const PromotionsCategoryCard: React.FC<PromotionsCategoryCardProps> = ({
    promotions,
    menu,
    onSelectCombo,
    onSelectItem,
    globalCollapseState,
    isReorderMode = false,
    filters,
    isShiftOpen,
    showOrderingUI
}) => {
    // 1. Filtrar únicamente promociones activas
    const activePromos = promotions.filter(p => isPromotionActive(p));

    // Si no existen promociones activas, la categoría no se muestra
    if (activePromos.length === 0) {
        return null;
    }

    // Filtrar por categoría seleccionada en filtros
    if (filters.category && filters.category !== 'Promociones') {
        return null;
    }

    // Filtrar promociones según los filtros activos (nombre, precios)
    const visiblePromos = activePromos.filter(promo => {
        if (filters.name) {
            const search = filters.name.toLowerCase();
            const nameMatch = promo.name.toLowerCase().includes(search);
            const comboItemMatch = promo.targetItemIds?.some(id => {
                const item = menu.find(m => m.id === id);
                return item && item.name.toLowerCase().includes(search);
            });
            if (!nameMatch && !comboItemMatch) return false;
        }

        const price = promo.type === 'combo' ? (promo.value ?? 0) : 0;
        if (filters.minPrice && price < Number(filters.minPrice)) return false;
        if (filters.maxPrice && price > Number(filters.maxPrice)) return false;

        return true;
    });

    if (visiblePromos.length === 0 && (filters.name || filters.minPrice || filters.maxPrice)) {
        return null;
    }

    // 2. Estado de colapso sincronizado con el estado global
    const [collapseState, setCollapseState] = useState<{
        isCollapsed: boolean;
        prevGlobal: 'expanded' | 'collapsed' | null;
    }>({
        isCollapsed: true, // Inicia colapsado por defecto como las demás categorías
        prevGlobal: globalCollapseState || null
    });

    if (globalCollapseState && collapseState.prevGlobal !== globalCollapseState) {
        setCollapseState({
            isCollapsed: globalCollapseState === 'collapsed',
            prevGlobal: globalCollapseState
        });
    }

    const isCollapsed = collapseState.isCollapsed;
    const setIsCollapsed = (val: boolean | ((prev: boolean) => boolean)) => {
        setCollapseState(prev => ({
            ...prev,
            isCollapsed: typeof val === 'function' ? val(prev.isCollapsed) : val
        }));
    };

    return (
        <div
            className={`glass-card ${isReorderMode ? 'wiggle' : ''}`}
            onClick={e => e.stopPropagation()}
            style={{
                padding: '1rem',
                position: 'relative',
                overflow: 'visible',
                cursor: 'default',
                zIndex: 1
            }}
        >
            {/* Encabezado idéntico al de las demás categorías */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--card-border)',
                paddingBottom: '0.4rem',
                marginBottom: '0.75rem'
            }}>
                <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={!isCollapsed}
                    aria-label="Alternar categoría Promociones"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setIsCollapsed(prev => !prev);
                        }
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        userSelect: 'none'
                    }}
                    onClick={() => setIsCollapsed(prev => !prev)}
                >
                    <h3 style={{ margin: 0, fontSize: '1.25em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Promociones</span>
                    </h3>
                    <span style={{
                        display: 'inline-block',
                        transition: 'transform 0.2s',
                        transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                        fontSize: '12px',
                        opacity: 0.7
                    }}>
                        ▼
                    </span>
                </div>
            </div>

            {/* Listado de promociones cuando está expandida */}
            {!isCollapsed && (
                <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                }}>
                    {visiblePromos.map(promo => {
                        const isCombo = promo.type === 'combo';
                        const comboItems = isCombo && promo.targetItemIds
                            ? (promo.targetItemIds.map(id => menu.find(m => m.id === id)).filter(Boolean) as MenuItem[])
                            : [];

                        // Agrupar cantidades para el subtítulo legible
                        const counts: Record<string, number> = {};
                        comboItems.forEach(it => { counts[it.name] = (counts[it.name] || 0) + 1; });
                        const comboSummary = Object.entries(counts)
                            .map(([name, qty]) => qty > 1 ? `${qty}x ${name}` : name)
                            .join(' + ');

                        const regularPrice = comboItems.reduce((acc, it) => acc + it.price, 0);
                        const promoPrice = promo.value ?? 0;
                        const savings = regularPrice > promoPrice ? regularPrice - promoPrice : 0;
                        const isAvailable = !isCombo || comboItems.length === 0 || comboItems.every(it => it.available);

                        return (
                            <li
                                key={promo.id}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: 'var(--card-hover-bg)',
                                    padding: '0.6rem 0.85rem',
                                    borderRadius: '0.5rem',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    cursor: (showOrderingUI && isShiftOpen && isAvailable) ? 'pointer' : (showOrderingUI ? 'not-allowed' : 'default'),
                                    opacity: showOrderingUI && (!isAvailable || !isShiftOpen) ? 0.5 : 1,
                                    transition: 'all 0.2s',
                                    border: '1px solid var(--card-border)'
                                }}
                                onClick={() => {
                                    if (!showOrderingUI || !isShiftOpen || !isAvailable) return;
                                    if (isCombo) {
                                        onSelectCombo(promo);
                                    } else if (promo.targetItemIds && promo.targetItemIds.length > 0 && onSelectItem) {
                                        const firstItem = menu.find(m => m.id === promo.targetItemIds[0]);
                                        if (firstItem) onSelectItem(firstItem);
                                    }
                                }}
                            >
                                <div style={{ flex: 1, minWidth: 0, marginRight: '0.75rem' }}>
                                    <div style={{
                                        fontWeight: '600',
                                        fontSize: '1em',
                                        color: 'var(--text-color)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        lineHeight: '1.2'
                                    }}>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {promo.name}
                                        </span>
                                        <span style={{
                                            fontSize: '0.62rem',
                                            background: isCombo ? 'rgba(34, 197, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                            color: isCombo ? 'var(--success-color)' : 'var(--primary-color)',
                                            border: isCombo ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                                            borderRadius: '4px',
                                            padding: '1px 5px',
                                            fontWeight: 'bold',
                                            letterSpacing: '0.04em',
                                            flexShrink: 0
                                        }}>
                                            {isCombo ? 'COMBO' : promo.type === 'quantity_offer' ? `${promo.take}x${promo.pay}` : `${promo.value}% OFF`}
                                        </span>
                                    </div>
                                    {comboSummary && (
                                        <div style={{
                                            fontSize: '0.68em',
                                            color: 'var(--text-secondary)',
                                            opacity: 0.8,
                                            marginTop: '2px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }} title={comboSummary}>
                                            {comboSummary}
                                        </div>
                                    )}
                                </div>

                                {/* Sección de precio */}
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '1em', marginRight: '0.75rem', flexShrink: 0 }}>
                                    {isCombo && savings > 0 && (
                                        <span style={{ textDecoration: 'line-through', opacity: 0.5, color: 'var(--text-secondary)', fontSize: '0.85em' }}>
                                            ${regularPrice.toFixed(2)}
                                        </span>
                                    )}
                                    <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
                                        {isCombo ? `$${promoPrice.toFixed(2)}` : (promo.type === 'quantity_offer' ? `${promo.take}x${promo.pay}` : `-${promo.value}%`)}
                                    </span>
                                </div>

                                {/* Indicador de disponibilidad (Mini punto) */}
                                <div
                                    title={isAvailable ? 'Promoción Disponible' : 'No disponible (producto agotado)'}
                                    style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: isAvailable ? 'var(--success-color)' : 'var(--danger-color)',
                                        boxShadow: `0 0 8px ${isAvailable ? 'var(--success-color-alpha-50)' : 'var(--danger-color-alpha-50)'}`,
                                        flexShrink: 0
                                    }}
                                />
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default PromotionsCategoryCard;
