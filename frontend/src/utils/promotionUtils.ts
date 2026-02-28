import type { MenuItem, Promotion } from '../types';

/**
 * Checks if a promotion is currently active based on dates and days of the week.
 */
export const isPromotionActive = (promo: Promotion, date: Date = new Date()): boolean => {
    if (!promo.active) return false;

    // Check validity period
    if (promo.validityMode === 'date_range') {
        const currentDateStr = date.toISOString().split('T')[0];
        if (promo.startDate && currentDateStr < promo.startDate) return false;
        if (promo.endDate && currentDateStr > promo.endDate) return false;
    }

    // Check days of week (0=Sun, 6=Sat)
    if (promo.daysOfWeek && promo.daysOfWeek.length > 0) {
        if (!promo.daysOfWeek.includes(date.getDay())) return false;
    }

    return true;
};

/**
 * Calculates the best promotional price for a single item.
 * Currently only supports 'percentage' promotions for direct price display.
 */
export const getPromotionalPrice = (item: MenuItem, promotions: Promotion[], date: Date = new Date()): number | null => {
    const activePromos = promotions.filter(p =>
        p.targetItemIds.includes(item.id) &&
        isPromotionActive(p, date)
    );

    if (activePromos.length === 0) return null;

    // We look for the best PERCENTAGE promotion for display
    const percentagePromos = activePromos.filter(p => p.type === 'percentage' && p.value !== undefined);

    if (percentagePromos.length === 0) return null;

    // Get the one with highest discount
    const bestPromo = percentagePromos.reduce((prev, current) => {
        return (current.value || 0) > (prev.value || 0) ? current : prev;
    });

    return item.price * (1 - (bestPromo.value || 0) / 100);
};
