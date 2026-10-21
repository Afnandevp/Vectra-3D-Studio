import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface AccordionProps {
  title: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const Accordion: React.FC<AccordionProps> = ({
  title,
  badge,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-neutral-800/80 rounded-lg overflow-hidden bg-neutral-900/30">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ChevronRight
            className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
              isOpen ? 'rotate-90 text-cyan-400' : ''
            }`}
          />
          <span>{title}</span>
        </div>
        {badge && (
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
            {badge}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="px-3 pb-3 pt-1 border-t border-neutral-800/60 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
};
