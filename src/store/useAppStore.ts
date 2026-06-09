import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  syncedHazardIds: string[];

  tasks: Task[];
  facilities: Facility[];
  customFacilityIds: string[];
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

  navTarget: { type: 'task' | 'facility' | 'point'; id?: string; title: string; lat: number; lng: number; address?: string } | null;

  setOnline: (online: boolean) => void;
  setCurrentPosition: (pos: { lat: number; lng: number }) => void;
  setNavTarget: (target: AppState['navTarget']) => void;
  clearNavTarget: () => void;

  updateTaskStatus: (taskId: string, status: Task['status'], extra?: Partial<Task>) => void;
  checkInTask: (taskId: string, data: { lat: number; lng: number; photo?: string }) => void;
  setTaskFilter: (filter: Partial<TaskFilter>) => void;
  setSelectedTaskId: (id: string | null) => void;

  setFacilityFilter: (filter: Partial<FacilityFilter>) => void;
  setSelectedFacilityId: (id: string | null) => void;
  updateFacilityStatus: (facilityId: string, status: Facility['status']) => void;
  addFacility: (data: Omit<Facility, 'id' | 'code' | 'qrCode' | 'inspectionCount' | 'twinData'> & Partial<Pick<Facility, 'twinData'>>) => string;

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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: mockUser,
      online: true,
      currentPosition: { lat: 34.2258, lng: 108.9541 },
      pendingSyncQueue: [],
      syncedHazardIds: [],

      tasks: [...mockTasks],
      facilities: [...mockFacilities],
      customFacilityIds: [],
      hazardReports: [...mockHazardReports],
      rectificationOrders: [...mockRectificationOrders],
      messages: [...mockMessages],
      performance: mockPerformance,
      trackRecords: [...mockTrackRecords],
      activeTrack: mockTrackRecords.find((t) => t.status === 'recording') || null,

      facilityFilter: { type: 'all', status: 'all', nearbyOnly: false },
      taskFilter: { status: 'all', priority: 'all', type: 'all' },
      selectedFacilityId: null,
      selectedTaskId: null,

      navTarget: null,

      setOnline: (online) => set({ online }),

      setCurrentPosition: (pos) => set({ currentPosition: pos }),

      setNavTarget: (target) => set({ navTarget: target }),
      clearNavTarget: () => set({ navTarget: null }),

      updateTaskStatus: (taskId, status, extra) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status, ...extra } : t)),
        })),

      checkInTask: (taskId) =>
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
          facilities: state.facilities.map((f) => (f.id === facilityId ? { ...f, status } : f)),
        })),

      addFacility: (data) => {
        const now = new Date();
        const typeCode: Record<string, string> = {
          lamp: 'LD',
          manhole: 'JG',
          bin: 'LJ',
          bench: 'ZY',
          sign: 'BS',
          fire_hydrant: 'XF',
          other: 'QT',
        };
        const code = `${typeCode[data.type] || 'QT'}-CUSTOM-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(get().facilities.filter((f) => f.code.startsWith(typeCode[data.type] || 'QT') + '-CUSTOM-')).length + 1}`.padStart(12, '0');
        const qrCode = code.replace(/-/g, '').toUpperCase();
        const newFacility: Facility = {
          ...data,
          id: generateId('f'),
          code,
          qrCode,
          inspectionCount: 0,
          twinData: data.twinData || {
            modelVersion: 'TWIN-CUSTOM-V1.0',
            material: '待更新',
            manufacturer: '网格员现场采集',
            expectedLifespan: '待确认',
            specs: { '备注': '网格员现场采集数据' },
            lastSyncTime: now.toISOString(),
            syncedFromAdmin: false,
            conditionScore: 80,
          },
        };
        set((state) => ({
          facilities: [newFacility, ...state.facilities],
          customFacilityIds: [...state.customFacilityIds, newFacility.id],
        }));
        return newFacility.id;
      },

      addHazardReport: (report) => {
        const savedOffline = report.savedOffline || !get().online;
        const newReport: HazardReport = {
          ...report,
          id: generateId('hz'),
          userId: mockUser.id,
          createTime: new Date().toISOString(),
          status: 'submitted',
          mediaFiles: report.mediaFiles,
          savedOffline,
        };

        if (savedOffline) {
          set((state) => ({
            hazardReports: [newReport, ...state.hazardReports],
            pendingSyncQueue: [...state.pendingSyncQueue, newReport],
          }));
        } else {
          set((state) => ({
            hazardReports: [newReport, ...state.hazardReports],
            syncedHazardIds: [...state.syncedHazardIds, newReport.id],
          }));
        }
      },

      updateHazardStatus: (hazardId, status) =>
        set((state) => ({
          hazardReports: state.hazardReports.map((h) => (h.id === hazardId ? { ...h, status } : h)),
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
        set((state) => {
          const unsynced = state.pendingSyncQueue.filter((p) => !state.syncedHazardIds.includes(p.id));
          const newlySyncedIds = unsynced.map((p) => p.id);
          return {
            online: true,
            pendingSyncQueue: [],
            syncedHazardIds: [...state.syncedHazardIds, ...newlySyncedIds],
            hazardReports: state.hazardReports.map((h) =>
              newlySyncedIds.includes(h.id) ? { ...h, savedOffline: false } : h
            ),
          };
        });
      },
    }),
    {
      name: 'patrol-app-storage',
      partialize: (state) => ({
        facilities: state.facilities,
        customFacilityIds: state.customFacilityIds,
        hazardReports: state.hazardReports,
        pendingSyncQueue: state.pendingSyncQueue.filter((p) => !state.syncedHazardIds.includes(p.id)),
        syncedHazardIds: state.syncedHazardIds,
        trackRecords: state.trackRecords,
        tasks: state.tasks,
        rectificationOrders: state.rectificationOrders,
        messages: state.messages,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.facilities || state.facilities.length === 0) {
            state.facilities = [...mockFacilities];
          }
          if (state.tasks && state.tasks.length > 0) {
            const syncedIds = new Set(state.syncedHazardIds || []);
            state.pendingSyncQueue = (state.pendingSyncQueue || []).filter((p) => !syncedIds.has(p.id));
          }
        }
      },
    }
  )
);
