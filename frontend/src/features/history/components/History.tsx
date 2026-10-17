import { useState, useMemo } from 'react';
import type { Order, UIScale, LayoutOrientation, User, Shift } from '../../../types';
import SettingsControls from '../../../components/ui/SettingsControls';
import CustomSelect from '../../../components/ui/CustomSelect';
import { formatDateTime, getShiftLabel, getLocalDateString } from '../../../utils/dateUtils';
import HistoryFilterBar from './HistoryFilterBar';
import HistoryTicketCard from './HistoryTicketCard';
import ReprintNotification from './ReprintNotification';

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
                const localStartTime = getLocalDateString(new Date(s.startTime));
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
        const groups = relevantShifts.map(shift => {
            const shiftOrders = history.filter(o => o.shiftId === shift.id);
            return {
                shift,
                orders: shiftOrders,
                label: getShiftLabel(shift, shift.id === currentShiftId)
            };
        });

        // Incluir pedidos anteriores o sin turno asignado si no hay filtro de fecha activo
        if (!shiftFilterDate) {
            const unassignedOrders = history.filter(o => !o.shiftId || !shifts.some(s => s.id === o.shiftId));
            if (unassignedOrders.length > 0) {
                groups.push({
                    shift: { id: 'unassigned', startTime: '', name: 'Pedidos Anteriores' } as Shift,
                    orders: unassignedOrders,
                    label: 'Pedidos Anteriores (Sin Turno Asignado)'
                });
            }
        }

        return groups;
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
                <HistoryFilterBar
                    showFilters={showFilters}
                    filterMinPrice={filterMinPrice}
                    setFilterMinPrice={setFilterMinPrice}
                    filterMaxPrice={filterMaxPrice}
                    setFilterMaxPrice={setFilterMaxPrice}
                    filterTime={filterTime}
                    setFilterTime={setFilterTime}
                    filterUser={filterUser}
                    setFilterUser={setFilterUser}
                    isAdmin={isAdmin}
                    onClear={() => {
                        setFilterMinPrice("");
                        setFilterMaxPrice("");
                        setFilterTime("");
                        setFilterUser("");
                    }}
                />

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
                                                    {displayedOrders.map(order => (
                                                        <HistoryTicketCard
                                                            key={order.id}
                                                            order={order}
                                                            ticketWidth={ticketWidth}
                                                            isExpanded={expandedOrders.has(order.id)}
                                                            onToggleExpand={() => {
                                                                const next = new Set(expandedOrders);
                                                                if (expandedOrders.has(order.id)) next.delete(order.id);
                                                                else next.add(order.id);
                                                                setExpandedOrders(next);
                                                            }}
                                                            onReprint={handleReprint}
                                                        />
                                                    ))}
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
            <ReprintNotification
                reprintingOrder={reprintingOrder}
                reprintStatus={reprintStatus}
            />
        </div >
    );
}
