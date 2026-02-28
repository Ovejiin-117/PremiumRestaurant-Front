import React from 'react';

interface ConfirmButtonProps {
    id: string;
    activeId: string | null;
    setActiveId: (id: string | null) => void;
    onAction: () => void;
    label: string;
    confirmLabel?: string;
    color?: string;
    confirmColor?: string;
    style?: React.CSSProperties;
}

const ConfirmButton: React.FC<ConfirmButtonProps> = ({
    id,
    activeId,
    setActiveId,
    onAction,
    label,
    confirmLabel = 'CONFIRMAR',
    color,
    confirmColor,
    style = {}
}) => {
    const isConfirming = activeId === id;

    // Detect if this is a DELETE button by label to use red colors if not specified
    const isDelete = label === 'ELIMINAR';
    const finalColor = isConfirming
        ? (confirmColor || (isDelete ? 'var(--danger-color)' : 'var(--primary-color)'))
        : (color || (isDelete ? 'var(--danger-color)' : 'var(--primary-color)'));

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                if (isConfirming) {
                    onAction();
                    setActiveId(null);
                } else {
                    setActiveId(id);
                }
            }}
            style={{
                background: finalColor,
                color: 'white',
                border: isConfirming ? '2px solid rgba(255,255,255,0.8)' : '1px solid rgba(255,255,255,0.3)',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
                padding: '0.625em 1.25em',
                fontSize: '0.875em',
                borderRadius: '0.5em',
                ...style,
            }}
        >
            {isConfirming ? confirmLabel : label}
        </button>
    );
};

export default ConfirmButton;
