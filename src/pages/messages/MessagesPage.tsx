import { useState, useMemo, useRef } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { Card, StatusBadge, Tag, EmptyState, Modal, InfoRow, Divider, SearchBar } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { formatDateTime, relativeTime, cn } from '@/utils';
import {
  Bell,
  ClipboardList,
  AlertTriangle,
  User,
  CheckCheck,
  Trash2,
  X,
  ChevronRight,
  Send,
  Reply,
  Clock,
  CheckCircle2,
  Eye,
  Phone,
} from 'lucide-react';
import type { Message, MessageCategory } from '@/types';

type TabKey = 'all' | MessageCategory;

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: '全部', icon: null },
  { key: 'system', label: '系统通知', icon: <Bell className="w-3.5 h-3.5" /> },
  { key: 'task', label: '任务提醒', icon: <ClipboardList className="w-3.5 h-3.5" /> },
  { key: 'rectification', label: '整改催办', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { key: 'chat', label: '消息聊天', icon: <User className="w-3.5 h-3.5" /> },
];

const CATEGORY_CONFIG: Record<
  MessageCategory,
  { icon: React.ReactNode; bg: string; iconColor: string; label: string }
> = {
  system: {
    icon: <Bell className="w-5 h-5" />,
    bg: 'bg-gradient-to-br from-primary-500 to-primary-600',
    iconColor: 'text-white',
    label: '系统通知',
  },
  task: {
    icon: <ClipboardList className="w-5 h-5" />,
    bg: 'bg-gradient-to-br from-twin-cyan to-blue-500',
    iconColor: 'text-white',
    label: '任务提醒',
  },
  rectification: {
    icon: <AlertTriangle className="w-5 h-5" />,
    bg: 'bg-gradient-to-br from-warning-500 to-warning-600',
    iconColor: 'text-white',
    label: '整改催办',
  },
  chat: {
    icon: <User className="w-5 h-5" />,
    bg: 'bg-gradient-to-br from-success-500 to-success-600',
    iconColor: 'text-white',
    label: '消息聊天',
  },
};

