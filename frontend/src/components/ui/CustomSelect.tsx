import { useState, useRef, useEffect } from 'react';

interface Option<T> {
    value: T;
    label: string;
}

interface CustomSelectProps<T> {
    value: T;
    onChange: (val: T) => void;
    options: Option<T>[];
    label?: string;
    placeholder?: string;
    width?: string;
    disabled?: boolean;
    customStyle?: React.CSSProperties;
    height?: string;
}

const CustomSelect = <T extends string>({
    value,
    onChange,
    options,
    label,
    placeholder = "Seleccionar...",
    width = "auto",
    disabled = false,
    customStyle = {},
    height = "2.2em"
}: CustomSelectProps<T>) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div ref={containerRef} style={{ position: 'relative', width: width, display: 'flex', flexDirection: 'column', gap: label ? '6px' : '0' }}>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6em',
                    background: disabled ? 'rgba(255,255,255,0.03)' : 'var(--card-border)',
                    padding: '0 1.25em',
                    height: height,
                    borderRadius: '4px',
                    border: '1px solid var(--card-border)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    userSelect: 'none',
                    opacity: disabled ? 0.5 : 1,
                    boxShadow: isOpen ? '0 0 0 2px var(--primary-color-alpha-20)' : 'none',
                    minWidth: '8em',
                    flexShrink: 0,
                    flexGrow: 0,
                    ...customStyle
                }}

                onMouseEnter={e => !disabled && (e.currentTarget.style.background = 'var(--card-hover-bg)')}
                onMouseLeave={e => !disabled && !isOpen && (e.currentTarget.style.background = 'var(--card-border)')}
            >
                <span style={{
                    fontSize: '0.85em',
                    fontWeight: '700',
                    color: 'var(--text-color)',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    lineHeight: '1'
                }}>
                    {label || (selectedOption ? selectedOption.label : placeholder)}
                </span>
                <span style={{
                    fontSize: '0.7em',
                    opacity: 0.5,
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    color: 'var(--text-color)',
                    marginTop: '1px'
                }}>▼</span>
            </div>

            {isOpen && !disabled && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    minWidth: 'max-content',
                    background: 'var(--card-bg)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '4px',
                    padding: '4px',
                    zIndex: 2000,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    animation: 'selectSlideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    scrollbarWidth: 'none',
                    border: '1px solid var(--primary-color-alpha-50)'
                }}>
                    {options.length > 0 ? options.map(opt => (
                        <div
                            key={opt.value}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '2px',
                                cursor: 'pointer',
                                fontSize: '0.85em',
                                fontWeight: opt.value === value ? 'bold' : '600',
                                color: opt.value === value ? 'white' : 'var(--text-color)',
                                background: opt.value === value ? 'var(--primary-color)' : 'transparent',
                                transition: 'all 0.1s ease',
                                marginBottom: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                borderLeft: opt.value === value ? '3px solid white' : '3px solid transparent'
                            }}
                            onMouseEnter={e => {
                                if (opt.value !== value) e.currentTarget.style.background = 'var(--card-hover-bg)';
                            }}
                            onMouseLeave={e => {
                                if (opt.value !== value) e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            {opt.label}
                        </div>

                    )) : (
                        <div style={{ padding: '10px 14px', fontSize: '0.85em', opacity: 0.5, fontStyle: 'italic', textAlign: 'center' }}>
                            Sin opciones
                        </div>
                    )}
                </div>
            )}

            <style>{`
                @keyframes selectSlideIn {
                    from { opacity: 0; transform: translateY(-12px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                /* Hide scrollbar for Chrome, Safari and Opera */
                div::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default CustomSelect;
