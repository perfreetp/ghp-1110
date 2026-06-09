import { NavLink } from 'react-router-dom';
import {
  ClipboardList,
  Map,
  Building2,
  AlertTriangle,
  CheckSquare,
  Bell,
  User,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/utils';

const tabs = [
  { path: '/', icon: ClipboardList, label: '任务' },
  { path: '/map', icon: Map, label: '地图' },
  { path: '/facilities', icon: Building2, label: '设施' },
  { path: '/report', icon: AlertTriangle, label: '上报' },
  { path: '/rectification', icon: CheckSquare, label: '整改' },
  { path: '/messages', icon: Bell, label: '消息' },
  { path: '/profile', icon: User, label: '我的' },
];

export default function BottomTabBar() {
  const unreadCount = useAppStore((s) => s.getUnreadCount());

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-100 pb-safe">
      <div className="flex justify-around items-end h-16 max-w-md mx-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/'}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center justify-center flex-1 h-full min-w-0 transition-all duration-300',
                isActive
                  ? 'text-primary-600'
                  : 'text-gray-400 hover:text-gray-600'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <tab.icon
                    className={cn(
                      'w-5 h-5 transition-transform duration-300',
                      isActive && 'scale-110'
                    )}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  {tab.path === '/messages' && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute inset-0 -m-2 bg-primary-100/50 rounded-full blur-md -z-10 animate-pulse-slow" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] mt-1 font-medium transition-all duration-300',
                    isActive ? 'text-primary-600' : 'text-gray-400'
                  )}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-6 h-0.5 bg-gradient-to-r from-primary-500 to-twin-cyan rounded-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
