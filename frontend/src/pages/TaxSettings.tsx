import React from 'react';
import type { User, TaxConfig, UIScale, LayoutOrientation, AuditAction } from '../types';
import SecurityModal from '../components/ui/SecurityModal';
import ConfirmDiscardModal from '../components/ui/ConfirmDiscardModal';
import SettingsControls from '../components/ui/SettingsControls';

interface Props {
    user: User;
    taxConfig: TaxConfig;
    setTaxConfig: (c: TaxConfig) => void;
    back: () => void;
    uiScale: UIScale;
    setUiScale?: (scale: UIScale) => void;
    layoutOrientation: LayoutOrientation;
    logAction: (action: AuditAction, details: string, entityId?: string) => void;
}

const TaxSettings: React.FC<Props> = ({ user, taxConfig: globalTaxConfig, setTaxConfig, back, uiScale, setUiScale, logAction }) => {
    const isAdmin = user.role === 'developer';
    const isManager = user.role === 'manager';

    const [localTaxConfig, setLocalTaxConfig] = React.useState(globalTaxConfig);
    const [inputValue, setInputValue] = React.useState(globalTaxConfig.percentage.toString());
    const [isVerified, setIsVerified] = React.useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = React.useState(false);
    const [showDiscardConfirm, setShowDiscardConfirm] = React.useState(false);

    React.useEffect(() => {
        setInputValue(localTaxConfig.percentage.toString());
    }, [localTaxConfig.percentage]);

    const hasUnsavedChanges = React.useMemo(() => {
        return (
            globalTaxConfig.enabled !== localTaxConfig.enabled ||
            globalTaxConfig.name.trim() !== localTaxConfig.name.trim() ||
            globalTaxConfig.percentage !== localTaxConfig.percentage ||
            globalTaxConfig.mode !== localTaxConfig.mode ||
            globalTaxConfig.rounding !== localTaxConfig.rounding
        );
    }, [globalTaxConfig, localTaxConfig]);

    const handleBack = () => {
        if (hasUnsavedChanges) {
            setShowDiscardConfirm(true);
        } else {
            back();
        }
    };

    if (!isAdmin && !isManager) return null;

    const handleSave = () => {
        const changes = [];
        if (globalTaxConfig.enabled !== localTaxConfig.enabled) changes.push(`Estado: ${localTaxConfig.enabled ? 'Activado' : 'Desactivado'}`);
        if (globalTaxConfig.name !== localTaxConfig.name) changes.push(`Nombre: ${localTaxConfig.name}`);
        if (globalTaxConfig.percentage !== localTaxConfig.percentage) changes.push(`Porcentaje: ${localTaxConfig.percentage}%`);
        if (globalTaxConfig.mode !== localTaxConfig.mode) changes.push(`Modo: ${localTaxConfig.mode}`);
        if (globalTaxConfig.rounding !== localTaxConfig.rounding) changes.push(`Redondeo: ${localTaxConfig.rounding}`);

        const details = changes.length > 0 ? `Cambios: ${changes.join(', ')}` : 'Guardado sin cambios notables';

        logAction('tax_config_update', details);
        setTaxConfig(localTaxConfig);
        setIsVerified(false); // Volver a bloquear tras guardar
        setShowSaveConfirm(false);
        back();
    };

    if (!isVerified) {
        return (
            <div className={`scale-${uiScale}`} style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
                <SecurityModal
                    isOpen={true}
                    onClose={back}
                    onConfirm={() => setIsVerified(true)}
                    userPassword={user.password}
                    message="Ingrese su contraseña para acceder a la configuración de impuestos"
                />
            </div>
        );
    }

    return (
        <div className={`scale-${uiScale}`}>
            <SecurityModal
                isOpen={showSaveConfirm}
                onClose={() => setShowSaveConfirm(false)}
                onConfirm={handleSave}
                userPassword={user.password}
                title="Confirmar Cambios"
                message="Ingrese su contraseña para guardar la nueva configuración"
                confirmText="Guardar Cambios"
            />
            <ConfirmDiscardModal
                isOpen={showDiscardConfirm}
                onClose={() => setShowDiscardConfirm(false)}
                onDiscard={() => {
                    setShowDiscardConfirm(false);
                    back();
                }}
                title="¿Descartar cambios?"
                message="Tienes cambios sin guardar en la configuración de impuestos. Si sales ahora, se perderán las modificaciones realizadas. ¿Estás seguro de que deseas salir sin guardar?"
                discardText="Salir sin Guardar"
                cancelText="Seguir Editando"
            />
            <div className="page-container">
                <div className="title-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button onClick={handleBack} className="btn-back">
                            ← Volver al panel
                        </button>
                        {setUiScale && (
                            <SettingsControls
                                uiScale={uiScale}
                                setUiScale={setUiScale}
                                showOrientation={false}
                            />
                        )}
                    </div>

                    <button
                        onClick={() => setShowSaveConfirm(true)}
                        style={{
                            padding: "10px 30px",
                            borderRadius: "10px",
                            border: "none",
                            background: "var(--success-color)",
                            color: "white",
                            cursor: "pointer",
                            fontWeight: 'bold',
                            boxShadow: '0 4px 12px var(--success-color-alpha-20)'
                        }}
                    >
                        Guardar
                    </button>
                </div>

                <h1 className="page-main-title">CONFIGURACIÓN DE IMPUESTOS</h1>

                <div className="glass-card" style={{ cursor: 'default', marginTop: '2rem' }}>
                    <div style={{ fontSize: "1.125em", fontWeight: 700, marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Activar Impuestos</span>
                        <div
                            onClick={() => setLocalTaxConfig({ ...localTaxConfig, enabled: !localTaxConfig.enabled })}
                            style={{
                                width: '50px', height: '24px', background: localTaxConfig.enabled ? 'var(--primary-color)' : 'var(--input-border)',
                                borderRadius: '4px', position: 'relative', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <div style={{
                                width: '18px', height: '18px', background: 'white', borderRadius: '2px',
                                position: 'absolute', top: '2px', left: localTaxConfig.enabled ? '28px' : '2px',
                                transition: 'all 0.2s'
                            }} />
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '1.5rem',
                        opacity: localTaxConfig.enabled ? 1 : 0.5,
                        pointerEvents: localTaxConfig.enabled ? 'auto' : 'none',
                        transition: 'opacity 0.3s'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ fontSize: '0.85em', opacity: 0.7 }}>Nombre del Impuesto</label>
                            <input
                                type="text"
                                value={localTaxConfig.name}
                                onChange={e => setLocalTaxConfig({ ...localTaxConfig, name: e.target.value })}
                                placeholder="Ej. IVA, VAT, IGV"
                                style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ fontSize: '0.85em', opacity: 0.7 }}>Porcentaje (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={inputValue}
                                onFocus={() => {
                                    if (localTaxConfig.percentage === 0) setInputValue('');
                                }}
                                onBlur={() => {
                                    if (inputValue === '') {
                                        setInputValue('0');
                                        setLocalTaxConfig({ ...localTaxConfig, percentage: 0 });
                                    }
                                }}
                                onChange={e => {
                                    const raw = e.target.value;
                                    setInputValue(raw);

                                    const val = Number(raw);
                                    if (raw !== '' && !isNaN(val)) {
                                        if (val >= 0 && val <= 100) {
                                            setLocalTaxConfig({ ...localTaxConfig, percentage: val });
                                        } else if (val < 0) {
                                            setLocalTaxConfig({ ...localTaxConfig, percentage: 0 });
                                            setInputValue('0');
                                        } else if (val > 100) {
                                            setLocalTaxConfig({ ...localTaxConfig, percentage: 100 });
                                            setInputValue('100');
                                        }
                                    }
                                }}
                                style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ fontSize: '0.85em', opacity: 0.7 }}>Modo de Cálculo</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => setLocalTaxConfig({ ...localTaxConfig, mode: 'inclusive' })}
                                    style={{
                                        flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none',
                                        background: localTaxConfig.mode === 'inclusive' ? 'var(--primary-color)' : 'var(--card-hover-bg)',
                                        color: localTaxConfig.mode === 'inclusive' ? 'white' : 'var(--text-color)', cursor: 'pointer', fontSize: '0.85em'
                                    }}
                                >
                                    El precio YA incluye impuesto
                                </button>
                                <button
                                    onClick={() => setLocalTaxConfig({ ...localTaxConfig, mode: 'exclusive' })}
                                    style={{
                                        flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none',
                                        background: localTaxConfig.mode === 'exclusive' ? 'var(--primary-color)' : 'var(--card-hover-bg)',
                                        color: localTaxConfig.mode === 'exclusive' ? 'white' : 'var(--text-color)', cursor: 'pointer', fontSize: '0.85em'
                                    }}
                                >
                                    Se agrega al final
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ fontSize: '0.85em', opacity: 0.7 }}>Redondeo</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => setLocalTaxConfig({ ...localTaxConfig, rounding: 'total' })}
                                    style={{
                                        flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none',
                                        background: localTaxConfig.rounding === 'total' ? 'var(--primary-color)' : 'var(--card-hover-bg)',
                                        color: localTaxConfig.rounding === 'total' ? 'white' : 'var(--text-color)', cursor: 'pointer', fontSize: '0.85em'
                                    }}
                                >
                                    Por Total
                                </button>
                                <button
                                    onClick={() => setLocalTaxConfig({ ...localTaxConfig, rounding: 'item' })}
                                    style={{
                                        flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none',
                                        background: localTaxConfig.rounding === 'item' ? 'var(--primary-color)' : 'var(--card-hover-bg)',
                                        color: localTaxConfig.rounding === 'item' ? 'white' : 'var(--text-color)', cursor: 'pointer', fontSize: '0.85em'
                                    }}
                                >
                                    Por Línea
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sección de vista previa */}
                    {(() => {
                        const isExclusive = localTaxConfig.mode === 'exclusive';
                        const taxPercentage = Math.max(0, localTaxConfig.percentage || 0);
                        const taxRate = taxPercentage / 100;
                        const taxName = (localTaxConfig.name || '').trim() || 'IVA';

                        // Cálculo considerando el precio de venta como subtotal base de $100.00
                        const exampleBase = 100;
                        const previewSubtotal = isExclusive
                            ? exampleBase
                            : (taxRate > 0 ? exampleBase / (1 + taxRate) : exampleBase);

                        const previewTaxAmount = isExclusive
                            ? exampleBase * taxRate
                            : (exampleBase - previewSubtotal);

                        const previewTotal = isExclusive
                            ? previewSubtotal + previewTaxAmount
                            : exampleBase;

                        return (
                            <div className="tax-preview-panel">
                                <div className="tax-preview-header">
                                    <div className="tax-preview-title">
                                        <span>Vista previa de ejemplo</span>
                                    </div>
                                    <div className={`tax-preview-badge ${isExclusive ? 'tax-preview-badge-exclusive' : 'tax-preview-badge-inclusive'}`}>
                                        {isExclusive ? 'Modo: Impuesto agregado al subtotal' : 'Modo: Impuesto incluido en el precio'}
                                    </div>
                                </div>

                                <div className="tax-preview-grid">
                                    {/* 1. Subtotal */}
                                    <div className="tax-preview-card">
                                        <div className="tax-preview-label">Subtotal</div>
                                        <div className="tax-preview-amount">${previewSubtotal.toFixed(2)}</div>
                                        <div className="tax-preview-subtext">
                                            {isExclusive ? 'Base antes de impuesto' : 'Base gravable desglosada'}
                                        </div>
                                    </div>

                                    {/* Separador + */}
                                    <div className="tax-preview-operator" title="Suma de impuesto" aria-label="Más">
                                        +
                                    </div>

                                    {/* 2. IVA */}
                                    <div className="tax-preview-card tax-preview-card-tax">
                                        <div className="tax-preview-label tax-preview-label-tax">
                                            {taxName} ({taxPercentage}%)
                                        </div>
                                        <div className="tax-preview-amount tax-preview-amount-tax">
                                            +${previewTaxAmount.toFixed(2)}
                                        </div>
                                        <div className="tax-preview-subtext">
                                            {isExclusive ? 'Importe agregado' : 'Impuesto incluido'}
                                        </div>
                                    </div>

                                    {/* Separador = */}
                                    <div className="tax-preview-operator" title="Total a pagar" aria-label="Igual">
                                        =
                                    </div>

                                    {/* 3. Total a pagar por el cliente */}
                                    <div className="tax-preview-card tax-preview-card-total">
                                        <div className="tax-preview-label tax-preview-label-total">
                                            Total a pagar por el cliente
                                        </div>
                                        <div className="tax-preview-amount tax-preview-amount-total">
                                            ${previewTotal.toFixed(2)}
                                        </div>
                                        <div className="tax-preview-subtext" style={{ color: 'rgba(74, 222, 128, 0.8)' }}>
                                            {isExclusive ? 'Subtotal + Impuesto' : 'Precio final al comensal'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};

export default TaxSettings;
