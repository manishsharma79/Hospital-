import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
  tone?: 'navy' | 'blue' | 'emerald' | 'amber' | 'red';
  onClick?: () => void;
}

const ICON_SURFACE: Record<NonNullable<StatCardProps['tone']>, string> = {
  navy: 'bg-[#0F2942]/10 text-[#0F2942]',
  blue: 'bg-blue-50 text-blue-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'blue',
  onClick,
}) => {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full text-left rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-colors ${
        onClick
          ? 'hover:border-blue-300 hover:bg-blue-50/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600'
          : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {value}
          </p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${ICON_SURFACE[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {detail && <p className="mt-2.5 text-xs text-slate-500 truncate">{detail}</p>}
    </Wrapper>
  );
};
