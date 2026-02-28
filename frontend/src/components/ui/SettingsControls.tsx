import React from 'react';
import CustomSelect from './CustomSelect';

export type UIScale = 'small' | 'medium' | 'large';
export type LayoutOrientation = 'horizontal' | 'vertical';

interface SettingsControlsProps {
    uiScale: UIScale;
    setUiScale: (s: UIScale) => void;
    layoutOrientation?: LayoutOrientation;
    setLayoutOrientation?: (o: LayoutOrientation) => void;
    showOrientation?: boolean;
}

const SettingsControls: React.FC<SettingsControlsProps> = ({
    uiScale, setUiScale, layoutOrientation, setLayoutOrientation, showOrientation = false
}) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CustomSelect
                label="TAMAÑO"
                value={uiScale}
                onChange={setUiScale}
                options={[
                    { value: 'small', label: 'Pequeño' },
                    { value: 'medium', label: 'Mediano' },
                    { value: 'large', label: 'Grande' }
                ]}
            />

            {showOrientation && layoutOrientation && setLayoutOrientation && (
                <CustomSelect
                    label="VISTA"
                    value={layoutOrientation}
                    onChange={setLayoutOrientation}
                    options={[
                        { value: 'horizontal', label: 'Vertical' },
                        { value: 'vertical', label: 'Horizontal' }
                    ]}
                />
            )}
        </div>
    );
};

export default SettingsControls;


