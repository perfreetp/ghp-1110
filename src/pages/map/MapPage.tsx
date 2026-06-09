import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Layers,
  LocateFixed,
  Plus,
  Minus,
  MapPin,
  Navigation,
  Pause,
  Play,
  Square,
  Footprints,
  Clock,
  ChevronUp,
  ChevronDown,
  X,
  AlertTriangle,
  History,
  Eye,
  Edit3,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, StatusBadge, Tag, EmptyState, Modal, InfoRow, Divider } from '@/components/ui';
import FacilityIcon from '@/components/common/FacilityIcon';
import { useAppStore } from '@/store/useAppStore';
import {
  formatDateTime,
  formatDistance,
  relativeTime,
  getFacilityStatusConfig,
  getFacilityTypeName,
  cn,
  haversineDistance,
  calculateTrackDistance,
} from '@/utils';
import type { Facility, FacilityType, HazardReport } from '@/types';

type LayerType = 'facilities' | 'heatmap' | 'track';
type TrackStatus = 'idle' | 'recording' | 'paused';

const FACILITY_TYPES: { value: FacilityType; label: string }[] = [
  { value: 'lamp', label: '路灯' },
  { value: 'manhole', label: '井盖' },
  { value: 'bin', label: '垃圾箱' },
  { value: 'bench', label: '休闲座椅' },
  { value: 'sign', label: '交通标识' },
  { value: 'fire_hydrant', label: '消防栓' },
  { value: 'other', label: '其他设施' },
];

function getStatusPinColor(status: Facility['status']): { bg: string; ring: string; shadow: string } {
  switch (status) {
    case 'normal':
      return { bg: 'bg-success-500', ring: 'ring-success-200', shadow: 'shadow-success-500/40' };
    case 'warning':
      return { bg: 'bg-warning-500', ring: 'ring-warning-200', shadow: 'shadow-warning-500/40' };
    case 'damaged':
      return { bg: 'bg-danger-500', ring: 'ring-danger-200', shadow: 'shadow-danger-500/40' };
    case 'offline':
      return { bg: 'bg-gray-400', ring: 'ring-gray-200', shadow: 'shadow-gray-400/40' };
  }
}

