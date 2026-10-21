import React from 'react';

interface ColorPickerControlProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  description?: string;
}

const PRESET_SWATCHES = [
  { name: 'Pure Chrome', color: '#ffffff' },
  { name: 'Silver Platinum', color: '#cbd5e1' },
  { name: '24K Cyber Gold', color: '#ffc83b' },
  { name: 'Rose Gold', color: '#ff7eb6' },
  { name: 'Electric Cyan', color: '#00f2aa' },
  { name: 'Deep Cobalt', color: '#3b82f6' },
  { name: 'Obsidian Noir', color: '#1a1d24' },
  { name: 'Neon Violet', color: '#c084fc' },
];

export const ColorPickerControl: React.FC<ColorPickerControlProps> = ({
  label,
  value,
  onChange,
  description,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-normal text-white/85 select-none">
          {label}
        </label>
        <span className="font-mono text-[11px] text-white/50 uppercase">
          {value}
        </span>
      </div>
      {description && (
        <p className="text-[11px] text-white/40 leading-tight -mt-1">{description}</p>
      )}

      {/* Color input box & trigger */}
      <div className="flex items-center gap-2">
        <label className="relative flex items-center justify-center w-7 h-7 rounded-full border border-white/10 cursor-pointer overflow-hidden flex-shrink-0 group hover:border-white/25 transition-colors">
          <span
            className="w-full h-full block rounded-full"
            style={{ backgroundColor: value }}
          />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
        
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (v.startsWith('#') || v.length <= 7) {
              onChange(v);
            }
          }}
          className="flex-1 bg-white/[0.02] border border-white/[0.05] hover:border-white/15 focus:border-white/30 text-white/85 text-[12px] font-mono uppercase rounded-md px-2.5 py-1 focus:outline-none transition-colors"
          placeholder="#FFFFFF"
        />
      </div>

      {/* Elegant circle swatches: w-6 h-6 rounded-full with 2px offset ring on active */}
      <div className="flex items-center justify-between pt-1">
        {PRESET_SWATCHES.map((swatch) => {
          const isActive = value.toLowerCase() === swatch.color.toLowerCase();
          return (
            <button
              key={swatch.color}
              type="button"
              title={swatch.name}
              onClick={() => onChange(swatch.color)}
              className={`w-6 h-6 rounded-full transition-transform duration-150 hover:scale-110 ${
                isActive
                  ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-[#0A0A0A] scale-110'
                  : 'border border-white/10 hover:border-white/30'
              }`}
              style={{ backgroundColor: swatch.color }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ColorPickerControl;
