import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  RefreshCw,
  MapPin,
  Clock,
  QrCode,
  Filter,
  ArrowRight,
  Database,
  Sparkles,
  CheckCircle2,
  Search,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { Card, StatusBadge, Tag, EmptyState, SearchBar, InfoRow, Divider } from '@/components/ui';
import FacilityIcon, { HologramFrame } from '@/components/common/FacilityIcon';
import { useAppStore } from '@/store/useAppStore';
import { formatDateTime, getFacilityStatusConfig, getFacilityTypeName, cn, formatDistance, haversineDistance } from '@/utils';
import type { FacilityType, FacilityStatus } from '@/types';

const TYPE_TABS: { value: FacilityType | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'lamp', label: '路灯' },
  { value: 'manhole', label: '井盖' },
  { value: 'bin', label: '垃圾箱' },
  { value: 'bench', label: '座椅' },
  { value: 'sign', label: '标识' },
  { value: 'fire_hydrant', label: '消防栓' },
];

const STATUS_FILTERS: { value: FacilityStatus | 'all'; label: string; variant: 'success' | 'warning' | 'danger' | 'default' | 'info' | 'twin' }[] = [
  { value: 'all', label: '全部', variant: 'info' },
  { value: 'normal', label: '正常', variant: 'success' },
  { value: 'warning', label: '预警', variant: 'warning' },
  { value: 'damaged', label: '损坏', variant: 'danger' },
  { value: 'offline', label: '离线', variant: 'default' },
];

const DISPLAY_COUNT = 5;

function getStatusBadgeVariant(status: FacilityStatus): 'success' | 'warning' | 'danger' | 'default' {
  switch (status) {
    case 'normal':
      return 'success';
    case 'warning':
      return 'warning';
    case 'damaged':
      return 'danger';
    case 'offline':
      return 'default';
  }
}

function getTypeTagColor(type: FacilityType): 'blue' | 'green' | 'orange' | 'pink' | 'purple' | 'gray' {
  switch (type) {
    case 'lamp':
      return 'orange';
    case 'manhole':
      return 'gray';
    case 'bin':
      return 'green';
    case 'bench':
      return 'pink';
    case 'sign':
      return 'blue';
    case 'fire_hydrant':
      return 'purple';
    case 'other':
      return 'gray';
  }
}

