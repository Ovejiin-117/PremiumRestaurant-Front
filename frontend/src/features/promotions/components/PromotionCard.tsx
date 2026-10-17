import type { Promotion } from '../../../types';
import { getDaysLabel } from '../utils/promotionUtils';

interface Props {
    promo: Promotion;
    onToggle: (promo: Promotion) => void;
    onEdit: (promo: Promotion) => void;
    onDelete: (promo: Promotion) => void;
}

const actionButtonStyles = {
    warning: 'bg-warning',
    success: 'bg-success',
    primary: 'bg-primary',
    danger: 'bg-danger',
};

function getActionButtonClass(variant: 'warning' | 'success' | 'primary' | 'danger') {
    return `text-white border border-white/30 font-bold cursor-pointer transition-all px-5 py-2.5 text-sm rounded-lg hover:brightness-110 active:scale-95 ${actionButtonStyles[variant]}`;
}

export default function PromotionCard({ promo, onToggle, onEdit, onDelete }: Props) {
    return (
        <div className="relative flex flex-wrap justify-between items-center gap-4 p-5 rounded-2xl bg-card border border-card-border overflow-hidden shadow-sm transition-all duration-300">
            {/* Línea indicadora de estado */}
            <div
                className={`absolute left-0 top-0 bottom-0 w-1 opacity-60 ${
                    promo.active ? 'bg-primary' : 'bg-text-secondary'
                }`}
            />

            <div className="flex items-center gap-5">
                {/* Ícono de tipo */}
                <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shrink-0 border border-card-border ${
                        promo.active ? 'bg-primary/10 text-primary' : 'bg-card-hover text-text-secondary'
                    }`}
                >
                    {promo.type === 'percentage' ? '%' : promo.type === 'quantity_offer' ? 'NxM' : 'CBO'}
                </div>

                <div>
                    <div className="flex items-center gap-3">
                        <h3 className="m-0 text-text-main font-semibold">{promo.name}</h3>
                        <span
                            className={`text-[0.65rem] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                                promo.active
                                    ? 'bg-success/10 text-success border-success/20'
                                    : 'bg-danger/10 text-danger border-danger/20'
                            }`}
                        >
                            {promo.active ? 'Activa' : 'Inactiva'}
                        </span>
                    </div>
                    <div className="text-text-secondary text-sm mt-1.5 flex items-center gap-2">
                        <span className="text-primary font-bold">
                            {promo.type === 'percentage'
                                ? `${promo.value}% Descuento`
                                : promo.type === 'quantity_offer'
                                    ? `Oferta ${promo.take}x${promo.pay}`
                                    : `Combo por $${promo.value}`}
                        </span>
                        <span className="opacity-30">•</span>
                        <span>{promo.validityMode === 'permanent' ? 'Permanente' : `${promo.startDate} a ${promo.endDate}`}</span>
                        <span className="opacity-30">•</span>
                        <span>{getDaysLabel(promo.daysOfWeek)}</span>
                    </div>
                    <div className="text-xs text-text-secondary mt-1 opacity-70">
                        Aplicada a <b>{new Set(promo.targetItemIds).size}</b> productos del menú
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center" onClick={e => e.stopPropagation()}>
                <button
                    onClick={() => onToggle(promo)}
                    className={getActionButtonClass(promo.active ? 'warning' : 'success')}
                >
                    {promo.active ? 'DESACTIVAR' : 'ACTIVAR'}
                </button>

                <button
                    onClick={() => onEdit(promo)}
                    className={getActionButtonClass('primary')}
                >
                    EDITAR
                </button>

                <button
                    onClick={() => onDelete(promo)}
                    className={getActionButtonClass('danger')}
                >
                    ELIMINAR
                </button>
            </div>
        </div>
    );
}
