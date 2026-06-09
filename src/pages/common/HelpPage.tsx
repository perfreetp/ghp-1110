import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  PhoneCall,
  Ambulance,
  Building2,
  Shield,
  History,
  Mic2,
  MapPin,
  Clock,
  Mic,
  Send,
  CheckCircle2,
  ChevronRight,
  Phone,
  User,
  AlertTriangle,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { Card, Modal, InfoRow, Divider, Tag, StatusBadge } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { cn, formatDateTime, relativeTime } from '@/utils';

interface EmergencyContact {
  id: string;
  name: string;
  position: string;
  phone: string;
  icon: typeof ShieldAlert;
  color: string;
  bg: string;
}

interface HelpRecord {
  id: string;
  time: string;
  type: string;
  status: 'sent' | 'processing' | 'resolved';
  location: string;
  notifiedCount: number;
  remark?: string;
}

const emergencyContacts: EmergencyContact[] = [
  {
    id: 'c1',
    name: '李建国',
    position: '指挥中心主任',
    phone: '138-0000-0101',
    icon: Building2,
    color: 'text-primary-600',
    bg: 'from-primary-100 to-primary-50',
  },
  {
    id: 'c2',
    name: '王警官',
    position: '辖区民警',
    phone: '138-0000-0202',
    icon: Shield,
    color: 'text-blue-600',
    bg: 'from-blue-100 to-blue-50',
  },
  {
    id: 'c3',
    name: '赵调度',
    position: '维修调度',
    phone: '138-0000-0303',
    icon: PhoneCall,
    color: 'text-warning-600',
    bg: 'from-warning-100 to-warning-50',
  },
  {
    id: 'c4',
    name: '急救中心',
    position: '医疗急救',
    phone: '120',
    icon: Ambulance,
    color: 'text-danger-600',
    bg: 'from-danger-100 to-danger-50',
  },
];

const mockHelpRecords: HelpRecord[] = [
  {
    id: 'h1',
    time: '2026-06-08T14:25:00',
    type: '设施异常',
    status: 'resolved',
    location: '科技大道东段',
    notifiedCount: 4,
    remark: '发现井盖破损严重，已通知维修',
  },
  {
    id: 'h2',
    time: '2026-05-22T09:10:00',
    type: '突发情况',
    status: 'resolved',
    location: '中央公园南门',
    notifiedCount: 3,
    remark: '市民突发不适，已联系急救',
  },
  {
    id: 'h3',
    time: '2026-05-15T17:45:00',
    type: '安全隐患',
    status: 'processing',
    location: '创业西路中段',
    notifiedCount: 4,
  },
];

function getStatusVariant(status: HelpRecord['status']): 'success' | 'warning' | 'info' {
  switch (status) {
    case 'resolved': return 'success';
    case 'processing': return 'warning';
    case 'sent': return 'info';
  }
}

function getStatusLabel(status: HelpRecord['status']): string {
  switch (status) {
    case 'resolved': return '已处理';
    case 'processing': return '处理中';
    case 'sent': return '已发送';
  }
}

