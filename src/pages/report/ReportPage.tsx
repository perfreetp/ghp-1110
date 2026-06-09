import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Mic,
  MapPin,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  CloudOff,
  ChevronLeft,
  ChevronRight,
  X,
  ImagePlus,
  Scan,
  RefreshCw,
  Trash2,
  Eye,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { Card, StatusBadge, Tag, Modal, InfoRow, Divider, SearchBar } from '@/components/ui';
import FacilityIcon from '@/components/common/FacilityIcon';
import { useAppStore } from '@/store/useAppStore';
import { hazardTypes } from '@/data/mock';
import { generateId, formatDateTime, getHazardLevelConfig, cn } from '@/utils';
import type { HazardLevel, MediaFile, Facility } from '@/types';

const steps = [
  { id: 1, label: '基本信息' },
  { id: 2, label: '问题描述' },
  { id: 3, label: '多媒体' },
  { id: 4, label: '提交确认' },
];

const levelOptions: { value: HazardLevel; label: string; color: string; activeClass: string }[] = [
  {
    value: 'critical',
    label: '紧急',
    color: 'danger',
    activeClass: 'bg-danger-500 text-white border-danger-500 shadow-lg shadow-danger-500/30',
  },
  {
    value: 'normal',
    label: '一般',
    color: 'warning',
    activeClass: 'bg-warning-500 text-white border-warning-500 shadow-lg shadow-warning-500/30',
  },
  {
    value: 'minor',
    label: '轻微',
    color: 'success',
    activeClass: 'bg-success-500 text-white border-success-500 shadow-lg shadow-success-500/30',
  },
];

