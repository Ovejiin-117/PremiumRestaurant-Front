import type { Promotion } from '../../../types';
import type { PromotionFormData } from '../types';

export const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function getDaysLabel(days?: number[]): string {
    if (!days || days.length === 0) return "Todos los días";
    return days.map(d => DAY_NAMES[d]).join(", ");
}

export function createEmptyPromotionFormData(): PromotionFormData {
    return {
        name: '',
        type: 'percentage',
        value: '',
        pay: '',
        take: '',
        targetItemIds: [],
        active: true,
        validityMode: 'permanent',
        startDate: '',
        endDate: '',
        daysOfWeek: []
    };
}

export function checkPromotionHasChanges(
    formData: PromotionFormData,
    viewMode: 'list' | 'select_type' | 'create' | 'edit',
    editingPromotion: Promotion | null
): boolean {
    if (viewMode === 'list' || viewMode === 'select_type') return false;

    if (viewMode === 'create') {
        return (
            formData.name !== '' ||
            formData.value !== '' ||
            formData.pay !== '' ||
            formData.take !== '' ||
            formData.targetItemIds.length > 0 ||
            formData.daysOfWeek.length > 0 ||
            formData.validityMode !== 'permanent'
        );
    }

    if (viewMode === 'edit' && editingPromotion) {
        const p = editingPromotion;
        return (
            formData.name !== p.name ||
            formData.value !== (p.value?.toString() || '') ||
            formData.pay !== (p.pay?.toString() || '') ||
            formData.take !== (p.take?.toString() || '') ||
            formData.targetItemIds.length !== p.targetItemIds.length ||
            !formData.targetItemIds.every(id => p.targetItemIds.includes(id)) ||
            formData.active !== p.active ||
            formData.validityMode !== p.validityMode ||
            formData.startDate !== (p.startDate || '') ||
            formData.endDate !== (p.endDate || '') ||
            Boolean(p.daysOfWeek && formData.daysOfWeek.length !== p.daysOfWeek.length)
        );
    }

    return false;
}
