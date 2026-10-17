import { useState, useMemo } from 'react';
import type { Order, UIScale, Shift, LayoutOrientation } from '../../../types';
import SettingsControls from '../../../components/ui/SettingsControls';
import { formatDateTime, getShiftLabel, getLocalDateString } from '../../../utils/dateUtils';
import { formatCurrency } from '../../../utils/currencyUtils';

interface Props {
    history: Order[];
    shifts: Shift[];
    currentShiftId: string | null;
    back: () => void;
    uiScale: UIScale;
    setUiScale: (s: UIScale) => void;
    layoutOrientation: LayoutOrientation;
    setLayoutOrientation: (o: LayoutOrientation) => void;
}

interface SaleItemRecord {
    orderId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    vendedor: string;
    fecha: string;
}

export default function SalesRecords({
    history,
    shifts,
    currentShiftId,
    back,
    uiScale,
    setUiScale,
    layoutOrientation,
    setLayoutOrientation
}: Props) {
    const [shiftFilterDate, setShiftFilterDate] = useState("");
    const [showShiftPicker, setShowShiftPicker] = useState(false);
    const [expandedShifts, setExpandedShifts] = useState<Set<string>>(new Set([currentShiftId || '']));

    // Organizar turnos como en History.tsx
    const organizedShifts = useMemo(() => {
        let relevantShifts: Shift[] = [];

        if (shiftFilterDate) {
            // Buscar turnos que coincidan con el mismo día que shiftFilterDate
            relevantShifts = shifts.filter(s => {
                const localStartTime = getLocalDateString(new Date(s.startTime));
                return localStartTime === shiftFilterDate;
            });
        } else {
            // Predeterminado: Turno actual + últimos 10 turnos para los registros
            const currentShift = shifts.find(s => s.id === currentShiftId);
            const pastShifts = shifts
                .filter(s => s.id !== currentShiftId)
                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                .slice(0, 10);

            if (currentShift) relevantShifts = [currentShift, ...pastShifts];
            else relevantShifts = pastShifts;
        }

        const groups = relevantShifts.map(shift => {
            const shiftOrders = history.filter(o => o.shiftId === shift.id);

            // Aplanar pedidos del turno en ventas individuales de artículos
            const salesData: SaleItemRecord[] = [];
            shiftOrders.forEach(order => {
                order.items.forEach(item => {
                    if (item.menuItemId === 'tax-line' || item.menuItemId === 'promo-discount') {
                        return;
                    }
                    salesData.push({
                        orderId: order.id,
                        productName: item.name,
                        quantity: item.quantity,
                        unitPrice: item.price,
                        total: item.price * item.quantity,
                        vendedor: order.orderedBy,
                        fecha: order.createdAt
                    });
                });
            });

            return {
                shift,
                sales: salesData,
                label: getShiftLabel(shift, shift.id === currentShiftId),
                totalAmount: shiftOrders.reduce((acc, o) => acc + o.total, 0),
                totalCount: salesData.length
            };
        });

        // Grupo para pedidos sin turno asignado (historial heredado o de respaldo)
        if (!shiftFilterDate) {
            const unassignedOrders = history.filter(o => !o.shiftId || !shifts.some(s => s.id === o.shiftId));
            if (unassignedOrders.length > 0) {
                const unassignedSales: SaleItemRecord[] = [];
                unassignedOrders.forEach(order => {
                    order.items.forEach(item => {
                        if (item.menuItemId === 'tax-line' || item.menuItemId === 'promo-discount') {
                            return;
                        }
                        unassignedSales.push({
                            orderId: order.id,
                            productName: item.name,
                            quantity: item.quantity,
                            unitPrice: item.price,
                            total: item.price * item.quantity,
                            vendedor: order.orderedBy,
                            fecha: order.createdAt
                        });
                    });
                });

                groups.push({
                    shift: { id: 'unassigned', startTime: '', name: 'Pedidos Anteriores' } as Shift,
                    sales: unassignedSales,
                    label: 'Pedidos Anteriores (Sin Turno Asignado)',
                    totalAmount: unassignedOrders.reduce((acc, o) => acc + o.total, 0),
                    totalCount: unassignedSales.length
                });
            }
        }

        return groups;
    }, [shifts, currentShiftId, history, shiftFilterDate]);

    const toggleShift = (shiftId: string) => {
        const next = new Set(expandedShifts);
        if (next.has(shiftId)) next.delete(shiftId);
        else next.add(shiftId);
        setExpandedShifts(next);
    };

    return (
        <div className={`scale-${uiScale}`}>
            <div className="page-container">
                {/* Sección de encabezado - Igual que History.tsx */}
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
                    </div>
                </div>

                <h1 className="page-main-title">HISTORIAL DE VENTAS</h1>

                {/* Controles de filtro - Igual que History.tsx */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
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

                {/* Panel de filtro de turnos - Igual que History.tsx */}
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
                            Busca turnos históricos por su fecha de inicio o cierre. Ideal para localizar ventas detalladas de días anteriores.
                        </div>
                    </div>
                )}

                {/* Grupo acordeón de turnos */}
                {organizedShifts.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                        No se encontraron turnos para la fecha seleccionada.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {organizedShifts.map(({ shift, sales, label, totalAmount, totalCount }) => {
                            const isOpen = expandedShifts.has(shift.id);

                            return (
                                <div key={shift.id} style={{
                                    background: 'var(--card-bg)',
                                    borderRadius: '16px',
                                    border: '1px solid var(--card-border)',
                                    overflow: 'hidden'
                                }}>
                                    {/* Encabezado del acordeón */}
                                    <div
                                        onClick={() => toggleShift(shift.id)}
                                        style={{
                                            padding: '1.5rem 2rem',
                                            background: isOpen ? 'var(--card-hover-bg)' : 'transparent',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{
                                                    fontSize: '1.2em',
                                                    fontWeight: 'bold',
                                                    color: shift.id === currentShiftId ? 'var(--success-color)' : 'var(--text-color)'
                                                }}>
                                                    {label}
                                                </span>
                                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                                                    <span style={{ fontSize: '0.85em', color: 'var(--text-secondary)' }}>
                                                        {totalCount} artículos vendidos
                                                    </span>
                                                    <span style={{ fontSize: '0.85em', color: 'var(--success-color)', fontWeight: 'bold' }}>
                                                        {formatCurrency(totalAmount)} total ganado
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{
                                            transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                                            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            color: 'var(--text-secondary)', fontSize: '12px'
                                        }}>
                                            ▼
                                        </div>
                                    </div>

                                    {/* Contenido del acordeón (tabla de ventas) */}
                                    {isOpen && (
                                        <div style={{ padding: '0 1rem 1.5rem 1rem' }}>
                                            <div style={{ background: 'rgba(0,0,0,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                                    <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--card-border)' }}>
                                                        <tr>
                                                            <th style={{ padding: '1rem', fontSize: '0.85em', color: 'var(--text-secondary)' }}>Producto</th>
                                                            <th style={{ padding: '1rem', fontSize: '0.85em', color: 'var(--text-secondary)', textAlign: 'center' }}>Cant.</th>
                                                            <th style={{ padding: '1rem', fontSize: '0.85em', color: 'var(--text-secondary)' }}>Precio Unitario</th>
                                                            <th style={{ padding: '1rem', fontSize: '0.85em', color: 'var(--text-secondary)' }}>Total</th>
                                                            <th style={{ padding: '1rem', fontSize: '0.85em', color: 'var(--text-secondary)' }}>Fecha / Hora</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sales.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', opacity: 0.3, fontStyle: 'italic' }}>
                                                                    No hay ventas registradas en este turno.
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            sales.map((sale, i) => (
                                                                <tr key={i} style={{ borderBottom: i === sales.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)' }}>
                                                                    <td style={{ padding: '0.85rem 1rem', fontWeight: 'bold', color: 'var(--text-color)' }}>{sale.productName}</td>
                                                                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>{sale.quantity}</td>
                                                                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.9em' }}>{formatCurrency(sale.unitPrice)}</td>
                                                                    <td style={{ padding: '0.85rem 1rem', fontWeight: 'bold', color: 'var(--success-color)' }}>{formatCurrency(sale.total)}</td>
                                                                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.75em', opacity: 0.6 }}>
                                                                        {(() => {
                                                                            const dt = formatDateTime(sale.fecha);
                                                                            return dt.time ? `${dt.time} (${dt.date})` : dt.full;
                                                                        })()}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