export default function ReportPage() {
  const navigate = useNavigate();
  const addHazardReport = useAppStore((s) => s.addHazardReport);
  const online = useAppStore((s) => s.online);
  const currentPosition = useAppStore((s) => s.currentPosition);
  const facilities = useAppStore((s) => s.facilities);
  const hazardReports = useAppStore((s) => s.hazardReports);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<HazardLevel>('normal');
  const [title, setTitle] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [facilitySearchOpen, setFacilitySearchOpen] = useState(false);
  const [facilitySearchKeyword, setFacilitySearchKeyword] = useState('');

  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('高新区科技大道东段附近');
  const [lat, setLat] = useState(currentPosition?.lat || 34.2258);
  const [lng, setLng] = useState(currentPosition?.lng || 108.9541);

  const [images, setImages] = useState<{ id: string; url: string }[]>([]);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(20).fill(0));
  const audioTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveformTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const duplicateHazards = hazardReports
    .filter((h: import('@/types').HazardReport) => {
      const dx = Math.abs(h.lat - lat);
      const dy = Math.abs(h.lng - lng);
      return dx < 0.001 && dy < 0.001 && h.status !== 'closed';
    })
    .slice(0, 3)
    .map((h: import('@/types').HazardReport) => {
      const typeMatch =
        selectedTypes.length > 0 &&
        (selectedTypes.includes(h.type) || h.type.includes(selectedTypes[0] || ''));
      const dist = Math.sqrt(Math.pow(h.lat - lat, 2) + Math.pow(h.lng - lng, 2));
      const similarity = Math.max(
        0,
        Math.round(
          (typeMatch ? 60 : 30) + (1 - Math.min(dist * 10000, 1)) * 40
        )
      );
      return { ...h, similarity };
    });

  useEffect(() => {
    if (isRecording) {
      audioTimerRef.current = setInterval(() => {
        setAudioDuration((prev) => prev + 1);
      }, 1000);
      waveformTimerRef.current = setInterval(() => {
        setWaveformBars((prev) =>
          prev.map(() => Math.random() * 80 + 20)
        );
      }, 100);
    } else {
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);
      if (waveformTimerRef.current) clearInterval(waveformTimerRef.current);
    }
    return () => {
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);
      if (waveformTimerRef.current) clearInterval(waveformTimerRef.current);
    };
  }, [isRecording]);

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleAddImage = () => {
    if (images.length >= 9) return;
    const newImage = {
      id: generateId('img'),
      url: `https://picsum.photos/seed/${Date.now()}/400/300`,
    };
    setImages((prev) => [...prev, newImage]);
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleVideoUpload = () => {
    setVideoDuration(Math.floor(Math.random() * 30) + 5);
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setAudioDuration(0);
      setWaveformBars(Array(20).fill(0));
      setIsRecording(true);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const refreshLocation = () => {
    const newLat = (currentPosition?.lat || lat) + (Math.random() - 0.5) * 0.0002;
    const newLng = (currentPosition?.lng || lng) + (Math.random() - 0.5) * 0.0002;
    setLat(Number(newLat.toFixed(6)));
    setLng(Number(newLng.toFixed(6)));
  };

  const filteredFacilities = facilities.filter(
    (f) =>
      !facilitySearchKeyword ||
      f.name.includes(facilitySearchKeyword) ||
      f.code.includes(facilitySearchKeyword) ||
      f.location.includes(facilitySearchKeyword)
  );

  const canProceedStep1 =
    selectedTypes.length > 0 && title.trim().length > 0;
  const canProceedStep2 = description.trim().length >= 10;
  const canProceedStep3 = true;
  const canSubmit = true;

  const getStepValid = () => {
    switch (currentStep) {
      case 1:
        return canProceedStep1;
      case 2:
        return canProceedStep2;
      case 3:
        return canProceedStep3;
      case 4:
        return canSubmit;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4 && getStepValid()) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const mediaFiles: MediaFile[] = [
      ...images.map<MediaFile>((img) => ({
        id: img.id,
        type: 'image',
        url: img.url,
        uploadTime: new Date().toISOString(),
      })),
      ...(videoDuration
        ? [
            {
              id: generateId('vid'),
              type: 'video' as const,
              url: '',
              duration: videoDuration,
              uploadTime: new Date().toISOString(),
            } as MediaFile,
          ]
        : []),
      ...(audioDuration > 0
        ? [
            {
              id: generateId('aud'),
              type: 'audio' as const,
              url: '',
              duration: audioDuration,
              uploadTime: new Date().toISOString(),
            } as MediaFile,
          ]
        : []),
    ];

    addHazardReport({
      title: title.trim(),
      description: description.trim(),
      level: selectedLevel,
      type: selectedTypes.join('、') || '其他',
      lat,
      lng,
      address,
      facilityId: selectedFacility?.id,
      mediaFiles,
      savedOffline: !online,
    });

    setIsSubmitting(false);
    setShowSuccessModal(true);
  };

  const handleGoHome = () => {
    setShowSuccessModal(false);
    navigate('/');
  };

  const handleContinue = () => {
    setShowSuccessModal(false);
    setCurrentStep(1);
    setSelectedTypes([]);
    setSelectedLevel('normal');
    setTitle('');
    setSelectedFacility(null);
    setDescription('');
    setImages([]);
    setVideoDuration(null);
    setIsRecording(false);
    setAudioDuration(0);
    setWaveformBars(Array(20).fill(0));
  };

  const levelConfig = getHazardLevelConfig(selectedLevel);
  const mediaCount =
    images.length + (videoDuration ? 1 : 0) + (audioDuration > 0 ? 1 : 0);

  const renderStepIndicator = () => (
    <div className="bg-white px-4 py-4 border-b border-gray-100">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                  currentStep > step.id
                    ? 'bg-success-500 text-white shadow-md shadow-success-500/30'
                    : currentStep === step.id
                    ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30 ring-4 ring-primary-100'
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                {currentStep > step.id ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  step.id
                )}
              </div>
              <span
                className={cn(
                  'text-[11px] mt-1.5 whitespace-nowrap font-medium',
                  currentStep >= step.id ? 'text-primary-600' : 'text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-1 mx-1 mb-4">
                <div
                  className={cn(
                    'h-1 rounded-full transition-all duration-300',
                    currentStep > step.id
                      ? 'bg-gradient-to-r from-success-500 to-success-400'
                      : 'bg-gray-100'
                  )}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-5 animate-slide-up">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-gradient-to-b from-primary-500 to-primary-400 rounded-full" />
          <h3 className="text-base font-semibold text-gray-900">问题类型</h3>
          <span className="text-xs text-danger-500 ml-1">* 可多选</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {hazardTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => toggleType(t.value)}
              className={cn(
                'px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 border',
                selectedTypes.includes(t.value)
                  ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/25 active:scale-95'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300 active:scale-95'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-gradient-to-b from-warning-500 to-warning-400 rounded-full" />
          <h3 className="text-base font-semibold text-gray-900">严重程度</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {levelOptions.map((opt) => {
            const isActive = selectedLevel === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSelectedLevel(opt.value)}
                className={cn(
                  'py-3 rounded-2xl text-sm font-semibold border-2 transition-all duration-200 flex flex-col items-center gap-1',
                  isActive
                    ? opt.activeClass
                    : opt.color === 'danger'
                    ? 'bg-white text-danger-500 border-danger-100 hover:bg-danger-50'
                    : opt.color === 'warning'
                    ? 'bg-white text-warning-500 border-warning-100 hover:bg-warning-50'
                    : 'bg-white text-success-500 border-success-100 hover:bg-success-50',
                  'active:scale-95'
                )}
              >
                <AlertTriangle
                  className={cn('w-5 h-5 mb-0.5', isActive ? 'text-white' : '')}
                />
                {opt.label}
                <span
                  className={cn(
                    'text-[10px] opacity-75',
                    isActive ? 'text-white/90' : ''
                  )}
                >
                  {opt.value === 'critical'
                    ? '立即处理'
                    : opt.value === 'normal'
                    ? '24h内'
                    : '48h内'}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-blue-400 rounded-full" />
          <h3 className="text-base font-semibold text-gray-900">问题标题</h3>
          <span className="text-xs text-danger-500 ml-1">*</span>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="请简要描述问题，如：井盖破损、路灯不亮..."
          maxLength={50}
          className="w-full h-12 px-4 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition-all placeholder:text-gray-400"
        />
        <div className="flex justify-between mt-2">
          <span
            className={cn(
              'text-xs',
              title.trim().length > 0 && !canProceedStep1
                ? 'text-danger-500'
                : 'text-gray-400'
            )}
          >
            {title.trim().length > 0 && !canProceedStep1
              ? '标题不能为空或纯空格'
              : '清晰的标题便于快速处理'}
          </span>
          <span className="text-xs text-gray-400">{title.length}/50</span>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-gradient-to-b from-twin-cyan to-blue-400 rounded-full" />
          <h3 className="text-base font-semibold text-gray-900">关联设施</h3>
          <span className="text-xs text-gray-400 ml-1">选填，扫码快速定位</span>
        </div>

        {selectedFacility ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary-50 to-twin-cyan/5 border border-primary-100">
            <FacilityIcon type={selectedFacility.type} size="md" glow />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">
                {selectedFacility.name}
              </div>
              <div className="text-xs text-gray-500 truncate mt-0.5">
                {selectedFacility.code} · {selectedFacility.location}
              </div>
            </div>
            <button
              onClick={() => setSelectedFacility(null)}
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-danger-500 flex items-center justify-center transition-colors shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFacilitySearchOpen(true)}
              className="flex flex-col items-center justify-center py-5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 hover:border-primary-300 transition-all active:scale-[0.98] gap-2"
            >
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-700">选择设施</span>
              <span className="text-[10px] text-gray-400">附近设施列表</span>
            </button>
            <button className="flex flex-col items-center justify-center py-5 rounded-xl bg-gradient-to-br from-primary-500/5 to-twin-cyan/10 hover:from-primary-500/10 hover:to-twin-cyan/20 border border-dashed border-primary-200 hover:border-twin-cyan/50 transition-all active:scale-[0.98] gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-twin-cyan text-white flex items-center justify-center shadow-md shadow-primary-500/25">
                <Scan className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-primary-700">扫码识别</span>
              <span className="text-[10px] text-primary-500/70">扫描设施二维码</span>
            </button>
          </div>
        )}
      </Card>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5 animate-slide-up">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-purple-400 rounded-full" />
          <h3 className="text-base font-semibold text-gray-900">问题描述</h3>
          <span className="text-xs text-danger-500 ml-1">* 至少10字</span>
        </div>
        <div className="relative">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            placeholder="请详细描述问题的具体情况，包括位置、状态、可能原因等信息，有助于快速派单和处理..."
            rows={6}
            className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition-all placeholder:text-gray-400 resize-none"
          />
          <div className="absolute right-3 bottom-3">
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-md',
                description.length >= 500
                  ? 'bg-danger-100 text-danger-600'
                  : description.length >= 400
                  ? 'bg-warning-100 text-warning-600'
                  : 'bg-gray-100 text-gray-500'
              )}
            >
              {description.length}/500
            </span>
          </div>
        </div>
        <div className="mt-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
            <div className="text-xs text-gray-600 leading-relaxed">
              <span className="font-medium text-gray-700">提示：</span>
              描述越详细，处理效率越高。建议包含：问题部位、损坏程度、发现时间、是否有人员受伤等。
            </div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {['井盖破损严重，有坠落风险', '路灯整夜不亮，影响通行', '垃圾堆积超过2小时', '占道经营阻塞人行道'].map(
            (tpl) => (
              <button
                key={tpl}
                onClick={() => setDescription((prev) => (prev ? prev + ' ' + tpl : tpl))}
                className="px-2.5 py-1 rounded-full bg-gray-100 hover:bg-primary-100 text-xs text-gray-600 hover:text-primary-700 transition-colors"
              >
                + {tpl.slice(0, 10)}...
              </button>
            )
          )}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-green-500 to-green-400 rounded-full" />
            <h3 className="text-base font-semibold text-gray-900">位置信息</h3>
            <StatusBadge label="自动获取" variant="success" size="sm" pulse />
          </div>
          <button
            onClick={refreshLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-600 text-xs font-medium transition-colors active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            微调
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden border border-gray-100 mb-4">
          <div className="relative h-40 bg-gradient-to-br from-green-50 via-blue-50 to-cyan-50">
            <div className="absolute inset-0 bg-grid-pattern bg-[size:20px_20px] opacity-40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-danger-400/20 animate-ping" />
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-danger-500 to-danger-600 flex items-center justify-center shadow-lg shadow-danger-500/40">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-white/90 backdrop-blur text-[10px] text-gray-600 font-mono shadow-sm">
              精度 ±5m
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="py-2.5">
            <label className="text-sm text-gray-500 block mb-2">详细地址</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full h-11 px-4 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition-all placeholder:text-gray-400 text-right"
            />
          </div>
          <Divider />
          <InfoRow
            label="经纬度"
            value={
              <span className="font-mono text-xs text-gray-600">
                {lat.toFixed(6)}, {lng.toFixed(6)}
              </span>
            }
          />
          <InfoRow label="定位时间" value={formatDateTime(new Date())} />
        </div>
      </Card>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5 animate-slide-up">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-rose-500 to-rose-400 rounded-full" />
            <h3 className="text-base font-semibold text-gray-900">现场图片</h3>
            <span className="text-xs text-gray-400">最多9张</span>
          </div>
          <StatusBadge label={`${images.length}/9`} variant="info" size="sm" />
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative aspect-square rounded-xl overflow-hidden group bg-gray-100"
            >
              <img
                src={img.url}
                alt=""
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <button
                onClick={() => setPreviewImage(img.url)}
                className="absolute top-1.5 right-8 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleRemoveImage(img.id)}
                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-danger-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-danger-600 hover:scale-110 shadow-md"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {images.length < 9 && (
            <button
              onClick={handleAddImage}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-primary-400 bg-gray-50 hover:bg-primary-50/50 flex flex-col items-center justify-center transition-all active:scale-[0.97] gap-1.5 group"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                <ImagePlus className="w-5 h-5 text-gray-400 group-hover:text-primary-500" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-primary-600 font-medium">
                添加图片
              </span>
            </button>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-gradient-to-b from-indigo-500 to-indigo-400 rounded-full" />
          <h3 className="text-base font-semibold text-gray-900">现场录像</h3>
        </div>

        {videoDuration ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/30 relative overflow-hidden">
              <Video className="w-7 h-7 text-white relative z-10" />
              <div className="absolute inset-0 bg-grid-pattern opacity-20" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">
                视频_{Date.now().toString().slice(-6)}.mp4
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                时长 {formatDuration(videoDuration)} · {(videoDuration * 0.8).toFixed(1)} MB
              </div>
            </div>
            <button
              onClick={() => setVideoDuration(null)}
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-danger-500 flex items-center justify-center transition-colors shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleVideoUpload}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-indigo-50/50 border-2 border-dashed border-gray-200 hover:border-indigo-300 transition-all active:scale-[0.99] group"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:shadow-lg group-hover:shadow-indigo-500/35 transition-shadow">
              <Video className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700">
                拍摄或上传视频
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                建议时长不超过60秒，MP4格式
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
          </button>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-gradient-to-b from-cyan-500 to-cyan-400 rounded-full" />
          <h3 className="text-base font-semibold text-gray-900">语音备注</h3>
          {isRecording && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-danger-100 text-danger-600 text-xs font-medium animate-pulse">
              <span className="w-2 h-2 rounded-full bg-danger-500 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-danger-500 -ml-2" />
              录音中
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="h-20 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-100 flex items-end justify-center gap-1 px-6 py-3 overflow-hidden">
            {waveformBars.map((h, i) => (
              <div
                key={i}
                className={cn(
                  'w-1.5 rounded-full transition-all duration-100',
                  isRecording ? 'bg-gradient-to-t from-danger-500 to-danger-400' : 'bg-gray-300'
                )}
                style={{ height: isRecording ? `${h}%` : `${15 + Math.sin(i * 0.5) * 10}%` }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              时长：
              <span className="font-mono text-base font-semibold text-gray-900 ml-1">
                {formatDuration(audioDuration)}
              </span>
            </div>

            <button
              onClick={toggleRecording}
              className={cn(
                'relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300',
                isRecording
                  ? 'bg-danger-500 shadow-lg shadow-danger-500/40 scale-105'
                  : 'bg-gradient-to-br from-cyan-500 to-primary-600 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:scale-105'
              )}
            >
              {isRecording && (
                <>
                  <div className="absolute -inset-1 rounded-full bg-danger-400/30 animate-ping" />
                  <div className="absolute -inset-2 rounded-full bg-danger-400/15 animate-pulse" />
                </>
              )}
              <Mic
                className={cn(
                  'w-7 h-7 relative z-10 transition-transform',
                  isRecording ? 'text-white scale-110' : 'text-white'
                )}
              />
            </button>

            <button
              onClick={() => {
                setIsRecording(false);
                setAudioDuration(0);
                setWaveformBars(Array(20).fill(0));
              }}
              disabled={!isRecording && audioDuration === 0}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gray-100 hover:bg-gray-200 text-gray-600 active:scale-95"
            >
              清除
            </button>
          </div>
        </div>
      </Card>

      {mediaCount > 0 && (
        <Card className="p-4 bg-gradient-to-r from-primary-50/50 to-twin-cyan/5 border-primary-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-gray-700">
                已添加 <span className="text-primary-600 font-semibold">{mediaCount}</span> 个媒体文件
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {images.length > 0 && <span>图片 {images.length}</span>}
              {videoDuration && <span>视频 1</span>}
              {audioDuration > 0 && <span>音频 1</span>}
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-5 animate-slide-up">
      {!online && (
        <Card className="p-4 bg-gradient-to-r from-warning-50 to-orange-50 border-warning-200">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-warning-100 flex items-center justify-center shrink-0">
              <CloudOff className="w-5 h-5 text-warning-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-warning-800">当前离线模式</div>
              <div className="text-xs text-warning-600/80 mt-0.5">
                将暂存本地，联网后自动同步。您可以继续正常使用所有功能。
              </div>
            </div>
            <StatusBadge label="离线" variant="warning" size="sm" pulse />
          </div>
        </Card>
      )}

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-primary-500 to-primary-400 rounded-full" />
            <h3 className="text-base font-semibold text-gray-900">信息汇总</h3>
          </div>
          <Tag label={`步骤 ${currentStep}/4`} color="blue" />
        </div>

        <div className="space-y-1">
          <InfoRow label="上报时间" value={formatDateTime(new Date())} highlight />
          <Divider />
          <InfoRow
            label="问题类型"
            value={
              <div className="flex flex-wrap gap-1 justify-end max-w-[70%]">
                {selectedTypes.length > 0 ? (
                  selectedTypes.map((t) => (
                    <Tag key={t} label={t} color="purple" />
                  ))
                ) : (
                  <span className="text-gray-400">未选择</span>
                )}
              </div>
            }
          />
          <Divider />
          <InfoRow
            label="严重程度"
            value={
              <StatusBadge
                label={levelConfig.label}
                variant={
                  selectedLevel === 'critical'
                    ? 'danger'
                    : selectedLevel === 'normal'
                    ? 'warning'
                    : 'success'
                }
                size="md"
                pulse={selectedLevel === 'critical'}
              />
            }
          />
          <Divider />
          <InfoRow label="问题标题" value={<span className="font-semibold">{title || '-'}</span>} />
          <Divider />
          <InfoRow
            label="关联设施"
            value={
              selectedFacility ? (
                <div className="flex items-center gap-2 justify-end">
                  <FacilityIcon type={selectedFacility.type} size="sm" />
                  <span className="text-sm font-medium text-gray-800">
                    {selectedFacility.name}
                  </span>
                </div>
              ) : (
                <span className="text-gray-400">无</span>
              )
            }
          />
          <Divider />
          <InfoRow
            label="详细描述"
            value={
              <p className="text-sm text-gray-700 text-right max-w-[70%] leading-relaxed">
                {description || '-'}
              </p>
            }
          />
          <Divider />
          <InfoRow
            label="位置信息"
            value={
              <div className="text-right max-w-[70%]">
                <div className="text-sm font-medium text-gray-800">{address}</div>
                <div className="text-xs text-gray-400 font-mono mt-0.5">
                  {lat.toFixed(6)}, {lng.toFixed(6)}
                </div>
              </div>
            }
          />
          <Divider />
          <InfoRow
            label="媒体文件"
            value={
              mediaCount > 0 ? (
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-sm font-semibold text-primary-600">{mediaCount} 个</span>
                  <div className="flex -space-x-1">
                    {images.slice(0, 3).map((img) => (
                      <img
                        key={img.id}
                        src={img.url}
                        alt=""
                        className="w-7 h-7 rounded-lg border-2 border-white object-cover shadow-sm"
                      />
                    ))}
                    {videoDuration && (
                      <div className="w-7 h-7 rounded-lg border-2 border-white bg-indigo-500 flex items-center justify-center shadow-sm">
                        <Video className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    {audioDuration > 0 && (
                      <div className="w-7 h-7 rounded-lg border-2 border-white bg-cyan-500 flex items-center justify-center shadow-sm">
                        <Mic className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-gray-400">无</span>
              )
            }
          />
        </div>
      </Card>

      {duplicateHazards.length > 0 && (
        <Card className="p-5 border-warning-200 bg-gradient-to-br from-warning-50/80 to-orange-50/50 overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-warning-400/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-warning-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">疑似重复隐患</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  基于位置匹配到 {duplicateHazards.length} 条附近历史隐患，请确认是否重复上报
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {duplicateHazards.map((h: import('@/types').HazardReport & { similarity: number }) => (
                <div
                  key={h.id}
                  className="p-3.5 rounded-xl bg-white/80 backdrop-blur border border-warning-100 hover:border-warning-300 cursor-pointer transition-all active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {h.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatDateTime(h.createTime)}</span>
                        <span>·</span>
                        <span>{h.type}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold',
                          h.similarity >= 80
                            ? 'bg-danger-100 text-danger-700'
                            : h.similarity >= 60
                            ? 'bg-warning-100 text-warning-700'
                            : 'bg-primary-100 text-primary-700'
                        )}
                      >
                        {h.similarity}%
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">相似度</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-4 w-full py-2.5 rounded-xl bg-white/60 hover:bg-white border border-warning-200 text-xs font-medium text-warning-700 transition-colors flex items-center justify-center gap-1.5">
              仍然是新问题，继续提交
            </button>
          </div>
        </Card>
      )}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <PageHeader
        title="隐患上报"
        subtitle="发现问题 及时上报"
        showBack
        backTo="/"
      />

      {renderStepIndicator()}

      <div className="flex-1 px-4 py-4 pb-32 overflow-y-auto">
        {renderStepContent()}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-lg border-t border-gray-100 px-4 py-4 safe-bottom">
        <div className="max-w-md mx-auto flex items-center gap-3">
          {currentStep > 1 ? (
            <Button
              variant="outline"
              size="md"
              leftIcon={<ChevronLeft className="w-4 h-4" />}
              onClick={handlePrev}
              className="flex-1"
            >
              上一步
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="md"
              onClick={() => navigate(-1)}
              className="flex-1"
            >
              取消
            </Button>
          )}

          {currentStep < 4 ? (
            <Button
              variant="twin"
              size="md"
              onClick={handleNext}
              disabled={!getStepValid()}
              rightIcon={<ChevronRight className="w-4 h-4" />}
              className="flex-[2]"
            >
              下一步
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              loading={isSubmitting}
              leftIcon={
                !isSubmitting && <CheckCircle className="w-4 h-4" />
              }
              className="flex-[2]"
            >
              {isSubmitting ? '提交中...' : online ? '确认提交' : '暂存并提交'}
            </Button>
          )}
        </div>
      </div>

      <Modal isOpen={facilitySearchOpen} onClose={() => setFacilitySearchOpen(false)} title="选择关联设施">
        <div className="space-y-4 -mx-2">
          <SearchBar
            value={facilitySearchKeyword}
            onChange={setFacilitySearchKeyword}
            placeholder="搜索设施名称、编号或位置"
          />
          <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
            {filteredFacilities.length > 0 ? (
              filteredFacilities.map((f: Facility) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setSelectedFacility(f);
                    setFacilitySearchOpen(false);
                    setFacilitySearchKeyword('');
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left',
                    selectedFacility?.id === f.id
                      ? 'bg-primary-50 border-2 border-primary-300'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  )}
                >
                  <FacilityIcon type={f.type} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {f.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {f.code} · {f.location}
                    </div>
                  </div>
                  {selectedFacility?.id === f.id && (
                    <CheckCircle className="w-5 h-5 text-primary-500 shrink-0" />
                  )}
                </button>
              ))
            ) : (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                  <MapPin className="w-8 h-8" />
                </div>
                <p className="text-sm text-gray-500">未找到匹配的设施</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        className="!bg-transparent !shadow-none !max-w-full"
      >
        {previewImage && (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={previewImage}
              alt=""
              className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showSuccessModal}
        onClose={() => {}}
        className="!overflow-visible"
      >
        <div className="py-8 text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-success-100 animate-ping opacity-30" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-success-400 to-success-600 shadow-2xl shadow-success-500/40 flex items-center justify-center">
              <svg
                className="w-14 h-14 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline
                  points="20 6 9 17 4 12"
                  style={{
                    strokeDasharray: 100,
                    strokeDashoffset: 100,
                    animation: 'drawCheck 0.6s ease-out 0.3s forwards',
                  }}
                />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">上报成功</h2>
          <p className="text-sm text-gray-500 mb-2">
            {online
              ? '您的隐患报告已提交，指挥中心将尽快派单处理'
              : '当前离线，报告已暂存本地，联网后自动同步'}
          </p>
          <StatusBadge
            label={online ? '已提交' : '待同步'}
            variant={online ? 'success' : 'warning'}
            size="md"
            pulse
            className="mx-auto mt-1"
          />

          <div className="mt-8 grid grid-cols-2 gap-3">
            <Button variant="outline" size="lg" onClick={handleGoHome}>
              返回首页
            </Button>
            <Button variant="twin" size="lg" onClick={handleContinue}>
              继续上报
            </Button>
          </div>
        </div>
      </Modal>

      <style>{`
        @keyframes drawCheck {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
