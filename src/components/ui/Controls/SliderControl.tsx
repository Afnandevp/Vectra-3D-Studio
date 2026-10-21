import React from 'react';

interface SliderControlProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  description?: string;
}

export const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '%',
  onChange,
  description,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-normal text-white/85 select-none">
          {label}
        </label>
        <span className="font-mono text-[11px] text-white/50 tabular-nums">
          {value}{unit}
        </span>
      </div>
      {description && (
        <p className="text-[11px] text-white/40 leading-tight -mt-0.5">{description}</p>
      )}
      <div className="relative flex items-center py-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-[2px] bg-white/10 rounded-full appearance-none cursor-pointer focus:outline-none"
        />
      </div>
    </div>
  );
};

export default SliderControl;
