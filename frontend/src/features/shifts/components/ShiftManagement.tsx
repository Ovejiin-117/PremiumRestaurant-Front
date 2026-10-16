import { useState, useMemo, useEffect } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import type { User, Shift, Order, UIScale, LayoutOrientation } from "../../../types";
import SettingsControls from "../../../components/ui/SettingsControls";

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

const USER_COLORS = [
    '#38bdf8', // Celeste / Cyan
    '#34d399', // Esmeralda
    '#fbbf24', // Ámbar dorado
    '#f87171', // Coral / Salmón
    '#a78bfa', // Violeta / Lavanda
    '#f472b6', // Rosa vibrante
    '#818cf8', // Índigo moderno
    '#2dd4bf', // Turquesa
];

interface CustomPieTooltipProps {
    active?: boolean;
    payload?: Array<{ name: string; value: number; payload: { fill?: string } }>;
    totalSales: number;
}

function CustomPieTooltip({ active, payload, totalSales }: CustomPieTooltipProps) {
    if (active && payload && payload.length) {
        const data = payload[0];
        const percent = totalSales > 0 ? ((data.value / totalSales) * 100).toFixed(1) : '0';
        return (
            <div style={{
                background: 'rgba(11, 18, 32, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '0.7em 1em',
                borderRadius: '0.75em',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                color: '#fff',
                fontSize: '0.85em',
                minWidth: '160px'
            }}>
                <div style={{ fontWeight: 700, marginBottom: '0.3em', display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: data.payload?.fill || '#38bdf8', display: 'inline-block' }} />
                    {data.name}
                </div>
                <div style={{ color: 'var(--primary-color)', fontWeight: 800, fontSize: '1.15em' }}>
                    ${Number(data.value).toFixed(2)}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8em', marginTop: '0.25em' }}>
                    {percent}% de la recaudación
                </div>
            </div>
        );
    }
    return null;
}

interface CustomBarTooltipProps {
    active?: boolean;
    payload?: Array<{ payload: { name: string; quantity: number; total: number } }>;
}

function CustomBarTooltip({ active, payload }: CustomBarTooltipProps) {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div style={{
                background: 'rgba(11, 18, 32, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '0.7em 1em',
                borderRadius: '0.75em',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                color: '#fff',
                fontSize: '0.85em',
                minWidth: '180px'
            }}>
                <div style={{ fontWeight: 700, marginBottom: '0.4em', color: '#fff', fontSize: '0.95em' }}>
                    {data.name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1em', color: 'var(--text-secondary)', marginBottom: '0.2em' }}>
                    <span>Unidades:</span>
                    <strong style={{ color: 'var(--text-color)' }}>{data.quantity} uds</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1em', color: 'var(--text-secondary)' }}>
                    <span>Total vendido:</span>
                    <strong style={{ color: 'var(--success-color)' }}>${Number(data.total).toFixed(2)}</strong>
                </div>
            </div>
        );
    }
    return null;
}

