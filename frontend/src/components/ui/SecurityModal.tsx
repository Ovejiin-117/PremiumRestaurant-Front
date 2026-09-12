import React from 'react';
import { createPortal } from 'react-dom';

interface SecurityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    userPassword?: string; // Opcional: si se proporciona, validará internamente. Si no, asume validación externa o solo una confirmación.
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
}

const SecurityModal: React.FC<SecurityModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    userPassword,
    title = "Seguridad",
    message = "Ingresa **tu contraseña** para confirmar.",
    confirmText = "Confirmar",
    cancelText = "Cancelar"
}) => {
    const [input, setInput] = React.useState("");
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        if (isOpen) {
            setInput("");
            setError("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (userPassword !== undefined) {
            if (input === userPassword) {
                onConfirm();
            } else {
                setError("Contraseña incorrecta");
            }
        } else {
            onConfirm();
        }
    };

    const modalUI = (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.85)',
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
                    width: '100%',
                    maxWidth: '26rem',
                    padding: '2.5rem',
                    textAlign: 'center',
                    cursor: 'default'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ background: 'var(--primary-color-alpha-20)', width: '4rem', height: '4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                    <span style={{ fontSize: '2em' }}>🔒</span>
                </div>

                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5em', fontWeight: 'bold' }}>{title}</h3>
                <p
                    style={{ margin: '0 0 2rem 0', opacity: 0.7, fontSize: '0.95em', lineHeight: '1.5' }}
                    dangerouslySetInnerHTML={{ __html: message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                />

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <input
                        type="password"
                        value={input}
                        onChange={e => { setInput(e.target.value); setError(""); }}
                        placeholder="Contraseña"
                        style={{
                            textAlign: 'center',
                            fontSize: '1.1em',
                            padding: '1em',
                            borderColor: error ? 'var(--danger-color)' : undefined
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleConfirm();
                        }}
                        autoFocus
                    />
                    {error && (
                        <div style={{ color: 'var(--danger-color)', fontSize: '0.85em', fontWeight: '600', marginTop: '0.5rem' }}>
                            ⚠️ {error}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={onClose}
                        style={{ flex: 1, padding: '1em', background: 'var(--card-hover-bg)', border: '1px solid var(--card-border)', borderRadius: '0.75rem', color: 'var(--text-color)', cursor: 'pointer', fontWeight: '600' }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        style={{ flex: 1, padding: '1em', background: 'var(--primary-color)', border: 'none', borderRadius: '0.75rem', color: 'white', cursor: 'pointer', fontWeight: 'bold', boxShadow: `0 4px 12px var(--primary-color-alpha-20)` }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalUI, document.body);
};

export default SecurityModal;
