/**
 * Utilidades centralizadas para formateo de moneda y cantidades monetarias.
 */

/**
 * Formatea un número como importe de moneda con 2 decimales ($0.00).
 */
export const formatCurrency = (amount: number | null | undefined): string => {
    const validAmount = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
    return `$${validAmount.toFixed(2)}`;
};

/**
 * Redondea un valor numérico a 2 posiciones decimales exactas.
 */
export const roundToTwo = (num: number): number => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
};
