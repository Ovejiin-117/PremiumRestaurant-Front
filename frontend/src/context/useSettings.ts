import { createContext, useContext } from 'react';
import type { Theme } from '../types';

export interface SettingsContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    updateTheme: (theme: Theme) => void;
    globalScale: number;
    setGlobalScale: React.Dispatch<React.SetStateAction<number>>;
    animationsEnabled: boolean;
    setAnimationsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    performanceMode: boolean;
    setPerformanceMode: React.Dispatch<React.SetStateAction<boolean>>;
    showImages: boolean;
    setShowImages: React.Dispatch<React.SetStateAction<boolean>>;
    ticketWidth: number;
    setTicketWidth: React.Dispatch<React.SetStateAction<number>>;
}

export const SettingsContext = createContext<SettingsContextType | null>(null);

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings debe ser utilizado dentro de un SettingsProvider');
    }
    return context;
};