function SwipeableMessageItem({
  message,
  isSelected,
  isMultiSelectMode,
  onToggleSelect,
  onClick,
  onRead,
  onDelete,
}: {
  message: Message;
  isSelected: boolean;
  isMultiSelectMode: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
  onRead: () => void;
  onDelete: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const ACTION_WIDTH = 160;

  const config = CATEGORY_CONFIG[message.category];

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isMultiSelectMode) return;
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isMultiSelectMode) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    let newOffset = (offset > 0 ? offset : 0) + diff;
    newOffset = Math.max(-ACTION_WIDTH, Math.min(0, newOffset));
    setOffset(newOffset);
  };

  const handleTouchEnd = () => {
    if (!isDragging || isMultiSelectMode) return;
    setIsDragging(false);
    if (offset < -ACTION_WIDTH / 2) {
      setOffset(-ACTION_WIDTH);
    } else {
      setOffset(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMultiSelectMode) return;
    startX.current = e.clientX;
    currentX.current = e.clientX;
    setIsDragging(true);
    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging) return;
      currentX.current = ev.clientX;
      const diff = currentX.current - startX.current;
      let newOffset = (offset > 0 ? offset : 0) + diff;
      newOffset = Math.max(-ACTION_WIDTH, Math.min(0, newOffset));
      setOffset(newOffset);
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      if (offset < -ACTION_WIDTH / 2) {
        setOffset(-ACTION_WIDTH);
      } else {
        setOffset(0);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleItemClick = () => {
    if (isMultiSelectMode) {
      onToggleSelect();
      return;
    }
    if (offset !== 0) {
      setOffset(0);
      return;
    }
    onClick();
  };

  return (
    <div className="relative overflow-hidden mb-2 rounded-2xl">
      <div
        className="absolute inset-y-0 right-0 flex"
        style={{ width: ACTION_WIDTH }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRead();
            setOffset(0);
          }}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
            message.isRead ? 'bg-gray-400 text-white' : 'bg-primary-500 text-white hover:bg-primary-600'
          )}
        >
          {message.isRead ? <Eye className="w-5 h-5" /> : <CheckCheck className="w-5 h-5" />}
          {message.isRead ? '已读' : '已读'}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
            setOffset(0);
          }}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium bg-danger-500 text-white hover:bg-danger-600 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
          删除
        </button>
      </div>

      <div
        className={cn(
          'relative bg-white rounded-2xl border border-gray-50 transition-all duration-200',
          'cursor-pointer active:scale-[0.99]',
          isMultiSelectMode && isSelected && 'ring-2 ring-primary-500 bg-primary-50/30'
        )}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onClick={handleItemClick}
      >
        <div className="flex min-h-[88px]">
          {message.urgency === 'urgent' && (
            <div className="w-1 shrink-0 bg-gradient-to-b from-danger-500 to-danger-600 rounded-l-2xl" />
          )}

          <div className="flex-1 flex items-center gap-3 p-3.5 min-w-0">
            {isMultiSelectMode && (
              <div
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                  isSelected
                    ? 'bg-primary-500 border-primary-500'
                    : 'border-gray-300 hover:border-primary-400'
                )}
              >
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
            )}

            <div
              className={cn(
                'w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm',
                config.bg,
                config.iconColor
              )}
            >
              {config.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={cn(
                      'text-sm truncate',
                      message.isRead ? 'text-gray-600 font-normal' : 'text-gray-900 font-semibold'
                    )}
                  >
                    {message.sender || config.label}
                  </span>
                  {!message.isRead && (
                    <span className="w-2 h-2 rounded-full bg-danger-500 shrink-0 animate-pulse" />
                  )}
                </div>
                <span className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap">
                  {relativeTime(message.createTime)}
                </span>
              </div>

              <div className="flex items-start gap-1.5 mb-1">
                {message.urgency === 'urgent' && (
                  <Tag label="紧急" color="pink" className="shrink-0" />
                )}
                <h3
                  className={cn(
                    'text-[13px] leading-snug line-clamp-1',
                    message.isRead ? 'text-gray-700 font-normal' : 'text-gray-900 font-semibold'
                  )}
                >
                  {message.title}
                </h3>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                {message.content}
              </p>
            </div>

            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageDetailModal({
  message,
  isOpen,
  onClose,
  onJumpToRelated,
}: {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
  onJumpToRelated: (type: string, id: string) => void;
}) {
  const [replyText, setReplyText] = useState('');
  const markMessageRead = useAppStore((s) => s.markMessageRead);
  const tasks = useAppStore((s) => s.tasks);
  const rectificationOrders = useAppStore((s) => s.rectificationOrders);
  const hazardReports = useAppStore((s) => s.hazardReports);

  const relatedInfo = useMemo(() => {
    if (!message) return null;
    if (message.relatedType === 'task' && message.relatedId) {
      const task = tasks.find((t) => t.id === message.relatedId);
      return task
        ? {
            type: 'task',
            title: task.title,
            subtitle: `${task.location} · ${relativeTime(task.planTime)}`,
            status: task.status,
            data: task,
          }
        : null;
    }
    if (message.relatedType === 'rectification' && message.relatedId) {
      const order = rectificationOrders.find((o) => o.id === message.relatedId);
      if (order) {
        const hazard = hazardReports.find((h) => h.id === order.hazardId);
        return {
          type: 'rectification',
          title: order.hazardTitle,
          subtitle: `整改责任人：${order.handler} · 截止：${formatDateTime(order.deadline)}`,
          status: order.status,
          data: order,
          hazard,
        };
      }
    }
    return null;
  }, [message, tasks, rectificationOrders, hazardReports]);

  const handleClose = () => {
    if (message && !message.isRead) {
      markMessageRead(message.id);
    }
    onClose();
  };

  if (!message) return null;

  const config = CATEGORY_CONFIG[message.category];

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="flex items-center gap-3 mb-5">
        <div
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center shadow-md',
            config.bg,
            config.iconColor
          )}
        >
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900 truncate">
              {message.sender || config.label}
            </h3>
            {message.urgency === 'urgent' && <Tag label="紧急" color="pink" />}
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" />
            {formatDateTime(message.createTime)}
          </p>
        </div>
      </div>

      <div className="mb-5">
        <h4 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
          {message.title}
          {message.isRead ? (
            <StatusBadge label="已读" variant="default" />
          ) : (
            <StatusBadge label="未读" variant="info" pulse />
          )}
        </h4>
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>

      {relatedInfo && (
        <>
          <Divider label="关联信息" />
          <Card
            className="mb-5 p-4 cursor-pointer hover:border-primary-300 transition-all"
            hoverable
            onClick={() =>
              message.relatedId &&
              onJumpToRelated(message.relatedType!, message.relatedId)
            }
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  relatedInfo.type === 'task'
                    ? 'bg-twin-cyan/10 text-twin-cyan'
                    : 'bg-warning-50 text-warning-600'
                )}
              >
                {relatedInfo.type === 'task' ? (
                  <ClipboardList className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {relatedInfo.title}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                  {relatedInfo.subtitle}
                </p>
                <StatusBadge
                  label={
                    relatedInfo.type === 'task'
                      ? relatedInfo.status === 'pending'
                        ? '待执行'
                        : relatedInfo.status === 'in_progress'
                        ? '进行中'
                        : relatedInfo.status === 'completed'
                        ? '已完成'
                        : '已超期'
                      : relatedInfo.status === 'pending'
                      ? '待派单'
                      : relatedInfo.status === 'processing'
                      ? '整改中'
                      : relatedInfo.status === 'completed'
                      ? '待复查'
                      : relatedInfo.status === 'overdue'
                      ? '已超期'
                      : relatedInfo.status === 'recheck_failed'
                      ? '复查不通过'
                      : '已闭环'
                  }
                  variant={
                    relatedInfo.type === 'task'
                      ? relatedInfo.status === 'in_progress'
                        ? 'success'
                        : relatedInfo.status === 'completed'
                        ? 'default'
                        : relatedInfo.status === 'expired'
                        ? 'danger'
                        : 'info'
                      : relatedInfo.status === 'processing'
                      ? 'info'
                      : relatedInfo.status === 'completed'
                      ? 'warning'
                      : relatedInfo.status === 'closed'
                      ? 'success'
                      : 'danger'
                  }
                  size="sm"
                />
              </div>
            </div>
          </Card>
        </>
      )}

      {message.category === 'chat' && message.sender && (
        <>
          <Divider label="回复消息" />
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
              <button className="w-9 h-9 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center hover:bg-primary-100 transition-colors">
                <Phone className="w-4 h-4" />
              </button>
              <button className="w-9 h-9 rounded-full bg-success-50 text-success-600 flex items-center justify-center hover:bg-success-100 transition-colors">
                <Reply className="w-4 h-4" />
              </button>
              <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-200">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="输入回复内容..."
                  className="flex-1 text-sm outline-none placeholder:text-gray-400"
                />
                <button
                  disabled={!replyText.trim()}
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                    replyText.trim()
                      ? 'bg-primary-500 text-white hover:bg-primary-600'
                      : 'bg-gray-100 text-gray-400'
                  )}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex gap-2 mt-6">
        <Button variant="outline" size="full" onClick={handleClose}>
          关闭
        </Button>
        {relatedInfo && message.relatedId && (
          <Button
            variant="primary"
            size="full"
            onClick={() =>
              onJumpToRelated(message.relatedType!, message.relatedId!)
            }
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            查看关联
          </Button>
        )}
      </div>
    </Modal>
  );
}

