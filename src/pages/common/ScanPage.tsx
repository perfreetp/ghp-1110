import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Flashlight,
  Image,
  CheckCircle2,
  X,
  Lightbulb,
  Circle,
  Trash2,
  Armchair,
  Signpost,
  Flame,
  Box,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Modal, StatusBadge, Tag } from '@/components/ui';
import FacilityIcon, { HologramFrame, FacilityIcon3D } from '@/components/common/FacilityIcon';
import { useAppStore } from '@/store/useAppStore';
import { cn, getFacilityStatusConfig, getFacilityTypeName, formatDateTime } from '@/utils';
import type { Facility, FacilityType } from '@/types';

type ScanState = 'scanning' | 'success' | 'failed';

export default function ScanPage() {
  const navigate = useNavigate();
  const facilities = useAppStore((s) => s.facilities);
  const currentPosition = useAppStore((s) => s.currentPosition);

  const [flashlightOn, setFlashlightOn] = useState(false);
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [showResultModal, setShowResultModal] = useState(false);
  const [recognizedFacility, setRecognizedFacility] = useState<Facility | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  const randomFacility = useMemo(() => {
    return facilities[Math.floor(Math.random() * facilities.length)];
  }, [facilities]);

  useEffect(() => {
    if (scanState !== 'scanning') return;

    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 8;
      });
    }, 200);

    const scanTimer = setTimeout(() => {
      clearInterval(progressInterval);
      setScanProgress(100);
      setRecognizedFacility(randomFacility);
      setScanState('success');
      setTimeout(() => {
        setShowResultModal(true);
      }, 500);
    }, 2000);

    return () => {
      clearTimeout(scanTimer);
      clearInterval(progressInterval);
    };
  }, [scanState, randomFacility]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleViewDetail = () => {
    if (recognizedFacility) {
      setShowResultModal(false);
      navigate(`/facility/${recognizedFacility.id}`);
    }
  };

  const handleContinueScan = () => {
    setShowResultModal(false);
    setScanState('scanning');
    setScanProgress(0);
    setRecognizedFacility(null);
  };

  const handleOpenAlbum = () => {
    alert('打开相册选择二维码图片');
  };

  const handleToggleFlashlight = () => {
    setFlashlightOn(!flashlightOn);
  };

  const facilityTypes: { type: FacilityType; name: string }[] = [
    { type: 'lamp', name: '路灯' },
    { type: 'manhole', name: '井盖' },
    { type: 'bin', name: '垃圾箱' },
    { type: 'bench', name: '休闲座椅' },
    { type: 'sign', name: '交通标识' },
    { type: 'fire_hydrant', name: '消防栓' },
    { type: 'other', name: '其他设施' },
  ];

  const iconMap: Record<FacilityType, typeof Lightbulb> = {
    lamp: Lightbulb,
    manhole: Circle,
    bin: Trash2,
    bench: Armchair,
    sign: Signpost,
    fire_hydrant: Flame,
    other: Box,
  };

  return (
    <div className="fixed inset-0 bg-gray-950 z-50 overflow-hidden">
      <div className={cn(
        'absolute inset-0 transition-opacity duration-500',
        flashlightOn ? 'opacity-30 bg-white' : 'opacity-0'
      )} />

      <div className="relative h-full flex flex-col">
        <div className="flex items-center justify-between px-4 pt-safe pb-4 relative z-10">
          <button
            onClick={handleBack}
            className="w-11 h-11 rounded-full bg-white/10 backdrop-blur text-white hover:bg-white/20 flex items-center justify-center transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="text-white text-sm font-medium">
            扫码识别
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleFlashlight}
              className={cn(
                'w-11 h-11 rounded-full backdrop-blur flex items-center justify-center transition-all active:scale-95',
                flashlightOn
                  ? 'bg-amber-400 text-gray-900 shadow-lg shadow-amber-400/50'
                  : 'bg-white/10 text-white hover:bg-white/20'
              )}
            >
              <Flashlight className="w-5 h-5" />
            </button>
            <button
              onClick={handleOpenAlbum}
              className="w-11 h-11 rounded-full bg-white/10 backdrop-blur text-white hover:bg-white/20 flex items-center justify-center transition-all active:scale-95"
            >
              <Image className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 relative flex items-center justify-center px-8">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 via-transparent to-gray-900/50" />
          </div>

          <div className="relative w-full max-w-sm aspect-square">
            <div className="absolute -inset-16 bg-gradient-to-br from-twin-cyan/5 via-primary-500/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute -inset-8 bg-twin-cyan/5 rounded-full blur-2xl" />

            <div className="relative w-full h-full">
              <div className="absolute top-0 left-0 w-10 h-10 border-l-4 border-t-4 border-twin-cyan rounded-tl-2xl shadow-[0_0_20px_rgba(6,182,212,0.5)]" />
              <div className="absolute top-0 right-0 w-10 h-10 border-r-4 border-t-4 border-twin-cyan rounded-tr-2xl shadow-[0_0_20px_rgba(6,182,212,0.5)]" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-l-4 border-b-4 border-twin-cyan rounded-bl-2xl shadow-[0_0_20px_rgba(6,182,212,0.5)]" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-r-4 border-b-4 border-twin-cyan rounded-br-2xl shadow-[0_0_20px_rgba(6,182,212,0.5)]" />

              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-grid-pattern bg-[size:24px_24px] opacity-20" />
                {scanState === 'scanning' && (
                  <div
                    className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-twin-cyan to-transparent shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-scan"
                    style={{
                      top: `${scanProgress}%`,
                    }}
                  />
                )}
                {scanState === 'success' && (
                  <div className="absolute inset-0 flex items-center justify-center animate-fade-in">
                    <div className="relative">
                      <div className="absolute -inset-6 bg-success-500/20 rounded-full animate-ping" />
                      <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center shadow-2xl shadow-success-500/50">
                        <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute -bottom-12 left-0 right-0 text-center">
                {scanState === 'scanning' && (
                  <div>
                    <p className="text-white/90 text-sm font-medium mb-2">
                      将二维码对准框内
                    </p>
                    <div className="w-32 h-1 mx-auto bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-twin-cyan to-primary-400 transition-all duration-200"
                        style={{ width: `${Math.min(scanProgress, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {scanState === 'success' && (
                  <p className="text-success-400 text-sm font-medium animate-fade-in">
                    识别成功
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-safe pt-20 relative z-10">
          <div className="max-w-sm mx-auto">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
              <p className="text-white/60 text-xs text-center mb-3">
                支持以下所有设施的二维码识别
              </p>
              <div className="grid grid-cols-7 gap-2">
                {facilityTypes.map((item) => {
                  const Icon = iconMap[item.type];
                  return (
                    <div key={item.type} className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/15 hover:text-white transition-all">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-white/50">{item.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title="识别成功"
      >
        {recognizedFacility && (
          <div className="space-y-4">
            <HologramFrame className="p-4" scanning={recognizedFacility.status !== 'offline'}>
              <div className="flex flex-col items-center">
                <FacilityIcon3D type={recognizedFacility.type} />
                <h3 className="text-base font-bold text-gray-900 mt-3 mb-1">
                  {recognizedFacility.name}
                </h3>
                <div className="flex items-center gap-2">
                  <StatusBadge
                    label={getFacilityStatusConfig(recognizedFacility.status).label}
                    variant={
                      recognizedFacility.status === 'normal' ? 'success' :
                      recognizedFacility.status === 'warning' ? 'warning' :
                      recognizedFacility.status === 'damaged' ? 'danger' : 'default'
                    }
                    size="sm"
                    pulse={recognizedFacility.status !== 'offline'}
                  />
                  <Tag label={getFacilityTypeName(recognizedFacility.type)} color="blue" />
                </div>
              </div>
            </HologramFrame>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">设施编号</span>
                <span className="text-gray-800 font-mono font-medium">{recognizedFacility.code}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">管理责任人</span>
                <span className="text-gray-800 font-medium">{recognizedFacility.maintainer}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">安装日期</span>
                <span className="text-gray-800">{recognizedFacility.installDate}</span>
              </div>
              <div className="flex justify-between items-start text-sm">
                <span className="text-gray-500 shrink-0">所在位置</span>
                <span className="text-gray-800 text-right ml-4 max-w-[200px]">{recognizedFacility.location}</span>
              </div>
              {recognizedFacility.lastInspectTime && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">最近巡检</span>
                  <span className="text-gray-800">{formatDateTime(recognizedFacility.lastInspectTime)}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                size="full"
                leftIcon={<X className="w-4 h-4" />}
                onClick={handleContinueScan}
              >
                继续扫描
              </Button>
              <Button
                variant="primary"
                size="full"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleViewDetail}
              >
                查看详情
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
