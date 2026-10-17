import type { Order, Shift } from "../../../types";

export const TOP_PRODUCT_COLORS = [
    '#2563eb', // Azul
    '#10b981', // Verde esmeralda
    '#f59e0b', // Ámbar
    '#ef4444', // Rojo
    '#8b5cf6', // Púrpura
    '#06b6d4', // Cyan
    '#ec4899', // Rosa
    '#f97316', // Naranja
    '#14b8a6', // Teal
    '#a855f7'  // Violeta
];

export const USER_COLORS = [
    '#38bdf8', // Celeste / Cyan
    '#34d399', // Esmeralda
    '#fbbf24', // Ámbar dorado
    '#f87171', // Coral / Salmón
    '#a78bfa', // Violeta / Lavanda
    '#f472b6', // Rosa vibrante
    '#818cf8', // Índigo moderno
    '#2dd4bf', // Turquesa
    '#fb923c', // Naranja cálido
    '#c084fc', // Púrpura brillante
];

export function calculateYAxisConfig(maxVal: number) {
    const target = maxVal > 0 ? maxVal * 1.25 : 100;
    if (target <= 50) return { max: 50, ticks: [0, 25, 50] };
    if (target <= 100) return { max: 100, ticks: [0, 25, 50, 75, 100] };
    if (target <= 200) return { max: 200, ticks: [0, 50, 100, 150, 200] };
    if (target <= 500) return { max: 500, ticks: [0, 125, 250, 375, 500] };
    if (target <= 1000) return { max: 1000, ticks: [0, 250, 500, 750, 1000] };
    if (target <= 2500) return { max: 2500, ticks: [0, 500, 1000, 1500, 2000, 2500] };
    if (target <= 5000) return { max: 5000, ticks: [0, 1250, 2500, 3750, 5000] };
    if (target <= 10000) return { max: 10000, ticks: [0, 2500, 5000, 7500, 10000] };
    if (target <= 20000) return { max: 20000, ticks: [0, 5000, 10000, 15000, 20000] };

    const magnitude = Math.pow(10, Math.floor(Math.log10(target)));
    const step = magnitude / 2;
    const roundedMax = Math.ceil(target / step) * step;
    return {
        max: roundedMax,
        ticks: [0, Math.round(roundedMax * 0.25), Math.round(roundedMax * 0.5), Math.round(roundedMax * 0.75), roundedMax]
    };
}

export interface ShiftStatsResult {
    totalSales: number;
    totalOrders: number;
    averageTicket: number;
    chartData: Array<{ name: string; value: number }>;
    salesByUser: Record<string, { total: number; items: Record<string, { quantity: number; totalPrice: number }> }>;
    totalItemsSold: number;
    allItems: Record<string, { quantity: number; totalPrice: number }>;
    hourlyData: Array<{ hour: string; amount: number }>;
    yAxisConfig: { max: number; ticks: number[] };
    topProducts: Array<{ name: string; quantity: number; total: number; percentage: number; color: string }>;
    durationText: string | null;
}