export default function FacilitiesPage() {
  const navigate = useNavigate();
  const facilities = useAppStore((s) => s.facilities);
  const currentPosition = useAppStore((s) => s.currentPosition);
  const facilityFilter = useAppStore((s) => s.facilityFilter);
  const setFacilityFilter = useAppStore((s) => s.setFacilityFilter);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showMore, setShowMore] = useState(false);

  const filteredFacilities = useMemo(() => {
    let result = [...facilities];

    if (facilityFilter.type && facilityFilter.type !== 'all') {
      result = result.filter((f) => f.type === facilityFilter.type);
    }

    if (facilityFilter.status && facilityFilter.status !== 'all') {
      result = result.filter((f) => f.status === facilityFilter.status);
    }

    if (searchKeyword.trim()) {
      const keyword = searchKeyword.trim().toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(keyword) ||
          f.code.toLowerCase().includes(keyword) ||
          f.location.toLowerCase().includes(keyword)
      );
    }

    if (currentPosition) {
      const withDist = result.map((f) => ({
        facility: f,
        dist: haversineDistance(currentPosition.lat, currentPosition.lng, f.lat, f.lng),
      }));
      withDist.sort((a, b) => a.dist - b.dist);
      result = withDist.map((x) => x.facility);
    }

    return result;
  }, [facilities, facilityFilter.type, facilityFilter.status, searchKeyword, currentPosition]);

  const displayedFacilities = useMemo(() => {
    return showMore ? filteredFacilities : filteredFacilities.slice(0, DISPLAY_COUNT);
  }, [filteredFacilities, showMore]);

  const hasMore = filteredFacilities.length > DISPLAY_COUNT;

  const handleCardClick = (id: string) => {
    navigate(`/facility/${id}`);
  };

  const handleTypeTabChange = (type: FacilityType | 'all') => {
    setFacilityFilter({ type });
  };

  const handleStatusFilterChange = (status: FacilityStatus | 'all') => {
    setFacilityFilter({ status });
  };

  const handleNearbyOnlyToggle = () => {
    setFacilityFilter({ nearbyOnly: !facilityFilter.nearbyOnly });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="设施卡片"
        subtitle={`共 ${filteredFacilities.length} 个设施`}
        rightContent={
          <Button
            variant="ghost"
            size="sm"
            className="!w-10 !h-10 !p-0 rounded-full text-white hover:bg-white/10"
            leftIcon={<Camera className="w-5 h-5" />}
          />
        }
      />

      <div className="px-4 pb-6 space-y-4 -mt-2 relative z-10">
        <div className="bg-white rounded-2xl p-4 shadow-card space-y-4">
          <SearchBar
            value={searchKeyword}
            onChange={setSearchKeyword}
            placeholder="搜索设施名称、编号或地址"
          />

          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {TYPE_TABS.map((tab) => {
              const active = facilityFilter.type === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => handleTypeTabChange(tab.value)}
                  className={cn(
                    'shrink-0 px-3.5 h-8 rounded-xl text-xs font-medium transition-all duration-200',
                    active
                      ? 'bg-gradient-to-r from-twin-cyan to-primary-500 text-white shadow-md shadow-primary-500/25'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUS_FILTERS.map((filter) => {
                const active = facilityFilter.status === filter.value;
                return (
                  <button
                    key={filter.value}
                    onClick={() => handleStatusFilterChange(filter.value)}
                    className={cn(
                      'shrink-0 px-2.5 h-7 rounded-full text-xs font-medium transition-all duration-200 border',
                      active
                        ? 'bg-primary-50 text-primary-600 border-primary-200'
                        : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
                    )}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNearbyOnlyToggle}
              className={cn(
                'shrink-0 flex items-center gap-1 px-2.5 h-7 rounded-full text-xs font-medium transition-all duration-200 border',
                facilityFilter.nearbyOnly
                  ? 'bg-twin-cyan/10 text-twin-cyan border-twin-cyan/20'
                  : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
              )}
            >
              <Sparkles className="w-3 h-3" />
              附近优先
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {displayedFacilities.length === 0 ? (
            <EmptyState
              icon={<Search className="w-10 h-10" />}
              title="未找到匹配的设施"
              description="尝试调整筛选条件或搜索关键词"
            />
          ) : (
            displayedFacilities.map((facility, index) => {
              const statusConfig = getFacilityStatusConfig(facility.status);
              const distance = currentPosition
                ? haversineDistance(currentPosition.lat, currentPosition.lng, facility.lat, facility.lng)
                : null;
              const isNearby = distance !== null && distance <= 500;

              return (
                <HologramFrame
                  key={facility.id}
                  className="animate-slide-up"
                  scanning={facility.status === 'normal'}
                >
                  <Card
                    hoverable
                    onClick={() => handleCardClick(facility.id)}
                    className="!rounded-2xl !border-0 !shadow-none !bg-transparent"
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <FacilityIcon type={facility.type} size="md" glow />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 truncate flex-1">
                              {facility.name}
                            </h3>
                            <StatusBadge
                              label={statusConfig.label}
                              variant={getStatusBadgeVariant(facility.status)}
                              size="sm"
                              pulse={facility.status !== 'offline'}
                            />
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[11px] text-gray-400 font-mono">
                              {facility.code}
                            </span>
                            <Tag label={getFacilityTypeName(facility.type)} color={getTypeTagColor(facility.type)} />
                            {isNearby && (
                              <Tag label={`${formatDistance(distance)}`} color="green" />
                            )}
                          </div>

                          <div className="flex items-start gap-2 text-xs text-gray-500 mb-2">
                            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
                            <span className="line-clamp-1">{facility.location}</span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              {facility.lastInspectTime && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatDateTime(facility.lastInspectTime)}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="flex items-center gap-1 px-2 h-5 rounded-full bg-success-50 text-success-600 text-[10px] font-medium border border-success-100">
                                <Database className="w-2.5 h-2.5" />
                                <span>孪生同步</span>
                                <CheckCircle2 className="w-2.5 h-2.5" />
                              </div>
                              <span className="text-[10px] text-gray-400">
                                {formatDateTime(facility.twinData.lastSyncTime)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </HologramFrame>
              );
            })
          )}
        </div>

        {hasMore && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="full"
              onClick={() => setShowMore(!showMore)}
              rightIcon={showMore ? <RefreshCw className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            >
              {showMore ? '收起列表' : `查看更多设施 (${filteredFacilities.length - DISPLAY_COUNT})`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
