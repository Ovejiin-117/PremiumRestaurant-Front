import type { Order } from '../../../types';
import { formatDateTime } from '../../../utils/dateUtils';
import { formatCurrency } from '../../../utils/currencyUtils';

interface Props {
    order: Order;
    ticketWidth: number;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onReprint: (order: Order) => void;
}

export default function HistoryTicketCard({
    order,
    ticketWidth,
    isExpanded,
    onToggleExpand,
    onReprint
}: Props) {
    const displayItems = isExpanded ? order.items : order.items.slice(0, 5);
    const hasMore = order.items.length > 5;

    return (
        <div className="history-ticket" style={{
            background: '#f8fafc',
            color: '#1e293b',
            padding: `${ticketWidth <= 58 ? 12 : 24}px`,
            width: '100%',
            maxWidth: `${ticketWidth * 4}px`,
            borderRadius: '0.25rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            fontFamily: '"Courier New", Courier, monospace',
            position: 'relative',
            borderTop: '0.6rem solid #cbd5e1',
            fontSize: ticketWidth <= 58 ? '11px' : '13px',
            margin: '0 auto'
        }}>
            {/* Encabezado del ticket */}
            <div style={{ textAlign: 'center', marginBottom: '1rem', borderBottom: '1px dashed #94a3b8', paddingBottom: '0.75rem' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.2em' }}>RESTAURANT PRO</div>
                <div style={{ fontSize: '0.85em' }}>Ticket de Venta</div>
                <div style={{ fontSize: '10px', marginTop: '0.25rem', opacity: 0.8 }}>{formatDateTime(order.createdAt).full}</div>
            </div>

            {/* Información del ticket */}
            <div style={{ marginBottom: '1rem', fontSize: '0.9em' }}>
                <div><strong>Usuario:</strong> {order.orderedBy}</div>
                <div style={{ opacity: 0.7 }}><strong>ID:</strong> {order.id.slice(0, 8)}</div>
            </div>

            {/* Artículos */}
            <div style={{ borderBottom: '1px dashed #94a3b8', marginBottom: '1rem', paddingBottom: '0.5rem' }}>
                <table style={{ width: '100%', fontSize: 'inherit', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '0.25rem 0' }}>Cant</th>
                            <th style={{ padding: '0.25rem 0' }}>Producto</th>
                            <th style={{ padding: '0.25rem 0', textAlign: 'right' }}>$</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayItems.map((item, idx) => (
                            <tr key={idx}>
                                <td style={{ padding: '0.25rem 0', verticalAlign: 'top' }}>{item.quantity}</td>
                                <td style={{ padding: '0.25rem 0', verticalAlign: 'top' }}>
                                    <div style={{ fontWeight: item.isCombo ? 'bold' : 'normal' }}>
                                        {item.isCombo ? `🎁 ${item.name}` : item.name}
                                    </div>
                                    {item.isCombo && item.comboProducts && item.comboProducts.length > 0 && (
                                        <div style={{ fontSize: '0.85em', opacity: 0.75, marginTop: '1px' }}>
                                            {item.comboProducts.map(p => `${p.quantity > 1 ? `${p.quantity}x ` : ''}${p.name}`).join(' + ')}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '0.25rem 0', textAlign: 'right', verticalAlign: 'top' }}>{formatCurrency(item.price * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {hasMore && (
                    <button
                        onClick={onToggleExpand}
                        style={{
                            width: '100%',
                            marginTop: '0.5rem',
                            padding: '0.4rem',
                            background: 'transparent',
                            border: '1px dashed #94a3b8',
                            color: '#475569',
                            fontSize: '10px',
                            cursor: 'pointer',
                            borderRadius: '4px'
                        }}
                    >
                        {isExpanded ? (
                            <>
                                <span style={{ fontSize: '12px' }}>▲</span> Ver menos
                            </>
                        ) : (
                            <>
                                <span style={{ fontSize: '12px' }}>▼</span> Ver {order.items.length - 5} más...
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2em', marginBottom: '1.5rem' }}>
                <span>TOTAL:</span>
                <span>{formatCurrency(order.total)}</span>
            </div>

            {/* Botón de reimpresión */}
            <button
                onClick={() => onReprint(order)}
                style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '0.85em'
                }}
            >
                REIMPRIMIR TICKET
            </button>

            {/* Elemento visual al pie del ticket */}
            <div style={{
                position: 'absolute',
                bottom: '-10px',
                left: 0,
                width: '100%',
                height: '10px',
                background: 'linear-gradient(-45deg, #f8fafc 5px, transparent 0), linear-gradient(45deg, #f8fafc 5px, transparent 0)',
                backgroundSize: '10px 10px'
            }}></div>
        </div>
    );
}