export default function ShiftManagement({
    user, back, isShiftOpen, shifts, setShifts, currentShiftId, setCurrentShiftId, history,
    uiScale, setUiScale, layoutOrientation, setLayoutOrientation, logAction
}: Props) {
    const [activeView, setActiveView] = useState<'controls' | 'analytics'>('controls');
    const [isVerifying, setIsVerifying] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [verifyAction, setVerifyAction] = useState<'start' | 'end' | null>(null);
    const [error, setError] = useState("");
    const [productViewMode, setProductViewMode] = useState<'ranking' | 'chart'>('ranking');
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

    // Cálculo de órdenes del turno actual
    const currentShiftOrders = useMemo(() => {
        if (!currentShiftId) return [];
        return history.filter(o => o.shiftId === currentShiftId);
    }, [history, currentShiftId]);

    const activeShift = useMemo(() => {
        return shifts.find(s => s.id === currentShiftId);
    }, [shifts, currentShiftId]);

    const shiftDurationText = useMemo(() => {
        if (!activeShift?.startTime || !isShiftOpen) return null;
        const start = new Date(activeShift.startTime).getTime();
        const diffMins = Math.max(0, Math.floor((currentTime - start) / (1000 * 60)));
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        if (hours === 0) return `${mins} min`;
        return `${hours}h ${mins}m`;
    }, [activeShift, isShiftOpen, currentTime]);

    const stats = useMemo(() => {
        const totalSales = currentShiftOrders.reduce((acc, o) => acc + o.total, 0);
        const totalOrders = currentShiftOrders.length;
        const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

        const salesByUser: Record<string, { total: number, items: Record<string, { quantity: number, totalPrice: number }> }> = {};
        const allItems: Record<string, { quantity: number, totalPrice: number }> = {};
        let totalItemsSold = 0;

        currentShiftOrders.forEach(order => {
            if (!salesByUser[order.orderedBy]) {
                salesByUser[order.orderedBy] = { total: 0, items: {} };
            }
            salesByUser[order.orderedBy].total += order.total;
            order.items.forEach(item => {
                // Artículos por usuario
                if (!salesByUser[order.orderedBy].items[item.name]) {
                    salesByUser[order.orderedBy].items[item.name] = { quantity: 0, totalPrice: 0 };
                }
                salesByUser[order.orderedBy].items[item.name].quantity += item.quantity;
                salesByUser[order.orderedBy].items[item.name].totalPrice += item.quantity * item.price;

                // Todos los artículos agregados
                if (!allItems[item.name]) {
                    allItems[item.name] = { quantity: 0, totalPrice: 0 };
                }
                allItems[item.name].quantity += item.quantity;
                allItems[item.name].totalPrice += item.quantity * item.price;

                totalItemsSold += item.quantity;
            });
        });

        const chartData = Object.entries(salesByUser)
            .map(([name, data]) => ({ name, value: data.total }))
            .sort((a, b) => b.value - a.value);

        const itemChartData = Object.entries(allItems)
            .map(([name, data]) => ({ name, quantity: data.quantity, total: data.totalPrice }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        const maxItemQty = itemChartData.length > 0 ? Math.max(...itemChartData.map(i => i.quantity)) : 1;

        return {
            totalSales,
            totalOrders,
            averageTicket,
            chartData,
            itemChartData,
            maxItemQty,
            salesByUser,
            totalItemsSold,
            allItems
        };
    }, [currentShiftOrders]);

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

    return (
        <div className={`scale-${uiScale}`}>
            <div className="page-container">
                {/* Barra superior de navegación y estado */}
                <div className="title-bar">
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75em' }}>
                        {activeView === 'controls' ? (
                            <button onClick={back} className="btn-back">← Volver al panel</button>
                        ) : (
                            <button onClick={() => setActiveView('controls')} className="btn-back">← Volver a Controles</button>
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
                    {activeView === 'controls' ? "GESTIÓN DE TURNO" : "RESUMEN EJECUTIVO DEL TURNO"}
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
                                    <div style={{ color: "var(--success-color)", fontSize: "1.5em", fontWeight: 800, marginTop: "0.2em" }}>${stats.totalSales.toFixed(2)}</div>
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
                                    <div style={{ color: "#fbbf24", fontSize: "1.5em", fontWeight: 800, marginTop: "0.2em" }}>{shiftDurationText || (isShiftOpen ? 'Menos de 1m' : 'Inactivo')}</div>
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
                                        onClick={() => setActiveView('analytics')}
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
                                            ${stats.averageTicket.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* VISTA 2: RESUMEN EJECUTIVO COMPLETO (ANCHO COMPLETO HORIZONTAL, NADA SE DEFORMA) */}
                {activeView === 'analytics' && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.75em" }}>
                        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1.75em" }}>
                            
                            {/* Cabecera del Resumen */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75em" }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.3em" }}>Rendimiento Comercial y Analítica en Tiempo Real</h3>
                                    <p style={{ margin: "0.25em 0 0 0", fontSize: "0.85em", color: "var(--text-secondary)" }}>
                                        Monitoreo de ingresos, demanda por artículo y ventas por integrante del equipo
                                    </p>
                                </div>
                                <button
                                    onClick={() => setActiveView('controls')}
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

                            {/* 4 Tarjetas KPI Ejecutivas en Fila Completa Horizontal */}
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
                                gap: "1.2em"
                            }}>
                                {/* KPI 1: Ventas Totales */}
                                <div style={{
                                    background: "rgba(15, 23, 42, 0.5)",
                                    padding: "1.25em 1.4em",
                                    borderRadius: "1em",
                                    border: "1px solid rgba(34, 197, 94, 0.25)",
                                    position: "relative",
                                    overflow: "hidden"
                                }}>
                                    <div style={{
                                        position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                                        background: "linear-gradient(90deg, #22c55e, #10b981)"
                                    }} />
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.4em", marginBottom: "0.4em" }}>
                                        <span style={{ color: "var(--text-secondary)", fontSize: "0.78em", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                                            Ventas Turno
                                        </span>
                                        <span style={{ fontSize: "1.2em", flexShrink: 0 }}>💰</span>
                                    </div>
                                    <div style={{ color: "var(--text-color)", fontSize: "1.75em", fontWeight: 800, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
                                        ${stats.totalSales.toFixed(2)}
                                    </div>
                                    <div style={{ color: "var(--success-color)", fontSize: "0.78em", fontWeight: 600, marginTop: "0.3em", whiteSpace: "nowrap" }}>
                                        Recaudación activa del turno
                                    </div>
                                </div>

                                {/* KPI 2: Artículos Vendidos */}
                                <div style={{
                                    background: "rgba(15, 23, 42, 0.5)",
                                    padding: "1.25em 1.4em",
                                    borderRadius: "1em",
                                    border: "1px solid rgba(59, 130, 246, 0.25)",
                                    position: "relative",
                                    overflow: "hidden"
                                }}>
                                    <div style={{
                                        position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                                        background: "linear-gradient(90deg, #3b82f6, #06b6d4)"
                                    }} />
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.4em", marginBottom: "0.4em" }}>
                                        <span style={{ color: "var(--text-secondary)", fontSize: "0.78em", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                                            Artículos Despachados
                                        </span>
                                        <span style={{ fontSize: "1.2em", flexShrink: 0 }}>📦</span>
                                    </div>
                                    <div style={{ color: "var(--primary-color)", fontSize: "1.75em", fontWeight: 800, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
                                        {stats.totalItemsSold} uds
                                    </div>
                                    <div style={{ color: "var(--text-secondary)", fontSize: "0.78em", marginTop: "0.3em", whiteSpace: "nowrap" }}>
                                        En {stats.itemChartData.length} productos diferentes
                                    </div>
                                </div>

                                {/* KPI 3: Tickets / Órdenes */}
                                <div style={{
                                    background: "rgba(15, 23, 42, 0.5)",
                                    padding: "1.25em 1.4em",
                                    borderRadius: "1em",
                                    border: "1px solid rgba(168, 85, 247, 0.25)",
                                    position: "relative",
                                    overflow: "hidden"
                                }}>
                                    <div style={{
                                        position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                                        background: "linear-gradient(90deg, #a855f7, #6366f1)"
                                    }} />
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.4em", marginBottom: "0.4em" }}>
                                        <span style={{ color: "var(--text-secondary)", fontSize: "0.78em", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                                            Tickets Cobrados
                                        </span>
                                        <span style={{ fontSize: "1.2em", flexShrink: 0 }}>🧾</span>
                                    </div>
                                    <div style={{ color: "var(--text-color)", fontSize: "1.75em", fontWeight: 800, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
                                        {stats.totalOrders} órdenes
                                    </div>
                                    <div style={{ color: "var(--text-secondary)", fontSize: "0.78em", marginTop: "0.3em", whiteSpace: "nowrap" }}>
                                        Procesadas y cerradas
                                    </div>
                                </div>

                                {/* KPI 4: Ticket Promedio */}
                                <div style={{
                                    background: "rgba(15, 23, 42, 0.5)",
                                    padding: "1.25em 1.4em",
                                    borderRadius: "1em",
                                    border: "1px solid rgba(245, 158, 11, 0.25)",
                                    position: "relative",
                                    overflow: "hidden"
                                }}>
                                    <div style={{
                                        position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                                        background: "linear-gradient(90deg, #f59e0b, #fbbf24)"
                                    }} />
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.4em", marginBottom: "0.4em" }}>
                                        <span style={{ color: "var(--text-secondary)", fontSize: "0.78em", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                                            Ticket Promedio
                                        </span>
                                        <span style={{ fontSize: "1.2em", flexShrink: 0 }}>⚡</span>
                                    </div>
                                    <div style={{ color: "#fbbf24", fontSize: "1.75em", fontWeight: 800, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
                                        ${stats.averageTicket.toFixed(2)}
                                    </div>
                                    <div style={{ color: "var(--text-secondary)", fontSize: "0.78em", marginTop: "0.3em", whiteSpace: "nowrap" }}>
                                        Promedio por ticket
                                    </div>
                                </div>
                            </div>

                            {/* Sección de Gráficos de Doble Tarjeta en Ancho Completo */}
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
                                gap: "1.75em",
                                alignItems: "stretch"
                            }}>

                                {/* Tarjeta 1: Ventas por Usuario (Donut + desglose) */}
                                <div style={{
                                    background: "rgba(15, 23, 42, 0.5)",
                                    padding: "1.5em",
                                    borderRadius: "1.1em",
                                    border: "1px solid var(--card-border)",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between"
                                }}>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5em", marginBottom: "0.4em" }}>
                                            <h4 style={{ margin: 0, fontSize: "1.05em", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4em", whiteSpace: "nowrap" }}>
                                                <span>👥</span> VENTAS POR USUARIO
                                            </h4>
                                            <span style={{ fontSize: "0.78em", color: "var(--text-secondary)", background: "rgba(255,255,255,0.06)", padding: "0.25em 0.6em", borderRadius: "6px", whiteSpace: "nowrap", flexShrink: 0 }}>
                                                {stats.chartData.length} miembros activos
                                            </span>
                                        </div>
                                        <p style={{ margin: "0 0 1em 0", fontSize: "0.82em", color: "var(--text-secondary)" }}>
                                            Participación porcentual y volumen recaudado por cada vendedor
                                        </p>
                                    </div>

                                    {stats.chartData.length > 0 ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "1.25em" }}>
                                            {/* Gráfico Donut con métrica central */}
                                            <div style={{ position: "relative", width: "100%", height: `${Math.round(210 * textScale)}px`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={stats.chartData}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={54 * textScale}
                                                            outerRadius={80 * textScale}
                                                            paddingAngle={4}
                                                            dataKey="value"
                                                            stroke="none"
                                                        >
                                                            {stats.chartData.map((_entry, index) => (
                                                                <Cell
                                                                    key={`cell-${index}`}
                                                                    fill={USER_COLORS[index % USER_COLORS.length]}
                                                                />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip content={<CustomPieTooltip totalSales={stats.totalSales} />} />
                                                    </PieChart>
                                                </ResponsiveContainer>

                                                {/* Centro del Donut */}
                                                <div style={{
                                                    position: "absolute",
                                                    top: "50%",
                                                    left: "50%",
                                                    transform: "translate(-50%, -50%)",
                                                    textAlign: "center",
                                                    pointerEvents: "none"
                                                }}>
                                                    <div style={{ fontSize: "0.7em", color: "var(--text-secondary)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                                        Total
                                                    </div>
                                                    <div style={{ fontSize: "1.2em", fontWeight: 800, color: "var(--text-color)", lineHeight: 1.15, whiteSpace: "nowrap" }}>
                                                        ${stats.totalSales.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Desglose detallado por usuario con barras proporcionales */}
                                            <div style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "0.6em",
                                                maxHeight: "18em",
                                                overflowY: "auto",
                                                paddingRight: "0.2em"
                                            }}>
                                                {stats.chartData.map((item, index) => {
                                                    const color = USER_COLORS[index % USER_COLORS.length];
                                                    const pct = stats.totalSales > 0 ? ((item.value / stats.totalSales) * 100).toFixed(1) : '0';
                                                    return (
                                                        <div key={item.name} style={{
                                                            background: "rgba(255, 255, 255, 0.03)",
                                                            border: "1px solid rgba(255, 255, 255, 0.06)",
                                                            borderRadius: "0.7em",
                                                            padding: "0.65em 0.85em",
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            gap: "0.35em"
                                                        }}>
                                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5em" }}>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "0.55em", minWidth: "120px", flex: "1 1 auto" }}>
                                                                    <span style={{
                                                                        width: "0.7em",
                                                                        height: "0.7em",
                                                                        borderRadius: "50%",
                                                                        background: color,
                                                                        boxShadow: `0 0 6px ${color}88`,
                                                                        flexShrink: 0
                                                                    }} />
                                                                    <span style={{ fontWeight: 600, fontSize: "0.88em", color: "var(--text-color)", whiteSpace: "nowrap" }}>
                                                                        {item.name}
                                                                    </span>
                                                                </div>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "0.6em", flexShrink: 0, marginLeft: "auto" }}>
                                                                    <span style={{ fontWeight: 700, fontSize: "0.88em", color: "var(--text-color)", whiteSpace: "nowrap" }}>
                                                                        ${item.value.toFixed(2)}
                                                                    </span>
                                                                    <span style={{
                                                                        fontSize: "0.75em",
                                                                        fontWeight: 700,
                                                                        padding: "0.15em 0.5em",
                                                                        borderRadius: "5px",
                                                                        background: `${color}20`,
                                                                        color: color,
                                                                        border: `1px solid ${color}40`,
                                                                        whiteSpace: "nowrap"
                                                                    }}>
                                                                        {pct}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {/* Mini barra de progreso */}
                                                            <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                                                                <div style={{
                                                                    width: `${pct}%`,
                                                                    height: "100%",
                                                                    background: color,
                                                                    borderRadius: "2px",
                                                                    transition: "width 0.4s ease"
                                                                }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{
                                            padding: "3.5em 1em",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "var(--text-secondary)",
                                            fontSize: "0.9em",
                                            fontStyle: "italic",
                                            gap: "0.5em"
                                        }}>
                                            <span style={{ fontSize: "2.2em", fontStyle: "normal", opacity: 0.6 }}>👥</span>
                                            Sin registros de ventas por usuario
                                        </div>
                                    )}
                                </div>

                                {/* Tarjeta 2: Top Productos (Ranking con Medallas o Gráfico) */}
                                <div style={{
                                    background: "rgba(15, 23, 42, 0.5)",
                                    padding: "1.5em",
                                    borderRadius: "1.1em",
                                    border: "1px solid var(--card-border)",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between"
                                }}>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.6em", marginBottom: "0.4em" }}>
                                            <h4 style={{ margin: 0, fontSize: "1.05em", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4em", whiteSpace: "nowrap" }}>
                                                <span>🔥</span> TOP PRODUCTOS
                                            </h4>
                                            {/* Selector de vista: Ranking vs Gráfico */}
                                            <div style={{
                                                display: "inline-flex",
                                                background: "rgba(0, 0, 0, 0.35)",
                                                padding: "2px",
                                                borderRadius: "6px",
                                                border: "1px solid var(--card-border)",
                                                flexShrink: 0
                                            }}>
                                                <button
                                                    onClick={() => setProductViewMode('ranking')}
                                                    style={{
                                                        border: "none",
                                                        background: productViewMode === 'ranking' ? "var(--primary-color)" : "transparent",
                                                        color: productViewMode === 'ranking' ? "#fff" : "var(--text-secondary)",
                                                        fontSize: "0.75em",
                                                        fontWeight: 700,
                                                        padding: "0.35em 0.75em",
                                                        borderRadius: "4px",
                                                        cursor: "pointer",
                                                        transition: "all 0.15s ease"
                                                    }}
                                                >
                                                    🏆 Ranking
                                                </button>
                                                <button
                                                    onClick={() => setProductViewMode('chart')}
                                                    style={{
                                                        border: "none",
                                                        background: productViewMode === 'chart' ? "var(--primary-color)" : "transparent",
                                                        color: productViewMode === 'chart' ? "#fff" : "var(--text-secondary)",
                                                        fontSize: "0.75em",
                                                        fontWeight: 700,
                                                        padding: "0.35em 0.75em",
                                                        borderRadius: "4px",
                                                        cursor: "pointer",
                                                        transition: "all 0.15s ease"
                                                    }}
                                                >
                                                    📊 Gráfico
                                                </button>
                                            </div>
                                        </div>
                                        <p style={{ margin: "0 0 1em 0", fontSize: "0.82em", color: "var(--text-secondary)" }}>
                                            Artículos más solicitados con volumen y recaudación
                                        </p>
                                    </div>

                                    {stats.itemChartData.length > 0 ? (
                                        productViewMode === 'ranking' ? (
                                            /* Vista de Leaderboard / Ranking enriquecido */
                                            <div style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "0.65em",
                                                maxHeight: "24em",
                                                overflowY: "auto",
                                                paddingRight: "0.2em"
                                            }}>
                                                {stats.itemChartData.map((item, index) => {
                                                    const pct = (item.quantity / stats.maxItemQty) * 100;
                                                    const isTop1 = index === 0;
                                                    const isTop2 = index === 1;
                                                    const isTop3 = index === 2;

                                                    const medalBg = isTop1
                                                        ? "rgba(245, 158, 11, 0.18)"
                                                        : isTop2
                                                        ? "rgba(148, 163, 184, 0.18)"
                                                        : isTop3
                                                        ? "rgba(217, 119, 6, 0.18)"
                                                        : "rgba(255, 255, 255, 0.05)";

                                                    const medalColor = isTop1
                                                        ? "#fbbf24"
                                                        : isTop2
                                                        ? "#cbd5e1"
                                                        : isTop3
                                                        ? "#f59e0b"
                                                        : "var(--text-secondary)";

                                                    const medalIcon = isTop1 ? "🥇" : isTop2 ? "🥈" : isTop3 ? "🥉" : `${index + 1}º`;

                                                    return (
                                                        <div key={item.name} style={{
                                                            background: "rgba(255, 255, 255, 0.03)",
                                                            border: isTop1 ? "1px solid rgba(245, 158, 11, 0.35)" : "1px solid rgba(255, 255, 255, 0.06)",
                                                            borderRadius: "0.75em",
                                                            padding: "0.7em 0.9em",
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            gap: "0.45em",
                                                            position: "relative",
                                                            overflow: "hidden"
                                                        }}>
                                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5em" }}>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "0.65em", flex: "1 1 auto", minWidth: "120px" }}>
                                                                    <span style={{
                                                                        fontSize: "0.8em",
                                                                        fontWeight: 800,
                                                                        padding: "0.2em 0.55em",
                                                                        borderRadius: "5px",
                                                                        background: medalBg,
                                                                        color: medalColor,
                                                                        flexShrink: 0
                                                                    }}>
                                                                        {medalIcon}
                                                                    </span>
                                                                    <span style={{
                                                                        fontWeight: 700,
                                                                        fontSize: "0.9em",
                                                                        color: "var(--text-color)",
                                                                        wordBreak: "break-word"
                                                                    }}>
                                                                        {item.name}
                                                                    </span>
                                                                </div>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "0.6em", flexShrink: 0, marginLeft: "auto" }}>
                                                                    <span style={{
                                                                        fontSize: "0.75em",
                                                                        fontWeight: 700,
                                                                        padding: "0.15em 0.55em",
                                                                        borderRadius: "5px",
                                                                        background: "rgba(59, 130, 246, 0.15)",
                                                                        color: "var(--primary-color)",
                                                                        border: "1px solid rgba(59, 130, 246, 0.3)",
                                                                        whiteSpace: "nowrap"
                                                                    }}>
                                                                        {item.quantity} uds
                                                                    </span>
                                                                    <span style={{ fontSize: "0.88em", fontWeight: 700, color: "var(--success-color)", whiteSpace: "nowrap" }}>
                                                                        ${item.total.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Barra de progreso de demanda */}
                                                            <div style={{ width: "100%", height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                                                                <div style={{
                                                                    width: `${pct}%`,
                                                                    height: "100%",
                                                                    background: isTop1
                                                                        ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                                                                        : "linear-gradient(90deg, #3b82f6, #06b6d4)",
                                                                    borderRadius: "3px",
                                                                    transition: "width 0.4s ease"
                                                                }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            /* Vista de Gráfico de Barras moderno */
                                            <div style={{ flex: 1, minHeight: `${Math.round(230 * textScale)}px` }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={stats.itemChartData}
                                                        layout="vertical"
                                                        margin={{ left: 5, right: 20, top: 10, bottom: 0 }}
                                                    >
                                                        <defs>
                                                            <linearGradient id="productBarGrad" x1="0" y1="0" x2="1" y2="0">
                                                                <stop offset="0%" stopColor="#3b82f6" />
                                                                <stop offset="100%" stopColor="#06b6d4" />
                                                            </linearGradient>
                                                        </defs>
                                                        <XAxis type="number" hide />
                                                        <YAxis
                                                            dataKey="name"
                                                            type="category"
                                                            width={Math.round(110 * textScale)}
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fill: 'var(--text-color)', fontSize: Math.round(11 * textScale), fontWeight: 600 }}
                                                        />
                                                        <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                                        <Bar
                                                            dataKey="quantity"
                                                            name="Cantidad"
                                                            fill="url(#productBarGrad)"
                                                            radius={[0, 8, 8, 0]}
                                                            barSize={Math.round(18 * textScale)}
                                                            background={{ fill: 'rgba(255,255,255,0.03)', radius: 8 }}
                                                        />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )
                                    ) : (
                                        <div style={{
                                            padding: "3.5em 1em",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "var(--text-secondary)",
                                            fontSize: "0.9em",
                                            fontStyle: "italic",
                                            gap: "0.5em"
                                        }}>
                                            <span style={{ fontSize: "2.2em", fontStyle: "normal", opacity: 0.6 }}>📦</span>
                                            Sin ventas de productos registradas
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
