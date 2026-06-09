import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { Card, StatusBadge, Tag, Divider } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { formatDistance, cn } from '@/utils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ComposedChart,
} from 'recharts';
import {
  Settings,
  User,
  ClipboardList,
  Footprints,
  Building2,
  AlertTriangle,
  CheckSquare,
  FileWarning,
  PhoneCall,
  Database,
  HelpCircle,
  UserCog,
  Bell,
  Info,
  LogOut,
  ChevronRight,
  Trophy,
  TrendingUp,
  Award,
  Map,
  Target,
  Zap,
  Clock,
  Star,
} from 'lucide-react';

function RingProgress({
  percent,
  size = 72,
  strokeWidth = 7,
  color = '#10b981',
  bgColor = '#e5e7eb',
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>
          {Math.round(percent)}%
        </span>
      </div>
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function StatItem({ label, value, unit, icon, color, bgColor }: StatItemProps) {
  return (
    <div className="flex flex-col items-center p-3">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-2', bgColor, color)}>
        {icon}
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-xl font-bold text-gray-900">{value}</span>
        {unit && <span className="text-xs text-gray-500">{unit}</span>}
      </div>
      <span className="text-xs text-gray-500 mt-0.5">{label}</span>
    </div>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick?: () => void;
  iconColor?: string;
  iconBg?: string;
}

function MenuItem({ icon, label, badge, onClick, iconColor = 'text-primary-600', iconBg = 'bg-primary-50' }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', iconBg, iconColor)}>
          {icon}
        </div>
        <span className="text-sm text-gray-800">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge !== undefined && badge > 0 && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-danger-500 text-white text-[11px] font-medium">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </button>
  );
}

interface MenuGroupProps {
  title: string;
  children: React.ReactNode;
}

function MenuGroup({ title, children }: MenuGroupProps) {
  return (
    <div className="mb-3">
      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {title}
      </div>
      <Card className="mx-4 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {children}
        </div>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const performance = useAppStore((s) => s.performance);
  const messages = useAppStore((s) => s.messages);
  const hazardReports = useAppStore((s) => s.hazardReports);
  const pendingSyncQueue = useAppStore((s) => s.pendingSyncQueue);

  const unreadCount = messages.filter((m) => !m.isRead).length;
  const pendingRectification = hazardReports.filter(
    (h) => h.status === 'rechecking'
  ).length;

  const radarData = performance
    ? [
        { subject: '任务完成率', A: performance.completionRate, fullMark: 100 },
        { subject: '响应速度', A: 88, fullMark: 100 },
        { subject: '上报质量', A: 91, fullMark: 100 },
        { subject: '里程达标', A: 85, fullMark: 100 },
        { subject: '整改效率', A: 89, fullMark: 100 },
      ]
    : [];

  const trendData = performance?.dailyRecords.slice(-30).map((r) => ({
    date: r.date,
    tasks: r.tasks,
    distance: Math.round(r.distance / 100) / 10,
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      <div className="relative">
        <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 pb-28 overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern bg-[size:24px_24px] opacity-20" />
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-twin-cyan/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary-500/20 rounded-full blur-2xl" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-gradient-to-br from-twin-cyan/15 to-primary-400/10 rounded-full blur-3xl" />

          <div className="relative px-4 pt-safe">
            <div className="flex items-center justify-between h-12">
              <div>
                <h1 className="text-lg font-bold text-white">个人中心</h1>
                {user && (
                  <p className="text-xs text-primary-100/70 mt-0.5">
                    您好，{user.name} · {user.department}
                  </p>
                )}
              </div>
              <button
                onClick={() => console.log('进入设置')}
                className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-all active:scale-95"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-16 relative z-10">
          <Card className="p-5 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30 ring-4 ring-white">
                  <User className="w-8 h-8 text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 truncate">
                      {user?.name || '未登录'}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Tag label="网格员" color="blue" />
                      {performance && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-md border border-amber-200">
                          <Trophy className="w-3 h-3 text-amber-500" />
                          <span className="text-[11px] font-medium text-amber-700">
                            本月 {performance.rank}/{performance.totalInspectors}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="text-gray-400 shrink-0 w-14">工号</span>
                    <span className="font-mono">{user?.employeeNo || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="text-gray-400 shrink-0 w-14">部门</span>
                    <span className="truncate">{user?.department || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="text-gray-400 shrink-0 w-14">电话</span>
                    <span>{user?.phone || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="px-4 mt-4">
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">本月数据概览</h3>
            </div>
            <StatusBadge label="实时同步" variant="success" pulse />
          </div>

          <div className="grid grid-cols-4 gap-1 mb-4 bg-gray-50 rounded-2xl p-2">
            <StatItem
              label="巡查里程"
              value={performance ? formatDistance(performance.totalDistance).replace('km', '').trim() : '0'}
              unit="km"
              icon={<Map className="w-5 h-5" />}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <div className="flex flex-col items-center p-3">
              <RingProgress
                percent={performance?.completionRate || 0}
                size={48}
                strokeWidth={5}
                color="#10b981"
              />
              <span className="text-xs text-gray-500 mt-1.5">完成率</span>
            </div>
            <StatItem
              label="隐患上报"
              value={String(performance?.hazardReports || 0)}
              unit="件"
              icon={<AlertTriangle className="w-5 h-5" />}
              color="text-warning-600"
              bgColor="bg-warning-50"
            />
            <StatItem
              label="紧急隐患"
              value={String(performance?.criticalHazards || 0)}
              unit="件"
              icon={<Zap className="w-5 h-5" />}
              color="text-danger-600"
              bgColor="bg-danger-50"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-success-50/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="w-3.5 h-3.5 text-success-600" />
                <span className="text-xs text-success-700 font-medium">任务总数</span>
              </div>
              <div className="text-lg font-bold text-success-700">
                {performance?.totalTasks || 0}
              </div>
            </div>
            <div className="text-center p-3 rounded-xl bg-primary-50/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckSquare className="w-3.5 h-3.5 text-primary-600" />
                <span className="text-xs text-primary-700 font-medium">已完成</span>
              </div>
              <div className="text-lg font-bold text-primary-700">
                {performance?.completedTasks || 0}
              </div>
            </div>
            <div className="text-center p-3 rounded-xl bg-violet-50/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-violet-600" />
                <span className="text-xs text-violet-700 font-medium">平均响应</span>
              </div>
              <div className="text-lg font-bold text-violet-700">
                {performance?.avgResponseTime || 0}
                <span className="text-xs font-normal ml-0.5">分钟</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-twin-cyan to-primary-500 flex items-center justify-center">
                <Footprints className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">近30天巡查趋势</h3>
            </div>
          </div>

          <div className="h-48 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  interval={4}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'tasks' ? `${value} 项` : `${value} km`,
                    name === 'tasks' ? '任务数' : '里程',
                  ]}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  formatter={(value) => (value === 'tasks' ? '任务数' : '里程(km)')}
                />
                <Bar
                  yAxisId="left"
                  dataKey="tasks"
                  name="tasks"
                  fill="url(#barGradient)"
                  radius={[4, 4, 0, 0]}
                  barSize={14}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="distance"
                  name="distance"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={{ fill: '#06b6d4', r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">绩效雷达</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-amber-600 font-medium">综合优秀</span>
            </div>
          </div>

          <div className="h-56 -mx-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 9, fill: '#9ca3af' }}
                  axisLine={false}
                  tickCount={5}
                />
                <Radar
                  name="绩效评分"
                  dataKey="A"
                  stroke="#2563eb"
                  fill="url(#radarGradient)"
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value}分`, '得分']}
                />
                <defs>
                  <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Divider label="功能菜单" className="mx-4 my-2" />

      <MenuGroup title="巡查记录">
        <MenuItem
          icon={<ClipboardList className="w-4.5 h-4.5" />}
          label="我的任务"
          onClick={() => navigate('/')}
        />
        <MenuItem
          icon={<Footprints className="w-4.5 h-4.5" />}
          label="轨迹回放"
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <MenuItem
          icon={<Building2 className="w-4.5 h-4.5" />}
          label="设施巡检记录"
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
      </MenuGroup>

      <MenuGroup title="隐患管理">
        <MenuItem
          icon={<FileWarning className="w-4.5 h-4.5" />}
          label="我的上报"
          badge={hazardReports.length}
          onClick={() => navigate('/report')}
          iconColor="text-warning-600"
          iconBg="bg-warning-50"
        />
        <MenuItem
          icon={<CheckSquare className="w-4.5 h-4.5" />}
          label="整改复查"
          badge={pendingRectification}
          onClick={() => navigate('/rectification')}
          iconColor="text-success-600"
          iconBg="bg-success-50"
        />
        <MenuItem
          icon={<AlertTriangle className="w-4.5 h-4.5" />}
          label="重复隐患"
          iconColor="text-danger-600"
          iconBg="bg-danger-50"
        />
      </MenuGroup>

      <MenuGroup title="工具">
        <MenuItem
          icon={<PhoneCall className="w-4.5 h-4.5" />}
          label="一键求助"
          onClick={() => navigate('/help')}
          iconColor="text-danger-600"
          iconBg="bg-danger-50"
        />
        <MenuItem
          icon={<Database className="w-4.5 h-4.5" />}
          label="离线数据管理"
          badge={pendingSyncQueue.length}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <MenuItem
          icon={<HelpCircle className="w-4.5 h-4.5" />}
          label="帮助中心"
          iconColor="text-gray-600"
          iconBg="bg-gray-100"
        />
      </MenuGroup>

      <MenuGroup title="设置">
        <MenuItem
          icon={<UserCog className="w-4.5 h-4.5" />}
          label="账号设置"
          iconColor="text-primary-600"
          iconBg="bg-primary-50"
        />
        <MenuItem
          icon={<Bell className="w-4.5 h-4.5" />}
          label="消息设置"
          badge={unreadCount}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <MenuItem
          icon={<Info className="w-4.5 h-4.5" />}
          label="关于我们"
          iconColor="text-gray-600"
          iconBg="bg-gray-100"
        />
      </MenuGroup>

      <div className="px-4 mt-4">
        <Button
          variant="outline"
          size="full"
          leftIcon={<LogOut className="w-4.5 h-4.5" />}
          className="text-gray-600 border-gray-200"
          onClick={() => console.log('退出登录')}
        >
          退出登录
        </Button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-safe pt-3 bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent">
        <button
          onClick={() => navigate('/help')}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-danger-500 via-danger-600 to-red-600 text-white font-semibold shadow-lg shadow-danger-500/40 flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:shadow-xl hover:shadow-danger-500/50"
        >
          <PhoneCall className="w-5 h-5" />
          <span className="text-base">一键求助</span>
          <span className="px-2 py-0.5 rounded-lg bg-white/20 text-[11px] font-bold tracking-wider">
            SOS
          </span>
        </button>
      </div>
    </div>
  );
}
