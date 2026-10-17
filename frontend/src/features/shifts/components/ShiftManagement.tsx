import { useState, useMemo, useEffect } from "react";
import type { User, Shift, Order, UIScale, LayoutOrientation } from "../../../types";
import SettingsControls from "../../../components/ui/SettingsControls";
import { formatCurrency } from "../../../utils/currencyUtils";
import { getShiftLabel } from "../../../utils/dateUtils";
import { calculateShiftStats } from "../utils/shiftStatsUtils";
import ShiftExecutiveSummaryView from "./ShiftExecutiveSummaryView";
import ShiftSummaryHistory from "./ShiftSummaryHistory";

type Props = {
    user: User;
    back: () => void;
    isShiftOpen: boolean;
    shifts: Shift[];
    setShifts: (shifts: Shift[]) => void;
    currentShiftId: string | null;
    setCurrentShiftId: (id: string | null) => void;
    history: Order[];
    uiScale: UIScale;
    setUiScale: (s: UIScale) => void;
    layoutOrientation: LayoutOrientation;
    setLayoutOrientation: (o: LayoutOrientation) => void;
    logAction: (action: import('../../../types').AuditAction, details: string, entityId?: string) => void;
};

export default function ShiftManagement({
    user, back, isShiftOpen, shifts, setShifts, currentShiftId, setCurrentShiftId, history,
    uiScale, setUiScale, layoutOrientation, setLayoutOrientation, logAction
}: Props) {
    const [activeView, setActiveView] = useState<'controls' | 'analytics' | 'history'>('controls');
    const [inspectedShiftId, setInspectedShiftId] = useState<string | null>(null);

    const [isVerifying, setIsVerifying] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [verifyAction, setVerifyAction] = useState<'start' | 'end' | null>(null);
    const [error, setError] = useState("");
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const textScale = uiScale === 'small' ? 0.85 : uiScale === 'large' ? 1.25 : 1;

    // Actualizar reloj de duración del turno de manera pura cada minuto
    useEffect(() => {
        if (!isShiftOpen) return;
        const timer = setInterval(() => {
            setCurrentTime(Date.now());
        }, 60000);
        return () => clearInterval(timer);
    }, [isShiftOpen]);

    // Turno activo o inspeccionado
    const activeShift = useMemo(() => {
        return shifts.find(s => s.id === currentShiftId);
    }, [shifts, currentShiftId]);

    const inspectedShift = useMemo(() => {
        if (!inspectedShiftId) return null;
        return shifts.find(s => s.id === inspectedShiftId) || null;
    }, [shifts, inspectedShiftId]);

    const effectiveShift = inspectedShift || activeShift;

    // Cálculo de órdenes del turno efectivo (inspeccionado o actual)
    const effectiveOrders = useMemo(() => {
        const targetId = effectiveShift?.id || currentShiftId;
        if (!targetId) return [];
        return history.filter(o => o.shiftId === targetId);
    }, [history, effectiveShift, currentShiftId]);

    const stats = useMemo(() => {
        return calculateShiftStats(
            effectiveOrders,
            effectiveShift,
            currentTime,
            !inspectedShiftId && isShiftOpen
        );
    }, [effectiveOrders, effectiveShift, currentTime, inspectedShiftId, isShiftOpen]);

    const handleShiftAction = (action: 'start' | 'end') => {
        setVerifyAction(action);
        setIsVerifying(true);
        setPasswordInput("");
        setError("");
    };

    const confirmShiftAction = () => {
        if (passwordInput === user.password) {
            if (verifyAction === 'start') {
                const newShift: Shift = {
                    id: crypto.randomUUID(),
                    startTime: new Date().toISOString()
                };
                setShifts([newShift, ...shifts]);
                setCurrentShiftId(newShift.id);
                logAction('shift_open', `Turno iniciado por ${user.username}`, newShift.id);
            } else {
                if (currentShiftId) {
                    setShifts(shifts.map(s =>
                        s.id === currentShiftId
                            ? { ...s, endTime: new Date().toISOString() }
                            : s
                    ));
                    logAction('shift_close', `Turno cerrado por ${user.username}`, currentShiftId);
                    setCurrentShiftId(null);
                }
            }
            setIsVerifying(false);
            setVerifyAction(null);
            setPasswordInput("");
        } else {
            setError("Contraseña incorrecta");
        }
    };

    // Si la vista activa es el Historial de Resúmenes, delegar a su componente dedicado
    if (activeView === 'history') {
        return (
            <ShiftSummaryHistory
                shifts={shifts}
                currentShiftId={currentShiftId}
                isShiftOpen={isShiftOpen}
                history={history}
                currentTime={currentTime}
                textScale={textScale}
                uiScale={uiScale}
                setUiScale={setUiScale}
                layoutOrientation={layoutOrientation}
                setLayoutOrientation={setLayoutOrientation}
                onBack={() => {
                    setInspectedShiftId(null);
                    setActiveView('analytics');
                }}
                onInspectShift={(shiftId) => {
                    setInspectedShiftId(shiftId);
                    setActiveView('analytics');
                }}
            />
        );
    }

    return (
        <div className={`scale-${uiScale}`}>
            <div className="page-container">
                {/* Barra superior de navegación y estado */}
                <div className="title-bar">
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75em' }}>
                        {activeView === 'controls' ? (
                            <button onClick={back} className="btn-back">← Volver al panel</button>
                        ) : (
                            inspectedShiftId ? (
                                <button onClick={() => { setInspectedShiftId(null); setActiveView('history'); }} className="btn-back">← Volver al Historial</button>
                            ) : (
                                <button onClick={() => setActiveView('controls')} className="btn-back">← Volver a Controles</button>
                            )
                        )}
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

                {/* Título de la vista activa */}
                <h1 className="page-main-title">
                    {activeView === 'controls'
                        ? "GESTIÓN DE TURNO"
                        : inspectedShiftId
                            ? "RESUMEN EJECUTIVO (HISTÓRICO)"
                            : "RESUMEN EJECUTIVO DEL TURNO"}
                </h1>

                {/* VISTA 1: CONTROLES DE TURNO (LAYOUT HORIZONTAL LIMPIO Y ESPACIOSO) */}
                {activeView === 'controls' && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5em" }}>
                        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1.5em" }}>
                            {/* Cabecera de la ficha */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--card-border)", paddingBottom: "1em", flexWrap: "wrap", gap: "0.75em" }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.25em", display: "flex", alignItems: "center", gap: "0.5em" }}>
                                        <span>⚙️</span> Panel de Operación y Control de Turno
                                    </h3>
                                    <p style={{ margin: "0.25em 0 0 0", fontSize: "0.82em", color: "var(--text-secondary)" }}>
                                        Administra la sesión de caja y consulta las métricas comerciales
                                    </p>
                                </div>
                                <span style={{
                                    fontSize: "0.8em",
                                    padding: "0.3em 0.8em",
                                    borderRadius: "8px",
                                    background: isShiftOpen ? "rgba(34, 197, 94, 0.15)" : "rgba(148, 163, 184, 0.15)",
                                    color: isShiftOpen ? "var(--success-color)" : "var(--text-secondary)",
                                    fontWeight: 700,
                                    border: `1px solid ${isShiftOpen ? "rgba(34,197,94,0.3)" : "rgba(148,163,184,0.25)"}`
                                }}>
                                    {isShiftOpen ? "🟢 Turno en Curso" : "⚪ Turno Cerrado"}
                                </span>
                            </div>

                            {/* Mini métricas horizontales rápidas */}
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
                                gap: "1em"
                            }}>
                                <div style={{ background: "rgba(15, 23, 42, 0.4)", padding: "1em 1.2em", borderRadius: "0.85em", border: "1px solid var(--card-border)" }}>
                                    <div style={{ color: "var(--text-secondary)", fontSize: "0.75em", fontWeight: 700, textTransform: "uppercase" }}>💰 Ventas del Turno</div>
                                    <div style={{ color: "var(--success-color)", fontSize: "1.5em", fontWeight: 800, marginTop: "0.2em" }}>{formatCurrency(stats.totalSales)}</div>
                                </div>
                                <div style={{ background: "rgba(15, 23, 42, 0.4)", padding: "1em 1.2em", borderRadius: "0.85em", border: "1px solid var(--card-border)" }}>
                                    <div style={{ color: "var(--text-secondary)", fontSize: "0.75em", fontWeight: 700, textTransform: "uppercase" }}>📦 Artículos Vendidos</div>
                                    <div style={{ color: "var(--primary-color)", fontSize: "1.5em", fontWeight: 800, marginTop: "0.2em" }}>{stats.totalItemsSold} uds</div>
                                </div>
                                <div style={{ background: "rgba(15, 23, 42, 0.4)", padding: "1em 1.2em", borderRadius: "0.85em", border: "1px solid var(--card-border)" }}>
                                    <div style={{ color: "var(--text-secondary)", fontSize: "0.75em", fontWeight: 700, textTransform: "uppercase" }}>🧾 Tickets Emitidos</div>
                                    <div style={{ color: "var(--text-color)", fontSize: "1.5em", fontWeight: 800, marginTop: "0.2em" }}>{stats.totalOrders} tickets</div>
                                </div>
                                <div style={{ background: "rgba(15, 23, 42, 0.4)", padding: "1em 1.2em", borderRadius: "0.85em", border: "1px solid var(--card-border)" }}>
                                    <div style={{ color: "var(--text-secondary)", fontSize: "0.75em", fontWeight: 700, textTransform: "uppercase" }}>⏱ Duración Activa</div>
                                    <div style={{ color: "#fbbf24", fontSize: "1.5em", fontWeight: 800, marginTop: "0.2em" }}>{stats.durationText || (isShiftOpen ? 'Menos de 1m' : 'Inactivo')}</div>
                                </div>
                            </div>

                            {/* Barra de Acciones Principales (Horizontal y prominente) */}
                            {isVerifying ? (
                                <div style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.85em",
                                    background: "rgba(15, 23, 42, 0.6)",
                                    padding: "1.3em",
                                    borderRadius: "1em",
                                    border: "1px solid var(--card-border)"
                                }}>
                                    <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.95em" }}>
                                        Confirma tu contraseña de usuario para <strong>{verifyAction === 'start' ? 'iniciar' : 'finalizar'}</strong> el turno:
                                    </p>
                                    <input
                                        type="password"
                                        placeholder="Contraseña de usuario"
                                        autoFocus
                                        value={passwordInput}
                                        onChange={(e) => setPasswordInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && confirmShiftAction()}
                                        style={{
                                            padding: "0.85em 1em",
                                            borderRadius: "8px",
                                            border: "1px solid var(--input-border)",
                                            background: "var(--input-bg)",
                                            color: "var(--text-color)",
                                            fontSize: "1em",
                                            maxWidth: "400px"
                                        }}
                                    />
                                    <div style={{ display: "flex", gap: "0.75em", maxWidth: "400px" }}>
                                        <button
                                            onClick={confirmShiftAction}
                                            style={{
                                                flex: 1,
                                                padding: "0.85em",
                                                borderRadius: "8px",
                                                border: "none",
                                                background: verifyAction === 'start' ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #ef4444, #dc2626)",
                                                color: "white",
                                                fontWeight: 800,
                                                cursor: "pointer",
                                                boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                                            }}
                                        >
                                            Confirmar
                                        </button>
                                        <button
                                            onClick={() => setIsVerifying(false)}
                                            style={{
                                                flex: 1,
                                                padding: "0.85em",
                                                borderRadius: "8px",
                                                border: "1px solid var(--card-border)",
                                                background: "var(--card-hover-bg)",
                                                color: "var(--text-color)",
                                                cursor: "pointer",
                                                fontWeight: 600
                                            }}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                    {error && <p style={{ color: "var(--danger-color)", margin: 0, fontSize: "0.85em", fontWeight: 700 }}>⚠️ {error}</p>}
                                </div>
                            ) : (
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
                                    gap: "1.2em",
                                    alignItems: "stretch"
                                }}>
                                    {/* Botón de Iniciar / Finalizar Turno */}
                                    {!isShiftOpen ? (
                                        <button
                                            onClick={() => handleShiftAction('start')}
                                            style={{
                                                padding: "1.25em 1.5em",
                                                borderRadius: "1em",
                                                border: "none",
                                                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                                color: "white",
                                                fontSize: "1.05em",
                                                fontWeight: "800",
                                                cursor: "pointer",
                                                boxShadow: "0 8px 24px rgba(34, 197, 94, 0.35)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "0.6em",
                                                transition: "transform 0.15s ease, box-shadow 0.15s ease"
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <span style={{ fontSize: "1.2em" }}>▶</span> Iniciar Nuevo Turno
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleShiftAction('end')}
                                            style={{
                                                padding: "1.25em 1.5em",
                                                borderRadius: "1em",
                                                border: "none",
                                                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                                                color: "white",
                                                fontSize: "1.05em",
                                                fontWeight: "800",
                                                cursor: "pointer",
                                                boxShadow: "0 8px 24px rgba(239, 68, 68, 0.35)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "0.6em",
                                                transition: "transform 0.15s ease, box-shadow 0.15s ease"
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <span style={{ fontSize: "1.2em" }}>⏹</span> Finalizar Turno Actual
                                        </button>
                                    )}

                                    {/* Botón Prominente para Abrir el Resumen Ejecutivo */}
                                    <button
                                        onClick={() => {
                                            setInspectedShiftId(null);
                                            setActiveView('analytics');
                                        }}
                                        style={{
                                            padding: "1.25em 1.5em",
                                            borderRadius: "1em",
                                            border: "1px solid rgba(59, 130, 246, 0.4)",
                                            background: "linear-gradient(135deg, #2563eb, #4f46e5)",
                                            color: "white",
                                            fontSize: "1.05em",
                                            fontWeight: "800",
                                            cursor: "pointer",
                                            boxShadow: "0 8px 24px rgba(59, 130, 246, 0.35)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: "0.75em",
                                            transition: "transform 0.15s ease, box-shadow 0.15s ease"
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.6em" }}>
                                            <span style={{ fontSize: "1.2em" }}>📊</span>
                                            <span>Ver Resumen Ejecutivo del Turno</span>
                                        </div>
                                        <span style={{
                                            fontSize: "0.78em",
                                            padding: "0.25em 0.6em",
                                            borderRadius: "6px",
                                            background: "rgba(255, 255, 255, 0.2)",
                                            color: "#fff",
                                            fontWeight: 700
                                        }}>
                                            Abrir →
                                        </span>
                                    </button>

                                    {/* Botón para Abrir el Historial de Resúmenes */}
                                    <button
                                        onClick={() => {
                                            setInspectedShiftId(null);
                                            setActiveView('history');
                                        }}
                                        style={{
                                            padding: "1.25em 1.5em",
                                            borderRadius: "1em",
                                            border: "1px solid rgba(139, 92, 246, 0.4)",
                                            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(79, 70, 229, 0.35))",
                                            color: "white",
                                            fontSize: "1.05em",
                                            fontWeight: "800",
                                            cursor: "pointer",
                                            boxShadow: "0 8px 24px rgba(139, 92, 246, 0.25)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: "0.75em",
                                            transition: "transform 0.15s ease, box-shadow 0.15s ease"
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.6em" }}>
                                            <span style={{ fontSize: "1.2em" }}>📜</span>
                                            <span>Historial de Resúmenes de Turno</span>
                                        </div>
                                        <span style={{
                                            fontSize: "0.78em",
                                            padding: "0.25em 0.6em",
                                            borderRadius: "6px",
                                            background: "rgba(255, 255, 255, 0.2)",
                                            color: "#fff",
                                            fontWeight: 700
                                        }}>
                                            Explorar →
                                        </span>
                                    </button>
                                </div>
                            )}

                            {/* Ficha operativa horizontal en rejilla limpia */}
                            <div style={{
                                background: "rgba(15, 23, 42, 0.35)",
                                border: "1px solid var(--card-border)",
                                borderRadius: "0.85em",
                                padding: "1.25em",
                                display: "flex",
                                flexDirection: "column",
                                gap: "1em"
                            }}>
                                <div style={{ fontSize: "0.75em", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)", fontWeight: 700 }}>
                                    Detalles Operativos de la Sesión
                                </div>
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
                                    gap: "1.2em"
                                }}>
                                    <div>
                                        <div style={{ color: "var(--text-secondary)", fontSize: "0.8em" }}>Responsable en Caja:</div>
                                        <div style={{ fontWeight: 700, color: "var(--text-color)", fontSize: "0.95em", marginTop: "0.2em" }}>
                                            {user.username} <span style={{ opacity: 0.6, fontSize: "0.85em" }}>({user.role.toUpperCase()})</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ color: "var(--text-secondary)", fontSize: "0.8em" }}>Hora de Inicio:</div>
                                        <div style={{ fontWeight: 600, color: "var(--text-color)", fontSize: "0.95em", marginTop: "0.2em" }}>
                                            {activeShift?.startTime ? new Date(activeShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '---'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ color: "var(--text-secondary)", fontSize: "0.8em" }}>Fecha de Apertura:</div>
                                        <div style={{ fontWeight: 600, color: "var(--text-color)", fontSize: "0.95em", marginTop: "0.2em" }}>
                                            {activeShift?.startTime ? new Date(activeShift.startTime).toLocaleDateString() : '---'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ color: "var(--text-secondary)", fontSize: "0.8em" }}>Identificador de Turno:</div>
                                        <div style={{ fontFamily: "monospace", fontSize: "0.85em", color: "var(--primary-color)", marginTop: "0.2em" }}>
                                            {currentShiftId ? `#${currentShiftId.slice(0, 8)}` : 'Sin asignar'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ color: "var(--text-secondary)", fontSize: "0.8em" }}>Personal con Ventas:</div>
                                        <div style={{ fontWeight: 700, color: "var(--text-color)", fontSize: "0.95em", marginTop: "0.2em" }}>
                                            {stats.chartData.length} miembros activos
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ color: "var(--text-secondary)", fontSize: "0.8em" }}>Ticket Promedio:</div>
                                        <div style={{ fontWeight: 700, color: "#fbbf24", fontSize: "0.95em", marginTop: "0.2em" }}>
                                            {formatCurrency(stats.averageTicket)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* VISTA 2: RESUMEN EJECUTIVO (ACTUAL O INSPECCIONADO) */}
                {activeView === 'analytics' && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5em" }}>
                        {/* Banner de Inspección si se está viendo un turno histórico */}
                        {inspectedShiftId && inspectedShift && (
                            <div style={{
                                background: "rgba(59, 130, 246, 0.12)",
                                border: "1px solid rgba(59, 130, 246, 0.35)",
                                borderRadius: "12px",
                                padding: "1em 1.4em",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: "0.85em",
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75em" }}>
                                    <span style={{ fontSize: "1.5em" }}>🔍</span>
                                    <div>
                                        <div style={{ fontWeight: 800, color: "#93c5fd", fontSize: "1em" }}>
                                            Visualizando Resumen de Turno Histórico: {getShiftLabel(inspectedShift)}
                                        </div>
                                        <div style={{ fontSize: "0.82em", color: "var(--text-secondary)", marginTop: "0.15em" }}>
                                            {inspectedShift.endTime
                                                ? `Turno cerrado (${new Date(inspectedShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ${new Date(inspectedShift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
                                                : 'Turno activo sin cierre registrado'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "0.65em", alignItems: "center" }}>
                                    <button
                                        onClick={() => {
                                            setInspectedShiftId(null);
                                            setActiveView('history');
                                        }}
                                        style={{
                                            padding: "0.55em 1.1em",
                                            borderRadius: "8px",
                                            border: "1px solid rgba(59, 130, 246, 0.4)",
                                            background: "rgba(59, 130, 246, 0.2)",
                                            color: "#93c5fd",
                                            cursor: "pointer",
                                            fontSize: "0.85em",
                                            fontWeight: 700,
                                            transition: "background 0.2s"
                                        }}
                                    >
                                        ← Volver al Historial
                                    </button>
                                    <button
                                        onClick={() => setInspectedShiftId(null)}
                                        style={{
                                            padding: "0.55em 1.1em",
                                            borderRadius: "8px",
                                            border: "1px solid rgba(34, 197, 94, 0.4)",
                                            background: "rgba(34, 197, 94, 0.2)",
                                            color: "#86efac",
                                            cursor: "pointer",
                                            fontSize: "0.85em",
                                            fontWeight: 700,
                                            transition: "background 0.2s"
                                        }}
                                    >
                                        Ver Turno Actual
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1.75em" }}>
                            {/* Cabecera del Resumen */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75em" }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.3em" }}>
                                        {inspectedShiftId ? "Resumen Ejecutivo del Turno Seleccionado" : "Rendimiento Comercial y Analítica en Tiempo Real"}
                                    </h3>
                                    <p style={{ margin: "0.25em 0 0 0", fontSize: "0.85em", color: "var(--text-secondary)" }}>
                                        {inspectedShiftId
                                            ? "Métricas de facturación, demanda por artículo y recaudación por usuario para este turno"
                                            : "Monitoreo de ingresos, demanda por artículo y ventas por integrante del equipo"}
                                    </p>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "0.65em", flexWrap: "wrap" }}>
                                    {/* Botón para ir al Historial de Resúmenes */}
                                    <button
                                        onClick={() => {
                                            setInspectedShiftId(null);
                                            setActiveView('history');
                                        }}
                                        style={{
                                            padding: "0.6em 1.1em",
                                            borderRadius: "8px",
                                            border: "1px solid rgba(59, 130, 246, 0.4)",
                                            background: "linear-gradient(135deg, rgba(37, 99, 235, 0.25), rgba(79, 70, 229, 0.3))",
                                            color: "#93c5fd",
                                            cursor: "pointer",
                                            fontWeight: 700,
                                            fontSize: "0.85em",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5em",
                                            transition: "all 0.2s ease"
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "linear-gradient(135deg, rgba(37, 99, 235, 0.45), rgba(79, 70, 229, 0.5))"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = "linear-gradient(135deg, rgba(37, 99, 235, 0.25), rgba(79, 70, 229, 0.3))"}
                                    >
                                        <span>📜</span> Historial de Resúmenes
                                    </button>

                                    {/* Botón para volver a Controles */}
                                    <button
                                        onClick={() => {
                                            setInspectedShiftId(null);
                                            setActiveView('controls');
                                        }}
                                        style={{
                                            padding: "0.6em 1.1em",
                                            borderRadius: "8px",
                                            border: "1px solid var(--card-border)",
                                            background: "var(--card-hover-bg)",
                                            color: "var(--text-color)",
                                            cursor: "pointer",
                                            fontWeight: 700,
                                            fontSize: "0.85em",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5em"
                                        }}
                                    >
                                        <span>⚙️</span> Controles de Turno
                                    </button>
                                </div>
                            </div>

                            {/* Contenido Visual Completo */}
                            <ShiftExecutiveSummaryView
                                stats={stats}
                                shift={effectiveShift}
                                isCurrent={!inspectedShiftId && isShiftOpen}
                                textScale={textScale}
                                gradientId="mainExecutiveWave"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
