import { useState, useEffect, useRef } from "react";
import type { User } from "../types";

type Props = {
    users: User[];
    onLogin: (user: User) => void;
    isShiftOpen: boolean;
    onShowSetup?: () => void;
    theme: 'light' | 'dark';
    setTheme: (t: 'light' | 'dark') => void;
};

export default function Login({ users, onLogin, isShiftOpen, onShowSetup, theme, setTheme }: Props) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [fade, setFade] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showError = (msg: string) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setError(msg);
        setFade(true);
        timerRef.current = setTimeout(() => {
            setFade(false);
            setTimeout(() => setError(""), 500); // Esperar a que termine el desvanecimiento
        }, 3000);
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const handleLogin = () => {
        // Buscar usuario por nombre de usuario (sin distinción de mayúsculas/minúsculas) y verificar si está activo
        const foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.active !== false);

        if (!foundUser) {
            showError("USUARIO NO EXISTENTE");
            return;
        }

        if (foundUser.role === 'waiter' && !isShiftOpen) {
            showError("TURNO CERRADO - MESEROS NO PUEDEN ACCEDER");
            return;
        }

        if (foundUser.password !== password) {
            showError("CONTRASEÑA INCORRECTA");
            return;
        }

        onLogin(foundUser);
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: 'var(--bg-color)',
                color: 'var(--text-color)',
                fontFamily: "'Outfit', sans-serif",
                padding: "1.5rem"
            }}
        >
            {/* Selector de tema */}
            <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                style={{
                    position: 'fixed',
                    top: '2rem',
                    right: '2rem',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '4px',
                    color: 'var(--text-color)',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '1.4em',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    transition: 'all 0.3s ease'
                }}
                onMouseOver={e => e.currentTarget.style.transform = "scale(1.1)"}
                onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                title="Cambiar Tema"
            >
                {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <div
                className="glass-card"
                style={{
                    width: "100%",
                    maxWidth: "400px",
                    padding: "3rem",
                    boxShadow: "0 25px 50px -12px var(--watermark-color)",
                    border: "1px solid var(--card-border)",
                    position: 'relative'
                }}
            >
                <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: "2.2rem",
                        fontWeight: "800",
                        color: "var(--text-color)",
                        fontFamily: "'Outfit', sans-serif"
                    }}>
                        RestaurantPro
                    </h1>
                    <div style={{
                        fontSize: "0.8rem",
                        opacity: 0.6,
                        marginTop: "0.4rem",
                        fontWeight: "600",
                        color: "var(--primary-color)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase"
                    }}>
                        Sistema de Gestión
                    </div>
                </div>

                {error && (
                    <div style={{
                        background: "#dc2626",
                        color: "white",
                        padding: "12px",
                        borderRadius: "8px",
                        marginBottom: "16px",
                        fontSize: "14px",
                        fontWeight: "bold",
                        textAlign: "center",
                        opacity: fade ? 1 : 0,
                        transition: "opacity 0.5s ease-in-out"
                    }}>
                        {error}
                    </div>
                )}

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" style={{ fontSize: '0.7em' }}>USUARIO</label>
                    <input
                        placeholder="Nombre de usuario"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ padding: "0.85rem", fontSize: "1em" }}
                    />
                </div>

                <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label className="form-label" style={{ fontSize: '0.7em' }}>CONTRASEÑA</label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ padding: "0.85rem", fontSize: "1em" }}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    />
                </div>

                <button
                    onClick={handleLogin}
                    style={{
                        width: "100%",
                        padding: "1rem",
                        borderRadius: "0.75rem",
                        border: "none",
                        background: "#22c55e",
                        color: "white",
                        fontWeight: "900",
                        cursor: "pointer",
                        fontSize: "1.1em",
                        boxShadow: "0 10px 15px -3px rgba(34, 197, 94, 0.3)",
                        transition: "all 0.2s",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: "1rem"
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
                >
                    Entrar
                </button>

                <button
                    onClick={() => {
                        if (onShowSetup) onShowSetup();
                    }}
                    style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "0.75rem",
                        border: "1px dashed var(--card-border)",
                        background: "var(--card-hover-bg)",
                        color: "var(--text-secondary)",
                        fontWeight: "bold",
                        cursor: "pointer",
                        fontSize: "0.9em",
                        transition: "all 0.2s",
                        textTransform: "uppercase"
                    }}
                >
                    Visualizar Inicio (Temporal)
                </button>
            </div>
        </div>
    );
}
