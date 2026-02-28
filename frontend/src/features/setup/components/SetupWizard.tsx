import { useState, useEffect } from 'react';

type Props = {
    onComplete: (devPassword: string) => void;
    theme: 'light' | 'dark';
    setTheme: (t: 'light' | 'dark') => void;
};

type Step = 'language' | 'business_type' | 'dev_setup' | 'tutorial';

const LANGUAGES = [
    { code: 'es', label: 'Español', welcome: 'Bienvenido' },
    { code: 'en', label: 'English', welcome: 'Welcome' },
    { code: 'fr', label: 'Français', welcome: 'Bienvenue' },
    { code: 'pt', label: 'Português', welcome: 'Bem-vindo' }
];

const TUTORIAL_SLIDES = [
    {
        title: "Gestiona tu Negocio",
        desc: "Control total sobre tus productos, categorías y precios. Todo organizado y fácil de editar.",
        icon: "📊"
    },
    {
        title: "Toma de Pedidos Ágil",
        desc: "Interfaz optimizada para pantallas táctiles. Agrega productos a la orden con un solo toque.",
        icon: "⚡"
    },
    {
        title: "Seguridad Primero",
        desc: "Las acciones sensibles requieren contraseña. Protege tu negocio con cuentas de meseros y gerentes.",
        icon: "🔒"
    }
];

