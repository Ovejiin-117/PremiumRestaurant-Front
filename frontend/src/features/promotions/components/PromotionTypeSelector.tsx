import type { PromotionType } from '../../../types';

interface Props {
    isOpen: boolean;
    onSelect: (type: PromotionType) => void;
    onCancel: () => void;
}

export default function PromotionTypeSelector({ isOpen, onSelect, onCancel }: Props) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="glass-card max-w-[min(92vw,28rem)] w-[90%] text-center p-[clamp(1.5rem,4vw,2rem)] box-border">
                <h2 className="mt-0">Tipo de Promoción</h2>
                <p className="text-text-secondary mb-8">¿Qué tipo de oferta deseas crear?</p>

                <div className="grid gap-4">
                    <button
                        onClick={() => onSelect('percentage')}
                        className="p-6 rounded-xl bg-primary/20 border border-primary text-primary cursor-pointer flex flex-col gap-2 items-center hover:brightness-110 active:scale-95 transition-all"
                    >
                        <span className="text-2xl font-bold">%</span>
                        <span className="font-bold">Porcentaje de Descuento</span>
                    </button>

                    <button
                        onClick={() => onSelect('quantity_offer')}
                        className="p-6 rounded-xl bg-success/20 border border-success text-success cursor-pointer flex flex-col gap-2 items-center hover:brightness-110 active:scale-95 transition-all"
                    >
                        <span className="text-2xl font-bold">NxM</span>
                        <span className="font-bold">Cantidad (Oferta NxM)</span>
                    </button>

                    <button
                        onClick={() => onSelect('combo')}
                        className="p-6 rounded-xl bg-warning/20 border border-warning text-warning cursor-pointer flex flex-col gap-2 items-center hover:brightness-110 active:scale-95 transition-all"
                    >
                        <span className="text-xl font-bold">CBO</span>
                        <span className="font-bold">Combo (Precio Fijo)</span>
                    </button>
                </div>

                <button
                    onClick={onCancel}
                    className="mt-8 bg-transparent border-none text-text-secondary hover:text-text-main cursor-pointer"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
}