export default function HelpPage() {
  const currentPosition = useAppStore((s) => s.currentPosition);
  const user = useAppStore((s) => s.user);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [autoRecord, setAutoRecord] = useState(true);
  const [remark, setRemark] = useState('');
  const [locationAddress] = useState('高新区科技大道与创新路交叉口东北角');
  const [notifiedContacts] = useState(4);

  useEffect(() => {
    if (countdown === null || countdown <= 0) {
      if (countdown === 0) {
        triggerHelp();
      }
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSOSClick = () => {
    if (countdown !== null) {
      setCountdown(null);
      return;
    }
    setCountdown(3);
  };

  const triggerHelp = async () => {
    setCountdown(null);
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setShowConfirmModal(true);
    }, 2000);
  };

  const handleCallContact = (contact: EmergencyContact) => {
    alert(`正在拨打 ${contact.name}：${contact.phone}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-danger-600 via-danger-700 to-danger-800 overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern bg-[size:24px_24px] opacity-20" />
          <div className="absolute -top-32 -right-20 w-80 h-80 bg-danger-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-warning-500/20 rounded-full blur-3xl" />
        </div>
        <PageHeader
          title="一键求助"
          showBack
          gradient={false}
          className="!bg-transparent"
        />
      </div>

      <div className="px-4 pb-6 space-y-4 -mt-4 relative z-10">
        <Card className="overflow-hidden border-0 shadow-xl p-6">
          <div className="flex flex-col items-center py-4">
            <div className="relative mb-6">
              {countdown !== null && countdown > 0 && (
                <>
                  <div className="absolute -inset-8 bg-danger-500/20 rounded-full animate-ping" style={{ animationDuration: '1s' }} />
                  <div className="absolute -inset-16 bg-danger-500/10 rounded-full animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }} />
                  <div className="absolute -inset-24 bg-danger-500/5 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.4s' }} />
                </>
              )}
              <button
                onClick={handleSOSClick}
                disabled={isSending}
                className={cn(
                  'relative w-44 h-44 rounded-full flex flex-col items-center justify-center',
                  'shadow-2xl transition-all duration-300 active:scale-95',
                  'bg-gradient-to-br from-danger-500 via-danger-600 to-danger-700',
                  'shadow-danger-500/50',
                  isSending && 'opacity-70 cursor-not-allowed',
                  countdown !== null && countdown > 0 && 'animate-pulse'
                )}
              >
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
                {countdown !== null && countdown > 0 ? (
                  <>
                    <div className="relative text-white">
                      <div className="text-6xl font-bold mb-1">{countdown}</div>
                      <div className="text-sm opacity-90 font-medium">再次点击取消</div>
                    </div>
                  </>
                ) : isSending ? (
                  <div className="relative text-white flex flex-col items-center">
                    <Send className="w-10 h-10 mb-2 animate-bounce" />
                    <div className="text-sm font-medium">发送中...</div>
                  </div>
                ) : (
                  <div className="relative text-white flex flex-col items-center">
                    <ShieldAlert className="w-16 h-16 mb-2" strokeWidth={2} />
                    <div className="text-3xl font-bold tracking-wider">SOS</div>
                    <div className="text-xs opacity-80 mt-1">紧急求助</div>
                  </div>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-600 text-center max-w-xs">
              点击上方按钮将立即向所有紧急联系人发送求助信息
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-danger-600" />
            紧急联系人
          </h3>
          <div className="space-y-3">
            {emergencyContacts.map((contact) => {
              const Icon = contact.icon;
              return (
                <div
                  key={contact.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className={cn(
                    'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center',
                    contact.bg
                  )}>
                    <Icon className={cn('w-6 h-6', contact.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{contact.name}</span>
                      <Tag label={contact.position} color="gray" />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <Phone className="w-3 h-3" />
                      <span className="font-mono">{contact.phone}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCallContact(contact)}
                    className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-success-500 to-success-600 text-white shadow-md shadow-success-500/25 hover:from-success-600 hover:to-success-700 active:scale-95 transition-all flex items-center justify-center"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-600" />
            求助信息
          </h3>
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-primary-50 to-success-50 rounded-xl p-4 border border-primary-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary-600" />
                </div>
                <span className="text-xs font-medium text-primary-700">当前位置（自动获取）</span>
              </div>
              <p className="text-sm text-gray-800 font-medium mb-1 pl-10">{locationAddress}</p>
              {currentPosition && (
                <p className="text-[11px text-gray-500 font-mono pl-10">
                  {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-2 block">
                备注信息（可选）
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="请输入补充说明，例如：设施损坏、人员受伤等..."
                className="w-full h-24 px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl resize-none focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition-all placeholder:text-gray-400"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  autoRecord
                    ? 'bg-gradient-to-br from-danger-100 to-danger-50'
                    : 'bg-gray-100'
                )}>
                  <Mic2 className={cn('w-5 h-5', autoRecord ? 'text-danger-600' : 'text-gray-400')} />
                </div>
                <div>
                  <div className={cn('text-sm font-medium', autoRecord ? 'text-gray-900' : 'text-gray-500')}>
                    自动录音
                  </div>
                  <div className="text-[11px text-gray-500">
                    求助时自动启动后台录音
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAutoRecord(!autoRecord)}
                className={cn(
                  'relative w-12 h-7 rounded-full transition-all duration-300',
                  autoRecord ? 'bg-danger-500' : 'bg-gray-300'
                )}
              >
                <div className={cn(
                  'absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300',
                  autoRecord ? 'left-[22px]' : 'left-0.5'
                )} />
              </button>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-warning-600" />
            求助记录
          </h3>
          <div className="relative pl-4">
              <div className="absolute left-1.5 top-1.5 bottom-1.5 w-px bg-gray-100" />
              {mockHelpRecords.map((record, index) => (
                <div key={record.id} className="relative pb-5 last:pb-0">
                  <div className="absolute -left-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm bg-gradient-to-br from-primary-500 to-primary-600" />
                  <div className="bg-gray-50 rounded-xl p-3 ml-2 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Tag label={record.type} color={
                          record.type === '设施异常' ? 'orange' :
                          record.type === '突发情况' ? 'pink' : 'blue'
                        } />
                        <StatusBadge
                          label={getStatusLabel(record.status)}
                          variant={getStatusVariant(record.status)}
                          size="sm"
                        />
                      </div>
                      <span className="text-[10px text-gray-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {relativeTime(record.time)}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-gray-600 mb-1.5">
                      <MapPin className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                      <span>{record.location}</span>
                    </div>
                    {record.remark && (
                      <div className="flex items-start gap-2 text-xs text-gray-500">
                        <AlertTriangle className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                        <span>{record.remark}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-[11px text-gray-500">
                        <User className="w-3 h-3" />
                        <span>已通知 {record.notifiedCount} 位联系人</span>
                      </div>
                      <button className="text-[11px] text-primary-600 flex items-center gap-0.5 hover:text-primary-700 font-medium">
                        查看详情
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        </Card>

        <div className="bg-gradient-to-r from-danger-50 via-warning-50 to-danger-50 rounded-xl p-4 border border-danger-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-danger-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800 mb-0.5">温馨提示</p>
              <p className="text-[11px text-gray-600 leading-relaxed">
                求助将自动发送您的实时位置给紧急联系人，并启动后台录音，确保您的安全得到最大保障。
              </p>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="求助已发送"
      >
        <div className="space-y-5">
          <div className="flex flex-col items-center py-2">
            <div className="relative mb-4">
              <div className="absolute -inset-4 bg-success-500/20 rounded-full animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center shadow-2xl shadow-success-500/50">
                <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">求助发送成功</h3>
            <p className="text-sm text-gray-500">紧急联系人正在赶来的路上</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">通知联系人</span>
              <span className="text-gray-800 font-semibold">{notifiedContacts} 位</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">位置共享</span>
              <span className="text-success-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                已开启
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">后台录音</span>
              <span className={cn(
                'font-medium flex items-center gap-1',
                autoRecord ? 'text-success-600' : 'text-gray-400'
              )}>
                {autoRecord ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    录音中
                  </>
                ) : (
                  '未开启'
                )}
              </span>
            </div>
            <Divider />
            <div className="flex items-start justify-between text-sm">
              <span className="text-gray-500 shrink-0">当前位置</span>
              <span className="text-gray-800 text-right ml-4 max-w-[200px]">{locationAddress}</span>
            </div>
            {remark && (
              <div className="flex items-start justify-between text-sm">
                <span className="text-gray-500 shrink-0">备注信息</span>
                <span className="text-gray-800 text-right ml-4 max-w-[200px]">{remark}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2">
              {emergencyContacts.slice(0, 4).map((contact) => {
                const Icon = contact.icon;
                return (
                  <div key={contact.id} className="flex flex-col items-center gap-1">
                    <div className={cn(
                      'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center',
                      contact.bg
                    )}>
                      <Icon className={cn('w-5 h-5', contact.color)} />
                    </div>
                    <span className="text-[10px] text-gray-600 text-center">{contact.name.slice(0, 3)}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px text-gray-500 text-center">
              已向以上联系人发送了您的求助信息
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              size="full"
              leftIcon={<Phone className="w-4 h-4" />}
              onClick={() => alert('正在拨打指挥中心...')}
            >
              呼叫指挥中心
            </Button>
            <Button
              variant="primary"
              size="full"
              onClick={() => setShowConfirmModal(false)}
            >
              我知道了
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
