import type { FacilityType } from '@/types';
import { cn } from '@/utils';
import {
  Lightbulb,
  Circle,
  Trash2,
  Armchair,
  Signpost,
  Flame,
  Box,
} from 'lucide-react';

interface FacilityIconProps {
  type: FacilityType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

const iconMap: Record<FacilityType, typeof Lightbulb> = {
  lamp: Lightbulb,
  manhole: Circle,
  bin: Trash2,
  bench: Armchair,
  sign: Signpost,
  fire_hydrant: Flame,
  other: Box,
};

const colorMap: Record<FacilityType, { bg: string; text: string; border: string; glow: string }> = {
  lamp: { bg: 'from-amber-100 to-yellow-50', text: 'text-amber-600', border: 'border-amber-200', glow: 'shadow-amber-200/50' },
  manhole: { bg: 'from-slate-100 to-gray-50', text: 'text-slate-600', border: 'border-slate-200', glow: 'shadow-slate-300/50' },
  bin: { bg: 'from-emerald-100 to-green-50', text: 'text-emerald-600', border: 'border-emerald-200', glow: 'shadow-emerald-200/50' },
  bench: { bg: 'from-orange-100 to-amber-50', text: 'text-orange-600', border: 'border-orange-200', glow: 'shadow-orange-200/50' },
  sign: { bg: 'from-blue-100 to-indigo-50', text: 'text-blue-600', border: 'border-blue-200', glow: 'shadow-blue-200/50' },
  fire_hydrant: { bg: 'from-red-100 to-rose-50', text: 'text-red-600', border: 'border-red-200', glow: 'shadow-red-200/50' },
  other: { bg: 'from-violet-100 to-purple-50', text: 'text-violet-600', border: 'border-violet-200', glow: 'shadow-violet-200/50' },
};

const sizeMap = {
  sm: 'w-9 h-9',
  md: 'w-11 h-11',
  lg: 'w-14 h-14',
};

const iconSizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
};

export default function FacilityIcon({ type, className, size = 'md', glow = false }: FacilityIconProps) {
  const Icon = iconMap[type];
  const colors = colorMap[type];

  return (
    <div
      className={cn(
        sizeMap[size],
        'relative rounded-2xl bg-gradient-to-br flex items-center justify-center border',
        colors.bg,
        colors.border,
        colors.text,
        glow && `shadow-lg ${colors.glow}`,
        className
      )}
    >
      <Icon className={cn(iconSizeMap[size])} strokeWidth={2} />
      {glow && (
        <div className={cn(
          'absolute inset-0 rounded-2xl opacity-40 animate-pulse',
          'bg-gradient-to-br from-white/40 to-transparent'
        )} />
      )}
    </div>
  );
}

export function FacilityIcon3D({ type, className }: { type: FacilityType; className?: string }) {
  const Icon = iconMap[type];
  const colors = colorMap[type];

  return (
    <div className={cn('relative', className)}>
      <div className={cn(
        'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center',
        colors.bg,
        'border-2 border-white shadow-xl',
        'transform -rotate-6 hover:rotate-0 transition-transform duration-500'
      )}>
        <Icon className={cn('w-8 h-8', colors.text)} strokeWidth={2} />
      </div>
      <div className={cn(
        'absolute -bottom-1 -right-1 w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center -z-10',
        colors.bg,
        'opacity-60 blur-sm rotate-3'
      )}>
        <Icon className={cn('w-8 h-8 opacity-30', colors.text)} strokeWidth={2} />
      </div>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-white/50 via-transparent to-white/20 pointer-events-none" />
    </div>
  );
}

interface HologramFrameProps {
  children: React.ReactNode;
  className?: string;
  scanning?: boolean;
}

export function HologramFrame({ children, className, scanning = true }: HologramFrameProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl border-2 border-twin-cyan/30 bg-gradient-to-b from-twin-cyan/5 to-transparent', className)}>
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-twin-cyan/10 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-twin-cyan/10 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-twin-cyan/60 rounded-tl-xl" />
      <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-twin-cyan/60 rounded-tr-xl" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-twin-cyan/60 rounded-bl-xl" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-twin-cyan/60 rounded-br-xl" />
      {scanning && (
        <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-twin-cyan/60 to-transparent animate-scan" />
      )}
      <div className="absolute inset-0 bg-grid-pattern bg-[size:16px_16px] opacity-30 pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