export default function MessagesPage() {
  const messages = useAppStore((s) => s.messages);
  const markMessageRead = useAppStore((s) => s.markMessageRead);
  const markAllMessagesRead = useAppStore((s) => s.markAllMessagesRead);

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchText, setSearchText] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unreadCounts = useMemo(() => {
    const counts: Record<TabKey, number> = {
      all: 0,
      system: 0,
      task: 0,
      rectification: 0,
      chat: 0,
    };
    messages.forEach((m) => {
      if (!m.isRead) {
        counts.all++;
        if (counts[m.category] !== undefined) {
          counts[m.category]++;
        }
      }
    });
    return counts;
  }, [messages]);

  const filteredMessages = useMemo(() => {
    let result = messages;
    if (activeTab !== 'all') {
      result = result.filter((m) => m.category === activeTab);
    }
    if (searchText.trim()) {
      const keyword = searchText.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(keyword) ||
          m.content.toLowerCase().includes(keyword) ||
          (m.sender && m.sender.toLowerCase().includes(keyword))
      );
    }
    return result.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
  }, [messages, activeTab, searchText]);

  const sortedMessages = useMemo(() => {
    return [...filteredMessages].sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      if (a.urgency !== b.urgency) return a.urgency === 'urgent' ? -1 : 1;
      return new Date(b.createTime).getTime() - new Date(a.createTime).getTime();
    });
  }, [filteredMessages]);

  const handleMarkAllRead = () => {
    if (activeTab === 'all') {
      markAllMessagesRead();
    } else {
      markAllMessagesRead(activeTab);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredMessages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMessages.map((m) => m.id)));
    }
  };

  const handleBatchRead = () => {
    selectedIds.forEach((id) => markMessageRead(id));
    setSelectedIds(new Set());
    setIsMultiSelectMode(false);
  };

  const handleBatchDelete = () => {
    console.log('批量删除:', Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsMultiSelectMode(false);
  };

  const handleCancelMultiSelect = () => {
    setIsMultiSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleLongPressStart = () => {
    longPressTimer.current = setTimeout(() => {
      setIsMultiSelectMode(true);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleJumpToRelated = (type: string, id: string) => {
    if (type === 'task') {
      navigate('/');
    } else if (type === 'rectification') {
      navigate('/rectification');
    } else if (type === 'hazard') {
      navigate('/report');
    }
    setSelectedMessage(null);
  };

  const handleDelete = (id: string) => {
    console.log('删除消息:', id);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {isMultiSelectMode ? (
        <header className="sticky top-0 z-30 px-4 pt-safe pb-3 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between h-12">
            <button
              onClick={handleCancelMultiSelect}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-base font-semibold text-gray-900">
              已选
              <span className="text-primary-600 mx-1">{selectedIds.size}</span>
              条
            </div>
            <button
              onClick={handleSelectAll}
              className="text-sm text-primary-600 font-medium hover:text-primary-700"
            >
              {selectedIds.size === filteredMessages.length ? '取消全选' : '全选'}
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<CheckCheck className="w-4 h-4" />}
              onClick={handleBatchRead}
              disabled={selectedIds.size === 0}
              className="flex-1"
            >
              全部已读
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={handleBatchDelete}
              disabled={selectedIds.size === 0}
              className="flex-1"
            >
              全部删除
            </Button>
          </div>
        </header>
      ) : (
        <PageHeader
          title="消息中心"
          subtitle={`共 ${messages.length} 条消息 · ${unreadCounts.all} 条未读`}
          rightContent={
            <button
              onClick={handleMarkAllRead}
              disabled={unreadCounts[activeTab] === 0}
              className={cn(
                'inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-sm font-medium transition-all',
                unreadCounts[activeTab] === 0
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-white/15 text-white hover:bg-white/25 active:scale-95'
              )}
            >
              <CheckCheck className="w-4 h-4" />
              全部已读
            </button>
          }
        />
      )}

      <div className="px-4 pt-4">
        <SearchBar
          value={searchText}
          onChange={setSearchText}
          placeholder="搜索消息标题、内容..."
          className="mb-3"
        />

        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide mb-2">
          {TABS.map((tab) => {
            const count = unreadCounts[tab.key];
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'shrink-0 inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md shadow-primary-500/30'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                )}
              >
                {tab.icon && <span className={cn(isActive ? 'text-white' : 'text-gray-400')}>{tab.icon}</span>}
                {tab.label}
                {count > 0 && (
                  <span
                    className={cn(
                      'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold',
                      isActive ? 'bg-white text-primary-600' : 'bg-danger-500 text-white'
                    )}
                  >
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {sortedMessages.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-10 h-10" />}
            title={searchText ? '未找到匹配的消息' : '暂无消息'}
            description={
              searchText
                ? '请尝试其他搜索关键词'
                : activeTab === 'all'
                ? '暂时没有新的消息，耐心等待通知吧~'
                : `当前没有${TABS.find((t) => t.key === activeTab)?.label}类别的消息`
            }
          />
        ) : (
          <div
            className="animate-in fade-in"
            onMouseDown={handleLongPressStart}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            onTouchStart={handleLongPressStart}
            onTouchEnd={handleLongPressEnd}
          >
            {sortedMessages.map((message) => (
              <SwipeableMessageItem
                key={message.id}
                message={message}
                isSelected={selectedIds.has(message.id)}
                isMultiSelectMode={isMultiSelectMode}
                onToggleSelect={() => handleToggleSelect(message.id)}
                onClick={() => {
                  setSelectedMessage(message);
                  if (!message.isRead) {
                    markMessageRead(message.id);
                  }
                }}
                onRead={() => markMessageRead(message.id)}
                onDelete={() => handleDelete(message.id)}
              />
            ))}
          </div>
        )}
      </div>

      <MessageDetailModal
        message={selectedMessage}
        isOpen={!!selectedMessage}
        onClose={() => setSelectedMessage(null)}
        onJumpToRelated={handleJumpToRelated}
      />
    </div>
  );
}
