import { create } from 'zustand';
import type {
  User,
  Task,
  Facility,
  HazardReport,
  RectificationOrder,
  Message,
  TrackRecord,
  Performance,
  FacilityFilter,
  TaskFilter,
  MediaFile,
} from '@/types';
import {
  mockUser,
  mockTasks,
  mockFacilities,
  mockHazardReports,
  mockRectificationOrders,
  mockMessages,
  mockPerformance,
  mockTrackRecords,
} from '@/data/mock';
import { generateId } from '@/utils';

interface AppState {
  user: User | null;
  online: boolean;
  currentPosition: { lat: number; lng: number } | null;
  pendingSyncQueue: HazardReport[];

  tasks: Task[];
  facilities: Facility[];
  hazardReports: HazardReport[];
  rectificationOrders: RectificationOrder[];
  messages: Message[];
  performance: Performance | null;
  trackRecords: TrackRecord[];
  activeTrack: TrackRecord | null;

  facilityFilter: FacilityFilter;
  taskFilter: TaskFilter;
  selectedFacilityId: string | null;
  selectedTaskId: string | null;

  setOnline: (online: boolean) => void;
  setCurrentPosition: (pos: { lat: number; lng: number }) => void;

  updateTaskStatus: (taskId: string, status: Task['status'], extra?: Partial<Task>) => void;
  checkInTask: (taskId: string, data: { lat: number; lng: number; photo?: string }) => void;
  setTaskFilter: (filter: Partial<TaskFilter>) => void;
  setSelectedTaskId: (id: string | null) => void;

  setFacilityFilter: (filter: Partial<FacilityFilter>) => void;
  setSelectedFacilityId: (id: string | null) => void;
  updateFacilityStatus: (facilityId: string, status: Facility['status']) => void;

  addHazardReport: (report: Omit<HazardReport, 'id' | 'userId' | 'createTime' | 'mediaFiles' | 'status' | 'savedOffline'> & { mediaFiles: MediaFile[]; savedOffline?: boolean }) => void;
  updateHazardStatus: (hazardId: string, status: HazardReport['status']) => void;

  urgeRectification: (orderId: string) => void;
  recheckRectification: (orderId: string, pass: boolean, remark?: string) => void;

  markMessageRead: (messageId: string) => void;
  markAllMessagesRead: (category?: Message['category']) => void;
  getUnreadCount: () => number;

  startTrack: () => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  endTrack: () => void;
  addTrackPoint: (point: TrackRecord['points'][number]) => void;

  syncOfflineData: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: mockUser,
  online: true,
  currentPosition: { lat: 34.2258, lng: 108.9541 },
  pendingSyncQueue: [],

  tasks: [...mockTasks],
  facilities: [...mockFacilities],
  hazardReports: [...mockHazardReports],
  rectificationOrders: [...mockRectificationOrders],
  messages: [...mockMessages],
  performance: mockPerformance,
  trackRecords: [...mockTrackRecords],
  activeTrack: mockTrackRecords.find(t => t.status === 'recording') || null,

  facilityFilter: { type: 'all', status: 'all', nearbyOnly: false },
  taskFilter: { status: 'all', priority: 'all', type: 'all' },
  selectedFacilityId: null,
  selectedTaskId: null,

  setOnline: (online) => set({ online }),

  setCurrentPosition: (pos) => set({ currentPosition: pos }),

