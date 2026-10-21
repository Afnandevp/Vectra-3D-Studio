import { ChevronDown } from 'lucide-react';

interface Option<T> {
  value: T;
  label: string;
  sublabel?: string;
}

interface DropdownControlProps<T> {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (val: T) => void;
  description?: string;
}

export const DropdownControl = <T extends string | number>({
  label,
  value,
  options,
  onChange,
  description,
}: DropdownControlProps<T>) => {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-normal text-white/85 select-none">
          {label}
        </label>
      </div>
      {description && (
        <p className="text-[11px] text-white/40 leading-tight -mt-0.5">{description}</p>
      )}
      <div className="relative mt-0.5">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as unknown as T)}
          className="w-full appearance-none bg-white/[0.02] border border-white/[0.05] hover:border-white/15 focus:border-white/30 text-white/85 text-[13px] rounded-md px-3 py-1.5 pr-8 focus:outline-none transition-colors cursor-pointer"
        >
          {options.map((opt) => (
            <option key={String(opt.value)} value={opt.value} className="bg-[#0A0A0A] text-white/85">
              {opt.label} {opt.sublabel ? `(${opt.sublabel})` : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
      </div>
    </div>
  );
};

export default DropdownControl;
