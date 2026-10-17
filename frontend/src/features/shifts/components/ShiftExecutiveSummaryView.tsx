import { useState } from "react";
import { ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { Shift } from "../../../types";
import { formatCurrency } from "../../../utils/currencyUtils";
import { USER_COLORS, type ShiftStatsResult } from "../utils/shiftStatsUtils";

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
                background: '#0d1527',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '0.75em 1.1em',
                borderRadius: '0.75em',
                boxShadow: '0 12px 32px rgba(0,0,0,0.7)',
                color: '#fff',
                fontSize: '0.85em',
                minWidth: '160px',
                position: 'relative',
                zIndex: 100
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

interface CustomAreaTooltipProps {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
}

function CustomAreaTooltip({ active, payload, label }: CustomAreaTooltipProps) {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: '#0d1527',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                padding: '0.6em 0.9em',
                borderRadius: '0.6em',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                color: '#fff',
                fontSize: '0.82em',
                zIndex: 100
            }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75em', marginBottom: '0.2em' }}>{label}</div>
                <div style={{ color: '#10b981', fontWeight: 800, fontSize: '1.1em' }}>
                    {formatCurrency(payload[0].value)}
                </div>
            </div>
        );
    }
    return null;
}

interface CustomDonutTooltipProps {
    active?: boolean;
    payload?: Array<{ payload: { name: string; quantity?: number; total: number; percentage: number; color: string } }>;
}

function CustomDonutTooltip({ active, payload }: CustomDonutTooltipProps) {
    if (active && payload && payload.length) {
        const d = payload[0].payload;
        return (
            <div style={{
                background: '#0d1527',
                border: `1px solid ${d.color}88`,
                padding: '0.6em 0.9em',
                borderRadius: '0.6em',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                color: '#fff',
                fontSize: '0.82em',
                zIndex: 100
            }}>
                <div style={{ fontWeight: 700 }}>{d.name}</div>
                {d.quantity !== undefined && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.78em', marginTop: '0.2em' }}>
                        Despachados: <strong style={{ color: '#fff' }}>{d.quantity} uds</strong>
                    </div>
                )}
                <div style={{ color: d.color, fontWeight: 800, marginTop: '0.2em' }}>
                    {formatCurrency(d.total)}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75em' }}>
                    {d.percentage.toFixed(2)}% del total
                </div>
            </div>
        );
    }
    return null;
}

interface CustomPieLabelProps {
    cx?: number;
    cy?: number;
    midAngle?: number;
    outerRadius?: number;
    percentage?: number;
    value?: number | string;
}

const renderCustomLabel = (props: CustomPieLabelProps) => {
    const { cx = 0, cy = 0, midAngle = 0, outerRadius = 0, percentage, value } = props;
    const val = percentage !== undefined ? percentage : value;
    if (Number(val) < 4) return null;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 18;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text
            x={x}
            y={y}
            fill="#cbd5e1"
            textAnchor={x > cx ? 'start' : 'end'}
            dominantBaseline="central"
            fontSize={11}
            fontWeight={600}
        >
            {Number(val).toFixed(1)}%
        </text>
    );
};

export interface ShiftExecutiveSummaryViewProps {
    stats: ShiftStatsResult;
    shift?: Shift | null;
    isCurrent?: boolean;
    textScale: number;
    gradientId: string;
}