  updateTaskStatus: (taskId, status, extra) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status, ...extra } : t)),
    })),

  checkInTask: (taskId, data) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: 'in_progress' as const, checkInTime: new Date().toISOString() }
          : t
      ),
    })),

  setTaskFilter: (filter) =>
    set((state) => ({ taskFilter: { ...state.taskFilter, ...filter } })),

  setSelectedTaskId: (id) => set({ selectedTaskId: id }),

  setFacilityFilter: (filter) =>
    set((state) => ({ facilityFilter: { ...state.facilityFilter, ...filter } })),

  setSelectedFacilityId: (id) => set({ selectedFacilityId: id }),

  updateFacilityStatus: (facilityId, status) =>
    set((state) => ({
      facilities: state.facilities.map((f) =>
        f.id === facilityId ? { ...f, status } : f
      ),
    })),

  addHazardReport: (report) => {
    const newReport: HazardReport = {
      ...report,
      id: generateId('hz'),
      userId: mockUser.id,
      createTime: new Date().toISOString(),
      status: report.savedOffline ? 'submitted' : 'submitted',
      mediaFiles: report.mediaFiles,
      savedOffline: report.savedOffline || !get().online,
    };

    if (newReport.savedOffline || !get().online) {
      set((state) => ({
        hazardReports: [newReport, ...state.hazardReports],
        pendingSyncQueue: [...state.pendingSyncQueue, newReport],
      }));
    } else {
      set((state) => ({
        hazardReports: [newReport, ...state.hazardReports],
      }));
    }
  },

  updateHazardStatus: (hazardId, status) =>
    set((state) => ({
      hazardReports: state.hazardReports.map((h) =>
        h.id === hazardId ? { ...h, status } : h
      ),
    })),

  urgeRectification: (orderId) =>
    set((state) => ({
      rectificationOrders: state.rectificationOrders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              urgeCount: o.urgeCount + 1,
              logs: [
                ...o.logs,
                {
                  id: generateId('rl'),
                  orderId,
                  action: 'urge',
                  remark: `网格员催办（第${o.urgeCount + 1}次）`,
                  operator: mockUser.name,
                  createTime: new Date().toISOString(),
                },
              ],
            }
          : o
      ),
    })),

  recheckRectification: (orderId, pass, remark = '') =>
    set((state) => ({
      rectificationOrders: state.rectificationOrders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: pass ? 'closed' : 'recheck_failed',
              recheckTime: new Date().toISOString(),
              logs: [
                ...o.logs,
                {
                  id: generateId('rl'),
                  orderId,
                  action: pass ? 'recheck_pass' : 'recheck_fail',
                  remark: remark || (pass ? '复查通过' : '复查不通过，需重新整改'),
                  operator: mockUser.name,
                  createTime: new Date().toISOString(),
                },
              ],
            }
          : o
      ),
      hazardReports: state.hazardReports.map((h) =>
        state.rectificationOrders.find((o) => o.id === orderId)?.hazardId === h.id
          ? { ...h, status: pass ? 'closed' : 'rectifying' }
          : h
      ),
    })),

  markMessageRead: (messageId) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === messageId ? { ...m, isRead: true } : m)),
    })),

  markAllMessagesRead: (category) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        !category || m.category === category ? { ...m, isRead: true } : m
      ),
    })),

  getUnreadCount: () => get().messages.filter((m) => !m.isRead).length,

  startTrack: () => {
    const newTrack: TrackRecord = {
      id: generateId('tr'),
      userId: mockUser.id,
      date: new Date().toISOString().slice(0, 10),
      startTime: new Date().toISOString(),
      distance: 0,
      points: [],
      status: 'recording',
    };
    set((state) => ({
      trackRecords: [newTrack, ...state.trackRecords],
      activeTrack: newTrack,
    }));
  },

  pauseTrack: () =>
    set((state) => ({
      activeTrack: state.activeTrack ? { ...state.activeTrack, status: 'paused' } : null,
      trackRecords: state.trackRecords.map((t) =>
        t.id === state.activeTrack?.id ? { ...t, status: 'paused' } : t
      ),
    })),

  resumeTrack: () =>
    set((state) => ({
      activeTrack: state.activeTrack ? { ...state.activeTrack, status: 'recording' } : null,
      trackRecords: state.trackRecords.map((t) =>
        t.id === state.activeTrack?.id ? { ...t, status: 'recording' } : t
      ),
    })),

  endTrack: () =>
    set((state) => ({
      activeTrack: null,
      trackRecords: state.trackRecords.map((t) =>
        t.id === state.activeTrack?.id
          ? { ...t, status: 'finished', endTime: new Date().toISOString() }
          : t
      ),
    })),

  addTrackPoint: (point) =>
    set((state) => {
      if (!state.activeTrack) return state;
      const newPoints = [...state.activeTrack.points, point];
      return {
        activeTrack: { ...state.activeTrack, points: newPoints },
        trackRecords: state.trackRecords.map((t) =>
          t.id === state.activeTrack?.id ? { ...t, points: newPoints } : t
        ),
      };
    }),

  syncOfflineData: async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    set((state) => ({
      online: true,
      pendingSyncQueue: [],
      hazardReports: state.hazardReports.map((h) => ({ ...h, savedOffline: false })),
    }));
  },
}));
