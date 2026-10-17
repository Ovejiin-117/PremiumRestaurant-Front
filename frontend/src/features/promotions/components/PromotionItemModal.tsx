import type { MenuItem } from '../../../types';

interface Props {
    item: MenuItem | null;
    onClose: () => void;
}

export default function PromotionItemModal({ item, onClose }: Props) {
    if (!item) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-md"
            onClick={onClose}
        >
            <div
                className="glass-card max-w-[min(92vw,28rem)] w-[90%] p-[clamp(1.5rem,4vw,2rem)] text-center relative border border-primary/50 box-border"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-transparent border-none text-text-secondary hover:text-text-main cursor-pointer text-2xl"
                >
                    ✕
                </button>

                <div className="w-full aspect-video rounded-xl bg-card-hover mb-6 flex items-center justify-center overflow-hidden border border-card-border">
                    {item.image ? (
                        <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="text-text-secondary opacity-50 flex flex-col items-center gap-2.5">
                            <span className="text-5xl">🖼️</span>
                            <span>No hay imagen disponible</span>
                        </div>
                    )}
                </div>

                <h2 className="m-0 mb-2 text-text-main">{item.name}</h2>
                <div className="text-primary font-bold text-xl mb-4">
                    ${item.price}
                </div>

                <div className="text-left bg-white/5 p-4 rounded-lg mb-6 max-h-[150px] overflow-y-auto">
                    <label className="block text-xs text-text-secondary mb-1 uppercase">Descripción</label>
                    <p className="m-0 text-text-main leading-relaxed text-sm">
                        {item.description || "Sin descripción disponible para este producto."}
                    </p>
                </div>

                <button
                    onClick={onClose}
                    className="w-full p-3 rounded-lg bg-primary text-white border-none font-bold cursor-pointer hover:brightness-110 active:scale-98 transition-all"
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
}
