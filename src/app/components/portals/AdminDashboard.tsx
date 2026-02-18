import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clearTokens, businessesApi, customersApi, subscriptionsApi, adminServiceTierApi, authApi, auditLogsApi, billingApi, formatPrice, formatLimit } from '@/lib/api';
import { kycApi, KycStatusResponse, KycReviewRequest } from '@/lib/api/kyc';
import type { BusinessResponse, PageResponse, ServiceTierResponse, AuditLogResponse } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/app/components/ui/command';
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
  CreditCardIcon,
  CheckIcon,
  RefreshIcon,
  ShieldIcon,
  XCircleIcon,
} from '@/app/components/icons/FinanceIcons';
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

// Generate human-readable description for audit log entries
const getAuditDescription = (log: AuditLogResponse): string => {
  const parseJson = (val?: string | null) => {
    if (!val) return {};
    try { return JSON.parse(val); } catch { return {}; }
  };
  const newVals = parseJson(log.auditLogNewValues);
  const oldVals = parseJson(log.auditLogOldValues);
  const entity = log.auditLogEntityName;
  const action = log.auditLogAction;

  switch (action) {
    case 'TIER_UPGRADE_INITIATED':
      return `Initiated upgrade to ${newVals.tierName || 'new tier'}${newVals.billingCycle ? ` (${newVals.billingCycle})` : ''}`;
    case 'TIER_UPGRADE_ACTIVATED':
      return `Tier upgrade activated${newVals.periodEnd ? ` — valid until ${new Date(newVals.periodEnd).toLocaleDateString()}` : ''}`;
    case 'TIER_CANCELLED':
      return `Cancelled tier subscription${newVals.status ? ` — status set to ${newVals.status}` : ''}`;
    case 'SUSPEND':
      return `Business suspended${newVals.reason ? `: ${newVals.reason}` : ''}`;
    case 'ACTIVATE':
      return `Business activated`;
    case 'CREATE':
      if (entity === 'ServiceTier') return `Created service tier "${newVals.name || ''}"`;
      if (entity === 'BusinessSubscription') return `Created business subscription`;
      return `Created ${entity}`;
    case 'UPDATE':
      if (entity === 'ServiceTier') return `Updated service tier "${newVals.name || oldVals.name || ''}"`;
      if (entity === 'BusinessSubscription') return `Updated business subscription status to ${newVals.status || 'unknown'}`;
      return `Updated ${entity}`;
    case 'DELETE':
      if (entity === 'ServiceTier') return `Deleted service tier "${oldVals.name || ''}"`;
      if (entity === 'BusinessSubscription') return `Deleted business subscription`;
      return `Deleted ${entity}`;
    default:
      return `${action} on ${entity}`;
  }
};

// Format a number string with commas (e.g., "1000000" → "1,000,000")
const formatAmountInput = (value: string): string => {
  const cleaned = value.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
};
const stripCommas = (value: string): string => value.replace(/,/g, '');

type ActiveSection = 'overview' | 'businesses' | 'plans' | 'activity' | 'platform' | 'mandates' | 'kyc' | 'settings';

