import type { UIScale, LayoutOrientation } from '../../../types';
import SettingsControls from '../../../components/ui/SettingsControls';

interface MenuHeaderProps {
    back: () => void;
    canEdit: boolean;
    mode: string;
    showCatMenu: boolean;
    setShowCatMenu: (show: boolean) => void;
    showCatInput: boolean;
    setShowCatInput: (show: boolean) => void;
    newCatName: string;
    setNewCatName: (name: string) => void;
    handleAddCategory: () => void;
    setMode: (mode: any) => void;
    uiScale: UIScale;
    setUiScale: (s: UIScale) => void;
    layoutOrientation: LayoutOrientation;
    setLayoutOrientation: (o: LayoutOrientation) => void;
    showOrientation?: boolean;
    setIsReorderMode: (b: boolean) => void;
    requestSecureAction: (actionType: string, callback: () => void, data?: any) => void;
    onAddProduct: () => void;
    onShowTaxonomyManager: () => void;
}

export default function MenuHeader({
    back,
    canEdit,
    mode,
    showCatMenu,
    setShowCatMenu,
    showCatInput,
    setShowCatInput,
    newCatName,
    setNewCatName,
    handleAddCategory,
    setMode,
    uiScale,
    setUiScale,
    layoutOrientation,
    setLayoutOrientation,
    showOrientation = true,
    setIsReorderMode,
    requestSecureAction,
    onAddProduct,
    onShowTaxonomyManager
}: MenuHeaderProps) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "0.75em", gap: "0.75em", flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                    onClick={back}
                    className="btn-back"
                >
                    ← VOLVER AL PANEL
                </button>

                <SettingsControls
                    uiScale={uiScale}
                    setUiScale={setUiScale}
                    layoutOrientation={layoutOrientation}
                    setLayoutOrientation={setLayoutOrientation}
                    showOrientation={showOrientation}
                />
            </div>

            {canEdit && (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button
                        onClick={() => setIsReorderMode(true)}
                        className="btn-primary"
                        style={{
                            minWidth: '3.5rem',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--card-border)',
                            fontSize: '1.2rem',
                            color: 'white'
                        }}
                        title="Reordenar Categorías"
                    >
                        ✋&#xFE0E;
                    </button>

                    <button
                        onClick={onAddProduct}
                        className="btn-primary"
                        style={{ background: 'var(--success-color)', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)' }}
                    >
                        + Crear Producto
                    </button>

                    <button
                        onClick={() => {
                            if (mode !== 'normal') {
                                setMode('normal');
                            } else {
                                onShowTaxonomyManager();
                            }
                        }}
                        className="btn-primary"
                    >
                        {mode === 'normal' ? 'Opciones' : 'CANCELAR MODO'}
                    </button>
                </div>
            )}
        </div>
    );
}
