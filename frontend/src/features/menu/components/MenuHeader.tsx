import type { UIScale, LayoutOrientation } from '../../../types';
import SettingsControls from '../../../components/ui/SettingsControls';

export type MenuMode = 'normal' | 'delete_selection' | 'edit_cat_selection' | 'edit_sub_selection' | 'edit_sec_selection';

interface MenuHeaderProps {
    back: () => void;
    canEdit: boolean;
    mode: MenuMode;
    setMode: (mode: MenuMode) => void;
    uiScale: UIScale;
    setUiScale: (s: UIScale) => void;
    layoutOrientation: LayoutOrientation;
    setLayoutOrientation: (o: LayoutOrientation) => void;
    showOrientation?: boolean;
    isReorderMode?: boolean;
    setIsReorderMode: (b: boolean) => void;
    onAddProduct: () => void;
    onShowTaxonomyManager: () => void;
}

export default function MenuHeader({
    back,
    canEdit,
    mode,
    setMode,
    uiScale,
    setUiScale,
    layoutOrientation,
    setLayoutOrientation,
    showOrientation = true,
    isReorderMode = false,
    setIsReorderMode,
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
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsReorderMode(!isReorderMode);
                        }}
                        style={{
                            height: '2.2em',
                            width: '2.4em',
                            minWidth: '2.4em',
                            padding: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isReorderMode ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.06)',
                            border: isReorderMode ? '1px solid var(--primary-color)' : '1px solid var(--card-border)',
                            borderRadius: '0.5em',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '0.95em',
                            boxShadow: isReorderMode ? '0 0 12px rgba(59, 130, 246, 0.5)' : 'none',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            flexShrink: 0
                        }}
                        title={isReorderMode ? "Listo (Desactivar reordenamiento)" : "Reordenar categorías"}
                        aria-pressed={isReorderMode}
                    >
                        <span style={{ fontSize: '1.15em', lineHeight: 1 }}>✋&#xFE0E;</span>
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