interface NavItem {
  id: ActiveSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: HomeIcon },
  { id: 'businesses', label: 'Businesses', icon: BuildingIcon },
  { id: 'plans', label: 'Service Tiers', icon: PackageIcon },
  { id: 'activity', label: 'Activity', icon: FileTextIcon },
  { id: 'platform', label: 'Platform Account', icon: CreditCardIcon },
  { id: 'mandates', label: 'Tier Mandates', icon: FileTextIcon },
  { id: 'kyc', label: 'KYC Review', icon: ShieldIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

// Map URL paths to section IDs
const sectionMap: Record<string, ActiveSection> = {
  'dashboard': 'overview',
  'businesses': 'businesses',
  'service-tiers': 'plans',
  'activity': 'activity',
  'platform': 'platform',
  'mandates': 'mandates',
  'kyc': 'kyc',
  'settings': 'settings',
};

export function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // API data states
  const [businesses, setBusinesses] = useState<BusinessResponse[]>([]);
  const [totalBusinessCount, setTotalBusinessCount] = useState(0);
  const [serviceTiers, setServiceTiers] = useState<ServiceTierResponse[]>([]);
  const [totalCustomerCount, setTotalCustomerCount] = useState(0);
  const [totalSubscriptionCount, setTotalSubscriptionCount] = useState(0);
  const [activityLogs, setActivityLogs] = useState<AuditLogResponse[]>([]);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const [activityTotalElements, setActivityTotalElements] = useState(0);

  // Modal states
  const [viewBusinessModal, setViewBusinessModal] = useState(false);
  const [suspendBusinessModal, setSuspendBusinessModal] = useState(false);
  const [activateBusinessModal, setActivateBusinessModal] = useState(false);
  const [createPlanModal, setCreatePlanModal] = useState(false);
  const [editPlanModal, setEditPlanModal] = useState(false);
  const [deletePlanModal, setDeletePlanModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessResponse | null>(null);
  const [selectedTier, setSelectedTier] = useState<ServiceTierResponse | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Password change form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [businessTotalPages, setBusinessTotalPages] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const [activityPageSize, setActivityPageSize] = useState(20);

  // Form states for service tier creation/editing
  const [tierFormName, setTierFormName] = useState('');
  const [tierFormDescription, setTierFormDescription] = useState('');
  const [tierFormMonthlyPrice, setTierFormMonthlyPrice] = useState('');
  const [tierFormAnnualPrice, setTierFormAnnualPrice] = useState('');
  const [tierFormMaxCustomers, setTierFormMaxCustomers] = useState('');
  const [tierFormMaxProducts, setTierFormMaxProducts] = useState('');
  const [tierFormMaxTeamMembers, setTierFormMaxTeamMembers] = useState('');
  const [tierFormFeatures, setTierFormFeatures] = useState('');
  const [tierFormIsPopular, setTierFormIsPopular] = useState(false);

  // Platform account states
  const [platformConfig, setPlatformConfig] = useState<any>(null);
  const [platBankCode, setPlatBankCode] = useState('');
  const [platBankName, setPlatBankName] = useState('');
  const [platAccountNumber, setPlatAccountNumber] = useState('');
  const [platAccountName, setPlatAccountName] = useState('');
  const [platBankOpen, setPlatBankOpen] = useState(false);
  const [platSaving, setPlatSaving] = useState(false);
  const [platRegistering, setPlatRegistering] = useState(false);
  const [platBanksList, setPlatBanksList] = useState<Array<{bankCode: string; bankName: string}>>([]);
  const [platLookingUp, setPlatLookingUp] = useState(false);
  const [platNotificationUrl, setPlatNotificationUrl] = useState('');

  // Sync URL to active section
  useEffect(() => {
    const path = location.pathname;
    const pathParts = path.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    const section = sectionMap[lastPart];
    if (section && section !== activeSection) {
      setActiveSection(section);
    }
  }, [location.pathname]);

  // Navigate to section URL when clicking sidebar
  const handleSectionChange = (sectionId: ActiveSection) => {
    const urlPath = sectionId === 'overview' ? 'dashboard'
      : sectionId === 'plans' ? 'service-tiers'
      : sectionId === 'platform' ? 'platform'
      : sectionId;
    navigate(`/admin/${urlPath}`);
    setActiveSection(sectionId);
  };

  // Fetch businesses
  const fetchBusinesses = async (page = 0, size = 10) => {
    try {
      const data = await businessesApi.findAll(page, size);
      setBusinesses(data.content);
      setTotalBusinessCount(data.totalElements);
      setBusinessTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to fetch businesses', err);
    }
  };

  // Fetch service tiers
  const fetchServiceTiers = async () => {
    try {
      const data = await adminServiceTierApi.listTiers();
      const sorted = [...data].sort((a, b) => (a.serviceTierSortOrder ?? 0) - (b.serviceTierSortOrder ?? 0));
      setServiceTiers(sorted);
    } catch (err) {
      console.error('Failed to fetch service tiers', err);
    }
  };

  const fetchActivityLogs = async (page = 0, size = 20) => {
    try {
      const response = await auditLogsApi.list(page, size);
      setActivityLogs(response.content);
      setActivityTotalPages(response.totalPages);
      setActivityTotalElements(response.totalElements);
    } catch (err) {
      console.error('Failed to fetch activity logs', err);
      setActivityLogs([]);
    }
  };

  // Fetch overview counts
  const fetchCounts = async () => {
    try {
      const [custData, subData] = await Promise.all([
        customersApi.findAll(0, 1),
        subscriptionsApi.findAll(0, 1),
      ]);
      setTotalCustomerCount(custData.totalElements);
      setTotalSubscriptionCount(subData.totalElements);
    } catch (err) {
      console.error('Failed to fetch counts', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchBusinesses(0, pageSize),
        fetchServiceTiers(),
        fetchCounts(),
      ]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Refetch businesses on page change
  useEffect(() => {
    fetchBusinesses(currentPage - 1, pageSize);
  }, [currentPage, pageSize]);

  // Fetch activity logs when activity section is active
  useEffect(() => {
    if (activeSection === 'activity') {
      fetchActivityLogs(activityPage - 1, activityPageSize);
    }
  }, [activeSection, activityPage, activityPageSize]);

  // Fetch platform config and banks when platform section is active
  useEffect(() => {
    if (activeSection === 'platform') {
      // Fetch platform config
      const fetchPlatformConfig = async () => {
        try {
          const { platformConfigApi } = await import('@/lib/api/platformConfig');
          const config = await platformConfigApi.getConfig();
          setPlatformConfig(config);
          if (config.platformConfigBankCode) setPlatBankCode(config.platformConfigBankCode);
          if (config.platformConfigAccountNumber) setPlatAccountNumber(config.platformConfigAccountNumber);
          if (config.platformConfigAccountName) setPlatAccountName(config.platformConfigAccountName);
          if (config.platformConfigNotificationUrl) setPlatNotificationUrl(config.platformConfigNotificationUrl);
        } catch { /* Not configured yet */ }
      };
      fetchPlatformConfig();

      // Fetch banks list
      if (platBanksList.length === 0) {
        billingApi.getBanks(0, 200).then((banksPage: any) => {
          setPlatBanksList(banksPage.content.map((b: any) => ({ bankCode: b.bankCode || '', bankName: b.bankName || '' })).sort((a: any, b: any) => a.bankName.localeCompare(b.bankName)));
        }).catch(() => {});
      }
    }
  }, [activeSection]);

  // Computed metrics
  const activeBusinesses = businesses.filter(b => b.businessStatus === 'ACTIVE' || b.businessStatus === 'Active').length;

  // Filter businesses by search
  const filteredBusinesses = businesses.filter(
    (business) =>
      (business.businessName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (business.businessEmail || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleViewBusiness = (business: BusinessResponse) => {
    setSelectedBusiness(business);
    setViewBusinessModal(true);
  };

  const handleSuspendBusiness = (business: BusinessResponse) => {
    setSelectedBusiness(business);
    setSuspendBusinessModal(true);
  };

  const handleActivateBusiness = (business: BusinessResponse) => {
    setSelectedBusiness(business);
    setActivateBusinessModal(true);
  };

  const confirmSuspendBusiness = async () => {
    if (!selectedBusiness) return;
    try {
      await businessesApi.suspend(selectedBusiness.businessId, suspendReason || undefined);
      toast.success(`Business "${selectedBusiness.businessName}" has been suspended`);
      setSuspendBusinessModal(false);
      setSuspendReason('');
      fetchBusinesses(currentPage - 1, pageSize);
    } catch (err) {
      toast.error('Failed to suspend business');
    }
  };

  const confirmActivateBusiness = async () => {
    if (!selectedBusiness) return;
    try {
      await businessesApi.activate(selectedBusiness.businessId);
      toast.success(`Business "${selectedBusiness.businessName}" has been activated`);
      setActivateBusinessModal(false);
      fetchBusinesses(currentPage - 1, pageSize);
    } catch (err) {
      toast.error('Failed to activate business');
    }
  };

  const handleCreatePlan = () => {
    setTierFormName('');
    setTierFormDescription('');
    setTierFormMonthlyPrice('');
    setTierFormAnnualPrice('');
    setTierFormMaxCustomers('');
    setTierFormMaxProducts('');
    setTierFormMaxTeamMembers('');
    setTierFormFeatures('');
    setTierFormIsPopular(false);
    setCreatePlanModal(true);
  };

  const handleEditPlan = (tier: ServiceTierResponse) => {
    setSelectedTier(tier);
    setTierFormName(tier.serviceTierName || '');
    setTierFormDescription(tier.serviceTierDescription || '');
    setTierFormMonthlyPrice(tier.serviceTierMonthlyPrice ? formatAmountInput(tier.serviceTierMonthlyPrice) : '');
    setTierFormAnnualPrice(tier.serviceTierYearlyPrice ? formatAmountInput(tier.serviceTierYearlyPrice) : '');
    setTierFormMaxCustomers(tier.serviceTierMaxCustomers?.toString() || '');
    setTierFormMaxProducts(tier.serviceTierMaxProducts?.toString() || '');
    setTierFormMaxTeamMembers(tier.serviceTierMaxTeamMembers?.toString() || '');
    setTierFormFeatures(tier.serviceTierFeatures || '');
    setTierFormIsPopular(tier.serviceTierIsPopular || false);
    setEditPlanModal(true);
  };

  const handleDeletePlan = (tier: ServiceTierResponse) => {
    setSelectedTier(tier);
    setDeletePlanModal(true);
  };

  const confirmCreatePlan = async () => {
    try {
      await adminServiceTierApi.createTier({
        serviceTierName: tierFormName,
        serviceTierDescription: tierFormDescription || undefined,
        serviceTierMonthlyPrice: stripCommas(tierFormMonthlyPrice) || '0',
        serviceTierYearlyPrice: tierFormAnnualPrice ? stripCommas(tierFormAnnualPrice) : undefined,
        serviceTierMaxCustomers: tierFormMaxCustomers ? parseInt(tierFormMaxCustomers) : undefined,
        serviceTierMaxProducts: tierFormMaxProducts ? parseInt(tierFormMaxProducts) : undefined,
        serviceTierMaxTeamMembers: tierFormMaxTeamMembers ? parseInt(tierFormMaxTeamMembers) : undefined,
        serviceTierFeatures: tierFormFeatures || undefined,
        serviceTierIsPopular: tierFormIsPopular,
        serviceTierStatus: 'ACTIVE',
      });
      toast.success(`Service tier "${tierFormName}" has been created`);
      setCreatePlanModal(false);
      fetchServiceTiers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create service tier');
    }
  };

  const confirmEditPlan = async () => {
    if (!selectedTier?.serviceTierId) return;
    try {
      await adminServiceTierApi.updateTier(selectedTier.serviceTierId, {
        serviceTierName: tierFormName,
        serviceTierDescription: tierFormDescription || undefined,
        serviceTierMonthlyPrice: stripCommas(tierFormMonthlyPrice) || '0',
        serviceTierYearlyPrice: tierFormAnnualPrice ? stripCommas(tierFormAnnualPrice) : undefined,
        serviceTierMaxCustomers: tierFormMaxCustomers ? parseInt(tierFormMaxCustomers) : undefined,
        serviceTierMaxProducts: tierFormMaxProducts ? parseInt(tierFormMaxProducts) : undefined,
        serviceTierMaxTeamMembers: tierFormMaxTeamMembers ? parseInt(tierFormMaxTeamMembers) : undefined,
        serviceTierFeatures: tierFormFeatures || undefined,
        serviceTierIsPopular: tierFormIsPopular,
      });
      toast.success(`Service tier "${tierFormName}" has been updated`);
      setEditPlanModal(false);
      fetchServiceTiers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update service tier');
    }
  };

  const confirmDeletePlan = async () => {
    if (!selectedTier?.serviceTierId) return;
    try {
      await adminServiceTierApi.deleteTier(selectedTier.serviceTierId);
      toast.success(`Service tier "${selectedTier.serviceTierName}" has been deleted`);
      setDeletePlanModal(false);
      fetchServiceTiers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete service tier');
    }
  };

  const handleLogout = () => {
    clearTokens();
    toast.success('Logged out successfully');
    window.location.href = '/';
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to change password');
    }
  };

  // Helper to parse features string into array for display
  const parseFeatures = (features: string | null): string[] => {
    if (!features) return [];
    return features.split(/[,\n]/).map(f => f.trim()).filter(f => f.length > 0);
  };

  // Overview Section
  const OverviewSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Businesses"
          value={totalBusinessCount}
          icon={BuildingIcon}
          iconColor="text-blue-600"
        />
        <MetricCard
          title="Total Customers"
          value={totalCustomerCount.toLocaleString()}
          icon={UsersIcon}
          iconColor="text-green-600"
        />
        <MetricCard
          title="Active Subscriptions"
          value={totalSubscriptionCount.toLocaleString()}
          icon={NairaIcon}
          iconColor="text-emerald-600"
        />
        <MetricCard
          title="Active Tiers"
          value={serviceTiers.filter(t => (t.serviceTierStatus || '').toUpperCase() === 'ACTIVE').length}
          icon={TrendingUpIcon}
          iconColor="text-purple-600"
        />
      </div>

      {/* Business Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Business Status</CardTitle>
            <p className="text-sm text-gray-500">Overview of registered businesses</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{activeBusinesses}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm font-medium text-gray-700">Suspended / Other</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{businesses.length - activeBusinesses}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Total</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{totalBusinessCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Service Tiers</CardTitle>
            <p className="text-sm text-gray-500">Platform tiers for businesses</p>
          </CardHeader>
          <CardContent>
            {serviceTiers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No service tiers created yet</p>
            ) : (
              <div className="space-y-3">
                {serviceTiers.map((tier) => (
                  <div key={tier.serviceTierId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tier.serviceTierName}</p>
                      <p className="text-xs text-gray-500">{tier.serviceTierStatus || 'N/A'}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {formatPrice(tier.serviceTierMonthlyPrice)}/mo
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Businesses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Recent Businesses</CardTitle>
          <p className="text-sm text-gray-500">Latest businesses on the platform</p>
        </CardHeader>
        <CardContent>
          {businesses.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No businesses yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.slice(0, 5).map((biz) => (
                    <tr key={biz.businessId} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{biz.businessName}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{biz.businessEmail}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={biz.businessStatus || 'Unknown'} type="general" />
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {biz.businessCreatedAt ? new Date(biz.businessCreatedAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Businesses Section
  const BusinessesSection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900">All Businesses</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchBusinesses(currentPage - 1, pageSize)} disabled={isLoading}>
                <RefreshIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search businesses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-gray-500 text-center py-8">Loading businesses...</p>
          ) : filteredBusinesses.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No businesses found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Business Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Service Tier</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">NDD Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Joined</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBusinesses.map((business) => (
                    <tr key={business.businessId} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{business.businessName}</div>
                          <div className="text-sm text-gray-500">{business.businessSlug}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {business.businessEmail}
                      </td>
                      <td className="py-3 px-4">
                        {business.serviceTierName ? (
                          <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {business.serviceTierName}
                            </span>
                            {business.serviceTierBillingCycle && (
                              <div className="text-xs text-gray-500 mt-0.5">{business.serviceTierBillingCycle}</div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">FREE</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={business.businessStatus || 'Unknown'} type="general" />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={business.businessNddSyncStatus || 'Pending'} type="general" />
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {business.businessCreatedAt ? new Date(business.businessCreatedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVerticalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewBusiness(business)}>
                              <EyeIcon className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              const status = (business.businessStatus || '').toUpperCase();
                              if (status === 'ACTIVE') {
                                handleSuspendBusiness(business);
                              } else {
                                handleActivateBusiness(business);
                              }
                            }}>
                              {(business.businessStatus || '').toUpperCase() === 'ACTIVE' ? (
                                <>
                                  <BanIcon className="h-4 w-4 mr-2" />
                                  Suspend Business
                                </>
                              ) : (
                                <>
                                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                                  Activate Business
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
          )}
          <TablePagination
            currentPage={currentPage}
            totalPages={businessTotalPages}
            pageSize={pageSize}
            totalItems={totalBusinessCount}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardContent>
      </Card>
    </div>
  );

  // Service Tiers Section (Plans for businesses to subscribe to)
  const PlansSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Service Tiers</h2>
          <p className="text-sm text-gray-500 mt-1">Subscription tiers that businesses subscribe to</p>
        </div>
        <Button onClick={handleCreatePlan} className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-md">
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Tier
        </Button>
      </div>
      {serviceTiers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No service tiers created yet. Click "Create Tier" to add one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {serviceTiers.map((tier) => {
            const features = parseFeatures(tier.serviceTierFeatures);
            return (
              <Card key={tier.serviceTierId} className={`relative flex flex-col hover:shadow-lg transition-shadow ${tier.serviceTierIsPopular ? 'ring-2 ring-purple-500' : ''}`}>
                {tier.serviceTierIsPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Popular
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{tier.serviceTierName}</CardTitle>
                      <div className="text-3xl font-bold text-gray-900 mt-2">
                        {formatPrice(tier.serviceTierMonthlyPrice)}
                        <span className="text-sm font-normal text-gray-600">/month</span>
                      </div>
                      {tier.serviceTierYearlyPrice && parseFloat(tier.serviceTierYearlyPrice) > 0 && (
                        <p className="text-sm text-gray-500">{formatPrice(tier.serviceTierYearlyPrice)}/year</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVerticalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditPlan(tier)}>
                          <EditIcon className="h-4 w-4 mr-2" />
                          Edit Tier
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeletePlan(tier)}>
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Delete Tier
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  {tier.serviceTierDescription && (
                    <p className="text-sm text-gray-600 mb-4">{tier.serviceTierDescription}</p>
                  )}
                  <div className="flex-1">
                    {features.length > 0 && (
                      <ul className="space-y-2 mb-4">
                        {features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="space-y-2 pt-2 border-t mt-auto">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Max Customers</span>
                      <span className="font-medium text-gray-700">{formatLimit(tier.serviceTierMaxCustomers)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Max Products</span>
                      <span className="font-medium text-gray-700">{formatLimit(tier.serviceTierMaxProducts)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Max Team Members</span>
                      <span className="font-medium text-gray-700">{formatLimit(tier.serviceTierMaxTeamMembers)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Status</span>
                      <StatusBadge status={tier.serviceTierStatus || 'Unknown'} type="general" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  // Activity Section
  const ActivitySection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Activity Logs</h2>
          <p className="text-sm text-gray-500 mt-1">Platform audit trail and activity monitoring</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchActivityLogs(activityPage - 1, activityPageSize)}>
          <RefreshIcon className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No activity logs found.</p>
              <p className="text-sm text-gray-400 mt-1">Activity logs will appear here as actions are performed.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activityLogs.map((log) => (
                      <tr key={log.auditLogId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(log.auditLogCreatedAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="font-medium">{getAuditDescription(log)}</div>
                          <div className="text-xs text-gray-400">{log.auditLogEntityName} · {log.auditLogAction}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {log.auditLogUserName || log.auditLogUserEmail || 'System'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={log.auditLogStatus} type="general" />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {log.auditLogIpAddress || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {activityTotalPages > 1 && (
                <div className="mt-4">
                  <TablePagination
                    currentPage={activityPage}
                    totalPages={activityTotalPages}
                    pageSize={activityPageSize}
                    totalElements={activityTotalElements}
                    onPageChange={setActivityPage}
                    onPageSizeChange={(newSize) => {
                      setActivityPageSize(newSize);
                      setActivityPage(1);
                    }}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Settings Section
  const SettingsSection = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Admin Settings</h2>
      <Card>
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

  // Platform Account Section
  const PlatformSection = () => (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Platform Account</h2>
        <p className="text-sm text-gray-500 mt-1">Configure Suscribly's bank account and NDD biller registration</p>
      </div>

      {/* Card 1: Platform Bank Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Platform Bank Account</CardTitle>
          <CardDescription>Configure Suscribly's bank account for receiving tier subscription payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bank</Label>
              <Popover open={platBankOpen} onOpenChange={setPlatBankOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={platBankOpen} className="w-full justify-between font-normal">
                    {platBankCode ? platBanksList.find(b => b.bankCode === platBankCode)?.bankName || 'Select bank' : 'Select bank'}
                    <SearchIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search bank..." />
                    <CommandList>
                      <CommandEmpty>No bank found.</CommandEmpty>
                      <CommandGroup>
                        {platBanksList.map((bank) => (
                          <CommandItem
                            key={bank.bankCode}
                            value={bank.bankName}
                            onSelect={() => {
                              setPlatBankCode(bank.bankCode);
                              setPlatBankName(bank.bankName);
                              setPlatAccountName('');
                              setPlatBankOpen(false);
                            }}
                          >
                            <CheckIcon className={`mr-2 h-4 w-4 ${platBankCode === bank.bankCode ? 'opacity-100' : 'opacity-0'}`} />
                            {bank.bankName}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input
                placeholder="0123456789"
                value={platAccountNumber}
                maxLength={10}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  setPlatAccountNumber(cleaned);
                  if (cleaned.length === 10 && platBankCode) {
                    setPlatLookingUp(true);
                    setPlatAccountName('');
                    billingApi.verifyBankAccount({ bankCode: platBankCode, accountNumber: cleaned })
                      .then((res: any) => setPlatAccountName(res.accountName || ''))
                      .catch(() => toast.error('Account lookup failed'))
                      .finally(() => setPlatLookingUp(false));
                  }
                }}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Account Name</Label>
              <Input
                value={platLookingUp ? 'Looking up...' : platAccountName}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notification URL</Label>
              <Input
                placeholder="https://api.suscribly.com/ndd/webhook/callback"
                value={platNotificationUrl}
                onChange={(e) => setPlatNotificationUrl(e.target.value)}
              />
              <p className="text-xs text-gray-400">The public URL where NIBSS will send mandate status webhooks</p>
            </div>
            <div className="md:col-span-2">
              <Button
                disabled={!platBankCode || !platAccountNumber || !platAccountName || platSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={async () => {
                  setPlatSaving(true);
                  try {
                    const { platformConfigApi } = await import('@/lib/api/platformConfig');
                    const updated = await platformConfigApi.createOrUpdate({
                      platformConfigBankCode: platBankCode,
                      platformConfigAccountNumber: platAccountNumber,
                      platformConfigAccountName: platAccountName,
                      platformConfigNotificationUrl: platNotificationUrl || undefined,
                    });
                    setPlatformConfig(updated);
                    toast.success('Platform account saved');
                  } catch (error: any) {
                    const msg = error?.response?.data?.message || 'Failed to save platform bank account';
                    toast.error(msg);
                  } finally {
                    setPlatSaving(false);
                  }
                }}
              >
                {platSaving ? 'Saving...' : 'Save Bank Account'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: NDD Biller Registration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">NDD Biller Registration</CardTitle>
          <CardDescription>Register Suscribly as an NDD biller with NIBSS for direct debit collections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {platformConfig?.platformConfigSyncStatus === 'SYNCED' ? (
              <div className="flex items-center gap-3">
                <Badge className="bg-green-100 text-green-800 border-green-200">Registered</Badge>
                {platformConfig?.platformConfigBillerNibssId && (
                  <span className="text-sm text-gray-500">
                    NIBSS ID: <span className="font-mono font-medium text-gray-700">{platformConfig.platformConfigBillerNibssId}</span>
                  </span>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {platformConfig?.platformConfigSyncStatus && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Status:</span>
                    <Badge variant="outline">{platformConfig.platformConfigSyncStatus}</Badge>
                  </div>
                )}
                <Button
                  disabled={!platformConfig?.platformConfigBankCode || platRegistering}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={async () => {
                    setPlatRegistering(true);
                    try {
                      const { platformConfigApi } = await import('@/lib/api/platformConfig');
                      const updated = await platformConfigApi.registerAsBiller();
                      setPlatformConfig(updated);
                      toast.success('Successfully registered as NDD biller');
                    } catch (error: any) {
                      const msg = error?.response?.data?.message || 'Failed to register as NDD biller';
                      toast.error(msg);
                    } finally {
                      setPlatRegistering(false);
                    }
                  }}
                >
                  {platRegistering ? 'Registering...' : 'Register as NDD Biller'}
                </Button>
                {!platformConfig?.platformConfigBankCode && (
                  <p className="text-sm text-gray-400">Save a bank account above before registering as an NDD biller.</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const TierMandatesSection = () => {
    const [tierMandates, setTierMandates] = useState<any[]>([]);
    const [loadingMandates, setLoadingMandates] = useState(true);
    const [activatingId, setActivatingId] = useState<string | null>(null);

    const fetchMandates = async () => {
      setLoadingMandates(true);
      try {
        const { tierUpgradeApi } = await import('@/lib/api/tierUpgrade');
        const data = await tierUpgradeApi.adminListMandates();
        setTierMandates(data);
      } catch {
        toast.error('Failed to load tier mandates');
      } finally {
        setLoadingMandates(false);
      }
    };

    useEffect(() => {
      fetchMandates();
    }, []);

    const handleActivate = async (mandateId: string) => {
      setActivatingId(mandateId);
      try {
        const { tierUpgradeApi } = await import('@/lib/api/tierUpgrade');
        await tierUpgradeApi.adminActivateMandate(mandateId);
        toast.success('Mandate activated successfully');
        // Refresh list
        const data = await tierUpgradeApi.adminListMandates();
        setTierMandates(data);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to activate mandate');
      } finally {
        setActivatingId(null);
      }
    };

    const getStatusColor = (status: string | null) => {
      switch (status?.toUpperCase()) {
        case 'ACTIVE': return 'bg-green-100 text-green-800';
        case 'PENDING': case 'PENDING_MANDATE': return 'bg-amber-100 text-amber-800';
        case 'CANCELLED': return 'bg-red-100 text-red-800';
        case 'PAST_DUE': return 'bg-orange-100 text-orange-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tier Mandates</h2>
            <p className="text-sm text-gray-500 mt-1">View and manage business tier subscription mandates</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchMandates} disabled={loadingMandates}>
            <RefreshIcon className={`h-4 w-4 mr-2 ${loadingMandates ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loadingMandates ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : tierMandates.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No tier mandates found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Business</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Tier</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Mandate Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Subscription</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tierMandates.map((m: any) => (
                      <tr key={m.businessSubscriptionId || m.mandateId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium">{m.businessName || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">{m.businessEmail}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{m.serviceTierName || 'N/A'}</Badge>
                        </td>
                        <td className="py-3 px-4 text-sm font-mono">
                          {m.mandateAmount ? `₦${parseFloat(m.mandateAmount).toLocaleString()}` : 'N/A'}
                          <span className="text-xs text-muted-foreground ml-1">/{m.billingCycle?.toLowerCase()}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(m.mandateStatus)}`}>
                            {m.mandateStatus || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(m.subscriptionStatus)}`}>
                            {m.subscriptionStatus || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {m.mandateStatus === 'PENDING' && m.subscriptionStatus === 'PENDING_MANDATE' && m.mandateId && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              disabled={activatingId === m.mandateId}
                              onClick={() => handleActivate(m.mandateId)}
                            >
                              {activatingId === m.mandateId ? 'Activating...' : 'Activate'}
                            </Button>
                          )}
                          {m.subscriptionStatus === 'ACTIVE' && (
                            <span className="text-xs text-green-600 font-medium">Active</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // ============ KYC Review Section ============
  const KycReviewSection = () => {
    const [queue, setQueue] = useState<KycStatusResponse[]>([]);
    const [isLoadingQueue, setIsLoadingQueue] = useState(false);
    const [reviewModal, setReviewModal] = useState(false);
    const [selectedKyc, setSelectedKyc] = useState<KycStatusResponse | null>(null);
    const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | 'RETURN_FOR_REVIEW'>('APPROVE');
    const [reviewNotes, setReviewNotes] = useState('');
    const [isReviewing, setIsReviewing] = useState(false);

    const fetchQueue = async () => {
      setIsLoadingQueue(true);
      try {
        const data = await kycApi.getKycReviewQueue();
        setQueue(data);
      } catch {
        toast.error('Failed to load KYC review queue');
      } finally {
        setIsLoadingQueue(false);
      }
    };

    useEffect(() => { fetchQueue(); }, []);

    const handleReview = async () => {
      if (!selectedKyc?.businessId) return;
      setIsReviewing(true);
      try {
        await kycApi.reviewKyc(selectedKyc.businessId, {
          action: reviewAction,
          reviewNotes: reviewNotes || undefined,
        });
        toast.success(`KYC ${reviewAction === 'APPROVE' ? 'approved' : reviewAction === 'REJECT' ? 'rejected' : 'returned'} successfully`);
        setReviewModal(false);
        setSelectedKyc(null);
        setReviewNotes('');
        fetchQueue();
      } catch (e: any) {
        toast.error(e.response?.data?.message || 'Review failed');
      } finally {
        setIsReviewing(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">KYC Review Queue</h2>
            <p className="text-sm text-muted-foreground mt-1">Review and approve business KYC submissions</p>
          </div>
          <Button variant="outline" onClick={fetchQueue} disabled={isLoadingQueue}>
            <RefreshIcon className={`h-4 w-4 ${isLoadingQueue ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            {isLoadingQueue ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : queue.length === 0 ? (
              <div className="text-center py-12">
                <ShieldIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No pending KYC submissions</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Business</th>
                      <th className="pb-3 font-medium">KYC Type</th>
                      <th className="pb-3 font-medium">Legal Name</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Submitted</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map((item) => (
                      <tr key={item.businessId} className="border-b hover:bg-gray-50">
                        <td className="py-3 font-medium">{item.businessName}</td>
                        <td className="py-3">
                          <Badge variant="outline">{item.kycType}</Badge>
                        </td>
                        <td className="py-3">{item.kycLegalName || '-'}</td>
                        <td className="py-3">
                          <Badge variant={item.kycStatus === 'KYC_PENDING_REVIEW' ? 'default' : 'secondary'} className={item.kycStatus === 'KYC_PENDING_REVIEW' ? 'bg-yellow-500' : 'bg-orange-500'}>
                            {item.kycStatus === 'KYC_PENDING_REVIEW' ? 'Pending' : 'Under Review'}
                          </Badge>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {item.kycSubmittedAt ? new Date(item.kycSubmittedAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="outline" onClick={() => { setSelectedKyc(item); setReviewModal(true); setReviewAction('APPROVE'); }}>
                              <EyeIcon className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 px-2" onClick={() => { setSelectedKyc(item); setReviewAction('APPROVE'); setReviewModal(true); }}>
                              <CheckCircleIcon className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="destructive" className="h-8 px-2" onClick={() => { setSelectedKyc(item); setReviewAction('REJECT'); setReviewModal(true); }}>
                              <XCircleIcon className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Modal */}
        <Dialog open={reviewModal} onOpenChange={setReviewModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Review KYC - {selectedKyc?.businessName}</DialogTitle>
              <DialogDescription>Review the business verification details</DialogDescription>
            </DialogHeader>
            {selectedKyc && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">KYC Type:</span> <span className="font-medium">{selectedKyc.kycType}</span></div>
                  <div><span className="text-muted-foreground">Number:</span> <span className="font-medium">{selectedKyc.kycNumber}</span></div>
                  <div><span className="text-muted-foreground">Legal Name:</span> <span className="font-medium">{selectedKyc.kycLegalName}</span></div>
                  <div><span className="text-muted-foreground">Verified:</span> <Badge className={selectedKyc.kycVerified ? 'bg-green-600' : 'bg-red-500'}>{selectedKyc.kycVerified ? 'Yes' : 'No'}</Badge></div>
                  <div><span className="text-muted-foreground">Bank:</span> <span className="font-medium">{selectedKyc.bankCode}</span></div>
                  <div><span className="text-muted-foreground">Account:</span> <span className="font-medium">{selectedKyc.accountNumber}</span></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Account Name:</span> <span className="font-medium">{selectedKyc.accountName}</span></div>
                </div>

                {selectedKyc.kycDocumentUrl && (
                  <div>
                    <button
                      className="text-sm text-blue-600 hover:underline"
                      onClick={async () => {
                        try {
                          const url = await kycApi.getKycDocumentUrl(selectedKyc.businessId!);
                          window.open(url, '_blank');
                        } catch {
                          toast.error('Failed to load document');
                        }
                      }}
                    >
                      View Document
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Action</Label>
                  <div className="flex gap-2">
                    {(['APPROVE', 'REJECT', 'RETURN_FOR_REVIEW'] as const).map((action) => (
                      <button
                        key={action}
                        onClick={() => setReviewAction(action)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                          reviewAction === action
                            ? action === 'APPROVE' ? 'bg-green-600 text-white border-green-600'
                              : action === 'REJECT' ? 'bg-red-600 text-white border-red-600'
                              : 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {action === 'RETURN_FOR_REVIEW' ? 'Return' : action.charAt(0) + action.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {(reviewAction === 'REJECT' || reviewAction === 'RETURN_FOR_REVIEW') && (
                  <div className="space-y-2">
                    <Label>{reviewAction === 'REJECT' ? 'Rejection Reason' : 'Notes for Business'}</Label>
                    <Textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder={reviewAction === 'REJECT' ? 'Explain why the KYC is rejected...' : 'Notes on what needs to be corrected...'}
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewModal(false)}>Cancel</Button>
              <Button
                onClick={handleReview}
                disabled={isReviewing || ((reviewAction === 'REJECT' || reviewAction === 'RETURN_FOR_REVIEW') && !reviewNotes.trim())}
                className={reviewAction === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : reviewAction === 'REJECT' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'}
              >
                {isReviewing ? 'Processing...' : reviewAction === 'APPROVE' ? 'Approve' : reviewAction === 'REJECT' ? 'Reject' : 'Return for Review'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection />;
      case 'businesses':
        return <BusinessesSection />;
      case 'plans':
        return <PlansSection />;
      case 'activity':
        return <ActivitySection />;
      case 'platform':
        return PlatformSection();
      case 'mandates':
        return <TierMandatesSection />;
      case 'kyc':
        return <KycReviewSection />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <OverviewSection />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader
        title="Admin Dashboard"
        subtitle="Manage all businesses and operations"
        userMenu={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 hover:opacity-80">
                <span className="text-sm font-medium text-gray-700">Admin</span>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-green-600 text-white flex items-center justify-center font-semibold shadow-md cursor-pointer">
                  A
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => handleSectionChange('settings')}>
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
        {/* Sidebar Navigation */}
        <aside className="w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 flex flex-col sticky top-16">
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="px-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
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

      {/* View Business Details Modal */}
      <Dialog open={viewBusinessModal} onOpenChange={setViewBusinessModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Business Details</DialogTitle>
            <DialogDescription>
              Complete information about {selectedBusiness?.businessName}
            </DialogDescription>
          </DialogHeader>
          {selectedBusiness && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Business Name</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedBusiness.businessName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedBusiness.businessEmail}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Phone</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedBusiness.businessPhone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={selectedBusiness.businessStatus || 'Unknown'} type="general" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Service Tier</Label>
                  <div className="mt-1">
                    {selectedBusiness.serviceTierName ? (
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {selectedBusiness.serviceTierName}
                        </span>
                        {selectedBusiness.serviceTierBillingCycle && (
                          <span className="text-xs text-gray-500 ml-2">{selectedBusiness.serviceTierBillingCycle}</span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">FREE</span>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Website</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedBusiness.businessWebsite || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Slug</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedBusiness.businessSlug || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">NDD Sync Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={selectedBusiness.businessNddSyncStatus || 'Pending'} type="general" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Joined Date</Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {selectedBusiness.businessCreatedAt ? new Date(selectedBusiness.businessCreatedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Bank Account</Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {selectedBusiness.businessAccountNumber
                      ? `${selectedBusiness.businessAccountName || ''} - ${selectedBusiness.businessAccountNumber}`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Address</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedBusiness.businessAddress || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewBusinessModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Business Modal */}
      <Dialog open={suspendBusinessModal} onOpenChange={setSuspendBusinessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Business</DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend {selectedBusiness?.businessName}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="suspend-reason">Reason for Suspension</Label>
              <Textarea
                id="suspend-reason"
                placeholder="Enter the reason for suspending this business..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendBusinessModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmSuspendBusiness}>Suspend Business</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate Business Modal */}
      <Dialog open={activateBusinessModal} onOpenChange={setActivateBusinessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate Business</DialogTitle>
            <DialogDescription>
              Are you sure you want to activate {selectedBusiness?.businessName}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivateBusinessModal(false)}>Cancel</Button>
            <Button onClick={confirmActivateBusiness}>Activate Business</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Service Tier Modal */}
      <Dialog open={createPlanModal} onOpenChange={setCreatePlanModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Service Tier</DialogTitle>
            <DialogDescription>
              Add a new service tier that businesses can subscribe to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tier-name">Tier Name</Label>
              <Input
                id="tier-name"
                placeholder="e.g., Enterprise"
                value={tierFormName}
                onChange={(e) => setTierFormName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="tier-description">Description</Label>
              <Textarea
                id="tier-description"
                placeholder="Describe what this tier includes..."
                value={tierFormDescription}
                onChange={(e) => setTierFormDescription(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tier-monthly-price">Monthly Price (₦)</Label>
                <Input
                  id="tier-monthly-price"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g., 50,000"
                  value={tierFormMonthlyPrice}
                  onChange={(e) => setTierFormMonthlyPrice(formatAmountInput(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="tier-annual-price">Yearly Price (₦, optional)</Label>
                <Input
                  id="tier-annual-price"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g., 500,000"
                  value={tierFormAnnualPrice}
                  onChange={(e) => setTierFormAnnualPrice(formatAmountInput(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tier-max-customers">Max Customers</Label>
                <Input
                  id="tier-max-customers"
                  type="number"
                  placeholder="Unlimited"
                  value={tierFormMaxCustomers}
                  onChange={(e) => setTierFormMaxCustomers(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="tier-max-products">Max Products</Label>
                <Input
                  id="tier-max-products"
                  type="number"
                  placeholder="Unlimited"
                  value={tierFormMaxProducts}
                  onChange={(e) => setTierFormMaxProducts(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="tier-max-team">Max Team Members</Label>
                <Input
                  id="tier-max-team"
                  type="number"
                  placeholder="Unlimited"
                  value={tierFormMaxTeamMembers}
                  onChange={(e) => setTierFormMaxTeamMembers(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="tier-features">Features (one per line)</Label>
              <Textarea
                id="tier-features"
                placeholder="e.g., Unlimited subscribers&#10;Custom branding&#10;API access&#10;Priority support"
                value={tierFormFeatures}
                onChange={(e) => setTierFormFeatures(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="tier-popular"
                type="checkbox"
                checked={tierFormIsPopular}
                onChange={(e) => setTierFormIsPopular(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="tier-popular" className="text-sm">Mark as Popular</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatePlanModal(false)}>Cancel</Button>
            <Button onClick={confirmCreatePlan}>Create Tier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Tier Modal */}
      <Dialog open={editPlanModal} onOpenChange={setEditPlanModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Service Tier</DialogTitle>
            <DialogDescription>
              Update details for {selectedTier?.serviceTierName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-tier-name">Tier Name</Label>
              <Input
                id="edit-tier-name"
                placeholder="e.g., Enterprise"
                value={tierFormName}
                onChange={(e) => setTierFormName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-tier-description">Description</Label>
              <Textarea
                id="edit-tier-description"
                placeholder="Describe what this tier includes..."
                value={tierFormDescription}
                onChange={(e) => setTierFormDescription(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-tier-monthly-price">Monthly Price (₦)</Label>
                <Input
                  id="edit-tier-monthly-price"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g., 50,000"
                  value={tierFormMonthlyPrice}
                  onChange={(e) => setTierFormMonthlyPrice(formatAmountInput(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-tier-annual-price">Yearly Price (₦, optional)</Label>
                <Input
                  id="edit-tier-annual-price"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g., 500,000"
                  value={tierFormAnnualPrice}
                  onChange={(e) => setTierFormAnnualPrice(formatAmountInput(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-tier-max-customers">Max Customers</Label>
                <Input
                  id="edit-tier-max-customers"
                  type="number"
                  placeholder="Unlimited"
                  value={tierFormMaxCustomers}
                  onChange={(e) => setTierFormMaxCustomers(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-tier-max-products">Max Products</Label>
                <Input
                  id="edit-tier-max-products"
                  type="number"
                  placeholder="Unlimited"
                  value={tierFormMaxProducts}
                  onChange={(e) => setTierFormMaxProducts(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-tier-max-team">Max Team Members</Label>
                <Input
                  id="edit-tier-max-team"
                  type="number"
                  placeholder="Unlimited"
                  value={tierFormMaxTeamMembers}
                  onChange={(e) => setTierFormMaxTeamMembers(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-tier-features">Features (one per line)</Label>
              <Textarea
                id="edit-tier-features"
                placeholder="e.g., Unlimited subscribers&#10;Custom branding&#10;API access"
                value={tierFormFeatures}
                onChange={(e) => setTierFormFeatures(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="edit-tier-popular"
                type="checkbox"
                checked={tierFormIsPopular}
                onChange={(e) => setTierFormIsPopular(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="edit-tier-popular" className="text-sm">Mark as Popular</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPlanModal(false)}>Cancel</Button>
            <Button onClick={confirmEditPlan}>Update Tier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Service Tier Modal */}
      <Dialog open={deletePlanModal} onOpenChange={setDeletePlanModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service Tier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the "{selectedTier?.serviceTierName}" tier? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePlanModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeletePlan}>Delete Tier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
