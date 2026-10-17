interface Props {
    reprintingOrder: string | null;
    reprintStatus: 'printing' | 'success' | null;
}

export default function ReprintNotification({ reprintingOrder, reprintStatus }: Props) {
    if (!reprintingOrder) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '2rem',
            right: 'min(2rem, 4vw)',
            maxWidth: 'calc(100vw - 2rem)',
            zIndex: 2000,
            animation: 'slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
            <div style={{
                background: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '1.25rem 2rem',
                borderRadius: '1rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                maxWidth: '100%',
                boxSizing: 'border-box'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '4px',
                    background: reprintStatus === 'printing' ? 'var(--primary-color-alpha-20)' : 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    animation: reprintStatus === 'printing' ? 'pulse 2s infinite' : 'none'
                }}>
                    {reprintStatus === 'printing' ? '🖨️' : '✅'}
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        color: 'white',
                        marginBottom: '4px'
                    }}>
                        {reprintStatus === 'printing' ? 'Reimprimiendo ticket...' : '¡Impresión enviada!'}
                    </div>
                    <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)'
                    }}>
                        {reprintStatus === 'printing'
                            ? `Enviando orden #${reprintingOrder.slice(0, 8)} a la impresora térmica`
                            : 'El documento se ha transferido exitosamente'
                        }
                    </div>
                </div>

                {reprintStatus === 'printing' && (
                    <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        borderTopColor: 'var(--primary-color)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                )}
            </div>
        </div>
    );
}
