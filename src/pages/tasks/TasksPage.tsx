import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { Card, StatusBadge, Tag, EmptyState, SearchBar, Divider, InfoRow, Modal } from '@/components/ui';
import FacilityIcon from '@/components/common/FacilityIcon';
import { useAppStore } from '@/store/useAppStore';
import {
  formatTime,
  formatDistance,
  formatDateTime,
  relativeTime,
  getPriorityConfig,
  getStatusConfig,
  getTaskTypeName,
  getTimelineStepLabel,
  getFacilityStatusConfig,
  cn,
  haversineDistance,
} from '@/utils';
import {
  Navigation,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  Play,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Footprints,
  AlertTriangle,
  Edit3,
  Circle,
  XCircle,
  ClipboardCheck,
  FileWarning,
  Flag,
  Search,
  ShieldCheck,
  X as CloseX,
  User,
  Check as CheckIcon,
} from 'lucide-react';
import type { Task, TaskStatus, TaskTimelineStep, Facility, FacilityStatus } from '@/types';

type FilterKey = 'all' | TaskStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待执行' },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'expired', label: '超期' },
];

function RingProgress({
  percent,
  size = 64,
  strokeWidth = 6,
  color = '#10b981',
  bgColor = '#e5e7eb',
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>
          {Math.round(percent)}%
        </span>
      </div>
    </div>
  );
}

function StatCard({
  title,
  count,
  total,
  color,
  bgGradient,
  icon,
}: {
  title: string;
  count: number;
  total: number;
  color: string;
  bgGradient: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'relative rounded-2xl p-4 overflow-hidden border transition-all hover:shadow-lg hover:-translate-y-0.5',
        bgGradient
      )}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs text-white/70 font-medium">{title}</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white tracking-tight">{count}</span>
            <span className="text-xs text-white/60">/ {total}</span>
          </div>
        </div>
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            color
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function getStepIcon(type: TaskTimelineStep['type']) {
  switch (type) {
    case 'navigation_start': return <Navigation className="w-3.5 h-3.5" />;
    case 'check_in': return <Flag className="w-3.5 h-3.5" />;
    case 'facility_inspect': return <ClipboardCheck className="w-3.5 h-3.5" />;
    case 'hazard_report': return <FileWarning className="w-3.5 h-3.5" />;
    case 'task_complete': return <CheckCircle2 className="w-3.5 h-3.5" />;
    default: return <Circle className="w-3.5 h-3.5" />;
  }
}

