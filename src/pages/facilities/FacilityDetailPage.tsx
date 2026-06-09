import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Scan,
  Camera,
  MapPin,
  Navigation,
  Phone,
  User,
  Clock,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  Database,
  RefreshCw,
  Send,
  FileClock,
  Wrench,
  Calendar,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { Card, StatusBadge, Tag, Modal, InfoRow, Divider, EmptyState } from '@/components/ui';
import FacilityIcon, { HologramFrame, FacilityIcon3D } from '@/components/common/FacilityIcon';
import { useAppStore } from '@/store/useAppStore';
import { formatDateTime, relativeTime, formatDistance, cn, getFacilityStatusConfig, getFacilityTypeName } from '@/utils';
import type { Facility } from '@/types';

interface MaintainRecord {
  id: string;
  type: string;
  time: string;
  operator: string;
  content: string;
  result: 'success' | 'warning';
}

interface InspectRecord {
  id: string;
  inspector: string;
  time: string;
  result: 'normal' | 'warning' | 'abnormal';
  remark: string;
}

const mockMaintainRecords: MaintainRecord[] = [
  { id: 'm1', type: '定期维护', time: '2026-05-20T14:30:00', operator: '李明', content: '清洁光源、检查线路、紧固螺丝', result: 'success' },
  { id: 'm2', type: '故障维修', time: '2026-04-12T10:15:00', operator: '王强', content: '更换LED驱动模块', result: 'success' },
  { id: 'm3', type: '定期维护', time: '2026-03-18T09:00:00', operator: '李明', content: '季度例行检查维护', result: 'success' },
  { id: 'm4', type: '巡检整改', time: '2026-02-10T16:45:00', operator: '赵刚', content: '修复灯杆底部锈蚀部位', result: 'success' },
  { id: 'm5', type: '年度检修', time: '2025-12-15T11:20:00', operator: '市政维修组', content: '全面检修及预防性维护', result: 'warning' },
];

const mockInspectRecords: InspectRecord[] = [
  { id: 'i1', inspector: '张伟', time: '2026-06-08T09:15:00', result: 'normal', remark: '设施运行正常，外观良好' },
  { id: 'i2', inspector: '刘芳', time: '2026-06-05T15:30:00', result: 'normal', remark: '各项指标正常' },
  { id: 'i3', inspector: '张伟', time: '2026-06-02T10:45:00', result: 'warning', remark: '发现底部轻微锈蚀，已记录' },
  { id: 'i4', inspector: '王磊', time: '2026-05-30T14:20:00', result: 'normal', remark: '夜间照明亮度正常' },
  { id: 'i5', inspector: '张伟', time: '2026-05-28T08:50:00', result: 'abnormal', remark: '驱动模块异常，已报修' },
];

function getStatusBadgeVariant(status: Facility['status']): 'success' | 'warning' | 'danger' | 'default' {
  switch (status) {
    case 'normal': return 'success';
    case 'warning': return 'warning';
    case 'damaged': return 'danger';
    case 'offline': return 'default';
  }
}

function getInspectResultVariant(result: InspectRecord['result']): 'success' | 'warning' | 'danger' {
  switch (result) {
    case 'normal': return 'success';
    case 'warning': return 'warning';
    case 'abnormal': return 'danger';
  }
}

function getInspectResultLabel(result: InspectRecord['result']): string {
  switch (result) {
    case 'normal': return '正常';
    case 'warning': return '注意';
    case 'abnormal': return '异常';
  }
}

