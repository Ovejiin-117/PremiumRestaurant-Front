import React from 'react';
import type { MenuItem, Promotion, TaxConfig } from '../../../types';
import { getPromotionalPrice, isPromotionActive } from '../../../utils/promotionUtils';

interface OrderPanelProps {
    currentOrder: { menuItem: MenuItem; quantity: number }[];
    calculateTotal: () => number;
    handleDecreaseQuantity: (index: number) => void;
    handleIncreaseQuantity: (index: number) => void;
    handleRemoveFromOrder: (index: number) => void;
    showNoteInput: boolean;
    setShowNoteInput: (b: boolean) => void;
    orderNote: string;
    setOrderNote: (s: string) => void;
    handleSubmitOrder: () => void;
    isConfirmingOrder: boolean;
    isShiftOpen: boolean;
    ticketWidth: number;
    setTicketWidth: (w: number) => void;
    taxConfig: TaxConfig;
    promotions: Promotion[];
}

const OrderPanel: React.FC<OrderPanelProps> = ({
    currentOrder, calculateTotal, handleDecreaseQuantity, handleIncreaseQuantity,
    handleRemoveFromOrder, showNoteInput, setShowNoteInput, orderNote,
    setOrderNote, handleSubmitOrder, isConfirmingOrder, isShiftOpen, ticketWidth, setTicketWidth,
    taxConfig, promotions
}) => {
    const totalSum = calculateTotal();
    const taxRate = taxConfig.percentage / 100;

    const getLineTotal = (item: { menuItem: MenuItem; quantity: number }) => {
        const now = new Date();
        const baseTotal = item.menuItem.price * item.quantity;
        const applicablePromos = promotions.filter(p =>
            p.targetItemIds.includes(item.menuItem.id) &&
            p.type !== 'combo' &&
            isPromotionActive(p, now)
        );

        if (applicablePromos.length === 0) return baseTotal;

        let bestTotal = baseTotal;
        applicablePromos.forEach(p => {
            let promoTotal = baseTotal;
            if (p.type === 'percentage' && p.value) {
                promoTotal = baseTotal * (1 - p.value / 100);
            } else if (p.type === 'quantity_offer' && p.pay && p.take) {
                const sets = Math.floor(item.quantity / p.take);
                const remainder = item.quantity % p.take;
                promoTotal = (sets * p.pay + remainder) * item.menuItem.price;
            }
            if (promoTotal < bestTotal) bestTotal = promoTotal;
        });
        return bestTotal;
    };

    let subtotal = 0;
    let taxAmount = 0;

    if (taxConfig.enabled) {
        if (taxConfig.rounding === 'item') {
            currentOrder.forEach(item => {
                const itemPromotedTotal = getLineTotal(item);
                let itemSub = 0;
                let itemTax = 0;

                if (taxConfig.mode === 'inclusive') {
                    itemSub = itemPromotedTotal / (1 + taxRate);
                    itemTax = itemPromotedTotal - itemSub;
                } else {
                    itemSub = itemPromotedTotal;
                    itemTax = itemPromotedTotal * taxRate;
                }

                subtotal += Math.round(itemSub * 100) / 100;
                taxAmount += Math.round(itemTax * 100) / 100;
            });
        } else {
            // Calcular sobre la suma total (que ya incluye descuentos por combos)
            if (taxConfig.mode === 'inclusive') {
                subtotal = totalSum / (1 + taxRate);
                taxAmount = totalSum - subtotal;
            } else {
                subtotal = totalSum;
                taxAmount = totalSum * taxRate;
            }
            subtotal = Math.round(subtotal * 100) / 100;
            taxAmount = Math.round(taxAmount * 100) / 100;
        }
    } else {
        subtotal = totalSum;
    }

    const finalTotal = (taxConfig.enabled && taxConfig.mode === 'exclusive') ? subtotal + taxAmount : (taxConfig.mode === 'inclusive' ? totalSum : subtotal);

    return (
        <div className="glass-card" style={{
            width: `${Math.max(ticketWidth * 6.5, 320)}px`,
            maxWidth: '100%',
            boxSizing: 'border-box',
            padding: '1.25rem',
            height: 'fit-content',
            position: 'sticky',
            top: '1.5rem',
            overflowX: 'hidden',
            transition: 'width 0.3s ease-in-out'
        }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.15em', color: 'var(--text-color)', fontWeight: '800', letterSpacing: '-0.02em' }}>PEDIDO</h2>

                <button
                    onClick={() => setTicketWidth(ticketWidth === 80 ? 60 : 80)}
                    style={{
                        background: 'var(--card-hover-bg)',
                        color: 'var(--text-color)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '0.4rem',
                        padding: '4px 12px',
                        fontSize: '0.75em',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                    onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'var(--card-border)'}
                >
                    {ticketWidth === 80 ? 'GRANDE' : 'PEQUEÑO'}
                </button>
            </div>

            {currentOrder.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem 1rem', fontSize: '0.9em', fontStyle: 'italic' }}>No hay productos en el pedido</div>
            ) : (
                <>
                    <div style={{ marginBottom: '1rem', maxHeight: '40vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                        {currentOrder.map((orderItem, index) => (
                            <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.75rem', background: 'var(--card-hover-bg)', borderRadius: '0.5rem', marginBottom: '0.5rem', border: '1px solid var(--card-border)' }}>
                                {/* Fila 1: Nombre y eliminación */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontWeight: 'bold',
                                            fontSize: '0.9em',
                                            color: 'var(--text-color)',
                                            wordBreak: 'break-word',
                                            lineHeight: '1.2'
                                        }} title={orderItem.menuItem.name}>
                                            {orderItem.menuItem.name}
                                        </div>
                                        <div style={{ fontSize: '0.65em', color: 'var(--text-secondary)', opacity: 0.6, marginTop: '2px' }}>
                                            {orderItem.menuItem.category}
                                            {orderItem.menuItem.subcategory && ` > ${orderItem.menuItem.subcategory}`}
                                            {orderItem.menuItem.section && ` > ${orderItem.menuItem.section}`}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveFromOrder(index)}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            color: 'var(--danger-color)',
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                            borderRadius: '0.5rem',
                                            padding: '4px 10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            fontSize: '0.8em',
                                            fontWeight: 'bold',
                                            transition: 'all 0.2s ease',
                                            flexShrink: 0,
                                            boxShadow: '0 2px 5px rgba(239, 68, 68, 0.1)'
                                        }}
                                        onMouseOver={e => {
                                            e.currentTarget.style.background = 'var(--danger-color)';
                                            e.currentTarget.style.color = 'white';
                                            e.currentTarget.style.borderColor = 'var(--danger-color)';
                                            e.currentTarget.style.boxShadow = '0 4px 10px rgba(239, 68, 68, 0.3)';
                                        }}
                                        onMouseOut={e => {
                                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                            e.currentTarget.style.color = 'var(--danger-color)';
                                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                                            e.currentTarget.style.boxShadow = '0 2px 5px rgba(239, 68, 68, 0.1)';
                                        }}
                                    >
                                        ELIMINAR
                                    </button>
                                </div>

                                {/* Fila 2: Controles y totales */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'var(--card-border)', padding: '2px', borderRadius: '0.4rem' }}>
                                            <button
                                                onClick={() => handleDecreaseQuantity(index)}
                                                style={{ background: 'var(--input-bg)', color: 'var(--text-color)', border: 'none', borderRadius: '0.3rem', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: orderItem.quantity <= 1 ? 'not-allowed' : 'pointer', opacity: orderItem.quantity <= 1 ? 0.3 : 1, fontSize: '1em' }}
                                                disabled={orderItem.quantity <= 1}
                                            >
                                                −
                                            </button>
                                            <div style={{ fontWeight: '800', minWidth: '20px', textAlign: 'center', fontSize: '0.85em', color: 'var(--text-color)' }}>{orderItem.quantity}</div>
                                            <button
                                                onClick={() => handleIncreaseQuantity(index)}
                                                style={{ background: 'var(--input-bg)', color: 'var(--text-color)', border: 'none', borderRadius: '0.3rem', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: orderItem.quantity >= 99 ? 'not-allowed' : 'pointer', opacity: orderItem.quantity >= 99 ? 0.3 : 1, fontSize: '1em' }}
                                                disabled={orderItem.quantity >= 99}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <div style={{ fontSize: '0.75em', color: 'var(--text-secondary)', opacity: 0.7 }}>
                                            x ${(() => {
                                                const promoPrice = getPromotionalPrice(orderItem.menuItem, promotions);
                                                return promoPrice !== null ? promoPrice.toFixed(0) : orderItem.menuItem.price;
                                            })()}
                                        </div>
                                    </div>

                                    <div style={{ fontWeight: '800', textAlign: 'right', fontSize: '1em', color: 'var(--text-color)' }}>
                                        {(() => {
                                            const promoPrice = getPromotionalPrice(orderItem.menuItem, promotions);
                                            const originalLineTotal = orderItem.menuItem.price * orderItem.quantity;
                                            if (promoPrice !== null) {
                                                const promoLineTotal = promoPrice * orderItem.quantity;
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: '1' }}>
                                                        <span style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: '0.7em', fontWeight: 'normal' }}>${originalLineTotal}</span>
                                                        <span style={{ color: 'var(--primary-color)' }}>${promoLineTotal.toFixed(0)}</span>
                                                    </div>
                                                );
                                            }
                                            return `$${originalLineTotal}`;
                                        })()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ borderTop: '2px solid var(--card-border)', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
                        {taxConfig.enabled && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', opacity: 0.8 }}>
                                    <span>Subtotal:</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', opacity: 0.8 }}>
                                    <span>{taxConfig.name} ({taxConfig.percentage}%):</span>
                                    <span>${taxAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.35em', fontWeight: '900', marginBottom: '1.5rem', color: 'var(--text-color)' }}>
                            <span>Total:</span>
                            <span style={{ color: 'var(--success-color)' }}>${finalTotal.toFixed(2)}</span>
                        </div>

                        {showNoteInput && (
                            <div style={{ marginBottom: '1rem' }}>
                                <textarea
                                    className="form-control"
                                    value={orderNote}
                                    onChange={(e) => setOrderNote(e.target.value)}
                                    placeholder="Nota para la cocina..."
                                    style={{ width: '100%', minHeight: '80px', fontSize: '0.9em', background: 'var(--input-bg)', color: 'var(--text-color)', border: '1px solid var(--input-border)' }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={() => setShowNoteInput(!showNoteInput)}
                                style={{ flex: 1, background: showNoteInput ? 'var(--primary-color)' : 'var(--card-hover-bg)', color: 'var(--text-color)', border: '1px solid var(--card-border)', borderRadius: '0.75rem', padding: '0.85rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9em', transition: 'all 0.2s' }}
                            >
                                {showNoteInput ? 'CERRAR NOTA' : '+ NOTA'}
                            </button>
                            <button
                                onClick={handleSubmitOrder}
                                style={{
                                    flex: 2,
                                    background: !isShiftOpen ? 'var(--danger-color-alpha-20)' : (isConfirmingOrder ? 'var(--warning-color)' : 'var(--success-color)'),
                                    color: !isShiftOpen ? 'var(--danger-color)' : 'white',
                                    border: !isShiftOpen ? '1px solid var(--danger-color-alpha-20)' : 'none',
                                    borderRadius: '0.75rem', padding: '0.85rem', fontWeight: '900',
                                    cursor: isShiftOpen ? 'pointer' : 'not-allowed',
                                    fontSize: '1em',
                                    boxShadow: isShiftOpen ? '0 4px 12px var(--success-color-alpha-20)' : 'none',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}
                                disabled={!isShiftOpen}
                            >
                                {!isShiftOpen ? 'Turno Cerrado' : (isConfirmingOrder ? '¿CONFIRMAR?' : 'ORDENAR')}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default OrderPanel;
