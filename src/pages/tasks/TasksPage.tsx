import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { Card, StatusBadge, Tag, EmptyState, SearchBar } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import {
  formatTime,
  formatDistance,
  getPriorityConfig,
  getStatusConfig,
  getTaskTypeName,
  cn,
} from '@/utils';
import {
  Navigation,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  Play,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Footprints,
} from 'lucide-react';
import type { Task, TaskStatus } from '@/types';

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

function TaskCard({
  task,
  isExpanded,
  onToggle,
}: {
  task: Task;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const navigate = useNavigate();
  const priorityConfig = getPriorityConfig(task.priority);
  const statusConfig = getStatusConfig(task.status);
  const currentPosition = useAppStore((s) => s.currentPosition);
  const updateTaskStatus = useAppStore((s) => s.updateTaskStatus);
  const checkInTask = useAppStore((s) => s.checkInTask);
  const setNavTarget = useAppStore((s) => s.setNavTarget);

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

  const handleViewDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('查看详情:', task.id);
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTaskStatus(task.id, 'completed', {
      completeTime: new Date().toISOString(),
    });
  };

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
              <StatusBadge
                label={statusConfig.label}
                variant={
                  task.status === 'in_progress'
                    ? 'success'
                    : task.status === 'completed'
                    ? 'default'
                    : task.status === 'expired'
                    ? 'danger'
                    : 'info'
                }
                pulse={task.status === 'in_progress'}
              />
            </div>

            <h3 className="text-base font-semibold text-gray-900 mb-2 leading-snug line-clamp-2">
              {task.title}
            </h3>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{task.location}</span>
                {task.distance !== undefined && (
                  <span className="shrink-0 ml-auto text-primary-600 font-medium">
                    {formatDistance(task.distance)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>计划时间</span>
                <span className="text-gray-700 font-medium">{formatTime(task.planTime)}</span>
              </div>
            </div>

            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 animate-slide-up">
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
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">关联设施</p>
                  <div className="flex flex-wrap gap-1.5">
                    {task.facilityIds.map((id) => (
                      <span
                        key={id}
                        className="inline-flex items-center px-2 py-0.5 text-[11px] bg-gray-100 text-gray-600 rounded-md font-mono"
                      >
                        #{id.slice(-4)}
                      </span>
                    ))}
                  </div>
                </div>
                {task.checkInTime && (
                  <div className="flex items-center gap-2 text-xs text-success-600 bg-success-50 px-3 py-2 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>签到时间：{formatTime(task.checkInTime)}</span>
                  </div>
                )}
                {task.completeTime && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>完成时间：{formatTime(task.completeTime)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
              <button
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    收起详情
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    展开详情
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                {task.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Navigation className="w-4 h-4" />}
                      onClick={handleStartNavigation}
                    >
                      开始导航
                    </Button>
                    <Button
                      variant="twin"
                      size="sm"
                      leftIcon={<Play className="w-4 h-4" />}
                      onClick={handleCheckIn}
                    >
                      签到
                    </Button>
                  </>
                )}
                {task.status === 'in_progress' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Navigation className="w-4 h-4" />}
                      onClick={handleViewDetail}
                    >
                      查看详情
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                      onClick={handleComplete}
                    >
                      完成任务
                    </Button>
                  </>
                )}
                {task.status === 'completed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Navigation className="w-4 h-4" />}
                    onClick={handleViewDetail}
                  >
                    查看详情
                  </Button>
                )}
                {task.status === 'expired' && (
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<AlertCircle className="w-4 h-4" />}
                    onClick={handleViewDetail}
                  >
                    处理超期
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function TasksPage() {
  const tasks = useAppStore((s) => s.tasks);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    return { total, pending, inProgress, completed, completionRate };
  }, [tasks]);

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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
