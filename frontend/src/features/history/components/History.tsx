import { useState, useMemo } from 'react';
import type { Order, UIScale, LayoutOrientation, User, Shift } from '../../../types';
import SettingsControls from '../../../components/ui/SettingsControls';
import CustomSelect from '../../../components/ui/CustomSelect';
import { formatDateTime, getShiftLabel } from '../../../utils/dateUtils';
import { formatCurrency } from '../../../utils/currencyUtils';

interface Props {
    user: User;
    history: Order[];
    back: () => void;
    uiScale: UIScale;
    setUiScale: (s: UIScale) => void;
    layoutOrientation: LayoutOrientation;
    setLayoutOrientation: (o: LayoutOrientation) => void;
    ticketWidth: number;
    setTicketWidth: (w: number) => void;
    shifts: Shift[];
    currentShiftId: string | null;
    logAction?: (action: import('../../../types').AuditAction, details: string, entityId?: string) => void;
}

export default function History({
    user, history, back,
    uiScale, setUiScale, layoutOrientation, setLayoutOrientation,
    ticketWidth, setTicketWidth,
    shifts, currentShiftId, logAction
}: Props) {
    const [showFilters, setShowFilters] = useState(false);
    const [showShiftPicker, setShowShiftPicker] = useState(false);
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
    const [expandedShifts, setExpandedShifts] = useState<Set<string>>(new Set([currentShiftId || 'current'])); // Por defecto abrir el actual
    const [shiftFilterDate, setShiftFilterDate] = useState("");

    // Estados estándar de filtros
    const [filterMinPrice, setFilterMinPrice] = useState("");
    const [filterMaxPrice, setFilterMaxPrice] = useState("");
    const [filterTime, setFilterTime] = useState("");
    const [filterUser, setFilterUser] = useState("");

    const isAdmin = user.role === 'developer' || user.role === 'manager';

    // 1. Organizar turnos
    const organizedShifts = useMemo(() => {
        let relevantShifts: Shift[] = [];

        if (shiftFilterDate) {
            // Modo de filtro por calendario: mostrar todos los turnos de esa fecha
            relevantShifts = shifts.filter(s => {
                const localStartTime = new Date(s.startTime).toLocaleDateString('en-CA');
                return localStartTime === shiftFilterDate;
            });
        } else {
            // Modo predeterminado: Actual + últimos 6
            const currentShift = shifts.find(s => s.id === currentShiftId);
            const pastShifts = shifts
                .filter(s => s.id !== currentShiftId)
                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                .slice(0, 6);

            if (currentShift) relevantShifts = [currentShift, ...pastShifts];
            else relevantShifts = pastShifts;
        }

        // Agrupar pedidos por turno
        // Si un pedido no tiene shiftId (legado), podríamos agruparlo en "Sin Turno" u ocultarlo.
        // Por ahora, seguimos estrictamente los turnos.
        return relevantShifts.map(shift => {
            const shiftOrders = history.filter(o => o.shiftId === shift.id);
            return {
                shift,
                orders: shiftOrders,
                label: getShiftLabel(shift, shift.id === currentShiftId)
            };
        });
    }, [shifts, currentShiftId, history, shiftFilterDate]);


    const [reprintingOrder, setReprintingOrder] = useState<string | null>(null);
    const [reprintStatus, setReprintStatus] = useState<'printing' | 'success' | null>(null);

    const handleReprint = (order: Order) => {
        if (logAction) {
            logAction('ticket_reprint', `Ticket reimpreso: ${order.id.slice(0, 8)} (Total: $${order.total})`, order.id);
        }

        setReprintingOrder(order.id);
        setReprintStatus('printing');

        // Simular proceso de impresión
        setTimeout(() => {
            setReprintStatus('success');
            setTimeout(() => {
                setReprintingOrder(null);
                setReprintStatus(null);
            }, 2000);
        }, 2500);
    };

    const toggleShift = (shiftId: string) => {
        const next = new Set(expandedShifts);
        if (next.has(shiftId)) next.delete(shiftId);
        else next.add(shiftId);
        setExpandedShifts(next);
    };

    return (
        <div className={`scale-${uiScale}`}>
            <div className="page-container">

                {/* Encabezado */}
                <div className="title-bar">
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <button onClick={back} className="btn-back">← Volver al panel</button>
                        <SettingsControls
                            uiScale={uiScale}
                            setUiScale={setUiScale}
                            layoutOrientation={layoutOrientation}
                            setLayoutOrientation={setLayoutOrientation}
                            showOrientation={false}
                        />
                        {/* Selector de ancho de ticket */}
                        <CustomSelect
                            label="PAPEL"
                            value={ticketWidth.toString()}
                            onChange={(val: string) => setTicketWidth(Number(val))}
                            options={[
                                { value: "58", label: "58mm" },
                                { value: "76", label: "76mm" },
                                { value: "80", label: "80mm" },
                                { value: "112", label: "112mm" }
                            ]}
                        />

                    </div>
                </div>

                <h1 className="page-main-title">HISTORIAL DE TICKETS</h1>

                {/* Controles superiores: Alternar filtros y filtro de turno */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
                            border: '1px solid var(--card-border)', background: showFilters ? 'var(--primary-color)' : 'var(--card-bg)',
                            color: showFilters ? 'white' : 'var(--text-color)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9em'
                        }}
                    >
                        <span style={{
                            fontSize: '12px', transition: 'transform 0.3s ease', transform: showFilters ? 'rotate(-90deg)' : 'rotate(0deg)',
                            display: 'inline-block', lineHeight: '1'
                        }}>
                            ▼
                        </span>
                        Filtros de Ticket
                    </button>

                    <button
                        onClick={() => setShowShiftPicker(!showShiftPicker)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
                            border: '1px solid var(--card-border)', background: showShiftPicker ? 'var(--primary-color)' : 'var(--card-bg)',
                            color: showShiftPicker ? 'white' : 'var(--text-color)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9em'
                        }}
                    >
                        <span style={{
                            fontSize: '12px', transition: 'transform 0.3s ease', transform: showShiftPicker ? 'rotate(-90deg)' : 'rotate(0deg)',
                            display: 'inline-block', lineHeight: '1'
                        }}>
                            ▼
                        </span>
                        Buscar por Fecha
                    </button>
                </div>

                {/* Panel de filtro de turno */}
                {showShiftPicker && (
                    <div className="glass-card" style={{
                        marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label className="form-label" style={{ fontSize: '0.7em' }}>SELECCIONA UNA FECHA</label>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <input
                                    type="date"
                                    value={shiftFilterDate}
                                    onChange={e => setShiftFilterDate(e.target.value)}
                                    style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-color)', fontSize: '0.95em' }}
                                />
                                {shiftFilterDate && (
                                    <button
                                        onClick={() => setShiftFilterDate("")}
                                        style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger-color)', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85em' }}
                                    >
                                        Limpiar
                                    </button>
                                )}
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: '250px', fontSize: '0.85em', color: 'var(--text-secondary)', paddingLeft: '1.5rem', borderLeft: '1px solid var(--card-border)', lineHeight: '1.6' }}>
                            Busca turnos históricos por su fecha de inicio. Ideal para localizar ventas de días anteriores y realizar cierres de caja retroactivos.
                        </div>
                    </div>
                )}

                {/* Filtros avanzados (precio, hora, usuario) */}
                {showFilters && (
                    <div className="glass-card" style={{
                        marginBottom: '1.5rem',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        <div>
                            <label className="form-label" style={{ fontSize: '0.75em' }}>PRECIO ($)</label>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <input type="number" placeholder="Min" value={filterMinPrice} onChange={e => setFilterMinPrice(e.target.value)} style={{ flex: 1, minWidth: 0, padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-color)', fontSize: '0.95em' }} />
                                <input type="number" placeholder="Max" value={filterMaxPrice} onChange={e => setFilterMaxPrice(e.target.value)} style={{ flex: 1, minWidth: 0, padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-color)', fontSize: '0.95em' }} />
                            </div>
                        </div>
                        <div>
                            <label className="form-label" style={{ fontSize: '0.75em' }}>HORA</label>
                            <input type="text" placeholder="HH:mm" value={filterTime} onChange={e => setFilterTime(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-color)', fontSize: '0.95em' }} />
                        </div>
                        {isAdmin && (
                            <div>
                                <label className="form-label" style={{ fontSize: '0.75em' }}>USUARIO</label>
                                <input type="text" placeholder="Nombre..." value={filterUser} onChange={e => setFilterUser(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-color)', fontSize: '0.95em' }} />
                            </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button onClick={() => { setFilterMinPrice(""); setFilterMaxPrice(""); setFilterTime(""); setFilterUser(""); }} style={{ width: '100%', padding: '0.85rem', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger-color)', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em', transition: 'all 0.2s' }}>LIMPIAR FILTROS</button>
                        </div>
                    </div>
                )}

                {/* LISTA ACORDEÓN DE TURNOS */}
                {organizedShifts.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: '40px', opacity: 0.5 }}>No hay turnos registrados.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {organizedShifts.map(({ shift, orders, label }) => {
                            const isOpen = expandedShifts.has(shift.id);

                            // Aplicar filtrado por contenido de ticket dentro del turno
                            const displayedOrders = orders.filter(order => {
                                if (!isAdmin && order.orderedBy !== user.username) return false;
                                if (filterMinPrice && order.total < Number(filterMinPrice)) return false;
                                if (filterMaxPrice && order.total > Number(filterMaxPrice)) return false;
                                if (filterTime) {
                                    const formattedTimeStr = formatDateTime(order.createdAt).full;
                                    if (!formattedTimeStr.includes(filterTime) && !order.createdAt.includes(filterTime)) return false;
                                }
                                if (isAdmin && filterUser && order.orderedBy.toLowerCase() !== filterUser.toLowerCase()) return false;
                                return true;
                            });

                            return (
                                <div key={shift.id} style={{
                                    background: 'var(--card-bg)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--card-border)',
                                    overflow: 'hidden'
                                }}>
                                    {/* Encabezado del acordeón */}
                                    <div
                                        onClick={() => toggleShift(shift.id)}
                                        style={{
                                            padding: '1.25rem 1.75rem',
                                            background: isOpen ? 'var(--card-hover-bg)' : 'transparent',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <span style={{
                                                fontSize: '1.15em',
                                                fontWeight: 'bold',
                                                color: shift.id === currentShiftId ? 'var(--success-color)' : 'var(--text-color)'
                                            }}>
                                                {label}
                                            </span>
                                            <span style={{ fontSize: '0.85em', color: 'var(--text-secondary)', fontWeight: 'medium' }}>
                                                ({displayedOrders.length} tickets)
                                            </span>
                                        </div>
                                        <div style={{
                                            transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                                            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            color: 'var(--text-secondary)', fontSize: '12px'
                                        }}>
                                            ▼
                                        </div>
                                    </div>

                                    {/* Contenido del acordeón (cuadrícula de tickets) */}
                                    {isOpen && (
                                        <div style={{ padding: '2rem', borderTop: '1px solid var(--card-border)', background: 'var(--bg-color)' }}>
                                            {displayedOrders.length === 0 ? (
                                                <div style={{ opacity: 0.5, fontStyle: 'italic', textAlign: 'center' }}>No hay tickets en este turno que coincidan con los filtros.</div>
                                            ) : (
                                                <div className="card-grid" style={{
                                                    gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(ticketWidth * 4, 300)}px, 1fr))`,
                                                    alignItems: 'start',
                                                    gap: '2rem',
                                                    padding: '1rem'
                                                }}>
                                                    {displayedOrders.map(order => {
                                                        const isExpanded = expandedOrders.has(order.id);
                                                        const displayItems = isExpanded ? order.items : order.items.slice(0, 5);
                                                        const hasMore = order.items.length > 5;

                                                        return (
                                                            <div key={order.id} className="history-ticket" style={{
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
                                                                                    <td style={{ padding: '0.25rem 0' }}>{item.quantity}</td>
                                                                                    <td style={{ padding: '0.25rem 0' }}>{item.name}</td>
                                                                                    <td style={{ padding: '0.25rem 0', textAlign: 'right' }}>{formatCurrency(item.price * item.quantity)}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                    {hasMore && (
                                                                        <button
                                                                            onClick={() => {
                                                                                const next = new Set(expandedOrders);
                                                                                if (isExpanded) next.delete(order.id);
                                                                                else next.add(order.id);
                                                                                setExpandedOrders(next);
                                                                            }}
                                                                            style={{ width: '100%', marginTop: '0.5rem', padding: '0.4rem', background: 'transparent', border: '1px dashed #94a3b8', color: '#475569', fontSize: '10px', cursor: 'pointer', borderRadius: '4px' }}
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
                                                                <button onClick={() => handleReprint(order)} style={{ width: '100%', padding: '0.75rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '0.25rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85em' }}>
                                                                    REIMPRIMIR TICKET
                                                                </button>

                                                                {/* Elemento visual al pie del ticket */}
                                                                <div style={{ position: 'absolute', bottom: '-10px', left: 0, width: '100%', height: '10px', background: 'linear-gradient(-45deg, #f8fafc 5px, transparent 0), linear-gradient(45deg, #f8fafc 5px, transparent 0)', backgroundSize: '10px 10px' }}></div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )
                                    }
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            {/* Notificación superpuesta de reimpresión */}
            {
                reprintingOrder && (
                    <div style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: 'min(2rem, 4vw)',
                        maxWidth: 'calc(100vw - 2rem)',
                        zIndex: 2000,
                        animation: 'slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}>
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.9)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '1.25rem 2rem',
                            borderRadius: '1rem',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1.25rem',
                            maxWidth: '100%',
                            boxSizing: 'border-box'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '4px',
                                background: reprintStatus === 'printing' ? 'var(--primary-color-alpha-20)' : 'rgba(16, 185, 129, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem',
                                animation: reprintStatus === 'printing' ? 'pulse 2s infinite' : 'none'
                            }}>
                                {reprintStatus === 'printing' ? '🖨️' : '✅'}
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontSize: '0.95rem',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    marginBottom: '4px'
                                }}>
                                    {reprintStatus === 'printing' ? 'Reimprimiendo ticket...' : '¡Impresión enviada!'}
                                </div>
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: 'rgba(255,255,255,0.6)',
                                    letterSpacing: '0.02em',
                                    textTransform: 'uppercase'
                                }}>
                                    ID: {reprintingOrder.slice(0, 8)}
                                </div>

                                {/* Contenedor de barra de progreso */}
                                <div style={{
                                    width: '100%',
                                    height: '3px',
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: '3px',
                                    marginTop: '10px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        background: reprintStatus === 'printing' ? 'var(--primary-color)' : '#10b981',
                                        width: reprintStatus === 'printing' ? '100%' : '100%',
                                        transition: 'width 2.5s linear, background 0.3s',
                                        animation: reprintStatus === 'printing' ? 'printingProgress 2.5s linear forwards' : 'none'
                                    }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
