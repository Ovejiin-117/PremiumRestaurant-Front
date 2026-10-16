import type { Shift } from '../types';

/**
 * Formatea una fecha/hora de forma segura para compatibilidad con ISO y cadenas heredadas
 */
export const formatDateTime = (dateStr: string): { date: string; time: string; full: string } => {
    if (!dateStr) {
        return { date: '', time: '', full: '' };
    }

    try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
            const date = d.toLocaleDateString();
            const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            return { date, time, full: `${date} ${time}` };
        }
    } catch {
        // Ignorar y pasar al fallback
    }

    // Fallback si ya viene como "DD/MM/YYYY HH:mm" o con coma
    if (dateStr.includes(', ')) {
        const parts = dateStr.split(', ');
        return { date: parts[0] || '', time: parts[1] || '', full: dateStr };
    }

    const spaceParts = dateStr.split(' ');
    if (spaceParts.length >= 2) {
        return { date: spaceParts[0] || '', time: spaceParts.slice(1).join(' ') || '', full: dateStr };
    }

    return { date: dateStr, time: '', full: dateStr };
};

/**
 * Obtiene la fecha local en formato YYYY-MM-DD sin desfase por UTC
 */
export const getLocalDateString = (date: Date = new Date()): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Genera la etiqueta legible de rango de fechas de un turno
 */
export const getShiftLabel = (shift: Shift, isCurrent: boolean = false): string => {
    const start = new Date(shift.startTime);
    const startStr = start.toLocaleString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    if (isCurrent) {
        return `Turno Actual (Iniciado: ${startStr})`;
    }

    if (shift.endTime) {
        const end = new Date(shift.endTime);
        const endStr = end.toLocaleString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        return `Turno: ${startStr} — ${endStr}`;
    }

    return `Turno (Iniciado: ${startStr})`;
};
