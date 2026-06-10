import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { Card, Tag, EmptyState, SearchBar, Divider } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { getFacilityStatusConfig, formatDateTime, cn } from '@/utils';
import { FacilityStatus, FacilityInspection } from '@/types';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  FileText,
  User,
  ClipboardCheck,
  Building,
  Activity,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Ban,
} from 'lucide-react';

type StatusFilter = 'all' | FacilityStatus;

export default function InspectionRecordsPage() {
  const navigate = useNavigate();
  const inspectionRecords = useAppStore((s) => s.inspectionRecords);
  const facilities = useAppStore((s) => s.facilities);
  const tasks = useAppStore((s) => s.tasks);
  const setSelectedFacilityId = useAppStore((s) => s.setSelectedFacilityId);
  const setSelectedTaskId = useAppStore((s) => s.setSelectedTaskId);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [taskFilter, setTaskFilter] = useState<string | 'all'>('all');
  const [facilityFilter, setFacilityFilter] = useState<string | 'all'>('all');
  const [showTaskFilter, setShowTaskFilter] = useState(false);
  const [showFacilityFilter, setShowFacilityFilter] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getStatusTagColor = (s: FacilityStatus): 'green' | 'orange' | 'pink' | 'gray' => {
    if (s === 'normal') return 'green';
    if (s === 'warning') return 'orange';
    if (s === 'damaged') return 'pink';
    return 'gray';
  };

  const statusTabs: { key: StatusFilter; label: string; icon?: typeof CheckCircle2; variant?: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'normal', label: '正常', icon: CheckCircle2, variant: 'success' },
    { key: 'warning', label: '预警', icon: AlertTriangle, variant: 'warning' },
    { key: 'damaged', label: '损坏', icon: AlertCircle, variant: 'danger' },
    { key: 'offline', label: '停用', icon: Ban, variant: 'gray' },
  ];

  const stats = useMemo(() => {
    const total = inspectionRecords.length;
    const byStatus = {
      normal: inspectionRecords.filter((r) => r.status === 'normal').length,
      warning: inspectionRecords.filter((r) => r.status === 'warning').length,
      damaged: inspectionRecords.filter((r) => r.status === 'damaged').length,
      offline: inspectionRecords.filter((r) => r.status === 'offline').length,
    };
    return { total, byStatus };
  }, [inspectionRecords]);

  const filteredRecords = useMemo(() => {
    let list = [...inspectionRecords];
    if (statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (taskFilter !== 'all') {
      list = list.filter((r) => r.taskId === taskFilter);
    }
    if (facilityFilter !== 'all') {
      list = list.filter((r) => r.facilityId === facilityFilter);
    }
    if (searchText.trim()) {
      const kw = searchText.trim().toLowerCase();
      list = list.filter((r) => {
        const f = facilities.find((f) => f.id === r.facilityId);
        const t = tasks.find((t) => t.id === r.taskId);
        return (
          (f?.name.toLowerCase().includes(kw) || false) ||
          (f?.location.toLowerCase().includes(kw) || false) ||
          (r.inspector.toLowerCase().includes(kw) || false) ||
          (t?.title.toLowerCase().includes(kw) || false) ||
          (r.note?.toLowerCase().includes(kw) || false)
        );
      });
    }
    return list;
  }, [inspectionRecords, statusFilter, taskFilter, facilityFilter, searchText, facilities, tasks]);

  const taskOptions = useMemo(() => {
    const uniqueTaskIds = new Set(inspectionRecords.map((r) => r.taskId).filter(Boolean) as string[]);
    return tasks.filter((t) => uniqueTaskIds.has(t.id)).slice(0, 20);
  }, [inspectionRecords, tasks]);

  const facilityOptions = useMemo(() => {
    const uniqueFacilityIds = new Set(inspectionRecords.map((r) => r.facilityId));
    return facilities.filter((f) => uniqueFacilityIds.has(f.id)).slice(0, 20);
  }, [inspectionRecords, facilities]);

  const getFacilityById = (id: string) => facilities.find((f) => f.id === id);
  const getTaskById = (id?: string) => (id ? tasks.find((t) => t.id === id) : undefined);

  const handleViewFacility = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedFacilityId(id);
    navigate(`/facilities/${id}`);
  };
  const handleViewTask = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedTaskId(id);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <PageHeader
        title="巡检记录"
        subtitle={`共 ${stats.total} 条记录`}
        showBack
      />

      <div className="px-4 space-y-4 pt-3">
        <div className="grid grid-cols-5 gap-2">
          {statusTabs.map((tab) => {
            const Icon = tab.icon;
            const count = tab.key === 'all' ? stats.total : stats.byStatus[tab.key as FacilityStatus];
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={cn(
                  'flex flex-col items-center justify-center py-2.5 rounded-xl transition-all border',
                  isActive
                    ? 'bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-200'
                    : 'bg-white border-gray-100 hover:border-gray-200',
                )}
              >
                {Icon && <Icon className={cn('w-4 h-4 mb-1', isActive ? 'text-white' : 'text-gray-500')} />}
                <div className={cn('text-[10px] font-semibold', isActive ? 'text-white' : 'text-gray-700')}>
                  {tab.label}
                </div>
                <div className={cn('text-[10px] mt-0.5', isActive ? 'text-primary-100' : 'text-gray-400')}>{count}</div>
              </button>
            );
          })}
        </div>

        <SearchBar
          value={searchText}
          onChange={setSearchText}
          placeholder="搜索设施、任务、巡检人或备注..."
        />

        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <button
              onClick={() => {
                setShowTaskFilter((v) => !v);
                setShowFacilityFilter(false);
              }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs border transition-all',
                taskFilter !== 'all'
                  ? 'bg-primary-50 border-primary-200 text-primary-700'
                  : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200',
              )}
            >
              <ClipboardCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1 text-left truncate">
                {taskFilter === 'all' ? '按任务筛选' : getTaskById(taskFilter)?.title || '按任务筛选'}
              </span>
              {showTaskFilter ? (
                <ChevronUp className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
              )}
            </button>
            {showTaskFilter && (
              <div className="absolute z-20 top-full mt-1.5 left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                <button
                  onClick={() => {
                    setTaskFilter('all');
                    setShowTaskFilter(false);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs border-b border-gray-50',
                    taskFilter === 'all' ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50',
                  )}
                >
                  全部任务
                </button>
                {taskOptions.length === 0 && (
                  <div className="px-3 py-3 text-xs text-gray-400 text-center">暂无关联任务</div>
                )}
                {taskOptions.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTaskFilter(t.id);
                      setShowTaskFilter(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs border-b border-gray-50',
                      taskFilter === t.id
                        ? 'bg-primary-50 text-primary-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50',
                    )}
                  >
                    <div className="truncate font-medium">{t.title}</div>
                    <div className="truncate text-[10px] text-gray-400 mt-0.5">#{t.id} · {t.location}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowFacilityFilter((v) => !v);
                setShowTaskFilter(false);
              }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs border transition-all',
                facilityFilter !== 'all'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200',
              )}
            >
              <Building className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1 text-left truncate">
                {facilityFilter === 'all'
                  ? '按设施筛选'
                  : getFacilityById(facilityFilter)?.name || '按设施筛选'}
              </span>
              {showFacilityFilter ? (
                <ChevronUp className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
              )}
            </button>
            {showFacilityFilter && (
              <div className="absolute z-20 top-full mt-1.5 left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                <button
                  onClick={() => {
                    setFacilityFilter('all');
                    setShowFacilityFilter(false);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs border-b border-gray-50',
                    facilityFilter === 'all'
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50',
                  )}
                >
                  全部设施
                </button>
                {facilityOptions.length === 0 && (
                  <div className="px-3 py-3 text-xs text-gray-400 text-center">暂无设施</div>
                )}
                {facilityOptions.map((f) => {
                  const fs = getFacilityStatusConfig(f.status);
                  return (
                    <button
                      key={f.id}
                      onClick={() => {
                        setFacilityFilter(f.id);
                        setShowFacilityFilter(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-xs border-b border-gray-50',
                        facilityFilter === f.id
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-50',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'w-6 h-6 rounded-lg flex items-center justify-center shrink-0',
                            fs.bg,
                          )}
                        >
                          <Building className={cn('w-3.5 h-3.5', fs.color)} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{f.name}</div>
                          <div className="truncate text-[10px] text-gray-400">
                            #{f.id} · {f.location}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheck className="w-10 h-10 text-gray-300" />}
            title="暂无巡检记录"
            description={searchText || taskFilter !== 'all' || facilityFilter !== 'all' || statusFilter !== 'all'
              ? '尝试修改筛选条件查看'
              : '完成设施巡检后记录将显示在这里'}
          />
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((record) => {
              const facility = getFacilityById(record.facilityId);
              const task = getTaskById(record.taskId);
              const fStatus = getFacilityStatusConfig(record.status);
              const isExpanded = expandedId === record.id;

              return (
                <Card
                  key={record.id}
                  className={cn('transition-all', isExpanded ? 'ring-2 ring-primary-100' : '')}
                  onClick={() => setExpandedId(isExpanded ? null : record.id)}
                  hoverable
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                          fStatus.bg,
                        )}
                      >
                        <Building className={cn('w-5 h-5', fStatus.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-sm text-gray-800 truncate">
                            {facility?.name || '设施已删除'}
                          </div>
                          <Tag color={getStatusTagColor(record.status)} className="shrink-0" label={fStatus.label} />
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500">
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span>{formatDateTime(record.inspectTime)}</span>
                          <span className="text-gray-300 mx-0.5">·</span>
                          <User className="w-3 h-3 shrink-0" />
                          <span>{record.inspector}</span>
                        </div>
                        {record.note && (
                          <div className="mt-1.5 text-[11px] text-gray-600 bg-gray-50 rounded-lg px-2 py-1 line-clamp-2">
                            {record.note}
                          </div>
                        )}
                        {task && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-primary-600 bg-primary-50 rounded-lg px-2 py-1 inline-flex">
                            <ClipboardCheck className="w-3 h-3 shrink-0" />
                            <span className="truncate">{task.title}</span>
                          </div>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
                      )}
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                        <div className="space-y-2">
                          {facility && (
                            <div className="flex items-start justify-between py-2.5 gap-4">
                              <span className="text-sm text-gray-500 shrink-0 flex items-center gap-1.5">
                                <Building className="w-3.5 h-3.5" />
                                巡检设施
                              </span>
                              <button
                                onClick={(e) => handleViewFacility(e, facility.id)}
                                className="text-primary-600 font-medium hover:text-primary-700 hover:underline text-sm text-right"
                              >
                                {facility.name} #{facility.id}
                              </button>
                            </div>
                          )}
                          {facility && (
                            <div className="flex items-start justify-between py-2.5 gap-4">
                              <span className="text-sm text-gray-500 shrink-0 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" />
                                设施位置
                              </span>
                              <span className="text-sm text-gray-800 text-right">{facility.location}</span>
                            </div>
                          )}
                          <div className="flex items-start justify-between py-2.5 gap-4">
                            <span className="text-sm text-gray-500 shrink-0 flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5" />
                              现场状态
                            </span>
                            <Tag color={getStatusTagColor(record.status)} label={fStatus.label} />
                          </div>
                          <div className="flex items-start justify-between py-2.5 gap-4">
                            <span className="text-sm text-gray-500 shrink-0 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5" />
                              巡检人
                            </span>
                            <span className="text-sm text-gray-800">{record.inspector}</span>
                          </div>
                          <div className="flex items-start justify-between py-2.5 gap-4">
                            <span className="text-sm text-gray-500 shrink-0 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              巡检时间
                            </span>
                            <span className="text-sm text-gray-800 text-right">{formatDateTime(record.inspectTime)}</span>
                          </div>
                          {task && (
                            <div className="flex items-start justify-between py-2.5 gap-4">
                              <span className="text-sm text-gray-500 shrink-0 flex items-center gap-1.5">
                                <ClipboardCheck className="w-3.5 h-3.5" />
                                关联任务
                              </span>
                              <button
                                onClick={(e) => handleViewTask(e, task.id)}
                                className="text-primary-600 font-medium hover:text-primary-700 hover:underline text-sm text-right max-w-[180px] truncate"
                              >
                                {task.title} #{task.id}
                              </button>
                            </div>
                          )}
                        </div>
                        {record.note && (
                          <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-1.5">
                              <FileText className="w-3.5 h-3.5" />
                              <span className="font-medium">巡检备注</span>
                            </div>
                            <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {record.note}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
