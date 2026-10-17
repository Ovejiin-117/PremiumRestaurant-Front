import type { PromotionType } from '../../types';

export interface PromotionFormData {
    name: string;
    type: PromotionType;
    value: string;
    pay: string;
    take: string;
    targetItemIds: string[];
    active: boolean;
    validityMode: 'permanent' | 'date_range';
    startDate: string;
    endDate: string;
    daysOfWeek: number[];
}
