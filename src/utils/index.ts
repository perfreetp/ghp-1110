import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { FacilityStatus, HazardLevel, TaskPriority, TaskStatus, RectificationStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatTime(date: string | Date): string {
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function relativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return formatDate(d);
}

export function timeRemaining(deadline: string | Date): { expired: boolean; text: string } {
  const now = new Date();
  const d = new Date(deadline);
  const diff = d.getTime() - now.getTime();

  if (diff <= 0) return { expired: true, text: '已超期' };

  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;

  if (days > 0) return { expired: false, text: `剩余${days}天${remainHours}小时` };
  if (hours > 0) return { expired: false, text: `剩余${hours}小时` };
  const minutes = Math.floor(diff / 60000);
  return { expired: false, text: `剩余${minutes}分钟` };
}

export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getPriorityConfig(priority: TaskPriority) {
  const configs: Record<TaskPriority, { label: string; color: string; bg: string; border: string; dot: string }> = {
    high: { label: '紧急', color: 'text-danger-600', bg: 'bg-danger-50', border: 'border-danger-200', dot: 'bg-danger-500' },
    medium: { label: '一般', color: 'text-warning-600', bg: 'bg-warning-50', border: 'border-warning-200', dot: 'bg-warning-500' },
    low: { label: '普通', color: 'text-success-600', bg: 'bg-success-50', border: 'border-success-200', dot: 'bg-success-500' },
  };
  return configs[priority];
}

export function getStatusConfig(status: TaskStatus) {
  const configs: Record<TaskStatus, { label: string; color: string; bg: string }> = {
    pending: { label: '待执行', color: 'text-primary-600', bg: 'bg-primary-50' },
    in_progress: { label: '进行中', color: 'text-success-600', bg: 'bg-success-50' },
    completed: { label: '已完成', color: 'text-gray-600', bg: 'bg-gray-100' },
    expired: { label: '已超期', color: 'text-danger-600', bg: 'bg-danger-50' },
  };
  return configs[status];
}

export function getFacilityStatusConfig(status: FacilityStatus) {
  const configs: Record<FacilityStatus, { label: string; color: string; bg: string; icon: string }> = {
    normal: { label: '正常', color: 'text-success-600', bg: 'bg-success-50', icon: 'check-circle' },
    warning: { label: '预警', color: 'text-warning-600', bg: 'bg-warning-50', icon: 'alert-triangle' },
    damaged: { label: '损坏', color: 'text-danger-600', bg: 'bg-danger-50', icon: 'x-circle' },
    offline: { label: '离线', color: 'text-gray-500', bg: 'bg-gray-100', icon: 'wifi-off' },
  };
  return configs[status];
}

export function getHazardLevelConfig(level: HazardLevel) {
  const configs: Record<HazardLevel, { label: string; color: string; bg: string; border: string; weight: number }> = {
    critical: { label: '紧急', color: 'text-danger-600', bg: 'bg-danger-50', border: 'border-danger-300', weight: 3 },
    normal: { label: '一般', color: 'text-warning-600', bg: 'bg-warning-50', border: 'border-warning-300', weight: 2 },
    minor: { label: '轻微', color: 'text-success-600', bg: 'bg-success-50', border: 'border-success-300', weight: 1 },
  };
  return configs[level];
}

export function getRectificationStatusConfig(status: RectificationStatus) {
  const configs: Record<RectificationStatus, { label: string; color: string; bg: string; step: number }> = {
    pending: { label: '待派单', color: 'text-gray-600', bg: 'bg-gray-100', step: 1 },
    processing: { label: '整改中', color: 'text-primary-600', bg: 'bg-primary-50', step: 2 },
    completed: { label: '待复查', color: 'text-warning-600', bg: 'bg-warning-50', step: 3 },
    overdue: { label: '已超期', color: 'text-danger-600', bg: 'bg-danger-50', step: 2 },
    recheck_failed: { label: '复查不通过', color: 'text-danger-600', bg: 'bg-danger-50', step: 2 },
    closed: { label: '已闭环', color: 'text-success-600', bg: 'bg-success-50', step: 4 },
  };
  return configs[status];
}

export function getFacilityTypeName(type: string): string {
  const names: Record<string, string> = {
    lamp: '路灯',
    manhole: '井盖',
    bin: '垃圾箱',
    bench: '休闲座椅',
    sign: '交通标识',
    fire_hydrant: '消防栓',
    other: '其他设施',
  };
  return names[type] || '其他设施';
}

export function getTaskTypeName(type: string): string {
  const names: Record<string, string> = {
    routine: '日常巡查',
    special: '专项检查',
    emergency: '应急任务',
  };
  return names[type] || '其他任务';
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (this: unknown, ...args: unknown[]) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  } as T;
}

export function throttle<T extends (...args: unknown[]) => unknown>(fn: T, limit: number): T {
  let inThrottle = false;
  return function (this: unknown, ...args: unknown[]) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  } as T;
}

export function calculateTrackDistance(points: { lat: number; lng: number }[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
  }
  return total;
}
