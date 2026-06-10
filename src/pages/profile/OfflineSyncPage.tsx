import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CloudOff,
  CloudUpload,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronRight,
  MapPin,
  Clock,
  ArrowLeft,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { Card, StatusBadge, Tag, EmptyState, Divider, InfoRow } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import {
  getHazardLevelConfig,
  getSyncStatusLabel,
  getSyncStatusVariant,
  formatDateTime,
  relativeTime,
  cn,
} from '@/utils';
import type { HazardReport } from '@/types';

type TabType = 'pending' | 'synced' | 'failed';

const tabs: { key: TabType; label: string; icon: typeof CloudOff; color: string; activeClass: string }[] = [
  { key: 'pending', label: '待同步', icon: CloudOff, color: 'warning', activeClass: 'bg-warning-500 text-white shadow-lg shadow-warning-500/30' },
  { key: 'synced', label: '已同步', icon: CheckCircle2, color: 'success', activeClass: 'bg-success-500 text-white shadow-lg shadow-success-500/30' },
  { key: 'failed', label: '失败', icon: XCircle, color: 'danger', activeClass: 'bg-danger-500 text-white shadow-lg shadow-danger-500/30' },
];

function ReportCard({
  report,
  variant,
  reason,
  onSync,
  onRetry,
  syncingId,
  online,
}: {
  report: HazardReport;
  variant: TabType;
  reason?: string;
  onSync?: () => void;
  onRetry?: () => void;
  syncingId?: string | null;
  online?: boolean;
}) {
  const levelConfig = getHazardLevelConfig(report.level);
  const isSyncing = syncingId === report.id;
  const syncDisabled = !online || isSyncing;
  const syncStatus = variant === 'pending' ? 'pending' : variant === 'failed' ? 'failed' : 'synced';

  return (
    <Card className="mb-3 hover:!border-primary-200 transition-all">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 truncate">{report.title}</h4>
          </div>
          <StatusBadge label={getSyncStatusLabel(syncStatus)} variant={getSyncStatusVariant(syncStatus)} size="sm" pulse={variant === 'pending'} />
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Tag label={report.type} color="purple" />
          <Tag label={levelConfig.label} color={report.level === 'critical' ? 'pink' : report.level === 'normal' ? 'orange' : 'green'} />
          {report.taskId && <Tag label="关联任务" color="blue" />}
        </div>

        <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{report.description}</p>

        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0 text-gray-400" />
            <span className="truncate">{report.address}</span>
          </div>
          <div className="flex items-center gap-1 justify-end">
            <Clock className="w-3 h-3 shrink-0 text-gray-400" />
            <span>{relativeTime(report.createTime)}</span>
          </div>
        </div>

        {report.mediaFiles && report.mediaFiles.length > 0 && (
          <div className="flex items-center gap-1 mb-3 text-[11px] text-gray-500">
            <FileText className="w-3 h-3 shrink-0 text-gray-400" />
            <span>
              {report.mediaFiles.filter((m) => m.type === 'image').length} 张图片 ·{' '}
              {report.mediaFiles.filter((m) => m.type === 'video').length} 段视频 ·{' '}
              {report.mediaFiles.filter((m) => m.type === 'audio').length} 条音频
            </span>
          </div>
        )}

        {variant === 'failed' && reason && (
          <div className="mb-3 p-2 rounded-xl bg-danger-50 border border-danger-100 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-danger-500 shrink-0 mt-0.5" />
            <div className="text-[11px] text-danger-700 leading-relaxed">{reason}</div>
          </div>
        )}

        <Divider />

        <div className="flex items-center justify-between">
          <div className="text-[11px] text-gray-400 font-mono">{formatDateTime(report.createTime)}</div>
          <div className="flex items-center gap-2">
            {variant === 'pending' && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
                onClick={onSync}
                disabled={syncDisabled}
                className="!text-xs !px-3"
              >
                {!online ? '请连接网络' : isSyncing ? '同步中' : '单条同步'}
              </Button>
            )}
            {variant === 'failed' && (
              <Button
                variant="warning"
                size="sm"
                leftIcon={isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                onClick={onRetry}
                disabled={syncDisabled}
                className="!text-xs !px-3"
              >
                {!online ? '请连接网络' : isSyncing ? '重试中' : '重试'}
              </Button>
            )}
            {variant === 'synced' && report.syncTime && (
              <div className="flex items-center gap-1 text-[11px] text-success-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{formatDateTime(report.syncTime)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function OfflineSyncPage() {
  const navigate = useNavigate();
  const online = useAppStore((s) => s.online);
  const pendingSyncQueue = useAppStore((s) => s.pendingSyncQueue);
  const hazardReports = useAppStore((s) => s.hazardReports);
  const syncedHazardIds = useAppStore((s) => s.syncedHazardIds);
  const failedSyncIds = useAppStore((s) => s.failedSyncIds);
  const failedSyncReasons = useAppStore((s) => s.failedSyncReasons);
  const syncOfflineData = useAppStore((s) => s.syncOfflineData);
  const syncSingleHazard = useAppStore((s) => s.syncSingleHazard);
  const retryFailedSync = useAppStore((s) => s.retryFailedSync);

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [batchSyncing, setBatchSyncing] = useState(false);

  const pendingReports = useMemo(() => {
    const ids = new Set(pendingSyncQueue.map((r) => r.id));
    const reports = hazardReports.filter((h) => ids.has(h.id));
    // 按时间倒序
    return [...reports].sort((a, b) => b.createTime.localeCompare(a.createTime));
  }, [hazardReports, pendingSyncQueue]);

  const syncedReports = useMemo(() => {
    const ids = new Set(syncedHazardIds);
    return hazardReports
      .filter((h) => ids.has(h.id))
      .sort((a, b) => (b.syncTime || b.createTime).localeCompare(a.syncTime || a.createTime))
      .slice(0, 50);
  }, [hazardReports, syncedHazardIds]);

  const failedReports = useMemo(() => {
    const ids = new Set(failedSyncIds);
    return hazardReports
      .filter((h) => ids.has(h.id))
      .sort((a, b) => b.createTime.localeCompare(a.createTime));
  }, [hazardReports, failedSyncIds]);

  const counts = {
    pending: pendingReports.length,
    synced: syncedHazardIds.length,
    failed: failedReports.length,
  };

  const listData: HazardReport[] =
    activeTab === 'pending'
      ? pendingReports
      : activeTab === 'synced'
      ? syncedReports
      : failedReports;

  const handleBatchSync = async () => {
    if (!online) return;
    setBatchSyncing(true);
    try {
      await syncOfflineData();
    } finally {
      setTimeout(() => setBatchSyncing(false), 500);
    }
  };

  const handleSingleSync = async (id: string) => {
    if (!online) return;
    setSyncingId(id);
    try {
      await syncSingleHazard(id);
    } finally {
      setTimeout(() => setSyncingId(null), 300);
    }
  };

  const handleRetry = async (id: string) => {
    if (!online) return;
    setSyncingId(id);
    try {
      await retryFailedSync(id);
    } finally {
      setTimeout(() => setSyncingId(null), 300);
    }
  };

  const batchSyncDisabled = !online || batchSyncing || pendingReports.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <PageHeader
        title="离线数据管理"
        subtitle="同步状态全掌握"
        showBack
      />

      <div className="px-4">
        <div className="mb-4">
          <Card className="!p-0 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      online ? 'bg-success-100' : 'bg-warning-100'
                    )}
                  >
                    {online ? (
                      <CheckCircle2 className="w-5 h-5 text-success-600" />
                    ) : (
                      <CloudOff className="w-5 h-5 text-warning-600 animate-pulse" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">
                        {online ? '网络已连接' : '当前处于离线模式'}
                      </span>
                      <span className={cn(
                        'w-1.5 h-1.5 rounded-full animate-pulse',
                        online ? 'bg-success-500' : 'bg-danger-500'
                      )} />
                    </div>
                    {!online && <p className="text-[11px] text-warning-600 mt-0.5">请恢复网络后再执行同步操作</p>}
                    {online && pendingReports.length > 0 && (
                      <p className="text-[11px] text-success-600 mt-0.5">
                        检测到 {pendingReports.length} 条待同步记录，可立即同步
                      </p>
                    )}
                  </div>
                </div>
                {pendingReports.length > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={batchSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                    disabled={batchSyncDisabled}
                    className="!text-xs"
                  >
                    {batchSyncing ? '同步中...' : `一键同步 (${pendingReports.length})`}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'pending', label: '待同步', value: counts.pending, color: 'warning' },
                  { key: 'synced', label: '已同步', value: counts.synced, color: 'success' },
                  { key: 'failed', label: '失败', value: counts.failed, color: 'danger' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className={cn(
                      'rounded-xl p-2.5 border transition-all cursor-pointer',
                      activeTab === item.key
                        ? item.color === 'warning'
                          ? 'bg-warning-50 border-warning-200'
                          : item.color === 'danger'
                          ? 'bg-danger-50 border-danger-200'
                          : 'bg-success-50 border-success-200'
                        : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                    )}
                    onClick={() => setActiveTab(item.key as TabType)}
                  >
                    <div className="text-[10px] text-gray-500 mb-1">{item.label}</div>
                    <div className={cn(
                      'text-xl font-bold',
                      item.color === 'warning' ? 'text-warning-600' : item.color === 'danger' ? 'text-danger-600' : 'text-success-600'
                    )}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 px-4 py-2 flex">
              {tabs.map((tab) => {
                const active = activeTab === tab.key;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-medium transition-all',
                      active ? tab.activeClass : 'text-gray-500 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {counts[tab.key] > 0 && (
                      <span className={cn(
                        'px-1.5 py-0.5 rounded-full text-[10px]',
                        active ? 'bg-white/25' : tab.color === 'warning' ? 'bg-warning-100 text-warning-700' : tab.color === 'danger' ? 'bg-danger-100 text-danger-700' : 'bg-success-100 text-success-700'
                      )}>
                        {counts[tab.key]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {listData.length === 0 ? (
          <EmptyState
            icon={
              activeTab === 'pending'
                ? <CloudOff className="w-10 h-10" />
                : activeTab === 'synced'
                ? <CheckCircle2 className="w-10 h-10" />
                : <XCircle className="w-10 h-10" />
            }
            title={
              activeTab === 'pending'
                ? '暂无待同步数据'
                : activeTab === 'synced'
                ? '暂无已同步记录'
                : '暂无失败记录'
            }
            description={
              activeTab === 'pending'
                ? online ? '所有离线数据已同步完成' : '恢复网络后，上报的数据将出现在这里'
                : activeTab === 'synced'
                ? '成功同步的隐患上报记录会在这里展示'
                : '同步失败的记录会出现在这里，可随时重试'
            }
            action={
              activeTab !== 'synced' && (
                <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate(-1)}>
                  返回
                </Button>
              )
            }
          />
        ) : (
          listData.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              variant={activeTab}
              reason={failedSyncReasons[report.id]}
              onSync={() => handleSingleSync(report.id)}
              onRetry={() => handleRetry(report.id)}
              syncingId={syncingId}
              online={online}
            />
          ))
        )}

        {activeTab === 'synced' && listData.length > 0 && listData.length >= 50 && (
          <div className="text-center text-[11px] text-gray-400 py-4">
            最多展示最近 50 条已同步记录
          </div>
        )}
      </div>
    </div>
  );
}
