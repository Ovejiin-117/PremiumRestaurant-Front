import type { MenuItem, Promotion } from '../types';

/**
 * Comprueba si una promoción está activa según las fechas y días de la semana.
 */
export const isPromotionActive = (promo: Promotion, date: Date = new Date()): boolean => {
    if (!promo.active) return false;

    // Comprobar período de validez
    if (promo.validityMode === 'date_range') {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const currentDateStr = `${year}-${month}-${day}`;
        if (promo.startDate && currentDateStr < promo.startDate) return false;
        if (promo.endDate && currentDateStr > promo.endDate) return false;
    }

    // Comprobar días de la semana (0=Dom, 6=Sáb)
    if (promo.daysOfWeek && promo.daysOfWeek.length > 0) {
        if (!promo.daysOfWeek.includes(date.getDay())) return false;
    }

    return true;
};

/**
 * Calcula el mejor precio promocional para un artículo individual.
 * Actualmente solo admite promociones de 'porcentaje' para mostrar el precio directamente.
 */
export const getPromotionalPrice = (item: MenuItem, promotions: Promotion[], date: Date = new Date()): number | null => {
    const activePromos = promotions.filter(p =>
        p.targetItemIds.includes(item.id) &&
        isPromotionActive(p, date)
    );

    if (activePromos.length === 0) return null;

    // Buscamos la mejor promoción de PORCENTAJE para mostrar
    const percentagePromos = activePromos.filter(p => p.type === 'percentage' && p.value !== undefined);

    if (percentagePromos.length === 0) return null;

    // Obtener la que tenga el mayor descuento
    const bestPromo = percentagePromos.reduce((prev, current) => {
        return (current.value || 0) > (prev.value || 0) ? current : prev;
    });

    return item.price * (1 - (bestPromo.value || 0) / 100);
};