function getStatusBadgeVariant(status: Facility['status']): 'success' | 'warning' | 'danger' | 'default' {
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

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${m}m`;
  if (m > 0) return `${m}m${s}s`;
  return `${s}s`;
}

export default function MapPage() {
  const navigate = useNavigate();
  const facilities = useAppStore((s) => s.facilities);
  const hazardReports = useAppStore((s) => s.hazardReports);
  const currentPosition = useAppStore((s) => s.currentPosition);
  const activeTrack = useAppStore((s) => s.activeTrack);
  const startTrack = useAppStore((s) => s.startTrack);
  const pauseTrack = useAppStore((s) => s.pauseTrack);
  const resumeTrack = useAppStore((s) => s.resumeTrack);
  const endTrack = useAppStore((s) => s.endTrack);
  const addTrackPoint = useAppStore((s) => s.addTrackPoint);
  const setSelectedFacilityId = useAppStore((s) => s.setSelectedFacilityId);
  const addFacility = useAppStore((s) => s.addFacility);
  const navTarget = useAppStore((s) => s.navTarget);
  const clearNavTarget = useAppStore((s) => s.clearNavTarget);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeLayers, setActiveLayers] = useState<Set<LayerType>>(new Set(['facilities', 'heatmap', 'track']));
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [zoom, setZoom] = useState(1);
  const [trackStatus, setTrackStatus] = useState<TrackStatus>('idle');
  const [trackDuration, setTrackDuration] = useState(0);
  const [trackDistance, setTrackDistance] = useState(0);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showAddPinModal, setShowAddPinModal] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showStatsDrawer, setShowStatsDrawer] = useState(false);
  const [newPinType, setNewPinType] = useState<FacilityType>('lamp');
  const [newPinName, setNewPinName] = useState('');
  const [longPressPos, setLongPressPos] = useState<{ lat: number; lng: number } | null>(null);
  const [direction, setDirection] = useState(45);

  const mapRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const centerLat = currentPosition?.lat ?? 34.2258;
  const centerLng = currentPosition?.lng ?? 108.9541;

  useEffect(() => {
    if (activeTrack) {
      setTrackStatus(activeTrack.status === 'paused' ? 'paused' : 'recording');
      const points = activeTrack.points;
      if (points.length > 0) {
        const startTime = new Date(points[0].time).getTime();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setTrackDuration(elapsed);
        setTrackDistance(calculateTrackDistance(points));
      }
    } else {
      setTrackStatus('idle');
      setTrackDuration(0);
      setTrackDistance(0);
    }
  }, [activeTrack]);

  useEffect(() => {
    if (trackStatus === 'recording') {
      trackTimer.current = setInterval(() => {
        setTrackDuration((d) => d + 1);
        if (currentPosition) {
          const newPoint = {
            lat: currentPosition.lat + (Math.random() - 0.5) * 0.0002,
            lng: currentPosition.lng + (Math.random() - 0.5) * 0.0002,
            time: new Date().toISOString(),
            speed: Math.random() * 2 + 0.5,
          };
          addTrackPoint(newPoint);
          setTrackDistance(calculateTrackDistance([...(activeTrack?.points ?? []), newPoint]));
        }
      }, 1000);
    } else {
      if (trackTimer.current) {
        clearInterval(trackTimer.current);
        trackTimer.current = null;
      }
    }
    return () => {
      if (trackTimer.current) clearInterval(trackTimer.current);
    };
  }, [trackStatus, currentPosition, activeTrack, addTrackPoint]);

  useEffect(() => {
    const dirTimer = setInterval(() => {
      setDirection((d) => (d + (Math.random() - 0.3) * 15 + 360) % 360);
    }, 2000);
    return () => clearInterval(dirTimer);
  }, []);

  const coordToPixel = (lat: number, lng: number) => {
    const scale = 12000 * zoom;
    const x = 50 + (lng - centerLng) * scale;
    const y = 50 - (lat - centerLat) * scale;
    return { x: `${x}%`, y: `${y}%` };
  };

  const filteredFacilities = useMemo(() => {
    if (!searchKeyword.trim()) return facilities;
    const kw = searchKeyword.trim().toLowerCase();
    return facilities.filter(
      (f) =>
        f.name.toLowerCase().includes(kw) ||
        f.code.toLowerCase().includes(kw) ||
        f.location.toLowerCase().includes(kw)
    );
  }, [facilities, searchKeyword]);

  const nearbyHazards = useMemo(() => {
    if (!currentPosition) return [];
    return hazardReports
      .map((h) => ({
        ...h,
        distance: haversineDistance(currentPosition.lat, currentPosition.lng, h.lat, h.lng),
      }))
      .filter((h) => h.distance <= 1000)
      .sort((a, b) => a.distance - b.distance);
  }, [hazardReports, currentPosition]);

  const facilityStats = useMemo(() => {
    const total = facilities.length;
    const normal = facilities.filter((f) => f.status === 'normal').length;
    const warning = facilities.filter((f) => f.status === 'warning').length;
    const damaged = facilities.filter((f) => f.status === 'damaged').length;
    const offline = facilities.filter((f) => f.status === 'offline').length;
    return { total, normal, warning, damaged, offline };
  }, [facilities]);

  const recentInspections = useMemo(() => {
    return facilities
      .filter((f) => f.lastInspectTime)
      .sort(
        (a, b) =>
          new Date(b.lastInspectTime!).getTime() - new Date(a.lastInspectTime!).getTime()
      )
      .slice(0, 5);
  }, [facilities]);

  const toggleLayer = (layer: LayerType) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  };

  const handleTrackButton = () => {
    if (trackStatus === 'idle') {
      startTrack();
      setTrackStatus('recording');
    } else if (trackStatus === 'recording') {
      pauseTrack();
      setTrackStatus('paused');
    } else if (trackStatus === 'paused') {
      resumeTrack();
      setTrackStatus('recording');
    }
  };

  const handleEndTrack = () => {
    endTrack();
    setTrackStatus('idle');
    setTrackDuration(0);
    setTrackDistance(0);
  };

  const handleMapPointerDown = () => {
    longPressTimer.current = setTimeout(() => {
      const offsetLat = centerLat + (Math.random() - 0.5) * 0.002;
      const offsetLng = centerLng + (Math.random() - 0.5) * 0.002;
      setLongPressPos({ lat: offsetLat, lng: offsetLng });
      setShowAddPinModal(true);
    }, 600);
  };

  const handleMapPointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleConfirmAddPin = () => {
    if (!longPressPos || !newPinName.trim()) return;
    const newId = addFacility({
      name: newPinName.trim(),
      type: newPinType,
      status: 'normal',
      location: `自定义采集：${newPinName.trim()}`,
      lat: longPressPos.lat,
      lng: longPressPos.lng,
      installDate: new Date().toISOString().slice(0, 10),
      lastMaintain: new Date().toISOString().slice(0, 10),
      maintainer: useAppStore.getState().user?.name || '网格员',
      maintainerPhone: useAppStore.getState().user?.phone || '',
      lastInspector: useAppStore.getState().user?.name || '网格员',
      lastInspectTime: new Date().toISOString(),
    });
    if (newId) {
      setSelectedFacilityId(newId);
      const newFacility = useAppStore.getState().facilities.find((f) => f.id === newId);
      if (newFacility) setSelectedFacility(newFacility);
    }
    setShowAddPinModal(false);
    setNewPinName('');
    setNewPinType('lamp');
    setLongPressPos(null);
  };

  const handleLocate = () => {
    setZoom(1);
  };

  const handleViewDetail = (id: string) => {
    setSelectedFacilityId(id);
    navigate(`/facilities/${id}`);
  };

  const handleGoInspect = (id: string) => {
    setSelectedFacilityId(id);
    navigate('/');
  };

  const handleReportIssue = (facility: Facility) => {
    navigate('/report', { state: { facilityId: facility.id } });
  };

  const roadLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i < 8; i++) {
      const isHorizontal = i % 2 === 0;
      lines.push({
        id: i,
        isHorizontal,
        offset: 10 + i * 12,
        width: isHorizontal ? 100 : 3 + (i % 3),
        height: isHorizontal ? 3 + (i % 3) : 100,
        top: isHorizontal ? `${10 + i * 12}%` : '0%',
        left: isHorizontal ? '0%' : `${10 + i * 12}%`,
      });
    }
    return lines;
  }, []);

  const heatmapPoints = useMemo(() => {
    return hazardReports.slice(0, 12).map((h, i) => ({
      id: h.id,
      ...coordToPixel(h.lat, h.lng),
      size: 60 + (h.level === 'critical' ? 40 : h.level === 'normal' ? 20 : 10),
      intensity: h.level === 'critical' ? 0.7 : h.level === 'normal' ? 0.5 : 0.3,
      delay: i * 0.1,
    }));
  }, [hazardReports, zoom, centerLat, centerLng]);

  const trackPath = useMemo(() => {
    if (!activeTrack?.points || activeTrack.points.length < 2) return '';
    return activeTrack.points
      .map((p) => {
        const { x, y } = coordToPixel(p.lat, p.lng);
        return `${x},${y}`;
      })
      .join(' ');
  }, [activeTrack, zoom, centerLat, centerLng]);

  const trackButtonVariant =
    trackStatus === 'idle' ? 'primary' : trackStatus === 'recording' ? 'warning' : 'primary';
  const trackButtonIcon =
    trackStatus === 'idle' ? (
      <Play className="w-4 h-4" />
    ) : trackStatus === 'recording' ? (
      <Pause className="w-4 h-4" />
    ) : (
      <Play className="w-4 h-4" />
    );
  const trackButtonLabel =
    trackStatus === 'idle' ? '开始记录' : trackStatus === 'recording' ? '暂停' : '继续';

  return (
    <div className="h-screen w-full bg-gray-100 relative overflow-hidden select-none">
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes float-up {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes heat-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        .animate-breathe { animation: breathe 2.5s ease-in-out infinite; }
        .animate-ripple { animation: ripple 2s ease-out infinite; }
        .animate-float-up { animation: float-up 2s ease-in-out infinite; }
        .animate-heat-pulse { animation: heat-pulse 3s ease-in-out infinite; }
      `}</style>

      <div
        ref={mapRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{
          background: `
            linear-gradient(135deg, #e0f2fe 0%, #dcfce7 25%, #fef9c3 50%, #fce7f3 75%, #e0e7ff 100%),
            linear-gradient(45deg, rgba(255,255,255,0.3) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.3) 75%),
            linear-gradient(45deg, rgba(255,255,255,0.3) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.3) 75%)
          `,
          backgroundSize: '100% 100%, 40px 40px, 40px 40px',
          backgroundPosition: '0 0, 0 0, 20px 20px',
        }}
        onPointerDown={handleMapPointerDown}
        onPointerUp={handleMapPointerUp}
        onPointerLeave={handleMapPointerUp}
      >
        <div className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)
            `,
            backgroundSize: `${32 / zoom}px ${32 / zoom}px`,
          }}
        />

        {roadLines.map((line) => (
          <div
            key={line.id}
            className="absolute bg-gray-300/60 rounded-full pointer-events-none"
            style={{
              top: line.top,
              left: line.left,
              width: `${line.width}%`,
              height: `${line.height}%`,
              boxShadow: '0 0 0 1px rgba(255,255,255,0.5) inset',
            }}
          />
        ))}

        <div className="absolute w-48 h-48 rounded-full bg-emerald-200/40 blur-3xl pointer-events-none"
          style={{ top: '20%', left: '15%' }}
        />
        <div className="absolute w-56 h-56 rounded-full bg-blue-200/40 blur-3xl pointer-events-none"
          style={{ top: '60%', right: '10%' }}
        />
        <div className="absolute w-40 h-40 rounded-full bg-amber-200/30 blur-3xl pointer-events-none"
          style={{ bottom: '25%', left: '45%' }}
        />

        {activeLayers.has('heatmap') && (
          <div className="absolute inset-0 pointer-events-none">
            {heatmapPoints.map((point) => (
              <div
                key={point.id}
                className="absolute rounded-full animate-heat-pulse"
                style={{
                  left: point.x,
                  top: point.y,
                  width: `${point.size}px`,
                  height: `${point.size}px`,
                  transform: 'translate(-50%, -50%)',
                  background: `radial-gradient(circle, rgba(239,68,68,${point.intensity}) 0%, rgba(251,146,60,${point.intensity * 0.6}) 40%, transparent 70%)`,
                  animationDelay: `${point.delay}s`,
                  mixBlendMode: 'multiply',
                }}
              />
            ))}
          </div>
        )}

        {activeLayers.has('track') && trackPath && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
            <defs>
              <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <polyline
              fill="none"
              stroke="url(#trackGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={trackPath}
              transform="scale(1)"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(59,130,246,0.3))' }}
            />
          </svg>
        )}

        {activeLayers.has('facilities') && filteredFacilities.map((facility) => {
          const pos = coordToPixel(facility.lat, facility.lng);
          const colors = getStatusPinColor(facility.status);
          const isSelected = selectedFacility?.id === facility.id;
          return (
            <div
              key={facility.id}
              className="absolute -translate-x-1/2 -translate-y-full cursor-pointer z-10"
              style={{ left: pos.x, top: pos.y }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFacility(facility);
              }}
            >
              {isSelected && (
                <div
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full ${colors.bg} opacity-30 animate-ripple`}
                />
              )}
              <div className={cn(
                'relative animate-float-up',
                isSelected && 'scale-110 z-20'
              )}>
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white transition-transform',
                  colors.bg,
                  colors.shadow
                )}>
                  <FacilityIcon type={facility.type} size="sm" className="!w-6 !h-6 !rounded-full" />
                </div>
                <div className={cn(
                  'absolute left-1/2 -translate-x-1/2 -bottom-1 w-0 h-0',
                  'border-l-[6px] border-l-transparent',
                  'border-r-[6px] border-r-transparent',
                  `border-t-[8px] border-t-current`,
                  colors.bg.replace('bg-', 'text-')
                )} />
                {(facility.status === 'warning' || facility.status === 'damaged') && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white shadow flex items-center justify-center">
                    <AlertTriangle className={cn(
                      'w-2.5 h-2.5',
                      facility.status === 'damaged' ? 'text-danger-500' : 'text-warning-500'
                    )} />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {navTarget && (() => {
          const tPos = coordToPixel(navTarget.lat, navTarget.lng);
          const navLine = currentPosition
            ? `50%,50% ${tPos.x},${tPos.y}`
            : `${tPos.x},${tPos.y}`;
          return (
            <>
              {currentPosition && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 8 }}>
                  <defs>
                    <linearGradient id="navGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#e11d48" stopOpacity="0.9" />
                    </linearGradient>
                  </defs>
                  <line
                    x1="50%"
                    y1="50%"
                    x2={tPos.x}
                    y2={tPos.y}
                    stroke="url(#navGradient)"
                    strokeWidth="4"
                    strokeDasharray="10 6"
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(59,130,246,0.4))' }}
                  />
                </svg>
              )}
              <div
                className="absolute -translate-x-1/2 -translate-y-full z-25"
                style={{ left: tPos.x, top: tPos.y, zIndex: 25 }}
              >
                <div className="relative flex flex-col items-center">
                  <div className="absolute -bottom-8 w-16 h-16 rounded-full bg-danger-400/40 animate-breathe" />
                  <div className="absolute -bottom-4 w-10 h-10 rounded-full bg-danger-400/60 animate-pulse" />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-danger-500 to-danger-600 border-[3px] border-white shadow-2xl shadow-danger-500/40 flex items-center justify-center animate-float-up">
                      <MapPin className="w-6 h-6 text-white" fill="white" />
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[10px] border-t-danger-500" />
                  </div>
                  <div className="mt-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-danger-500 to-danger-600 text-white text-xs font-bold shadow-lg whitespace-nowrap">
                    {navTarget.title.length > 10 ? navTarget.title.slice(0, 10) + '...' : navTarget.title}
                  </div>
                </div>
              </div>
            </>
          );
        })()}

        {currentPosition && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
            style={coordToPixel(currentPosition.lat, currentPosition.lng)}
          >
            <div className="relative">
              <div className="absolute inset-0 -m-6 w-16 h-16 rounded-full bg-primary-400 animate-breathe" />
              <div className="absolute inset-0 -m-3 w-10 h-10 rounded-full bg-primary-400/40 animate-pulse" />
              <div
                className="relative w-6 h-6 rounded-full bg-primary-500 border-[3px] border-white shadow-lg shadow-primary-500/50"
                style={{ transform: `rotate(${direction}deg)` }}
              >
                <div
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderBottom: '8px solid #3b82f6',
                  }}
                />
              </div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <Navigation
                  className="w-5 h-5 text-primary-500 transition-transform"
                  style={{ transform: `rotate(${direction}deg) translateY(-18px)` }}
                  strokeWidth={2.5}
                />
              </div>
            </div>
          </div>
        )}

        {longPressPos && showAddPinModal && (
          <div
            className="absolute -translate-x-1/2 -translate-y-full z-30 pointer-events-none"
            style={coordToPixel(longPressPos.lat, longPressPos.lng)}
          >
            <div className="flex flex-col items-center animate-bounce">
              <div className="w-10 h-10 rounded-full bg-primary-500 border-4 border-white shadow-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-white" />
            </div>
          </div>
        )}
      </div>

      {navTarget && (
        <div className="absolute left-4 right-4 z-40 animate-slide-down" style={{ top: '76px' }} onClick={(e) => e.stopPropagation()}>
          <Card className="!shadow-2xl !border-primary-100 overflow-hidden">
            <div className="p-0">
              <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-danger-500 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <Navigation className="w-4 h-4" />
                  <span className="text-sm font-bold">导航中</span>
                </div>
                <button
                  onClick={clearNavTarget}
                  className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors"
                >
                  结束导航
                </button>
              </div>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-50 to-danger-50 border border-primary-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-danger-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate">{navTarget.title}</h4>
                    {navTarget.address && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{navTarget.address}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold text-primary-600 font-mono">
                          {currentPosition ? formatDistance(Math.round(haversineDistance(currentPosition.lat, currentPosition.lng, navTarget.lat, navTarget.lng))) : '-'}
                        </span>
                      </div>
                      <div className="w-px h-3.5 bg-gray-200" />
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>预计 {currentPosition ? Math.max(1, Math.round(haversineDistance(currentPosition.lat, currentPosition.lng, navTarget.lat, navTarget.lng) / 80)) : 0} 分钟</span>
                      </div>
                    </div>
                  </div>
                </div>
                {navTarget.type === 'task' && navTarget.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                    <Button variant="outline" size="sm" leftIcon={<CheckCircle2 className="w-4 h-4" />} className="flex-1 !text-xs">
                      任务签到
                    </Button>
                    <Button variant="primary" size="sm" leftIcon={<Eye className="w-4 h-4" />} className="flex-1 !text-xs" onClick={() => navigate('/')}>
                      查看任务
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 z-30 p-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50" />
            <div className="relative flex items-center gap-2 px-4 h-12">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索设施、地址、隐患..."
                className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              className={cn(
                'w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transition-all backdrop-blur-xl border border-white/50',
                showLayerMenu
                  ? 'bg-primary-500 text-white border-primary-400'
                  : 'bg-white/70 text-gray-600 hover:bg-white/90'
              )}
            >
              <Layers className="w-5 h-5" />
            </button>

            {showLayerMenu && (
              <div className="absolute top-14 right-0 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-2 w-44 animate-slide-down">
                {[
                  { key: 'facilities' as const, label: '设施点', icon: MapPin },
                  { key: 'heatmap' as const, label: '热力图', icon: AlertTriangle },
                  { key: 'track' as const, label: '轨迹', icon: Footprints },
                ].map(({ key, label, icon: Icon }) => {
                  const active = activeLayers.has(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleLayer(key)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 h-10 rounded-xl text-sm transition-all',
                        active
                          ? 'bg-primary-50 text-primary-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      <Icon className={cn('w-4 h-4', active ? 'text-primary-500' : 'text-gray-400')} />
                      <span>{label}</span>
                      {active && <div className="ml-auto w-2 h-2 rounded-full bg-primary-500" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2">
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
          className="w-11 h-11 rounded-xl bg-white/90 backdrop-blur-lg shadow-lg border border-white/60 flex items-center justify-center text-gray-600 hover:bg-white hover:text-primary-600 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
        <div className="w-11 h-0.5 bg-gray-200 rounded-full mx-auto" />
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))}
          className="w-11 h-11 rounded-xl bg-white/90 backdrop-blur-lg shadow-lg border border-white/60 flex items-center justify-center text-gray-600 hover:bg-white hover:text-primary-600 transition-all active:scale-95"
        >
          <Minus className="w-5 h-5" />
        </button>
      </div>

      <button
        onClick={handleLocate}
        className="absolute right-4 bottom-56 z-30 w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-lg shadow-xl border border-white/60 flex items-center justify-center text-primary-500 hover:bg-primary-50 transition-all active:scale-95"
      >
        <LocateFixed className="w-5 h-5" />
      </button>

      {selectedFacility && (
        <div
          className="absolute left-4 right-4 z-40 animate-slide-up"
          style={{ bottom: '200px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="shadow-2xl border-white/80">
            <div className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <FacilityIcon type={selectedFacility.type} size="lg" glow />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-base font-bold text-gray-900 truncate flex-1">
                      {selectedFacility.name}
                    </h3>
                    <button
                      onClick={() => setSelectedFacility(null)}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 shrink-0 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Tag label={getFacilityTypeName(selectedFacility.type)} color="blue" />
                    <StatusBadge
                      label={getFacilityStatusConfig(selectedFacility.status).label}
                      variant={getStatusBadgeVariant(selectedFacility.status)}
                      pulse={selectedFacility.status !== 'offline'}
                    />
                    <span className="text-[11px] text-gray-400 font-mono">{selectedFacility.code}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                    <span className="line-clamp-1">{selectedFacility.location}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2">
                <InfoRow label="完好度" value={`${selectedFacility.twinData.conditionScore}分`} highlight />
                <InfoRow label="巡检次数" value={`${selectedFacility.inspectionCount}次`} />
                <InfoRow
                  label="上次巡检"
                  value={selectedFacility.lastInspectTime ? relativeTime(selectedFacility.lastInspectTime) : '-'}
                />
              </div>

              <Divider />

              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Eye className="w-4 h-4" />}
                  onClick={() => handleViewDetail(selectedFacility.id)}
                  className="!text-xs"
                >
                  查看详情
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Edit3 className="w-4 h-4" />}
                  onClick={() => handleGoInspect(selectedFacility.id)}
                  className="!text-xs"
                >
                  去巡检
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<AlertTriangle className="w-4 h-4" />}
                  onClick={() => handleReportIssue(selectedFacility)}
                  className="!text-xs"
                >
                  上报问题
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="absolute left-0 right-0 bottom-0 z-30 p-4 pb-6">
        <div className="bg-white/75 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/60 p-4">
          {trackStatus !== 'idle' && (
            <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-primary-50 to-twin-cyan/10 border border-primary-100/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Footprints className="w-4 h-4 text-primary-500" />
                    <span className="text-xs text-gray-500">里程</span>
                    <span className="text-sm font-bold text-gray-900">{formatDistance(trackDistance)}</span>
                  </div>
                  <div className="w-px h-4 bg-gray-200" />
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary-500" />
                    <span className="text-xs text-gray-500">时长</span>
                    <span className="text-sm font-bold text-gray-900">{formatDuration(trackDuration)}</span>
                  </div>
                </div>
                {trackStatus === 'recording' && (
                  <div className="flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-danger-50 border border-danger-100">
                    <span className="w-2 h-2 rounded-full bg-danger-500 animate-pulse" />
                    <span className="text-[11px] font-medium text-danger-600">记录中</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-5 gap-2">
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => setShowStatsDrawer(!showStatsDrawer)}
                className={cn(
                  'w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95',
                  showStatsDrawer
                    ? 'bg-gradient-to-br from-twin-cyan to-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                <Filter className="w-5 h-5" />
              </button>
              <span className="text-[10px] text-gray-500 font-medium">统计</span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => setShowHistoryDrawer(true)}
                className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95 relative"
              >
                <History className="w-5 h-5" />
                {nearbyHazards.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
                    {nearbyHazards.length}
                  </span>
                )}
              </button>
              <span className="text-[10px] text-gray-500 font-medium">历史问题</span>
            </div>

            <div className="flex flex-col items-center gap-1.5 -mt-4">
              <button
                onClick={handleTrackButton}
                className={cn(
                  'w-16 h-16 rounded-[20px] flex items-center justify-center shadow-xl transition-all active:scale-95',
                  trackStatus === 'recording'
                    ? 'bg-gradient-to-br from-warning-500 to-warning-600 text-white shadow-warning-500/40'
                    : trackStatus === 'paused'
                    ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-primary-500/40'
                    : 'bg-gradient-to-br from-success-500 to-success-600 text-white shadow-success-500/40'
                )}
              >
                {trackButtonIcon}
              </button>
              <span className={cn(
                'text-[11px] font-semibold',
                trackStatus === 'recording'
                  ? 'text-warning-600'
                  : trackStatus === 'paused'
                  ? 'text-primary-600'
                  : 'text-success-600'
              )}>
                {trackButtonLabel}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <button
                onPointerDown={() => {
                  const offsetLat = centerLat + (Math.random() - 0.5) * 0.001;
                  const offsetLng = centerLng + (Math.random() - 0.5) * 0.001;
                  setLongPressPos({ lat: offsetLat, lng: offsetLng });
                  setShowAddPinModal(true);
                }}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-100 to-twin-cyan/10 text-primary-600 hover:from-primary-200 hover:to-twin-cyan/20 flex items-center justify-center transition-all active:scale-95 border border-primary-200/50"
              >
                <Plus className="w-5 h-5" />
              </button>
              <span className="text-[10px] text-gray-500 font-medium">打点</span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              {trackStatus !== 'idle' ? (
                <button
                  onClick={handleEndTrack}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-danger-500 to-danger-600 text-white shadow-lg shadow-danger-500/30 flex items-center justify-center transition-all active:scale-95"
                >
                  <Square className="w-4 h-4" fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={handleLocate}
                  className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95"
                >
                  <Navigation className="w-5 h-5" />
                </button>
              )}
              <span className="text-[10px] text-gray-500 font-medium">
                {trackStatus !== 'idle' ? '结束' : '定位'}
              </span>
            </div>
          </div>

          {trackStatus === 'idle' && (
            <div className="mt-3 flex items-center justify-center gap-2 pt-1">
              <p className="text-xs text-gray-400">长按地图空白处可快速添加设施标记点</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showAddPinModal}
        onClose={() => {
          setShowAddPinModal(false);
          setLongPressPos(null);
        }}
        title="添加设施标记点"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">设施类型</label>
            <div className="grid grid-cols-4 gap-2">
              {FACILITY_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setNewPinType(t.value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all',
                    newPinType === t.value
                      ? 'border-primary-400 bg-primary-50 text-primary-600'
                      : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'
                  )}
                >
                  <FacilityIcon type={t.value} size="sm" />
                  <span className="text-[10px] font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">设施名称</label>
            <input
              type="text"
              value={newPinName}
              onChange={(e) => setNewPinName(e.target.value)}
              placeholder="请输入设施名称"
              className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-100 focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
            />
          </div>

          {longPressPos && (
            <InfoRow
              label="标记位置"
              value={
                <span className="font-mono text-xs">
                  {longPressPos.lat.toFixed(6)}, {longPressPos.lng.toFixed(6)}
                </span>
              }
            />
          )}

          <Divider />

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="full"
              onClick={() => {
                setShowAddPinModal(false);
                setLongPressPos(null);
              }}
            >
              取消
            </Button>
            <Button
              variant="primary"
              size="full"
              onClick={handleConfirmAddPin}
              disabled={!newPinName.trim()}
            >
              确认添加
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
        title="附近1km历史隐患"
        className="!max-w-lg"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Tag label={`${nearbyHazards.length}条记录`} color="blue" />
            <Tag label="按距离排序" color="gray" />
          </div>

          {nearbyHazards.length === 0 ? (
            <EmptyState
              icon={<History className="w-10 h-10" />}
              title="附近暂无历史隐患"
              description="1km范围内没有隐患上报记录"
            />
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto -mx-2 px-2">
              {nearbyHazards.map((h) => {
                const levelConfig: Record<HazardReport['level'], { label: string; variant: 'danger' | 'warning' | 'success' }> = {
                  critical: { label: '紧急', variant: 'danger' },
                  normal: { label: '一般', variant: 'warning' },
                  minor: { label: '轻微', variant: 'success' },
                };
                const statusLabels: Record<HazardReport['status'], string> = {
                  submitted: '已提交',
                  dispatching: '派单中',
                  rectifying: '整改中',
                  rechecking: '待复查',
                  closed: '已闭环',
                };
                const config = levelConfig[h.level];
                return (
                  <Card
                    key={h.id}
                    hoverable
                    onClick={() => navigate(`/rectification`)}
                    className="!rounded-2xl"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="text-sm font-semibold text-gray-900 flex-1 leading-snug">
                          {h.title}
                        </h4>
                        <StatusBadge label={config.label} variant={config.variant} size="sm" />
                      </div>
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{h.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="font-medium text-primary-600">
                              {formatDistance(h.distance)}
                            </span>
                          </span>
                          <span>{relativeTime(h.createTime)}</span>
                        </div>
                        <Tag label={statusLabels[h.status]} color="gray" />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      <div
        className={cn(
          'absolute left-0 right-0 bottom-0 z-40 transition-transform duration-500 ease-out',
          showStatsDrawer ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="h-24" />
        <div className="bg-white/95 backdrop-blur-2xl rounded-t-[28px] shadow-2xl border-t border-white/60 max-h-[60vh] overflow-hidden">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-2" />

          <div className="px-5 pb-5 overflow-y-auto" style={{ maxHeight: 'calc(60vh - 32px)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">当前区域概况</h3>
              <button
                onClick={() => setShowStatsDrawer(false)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                { label: '设施总数', value: facilityStats.total, color: 'from-primary-500 to-blue-600', textColor: 'text-primary-600' },
                { label: '正常', value: facilityStats.normal, color: 'from-success-500 to-emerald-600', textColor: 'text-success-600' },
                { label: '预警', value: facilityStats.warning, color: 'from-warning-500 to-amber-600', textColor: 'text-warning-600' },
                { label: '异常', value: facilityStats.damaged + facilityStats.offline, color: 'from-danger-500 to-rose-600', textColor: 'text-danger-600' },
              ].map((stat) => (
                <Card key={stat.label} className="!rounded-2xl">
                  <div className="p-3 text-center">
                    <div className={cn(
                      'w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold shadow-md',
                      stat.color
                    )}>
                      {stat.value}
                    </div>
                    <p className={cn('text-xs font-medium', stat.textColor)}>{stat.label}</p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-primary-500 to-twin-cyan" />
                <h4 className="text-sm font-bold text-gray-800">最近巡检记录</h4>
              </div>
              {recentInspections.length === 0 ? (
                <EmptyState
                  icon={<Clock className="w-8 h-8" />}
                  title="暂无巡检记录"
                  className="!py-6"
                />
              ) : (
                <div className="space-y-2">
                  {recentInspections.map((f) => {
                    const colors = getStatusPinColor(f.status);
                    return (
                      <Card
                        key={f.id}
                        hoverable
                        onClick={() => {
                          setSelectedFacility(f);
                          setShowStatsDrawer(false);
                        }}
                        className="!rounded-xl"
                      >
                        <div className="p-3 flex items-center gap-3">
                          <FacilityIcon type={f.type} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-2">
                              <span>{f.lastInspector ?? '未知'}</span>
                              <span>·</span>
                              <span>{f.lastInspectTime ? relativeTime(f.lastInspectTime) : '-'}</span>
                            </p>
                          </div>
                          <div className={cn(
                            'w-2.5 h-2.5 rounded-full',
                            colors.bg
                          )} />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
