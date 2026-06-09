import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wifi, WifiOff } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backTo?: string;
  rightContent?: ReactNode;
  gradient?: boolean;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  showBack = false,
  backTo,
  rightContent,
  gradient = true,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate();
  const online = useAppStore((s) => s.online);
  const user = useAppStore((s) => s.user);

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <header
      className={cn(
        'relative px-4 pt-safe pb-4 overflow-hidden',
        gradient
          ? 'bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700'
          : 'bg-white border-b border-gray-100',
        className
      )}
    >
      {gradient && (
        <>
          <div className="absolute inset-0 bg-grid-pattern bg-[size:24px_24px] opacity-20" />
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-twin-cyan/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary-500/20 rounded-full blur-2xl" />
        </>
      )}
      <div className="relative">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                onClick={handleBack}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95',
                  gradient ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                )}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1
                className={cn(
                  'text-lg font-bold leading-tight',
                  gradient ? 'text-white' : 'text-gray-900'
                )}
              >
                {title}
              </h1>
              {subtitle && (
                <p
                  className={cn(
                    'text-xs mt-0.5',
                    gradient ? 'text-primary-100/80' : 'text-gray-500'
                  )}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!online && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-warning-500/20 text-warning-400 text-xs">
                <WifiOff className="w-3 h-3" />
                离线
              </div>
            )}
            {online && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success-500/20 text-success-400 text-xs">
                <Wifi className="w-3 h-3" />
                在线
              </div>
            )}
            {rightContent}
          </div>
        </div>
        {user && !showBack && (
          <div className="mt-2 text-xs text-primary-100/70">
            您好，{user.name} · {user.department}
          </div>
        )}
      </div>
    </header>
  );
}
