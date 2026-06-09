import { useState, useMemo, useEffect } from 'react';
import {
  Phone,
  Bell,
  Camera,
  Clock,
  User,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Send,
  MessageSquareWarning,
  History,
  Eye,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { Card, StatusBadge, Tag, Modal, InfoRow, Divider, EmptyState } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import {
  formatDateTime,
  relativeTime,
  getRectificationStatusConfig,
  getHazardLevelConfig,
  cn,
  timeRemaining,
} from '@/utils';
import type { RectificationOrder, RectificationStatus } from '@/types';

type TabKey = 'pending' | 'processing' | 'completed' | 'overdue' | 'closed';

const TABS: { key: TabKey; label: string; statuses: RectificationStatus[] }[] = [
  { key: 'pending', label: '待办', statuses: ['pending'] },
  { key: 'processing', label: '整改中', statuses: ['processing', 'recheck_failed'] },
  { key: 'completed', label: '待复查', statuses: ['completed'] },
  { key: 'overdue', label: '超期', statuses: ['overdue'] },
  { key: 'closed', label: '已闭环', statuses: ['closed'] },
];

const STEPS = [
  { key: 'dispatch', label: '派单', icon: Send },
  { key: 'rectify', label: '整改', icon: Bell },
  { key: 'complete', label: '完成', icon: CheckCircle2 },
  { key: 'recheck', label: '复查', icon: Eye },
];

function getCurrentStep(status: RectificationStatus): number {
  const config = getRectificationStatusConfig(status);
  return config.step;
}

export default function RectificationPage() {
  const orders = useAppStore((s) => s.rectificationOrders);
  const urgeRectification = useAppStore((s) => s.urgeRectification);
  const recheckRectification = useAppStore((s) => s.recheckRectification);

  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [detailOrder, setDetailOrder] = useState<RectificationOrder | null>(null);
  const [recheckOrder, setRecheckOrder] = useState<RectificationOrder | null>(null);
  const [recheckResult, setRecheckResult] = useState<'pass' | 'fail' | null>(null);
  const [recheckRemark, setRecheckRemark] = useState('');
  const [recheckPhotos, setRecheckPhotos] = useState<string[]>([]);
  const [urgeSuccess, setUrgeSuccess] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    return {
      pending: orders.filter((o) => o.status === 'pending').length,
      processing: orders.filter((o) => o.status === 'processing' || o.status === 'recheck_failed').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      overdue: orders.filter((o) => {
        const { expired } = timeRemaining(o.deadline);
        return expired && o.status !== 'closed';
      }).length,
      closed: orders.filter((o) => o.status === 'closed').length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const tab = TABS.find((t) => t.key === activeTab);
    if (!tab) return orders;
    if (activeTab === 'overdue') {
      return orders.filter((o) => {
        const { expired } = timeRemaining(o.deadline);
        return expired && o.status !== 'closed';
      });
    }
    return orders.filter((o) => tab.statuses.includes(o.status));
  }, [orders, activeTab]);

  const handleUrge = (orderId: string) => {
    urgeRectification(orderId);
    setUrgeSuccess(orderId);
    setTimeout(() => setUrgeSuccess(null), 2500);
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone.replace(/[^0-9+]/g, '')}`;
  };

  const handleOpenRecheck = (order: RectificationOrder) => {
    setRecheckOrder(order);
    setRecheckResult(null);
    setRecheckRemark('');
    setRecheckPhotos([]);
  };

  const handleSubmitRecheck = () => {
    if (!recheckOrder || !recheckResult || recheckPhotos.length < 2) return;
    recheckRectification(recheckOrder.id, recheckResult === 'pass', recheckRemark);
    setRecheckOrder(null);
    setRecheckResult(null);
    setRecheckRemark('');
    setRecheckPhotos([]);
  };

  const simulatePhotoUpload = () => {
    if (recheckPhotos.length >= 4) return;
    const newPhoto = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setRecheckPhotos([...recheckPhotos, newPhoto]);
  };

  const removePhoto = (index: number) => {
    setRecheckPhotos(recheckPhotos.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <PageHeader title="整改跟踪" subtitle="闭环管理 全程追溯" showBack />

      <div className="px-4 -mt-4 relative z-10">
        <Card className="p-4 shadow-lg">
          <div className="grid grid-cols-5 gap-2">
            <StatCard
              label="待办"
              value={stats.pending}
              color="from-gray-500 to-gray-600"
              active={activeTab === 'pending'}
              onClick={() => setActiveTab('pending')}
            />
            <StatCard
              label="整改中"
              value={stats.processing}
              color="from-primary-500 to-primary-600"
              active={activeTab === 'processing'}
              onClick={() => setActiveTab('processing')}
            />
            <StatCard
              label="待复查"
              value={stats.completed}
              color="from-warning-500 to-warning-600"
              active={activeTab === 'completed'}
              onClick={() => setActiveTab('completed')}
            />
            <StatCard
              label="已超期"
              value={stats.overdue}
              color="from-danger-500 to-danger-600"
              active={activeTab === 'overdue'}
              onClick={() => setActiveTab('overdue')}
              pulse={stats.overdue > 0}
            />
            <StatCard
              label="已闭环"
              value={stats.closed}
              color="from-success-500 to-success-600"
              active={activeTab === 'closed'}
              onClick={() => setActiveTab('closed')}
            />
          </div>
        </Card>
      </div>

      <div className="px-4 mt-4">
        <div className="flex gap-1 p-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count =
              tab.key === 'overdue'
                ? stats.overdue
                : tab.statuses.reduce((sum, s) => sum + orders.filter((o) => o.status === s).length, 0);
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex-1 min-w-[68px] py-2 px-3 rounded-xl text-xs font-medium transition-all duration-200 whitespace-nowrap',
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md shadow-primary-500/25'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px]',
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {filteredOrders.length === 0 ? (
          <EmptyState
            icon={<AlertCircle className="w-10 h-10" />}
            title="暂无整改工单"
            description={activeTab === 'closed' ? '还没有已闭环的工单' : '当前状态下没有待处理的工单'}
          />
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onCall={() => handleCall(order.handlerPhone)}
              onUrge={() => handleUrge(order.id)}
              onViewDetail={() => setDetailOrder(order)}
              onRecheck={() => handleOpenRecheck(order)}
              showUrgeSuccess={urgeSuccess === order.id}
            />
          ))
        )}
      </div>

      <Modal isOpen={!!detailOrder} onClose={() => setDetailOrder(null)} title="工单详情">
        {detailOrder && <OrderDetail order={detailOrder} onClose={() => setDetailOrder(null)} />}
      </Modal>

      <Modal isOpen={!!recheckOrder} onClose={() => setRecheckOrder(null)} title="复查确认">
        {recheckOrder && (
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">隐患信息</h4>
              <Card className="p-3">
                <div className="flex items-start gap-3">
                  <LevelBar level={recheckOrder.hazardLevel} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <HazardLevelTag level={recheckOrder.hazardLevel} />
                    </div>
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{recheckOrder.hazardTitle}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      截止：{formatDateTime(recheckOrder.deadline)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900">现场拍照</h4>
                <span className={cn('text-xs', recheckPhotos.length < 2 ? 'text-danger-500' : 'text-success-600')}>
                  {recheckPhotos.length}/2 必填
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {recheckPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 overflow-hidden flex items-center justify-center"
                  >
                    <Camera className="w-6 h-6 text-primary-400" />
                    <button
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                    <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
                      图{idx + 1}
                    </span>
                  </div>
                ))}
                {recheckPhotos.length < 4 && (
                  <button
                    onClick={simulatePhotoUpload}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                    <span className="text-[10px]">拍照</span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">复查结果</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRecheckResult('pass')}
                  className={cn(
                    'p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2',
                    recheckResult === 'pass'
                      ? 'border-success-500 bg-success-50'
                      : 'border-gray-200 bg-white hover:border-success-200'
                  )}
                >
                  <CheckCircle2
                    className={cn('w-8 h-8', recheckResult === 'pass' ? 'text-success-600' : 'text-gray-400')}
                  />
                  <span
                    className={cn(
                      'text-sm font-medium',
                      recheckResult === 'pass' ? 'text-success-700' : 'text-gray-600'
                    )}
                  >
                    通过
                  </span>
                </button>
                <button
                  onClick={() => setRecheckResult('fail')}
                  className={cn(
                    'p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2',
                    recheckResult === 'fail'
                      ? 'border-danger-500 bg-danger-50'
                      : 'border-gray-200 bg-white hover:border-danger-200'
                  )}
                >
                  <XCircle
                    className={cn('w-8 h-8', recheckResult === 'fail' ? 'text-danger-600' : 'text-gray-400')}
                  />
                  <span
                    className={cn(
                      'text-sm font-medium',
                      recheckResult === 'fail' ? 'text-danger-700' : 'text-gray-600'
                    )}
                  >
                    不通过
                  </span>
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">复查意见</h4>
              <textarea
                value={recheckRemark}
                onChange={(e) => setRecheckRemark(e.target.value)}
                placeholder={recheckResult === 'fail' ? '请填写不通过原因，需重新整改的具体要求...' : '请填写复查意见（选填）...'}
                className="w-full h-24 px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none resize-none placeholder:text-gray-400"
              />
            </div>

            <Divider />

            <div className="flex gap-3">
              <Button variant="outline" size="full" onClick={() => setRecheckOrder(null)}>
                取消
              </Button>
              <Button
                variant={recheckResult === 'fail' ? 'danger' : 'primary'}
                size="full"
                disabled={!recheckResult || recheckPhotos.length < 2}
                onClick={handleSubmitRecheck}
              >
                确认提交
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {urgeSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] animate-slide-up">
          <div className="px-5 py-3 bg-success-600 text-white rounded-2xl shadow-2xl shadow-success-500/30 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">催办成功，已通知整改责任人</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  active?: boolean;
  onClick?: () => void;
  pulse?: boolean;
}

function StatCard({ label, value, color, active, onClick, pulse }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center py-3 px-1 rounded-xl transition-all duration-200',
        active ? 'bg-gray-50 scale-[1.02]' : 'hover:bg-gray-50/50'
      )}
    >
      <span
        className={cn(
          'text-2xl font-bold bg-gradient-to-br bg-clip-text text-transparent relative',
          color,
          pulse && 'animate-pulse'
        )}
      >
        {value}
        {pulse && value > 0 && (
          <span className="absolute -top-1 -right-2 w-2 h-2 bg-danger-500 rounded-full animate-ping" />
        )}
      </span>
      <span className={cn('text-xs mt-1', active ? 'text-gray-900 font-medium' : 'text-gray-500')}>{label}</span>
      {active && <span className={cn('absolute bottom-0 w-8 h-0.5 rounded-full bg-gradient-to-r', color)} />}
    </button>
  );
}

interface OrderCardProps {
  order: RectificationOrder;
  onCall: () => void;
  onUrge: () => void;
  onViewDetail: () => void;
  onRecheck: () => void;
  showUrgeSuccess?: boolean;
}

function OrderCard({ order, onCall, onUrge, onViewDetail, onRecheck, showUrgeSuccess }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hazardConfig = getHazardLevelConfig(order.hazardLevel);
  const statusConfig = getRectificationStatusConfig(order.status);
  const remaining = timeRemaining(order.deadline);
  const currentStep = getCurrentStep(order.status);
  const { expired } = remaining;

  const actionButtons = () => {
    switch (order.status) {
      case 'pending':
        return (
          <Button variant="primary" size="sm" leftIcon={<Phone className="w-4 h-4" />} onClick={onCall}>
            联系责任人
          </Button>
        );
      case 'processing':
      case 'recheck_failed':
        return (
          <>
            <Button
              variant="warning"
              size="sm"
              leftIcon={<MessageSquareWarning className="w-4 h-4" />}
              onClick={onUrge}
              className={showUrgeSuccess ? 'animate-pulse' : ''}
            >
              催办
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Eye className="w-4 h-4" />} onClick={onViewDetail}>
              查看进度
            </Button>
          </>
        );
      case 'completed':
        return (
          <Button variant="primary" size="sm" leftIcon={<CheckCircle2 className="w-4 h-4" />} onClick={onRecheck}>
            去复查
          </Button>
        );
      case 'closed':
      case 'overdue':
      default:
        return (
          <Button variant="outline" size="sm" leftIcon={<Eye className="w-4 h-4" />} onClick={onViewDetail}>
            查看详情
          </Button>
        );
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex">
        <LevelBar level={order.hazardLevel} />
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <HazardLevelTag level={order.hazardLevel} />
                <Tag
                  label={statusConfig.label}
                  color={
                    order.status === 'closed'
                      ? 'green'
                      : order.status === 'completed'
                      ? 'orange'
                      : expired
                      ? 'pink'
                      : 'blue'
                  }
                />
                {order.urgeCount > 0 && (
                  <span className="relative inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold text-white bg-danger-500 rounded-md">
                    催办 {order.urgeCount}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{order.hazardTitle}</h3>
              <p className="text-xs text-gray-500 mt-1">
                <Clock className="w-3 h-3 inline mr-1" />
                上报时间：{relativeTime(order.createTime)}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-y-2 gap-x-3 text-xs">
            <div className="flex items-center gap-1.5 text-gray-600 truncate">
              <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{order.handler}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 truncate">
              <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate text-[11px]">{order.department}</span>
            </div>
            <div
              className="flex items-center gap-1.5 text-primary-600 cursor-pointer hover:text-primary-700 col-span-2"
              onClick={onCall}
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span className="underline underline-offset-2">{order.handlerPhone}</span>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-3 pt-3 border-t border-gray-50 flex items-center justify-between"
          >
            <div className="flex-1">
              <ProgressTimeline currentStep={currentStep} expired={expired && order.status !== 'closed'} />
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-gray-400 ml-2 shrink-0 transition-transform duration-200',
                expanded && 'rotate-180'
              )}
            />
          </button>

          {expanded && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-3 animate-slide-up">
              <InfoRow label="截止时间" value={formatDateTime(order.deadline)} />
              <InfoRow label="工单编号" value={<span className="font-mono text-xs">{order.id}</span>} />
              {order.finishTime && <InfoRow label="完成时间" value={formatDateTime(order.finishTime)} />}
              {order.recheckTime && <InfoRow label="复查时间" value={formatDateTime(order.recheckTime)} />}
            </div>
          )}

          <Divider className="!my-3" />

          <div className="flex items-center justify-between">
            <div
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium',
                expired && order.status !== 'closed' ? 'text-danger-600' : 'text-gray-600'
              )}
            >
              <AlertCircle
                className={cn('w-4 h-4', expired && order.status !== 'closed' && 'animate-pulse text-danger-500')}
              />
              <span
                className={cn(
                  expired && order.status !== 'closed' ? 'animate-pulse font-semibold text-danger-600' : ''
                )}
              >
                {remaining.text}
              </span>
            </div>
            <div className="flex items-center gap-2">{actionButtons()}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function LevelBar({ level }: { level: RectificationOrder['hazardLevel'] }) {
  const colors = {
    critical: 'bg-gradient-to-b from-danger-400 via-danger-500 to-danger-600',
    normal: 'bg-gradient-to-b from-warning-400 via-warning-500 to-warning-600',
    minor: 'bg-gradient-to-b from-success-400 via-success-500 to-success-600',
  };
  return <div className={cn('w-1.5 shrink-0', colors[level])} />;
}

function HazardLevelTag({ level }: { level: RectificationOrder['hazardLevel'] }) {
  const config = getHazardLevelConfig(level);
  const variants = {
    critical: 'danger',
    normal: 'warning',
    minor: 'success',
  } as const;
  return (
    <StatusBadge
      label={config.label}
      variant={variants[level]}
      size="sm"
      pulse={level === 'critical'}
      className="font-medium"
    />
  );
}

function ProgressTimeline({ currentStep, expired }: { currentStep: number; expired: boolean }) {
  return (
    <div className="flex items-center justify-between w-full max-w-[240px]">
      {STEPS.map((step, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum <= currentStep;
        const isCurrent = stepNum === currentStep;
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300',
                  isActive
                    ? expired && isCurrent
                      ? 'bg-danger-500 text-white shadow-md shadow-danger-500/30'
                      : 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30'
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span
                className={cn(
                  'text-[10px] mt-1 whitespace-nowrap',
                  isActive ? 'text-gray-700 font-medium' : 'text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-8 h-0.5 mx-1 rounded-full transition-colors duration-300',
                  stepNum < currentStep
                    ? expired && stepNum + 1 === currentStep
                      ? 'bg-danger-400'
                      : 'bg-primary-400'
                    : 'bg-gray-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface OrderDetailProps {
  order: RectificationOrder;
  onClose: () => void;
}

function OrderDetail({ order, onClose }: OrderDetailProps) {
  const statusConfig = getRectificationStatusConfig(order.status);
  const hazardConfig = getHazardLevelConfig(order.hazardLevel);
  const remaining = timeRemaining(order.deadline);
  const currentStep = getCurrentStep(order.status);
  const urgeLogs = order.logs.filter((l) => l.action === 'urge');

  const getActionLabel = (action: string) => {
    const labels: Record<string, { label: string; color: string; icon: string }> = {
      dispatch: { label: '派单', color: 'bg-blue-50 text-blue-600', icon: '📋' },
      accept: { label: '接单', color: 'bg-primary-50 text-primary-600', icon: '✅' },
      process: { label: '整改中', color: 'bg-primary-50 text-primary-600', icon: '🔧' },
      complete: { label: '完成整改', color: 'bg-warning-50 text-warning-600', icon: '📌' },
      urge: { label: '催办', color: 'bg-danger-50 text-danger-600', icon: '⏰' },
      recheck_pass: { label: '复查通过', color: 'bg-success-50 text-success-600', icon: '🎯' },
      recheck_fail: { label: '复查不通过', color: 'bg-danger-50 text-danger-600', icon: '❌' },
      re_dispatch: { label: '重新派单', color: 'bg-orange-50 text-orange-600', icon: '🔄' },
    };
    return labels[action] || { label: action, color: 'bg-gray-100 text-gray-600', icon: '📝' };
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100">
        <LevelBar level={order.hazardLevel} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={cn('px-2 py-0.5 text-[11px] font-medium rounded-full', hazardConfig.bg, hazardConfig.color)}>
              {hazardConfig.label}隐患
            </span>
            <StatusBadge label={statusConfig.label} variant={order.status === 'closed' ? 'success' : order.status === 'completed' ? 'warning' : remaining.expired ? 'danger' : 'info'} />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-2">{order.hazardTitle}</h3>
          <div className={cn('flex items-center gap-1.5 text-sm font-medium', remaining.expired && order.status !== 'closed' ? 'text-danger-600 animate-pulse' : 'text-gray-600')}>
            <Clock className="w-4 h-4" />
            {remaining.text} · 截止 {formatDateTime(order.deadline)}
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-primary-500" />
          处理进度
        </h4>
        <Card className="p-4">
          <ProgressTimeline currentStep={currentStep} expired={remaining.expired && order.status !== 'closed'} />
        </Card>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">整改责任人</h4>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
              {order.handler.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{order.handler}</p>
              <p className="text-xs text-gray-500 mt-0.5">{order.department}</p>
            </div>
            <Button
              variant="twin"
              size="sm"
              leftIcon={<Phone className="w-4 h-4" />}
              onClick={() => (window.location.href = `tel:${order.handlerPhone.replace(/[^0-9+]/g, '')}`)}
            >
              拨打
            </Button>
          </div>
          <Divider />
          <div className="grid grid-cols-2 gap-y-2">
            <InfoRow label="联系电话" value={<span className="text-primary-600">{order.handlerPhone}</span>} />
            <InfoRow label="催办次数" value={<span className={cn(order.urgeCount > 0 ? 'text-danger-600 font-semibold' : '')}>{order.urgeCount} 次</span>} />
            <InfoRow label="派单时间" value={order.dispatchTime ? formatDateTime(order.dispatchTime) : '-'} />
            <InfoRow label="工单编号" value={<span className="font-mono text-[11px]">{order.id}</span>} />
          </div>
        </Card>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <MessageSquareWarning className="w-4 h-4 text-warning-500" />
          催办记录
          {urgeLogs.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-danger-100 text-danger-600 rounded-full">
              {urgeLogs.length}
            </span>
          )}
        </h4>
        {urgeLogs.length === 0 ? (
          <Card className="p-6">
            <div className="flex flex-col items-center text-center">
              <Bell className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">暂无催办记录</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {urgeLogs.map((log) => (
              <Card key={log.id} className="p-3 bg-danger-50/30 border-danger-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-danger-100 flex items-center justify-center shrink-0">
                    <MessageSquareWarning className="w-4 h-4 text-danger-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-danger-700">{log.operator}</p>
                      <span className="text-[11px] text-gray-500 whitespace-nowrap">{formatDateTime(log.createTime)}</span>
                    </div>
                    <p className="text-xs text-gray-700 mt-0.5">{log.remark}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-primary-500" />
          整改日志
        </h4>
        <div className="relative pl-6">
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary-300 via-primary-200 to-gray-200 rounded-full" />
          {order.logs.map((log, idx) => {
            const actionInfo = getActionLabel(log.action);
            const isLast = idx === order.logs.length - 1;
            return (
              <div key={log.id} className={cn('relative pb-5', isLast && 'pb-0')}>
                <div className="absolute -left-[18px] top-1 w-6 h-6 rounded-full bg-white border-2 border-primary-300 flex items-center justify-center text-[10px] shadow-sm">
                  {actionInfo.icon}
                </div>
                <Card className="p-3 ml-2">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className={cn('px-2 py-0.5 text-[11px] font-medium rounded-md shrink-0', actionInfo.color)}>
                      {actionInfo.label}
                    </span>
                    <span className="text-[11px] text-gray-500 whitespace-nowrap">{formatDateTime(log.createTime)}</span>
                  </div>
                  <p className="text-xs font-medium text-gray-800 mb-0.5">{log.operator}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{log.remark}</p>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">前后对比</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 text-[11px] font-medium bg-danger-100 text-danger-600 rounded-md">整改前</span>
            </div>
            <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
              <Camera className="w-8 h-8 mb-1" />
              <span className="text-xs">暂无照片</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 text-[11px] font-medium bg-success-100 text-success-600 rounded-md">整改后</span>
            </div>
            {order.afterPhotos && order.afterPhotos.length > 0 ? (
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary-50 to-success-50 border-2 border-success-200 flex flex-col items-center justify-center text-success-500">
                <CheckCircle2 className="w-8 h-8 mb-1" />
                <span className="text-xs">已上传照片</span>
              </div>
            ) : (
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                <Camera className="w-8 h-8 mb-1" />
                <span className="text-xs">暂无照片</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Divider />

      <Button variant="twin" size="full" rightIcon={<ChevronRight className="w-4 h-4" />} onClick={onClose}>
        关闭详情
      </Button>
    </div>
  );
}