export default function ShiftExecutiveSummaryView({
    stats,
    isCurrent = false,
    textScale,
    gradientId
}: ShiftExecutiveSummaryViewProps) {
    const [hoveredSliceIndex, setHoveredSliceIndex] = useState<number | null>(null);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75em" }}>
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
                        {formatCurrency(stats.totalSales)}
                    </div>
                    <div style={{ color: "var(--success-color)", fontSize: "0.78em", fontWeight: 600, marginTop: "0.3em", whiteSpace: "nowrap" }}>
                        {isCurrent ? "Recaudación activa del turno" : "Recaudación final del turno"}
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
                        En {Object.keys(stats.allItems).length} productos diferentes
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
                        {stats.durationText ? `Duración: ${stats.durationText}` : "Procesadas en el turno"}
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
                        {formatCurrency(stats.averageTicket)}
                    </div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.78em", marginTop: "0.3em", whiteSpace: "nowrap" }}>
                        Promedio por ticket
                    </div>
                </div>
            </div>

            {/* Sección de Gráficos: Ingresos y Productos más vendidos */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))",
                gap: "1.5em",
                alignItems: "stretch"
            }}>
                {/* Tarjeta 1: Ingresos */}
                <div style={{
                    background: "rgba(10, 16, 30, 0.95)",
                    borderRadius: "18px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    padding: "1.6em 1.8em",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5em" }}>
                            <h3 style={{ margin: 0, fontSize: "1.2em", fontWeight: 700, color: "#fff" }}>Ingresos</h3>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6em" }}>
                                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
                                <span style={{ fontSize: "0.82em", color: "var(--text-secondary)", fontWeight: 500 }}>Ingresos totales</span>
                                <span style={{ color: "#fff", fontWeight: 800, fontSize: "1.2em", marginLeft: "0.4em" }}>
                                    {formatCurrency(stats.totalSales)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ width: "100%", height: 260, marginTop: "1em" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.hourlyData} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
                                <defs>
                                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                                <XAxis
                                    dataKey="hour"
                                    stroke="rgba(148, 163, 184, 0.6)"
                                    tick={{ fill: "rgba(148, 163, 184, 0.8)", fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={{ stroke: "rgba(255, 255, 255, 0.08)" }}
                                />
                                <YAxis
                                    domain={[0, stats.yAxisConfig.max]}
                                    ticks={stats.yAxisConfig.ticks}
                                    stroke="rgba(148, 163, 184, 0.6)"
                                    tick={{ fill: "rgba(148, 163, 184, 0.8)", fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `$${val}`}
                                />
                                <Tooltip content={<CustomAreaTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#10b981"
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill={`url(#${gradientId})`}
                                    dot={{ r: 3, fill: "#10b981", strokeWidth: 1, stroke: "#047857" }}
                                    activeDot={{ r: 6, fill: "#34d399", strokeWidth: 2, stroke: "#fff" }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tarjeta 2: Productos más vendidos */}
                <div style={{
                    background: "rgba(10, 16, 30, 0.95)",
                    borderRadius: "18px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    padding: "1.6em 1.8em",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                    display: "flex",
                    flexDirection: "column"
                }}>
                    <h3 style={{ margin: 0, fontSize: "1.2em", fontWeight: 700, color: "#fff" }}>Productos más vendidos</h3>

                    {stats.topProducts.length > 0 ? (
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1.5em",
                            marginTop: "1em",
                            flex: 1,
                            flexWrap: "wrap"
                        }}>
                            {/* Donut Chart */}
                            <div style={{ width: "42%", minWidth: "170px", height: 210, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.topProducts}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50 * textScale}
                                            outerRadius={74 * textScale}
                                            paddingAngle={3}
                                            dataKey="total"
                                            stroke="none"
                                            label={renderCustomLabel}
                                            labelLine={false}
                                        >
                                            {stats.topProducts.map((entry, index) => (
                                                <Cell key={`cell-top-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomDonutTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Desglose de Lista de Productos */}
                            <div style={{
                                flex: 1,
                                minWidth: "220px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.55em",
                                maxHeight: "230px",
                                overflowY: "auto",
                                paddingRight: "0.4em"
                            }}>
                                {stats.topProducts.map((prod) => (
                                    <div
                                        key={prod.name}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "0.4em 0.6em",
                                            borderRadius: "8px",
                                            background: "rgba(255, 255, 255, 0.02)",
                                            fontSize: "0.85em",
                                            border: "1px solid rgba(255, 255, 255, 0.04)"
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.6em", minWidth: 0 }}>
                                            <span style={{
                                                width: "8px",
                                                height: "8px",
                                                borderRadius: "50%",
                                                backgroundColor: prod.color,
                                                boxShadow: `0 0 6px ${prod.color}88`,
                                                flexShrink: 0
                                            }} />
                                            <span style={{
                                                color: "var(--text-color)",
                                                fontWeight: 600,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                maxWidth: "110px"
                                            }}>
                                                {prod.name}
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.6em", flexShrink: 0 }}>
                                            <span style={{
                                                background: "rgba(255, 255, 255, 0.08)",
                                                color: "#cbd5e1",
                                                fontSize: "0.78em",
                                                fontWeight: 700,
                                                padding: "0.15em 0.45em",
                                                borderRadius: "4px"
                                            }}>
                                                {prod.quantity} uds
                                            </span>
                                            <span style={{
                                                color: "#fff",
                                                fontWeight: 700,
                                                minWidth: "62px",
                                                textAlign: "right"
                                            }}>
                                                {formatCurrency(prod.total)}
                                            </span>
                                            <span style={{
                                                color: "rgba(148, 163, 184, 0.8)",
                                                fontSize: "0.84em",
                                                fontWeight: 500,
                                                minWidth: "46px",
                                                textAlign: "right"
                                            }}>
                                                {prod.percentage.toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
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
                            gap: "0.5em",
                            flex: 1
                        }}>
                            <span style={{ fontSize: "2.2em", fontStyle: "normal", opacity: 0.6 }}>🍽️</span>
                            Sin productos vendidos aún en este turno
                        </div>
                    )}
                </div>
            </div>

            {/* Sección 2: Ventas por Usuario */}
            <div style={{
                background: "rgba(10, 16, 30, 0.95)",
                borderRadius: "18px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                padding: "1.6em 1.8em",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                display: "flex",
                flexDirection: "column",
                gap: "1.25em"
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5em" }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: "1.2em", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "0.5em" }}>
                            <span>👥</span> VENTAS POR USUARIO
                        </h3>
                        <p style={{ margin: "0.25em 0 0 0", fontSize: "0.82em", color: "var(--text-secondary)" }}>
                            Participación porcentual y volumen recaudado por cada vendedor
                        </p>
                    </div>
                    <span style={{ fontSize: "0.78em", color: "var(--text-secondary)", background: "rgba(255,255,255,0.06)", padding: "0.3em 0.7em", borderRadius: "6px", whiteSpace: "nowrap", flexShrink: 0 }}>
                        {stats.chartData.length} miembros activos
                    </span>
                </div>

                {stats.chartData.length > 0 ? (
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "2.5em",
                        flexWrap: "wrap"
                    }}>
                        {/* Gráfico Donut con métrica central */}
                        <div style={{ width: "35%", minWidth: "220px", height: 230, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart onMouseLeave={() => setHoveredSliceIndex(null)}>
                                    <Pie
                                        data={stats.chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={54 * textScale}
                                        outerRadius={80 * textScale}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                        onMouseEnter={(_entry, index) => setHoveredSliceIndex(index)}
                                        onMouseLeave={() => setHoveredSliceIndex(null)}
                                    >
                                        {stats.chartData.map((_entry, index) => (
                                            <Cell
                                                key={`cell-user-${index}`}
                                                fill={USER_COLORS[index % USER_COLORS.length]}
                                                opacity={hoveredSliceIndex === null || hoveredSliceIndex === index ? 1 : 0.35}
                                                style={{ transition: 'opacity 0.2s ease', cursor: 'pointer' }}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        wrapperStyle={{ zIndex: 100, pointerEvents: 'none' }}
                                        content={<CustomPieTooltip totalSales={stats.totalSales} />}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Desglose detallado por usuario con barras proporcionales */}
                        <div style={{
                            flex: 1,
                            minWidth: "260px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.65em",
                            maxHeight: "18em",
                            overflowY: "auto",
                            paddingRight: "0.2em"
                        }}>
                            {stats.chartData.map((item, index) => {
                                const color = USER_COLORS[index % USER_COLORS.length];
                                const pct = stats.totalSales > 0 ? ((item.value / stats.totalSales) * 100).toFixed(1) : '0';
                                const isHovered = hoveredSliceIndex === index;
                                return (
                                    <div
                                        key={item.name}
                                        onMouseEnter={() => setHoveredSliceIndex(index)}
                                        onMouseLeave={() => setHoveredSliceIndex(null)}
                                        style={{
                                            background: isHovered ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.03)",
                                            border: isHovered ? `1px solid ${color}88` : "1px solid rgba(255, 255, 255, 0.06)",
                                            borderRadius: "0.7em",
                                            padding: "0.7em 0.9em",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "0.4em",
                                            transition: "all 0.2s ease",
                                            cursor: "pointer"
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5em" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.55em", minWidth: "120px", flex: "1 1 auto" }}>
                                                <span style={{
                                                    width: "0.75em",
                                                    height: "0.75em",
                                                    borderRadius: "50%",
                                                    background: color,
                                                    boxShadow: `0 0 6px ${color}88`,
                                                    flexShrink: 0
                                                }} />
                                                <span style={{ fontWeight: 600, fontSize: "0.9em", color: "var(--text-color)", whiteSpace: "nowrap" }}>
                                                    {item.name}
                                                </span>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.75em", flexShrink: 0, marginLeft: "auto" }}>
                                                <span style={{ fontWeight: 700, fontSize: "0.9em", color: "var(--text-color)", whiteSpace: "nowrap" }}>
                                                    {formatCurrency(item.value)}
                                                </span>
                                                <span style={{
                                                    fontSize: "0.75em",
                                                    fontWeight: 700,
                                                    padding: "0.15em 0.55em",
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
        </div>
    );
}
