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
  TaskTimelineStep,
  FacilityInspection,
  FacilityStatus,
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
  failedSyncIds: string[];
  failedSyncReasons: Record<string, string>;

  tasks: Task[];
  facilities: Facility[];
  customFacilityIds: string[];
  hazardReports: HazardReport[];
  rectificationOrders: RectificationOrder[];
  messages: Message[];
  performance: Performance | null;
  trackRecords: TrackRecord[];
  activeTrack: TrackRecord | null;
  taskTimelines: Record<string, TaskTimelineStep[]>;
  inspectionRecords: FacilityInspection[];

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
  startTaskNavigation: (taskId: string) => void;
  checkInTask: (taskId: string, data: { lat: number; lng: number; photo?: string }) => void;
  addTaskTimelineStep: (taskId: string, step: Omit<TaskTimelineStep, 'id' | 'time'>) => void;
  completeTask: (taskId: string, options?: { markNoHazard?: boolean }) => void;
  addFacilityInspection: (inspection: Omit<FacilityInspection, 'id' | 'inspectTime'>) => string;
  setTaskFilter: (filter: Partial<TaskFilter>) => void;
  setSelectedTaskId: (id: string | null) => void;

  setFacilityFilter: (filter: Partial<FacilityFilter>) => void;
  setSelectedFacilityId: (id: string | null) => void;
  updateFacilityStatus: (facilityId: string, status: FacilityStatus) => void;
  addFacility: (data: Omit<Facility, 'id' | 'code' | 'qrCode' | 'inspectionCount' | 'twinData'> & Partial<Pick<Facility, 'twinData'>>) => string;
  updateFacilitySiteInfo: (facilityId: string, data: { sitePhotos?: MediaFile[]; siteNote?: string; siteStatus?: FacilityStatus; siteCollector?: string; siteCollectTime?: string }) => void;

  addHazardReport: (report: Omit<HazardReport, 'id' | 'userId' | 'createTime' | 'mediaFiles' | 'status' | 'savedOffline' | 'syncStatus'> & { mediaFiles: MediaFile[]; savedOffline?: boolean; taskId?: string }) => void;
  updateHazardStatus: (hazardId: string, status: HazardReport['status']) => void;
  linkHazardToTask: (hazardId: string, taskId: string) => void;

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
  syncSingleHazard: (hazardId: string) => Promise<boolean>;
  retryFailedSync: (hazardId: string) => Promise<boolean>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: mockUser,
      online: typeof navigator !== 'undefined' ? navigator.onLine : true,
      currentPosition: { lat: 34.2258, lng: 108.9541 },
      pendingSyncQueue: [],
      syncedHazardIds: [],
      failedSyncIds: [],
      failedSyncReasons: {},

      tasks: [...mockTasks],
      facilities: [...mockFacilities],
      customFacilityIds: [],
      hazardReports: [...mockHazardReports],
      rectificationOrders: [...mockRectificationOrders],
      messages: [...mockMessages],
      performance: mockPerformance,
      trackRecords: [...mockTrackRecords],
      activeTrack: mockTrackRecords.find((t) => t.status === 'recording') || null,
      taskTimelines: {},
      inspectionRecords: [],

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

      startTaskNavigation: (taskId) =>
        set((state) => {
          const now = new Date().toISOString();
          const step: TaskTimelineStep = {
            id: generateId('ts'),
            type: 'navigation_start',
            time: now,
            result: 'success',
            note: '开始导航',
          };
          return {
            tasks: state.tasks.map((t) =>
              t.id === taskId
                ? { ...t, status: 'navigating' as const, navigationStartTime: now }
                : t
            ),
            taskTimelines: {
              ...state.taskTimelines,
              [taskId]: [...(state.taskTimelines[taskId] || []), step],
            },
          };
        }),

      checkInTask: (taskId, data) =>
        set((state) => {
          const now = new Date().toISOString();
          const step: TaskTimelineStep = {
            id: generateId('ts'),
            type: 'check_in',
            time: now,
            result: 'success',
            lat: data.lat,
            lng: data.lng,
            note: data.photo ? '带照片签到' : '现场签到',
          };
          return {
            tasks: state.tasks.map((t) =>
              t.id === taskId
                ? { ...t, status: 'arrived' as const, checkInTime: now, arriveTime: now }
                : t
            ),
            taskTimelines: {
              ...state.taskTimelines,
              [taskId]: [...(state.taskTimelines[taskId] || []), step],
            },
          };
        }),

      addTaskTimelineStep: (taskId, step) =>
        set((state) => {
          const newStep: TaskTimelineStep = {
            id: generateId('ts'),
            time: new Date().toISOString(),
            ...step,
          };
          const existingTimeline = state.taskTimelines[taskId] || [];
          return {
            taskTimelines: {
              ...state.taskTimelines,
              [taskId]: [...existingTimeline, newStep],
            },
          };
        }),

      completeTask: (taskId, options) =>
        set((state) => {
          const now = new Date().toISOString();
          const extraSteps: TaskTimelineStep[] = [];
          if (options?.markNoHazard) {
            extraSteps.push({
              id: generateId('ts'),
              type: 'hazard_report',
              time: now,
              result: 'success',
              note: '本次巡检无隐患',
            });
          }
          const step: TaskTimelineStep = {
            id: generateId('ts'),
            type: 'task_complete',
            time: now,
            result: 'success',
            note: options?.markNoHazard ? '任务完成（无隐患）' : '任务完成',
          };
          return {
            tasks: state.tasks.map((t) =>
              t.id === taskId
                ? { ...t, status: 'completed' as const, completeTime: now }
                : t
            ),
            taskTimelines: {
              ...state.taskTimelines,
              [taskId]: [...(state.taskTimelines[taskId] || []), ...extraSteps, step],
            },
          };
        }),

      addFacilityInspection: (inspection) => {
        const newInspect: FacilityInspection = {
          ...inspection,
          id: generateId('fi'),
          inspectTime: new Date().toISOString(),
        };
        set((state) => {
          const updates: Partial<AppState> = {
            inspectionRecords: [newInspect, ...state.inspectionRecords],
            facilities: state.facilities.map((f) =>
              f.id === inspection.facilityId
                ? {
                    ...f,
                    status: inspection.status,
                    inspectionCount: f.inspectionCount + 1,
                    lastInspector: inspection.inspector,
                    lastInspectTime: newInspect.inspectTime,
                  }
                : f
            ),
          };
          if (inspection.taskId) {
            const taskId = inspection.taskId;
            const task = state.tasks.find((t) => t.id === taskId);
            const step: TaskTimelineStep = {
              id: generateId('ts'),
              type: 'facility_inspect',
              time: newInspect.inspectTime,
              result: inspection.status === 'normal' ? 'success' : inspection.status === 'warning' ? 'warning' : 'failed',
              relatedId: inspection.facilityId,
              relatedName: state.facilities.find((f) => f.id === inspection.facilityId)?.name,
              note: inspection.note,
            };
            const existingTimeline = state.taskTimelines[taskId] || [];
            const newTimeline = [...existingTimeline, step];
            updates.taskTimelines = { ...state.taskTimelines, [taskId]: newTimeline };
            updates.tasks = state.tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    status: 'inspecting' as const,
                    inspectionIds: [...(t.inspectionIds || []), newInspect.id],
                  }
                : t
            );
            if (task && task.status === 'arrived') {
              updates.tasks = (updates.tasks as Task[]).map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      status: 'inspecting' as const,
                      inspectionIds: [...(t.inspectionIds || []), newInspect.id],
                    }
                  : t
              );
            }
          }
          return updates;
        });
        return newInspect.id;
      },

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
        const prefix = typeCode[data.type] || 'QT';
        const customCount = get().facilities.filter((f) =>
          f.code.startsWith(`${prefix}-CUSTOM-`)
        ).length + 1;
        const code = `${prefix}-CUSTOM-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(customCount).padStart(3, '0')}`;
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

      updateFacilitySiteInfo: (facilityId, data) =>
        set((state) => ({
          facilities: state.facilities.map((f) =>
            f.id === facilityId
              ? {
                  ...f,
                  sitePhotos: data.sitePhotos ?? f.sitePhotos,
                  siteNote: data.siteNote ?? f.siteNote,
                  siteStatus: data.siteStatus ?? f.siteStatus,
                  siteCollectTime: data.siteCollectTime ?? new Date().toISOString(),
                  siteCollector: data.siteCollector ?? state.user?.name ?? f.siteCollector,
                }
              : f
          ),
        })),

      addHazardReport: (report) => {
        const savedOffline = report.savedOffline || !get().online;
        const now = new Date().toISOString();
        const newReport: HazardReport = {
          ...report,
          id: generateId('hz'),
          userId: mockUser.id,
          createTime: now,
          status: 'submitted',
          mediaFiles: report.mediaFiles,
          savedOffline,
          syncStatus: savedOffline ? 'pending' : 'synced',
          syncTime: savedOffline ? undefined : now,
        };

        set((state) => {
          const updates: Partial<AppState> = {
            hazardReports: [newReport, ...state.hazardReports],
          };
          if (savedOffline) {
            updates.pendingSyncQueue = [...state.pendingSyncQueue, newReport];
          } else {
            updates.syncedHazardIds = [...state.syncedHazardIds, newReport.id];
          }
          if (report.taskId) {
            const taskId = report.taskId;
            const step: TaskTimelineStep = {
              id: generateId('ts'),
              type: 'hazard_report',
              time: now,
              result: report.level === 'critical' ? 'warning' : 'success',
              relatedId: newReport.id,
              relatedName: newReport.title,
              note: `${report.level === 'critical' ? '紧急' : report.level === 'normal' ? '一般' : '轻微'}隐患上报`,
            };
            const existingTimeline = state.taskTimelines[taskId] || [];
            updates.taskTimelines = { ...state.taskTimelines, [taskId]: [...existingTimeline, step] };
            updates.tasks = state.tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    status:
                      t.status === 'arrived' || t.status === 'navigating'
                        ? ('inspecting' as const)
                        : t.status,
                    relatedHazardIds: [...(t.relatedHazardIds || []), newReport.id],
                  }
                : t
            );
          }
          return updates;
        });
      },

      updateHazardStatus: (hazardId, status) =>
        set((state) => ({
          hazardReports: state.hazardReports.map((h) => (h.id === hazardId ? { ...h, status } : h)),
        })),

      linkHazardToTask: (hazardId, taskId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, relatedHazardIds: [...(t.relatedHazardIds || []), hazardId] }
              : t
          ),
          hazardReports: state.hazardReports.map((h) =>
            h.id === hazardId ? { ...h, taskId } : h
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
        if (!get().online) return;
        await new Promise((resolve) => setTimeout(resolve, 1200));
        set((state) => {
          const { pendingSyncQueue, syncedHazardIds } = state;
          const unsynced = pendingSyncQueue.filter((p) => !syncedHazardIds.includes(p.id));
          // 模拟20%失败率
          const newSynced: string[] = [];
          const newFailed: string[] = [];
          const newReasons: Record<string, string> = {};
          unsynced.forEach((r) => {
            const rand = Math.random();
            if (rand > 0.2) {
              newSynced.push(r.id);
            } else {
              newFailed.push(r.id);
              newReasons[r.id] = '服务器繁忙，请稍后重试';
            }
          });
          const now = new Date().toISOString();
          return {
            pendingSyncQueue: state.pendingSyncQueue.filter((p) => !newSynced.includes(p.id) && !newFailed.includes(p.id)),
            syncedHazardIds: [...syncedHazardIds, ...newSynced],
            failedSyncIds: [...new Set([...state.failedSyncIds, ...newFailed])],
            failedSyncReasons: { ...state.failedSyncReasons, ...newReasons },
            hazardReports: state.hazardReports.map((h) => {
              if (newSynced.includes(h.id)) {
                return { ...h, savedOffline: false, syncStatus: 'synced' as const, syncTime: now };
              }
              if (newFailed.includes(h.id)) {
                return { ...h, syncStatus: 'failed' as const, syncError: newReasons[h.id] };
              }
              return h;
            }),
          };
        });
      },

      syncSingleHazard: async (hazardId) => {
        if (!get().online) return false;
        await new Promise((r) => setTimeout(r, 800));
        const rand = Math.random();
        const success = rand > 0.2;
        set((state) => {
          const now = new Date().toISOString();
          return {
            pendingSyncQueue: success
              ? state.pendingSyncQueue.filter((p) => p.id !== hazardId)
              : state.pendingSyncQueue,
            syncedHazardIds: success
              ? [...state.syncedHazardIds, hazardId]
              : state.syncedHazardIds,
            failedSyncIds: success
              ? state.failedSyncIds.filter((id) => id !== hazardId)
              : [...new Set([...state.failedSyncIds, hazardId])],
            failedSyncReasons: success
              ? (() => {
                  const { [hazardId]: _, ...rest } = state.failedSyncReasons;
                  return rest;
                })()
              : { ...state.failedSyncReasons, [hazardId]: '网络波动，同步失败' },
            hazardReports: state.hazardReports.map((h) =>
              h.id === hazardId
                ? success
                  ? { ...h, savedOffline: false, syncStatus: 'synced' as const, syncTime: now, syncError: undefined }
                  : { ...h, syncStatus: 'failed' as const, syncError: '网络波动，同步失败' }
                : h
            ),
          };
        });
        return success;
      },

      retryFailedSync: async (hazardId) => {
        if (!get().online) return false;
        await new Promise((r) => setTimeout(r, 800));
        const rand = Math.random();
        const success = rand > 0.15;
        set((state) => {
          const now = new Date().toISOString();
          return {
            pendingSyncQueue: success
              ? state.pendingSyncQueue.filter((p) => p.id !== hazardId)
              : state.pendingSyncQueue,
            syncedHazardIds: success
              ? [...state.syncedHazardIds, hazardId]
              : state.syncedHazardIds,
            failedSyncIds: success
              ? state.failedSyncIds.filter((id) => id !== hazardId)
              : state.failedSyncIds,
            failedSyncReasons: success
              ? (() => {
                  const { [hazardId]: _, ...rest } = state.failedSyncReasons;
                  return rest;
                })()
              : { ...state.failedSyncReasons, [hazardId]: '重试失败，请稍后再试' },
            hazardReports: state.hazardReports.map((h) =>
              h.id === hazardId
                ? success
                  ? { ...h, savedOffline: false, syncStatus: 'synced' as const, syncTime: now, syncError: undefined }
                  : { ...h, syncStatus: 'failed' as const, syncError: '重试失败，请稍后再试' }
                : h
            ),
          };
        });
        return success;
      },
    }),
    {
      name: 'patrol-app-storage',
      partialize: (state) => ({
        online: state.online,
        facilities: state.facilities,
        customFacilityIds: state.customFacilityIds,
        hazardReports: state.hazardReports,
        pendingSyncQueue: state.pendingSyncQueue.filter((p) => !state.syncedHazardIds.includes(p.id)),
        syncedHazardIds: state.syncedHazardIds,
        failedSyncIds: state.failedSyncIds,
        failedSyncReasons: state.failedSyncReasons,
        trackRecords: state.trackRecords,
        tasks: state.tasks,
        taskTimelines: state.taskTimelines,
        inspectionRecords: state.inspectionRecords,
        rectificationOrders: state.rectificationOrders,
        messages: state.messages,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 修正 online：持久化了 online，但若当前 navigator 有不同则以 navigator 为准
          if (typeof navigator !== 'undefined') {
            state.online = navigator.onLine;
          }
          if (!state.facilities || state.facilities.length === 0) {
            state.facilities = [...mockFacilities];
          }
          const syncedIds = new Set(state.syncedHazardIds || []);
          state.pendingSyncQueue = (state.pendingSyncQueue || []).filter((p) => !syncedIds.has(p.id));
          state.failedSyncIds = (state.failedSyncIds || []).filter((id) => !syncedIds.has(id));
          if (state.failedSyncIds && state.failedSyncReasons) {
            const filteredReasons: Record<string, string> = {};
            state.failedSyncIds.forEach((id) => {
              if (state.failedSyncReasons![id]) filteredReasons[id] = state.failedSyncReasons![id];
            });
            state.failedSyncReasons = filteredReasons;
          }
        }
      },
    }
  )
);
