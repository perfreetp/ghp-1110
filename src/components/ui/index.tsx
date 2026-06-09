import { ReactNode } from 'react';
import { cn } from '@/utils';
import { X } from 'lucide-react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  glow?: boolean;
}

export function Card({ children, className, onClick, hoverable = false, glow = false }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl shadow-card border border-gray-50/80 overflow-hidden transition-all duration-300',
        hoverable && 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99]',
        glow && 'shadow-twin border-twin-cyan/20',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-6 text-center animate-slide-up', className)}>
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-gray-400 mb-4 shadow-inner">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

interface StatusBadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'twin';
  size?: 'sm' | 'md';
  className?: string;
  pulse?: boolean;
}

export function StatusBadge({ label, variant = 'default', size = 'sm', className, pulse = false }: StatusBadgeProps) {
  const variants = {
    success: 'bg-success-50 text-success-600 border-success-100',
    warning: 'bg-warning-50 text-warning-600 border-warning-100',
    danger: 'bg-danger-50 text-danger-600 border-danger-100',
    info: 'bg-primary-50 text-primary-600 border-primary-100',
    default: 'bg-gray-50 text-gray-600 border-gray-100',
    twin: 'bg-gradient-to-r from-twin-cyan/10 to-primary-500/10 text-twin-cyan border-twin-cyan/20',
  };
  const sizes = {
    sm: 'px-2 py-0.5 text-[11px] rounded-full',
    md: 'px-2.5 py-1 text-xs rounded-xl',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium border',
        variants[variant],
        sizes[size],
        pulse && 'relative',
        className
      )}
    >
      {pulse && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full animate-pulse',
          variant === 'success' && 'bg-success-500',
          variant === 'warning' && 'bg-warning-500',
          variant === 'danger' && 'bg-danger-500',
          variant === 'info' && 'bg-primary-500',
          variant === 'default' && 'bg-gray-400',
        )} />
      )}
      {label}
    </span>
  );
}

interface TagProps {
  label: string;
  color?: 'blue' | 'green' | 'orange' | 'pink' | 'purple' | 'gray';
  className?: string;
}

export function Tag({ label, color = 'blue', className }: TagProps) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    pink: 'bg-pink-50 text-pink-600',
    purple: 'bg-violet-50 text-violet-600',
    gray: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={cn('px-2 py-0.5 text-[11px] font-medium rounded-md', colors[color], className)}>
      {label}
    </span>
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up',
          'max-h-[85vh] overflow-hidden flex flex-col',
          className
        )}
      >
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mt-3 shrink-0" />
        {title && (
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className }: DividerProps) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-3 my-4', className)}>
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
    );
  }
  return <div className={cn('h-px bg-gray-100 my-4', className)} />;
}

interface InfoRowProps {
  label: string;
  value: ReactNode;
  highlight?: boolean;
  className?: string;
}

export function InfoRow({ label, value, highlight = false, className }: InfoRowProps) {
  return (
    <div className={cn('flex items-start justify-between py-2.5 gap-4', className)}>
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className={cn('text-sm text-right', highlight ? 'font-semibold text-gray-900' : 'text-gray-700')}>
        {value}
      </span>
    </div>
  );
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = '搜索...', className }: SearchBarProps) {
  return (
    <div className={cn('relative', className)}>
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-4 text-sm bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-primary-200 focus:ring-2 focus:ring-primary-100 outline-none transition-all placeholder:text-gray-400"
      />
    </div>
  );
}
