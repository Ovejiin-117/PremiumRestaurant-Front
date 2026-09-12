import { useState, useMemo } from "react"; // useState se mantiene para isVerifying, passwordInput, verifyAction, error
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
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





export default function ShiftManagement({
    user, back, isShiftOpen, shifts, setShifts, currentShiftId, setCurrentShiftId, history,
    uiScale, setUiScale, layoutOrientation, setLayoutOrientation, logAction
}: Props) {
    const [isVerifying, setIsVerifying] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [verifyAction, setVerifyAction] = useState<'start' | 'end' | null>(null);
    const [error, setError] = useState("");
    const textScale = uiScale === 'small' ? 0.85 : uiScale === 'large' ? 1.25 : 1;


    // Cálculo de estadísticas
    const currentShiftOrders = useMemo(() => {
        if (!currentShiftId) return [];
        return history.filter(o => o.shiftId === currentShiftId);
    }, [history, currentShiftId]);

    const stats = useMemo(() => {
        const totalSales = currentShiftOrders.reduce((acc, o) => acc + o.total, 0);
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

        const chartData = Object.entries(salesByUser).map(([name, data]) => ({ name, value: data.total }));
        const itemChartData = Object.entries(allItems)
            .map(([name, data]) => ({ name, quantity: data.quantity, total: data.totalPrice }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        return {
            totalSales,
            chartData,
            itemChartData,
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
                <div className="title-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75em' }}>
                        <button onClick={back} className="btn-back">← Volver al panel</button>
                        <SettingsControls
                            uiScale={uiScale}
                            setUiScale={setUiScale}
                            layoutOrientation={layoutOrientation}
                            setLayoutOrientation={setLayoutOrientation}
                            showOrientation={false}
                        />
                    </div>
                    <div style={{
                        padding: "10px 20px",
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
                            width: "8px", height: "8px", borderRadius: "2px",
                            background: isShiftOpen ? "var(--success-color)" : "var(--danger-color)",
                            boxShadow: isShiftOpen ? "0 0 6px var(--success-color)" : "0 0 6px var(--danger-color)",
                            flexShrink: 0,
                            animation: isShiftOpen ? "pulse 2s infinite" : "none"
                        }} />
                        {isShiftOpen ? "TURNO ABIERTO" : "TURNO CERRADO"}
                    </div>

                </div>

                <h1 style={{ margin: '0 0 2rem 0' }}>Gestión de Turno</h1>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2em" }}>

                    {/* Sección de controles */}
                    <div className="glass-card">
                        <h3 style={{ marginTop: 0 }}>Controles de Turno</h3>

                        {isVerifying ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <p style={{ color: "var(--text-secondary)", margin: 0 }}>Confirma tu contraseña para {verifyAction === 'start' ? 'iniciar' : 'cerrar'} el turno:</p>
                                <input
                                    type="password"
                                    placeholder="Contraseña"
                                    autoFocus
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && confirmShiftAction()}
                                    style={{ padding: "12px", borderRadius: "8px", border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--text-color)" }}
                                />
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button onClick={confirmShiftAction} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "var(--primary-color)", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                                        Confirmar
                                    </button>
                                    <button onClick={() => setIsVerifying(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "var(--card-hover-bg)", color: "var(--text-color)", cursor: "pointer" }}>
                                        Cancelar
                                    </button>
                                </div>
                                {error && <p style={{ color: "var(--danger-color)", margin: 0, fontSize: "0.9rem" }}>{error}</p>}
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                {!isShiftOpen ? (
                                    <button
                                        onClick={() => handleShiftAction('start')}
                                        style={{ width: "100%", padding: "1.15em", borderRadius: "0.8em", border: "none", background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", fontSize: "1.1em", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 15px rgba(34, 197, 94, 0.3)" }}
                                    >
                                        Iniciar Nuevo Turno
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleShiftAction('end')}
                                        style={{ width: "100%", padding: "1.15em", borderRadius: "0.8em", border: "none", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white", fontSize: "1.1em", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 15px rgba(239, 68, 68, 0.3)" }}
                                    >
                                        Finalizar Turno Actual
                                    </button>
                                )}
                                <p style={{ opacity: 0.5, fontSize: "0.8em", textAlign: "center", margin: 0 }}>
                                    {isShiftOpen ? "El turno actual comenzó a las " + new Date(shifts.find(s => s.id === currentShiftId)?.startTime || '').toLocaleString() : "No hay un turno activo actualmente."}
                                </p>
                            </div>
                        )}

                        <div style={{ marginTop: "2rem", borderTop: "1px solid var(--card-border)", paddingTop: "1.5rem" }}>
                            <div className="stat-label" style={{ color: "var(--text-secondary)" }}>Ventas Totales</div>
                            <div className="stat-value" style={{ color: "var(--text-color)" }}>${stats.totalSales.toFixed(2)}</div>

                            <div className="stat-label" style={{ color: "var(--text-secondary)", marginTop: "1rem" }}>Total Artículos Vendidos</div>
                            <div className="stat-value" style={{ color: "var(--text-color)", fontSize: "1.5rem" }}>{stats.totalItemsSold}</div>
                        </div>
                    </div>

                    {/* Resumen de estadísticas y gráficos */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                        <div className="glass-card" style={{ flex: 1 }}>
                            <h3 style={{ marginTop: 0, marginBottom: "1.5rem" }}>Resumen del Turno</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2em", marginBottom: '2em' }}>
                                <div style={{ background: 'var(--card-hover-bg)', padding: '1.5em', borderRadius: '1em', border: '1px solid var(--card-border)' }}>
                                    <div className="stat-label" style={{ color: "var(--text-secondary)", fontSize: '0.8em', fontWeight: 'bold' }}>VENTAS TOTALES</div>
                                    <div className="stat-value" style={{ color: "var(--primary-color)", fontSize: "2em" }}>${stats.totalSales.toFixed(2)}</div>
                                </div>
                                <div style={{ background: 'var(--card-hover-bg)', padding: '1.5em', borderRadius: '1em', border: '1px solid var(--card-border)' }}>
                                    <div className="stat-label" style={{ color: "var(--text-secondary)", fontSize: '0.8em', fontWeight: 'bold' }}>PRODUCTOS VENDIDOS</div>
                                    <div className="stat-value" style={{ color: "var(--success-color)", fontSize: "2em" }}>{stats.totalItemsSold}</div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5em', minHeight: '20em' }}>
                                {/* Ventas por usuario (gráfico circular) */}
                                <div style={{ background: 'var(--card-hover-bg)', padding: '1.3em', borderRadius: '1em', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column' }}>
                                    <h4 style={{ margin: '0 0 1em 0', fontSize: '0.9em', color: 'var(--text-secondary)' }}>VENTAS POR USUARIO (%)</h4>
                                    <div style={{ flex: 1, minHeight: '13em' }}>
                                        {stats.chartData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={stats.chartData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60 * textScale}
                                                        outerRadius={80 * textScale}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {stats.chartData.map((_entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px' }}
                                                        itemStyle={{ color: 'var(--text-color)' }}
                                                    />
                                                    <Legend verticalAlign="bottom" height={36 * textScale} wrapperStyle={{ fontSize: 12 * textScale }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>Sin datos de ventas</div>
                                        )}
                                    </div>
                                </div>

                                {/* Productos más vendidos (gráfico de barras) */}
                                <div style={{ background: 'var(--card-hover-bg)', padding: '1.3em', borderRadius: '1em', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column' }}>
                                    <h4 style={{ margin: '0 0 1em 0', fontSize: '0.9em', color: 'var(--text-secondary)' }}>TOP PRODUCTOS (CANTIDAD)</h4>
                                    <div style={{ flex: 1, minHeight: '16em', marginTop: '1em' }}>
                                        {stats.itemChartData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    data={stats.itemChartData}
                                                    layout="vertical"
                                                    margin={{ left: 10, right: 30, top: 0, bottom: 0 }}
                                                >
                                                    <XAxis type="number" hide />
                                                    <YAxis
                                                        dataKey="name"
                                                        type="category"
                                                        width={120 * textScale}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: 'var(--text-color)', fontSize: 11 * textScale, fontWeight: '500' }}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px' }}
                                                        itemStyle={{ color: 'var(--text-color)' }}
                                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                    />
                                                    <Bar
                                                        dataKey="quantity"
                                                        name="Cantidad"
                                                        fill="var(--primary-color)"
                                                        radius={[0, 10, 10, 0]}
                                                        barSize={15}
                                                        background={{ fill: 'rgba(255,255,255,0.03)', radius: 10 }}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>Sin datos de productos</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
