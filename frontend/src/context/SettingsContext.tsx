import React from 'react';
import { SettingsContext, type SettingsContextType } from './useSettings';

export const SettingsProvider: React.FC<{
    value: SettingsContextType;
    children: React.ReactNode;
}> = ({ value, children }) => {
    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};