export default function FacilityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const facilities = useAppStore((s) => s.facilities);
  const currentPosition = useAppStore((s) => s.currentPosition);

  const [showStatusModal, setShowStatusModal] = useState(false);

  const facility = useMemo(() => {
    return facilities.find((f) => f.id === id);
  }, [facilities, id]);

  const statusConfig = useMemo(() => {
    return facility ? getFacilityStatusConfig(facility.status) : null;
  }, [facility]);

  const distance = useMemo(() => {
    if (!facility || !currentPosition) return null;
    return formatDistance(
      Math.round(
        Math.sqrt(
          Math.pow((facility.lat - currentPosition.lat) * 111000, 2) +
          Math.pow((facility.lng - currentPosition.lng) * 111000 * Math.cos(facility.lat * Math.PI / 180), 2)
        )
      )
    );
  }, [facility, currentPosition]);

  if (!facility) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="设施详情" showBack />
        <div className="p-4">
          <EmptyState
            icon={<AlertTriangle className="w-10 h-10" />}
            title="设施不存在"
            description="未找到对应的设施信息，请返回重试"
            action={
              <Button variant="primary" size="sm" onClick={() => navigate(-1)}>
                返回上一页
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const twinSpecs = Object.entries(facility.twinData.specs);
  const onSiteSpecs = twinSpecs.map(([key, value]) => ({
    key,
    value: Math.random() > 0.85 ? `${value}(偏差)` : value,
    diff: Math.random() > 0.85,
  }));

  const handleScan = () => {
    navigate('/scan');
  };

  const handleReport = () => {
    navigate(`/report?facilityId=${facility.id}`);
  };

  const handleNavigate = () => {
    alert(`正在导航至 ${facility.location}`);
  };

  const handleCallMaintainer = () => {
    alert(`正在拨打 ${facility.maintainerPhone}`);
  };

  const handleStatusUpdate = (status: Facility['status']) => {
    useAppStore.getState().updateFacilityStatus(facility.id, status);
    setShowStatusModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <PageHeader
        title="设施详情"
        showBack
        rightContent={
          <div className="flex items-center gap-2">
            <button
              onClick={handleScan}
              className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-all active:scale-95"
            >
              <Scan className="w-5 h-5" />
            </button>
            <button
              onClick={handleReport}
              className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-all active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        }
      />

      <div className="px-4 pb-6 space-y-4 -mt-2 relative z-10">
        <HologramFrame className="p-6" scanning={facility.status !== 'offline'}>
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <FacilityIcon3D type={facility.type} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">{facility.name}</h2>
            <div className="flex items-center gap-2 mb-3">
              <StatusBadge
                label={statusConfig?.label || ''}
                variant={getStatusBadgeVariant(facility.status)}
                size="sm"
                pulse={facility.status !== 'offline'}
              />
              <Tag label={getFacilityTypeName(facility.type)} color="blue" />
              {distance && <Tag label={`距您 ${distance}`} color="green" />}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-success-50 to-emerald-50 border border-success-100">
              <Database className="w-3.5 h-3.5 text-success-600" />
              <span className="text-xs font-medium text-success-700">孪生数据</span>
              <span className="text-xs text-success-600 font-mono">{facility.twinData.modelVersion}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-success-500" />
            </div>
          </div>
        </HologramFrame>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-twin-cyan" />
              <h3 className="text-sm font-bold text-gray-900">孪生数据比对</h3>
            </div>
            <div className="flex items-center gap-2">
              {facility.twinData.syncedFromAdmin && (
                <Tag label="来自管理端同步" color="green" />
              )}
            </div>
          </div>
          <div className="text-xs text-gray-400 mb-3 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            最后同步时间：{formatDateTime(facility.twinData.lastSyncTime)}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-twin-cyan/5 to-primary-50/30 rounded-xl p-3 border border-twin-cyan/10">
              <div className="text-xs font-semibold text-twin-cyan mb-2 flex items-center gap-1">
                <Database className="w-3 h-3" />
                孪生数据
              </div>
              <div className="space-y-1.5">
                {twinSpecs.map(([key, value]) => (
                  <div key={key} className="flex justify-between items-start text-xs">
                    <span className="text-gray-500">{key}</span>
                    <span className="text-gray-800 font-medium text-right ml-2">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-start text-xs">
                  <span className="text-gray-500">材质</span>
                  <span className="text-gray-800 font-medium text-right ml-2">{facility.twinData.material}</span>
                </div>
                <div className="flex justify-between items-start text-xs">
                  <span className="text-gray-500">健康评分</span>
                  <span className="text-gray-800 font-medium text-right ml-2">{facility.twinData.conditionScore}分</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 rounded-xl p-3 border border-amber-100">
              <div className="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1">
                <Camera className="w-3 h-3" />
                现场数据
              </div>
              <div className="space-y-1.5">
                {onSiteSpecs.map(({ key, value, diff }) => (
                  <div key={key} className="flex justify-between items-start text-xs">
                    <span className="text-gray-500">{key}</span>
                    <span className={cn(
                      'font-medium text-right ml-2',
                      diff ? 'text-danger-600 bg-danger-50 px-1 rounded' : 'text-gray-800'
                    )}>
                      {value}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-start text-xs">
                  <span className="text-gray-500">材质</span>
                  <span className="text-gray-800 font-medium text-right ml-2">正常</span>
                </div>
                <div className="flex justify-between items-start text-xs">
                  <span className="text-gray-500">现场状态</span>
                  <span className="text-gray-800 font-medium text-right ml-2">{statusConfig?.label}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <FileClock className="w-5 h-5 text-primary-600" />
            基本信息
          </h3>
          <div className="space-y-0.5">
            <InfoRow label="设施名称" value={facility.name} highlight />
            <InfoRow label="设施编号" value={<span className="font-mono">{facility.code}</span>} />
            <InfoRow label="设施类型" value={getFacilityTypeName(facility.type)} />
            <InfoRow
              label="运行状态"
              value={
                <StatusBadge
                  label={statusConfig?.label || ''}
                  variant={getStatusBadgeVariant(facility.status)}
                  size="sm"
                />
              }
            />
            <InfoRow
              label="安装日期"
              value={
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  {facility.installDate}
                </div>
              }
            />
            <InfoRow
              label="上次维护"
              value={
                <div className="flex items-center gap-1">
                  <Wrench className="w-3 h-3 text-gray-400" />
                  {facility.lastMaintain}
                </div>
              }
            />
            <Divider />
            <InfoRow
              label="管理责任人"
              value={
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 text-gray-400" />
                  {facility.maintainer}
                </div>
              }
            />
            <InfoRow
              label="联系电话"
              value={
                <button
                  onClick={handleCallMaintainer}
                  className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-mono"
                >
                  <Phone className="w-3 h-3" />
                  {facility.maintainerPhone}
                </button>
              }
            />
            <InfoRow label="累计巡检" value={`${facility.inspectionCount} 次`} />
            {facility.lastInspector && (
              <InfoRow
                label="最近巡检"
                value={`${facility.lastInspector} · ${relativeTime(facility.lastInspectTime!)}`}
              />
            )}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="p-4 pb-0">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-danger-500" />
              位置信息
            </h3>
          </div>
          <div className="h-36 bg-gradient-to-br from-primary-100 via-twin-cyan/20 to-success-100 relative overflow-hidden mx-4 rounded-xl mb-3">
            <div className="absolute inset-0 bg-grid-pattern bg-[size:20px_20px] opacity-40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-4 bg-danger-500/20 rounded-full animate-ping" />
                <div className="relative w-10 h-10 bg-danger-500 rounded-full flex items-center justify-center shadow-lg shadow-danger-500/30">
                  <MapPin className="w-5 h-5 text-white" fill="white" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-white/90 backdrop-blur text-[10px] text-gray-600 font-mono">
              {facility.lat.toFixed(6)}, {facility.lng.toFixed(6)}
            </div>
            {distance && (
              <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-white/90 backdrop-blur text-[10px] text-success-600 font-medium">
                距您 {distance}
              </div>
            )}
          </div>
          <div className="px-4 pb-4">
            <div className="flex items-start gap-2 mb-3">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">{facility.location}</p>
            </div>
            <Button
              variant="outline"
              size="full"
              leftIcon={<Navigation className="w-4 h-4" />}
              onClick={handleNavigate}
            >
              导航到这里
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-warning-600" />
            维护记录
          </h3>
          <div className="relative pl-4">
            <div className="absolute left-1.5 top-1.5 bottom-1.5 w-px bg-gray-100" />
            {mockMaintainRecords.map((record, index) => (
              <div key={record.id} className="relative pb-4 last:pb-0">
                <div className={cn(
                  'absolute -left-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm',
                  record.result === 'success' ? 'bg-success-500' : 'bg-warning-500'
                )} />
                <div className="bg-gray-50 rounded-xl p-3 ml-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-gray-800">{record.type}</span>
                    <span className="text-[10px] text-gray-400">{formatDateTime(record.time)}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1.5">{record.content}</p>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-500 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {record.operator}
                    </span>
                    <StatusBadge
                      label={record.result === 'success' ? '完成' : '需关注'}
                      variant={record.result === 'success' ? 'success' : 'warning'}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-info-600" />
            巡检历史
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {mockInspectRecords.map((record) => (
              <div
                key={record.id}
                className="bg-gray-50 rounded-xl p-3 border border-gray-100 hover:border-primary-100 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-800">{record.inspector}</div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDateTime(record.time)}
                      </div>
                    </div>
                  </div>
                  <StatusBadge
                    label={getInspectResultLabel(record.result)}
                    variant={getInspectResultVariant(record.result)}
                    size="sm"
                  />
                </div>
                <p className="text-xs text-gray-600 pl-10">{record.remark}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />
        <div className="bg-white border-t border-gray-100 px-4 py-3 pb-safe">
          <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
            <Button
              variant="twin"
              size="md"
              leftIcon={<Scan className="w-4 h-4" />}
              onClick={handleScan}
            >
              扫码
            </Button>
            <Button
              variant="outline"
              size="md"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={() => setShowStatusModal(true)}
            >
              状态更新
            </Button>
            <Button
              variant="danger"
              size="md"
              leftIcon={<AlertTriangle className="w-4 h-4" />}
              onClick={handleReport}
            >
              上报隐患
            </Button>
          </div>
        </div>
      </div>

      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="更新设施状态">
        <div className="space-y-2">
          {([
            { value: 'normal', label: '正常', variant: 'success', desc: '设施运行正常' },
            { value: 'warning', label: '预警', variant: 'warning', desc: '存在潜在问题需关注' },
            { value: 'damaged', label: '损坏', variant: 'danger', desc: '设施损坏需维修更换' },
            { value: 'offline', label: '离线', variant: 'default', desc: '设备失联或停用' },
          ] as const).map((item) => (
            <button
              key={item.value}
              onClick={() => handleStatusUpdate(item.value)}
              className={cn(
                'w-full p-3 rounded-xl border-2 text-left transition-all',
                facility.status === item.value
                  ? 'border-primary-300 bg-primary-50'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge label={item.label} variant={item.variant} size="md" />
                  {facility.status === item.value && (
                    <CheckCircle2 className="w-4 h-4 text-primary-600" />
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
              <p className="text-xs text-gray-500 mt-1.5 ml-1">{item.desc}</p>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
