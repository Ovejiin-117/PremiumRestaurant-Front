import { useState, useMemo } from "react";
import type { Shift, Order, UIScale, LayoutOrientation } from "../../../types";
import SettingsControls from "../../../components/ui/SettingsControls";
import { formatCurrency } from "../../../utils/currencyUtils";
import { getShiftLabel, getLocalDateString } from "../../../utils/dateUtils";
import { calculateShiftStats } from "../utils/shiftStatsUtils";
import ShiftExecutiveSummaryView from "./ShiftExecutiveSummaryView";

interface Props {
    shifts: Shift[];
    currentShiftId: string | null;
    isShiftOpen: boolean;
    history: Order[];
    currentTime: number;
    textScale: number;
    uiScale: UIScale;
    setUiScale: (s: UIScale) => void;
    layoutOrientation: LayoutOrientation;
    setLayoutOrientation: (o: LayoutOrientation) => void;
    onBack: () => void;
    onInspectShift: (shiftId: string) => void;
}

export default function ShiftSummaryHistory({
    shifts,
    currentShiftId,
    isShiftOpen,
    history,
    currentTime,
    textScale,
    uiScale,
    setUiScale,
    layoutOrientation,
    setLayoutOrientation,
    onBack,
    onInspectShift
}: Props) {
    const [expandedShifts, setExpandedShifts] = useState<Set<string>>(new Set([currentShiftId || '']));
    const [filterDate, setFilterDate] = useState<string>("");
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

    // Turnos organizados para la vista de Historial
    const organizedShifts = useMemo(() => {
        let relevantShifts: Shift[] = [];
        if (filterDate) {
            relevantShifts = shifts.filter(s => {
                const localStartTime = getLocalDateString(new Date(s.startTime));
                return localStartTime === filterDate;
            });
        } else {
            const currentShift = shifts.find(s => s.id === currentShiftId);
            const pastShifts = shifts
                .filter(s => s.id !== currentShiftId)
                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

            if (currentShift) relevantShifts = [currentShift, ...pastShifts];
            else relevantShifts = pastShifts;
        }
        return relevantShifts;
    }, [shifts, currentShiftId, filterDate]);

    const toggleShift = (shiftId: string) => {
        const next = new Set(expandedShifts);
        if (next.has(shiftId)) next.delete(shiftId);
        else next.add(shiftId);
        setExpandedShifts(next);
    };

    return (
        <div className={`scale-${uiScale}`}>
            <div className="page-container">
                {/* Barra superior de navegación y escala */}
                <div className="title-bar">
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75em' }}>
                        <button onClick={onBack} className="btn-back">
                            ← Volver al Resumen
                        </button>
                        <SettingsControls
                            uiScale={uiScale}
                            setUiScale={setUiScale}
                            layoutOrientation={layoutOrientation}
                            setLayoutOrientation={setLayoutOrientation}
                            showOrientation={false}
                        />
                    </div>

                    <div style={{
                        padding: "0.65em 1.25em",
                        borderRadius: "12px",
                        background: isShiftOpen
                            ? "rgba(34, 197, 94, 0.15)"
                            : "rgba(239, 68, 68, 0.12)",
                        color: isShiftOpen ? "var(--success-color)" : "var(--danger-color)",
                        border: `1px solid ${isShiftOpen ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.35)"}`,
                        fontSize: "0.85em",
                        fontWeight: "800",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        backdropFilter: "blur(10px)",
                        boxShadow: isShiftOpen
                            ? "0 0 16px rgba(34,197,94,0.2), inset 0 1px 0 rgba(34,197,94,0.1)"
                            : "0 0 16px rgba(239,68,68,0.15), inset 0 1px 0 rgba(239,68,68,0.08)",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}>
                        <span style={{
                            width: "8px", height: "8px", borderRadius: "50%",
                            background: isShiftOpen ? "var(--success-color)" : "var(--danger-color)",
                            boxShadow: isShiftOpen ? "0 0 8px var(--success-color)" : "0 0 8px var(--danger-color)",
                            flexShrink: 0,
                            animation: isShiftOpen ? "pulse 2s infinite" : "none"
                        }} />
                        {isShiftOpen ? "TURNO ABIERTO" : "TURNO CERRADO"}
                    </div>
                </div>

                {/* Título Principal */}
                <h1 className="page-main-title">HISTORIAL DE RESÚMENES DE TURNO</h1>

                <div style={{ display: "flex", flexDirection: "column", gap: "1.5em" }}>
                    {/* Controles superiores: Buscar por Fecha */}
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.75rem',
                                border: '1px solid var(--card-border)',
                                background: showDatePicker ? 'var(--primary-color)' : 'var(--card-bg)',
                                color: showDatePicker ? 'white' : 'var(--text-color)',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '0.9em'
                            }}
                        >
                            <span style={{
                                fontSize: '12px',
                                transition: 'transform 0.3s ease',
                                transform: showDatePicker ? 'rotate(-90deg)' : 'rotate(0deg)',
                                display: 'inline-block',
                                lineHeight: '1'
                            }}>
                                ▼
                            </span>
                            Buscar por Fecha
                        </button>

                        {filterDate && (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75em" }}>
                                <span style={{ fontSize: "0.88em", color: "var(--text-secondary)" }}>
                                    Filtrando por fecha: <strong style={{ color: "var(--text-color)" }}>{filterDate}</strong> ({organizedShifts.length} {organizedShifts.length === 1 ? 'turno encontrado' : 'turnos encontrados'})
                                </span>
                                <button
                                    onClick={() => setFilterDate("")}
                                    style={{
                                        padding: '0.4em 0.8em',
                                        borderRadius: '0.5rem',
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        color: 'var(--danger-color)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '0.82em'
                                    }}
                                >
                                    ✕ Quitar Filtro
                                </button>
                            </div>
                        )}

                        <div style={{ marginLeft: "auto", display: "flex", gap: "0.75em" }}>
                            <button
                                onClick={onBack}
                                style={{
                                    padding: "0.65em 1.2em",
                                    borderRadius: "8px",
                                    border: "1px solid rgba(59, 130, 246, 0.4)",
                                    background: "linear-gradient(135deg, #2563eb, #4f46e5)",
                                    color: "white",
                                    cursor: "pointer",
                                    fontWeight: 700,
                                    fontSize: "0.85em",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5em"
                                }}
                            >
                                <span>📊</span> Resumen Ejecutivo Actual
                            </button>
                        </div>
                    </div>

                    {/* Panel de selección de fecha (estilo idéntico a Historial de tickets) */}
                    {showDatePicker && (
                        <div className="glass-card" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2rem',
                            flexWrap: 'wrap'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label className="form-label" style={{ fontSize: '0.7em' }}>SELECCIONA UNA FECHA DE APERTURA</label>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <input
                                        type="date"
                                        value={filterDate}
                                        onChange={e => setFilterDate(e.target.value)}
                                        style={{
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            background: 'var(--input-bg)',
                                            border: '1px solid var(--input-border)',
                                            color: 'var(--text-color)',
                                            fontSize: '0.95em'
                                        }}
                                    />
                                    {filterDate && (
                                        <button
                                            onClick={() => setFilterDate("")}
                                            style={{
                                                padding: '0.75rem 1rem',
                                                borderRadius: '0.5rem',
                                                background: 'rgba(239, 68, 68, 0.15)',
                                                color: 'var(--danger-color)',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                fontSize: '0.85em'
                                            }}
                                        >
                                            Limpiar
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div style={{
                                flex: 1,
                                minWidth: '250px',
                                fontSize: '0.85em',
                                color: 'var(--text-secondary)',
                                paddingLeft: '1.5rem',
                                borderLeft: '1px solid var(--card-border)',
                                lineHeight: '1.6'
                            }}>
                                Busca resúmenes ejecutivos históricos por la fecha de apertura del turno. Consulta los gráficos de ventas, productos demandados y recaudación de cada cajero para auditorías y revisiones de caja.
                            </div>
                        </div>
                    )}

                    {/* LISTA ACORDEÓN DE TURNOS */}
                    {organizedShifts.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5em 1em', opacity: 0.6, fontStyle: 'italic' }}>
                            <span style={{ fontSize: '2em', display: 'block', marginBottom: '0.5em', fontStyle: 'normal' }}>📅</span>
                            No hay turnos registrados que coincidan con la fecha seleccionada.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {organizedShifts.map(shift => {
                                const isCurrent = shift.id === currentShiftId;
                                const shiftOrders = history.filter(o => o.shiftId === shift.id);
                                const shiftStats = calculateShiftStats(shiftOrders, shift, currentTime, isCurrent && isShiftOpen);
                                const isOpen = expandedShifts.has(shift.id);
                                const label = getShiftLabel(shift, isCurrent);

                                return (
                                    <div
                                        key={shift.id}
                                        style={{
                                            background: 'var(--card-bg)',
                                            borderRadius: '12px',
                                            border: isCurrent
                                                ? '1px solid rgba(34, 197, 94, 0.35)'
                                                : '1px solid var(--card-border)',
                                            overflow: 'hidden',
                                            boxShadow: isCurrent ? '0 4px 20px rgba(34, 197, 94, 0.1)' : 'none',
                                            transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                                        }}
                                    >
                                        {/* Encabezado del acordeón */}
                                        <div
                                            onClick={() => toggleShift(shift.id)}
                                            style={{
                                                padding: '1.25rem 1.75rem',
                                                background: isOpen
                                                    ? 'var(--card-hover-bg)'
                                                    : isCurrent
                                                        ? 'rgba(34, 197, 94, 0.05)'
                                                        : 'transparent',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                flexWrap: 'wrap',
                                                gap: '1rem',
                                                transition: 'background 0.2s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                                                <span style={{
                                                    fontSize: '1.1em',
                                                    fontWeight: 'bold',
                                                    color: isCurrent ? 'var(--success-color)' : 'var(--text-color)'
                                                }}>
                                                    {label}
                                                </span>

                                                {/* Insignia de Tickets */}
                                                <span style={{
                                                    fontSize: '0.82em',
                                                    color: 'var(--text-secondary)',
                                                    fontWeight: 500,
                                                    background: 'rgba(255, 255, 255, 0.05)',
                                                    padding: '0.2em 0.6em',
                                                    borderRadius: '6px'
                                                }}>
                                                    {shiftOrders.length} {shiftOrders.length === 1 ? 'ticket' : 'tickets'}
                                                </span>

                                                {/* Total recaudado */}
                                                <span style={{
                                                    fontSize: '0.85em',
                                                    fontWeight: 800,
                                                    color: '#4ade80',
                                                    background: 'rgba(34, 197, 94, 0.12)',
                                                    border: '1px solid rgba(34, 197, 94, 0.25)',
                                                    padding: '0.2em 0.7em',
                                                    borderRadius: '6px'
                                                }}>
                                                    {formatCurrency(shiftStats.totalSales)}
                                                </span>

                                                {/* Estado del turno */}
                                                {isCurrent && isShiftOpen && (
                                                    <span style={{
                                                        fontSize: '0.75em',
                                                        fontWeight: 800,
                                                        color: 'var(--success-color)',
                                                        background: 'rgba(34, 197, 94, 0.15)',
                                                        border: '1px solid rgba(34, 197, 94, 0.3)',
                                                        padding: '0.15em 0.55em',
                                                        borderRadius: '5px',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.04em'
                                                    }}>
                                                        ● Activo
                                                    </span>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span style={{
                                                    transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                                                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    color: 'var(--text-secondary)',
                                                    fontSize: '12px',
                                                    display: 'inline-block'
                                                }}>
                                                    ▼
                                                </span>
                                            </div>
                                        </div>

                                        {/* Contenido del acordeón: Resumen Ejecutivo del Turno */}
                                        {isOpen && (
                                            <div style={{
                                                padding: '1.75em',
                                                borderTop: '1px solid var(--card-border)',
                                                background: 'rgba(10, 16, 30, 0.65)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '1.5em'
                                            }}>
                                                {/* Barra superior del turno expandido con botón para ver pantalla completa */}
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    flexWrap: "wrap",
                                                    gap: "0.75em",
                                                    paddingBottom: "0.75em",
                                                    borderBottom: "1px solid rgba(255, 255, 255, 0.06)"
                                                }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75em", flexWrap: "wrap" }}>
                                                        <span style={{
                                                            padding: "0.3em 0.8em",
                                                            borderRadius: "8px",
                                                            background: (isCurrent && isShiftOpen) ? "rgba(34, 197, 94, 0.15)" : "rgba(148, 163, 184, 0.15)",
                                                            color: (isCurrent && isShiftOpen) ? "var(--success-color)" : "var(--text-secondary)",
                                                            fontWeight: 700,
                                                            fontSize: "0.8em",
                                                            border: `1px solid ${(isCurrent && isShiftOpen) ? "rgba(34,197,94,0.3)" : "rgba(148,163,184,0.25)"}`
                                                        }}>
                                                            {(isCurrent && isShiftOpen) ? "🟢 Turno en Curso" : "⚪ Turno Cerrado"}
                                                        </span>
                                                        {shiftStats.durationText && (
                                                            <span style={{ fontSize: "0.82em", color: "var(--text-secondary)" }}>
                                                                ⏱ Duración: <strong style={{ color: "var(--text-color)" }}>{shiftStats.durationText}</strong>
                                                            </span>
                                                        )}
                                                        <span style={{ fontSize: "0.82em", color: "var(--text-secondary)" }}>
                                                            🧾 {shiftStats.totalOrders} órdenes procesadas
                                                        </span>
                                                    </div>

                                                    {/* Botón para inspeccionar este turno a pantalla completa */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onInspectShift(shift.id);
                                                        }}
                                                        style={{
                                                            padding: "0.55em 1.15em",
                                                            borderRadius: "8px",
                                                            border: "1px solid rgba(59, 130, 246, 0.4)",
                                                            background: "linear-gradient(135deg, rgba(37, 99, 235, 0.25), rgba(79, 70, 229, 0.3))",
                                                            color: "#93c5fd",
                                                            cursor: "pointer",
                                                            fontWeight: 700,
                                                            fontSize: "0.84em",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "0.5em",
                                                            transition: "all 0.2s ease"
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = "linear-gradient(135deg, rgba(37, 99, 235, 0.45), rgba(79, 70, 229, 0.5))"}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = "linear-gradient(135deg, rgba(37, 99, 235, 0.25), rgba(79, 70, 229, 0.3))"}
                                                    >
                                                        <span>📊</span> Ver Resumen Ejecutivo Completo →
                                                    </button>
                                                </div>

                                                {/* Vista ejecutiva limpia con KPIs, gráficos y ventas por usuario */}
                                                <ShiftExecutiveSummaryView
                                                    stats={shiftStats}
                                                    shift={shift}
                                                    isCurrent={isCurrent && isShiftOpen}
                                                    textScale={textScale}
                                                    gradientId={`histWave-${shift.id}`}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
