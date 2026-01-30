import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { MetricCard } from '@/app/components/MetricCard';
import { StatusBadge } from '@/app/components/StatusBadges';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { PortalHeader } from '@/app/components/PortalHeader';
import { TablePagination } from '@/app/components/TablePagination';
import {
  BuildingIcon,
  NairaIcon,
  UsersIcon,
  TrendingUpIcon,
  SearchIcon,
  MoreVerticalIcon,
  EyeIcon,
  BanIcon,
  CheckCircleIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  LogOutIcon,
  KeyIcon,
  HomeIcon,
  SettingsIcon,
  FileTextIcon,
  PackageIcon,
} from '@/app/components/icons/FinanceIcons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { platformMetrics, tenants, activityLogs, platformPlans, chartData, customers, subscriptions, transactions } from '@/data/mockData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Textarea } from '@/app/components/ui/textarea';
import { toast } from 'sonner';

type ActiveSection = 'overview' | 'tenants' | 'plans' | 'activity' | 'settings';

interface NavItem {
  id: ActiveSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: HomeIcon },
  { id: 'tenants', label: 'Tenants', icon: BuildingIcon },
  { id: 'plans', label: 'Plans', icon: PackageIcon },
  { id: 'activity', label: 'Activity', icon: FileTextIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function PlatformAdminDashboard() {
  // Calculate actual platform metrics from data
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.status === 'Active').length;
  const totalCustomers = customers.length;
  const totalActiveSubscriptions = subscriptions.filter(s => s.status === 'Active').length;
  const successfulTransactions = transactions.filter(t => t.status === 'Success').length;
  const failedTransactions = transactions.filter(t => t.status === 'Failed').length;
  const totalRevenue = transactions
    .filter(t => t.status === 'Success')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalSubscribers = tenants.reduce((sum, t) => sum + t.activeSubscribers, 0);
  const successRate = successfulTransactions + failedTransactions > 0
    ? (successfulTransactions / (successfulTransactions + failedTransactions)) * 100
    : 0;

  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [viewTenantModal, setViewTenantModal] = useState(false);
  const [suspendTenantModal, setSuspendTenantModal] = useState(false);
  const [activateTenantModal, setActivateTenantModal] = useState(false);
  const [createPlanModal, setCreatePlanModal] = useState(false);
  const [editPlanModal, setEditPlanModal] = useState(false);
  const [deletePlanModal, setDeletePlanModal] = useState(false);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Password change form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activityPage, setActivityPage] = useState(1);
  const [activityPageSize, setActivityPageSize] = useState(10);

  // Form states for plan creation/editing
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planFeatures, setPlanFeatures] = useState('');
  const [planSubscribers, setPlanSubscribers] = useState('');
  const [planTransactions, setPlanTransactions] = useState('');

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter logic for activity logs
  const filteredActivityLogs = activityLogs.filter((log) =>
    log.action.toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
    log.user.toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
    log.details.toLowerCase().includes(activitySearchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredTenants.length / pageSize);
  const paginatedTenants = filteredTenants.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Pagination logic for activity logs
  const activityTotalPages = Math.ceil(filteredActivityLogs.length / activityPageSize);
  const paginatedActivityLogs = filteredActivityLogs.slice(
    (activityPage - 1) * activityPageSize,
    activityPage * activityPageSize
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const COLORS = ['#10b981', '#ef4444'];
  const PLAN_COLORS = ['#6b7280', '#3b82f6', '#8b5cf6', '#10b981'];

  // Calculate tenant distribution by plan
  const tenantsByPlan = platformPlans.map((plan, index) => ({
    name: plan.name,
    count: tenants.filter(t => t.plan === plan.name).length,
    fill: PLAN_COLORS[index % PLAN_COLORS.length],
  }));

  // Top tenants by revenue
  const topTenantsByRevenue = [...tenants]
    .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
    .slice(0, 5)
    .map(t => ({
      name: t.businessName.length > 12 ? t.businessName.substring(0, 12) + '...' : t.businessName,
      revenue: t.monthlyRevenue,
      subscribers: t.activeSubscribers,
    }));

  const handleViewTenant = (tenant: any) => {
    setSelectedTenant(tenant);
    setViewTenantModal(true);
  };

  const handleSuspendTenant = (tenant: any) => {
    setSelectedTenant(tenant);
    setSuspendTenantModal(true);
  };

  const handleActivateTenant = (tenant: any) => {
    setSelectedTenant(tenant);
    setActivateTenantModal(true);
  };

  const confirmSuspendTenant = () => {
    toast.success(`Tenant "${selectedTenant?.businessName}" has been suspended`);
    setSuspendTenantModal(false);
    setSuspendReason('');
  };

  const confirmActivateTenant = () => {
    toast.success(`Tenant "${selectedTenant?.businessName}" has been activated`);
    setActivateTenantModal(false);
  };

  const handleCreatePlan = () => {
    setPlanName('');
    setPlanPrice('');
    setPlanFeatures('');
    setPlanSubscribers('');
    setPlanTransactions('');
    setCreatePlanModal(true);
  };

  const handleEditPlan = (plan: any) => {
    setSelectedPlan(plan);
    setPlanName(plan.name);
    setPlanPrice(plan.price.toString());
    setPlanFeatures(plan.features.join('\n'));
    setPlanSubscribers(plan.limits.subscribers === -1 ? 'Unlimited' : plan.limits.subscribers.toString());
    setPlanTransactions(plan.limits.transactions === -1 ? 'Unlimited' : plan.limits.transactions.toString());
    setEditPlanModal(true);
  };

  const handleDeletePlan = (plan: any) => {
    setSelectedPlan(plan);
    setDeletePlanModal(true);
  };

  const confirmCreatePlan = () => {
    toast.success(`Plan "${planName}" has been created`);
    setCreatePlanModal(false);
  };

  const confirmEditPlan = () => {
    toast.success(`Plan "${planName}" has been updated`);
    setEditPlanModal(false);
  };

  const confirmDeletePlan = () => {
    toast.success(`Plan "${selectedPlan?.name}" has been deleted`);
    setDeletePlanModal(false);
  };

  const handleLogout = () => {
    toast.success('Logged out successfully');
    window.location.href = '/';
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    toast.success('Password changed successfully');
    setChangePasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Overview Section with KPI Metrics and Charts
  const OverviewSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Tenants"
          value={totalTenants}
          change={8.2}
          icon={BuildingIcon}
          iconColor="text-blue-600"
        />
        <MetricCard
          title="Total Subscribers"
          value={totalSubscribers.toLocaleString()}
          change={platformMetrics.growthRate}
          icon={UsersIcon}
          iconColor="text-green-600"
        />
        <MetricCard
          title="Platform Revenue"
          value={`₦${(totalRevenue / 1000000).toFixed(1)}M`}
          change={15.3}
          icon={NairaIcon}
          iconColor="text-emerald-600"
        />
        <MetricCard
          title="Success Rate"
          value={`${successRate.toFixed(1)}%`}
          change={2.1}
          icon={TrendingUpIcon}
          iconColor="text-purple-600"
        />
      </div>

      {/* Revenue Trend Chart - Full Width */}
      <Card className="">
        <CardHeader>
          <CardTitle className="text-gray-900">Platform Revenue Trend</CardTitle>
          <p className="text-sm text-gray-500">Total platform revenue over the past 12 months</p>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.revenue} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorRevenueStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  width={80}
                  tickFormatter={(value) => `₦${(value / 1000000).toFixed(0)}M`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [`₦${(value / 1000000).toFixed(1)}M`, 'Revenue']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="url(#colorRevenueStroke)"
                  strokeWidth={2.5}
                  fill="url(#colorRevenue)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="">
          <CardHeader>
            <CardTitle className="text-gray-900">Payment Success Rate</CardTitle>
            <p className="text-sm text-gray-500">Overall transaction success metrics</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.paymentSuccess}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {chartData.paymentSuccess.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Rate']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-8 mt-6">
                {chartData.paymentSuccess.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700">{entry.name}</span>
                      <span className="text-xs text-gray-500">{entry.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Tenants by Revenue */}
        <Card className="">
          <CardHeader>
            <CardTitle className="text-gray-900">Top Tenants by Revenue</CardTitle>
            <p className="text-sm text-gray-500">Highest performing businesses this month</p>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topTenantsByRevenue}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                  <XAxis
                    type="number"
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₦${(value / 1000000).toFixed(0)}M`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip
                    formatter={(value: number) => [`₦${(value / 1000000).toFixed(2)}M`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#3b82f6"
                    radius={[0, 4, 4, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total from top 5</span>
                <span className="font-semibold text-gray-900">
                  ₦{(topTenantsByRevenue.reduce((sum, t) => sum + t.revenue, 0) / 1000000).toFixed(1)}M
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Third Row - Tenant Distribution & Active Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant Distribution by Plan */}
        <Card className="">
          <CardHeader>
            <CardTitle className="text-gray-900">Tenants by Plan</CardTitle>
            <p className="text-sm text-gray-500">Distribution of tenants across subscription plans</p>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={tenantsByPlan}
                  margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [value, 'Tenants']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                    {tenantsByPlan.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
              {tenantsByPlan.map((plan, index) => (
                <div key={plan.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PLAN_COLORS[index % PLAN_COLORS.length] }}
                  />
                  <span className="text-xs text-gray-600">{plan.name}: {plan.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active vs Inactive Tenants */}
        <Card className="">
          <CardHeader>
            <CardTitle className="text-gray-900">Tenant Status Overview</CardTitle>
            <p className="text-sm text-gray-500">Active vs suspended tenants</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Active', value: activeTenants },
                        { name: 'Suspended', value: totalTenants - activeTenants },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={3}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [value, 'Tenants']}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-8 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Active</span>
                    <span className="text-xs text-gray-500">{activeTenants} tenants</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-amber-500" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Suspended</span>
                    <span className="text-xs text-gray-500">{totalTenants - activeTenants} tenants</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Tenants Section
  const TenantsSection = () => (
    <div className="space-y-6">
      <Card className="">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900">All Tenants</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tenants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Business Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Plan</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Subscribers</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Revenue</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Joined</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{tenant.businessName}</div>
                        <div className="text-sm text-gray-600">{tenant.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-gray-900">{tenant.plan}</span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={tenant.status} type="general" />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">
                      {tenant.activeSubscribers.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">
                      ₦{(tenant.monthlyRevenue / 1000000).toFixed(2)}M
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(tenant.joinedDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVerticalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewTenant(tenant)}>
                            <EyeIcon className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => tenant.status === 'Active' ? handleSuspendTenant(tenant) : handleActivateTenant(tenant)}>
                            {tenant.status === 'Active' ? (
                              <>
                                <BanIcon className="h-4 w-4 mr-2" />
                                Suspend Tenant
                              </>
                            ) : (
                              <>
                                <CheckCircleIcon className="h-4 w-4 mr-2" />
                                Activate Tenant
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredTenants.length}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardContent>
      </Card>
    </div>
  );

  // Plans Section
  const PlansSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Platform Plans</h2>
        <Button onClick={handleCreatePlan} className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-md">
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Plan
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {platformPlans.map((plan) => (
          <Card key={plan.id} className="relative  hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-gray-900 mt-2">
                    ₦{plan.price.toLocaleString()}
                    <span className="text-sm font-normal text-gray-600">/month</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVerticalIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditPlan(plan)}>
                      <EditIcon className="h-4 w-4 mr-2" />
                      Edit Plan
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => handleDeletePlan(plan)}>
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete Plan
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t">
                <div className="text-xs text-gray-500">
                  Subscribers: {plan.limits.subscribers === -1 ? 'Unlimited' : plan.limits.subscribers.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  Transactions: {plan.limits.transactions === -1 ? 'Unlimited' : plan.limits.transactions.toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Activity Section
  const ActivitySection = () => (
    <div className="space-y-6">
      <Card className="">
        <CardHeader>
          <CardTitle className="text-gray-900 mb-4">Activity Logs</CardTitle>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search activity logs..."
              value={activitySearchQuery}
              onChange={(e) => setActivitySearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Action</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Details</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">IP Address</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {paginatedActivityLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">{log.action}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-600 max-w-md truncate">{log.details}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-900">{log.user}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-600">{log.ipAddress}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-600">{log.timestamp}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={activityPage}
            totalPages={activityTotalPages}
            pageSize={activityPageSize}
            totalItems={filteredActivityLogs.length}
            onPageChange={setActivityPage}
            onPageSizeChange={setActivityPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );

  // Settings Section
  const SettingsSection = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Admin Settings</h2>
      <Card className="">
        <CardHeader>
          <CardTitle className="text-gray-900">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="current-password-settings">Current Password</Label>
              <Input
                id="current-password-settings"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password-settings">New Password</Label>
              <Input
                id="new-password-settings"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 8 characters)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password-settings">Confirm New Password</Label>
              <Input
                id="confirm-password-settings"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <div className="pt-4">
              <Button onClick={handleChangePassword} className="bg-blue-600 hover:bg-blue-700 text-white">
                Update Password
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection />;
      case 'tenants':
        return <TenantsSection />;
      case 'plans':
        return <PlansSection />;
      case 'activity':
        return <ActivitySection />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <OverviewSection />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader
        title="Platform Admin"
        subtitle="Manage all tenants and platform operations"
        userMenu={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 hover:opacity-80">
                <span className="text-sm font-medium text-gray-700">Rasheed Adeyemi</span>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-green-600 text-white flex items-center justify-center font-semibold shadow-md cursor-pointer">
                  RA
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setActiveSection('settings')}>
                <KeyIcon className="w-4 h-4 mr-2" />
                Change Password
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOutIcon className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <div className="flex">
        {/* Sidebar Navigation - HuaweiWorldAnalytics Style */}
        <aside className="w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 flex flex-col sticky top-16">
          {/* Navigation Section */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="px-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Bottom Section */}
          <div className="border-t border-gray-200 p-3 space-y-1">
            <button onClick={() => toast.info('Documentation coming soon')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span>Documentation</span>
            </button>
            <button onClick={() => toast.info('Compliance info coming soon')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              <span>Compliance</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-gradient-to-br from-slate-100/80 via-gray-100/50 to-blue-50/30 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="max-w-6xl">
            {renderActiveSection()}
          </div>
        </main>
      </div>

      {/* View Tenant Details Modal */}
      <Dialog open={viewTenantModal} onOpenChange={setViewTenantModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tenant Details</DialogTitle>
            <DialogDescription>
              Complete information about {selectedTenant?.businessName}
            </DialogDescription>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Business Name</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedTenant.businessName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedTenant.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Plan</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedTenant.plan}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={selectedTenant.status} type="general" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Active Subscribers</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedTenant.activeSubscribers.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Monthly Revenue</Label>
                  <p className="text-sm text-gray-900 mt-1">₦{selectedTenant.monthlyRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Joined Date</Label>
                  <p className="text-sm text-gray-900 mt-1">{new Date(selectedTenant.joinedDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTenantModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Tenant Modal */}
      <Dialog open={suspendTenantModal} onOpenChange={setSuspendTenantModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Tenant</DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend {selectedTenant?.businessName}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="suspend-reason">Reason for Suspension</Label>
              <Textarea
                id="suspend-reason"
                placeholder="Enter the reason for suspending this tenant..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendTenantModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmSuspendTenant}>Suspend Tenant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate Tenant Modal */}
      <Dialog open={activateTenantModal} onOpenChange={setActivateTenantModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate Tenant</DialogTitle>
            <DialogDescription>
              Are you sure you want to activate {selectedTenant?.businessName}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivateTenantModal(false)}>Cancel</Button>
            <Button onClick={confirmActivateTenant}>Activate Tenant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Plan Modal */}
      <Dialog open={createPlanModal} onOpenChange={setCreatePlanModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Plan</DialogTitle>
            <DialogDescription>
              Add a new platform plan for tenants to subscribe to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="plan-name">Plan Name</Label>
              <Input
                id="plan-name"
                placeholder="e.g., Enterprise"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="plan-price">Monthly Price (₦)</Label>
              <Input
                id="plan-price"
                type="number"
                placeholder="e.g., 50000"
                value={planPrice}
                onChange={(e) => setPlanPrice(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="plan-features">Features (one per line)</Label>
              <Textarea
                id="plan-features"
                placeholder="e.g., Unlimited subscribers&#10;Custom branding&#10;API access"
                value={planFeatures}
                onChange={(e) => setPlanFeatures(e.target.value)}
                className="mt-1"
                rows={5}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plan-subscribers">Subscriber Limit</Label>
                <Input
                  id="plan-subscribers"
                  placeholder="e.g., 10000 or Unlimited"
                  value={planSubscribers}
                  onChange={(e) => setPlanSubscribers(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="plan-transactions">Transaction Limit</Label>
                <Input
                  id="plan-transactions"
                  placeholder="e.g., 50000 or Unlimited"
                  value={planTransactions}
                  onChange={(e) => setPlanTransactions(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatePlanModal(false)}>Cancel</Button>
            <Button onClick={confirmCreatePlan}>Create Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Modal */}
      <Dialog open={editPlanModal} onOpenChange={setEditPlanModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>
              Update plan details for {selectedPlan?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-plan-name">Plan Name</Label>
              <Input
                id="edit-plan-name"
                placeholder="e.g., Enterprise"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-plan-price">Monthly Price (₦)</Label>
              <Input
                id="edit-plan-price"
                type="number"
                placeholder="e.g., 50000"
                value={planPrice}
                onChange={(e) => setPlanPrice(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-plan-features">Features (one per line)</Label>
              <Textarea
                id="edit-plan-features"
                placeholder="e.g., Unlimited subscribers&#10;Custom branding&#10;API access"
                value={planFeatures}
                onChange={(e) => setPlanFeatures(e.target.value)}
                className="mt-1"
                rows={5}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-plan-subscribers">Subscriber Limit</Label>
                <Input
                  id="edit-plan-subscribers"
                  placeholder="e.g., 10000 or Unlimited"
                  value={planSubscribers}
                  onChange={(e) => setPlanSubscribers(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-plan-transactions">Transaction Limit</Label>
                <Input
                  id="edit-plan-transactions"
                  placeholder="e.g., 50000 or Unlimited"
                  value={planTransactions}
                  onChange={(e) => setPlanTransactions(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPlanModal(false)}>Cancel</Button>
            <Button onClick={confirmEditPlan}>Update Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Modal */}
      <Dialog open={deletePlanModal} onOpenChange={setDeletePlanModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the "{selectedPlan?.name}" plan? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePlanModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeletePlan}>Delete Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal (kept for dropdown menu access) */}
      <Dialog open={changePasswordModal} onOpenChange={setChangePasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 8 characters)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePasswordModal(false)}>Cancel</Button>
            <Button onClick={handleChangePassword}>Change Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