export default function SetupWizard({ onComplete, theme, setTheme }: Props) {
    const [step, setStep] = useState<Step>('language');
    const [langIndex, setLangIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    // Developer Setup State
    const [devPassword, setDevPassword] = useState("");
    const [confirmDevPassword, setConfirmDevPassword] = useState("");
    const [error, setError] = useState("");

    // Tutorial State
    const [slideIndex, setSlideIndex] = useState(0);

    // Typewriter Effect for "Welcome"
    useEffect(() => {
        if (step !== 'language') return;

        const currentWord = LANGUAGES[langIndex].welcome;
        const typeSpeed = isDeleting ? 50 : 100;
        const pauseTime = 2000;

        const handleType = () => {
            const currentLength = displayedText.length;

            if (!isDeleting && currentLength < currentWord.length) {
                setDisplayedText(currentWord.substring(0, currentLength + 1));
            } else if (isDeleting && currentLength > 0) {
                setDisplayedText(currentWord.substring(0, currentLength - 1));
            } else if (!isDeleting && currentLength === currentWord.length) {
                setTimeout(() => setIsDeleting(true), pauseTime);
                return;
            } else if (isDeleting && currentLength === 0) {
                setIsDeleting(false);
                setLangIndex((prev) => (prev + 1) % LANGUAGES.length);
                return;
            }
        };

        const timer = setTimeout(handleType, typeSpeed);
        return () => clearTimeout(timer);
    }, [displayedText, isDeleting, langIndex, step]);

    const handleLanguageSelect = (code: string) => {
        if (code !== 'es') {
            alert("This language is coming soon! / ¡Este idioma estará disponible pronto! (Solo Español for now)");
            return;
        }
        setStep('business_type');
    };

    const handleBusinessTypeSelect = (type: 'restaurant' | 'local') => {
        if (type === 'restaurant') {
            alert("La versión para Restaurantes (mesas, cocina, etc.) está en desarrollo. Por favor selecciona 'Negocio Local' para la versión actual.");
            return;
        }
        setStep('dev_setup');
    };

    const handleDevSetupSubmit = () => {
        if (devPassword.length < 4) {
            setError("La contraseña debe tener al menos 4 caracteres.");
            return;
        }
        if (devPassword !== confirmDevPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }
        setStep('tutorial');
    };

    const handleFinish = () => {
        onComplete(devPassword);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'var(--bg-color)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Outfit', sans-serif", color: 'var(--text-color)'
        }}>
            {/* Background Effects */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'var(--bg-color)',
                zIndex: -1
            }}></div>

            <div className="glass-card" style={{
                width: '100%', maxWidth: '500px', minHeight: '400px',
                padding: '3rem', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                boxShadow: '0 25px 50px -12px var(--watermark-color)',
                border: '1px solid var(--card-border)',
                position: 'relative'
            }}>
                {/* Theme Toggle */}
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    style={{
                        position: 'absolute', top: '1.5rem', right: '1.5rem',
                        background: 'var(--card-hover-bg)', border: '1px solid var(--card-border)',
                        borderRadius: '0.5rem', color: 'var(--text-color)', padding: '0.5rem',
                        cursor: 'pointer', fontSize: '1.2em', zIndex: 10
                    }}
                    title="Cambiar Tema"
                >
                    {theme === 'dark' ? '☀️' : '🌙'}
                </button>

                {/* STEP 1: LANGUAGE */}
                {step === 'language' && (
                    <>
                        <div style={{ height: '80px', display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                            <h1 style={{ fontSize: '3.5rem', margin: 0, fontWeight: 900, background: 'linear-gradient(to right, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                {displayedText}<span className="blink-cursor">|</span>
                            </h1>
                        </div>

                        <p style={{ opacity: 0.7, marginBottom: '2rem' }}>Select your language / Selecciona tu idioma</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%' }}>
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleLanguageSelect(lang.code)}
                                    style={{
                                        padding: '1rem',
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--card-border)',
                                        borderRadius: '12px',
                                        color: 'var(--text-color)',
                                        fontSize: '1.1rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontWeight: 'bold'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-color-alpha-20)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'var(--card-bg)'}
                                >
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* STEP 2: BUSINESS TYPE */}
                {step === 'business_type' && (
                    <>
                        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Tipo de Negocio</h2>
                        <p style={{ opacity: 0.7, marginBottom: '2.5rem' }}>Personalizaremos la experiencia para ti.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                            <button
                                onClick={() => handleBusinessTypeSelect('restaurant')}
                                style={{
                                    padding: '1.5rem',
                                    background: 'var(--card-bg)',
                                    border: '1px solid var(--card-border)',
                                    borderRadius: '16px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    opacity: 0.6
                                }}
                            >
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-color)' }}>🍽️ Restaurante</div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.7, color: 'var(--text-secondary)' }}>Con gestión de mesas, cocina y meseros. (Próximamente)</div>
                            </button>

                            <button
                                onClick={() => handleBusinessTypeSelect('local')}
                                style={{
                                    padding: '1.5rem',
                                    background: 'var(--primary-color-alpha-20)',
                                    border: '2px solid var(--primary-color)',
                                    borderRadius: '16px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    transform: 'scale(1.02)',
                                    boxShadow: '0 10px 25px -5px var(--primary-color-alpha-20)'
                                }}
                            >
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '4px', color: 'var(--primary-color)' }}>🏪 Negocio Local / Café</div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.8, color: 'var(--text-color)' }}>Punto de venta rápido, inventario simple y reportes.</div>
                            </button>
                        </div>
                    </>
                )}

                {/* STEP 3: DEV SETUP */}
                {step === 'dev_setup' && (
                    <>
                        <div style={{ background: '#3b82f6', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: '1.5rem' }}>🛡️</div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Cuenta de Desarrollador</h2>
                        <p style={{ opacity: 0.7, marginBottom: '2rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                            Esta cuenta tendrá acceso total al sistema. <br />
                            <span style={{ color: '#f87171', fontWeight: 'bold' }}>¡No pierdas esta contraseña!</span>
                        </p>

                        <div style={{ width: '100%', marginBottom: '1rem', textAlign: 'left' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', marginLeft: '4px', marginBottom: '4px', display: 'block', color: 'var(--text-secondary)' }}>CONTRASEÑA MAESTRA</label>
                            <input
                                type="password"
                                value={devPassword}
                                onChange={e => { setDevPassword(e.target.value); setError(""); }}
                                placeholder="Ingresa una contraseña segura"
                                style={{
                                    width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--card-border)',
                                    background: 'var(--input-bg)', color: 'var(--text-color)', fontSize: '1rem', boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ width: '100%', marginBottom: '2rem', textAlign: 'left' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', marginLeft: '4px', marginBottom: '4px', display: 'block', color: 'var(--text-secondary)' }}>CONFIRMAR CONTRASEÑA</label>
                            <input
                                type="password"
                                value={confirmDevPassword}
                                onChange={e => { setConfirmDevPassword(e.target.value); setError(""); }}
                                placeholder="Repite la contraseña"
                                style={{
                                    width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--card-border)',
                                    background: 'var(--input-bg)', color: 'var(--text-color)', fontSize: '1rem', boxSizing: 'border-box'
                                }}
                            />
                            {error && <div style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: 'bold' }}>{error}</div>}
                        </div>

                        <button
                            onClick={handleDevSetupSubmit}
                            style={{
                                width: '100%', padding: '1rem', borderRadius: '12px', border: 'none',
                                background: '#22c55e', color: 'white', fontSize: '1.1rem', fontWeight: 'bold',
                                cursor: 'pointer', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)'
                            }}
                        >
                            Crear Cuenta
                        </button>
                    </>
                )}

                {/* STEP 4: TUTORIAL */}
                {step === 'tutorial' && (
                    <>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>{TUTORIAL_SLIDES[slideIndex].icon}</div>
                            <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>{TUTORIAL_SLIDES[slideIndex].title}</h2>
                            <p style={{ opacity: 0.8, lineHeight: '1.6', maxWidth: '300px', margin: '0 auto' }}>
                                {TUTORIAL_SLIDES[slideIndex].desc}
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginBottom: '2.5rem', marginTop: '2rem' }}>
                            {TUTORIAL_SLIDES.map((_, idx) => (
                                <div key={idx} style={{
                                    width: '8px', height: '8px', borderRadius: '50%',
                                    background: idx === slideIndex ? 'var(--primary-color)' : 'var(--card-border)',
                                    transition: 'all 0.3s'
                                }}></div>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                if (slideIndex < TUTORIAL_SLIDES.length - 1) {
                                    setSlideIndex(prev => prev + 1);
                                } else {
                                    handleFinish();
                                }
                            }}
                            style={{
                                width: '100%', padding: '1rem', borderRadius: '12px', border: 'none',
                                background: '#3b82f6', color: 'white', fontSize: '1.1rem', fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            {slideIndex < TUTORIAL_SLIDES.length - 1 ? "Siguiente" : "¡Comenzar!"}
                        </button>
                    </>
                )}

            </div>

            <style>{`
                @keyframes blink { 50% { opacity: 0; } }
                .blink-cursor { animation: blink 1s step-end infinite; }
            `}</style>
        </div>
    );
}
