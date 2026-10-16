import type { User, UIScale, Theme } from '../types';
import CustomSelect from '../components/ui/CustomSelect';
import { useSettings } from '../context/useSettings';

type Props = {
    back: () => void;
    user: User | null;
    uiScale?: UIScale;
    // Props opcionales para compatibilidad si se pasan directamente
    theme?: Theme;
    setTheme?: (t: Theme) => void;
    animationsEnabled?: boolean;
    setAnimationsEnabled?: (e: boolean) => void;
    globalScale?: number;
    setGlobalScale?: (n: number) => void;
    performanceMode?: boolean;
    setPerformanceMode?: (e: boolean) => void;
    showImages?: boolean;
    setShowImages?: (e: boolean) => void;
};

export default function VisualSettings({
    back, user, uiScale,
    theme: propTheme,
    animationsEnabled: propAnim,
    globalScale: propScale,
    performanceMode: propPerf,
    showImages: propImages
}: Props) {
    const settings = useSettings();

    // Preferir settings de context con fallback a props
    const theme = propTheme !== undefined ? propTheme : settings.theme;
    const updateTheme = settings.updateTheme;
    const animationsEnabled = propAnim !== undefined ? propAnim : settings.animationsEnabled;
    const setAnimationsEnabled = settings.setAnimationsEnabled;
    const globalScale = propScale !== undefined ? propScale : settings.globalScale;
    const setGlobalScale = settings.setGlobalScale;
    const performanceMode = propPerf !== undefined ? propPerf : settings.performanceMode;
    const setPerformanceMode = settings.setPerformanceMode;
    const showImages = propImages !== undefined ? propImages : settings.showImages;
    const setShowImages = settings.setShowImages;

    const isAdmin = user?.role === 'developer';

    return (
        <div className={`scale-${uiScale || 'medium'}`}>
            <div className="page-container">
                <div className="title-bar">
                    <button className="btn-back" onClick={back} style={{ margin: 0 }}>
                        ← VOLVER AL PANEL
                    </button>
                </div>

                <div style={{ marginBottom: '2.5rem', borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.75rem' }}>
                    <h1 className="page-main-title" style={{ marginBottom: '0.5rem' }}>
                        CONFIGURACIÓN DE INTERFAZ
                    </h1>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', opacity: 0.5, letterSpacing: '1px' }}>
                        SISTEMA DE CONTROL DE VISUALIZACIÓN • SYNKODE OS v0.2.0
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>

                    {/* SECCIÓN: APARIENCIA */}
                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1.5rem',
                            borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between'
                        }}>
                            <span style={{ fontWeight: '900', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--primary-color)' }}>
                                01. PARÁMETROS DE APARIENCIA
                            </span>
                        </div>

                        <div style={{ padding: '0' }}>
                            {/* Fila de tema */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '0.95rem', textTransform: 'uppercase' }}>Modo de Visualización</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Cambiar entre entorno de trabajo claro y oscuro</div>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={theme === 'dark'}
                                    aria-label="Alternar tema oscuro o claro"
                                    onClick={() => updateTheme(theme === 'dark' ? 'light' : 'dark')}
                                    style={{
                                        width: '50px', height: '24px',
                                        background: theme === 'dark' ? 'var(--primary-color)' : 'var(--input-border)',
                                        borderRadius: '4px', position: 'relative', cursor: 'pointer',
                                        transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.1)',
                                        padding: 0
                                    }}
                                >
                                    <div style={{
                                        width: '18px', height: '18px', background: 'white', borderRadius: '2px',
                                        position: 'absolute', top: '2px', left: theme === 'dark' ? '28px' : '2px',
                                        transition: 'all 0.2s', pointerEvents: 'none'
                                    }} />
                                </button>
                            </div>

                            {/* Fila de animaciones */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '1.25rem 1.5rem'
                            }}>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '0.95rem', textTransform: 'uppercase' }}>Animaciones Dinámicas</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Efectos de transición y suavizado de elementos</div>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={animationsEnabled}
                                    aria-label="Alternar animaciones dinámicas"
                                    onClick={() => setAnimationsEnabled(prev => !prev)}
                                    style={{
                                        width: '50px', height: '24px',
                                        background: animationsEnabled ? 'var(--success-color)' : 'var(--input-border)',
                                        borderRadius: '4px', position: 'relative', cursor: 'pointer',
                                        transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.1)',
                                        padding: 0
                                    }}
                                >
                                    <div style={{
                                        width: '18px', height: '18px', background: 'white', borderRadius: '2px',
                                        position: 'absolute', top: '2px', left: animationsEnabled ? '28px' : '2px',
                                        transition: 'all 0.2s', pointerEvents: 'none'
                                    }} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN: RENDIMIENTO */}
                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1.5rem',
                            borderBottom: '1px solid var(--card-border)'
                        }}>
                            <span style={{ fontWeight: '900', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--primary-color)' }}>
                                02. OPTIMIZACIÓN DE HARDWARE
                            </span>
                        </div>

                        <div style={{ padding: '0' }}>
                            {/* Fila de rendimiento */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '0.95rem', textTransform: 'uppercase' }}>Modo de Bajo Consumo</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Desactiva efectos de transparencia para mejorar la respuesta</div>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={performanceMode}
                                    aria-label="Alternar modo de bajo consumo"
                                    onClick={() => setPerformanceMode(prev => !prev)}
                                    style={{
                                        width: '50px', height: '24px',
                                        background: performanceMode ? 'var(--warning-color)' : 'var(--input-border)',
                                        borderRadius: '4px', position: 'relative', cursor: 'pointer',
                                        transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.1)',
                                        padding: 0
                                    }}
                                >
                                    <div style={{
                                        width: '18px', height: '18px', background: 'white', borderRadius: '2px',
                                        position: 'absolute', top: '2px', left: performanceMode ? '28px' : '2px',
                                        transition: 'all 0.2s', pointerEvents: 'none'
                                    }} />
                                </button>
                            </div>

                            {/* Fila de imágenes */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '1.25rem 1.5rem'
                            }}>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '0.95rem', textTransform: 'uppercase' }}>Renderizado de Multimedia</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Habilitar la carga de imágenes en el catálogo de productos</div>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={showImages}
                                    aria-label="Alternar renderizado de imágenes"
                                    onClick={() => setShowImages(prev => !prev)}
                                    style={{
                                        width: '50px', height: '24px',
                                        background: showImages ? 'var(--primary-color)' : 'var(--input-border)',
                                        borderRadius: '4px', position: 'relative', cursor: 'pointer',
                                        transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.1)',
                                        padding: 0
                                    }}
                                >
                                    <div style={{
                                        width: '18px', height: '18px', background: 'white', borderRadius: '2px',
                                        position: 'absolute', top: '2px', left: showImages ? '28px' : '2px',
                                        transition: 'all 0.2s', pointerEvents: 'none'
                                    }} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN: DESARROLLADOR */}
                    {isAdmin && (
                        <div className="glass-card" style={{
                            padding: 0, overflow: 'hidden',
                            border: '1px solid var(--primary-color-alpha-20)',
                            background: 'var(--primary-color-alpha-10)'
                        }}>
                            <div style={{
                                background: 'var(--primary-color-alpha-20)', padding: '0.75rem 1.5rem',
                                borderBottom: '1px solid var(--primary-color-alpha-20)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <span style={{ fontWeight: '900', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--primary-color)' }}>
                                    03. CONTROL DE ESCALADO MAESTRO
                                </span>
                                <span style={{ fontSize: '0.65rem', fontWeight: '900', background: 'var(--primary-color)', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>ADMIN</span>
                            </div>

                            <div style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '0.95rem', textTransform: 'uppercase' }}>Escala Global del Núcleo</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Modificador de densidad de UI para todo el sistema remoto</div>
                                    </div>
                                    <CustomSelect
                                        value={globalScale.toString()}
                                        onChange={(val: string) => setGlobalScale(Number(val))}
                                        options={[
                                            { value: "1", label: "100% (ESTÁNDAR)" },
                                            { value: "0.9", label: "90% (COMPACTO)" },
                                            { value: "0.8", label: "80% (DENSO)" }
                                        ]}
                                        width="220px"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{
                    marginTop: '4rem', padding: '1.5rem 0',
                    borderTop: '1px solid var(--card-border)',
                    textAlign: 'center', opacity: 0.2,
                    fontSize: '0.7rem', fontWeight: '900',
                    letterSpacing: '0.2em'
                }}>
                    SYNKODE INDUSTRIAL SOLUTIONS • © 2024 • TODOS LOS DERECHOS RESERVADOS
                </div>
            </div>
        </div>
    );
}
