import { useState, useMemo } from 'react';
import SecurityModal from '../../../components/ui/SecurityModal';
import SettingsControls from '../../../components/ui/SettingsControls';
import type { MenuItem, Promotion, PromotionType, UIScale, LayoutOrientation } from '../../../types';
import type { PromotionFormData } from '../types';
import { createEmptyPromotionFormData, checkPromotionHasChanges } from '../utils/promotionUtils';
import PromotionCard from './PromotionCard';
import PromotionTypeSelector from './PromotionTypeSelector';
import PromotionForm from './PromotionForm';
import PromotionItemModal from './PromotionItemModal';

interface Props {
    back: () => void;
    promotions: Promotion[];
    setPromotions: (promotions: Promotion[]) => void;
    menu: MenuItem[];
    categories: string[];
    subCategories: Record<string, string[]>;
    sections: Record<string, string[]>;
    uiScale: UIScale;
    setUiScale: (s: UIScale) => void;
    layoutOrientation: LayoutOrientation;
    setLayoutOrientation: (o: LayoutOrientation) => void;
    logAction: (action: import('../../../types').AuditAction, details: string, entityId?: string) => void;
    user: import('../../../types').User;
}

export default function Promotions({
    back, promotions, setPromotions, menu, categories, subCategories, sections,
    uiScale, setUiScale, layoutOrientation, setLayoutOrientation, logAction, user
}: Props) {
    // --- Estado ---
    const [viewMode, setViewMode] = useState<'list' | 'select_type' | 'create' | 'edit'>('list');
    const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
    const [selectedItemForDetails, setSelectedItemForDetails] = useState<MenuItem | null>(null);
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: 'create' | 'edit' | 'delete' | 'toggle', promo?: Promotion } | null>(null);
    const [isConfirmingEdit, setIsConfirmingEdit] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState<{ active: boolean, onConfirm: () => void } | null>(null);

    // Estado del formulario
    const [formData, setFormData] = useState<PromotionFormData>(createEmptyPromotionFormData);

    // Verificar cambios sin guardar
    const hasUnsavedChanges = useMemo(() => {
        return checkPromotionHasChanges(formData, viewMode, editingPromotion);
    }, [formData, viewMode, editingPromotion]);

    const handleExitAttempt = (target: () => void) => {
        if (hasUnsavedChanges) {
            setShowExitConfirm({ active: true, onConfirm: target });
        } else {
            target();
        }
    };

    // Validaciones y manejadores
    const resetForm = () => {
        setFormData(createEmptyPromotionFormData());
        setEditingPromotion(null);
        setIsConfirmingEdit(false);
    };

    const handleSave = () => {
        if (!formData.name.trim()) return;

        if (formData.type === 'percentage') {
            if (formData.targetItemIds.length === 0) return;
            const val = Number(formData.value);
            if (isNaN(val) || val < 1 || val > 100) return;
        } else if (formData.type === 'quantity_offer') {
            if (formData.targetItemIds.length === 0) return;
            if (!formData.pay || !formData.take) return;
        } else if (formData.type === 'combo') {
            if (formData.targetItemIds.length < 2) return;
            const val = Number(formData.value);
            if (isNaN(val) || val <= 0) return;
        }

        const newPromo: Promotion = {
            id: editingPromotion ? editingPromotion.id : crypto.randomUUID(),
            name: formData.name,
            type: formData.type,
            value: (formData.type === 'percentage' || formData.type === 'combo') ? Number(formData.value) : undefined,
            pay: formData.type === 'quantity_offer' ? Number(formData.pay) : undefined,
            take: formData.type === 'quantity_offer' ? Number(formData.take) : undefined,
            targetItemIds: formData.targetItemIds,
            active: formData.active,
            validityMode: formData.validityMode,
            startDate: formData.validityMode === 'date_range' ? formData.startDate : undefined,
            endDate: formData.validityMode === 'date_range' ? formData.endDate : undefined,
            daysOfWeek: formData.daysOfWeek.length > 0 ? formData.daysOfWeek : undefined
        };

        if (editingPromotion) {
            if (!isConfirmingEdit) {
                setIsConfirmingEdit(true);
                return;
            }
            setPromotions(promotions.map(p => p.id === newPromo.id ? newPromo : p));
            logAction('promotion_update', `Promoción actualizada: ${newPromo.name}`, newPromo.id);
            setIsConfirmingEdit(false);
        } else {
            setPromotions([...promotions, newPromo]);
            logAction('promotion_create', `Promoción creada: ${newPromo.name}`, newPromo.id);
        }

        setViewMode('list');
        resetForm();
    };

    const handleDelete = (id: string) => {
        const promo = promotions.find(p => p.id === id);
        setPromotions(promotions.filter(p => p.id !== id));
        logAction('promotion_delete', `Promoción eliminada: ${promo?.name}`, id);
    };

    const handleToggleActive = (id: string) => {
        const promo = promotions.find(p => p.id === id);
        if (promo) {
            const updated = { ...promo, active: !promo.active };
            setPromotions(promotions.map(p => p.id === id ? updated : p));
            logAction('promotion_toggle', `Promoción ${updated.active ? 'activada' : 'desactivada'}: ${promo.name}`, id);
        }
    };

    return (
        <div className={`scale-${uiScale}`}>
            <div className="page-container">
                <div className="title-bar">
                    <div className="flex items-center flex-wrap gap-3">
                        <button onClick={() => handleExitAttempt(back)} className="btn-back">
                            ← Volver al panel
                        </button>
                        <SettingsControls
                            uiScale={uiScale}
                            setUiScale={setUiScale}
                            layoutOrientation={layoutOrientation}
                            setLayoutOrientation={setLayoutOrientation}
                            showOrientation={false}
                        />
                    </div>
                </div>

                <h1 className="page-main-title">GESTIÓN DE PROMOCIONES</h1>

                {viewMode === 'list' && (
                    <div className="glass-card">
                        <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
                            <h2 className="m-0">Promociones Activas</h2>
                            <button
                                onClick={() => {
                                    setPendingAction({ type: 'create' });
                                    setShowSecurityModal(true);
                                }}
                                className="bg-primary text-white border-none px-5 py-2.5 rounded-lg cursor-pointer font-bold hover:brightness-110 active:scale-95 transition-all"
                            >
                                + Nueva Promoción
                            </button>
                        </div>

                        {promotions.length === 0 ? (
                            <div className="text-center py-12 text-text-secondary italic">
                                No hay promociones creadas.
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {promotions.map(promo => (
                                    <PromotionCard
                                        key={promo.id}
                                        promo={promo}
                                        onToggle={p => {
                                            setPendingAction({ type: 'toggle', promo: p });
                                            setShowSecurityModal(true);
                                        }}
                                        onEdit={p => {
                                            setPendingAction({ type: 'edit', promo: p });
                                            setShowSecurityModal(true);
                                        }}
                                        onDelete={p => {
                                            setPendingAction({ type: 'delete', promo: p });
                                            setShowSecurityModal(true);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <PromotionTypeSelector
                    isOpen={viewMode === 'select_type'}
                    onSelect={(type: PromotionType) => {
                        setFormData(prev => ({ ...prev, type, targetItemIds: [] }));
                        setViewMode('create');
                    }}
                    onCancel={() => {
                        setViewMode('list');
                        resetForm();
                    }}
                />

                {(viewMode === 'create' || viewMode === 'edit') && (
                    <PromotionForm
                        viewMode={viewMode}
                        formData={formData}
                        setFormData={setFormData}
                        menu={menu}
                        categories={categories}
                        subCategories={subCategories}
                        sections={sections}
                        isConfirmingEdit={isConfirmingEdit}
                        onSave={handleSave}
                        onBack={() => handleExitAttempt(() => { setViewMode('list'); resetForm(); })}
                        onOpenItemDetails={item => setSelectedItemForDetails(item)}
                    />
                )}
            </div>

            {/* Modal de detalles del producto */}
            <PromotionItemModal
                item={selectedItemForDetails}
                onClose={() => setSelectedItemForDetails(null)}
            />

            {/* Modal de confirmación de seguridad */}
            {showSecurityModal && (
                <SecurityModal
                    isOpen={showSecurityModal}
                    onClose={() => {
                        setShowSecurityModal(false);
                        setPendingAction(null);
                    }}
                    onConfirm={() => {
                        if (pendingAction) {
                            if (pendingAction.type === 'create') {
                                resetForm();
                                setViewMode('select_type');
                            } else if (pendingAction.type === 'edit' && pendingAction.promo) {
                                const p = pendingAction.promo;
                                setEditingPromotion(p);
                                setFormData({
                                    name: p.name,
                                    type: p.type,
                                    value: p.value?.toString() || '',
                                    pay: p.pay?.toString() || '',
                                    take: p.take?.toString() || '',
                                    targetItemIds: p.targetItemIds,
                                    active: p.active,
                                    validityMode: p.validityMode,
                                    startDate: p.startDate || '',
                                    endDate: p.endDate || '',
                                    daysOfWeek: p.daysOfWeek || []
                                });
                                setViewMode('edit');
                            } else if (pendingAction.type === 'delete' && pendingAction.promo) {
                                handleDelete(pendingAction.promo.id);
                            } else if (pendingAction.type === 'toggle' && pendingAction.promo) {
                                handleToggleActive(pendingAction.promo.id);
                            }
                            setPendingAction(null);
                        }
                        setShowSecurityModal(false);
                    }}
                    userPassword={user.password}
                    title={
                        pendingAction?.type === 'create' ? "Nueva Promoción" :
                            pendingAction?.type === 'edit' ? "Editar Promoción" :
                                pendingAction?.type === 'toggle' ? "Cambiar Estado" : "Eliminar Promoción"
                    }
                    message={`Ingresa **tu contraseña** para ${pendingAction?.type === 'create' ? "crear una nueva promoción." :
                        pendingAction?.type === 'edit' ? "editar esta promoción." :
                            pendingAction?.type === 'toggle' ? "activar/desactivar esta promoción." : "eliminar esta promoción."
                        }`}
                />
            )}

            {/* Modal de advertencia de salida con cambios sin guardar */}
            {showExitConfirm && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[10000] p-4">
                    <div className="glass-card max-w-[min(92vw,30rem)] w-full p-[clamp(1.75rem,4vw,2.5rem)] text-center flex flex-col items-center gap-6 shadow-2xl box-border">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl bg-white/5 border-2 border-dashed border-white/30 mb-2 shadow-sm">
                            📢
                        </div>

                        <h2 className="text-3xl font-extrabold m-0">
                            Promoción en Curso
                        </h2>

                        <p className="text-base opacity-80 leading-relaxed m-0 max-w-[min(90%,22rem)]">
                            Tienes cambios sin guardar en esta promoción. Si sales ahora, se perderán estos cambios. ¿Estás seguro de que deseas salir?
                        </p>

                        <div className="flex gap-4 w-full mt-4">
                            <button
                                onClick={() => setShowExitConfirm(null)}
                                className="flex-1 p-4 rounded-xl border border-white/10 bg-white/5 text-white font-bold cursor-pointer hover:bg-white/10 active:scale-98 transition-all"
                            >
                                Seguir Editando
                            </button>
                            <button
                                onClick={() => {
                                    showExitConfirm.onConfirm();
                                    setShowExitConfirm(null);
                                }}
                                className="flex-1 p-4 rounded-xl border-none bg-danger text-white font-bold cursor-pointer shadow-lg shadow-danger/20 hover:-translate-y-0.5 active:scale-98 transition-all"
                            >
                                Salir y Borrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
