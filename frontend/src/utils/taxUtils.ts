import type { TaxConfig } from '../types';

export interface TaxCalculationResult {
    subtotal: number;
    taxAmount: number;
    finalTotal: number;
}

/**
 * Calcula el subtotal, monto de impuesto y total final según la configuración fiscal
 */
export const calculateOrderTax = (
    totalSum: number,
    taxConfig?: TaxConfig,
    items?: { quantity: number; price: number }[]
): TaxCalculationResult => {
    if (!taxConfig || !taxConfig.enabled || taxConfig.percentage <= 0) {
        const rounded = Math.round(totalSum * 100) / 100;
        return {
            subtotal: rounded,
            taxAmount: 0,
            finalTotal: rounded
        };
    }

    const taxRate = taxConfig.percentage / 100;
    let subtotal = 0;
    let taxAmount = 0;

    if (taxConfig.rounding === 'item' && items && items.length > 0) {
        items.forEach(item => {
            const lineTotal = item.price * item.quantity;
            let itemSub = 0;
            let itemTax = 0;

            if (taxConfig.mode === 'inclusive') {
                itemSub = lineTotal / (1 + taxRate);
                itemTax = lineTotal - itemSub;
            } else {
                itemSub = lineTotal;
                itemTax = lineTotal * taxRate;
            }

            subtotal += Math.round(itemSub * 100) / 100;
            taxAmount += Math.round(itemTax * 100) / 100;
        });
    } else {
        if (taxConfig.mode === 'inclusive') {
            subtotal = totalSum / (1 + taxRate);
            taxAmount = totalSum - subtotal;
        } else {
            subtotal = totalSum;
            taxAmount = totalSum * taxRate;
        }
        subtotal = Math.round(subtotal * 100) / 100;
        taxAmount = Math.round(taxAmount * 100) / 100;
    }

    const finalTotal = (taxConfig.mode === 'exclusive')
        ? Math.round((subtotal + taxAmount) * 100) / 100
        : Math.round(totalSum * 100) / 100;

    return {
        subtotal,
        taxAmount,
        finalTotal
    };
};
