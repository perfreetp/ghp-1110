export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'inspector' | 'admin';
  avatar: string;
  department: string;
  employeeNo: string;
}

export type TaskStatus = 'pending' | 'navigating' | 'arrived' | 'inspecting' | 'in_progress' | 'completed' | 'expired';
export type TaskType = 'routine' | 'special' | 'emergency';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TimelineStepType = 'navigation_start' | 'check_in' | 'facility_inspect' | 'hazard_report' | 'task_complete';

export interface TaskTimelineStep {
  id: string;
  type: TimelineStepType;
  time: string;
  result?: 'success' | 'warning' | 'failed';
  relatedId?: string;
  relatedName?: string;
  note?: string;
  lat?: number;
  lng?: number;
}

export interface FacilityInspection {
  id: string;
  facilityId: string;
  taskId?: string;
  inspector: string;
  inspectTime: string;
  status: FacilityStatus;
  note?: string;
  photos?: MediaFile[];
  lat?: number;
  lng?: number;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  type: TaskType;
  priority: TaskPriority;
  location: string;
  address: string;
  lat: number;
  lng: number;
  planTime: string;
  status: TaskStatus;
  facilityIds: string[];
  distance?: number;
  description?: string;
  checkInTime?: string;
  completeTime?: string;
  navigationStartTime?: string;
  arriveTime?: string;
  inspectionIds?: string[];
  relatedHazardIds?: string[];
  timeline?: TaskTimelineStep[];
}

export interface CheckIn {
  id: string;
  taskId: string;
  checkinTime: string;
  lat: number;
  lng: number;
  photo?: string;
  accuracy?: number;
}

export type FacilityType = 'lamp' | 'manhole' | 'bin' | 'bench' | 'sign' | 'fire_hydrant' | 'other';
export type FacilityStatus = 'normal' | 'warning' | 'damaged' | 'offline';

export interface Facility {
  id: string;
  name: string;
  code: string;
  type: FacilityType;
  status: FacilityStatus;
  location: string;
  lat: number;
  lng: number;
  installDate: string;
  lastMaintain: string;
  twinData: TwinFacilityData;
  qrCode: string;
  maintainer: string;
  maintainerPhone: string;
  inspectionCount: number;
  lastInspector?: string;
  lastInspectTime?: string;
  sitePhotos?: MediaFile[];
  siteNote?: string;
  siteStatus?: FacilityStatus;
  siteCollectTime?: string;
  siteCollector?: string;
}

export interface TwinFacilityData {
  modelVersion: string;
  material: string;
  manufacturer: string;
  expectedLifespan: string;
  specs: Record<string, string>;
  lastSyncTime: string;
  syncedFromAdmin: boolean;
  conditionScore: number;
}

export type HazardLevel = 'critical' | 'normal' | 'minor';
export type HazardStatus = 'submitted' | 'dispatching' | 'rectifying' | 'rechecking' | 'closed';
export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface HazardReport {
  id: string;
  userId: string;
  facilityId?: string;
  title: string;
  description: string;
  level: HazardLevel;
  type: string;
  lat: number;
  lng: number;
  address: string;
  status: HazardStatus;
  createTime: string;
  mediaFiles: MediaFile[];
  isDuplicate?: boolean;
  duplicateOf?: string;
  savedOffline: boolean;
  taskId?: string;
  handlerName?: string;
  syncStatus?: SyncStatus;
  syncError?: string;
  syncTime?: string;
}

export type MediaType = 'image' | 'video' | 'audio';

export interface MediaFile {
  id: string;
  type: MediaType;
  url: string;
  thumbUrl?: string;
  duration?: number;
  uploadTime: string;
  name?: string;
}

export type RectificationStatus = 'pending' | 'processing' | 'completed' | 'overdue' | 'recheck_failed' | 'closed';
export type RectificationAction = 'dispatch' | 'accept' | 'process' | 'complete' | 'urge' | 'recheck_pass' | 'recheck_fail' | 're_dispatch';

export interface RectificationOrder {
  id: string;
  hazardId: string;
  hazardTitle: string;
  hazardLevel: HazardLevel;
  handler: string;
  handlerPhone: string;
  department: string;
  status: RectificationStatus;
  deadline: string;
  createTime: string;
  dispatchTime?: string;
  finishTime?: string;
  recheckTime?: string;
  logs: RectificationLog[];
  urgeCount: number;
  beforePhotos: string[];
  afterPhotos?: string[];
}

export interface RectificationLog {
  id: string;
  orderId: string;
  action: RectificationAction;
  remark: string;
  operator: string;
  createTime: string;
  photos?: string[];
}

export interface TrackPoint {
  lat: number;
  lng: number;
  time: string;
  speed?: number;
  accuracy?: number;
}

export type TrackStatus = 'recording' | 'paused' | 'finished';

export interface TrackRecord {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime?: string;
  distance: number;
  points: TrackPoint[];
  status: TrackStatus;
  taskCount?: number;
  reportCount?: number;
}

export type MessageCategory = 'system' | 'task' | 'rectification' | 'chat';

export interface Message {
  id: string;
  category: MessageCategory;
  title: string;
  content: string;
  sender?: string;
  senderAvatar?: string;
  createTime: string;
  isRead: boolean;
  relatedId?: string;
  relatedType?: string;
  urgency?: 'normal' | 'urgent';
}

export interface DailyRecord {
  date: string;
  tasks: number;
  distance: number;
  reports: number;
}

export interface Performance {
  month: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  totalDistance: number;
  hazardReports: number;
  criticalHazards: number;
  avgResponseTime: number;
  rank: number;
  totalInspectors: number;
  dailyRecords: DailyRecord[];
}

export interface FacilityFilter {
  type?: FacilityType | 'all';
  status?: FacilityStatus | 'all';
  keyword?: string;
  nearbyOnly?: boolean;
}

export interface TaskFilter {
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  type?: TaskType | 'all';
}

export type AppTab = 'tasks' | 'map' | 'facilities' | 'report' | 'rectification' | 'messages' | 'profile';
