import React from 'react';
import type { User, TaxConfig, UIScale, LayoutOrientation, AuditAction } from '../types';
import SecurityModal from '../components/ui/SecurityModal';

interface Props {
    user: User;
    taxConfig: TaxConfig;
    setTaxConfig: (c: TaxConfig) => void;
    back: () => void;
    uiScale: UIScale;
    layoutOrientation: LayoutOrientation;
    logAction: (action: AuditAction, details: string, entityId?: string) => void;
}

const TaxSettings: React.FC<Props> = ({ user, taxConfig: globalTaxConfig, setTaxConfig, back, uiScale, logAction }) => {
    const isAdmin = user.role === 'developer';
    const isManager = user.role === 'manager';

    const [localTaxConfig, setLocalTaxConfig] = React.useState(globalTaxConfig);
    const [inputValue, setInputValue] = React.useState(globalTaxConfig.percentage.toString());
    const [isVerified, setIsVerified] = React.useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = React.useState(false);

    React.useEffect(() => {
        setInputValue(localTaxConfig.percentage.toString());
    }, [localTaxConfig.percentage]);

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
        setIsVerified(false); // Relock after save
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
            <div className="page-container">
                <div className="title-bar">
                    <div>
                        <div style={{ fontSize: "1.25em", fontWeight: 700 }}>Configuración de Impuestos</div>
                        <div style={{ opacity: 0.8, fontSize: "0.875em" }}>Gestiona el IVA y otros cargos</div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={back} className="btn-back">
                            ← Volver al panel
                        </button>

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
                </div>

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

                    {/* Preview Section */}
                    <div style={{ marginTop: '2.5rem', padding: '2rem', background: 'var(--card-hover-bg)', borderRadius: '1rem', border: '1px solid var(--card-border)' }}>
                        <div style={{ fontSize: '0.85em', fontWeight: 700, opacity: 0.7, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>VISTA PREVIA DE EJEMPLO</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
                            <div style={{ textAlign: 'center', flex: 1 }}>
                                <div style={{ fontSize: '0.8em', opacity: 0.6, marginBottom: '0.5rem' }}>Precio Venta (Ejemplo)</div>
                                <div style={{ fontSize: '1.5em', fontWeight: 700 }}>$100.00</div>
                            </div>
                            <div style={{ fontSize: '2em', opacity: 0.3 }}>→</div>
                            <div style={{ textAlign: 'center', flex: 1 }}>
                                <div style={{ fontSize: '0.8em', opacity: 0.6, marginBottom: '0.5rem' }}>{localTaxConfig.name} ({localTaxConfig.percentage}%)</div>
                                <div style={{ fontSize: '1.5em', fontWeight: 700, color: 'var(--danger-color)' }}>
                                    -${localTaxConfig.mode === 'exclusive' ? (100 * (localTaxConfig.percentage / 100)).toFixed(2) : (100 - (100 / (1 + localTaxConfig.percentage / 100))).toFixed(2)}
                                </div>
                            </div>
                            <div style={{ fontSize: '2em', opacity: 0.3 }}>→</div>
                            <div style={{ textAlign: 'center', flex: 1 }}>
                                <div style={{ fontSize: '0.8em', opacity: 0.6, marginBottom: '0.5rem' }}>Ganancia Real (Neto)</div>
                                <div style={{ fontSize: '1.5em', fontWeight: 700, color: 'var(--success-color)' }}>
                                    ${localTaxConfig.mode === 'exclusive' ? '100.00' : (100 / (1 + localTaxConfig.percentage / 100)).toFixed(2)}
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem', fontSize: '1.1em', fontWeight: 700, textAlign: 'center', color: 'var(--text-color)' }}>
                            {localTaxConfig.mode === 'exclusive'
                                ? `Total a pagar por el cliente: $${(100 * (1 + localTaxConfig.percentage / 100)).toFixed(2)}`
                                : `Total pagado por el cliente: $100.00`}
                        </div>
                        <div style={{ marginTop: '1.5rem', fontSize: '0.9em', opacity: 0.6, textAlign: 'center', background: 'var(--primary-color-alpha-10)', padding: '1rem', borderRadius: '0.5rem', color: 'var(--primary-color)' }}>
                            {localTaxConfig.mode === 'inclusive'
                                ? `Ejemplo: Subtotal 100.00 → El precio YA incluye impuesto.`
                                : `Ejemplo: Subtotal 100.00 → Impuesto ${(100 * (localTaxConfig.percentage / 100)).toFixed(2)} → Total ${(100 * (1 + localTaxConfig.percentage / 100)).toFixed(2)}`}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxSettings;
