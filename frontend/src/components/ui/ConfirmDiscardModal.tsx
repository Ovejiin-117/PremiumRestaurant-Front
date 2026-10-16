import React from 'react';

interface ConfirmDiscardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDiscard: () => void;
    title?: string;
    message?: string;
    discardText?: string;
    cancelText?: string;
}

const ConfirmDiscardModal: React.FC<ConfirmDiscardModalProps> = ({
    isOpen,
    onClose,
    onDiscard,
    title = "¿Descartar cambios?",
    message = "Tienes cambios sin guardar. Si sales ahora, se perderán todas las modificaciones realizadas. ¿Estás seguro de que deseas salir?",
    discardText = "Salir sin Guardar",
    cancelText = "Seguir Editando"
}) => {
    React.useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 999999,
                padding: '1.5rem'
            }}
            onClick={onClose}
        >
            <div
                className="glass-card"
                style={{
                    maxWidth: 'min(92vw, 28rem)',
                    width: '100%',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    padding: 'clamp(1.75rem, 4vw, 2.5rem)',
                    cursor: 'default',
                    boxSizing: 'border-box'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{
                    width: '4.5rem',
                    height: '4.5rem',
                    background: 'rgba(239, 68, 68, 0.12)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    fontSize: '2.2em',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                    ⚠️
                </div>

                <div>
                    <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5em', fontWeight: 'bold', color: 'white' }}>
                        {title}
                    </h2>
                    <p style={{ margin: 0, opacity: 0.8, lineHeight: '1.6', fontSize: '1em', color: 'var(--text-color)' }}>
                        {message}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '0.85rem 1rem',
                            borderRadius: '0.75rem',
                            background: 'var(--card-hover-bg)',
                            color: 'var(--text-color)',
                            border: '1px solid var(--card-border)',
                            fontWeight: 'bold',
                            fontSize: '1em',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onDiscard}
                        style={{
                            flex: 1,
                            padding: '0.85rem 1rem',
                            borderRadius: '0.75rem',
                            background: 'var(--danger-color)',
                            color: 'white',
                            border: 'none',
                            fontWeight: 'bold',
                            fontSize: '1em',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 12px var(--danger-color-alpha-20)'
                        }}
                    >
                        {discardText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDiscardModal;