function TaskCard({
  task,
  isExpanded,
  onToggle,
  onReport,
  onInspect,
  onRequestComplete,
}: {
  task: Task;
  isExpanded: boolean;
  onToggle: () => void;
  onReport?: () => void;
  onInspect?: () => void;
  onRequestComplete?: () => void;
}) {
  const navigate = useNavigate();
  const priorityConfig = getPriorityConfig(task.priority);
  const statusConfig = getStatusConfig(task.status);
  const currentPosition = useAppStore((s) => s.currentPosition);
  const checkInTask = useAppStore((s) => s.checkInTask);
  const setNavTarget = useAppStore((s) => s.setNavTarget);
  const startTaskNavigation = useAppStore((s) => s.startTaskNavigation);
  const completeTask = useAppStore((s) => s.completeTask);
  const taskTimelines = useAppStore((s) => s.taskTimelines);
  const facilities = useAppStore((s) => s.facilities);
  const hazardReports = useAppStore((s) => s.hazardReports);

  const timeline = useMemo(() => taskTimelines[task.id] || [], [taskTimelines, task.id]);
  const relatedFacilities = useMemo(
    () => facilities.filter((f) => task.facilityIds.includes(f.id) || timeline.filter((s) => s.type === 'facility_inspect').some((s) => s.relatedId === f.id)),
    [facilities, task.facilityIds, timeline]
  );
  const relatedHazards = useMemo(
    () => hazardReports.filter((h) => h.taskId === task.id || (task.relatedHazardIds || []).includes(h.id)),
    [hazardReports, task.id, task.relatedHazardIds]
  );
  const distanceToTask = useMemo(() => {
    if (!currentPosition) return null;
    return Math.round(haversineDistance(currentPosition.lat, currentPosition.lng, task.lat, task.lng));
  }, [currentPosition, task.lat, task.lng]);
  const isNearby = distanceToTask !== null && distanceToTask < 100;
  const isCompleted = task.status === 'completed';
  const canCheckIn = !isCompleted;

  const priorityBarColors: Record<string, string> = {
    high: 'bg-gradient-to-b from-danger-500 to-danger-600',
    medium: 'bg-gradient-to-b from-warning-500 to-warning-600',
    low: 'bg-gradient-to-b from-success-500 to-success-600',
  };

  const taskTypeColors: Record<string, 'blue' | 'green' | 'orange' | 'pink' | 'purple' | 'gray'> = {
    routine: 'blue',
    special: 'orange',
    emergency: 'pink',
  };

  const handleStartNavigation = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTaskNavigation(task.id);
    setNavTarget({
      type: 'task',
      id: task.id,
      title: task.title,
      lat: task.lat,
      lng: task.lng,
      address: task.address,
    });
    navigate('/map');
  };

  const handleCheckIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentPosition) {
      checkInTask(task.id, {
        lat: currentPosition.lat,
        lng: currentPosition.lng,
      });
    }
  };

  const handleGoInspect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onInspect) {
      onInspect();
      return;
    }
    setNavTarget({
      type: 'task',
      id: task.id,
      title: task.title,
      lat: task.lat,
      lng: task.lng,
      address: task.address,
    });
    navigate('/map');
  };

  const handleReportHazard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/report', { state: { taskId: task.id } });
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRequestComplete) {
      onRequestComplete();
      return;
    }
    completeTask(task.id);
};

  const stepCount = timeline.length;
  const hasInspection = timeline.some((s) => s.type === 'facility_inspect');
  const hasReport = timeline.some((s) => s.type === 'hazard_report');
  const canComplete = !isCompleted && (timeline.length > 0 || task.status === 'in_progress' || task.status === 'inspecting' || task.status === 'arrived');

  return (
    <Card
      className={cn(
        'mb-3 transition-all duration-300',
        isExpanded && 'shadow-card-hover border-primary-200'
      )}
      hoverable
      onClick={onToggle}
    >
      <div className="flex">
        <div
          className={cn(
            'w-1.5 shrink-0 rounded-l-2xl',
            priorityBarColors[task.priority]
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag label={getTaskTypeName(task.type)} color={taskTypeColors[task.type]} />
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md border',
                    priorityConfig.bg,
                    priorityConfig.color,
                    priorityConfig.border
                  )}
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full', priorityConfig.dot)} />
                  {priorityConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isNearby && !isCompleted && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded-md bg-success-50 text-success-600 border border-success-100">
                    <span className="w-1 h-1 rounded-full bg-success-500 animate-pulse" />
                    已到达
                  </span>
                )}
                <StatusBadge
                  label={statusConfig.label}
                  variant={
                    task.status === 'completed'
                      ? 'default'
                      : task.status === 'expired'
                      ? 'danger'
                      : task.status === 'navigating'
                      ? 'warning'
                      : task.status === 'arrived'
                      ? 'info'
                      : task.status === 'inspecting'
                      ? 'twin'
                      : 'success'
                  }
                  pulse={task.status === 'in_progress' || task.status === 'inspecting' || task.status === 'navigating'}
                />
              </div>
            </div>

            <h3 className="text-base font-semibold text-gray-900 mb-2 leading-snug line-clamp-2">
              {task.title}
            </h3>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{task.location}</span>
                {distanceToTask !== undefined && distanceToTask !== null && (
                  <span className="shrink-0 ml-auto text-primary-600 font-medium">
                    {formatDistance(distanceToTask)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>计划时间</span>
                <span className="text-gray-700 font-medium">{formatTime(task.planTime)}</span>
              </div>
            </div>

            {!isExpanded && timeline.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2 text-[11px] text-gray-500 overflow-hidden">
                <div className="flex -space-x-1.5 shrink-0">
                  {timeline.slice(0, 4).map((step) => (
                    <div
                      key={step.id}
                      className={cn(
                        'w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[8px]',
                        step.result === 'success'
                          ? 'bg-success-100 text-success-600'
                          : step.result === 'warning'
                          ? 'bg-warning-100 text-warning-600'
                          : step.result === 'failed'
                          ? 'bg-danger-100 text-danger-600'
                          : 'bg-gray-100 text-gray-500'
                      )}
                    >
                      {getStepIcon(step.type)}
                    </div>
                  ))}
                </div>
                <span className="truncate">
                  {stepCount} 步执行 · {hasInspection ? (timeline.filter((s) => s.type === 'facility_inspect').length + '设施巡检 · ') : ''}{hasReport ? (timeline.filter((s) => s.type === 'hazard_report').length + '隐患上报') : '点击查看详情'}
                </span>
              </div>
            )}

            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 animate-slide-up">
                <div>
                  <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    详细地址
                  </p>
                  <p className="text-sm text-gray-700">{task.address}</p>
                </div>

                {task.description && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1.5">
                      <Footprints className="w-3.5 h-3.5" />
                      任务说明
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {task.description}
                    </p>
                  </div>
                )}

                {distanceToTask !== null && (
                  <div
                    className={cn(
                      'px-3 py-2 rounded-xl text-xs flex items-center gap-2 border',
                      isNearby
                        ? 'bg-success-50 text-success-700 border-success-100'
                        : 'bg-primary-50 text-primary-700 border-primary-100'
                    )}
                  >
                    {isNearby ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>距离任务点 <b>{formatDistance(distanceToTask)}</b>，已在签到范围内</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4 shrink-0" />
                        <span>距离任务点 <b>{formatDistance(distanceToTask)}</b>，建议先导航前往</span>
                      </>
                    )}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      关联设施
                      {relatedFacilities.length > 0 && (
                        <span className="text-primary-600 font-semibold">({relatedFacilities.length})</span>
                      )}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {relatedFacilities.length === 0 ? (
                      <div className="text-[11px] text-gray-400 px-3 py-2 bg-gray-50 rounded-xl">
                        暂未关联设施，可在地图中选择巡检
                      </div>
                    ) : (
                      relatedFacilities.slice(0, 4).map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer hover:bg-primary-50 hover:border-primary-100 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/facilities/${f.id}`);
                          }}
                        >
                          <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-primary-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-800 truncate">{f.name}</div>
                            <div className="text-[10px] text-gray-400 truncate">#{f.code}</div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {relatedHazards.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                      <FileWarning className="w-3.5 h-3.5" />
                      关联隐患 <span className="text-danger-600 font-semibold">({relatedHazards.length})</span>
                    </p>
                    <div className="space-y-1.5">
                      {relatedHazards.map((h) => (
                        <div key={h.id} className="flex items-start gap-2 p-2 rounded-xl bg-danger-50 border border-danger-100">
                          <AlertTriangle className="w-3.5 h-3.5 text-danger-500 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-800 truncate">{h.title}</div>
                            <div className="text-[10px] text-gray-400 truncate">
                              {h.type} · {relativeTime(h.createTime)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {timeline.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      执行时间线
                    </p>
                    <div className="relative pl-4">
                      <div className="absolute left-[7px] top-1 bottom-1 w-px bg-gradient-to-b from-primary-200 via-success-200 to-success-300" />
                      <div className="space-y-3">
                        {timeline.map((step) => {
                          const iconColor =
                            step.result === 'success'
                              ? 'text-success-600 bg-success-100'
                              : step.result === 'warning'
                              ? 'text-warning-600 bg-warning-100'
                              : step.result === 'failed'
                              ? 'text-danger-600 bg-danger-100'
                              : 'text-primary-600 bg-primary-100';
                          const dotColor =
                            step.result === 'success'
                              ? 'bg-success-500'
                              : step.result === 'warning'
                              ? 'bg-warning-500'
                              : step.result === 'failed'
                              ? 'bg-danger-500'
                              : 'bg-primary-500';
                          return (
                            <div key={step.id} className="relative">
                              <div
                                className={cn(
                                  'absolute -left-4 top-0 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow-sm',
                                  dotColor
                                )}
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              </div>
                              <div className="pl-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <div className={cn('w-5 h-5 rounded-md flex items-center justify-center shrink-0', iconColor)}>
                                    {getStepIcon(step.type)}
                                  </div>
                                  <span className="text-xs font-semibold text-gray-800">
                                    {getTimelineStepLabel(step.type)}
                                  </span>
                                  {step.relatedName && (
                                    <span className="text-[11px] text-primary-600 font-medium truncate max-w-[180px]">
                                      · {step.relatedName}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-gray-400 font-mono ml-auto shrink-0">
                                    {formatDateTime(step.time)}
                                  </span>
                                </div>
                                {step.note && (
                                  <div className="text-[11px] text-gray-500 mt-0.5 ml-[26px] leading-relaxed">
                                    {step.note}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {isCompleted && task.completeTime && (
                  <div className="flex items-center gap-2 text-xs text-success-700 bg-gradient-to-r from-success-50 to-emerald-50 border border-success-100 px-3 py-2.5 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>任务已完成 · {formatDateTime(task.completeTime)}</span>
                  </div>
                )}
              </div>
            )}

            {!isCompleted && (
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                <button
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                  }}
                >
                  <ChevronDown className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />
                  {isExpanded ? '收起' : '展开'}
                </button>

                <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
                  {task.status === 'pending' && (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Navigation className="w-3.5 h-3.5" />}
                      onClick={handleStartNavigation}
                      className="!text-xs"
                    >
                      开始导航
                    </Button>
                  )}

                  {(task.status === 'pending' || task.status === 'navigating') && canCheckIn && (
                    <Button
                      variant={isNearby ? 'primary' : 'outline'}
                      size="sm"
                      leftIcon={<Flag className="w-3.5 h-3.5" />}
                      onClick={handleCheckIn}
                      className="!text-xs"
                    >
                      {isNearby ? '签到' : '远程签到'}
                    </Button>
                  )}

                  {(task.status === 'arrived' || task.status === 'inspecting' || task.status === 'in_progress') && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<ClipboardCheck className="w-3.5 h-3.5" />}
                        onClick={handleGoInspect}
                        className="!text-xs"
                      >
                        设施巡检
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<FileWarning className="w-3.5 h-3.5" />}
                        onClick={handleReportHazard}
                        className="!text-xs"
                      >
                        隐患上报
                      </Button>
                    </>
                  )}

                  {canComplete && (
                    <Button
                      variant="twin"
                      size="sm"
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      onClick={handleComplete}
                      className="!text-xs"
                    >
                      完成任务
                    </Button>
                  )}
                </div>
              </div>
            )}

            {isCompleted && (
              <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  {formatDateTime(task.completeTime!)} 完成
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                  }}
                  className="!text-xs"
                >
                  {isExpanded ? '收起时间线' : '查看时间线'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function TasksPage() {
  const navigate = useNavigate();
  const tasks = useAppStore((s) => s.tasks);
  const facilities = useAppStore((s) => s.facilities);
  const user = useAppStore((s) => s.user);
  const addFacilityInspection = useAppStore((s) => s.addFacilityInspection);
  const selectedTaskId = useAppStore((s) => s.selectedTaskId);
  const setSelectedTaskId = useAppStore((s) => s.setSelectedTaskId);
  const completeTask = useAppStore((s) => s.completeTask);
  const startTaskNavigation = useAppStore((s) => s.startTaskNavigation);
  const setNavTarget = useAppStore((s) => s.setNavTarget);
  const taskTimelines = useAppStore((s) => s.taskTimelines);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [expandedId, setExpandedId] = useState<string | null>(selectedTaskId);
  const [searchText, setSearchText] = useState('');
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectTaskId, setInspectTaskId] = useState<string | null>(null);
  const [selectedInspectFacilityId, setSelectedInspectFacilityId] = useState<string | null>(null);
  const [inspectStatus, setInspectStatus] = useState<FacilityStatus>('normal');
  const [inspectNote, setInspectNote] = useState('');
  const [submittingInspect, setSubmittingInspect] = useState(false);
  const [completeWarningOpen, setCompleteWarningOpen] = useState(false);
  const [completeWarningTaskId, setCompleteWarningTaskId] = useState<string | null>(null);
  const [completeWarningMissing, setCompleteWarningMissing] = useState<{ checkIn: boolean; inspect: boolean }>({ checkIn: false, inspect: false });
  const [noHazardOpen, setNoHazardOpen] = useState(false);
  const [noHazardTaskId, setNoHazardTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedTaskId) {
      setExpandedId(selectedTaskId);
      setSelectedTaskId(null);
    }
  }, [selectedTaskId, setSelectedTaskId]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    return { total, pending, inProgress, completed, completionRate };
  }, [tasks]);

  const handleRequestComplete = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const timeline = taskTimelines[taskId] || [];
    const hasCheckIn = timeline.some((s) => s.type === 'check_in');
    const hasInspection = timeline.some((s) => s.type === 'facility_inspect');
    const hasReport = timeline.some((s) => s.type === 'hazard_report');

    if (!hasCheckIn || !hasInspection) {
      setCompleteWarningMissing({ checkIn: !hasCheckIn, inspect: !hasInspection });
      setCompleteWarningTaskId(taskId);
      setCompleteWarningOpen(true);
      setExpandedId(taskId);
      return;
    }

    if (!hasReport) {
      setNoHazardTaskId(taskId);
      setNoHazardOpen(true);
      return;
    }

    completeTask(taskId);
  };

  const handleGoCheckIn = () => {
    const tid = completeWarningTaskId;
    if (!tid) return;
    const task = tasks.find((t) => t.id === tid);
    setCompleteWarningOpen(false);
    if (task) {
      startTaskNavigation(tid);
      setNavTarget({
        type: 'task',
        id: tid,
        title: task.title,
        lat: task.lat,
        lng: task.lng,
        address: task.address,
      });
      navigate('/map');
    }
  };

  const handleGoInspect = () => {
    const tid = completeWarningTaskId;
    if (!tid) return;
    setCompleteWarningOpen(false);
    handleOpenInspect(tid);
  };

  const handleOpenInspect = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    setInspectTaskId(taskId);
    setInspectModalOpen(true);
    setSelectedInspectFacilityId(task?.facilityIds[0] || null);
    setInspectStatus('normal');
    setInspectNote('');
    setExpandedId(taskId);
  };

  const handleConfirmNoHazard = () => {
    const tid = noHazardTaskId;
    setNoHazardOpen(false);
    if (tid) completeTask(tid, { markNoHazard: true });
  };

  const handleGoReportNoHazard = () => {
    const tid = noHazardTaskId;
    setNoHazardOpen(false);
    if (tid) navigate('/report', { state: { taskId: tid } });
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (activeFilter !== 'all') {
      result = result.filter((t) => t.status === activeFilter);
    }
    if (searchText.trim()) {
      const keyword = searchText.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(keyword) ||
          t.location.toLowerCase().includes(keyword) ||
          t.address.toLowerCase().includes(keyword)
      );
    }
    return result;
  }, [tasks, activeFilter, searchText]);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <PageHeader title="今日任务" subtitle="2026年6月10日 星期三" />

      <div className="px-4 -mt-2 relative z-10">
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <StatCard
            title="待办任务"
            count={stats.pending}
            total={stats.total}
            color="bg-white/20 text-white"
            bgGradient="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 border-primary-500/30"
            icon={<Clock className="w-5 h-5" />}
          />
          <StatCard
            title="进行中"
            count={stats.inProgress}
            total={stats.total}
            color="bg-white/20 text-white"
            bgGradient="bg-gradient-to-br from-success-600 via-success-700 to-success-800 border-success-500/30"
            icon={<Play className="w-5 h-5" />}
          />
          <StatCard
            title="已完成"
            count={stats.completed}
            total={stats.total}
            color="bg-white/20 text-white"
            bgGradient="bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 border-gray-500/30"
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
        </div>

        <Card className="p-4 mb-4" glow>
          <div className="flex items-center gap-4">
            <RingProgress
              percent={stats.completionRate}
              size={72}
              strokeWidth={7}
              color="#10b981"
            />
            <div className="flex-1">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">今日完成率</span>
                <span className="text-xs text-gray-500">
                  {stats.completed}/{stats.total} 项任务
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-success-500 to-success-400 rounded-full transition-all duration-700"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                <span>
                  剩余
                  <span className="text-primary-600 font-semibold mx-0.5">
                    {stats.pending + stats.inProgress}
                  </span>
                  项待处理
                </span>
                {stats.completionRate >= 80 ? (
                  <span className="text-success-600 font-medium">进度良好 ✓</span>
                ) : stats.completionRate >= 50 ? (
                  <span className="text-warning-600 font-medium">继续加油 ⚡</span>
                ) : (
                  <span className="text-danger-600 font-medium">需加快进度 ⚠</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="mb-3">
          <SearchBar
            value={searchText}
            onChange={setSearchText}
            placeholder="搜索任务标题、地点..."
            className="mb-3"
          />
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {FILTERS.map((filter) => {
              const count =
                filter.key === 'all'
                  ? tasks.length
                  : tasks.filter((t) => t.status === filter.key).length;
              const isActive = activeFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={cn(
                    'shrink-0 inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md shadow-primary-500/30'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  )}
                >
                  {filter.label}
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-md text-[11px] font-semibold',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={<Footprints className="w-10 h-10" />}
            title={searchText ? '未找到匹配的任务' : '暂无任务'}
            description={
              searchText
                ? '请尝试其他搜索关键词'
                : activeFilter === 'all'
                ? '今天还没有安排任务，好好休息一下吧'
                : `当前筛选条件下没有${FILTERS.find((f) => f.key === activeFilter)?.label}的任务`
            }
          />
        ) : (
          <div>
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isExpanded={expandedId === task.id}
                onToggle={() =>
                  setExpandedId(expandedId === task.id ? null : task.id)
                }
                onInspect={() => handleOpenInspect(task.id)}
                onRequestComplete={() => handleRequestComplete(task.id)}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={inspectModalOpen}
        onClose={() => {
          setInspectModalOpen(false);
          setInspectTaskId(null);
          setSelectedInspectFacilityId(null);
          setInspectNote('');
          setSubmittingInspect(false);
        }}
        title="设施巡检"
        className="!max-w-md"
      >
        {(() => {
          const task = inspectTaskId ? tasks.find((t) => t.id === inspectTaskId) : null;
          const taskFacilities = task
            ? facilities.filter((f) => task.facilityIds.includes(f.id))
            : [];
          const nearbyFacilities = facilities.filter((f) => !task?.facilityIds.includes(f.id));
          const canSubmit = selectedInspectFacilityId && !submittingInspect;
          const handleSubmit = async () => {
            if (!canSubmit || !selectedInspectFacilityId || !inspectTaskId) return;
            setSubmittingInspect(true);
            try {
              await new Promise((r) => setTimeout(r, 500));
              addFacilityInspection({
                facilityId: selectedInspectFacilityId,
                taskId: inspectTaskId,
                inspector: user?.name || '网格员',
                status: inspectStatus,
                note: inspectNote.trim() || undefined,
              });
            } finally {
              setSubmittingInspect(false);
              setInspectModalOpen(false);
              setInspectTaskId(null);
              setSelectedInspectFacilityId(null);
              setInspectNote('');
              if (inspectTaskId) setExpandedId(inspectTaskId);
            }
          };
          return (
            <div className="space-y-5">
              {task && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-primary-50 border border-primary-100">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                    <ClipboardCheck className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-primary-700">关联任务</p>
                    <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">{task.title}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">#{task.id.slice(-6)} · {task.address}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary-500" />
                  选择设施
                  <span className="text-[10px] text-danger-500 font-normal ml-0.5">*</span>
                </label>

                <div className="space-y-2">
                  {taskFacilities.length > 0 && (
                    <>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1 px-1">
                        <CheckIcon className="w-3 h-3" /> 任务关联设施
                      </div>
                      {taskFacilities.map((f) => (
                        <FacilityOption
                          key={f.id}
                          facility={f}
                          active={selectedInspectFacilityId === f.id}
                          onClick={() => setSelectedInspectFacilityId(f.id)}
                        />
                      ))}
                    </>
                  )}
                  {nearbyFacilities.length > 0 && (
                    <>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1 px-1 pt-1">
                        <Search className="w-3 h-3" /> 其他可选设施
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                        {nearbyFacilities.slice(0, 10).map((f) => (
                          <FacilityOption
                            key={f.id}
                            facility={f}
                            active={selectedInspectFacilityId === f.id}
                            onClick={() => setSelectedInspectFacilityId(f.id)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-primary-500" />
                  现场状态
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      { value: 'normal', label: '正常', cls: 'border-success-400 bg-success-50 text-success-600 ring-2 ring-success-100' },
                      { value: 'warning', label: '异常', cls: 'border-warning-400 bg-warning-50 text-warning-600 ring-2 ring-warning-100' },
                      { value: 'damaged', label: '损坏', cls: 'border-danger-400 bg-danger-50 text-danger-600 ring-2 ring-danger-100' },
                      { value: 'offline', label: '停用', cls: 'border-gray-400 bg-gray-50 text-gray-600 ring-2 ring-gray-100' },
                    ] as { value: FacilityStatus; label: string; cls: string }[]
                  ).map((s) => {
                    const isActive = inspectStatus === s.value;
                    return (
                      <button
                        key={s.value}
                        onClick={() => setInspectStatus(s.value)}
                        className={cn(
                          'py-2.5 rounded-xl border text-xs font-medium transition-all',
                          isActive ? s.cls : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                        )}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-primary-500" />
                  巡检备注
                  <span className="text-[10px] text-gray-400 font-normal ml-1">（可选）</span>
                </label>
                <textarea
                  value={inspectNote}
                  onChange={(e) => setInspectNote(e.target.value)}
                  rows={3}
                  maxLength={200}
                  placeholder="请输入巡检中发现的问题、处理建议或其他需要说明的事项..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm resize-none placeholder:text-gray-400"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-gray-400">支持换行</span>
                  <span className={`text-[10px] ${inspectNote.length > 180 ? 'text-danger-500' : 'text-gray-400'}`}>
                    {inspectNote.length}/200
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <User className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[11px] text-gray-400">巡检人</p>
                  <p className="text-xs font-medium text-gray-700">{user?.name || '网格员'} · {new Date().toLocaleDateString('zh-CN')}</p>
                </div>
              </div>

              <Divider />

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="full"
                  onClick={() => {
                    setInspectModalOpen(false);
                    setInspectTaskId(null);
                    setSelectedInspectFacilityId(null);
                    setInspectNote('');
                  }}
                >
                  取消
                </Button>
                <Button
                  variant="primary"
                  size="full"
                  loading={submittingInspect}
                  leftIcon={<ClipboardCheck className="w-4 h-4" />}
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                >
                  提交巡检
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      <Modal
        isOpen={completeWarningOpen}
        onClose={() => setCompleteWarningOpen(false)}
        title="任务未完成校验"
      >
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-warning-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5.5 h-5.5 text-warning-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-800">还有必填步骤未完成</div>
              <div className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                为了保证任务闭环，请先完成以下步骤后再提交完成
              </div>
            </div>
          </div>

          <div className="space-y-2.5 mb-5">
            <div
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border transition-all',
                completeWarningMissing.checkIn
                  ? 'bg-danger-50 border-danger-100'
                  : 'bg-success-50 border-success-100',
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                  completeWarningMissing.checkIn ? 'bg-white' : 'bg-success-100',
                )}
              >
                {completeWarningMissing.checkIn ? (
                  <Flag className={cn('w-4 h-4 text-danger-600')} />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-success-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-800">任务签到</div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {completeWarningMissing.checkIn ? '需要先到任务地点完成签到' : '已完成签到'}
                </div>
              </div>
              {completeWarningMissing.checkIn && (
                <Tag color="pink" label="待完成" />
              )}
              {!completeWarningMissing.checkIn && (
                <Tag color="green" label="已完成" />
              )}
            </div>

            <div
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border transition-all',
                completeWarningMissing.inspect
                  ? 'bg-danger-50 border-danger-100'
                  : 'bg-success-50 border-success-100',
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                  completeWarningMissing.inspect ? 'bg-white' : 'bg-success-100',
                )}
              >
                {completeWarningMissing.inspect ? (
                  <ClipboardCheck className={cn('w-4 h-4 text-danger-600')} />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-success-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-800">设施巡检</div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {completeWarningMissing.inspect ? '需要至少完成1次设施巡检' : '已完成设施巡检'}
                </div>
              </div>
              {completeWarningMissing.inspect && (
                <Tag color="pink" label="待完成" />
              )}
              {!completeWarningMissing.inspect && (
                <Tag color="green" label="已完成" />
              )}
            </div>
          </div>

          <div className="flex gap-2.5">
            <Button
              variant="outline"
              size="full"
              onClick={() => setCompleteWarningOpen(false)}
              className="!text-xs"
            >
              稍后再做
            </Button>
            {completeWarningMissing.checkIn && (
              <Button
                variant="primary"
                size="full"
                leftIcon={<Navigation className="w-4 h-4" />}
                onClick={handleGoCheckIn}
                className="!text-xs"
              >
                去签到
              </Button>
            )}
            {!completeWarningMissing.checkIn && completeWarningMissing.inspect && (
              <Button
                variant="primary"
                size="full"
                leftIcon={<ClipboardCheck className="w-4 h-4" />}
                onClick={handleGoInspect}
                className="!text-xs"
              >
                去巡检
              </Button>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={noHazardOpen}
        onClose={() => setNoHazardOpen(false)}
        title="完成任务确认"
      >
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-primary-50 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5.5 h-5.5 text-primary-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-800">巡检后未发现隐患</div>
              <div className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                检测到您已完成签到和设施巡检，但还没有提交过隐患上报，您可以选择以下任一方式完成任务闭环
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <button
              onClick={handleGoReportNoHazard}
              className="p-3.5 rounded-xl border border-warning-100 bg-warning-50 hover:bg-warning-100 hover:border-warning-200 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center mb-2.5">
                <FileWarning className="w-4 h-4 text-warning-600" />
              </div>
              <div className="text-xs font-semibold text-gray-800 mb-1">去上报隐患</div>
              <div className="text-[10px] text-gray-500 leading-relaxed">有需要上报的问题，进入隐患上报</div>
            </button>
            <button
              onClick={handleConfirmNoHazard}
              className="p-3.5 rounded-xl border border-success-100 bg-success-50 hover:bg-success-100 hover:border-success-200 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center mb-2.5">
                <ShieldCheck className="w-4 h-4 text-success-600" />
              </div>
              <div className="text-xs font-semibold text-gray-800 mb-1">本次无隐患</div>
              <div className="text-[10px] text-gray-500 leading-relaxed">确认无隐患，直接完成任务</div>
            </button>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
            <div className="text-[10px] text-gray-500 leading-relaxed">
              选择「本次无隐患」后会自动在任务时间线中留下记录，并将任务标记为完成状态
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function FacilityOption({
  facility,
  active,
  onClick,
}: {
  facility: Facility;
  active: boolean;
  onClick: () => void;
}) {
  const cfg = getFacilityStatusConfig(facility.status);
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 rounded-xl border transition-all flex items-center gap-3 text-left',
        active
          ? 'border-primary-400 bg-primary-50/50 ring-2 ring-primary-100 shadow-sm'
          : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white'
      )}
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', cfg.bg)}>
        <FacilityIcon type={facility.type} size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-gray-800 truncate">{facility.name}</p>
          <StatusBadge label={cfg.label} variant={cfg.color === 'text-success-600' ? 'success' : cfg.color === 'text-warning-600' ? 'warning' : cfg.color === 'text-danger-600' ? 'danger' : 'default'} size="sm" />
        </div>
        <p className="text-[11px] text-gray-400 truncate mt-0.5">{facility.location}</p>
      </div>
      {active && (
        <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center shrink-0 shadow-sm shadow-primary-500/30">
          <CheckIcon className="w-3.5 h-3.5 text-white" />
        </div>
      )}
    </button>
  );
}
