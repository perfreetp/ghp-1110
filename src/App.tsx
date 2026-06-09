import AnimatedRoutes from '@/router';
import { BrowserRouter } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Wifi, WifiOff, CloudUpload, X, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/utils';

function NetworkStatusBar() {
  const online = useAppStore((s) => s.online);
  const setOnline = useAppStore((s) => s.setOnline);
  const pendingSyncQueue = useAppStore((s) => s.pendingSyncQueue);
  const syncOfflineData = useAppStore((s) => s.syncOfflineData);
  const [showSync, setShowSync] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  useEffect(() => {
    if (online && pendingSyncQueue.length > 0) {
      setShowSync(true);
    }
  }, [online, pendingSyncQueue.length]);

  const handleSync = async () => {
    setSyncing(true);
    await syncOfflineData();
    setSyncing(false);
    setSyncDone(true);
    setTimeout(() => {
      setSyncDone(false);
      setShowSync(false);
    }, 1800);
  };

  if (!online) {
    return (
      <div className="fixed top-0 inset-x-0 z-50 animate-slide-down">
        <div className="bg-gradient-to-r from-warning-500 to-orange-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-xs shadow-lg">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          当前处于离线模式，上报的数据将暂存本地
        </div>
        <div className="h-safe" />
      </div>
    );
  }

  if (showSync && pendingSyncQueue.length > 0) {
    return (
      <div className="fixed top-0 inset-x-0 z-50 animate-slide-down max-w-md mx-auto px-3 pt-safe">
        <div
          className={cn(
            'rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg',
            syncDone
              ? 'bg-gradient-to-r from-success-500 to-emerald-500 text-white'
              : 'bg-gradient-to-r from-primary-600 to-twin-cyan text-white'
          )}
        >
          {syncDone ? (
            <CheckCircle2 className="w-5 h-5 animate-pop-in" />
          ) : syncing ? (
            <CloudUpload className="w-5 h-5 animate-bounce" />
          ) : (
            <Wifi className="w-5 h-5" />
          )}
          <div className="flex-1 text-sm font-medium">
            {syncDone
              ? `已同步 ${pendingSyncQueue.length} 条离线数据`
              : `检测到 ${pendingSyncQueue.length} 条待同步数据`}
          </div>
          {!syncing && !syncDone && (
            <>
              <button
                onClick={handleSync}
                className="px-3 py-1 rounded-full bg-white/25 hover:bg-white/35 text-xs font-semibold transition-colors"
              >
                立即同步
              </button>
              <button
                onClick={() => setShowSync(false)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="max-w-md mx-auto min-h-screen bg-gray-50 shadow-2xl relative overflow-hidden">
        <NetworkStatusBar />
        <AnimatedRoutes />
      </div>
    </BrowserRouter>
  );
}