export function calculateShiftStats(
    orders: Order[],
    shift?: Shift | null,
    currentTime: number = Date.now(),
    isCurrentOpen: boolean = false
): ShiftStatsResult {
    const totalSales = orders.reduce((acc, o) => acc + o.total, 0);
    const totalOrders = orders.length;
    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    const salesByUser: Record<string, { total: number, items: Record<string, { quantity: number, totalPrice: number }> }> = {};
    const allItems: Record<string, { quantity: number, totalPrice: number }> = {};
    let totalItemsSold = 0;

    orders.forEach(order => {
        const user = order.orderedBy || "General";
        if (!salesByUser[user]) {
            salesByUser[user] = { total: 0, items: {} };
        }
        salesByUser[user].total += order.total;

        order.items.forEach(item => {
            if (item.menuItemId === 'tax-line' || item.menuItemId === 'promo-discount') return;

            if (!salesByUser[user].items[item.name]) {
                salesByUser[user].items[item.name] = { quantity: 0, totalPrice: 0 };
            }
            salesByUser[user].items[item.name].quantity += item.quantity;
            salesByUser[user].items[item.name].totalPrice += item.price * item.quantity;

            if (!allItems[item.name]) {
                allItems[item.name] = { quantity: 0, totalPrice: 0 };
            }
            allItems[item.name].quantity += item.quantity;
            allItems[item.name].totalPrice += item.price * item.quantity;
            totalItemsSold += item.quantity;
        });
    });

    const chartData = Object.entries(salesByUser).map(([name, data]) => ({
        name,
        value: data.total
    }));

    const hourlyMap: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourlyMap[h] = 0;

    orders.forEach(o => {
        const d = new Date(o.createdAt);
        const h = d.getHours();
        hourlyMap[h] = (hourlyMap[h] || 0) + o.total;
    });

    let startH = 12;
    let endH = 23;
    if (orders.length > 0) {
        const hoursWithOrders = orders.map(o => new Date(o.createdAt).getHours());
        const minOrderH = Math.min(...hoursWithOrders);
        const maxOrderH = Math.max(...hoursWithOrders);
        startH = Math.max(0, minOrderH - 1);
        endH = Math.min(23, maxOrderH + 1);
        if (endH - startH < 4) {
            endH = Math.min(23, startH + 4);
        }
    }

    const hourlyData: Array<{ hour: string; amount: number }> = [];
    for (let h = startH; h <= endH; h++) {
        hourlyData.push({
            hour: `${h.toString().padStart(2, '0')}:00`,
            amount: hourlyMap[h] || 0
        });
    }

    const maxSales = Math.max(...hourlyData.map(d => d.amount), 0);
    const yAxisConfig = calculateYAxisConfig(maxSales);

    const sortedProducts = Object.entries(allItems)
        .map(([name, data]) => ({
            name,
            quantity: data.quantity,
            total: data.totalPrice,
            percentage: totalSales > 0 ? (data.totalPrice / totalSales) * 100 : 0
        }))
        .sort((a, b) => b.total - a.total);

    const top5 = sortedProducts.slice(0, 5);
    const others = sortedProducts.slice(5);

    const topProducts: Array<{ name: string; quantity: number; total: number; percentage: number; color: string }> = [];

    top5.forEach((p, idx) => {
        topProducts.push({
            ...p,
            color: TOP_PRODUCT_COLORS[idx % TOP_PRODUCT_COLORS.length]
        });
    });

    if (others.length > 0) {
        const othersTotal = others.reduce((acc, curr) => acc + curr.total, 0);
        const othersQuantity = others.reduce((acc, curr) => acc + curr.quantity, 0);
        topProducts.push({
            name: 'Otros productos',
            quantity: othersQuantity,
            total: othersTotal,
            percentage: totalSales > 0 ? (othersTotal / totalSales) * 100 : 0,
            color: '#64748b'
        });
    }

    let durationText: string | null = null;
    if (shift?.startTime) {
        const startMs = new Date(shift.startTime).getTime();
        const endMs = shift.endTime ? new Date(shift.endTime).getTime() : (isCurrentOpen ? currentTime : null);
        if (endMs && endMs >= startMs) {
            const diffMs = endMs - startMs;
            const diffMins = Math.floor(diffMs / 60000);
            const hrs = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            if (hrs > 0) {
                durationText = `${hrs}h ${mins}m`;
            } else if (mins > 0) {
                durationText = `${mins}m`;
            } else {
                durationText = "Menos de 1m";
            }
        }
    }

    return {
        totalSales,
        totalOrders,
        averageTicket,
        chartData,
        salesByUser,
        totalItemsSold,
        allItems,
        hourlyData,
        yAxisConfig,
        topProducts,
        durationText
    };
}
