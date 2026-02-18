import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { MetricCard } from '@/app/components/MetricCard';
import { StatusBadge } from '@/app/components/StatusBadges';
import { Badge } from '@/app/components/ui/badge';
import { EmptyState } from '@/app/components/EmptyState';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Switch } from '@/app/components/ui/switch';
import { PortalHeader } from '@/app/components/PortalHeader';
import { TablePagination } from '@/app/components/TablePagination';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomers, usePlans, useSubscriptions, useMandates, useDashboardMetrics } from '@/hooks/useApi';
import { customersApi, plansApi, productsApi, subscriptionsApi, billingApi, businessesApi, settlementsApi, couponsApi, authApi, webhooksApi, formatPrice, formatLimit, CreateCustomerRequest, CreatePlanRequest, CreateSubscriptionRequest } from '@/lib/api';
import type { SettlementResponse, ProductResponse, TransactionResponse, WebhookResponse, CustomerSubscriptionStatusResponse } from '@/lib/api';
import {
  UsersIcon,
  NairaIcon,
  TrendingUpIcon,
  CalendarIcon,
  SearchIcon,
  PlusIcon,
  MoreVerticalIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  CreditCardIcon,
  FileTextIcon,
  UserPlusIcon,
  KeyIcon,
  WebhookIcon,
  PackageIcon,
  BanIcon,
  LogOutIcon,
  HomeIcon,
  SettingsIcon,
  BarChartIcon,
  StoreIcon,
  ShareIcon,
  MailIcon,
  PrinterIcon,
  CopyIcon,
  CheckIcon,
  RefreshIcon,
} from '@/app/components/icons/FinanceIcons';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Format a number string with commas (e.g., "1000000" → "1,000,000")
const formatAmountInput = (value: string): string => {
  const cleaned = value.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
};
const stripCommas = (value: string): string => value.replace(/,/g, '');
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/app/components/ui/sheet';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/app/components/ui/input-otp';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { BusinessKycOnboarding } from '@/app/components/auth/BusinessKycOnboarding';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/app/components/ui/command';
import { toast } from 'sonner';


type ActiveSection = 'overview' | 'products' | 'plans' | 'customers' | 'subscriptions' | 'active-subscribers' | 'mandates' | 'transactions' | 'coupons' | 'webhooks' | 'settings';

interface NavItem {
  id: ActiveSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: HomeIcon },
  { id: 'products', label: 'Products', icon: StoreIcon },
  { id: 'plans', label: 'Plans', icon: PackageIcon },
  { id: 'customers', label: 'Customers', icon: UsersIcon },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCardIcon },
  { id: 'active-subscribers', label: 'Active Subscribers', icon: TrendingUpIcon },
  { id: 'mandates', label: 'Mandates', icon: FileTextIcon },
  { id: 'transactions', label: 'Transactions', icon: NairaIcon },
  { id: 'coupons', label: 'Coupons', icon: BarChartIcon },
  { id: 'webhooks', label: 'Webhooks', icon: WebhookIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function BusinessDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();
  const { user, business, isAuthenticated, isLoading: authLoading, logout, refreshBusiness } = useAuth();

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  // State hooks - moved to top to comply with Rules of Hooks
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');

  // Sync URL to active section
  useEffect(() => {
    const path = location.pathname;
    const sectionMap: Record<string, ActiveSection> = {
      'dashboard': 'overview',
      'products': 'products',
      'plans': 'plans',
      'customers': 'customers',
      'subscriptions': 'subscriptions',
      'active-subscribers': 'active-subscribers',
      'mandates': 'mandates',
      'transactions': 'transactions',
      'coupons': 'coupons',
      'webhooks': 'webhooks',
      'settings': 'settings',
    };

    // Extract section from path (e.g., /business/slug/products -> products)
    const pathParts = path.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    const section = sectionMap[lastPart];

    if (section && section !== activeSection) {
      setActiveSection(section);
    }
  }, [location.pathname]);

  // Navigate to section URL when clicking sidebar
  const handleSectionChange = (sectionId: ActiveSection) => {
    const businessSlug = slug || business?.businessSlug;
    if (!businessSlug) return;

    const urlPath = sectionId === 'overview' ? 'dashboard' : sectionId;
    navigate(`/business/${businessSlug}/${urlPath}`);
    setActiveSection(sectionId);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [couponSearchQuery, setCouponSearchQuery] = useState('');
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

  // Pagination states
  const [productsPage, setProductsPage] = useState(1);
  const [productsPageSize, setProductsPageSize] = useState(10);
  const [couponsPage, setCouponsPage] = useState(1);
  const [couponsPageSize, setCouponsPageSize] = useState(10);
  const [teamPage, setTeamPage] = useState(1);
  const [teamPageSize, setTeamPageSize] = useState(10);
  const [customersPage, setCustomersPage] = useState(1);
  const [customersPageSize, setCustomersPageSize] = useState(10);
  const [subscriptionsPage, setSubscriptionsPage] = useState(1);
  const [subscriptionsPageSize, setSubscriptionsPageSize] = useState(10);
  const [mandatesPage, setMandatesPage] = useState(1);
  const [mandatesPageSize, setMandatesPageSize] = useState(10);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsPageSize, setTransactionsPageSize] = useState(10);
  const [activeSubsPage, setActiveSubsPage] = useState(1);
  const [activeSubsPageSize, setActiveSubsPageSize] = useState(10);

  // Modal states
  const [createPlanModal, setCreatePlanModal] = useState(false);
  const [editPlanModal, setEditPlanModal] = useState(false);
  const [deletePlanModal, setDeletePlanModal] = useState(false);
  // Products from backend
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  // Coupons from backend
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const teamMembers: any[] = [];
  const [settlements, setSettlements] = useState<SettlementResponse[]>([]);
  const [isLoadingSettlements, setIsLoadingSettlements] = useState(false);
  // Webhooks from backend
  const [businessWebhooks, setBusinessWebhooks] = useState<WebhookResponse[]>([]);
  const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(false);
  // Active Subscribers
  const [activeSubscribers, setActiveSubscribers] = useState<import('@/lib/api/subscriptions').ActiveSubscriberResponse[]>([]);
  const [isLoadingActiveSubscribers, setIsLoadingActiveSubscribers] = useState(false);
  const [activeSubsTotalPages, setActiveSubsTotalPages] = useState(1);
  // Tier Info
  const [tierInfo, setTierInfo] = useState<import('@/lib/api/serviceTiers').TierInfoResponse | null>(null);

  // Bank account settings states
  const [settBankCode, setSettBankCode] = useState('');
  const [settBankName, setSettBankName] = useState('');
  const [settAccountNumber, setSettAccountNumber] = useState('');
  const [settAccountName, setSettAccountName] = useState('');
  const [isLookingUpSettAccount, setIsLookingUpSettAccount] = useState(false);
  const [isSavingBankAccount, setIsSavingBankAccount] = useState(false);
  const [settBanksList, setSettBanksList] = useState<Array<{bankCode: string; bankName: string}>>([]);
  const [settBankOpen, setSettBankOpen] = useState(false);
  const [custBankOpen, setCustBankOpen] = useState(false);
  // Chart data computation moved after data fetching - see useMemo below

  const [addCustomerModal, setAddCustomerModal] = useState(false);
  const [viewCustomerModal, setViewCustomerModal] = useState(false);
  const [editCustomerModal, setEditCustomerModal] = useState(false);
  const [deleteCustomerModal, setDeleteCustomerModal] = useState(false);
  const [viewSubscriptionModal, setViewSubscriptionModal] = useState(false);
  const [cancelSubscriptionModal, setCancelSubscriptionModal] = useState(false);
  const [viewMandateModal, setViewMandateModal] = useState(false);
  const [cancelMandateModal, setCancelMandateModal] = useState(false);
  const [createCouponModal, setCreateCouponModal] = useState(false);
  const [editCouponModal, setEditCouponModal] = useState(false);
  const [deleteCouponModal, setDeleteCouponModal] = useState(false);
  const [inviteTeamModal, setInviteTeamModal] = useState(false);
  const [editTeamMemberModal, setEditTeamMemberModal] = useState(false);
  const [removeTeamMemberModal, setRemoveTeamMemberModal] = useState(false);
  const [regenerateKeysModal, setRegenerateKeysModal] = useState(false);
  const [addWebhookModal, setAddWebhookModal] = useState(false);
  const [editWebhookModal, setEditWebhookModal] = useState(false);
  const [deleteWebhookModal, setDeleteWebhookModal] = useState(false);
  const [testWebhookModal, setTestWebhookModal] = useState(false);
  const [createProductModal, setCreateProductModal] = useState(false);
  const [editProductModal, setEditProductModal] = useState(false);
  const [deleteProductModal, setDeleteProductModal] = useState(false);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [verificationModal, setVerificationModal] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancellingMandate, setIsCancellingMandate] = useState(false);
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);
  const [isDeletingCoupon, setIsDeletingCoupon] = useState(false);
  const [isAddingWebhook, setIsAddingWebhook] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const [availableTiers, setAvailableTiers] = useState<any[]>([]);
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState<any>(null);

  const [upgradeConfirmModal, setUpgradeConfirmModal] = useState(false);
  const [upgradeInProgress, setUpgradeInProgress] = useState(false);
  const [tierUpgradeResult, setTierUpgradeResult] = useState<any>(null);
  const [tierVerificationSheet, setTierVerificationSheet] = useState(false);
  const [downgradeConfirmModal, setDowngradeConfirmModal] = useState(false);
  const [downgradeInProgress, setDowngradeInProgress] = useState(false);
  const [platformAccount, setPlatformAccount] = useState<any>(null);
  const [tierPollingActive, setTierPollingActive] = useState(false);

  // Email OTP verification states
  const [emailOtpModal, setEmailOtpModal] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailOtpMasked, setEmailOtpMasked] = useState('');
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const [pendingCustomerData, setPendingCustomerData] = useState<any>(null);
  const [customerStatusModal, setCustomerStatusModal] = useState(false);
  const [customerStatusData, setCustomerStatusData] = useState<CustomerSubscriptionStatusResponse | null>(null);
  const [isCheckingCustomerStatus, setIsCheckingCustomerStatus] = useState(false);
  const [customerStatusName, setCustomerStatusName] = useState('');
  const tierPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Selected items
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [selectedMandate, setSelectedMandate] = useState<any>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState<any>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null);

  // Form states for Product
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productAmount, setProductAmount] = useState('');

  // Form states for Plan
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planAmount, setPlanAmount] = useState('');
  const [planFrequency, setPlanFrequency] = useState('Monthly');
  const [planTrialPeriod, setPlanTrialPeriod] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');

  // Form states for Customer
  const [customerName, setCustomerName] = useState('');
  const [customerLastName, setCustomerLastName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Bank account linking states for Add Customer
  const [linkBankAccount, setLinkBankAccount] = useState(false);
  const [customerBankCode, setCustomerBankCode] = useState('');
  const [customerBankName, setCustomerBankName] = useState('');
  const [customerAccountNumber, setCustomerAccountNumber] = useState('');
  const [customerAccountName, setCustomerAccountName] = useState('');
  const [isLookingUpAccount, setIsLookingUpAccount] = useState(false);
  const [banksList, setBanksList] = useState<Array<{bankId: string; bankCode: string; bankName: string}>>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);

  // Product/Plan selection states for Add Customer
  const [customerProductId, setCustomerProductId] = useState('');
  const [customerPlanId, setCustomerPlanId] = useState('');

  // Form states for Coupon CRUD
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState('Percentage');
  const [couponValue, setCouponValue] = useState('');
  const [couponLimit, setCouponLimit] = useState('');
  const [couponValidTo, setCouponValidTo] = useState('');

  // Coupon application (Add Customer sheet)
  const [applyCouponCode, setApplyCouponCode] = useState('');
  const [couponValidation, setCouponValidation] = useState<{valid: boolean; couponId?: string; discountAmount: number; finalAmount: number; message: string; couponCode?: string} | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Form states for Team Member
  const [teamMemberEmail, setTeamMemberEmail] = useState('');
  const [teamMemberRole, setTeamMemberRole] = useState('Admin');

  // Form states for Webhook
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvent, setWebhookEvent] = useState('payment.success');
  const [webhookSecret, setWebhookSecret] = useState('');

  // Other form states
  const [cancellationReason, setCancellationReason] = useState('');

  // Password change form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Mandates refresh state
  const [isRefreshingMandates, setIsRefreshingMandates] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    // Also check localStorage directly to avoid race conditions with React state
    const hasToken = !!localStorage.getItem('accessToken');

    // Only redirect if no token in localStorage AND not authenticated in state
    if (!authLoading && !isAuthenticated && !hasToken) {
      navigate('/business/login');
    }
  }, [authLoading, isAuthenticated, navigate, user, business]);

  // Fetch banks list on mount (needed for bank name resolution everywhere)
  useEffect(() => {
    const fetchBanks = async () => {
      if (banksList.length === 0) {
        setIsLoadingBanks(true);
        try {
          const banksPage = await billingApi.getBanks(0, 200);
          setBanksList(banksPage.content.map((b) => ({ bankId: b.bankId || '', bankCode: b.bankCode || '', bankName: b.bankName || '' })).sort((a, b) => a.bankName.localeCompare(b.bankName)));
        } catch (error) {
          console.error('Failed to fetch banks:', error);
        } finally {
          setIsLoadingBanks(false);
        }
      }
    };
    fetchBanks();
  }, []);

  // Fetch settlements and banks when settings section is active
  useEffect(() => {
    if (activeSection !== 'settings') return;

    const fetchSettlements = async () => {
      setIsLoadingSettlements(true);
      try {
        const page = await settlementsApi.findAll(0, 50);
        setSettlements(page.content);
      } catch {
        // No settlements yet is fine
        setSettlements([]);
      } finally {
        setIsLoadingSettlements(false);
      }
    };
    fetchSettlements();

    // Load banks for bank account settings
    if (settBanksList.length === 0) {
      billingApi.getBanks(0, 200).then((banksPage) => {
        setSettBanksList(banksPage.content.map((b) => ({ bankCode: b.bankCode || '', bankName: b.bankName || '' })).sort((a, b) => a.bankName.localeCompare(b.bankName)));
      }).catch(() => {});
    }

    // Pre-fill bank account from current business data
    if (business) {
      setSettBankCode(business.businessBankCode || '');
      setSettAccountNumber(business.businessAccountNumber || '');
      setSettAccountName(business.businessAccountName || '');
      // Find bank name from code
      if (business.businessBankCode && settBanksList.length > 0) {
        const found = settBanksList.find(b => b.bankCode === business.businessBankCode);
        setSettBankName(found?.bankName || '');
      }
    }
  }, [activeSection]);

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      if (!business?.businessId) return;
      setIsLoadingProducts(true);
      try {
        const page = await productsApi.findAll(0, 100);
        setProducts(page.content);
      } catch {
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [business?.businessId]);

  const refetchProducts = async () => {
    try {
      const page = await productsApi.findAll(0, 100);
      setProducts(page.content);
    } catch { /* ignore */ }
  };

  // Fetch tier info and available tiers
  useEffect(() => {
    const fetchTierInfo = async () => {
      if (!business?.businessId) return;
      try {
        const { businessTierApi: tierApi } = await import('@/lib/api/serviceTiers');
        const info = await tierApi.getMyTier();
        setTierInfo(info);
      } catch { /* ignore - may not have permission */ }
    };
    const fetchAvailableTiers = async () => {
      try {
        const { businessTierApi: tierApi } = await import('@/lib/api/serviceTiers');
        const tiers = await tierApi.listAvailableTiers();
        setAvailableTiers(tiers.filter((t: any) => t.serviceTierStatus === 'ACTIVE'));
      } catch { /* ignore */ }
    };
    const fetchPlatformAccount = async () => {
      try {
        const { tierUpgradeApi } = await import('@/lib/api/tierUpgrade');
        const account = await tierUpgradeApi.getPlatformAccount();
        setPlatformAccount(account);
      } catch { /* ignore */ }
    };
    fetchTierInfo();
    fetchAvailableTiers();
    fetchPlatformAccount();
  }, [business?.businessId]);

  // Tier upgrade polling - poll status after "I have sent the money"
  const stopTierPolling = useCallback(() => {
    if (tierPollingRef.current) {
      clearInterval(tierPollingRef.current);
      tierPollingRef.current = null;
    }
    setTierPollingActive(false);
  }, []);

  const startTierPolling = useCallback(() => {
    stopTierPolling();
    setTierPollingActive(true);
    tierPollingRef.current = setInterval(async () => {
      try {
        const { tierUpgradeApi } = await import('@/lib/api/tierUpgrade');
        const status = await tierUpgradeApi.getStatus();
        if (status.businessSubscriptionStatus === 'ACTIVE') {
          // Update result with active status
          setTierUpgradeResult((prev: any) => prev ? { ...prev, businessSubscriptionStatus: 'ACTIVE', mandateStatus: status.mandateStatus } : prev);
          stopTierPolling();
          toast.success('Your subscription has been activated!');
          // Refresh tier info
          const { businessTierApi: tierApi } = await import('@/lib/api/serviceTiers');
          const info = await tierApi.getMyTier();
          setTierInfo(info);
        }
      } catch {
        // Silently retry on next interval
      }
    }, 15000); // Poll every 15 seconds
  }, [stopTierPolling]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => stopTierPolling();
  }, [stopTierPolling]);

  // Fetch coupons from backend
  useEffect(() => {
    const fetchCoupons = async () => {
      if (!business?.businessId) return;
      setIsLoadingCoupons(true);
      try {
        const page = await couponsApi.findAll(0, 100);
        setCoupons(page.content);
      } catch {
        setCoupons([]);
      } finally {
        setIsLoadingCoupons(false);
      }
    };
    fetchCoupons();
  }, [business?.businessId]);

  const refetchCoupons = async () => {
    try {
      const page = await couponsApi.findAll(0, 100);
      setCoupons(page.content);
    } catch { /* ignore */ }
  };

  // Fetch webhooks from backend
  useEffect(() => {
    const fetchWebhooks = async () => {
      if (!business?.businessId) return;
      setIsLoadingWebhooks(true);
      try {
        const page = await webhooksApi.list(0, 100);
        setBusinessWebhooks(page.content);
      } catch {
        setBusinessWebhooks([]);
      } finally {
        setIsLoadingWebhooks(false);
      }
    };
    fetchWebhooks();
  }, [business?.businessId]);

  const refetchWebhooks = async () => {
    try {
      const page = await webhooksApi.list(0, 100);
      setBusinessWebhooks(page.content);
    } catch { /* ignore */ }
  };

  // Fetch real data using hooks
  const { data: businessCustomers, isLoading: customersLoading, refetch: refetchCustomers, totalElements: totalCustomers } = useCustomers(100);
  const { data: businessPlans, isLoading: plansLoading, refetch: refetchPlans, totalElements: totalPlans } = usePlans(100);
  const { data: businessSubscriptions, isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useSubscriptions(100);
  const { metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: businessMandates, refetch: refetchMandates } = useMandates(100);

  // For features not yet implemented with API, use empty arrays
  const [businessTransactions, setBusinessTransactions] = useState<TransactionResponse[]>([]);

  // Fetch active subscribers when section is active
  useEffect(() => {
    if (activeSection === 'active-subscribers') {
      loadActiveSubscribers();
    }
  }, [activeSection, activeSubsPage, activeSubsPageSize]);

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await billingApi.listTransactions(0, 100);
        setBusinessTransactions(data.content);
      } catch (err) {
        console.error('Failed to fetch transactions', err);
      }
    };
    if (business?.businessId) fetchTransactions();
  }, [business?.businessId]);

  // Helper lookup functions for joining data across entities
  const getCustomerName = (customerId: string | null) => {
    if (!customerId) return 'Unknown Customer';
    const customer = businessCustomers.find(c => c.customerId === customerId);
    return customer ? `${customer.customerFirstName || ''} ${customer.customerLastName || ''}`.trim() || 'Unknown' : 'Unknown Customer';
  };

  const getPlanName = (planId: string | null) => {
    if (!planId) return 'Unknown Plan';
    const plan = businessPlans.find(p => p.planId === planId);
    return plan?.planName || 'Unknown Plan';
  };

  const getPlanAmount = (planId: string | null): number => {
    if (!planId) return 0;
    const plan = businessPlans.find(p => p.planId === planId);
    return parseFloat(plan?.planAmount || '0');
  };

  const getSubscriptionCount = (customerId: string) => {
    return businessSubscriptions.filter(s => s.subscriptionCustomerId === customerId && (s.subscriptionStatus === 'ACTIVE' || s.subscriptionStatus === 'TRIALING')).length;
  };

  // Calculate metrics from real data
  const activeSubscriptionsCount = businessSubscriptions.filter(s => s.subscriptionStatus === 'ACTIVE' || s.subscriptionStatus === 'TRIALING').length;
  const successfulTransactionsCount = businessTransactions.filter(t => t.transactionStatus === 'SUCCESSFUL' || t.transactionStatus === 'SUCCESS').length;
  const failedTransactionsCount = businessTransactions.filter(t => t.transactionStatus === 'FAILED').length;
  const totalRevenue = businessTransactions.filter(t => t.transactionStatus === 'SUCCESSFUL' || t.transactionStatus === 'SUCCESS').reduce((sum, t) => sum + parseFloat(t.transactionAmount || '0'), 0);
  const monthlyRevenue = metrics.monthlyRevenue;
  const upcomingRenewalsCount = businessSubscriptions.filter(s =>
    s.subscriptionStatus === 'ACTIVE' && s.subscriptionCurrentPeriodEnd && new Date(s.subscriptionCurrentPeriodEnd) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  ).length;

  // Compute chart data from real transactions and subscriptions
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentYear = now.getFullYear();

    const revenueByMonth = new Array(12).fill(0);
    businessTransactions
      .filter(t => t.transactionStatus === 'SUCCESSFUL' || t.transactionStatus === 'SUCCESS')
      .forEach(t => {
        if (t.transactionCreatedAt) {
          const d = new Date(t.transactionCreatedAt);
          if (d.getFullYear() === currentYear) {
            revenueByMonth[d.getMonth()] += parseFloat(t.transactionAmount || '0');
          }
        }
      });

    const subscribersByMonth = new Array(12).fill(0);
    businessSubscriptions.forEach(s => {
      if (s.subscriptionCreatedAt) {
        const d = new Date(s.subscriptionCreatedAt);
        if (d.getFullYear() === currentYear) {
          subscribersByMonth[d.getMonth()]++;
        }
      }
    });

    return {
      revenue: months.map((month, i) => ({ month, amount: revenueByMonth[i] })),
      subscribers: months.map((month, i) => ({ month, count: subscribersByMonth[i] })),
    };
  }, [businessTransactions, businessSubscriptions]);

  // Show loading state - EARLY RETURNS MUST COME AFTER ALL HOOKS
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !business) {
    return null;
  }

  // KYC Gate: if business is not KYC approved, show KYC onboarding
  const kycStatus = business.businessKycStatus;
  if (kycStatus && kycStatus !== 'KYC_APPROVED' && business.businessStatus !== 'ACTIVE') {
    return (
      <BusinessKycOnboarding
        businessName={business.businessName || ''}
        businessKycStatus={kycStatus}
        onKycSubmitted={() => refreshBusiness()}
      />
    );
  }

  // Filter logic for products - only show products for current business
  const filteredProducts = products
    .filter((product) =>
      (product.productName || '').toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      (product.productDescription || '').toLowerCase().includes(productSearchQuery.toLowerCase())
    );

  // Filter logic for coupons
  const filteredCoupons = coupons.filter((coupon) =>
    (coupon.couponCode || '').toLowerCase().includes(couponSearchQuery.toLowerCase()) ||
    (coupon.couponName || '').toLowerCase().includes(couponSearchQuery.toLowerCase())
  );

  // Filter logic for team members
  const filteredTeamMembers = teamMembers.filter((member) =>
    member.name.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(teamSearchQuery.toLowerCase())
  );

  // Filter customers for current business with search
  const filteredCustomers = businessCustomers.filter(
    (customer) =>
      `${customer.customerFirstName || ''} ${customer.customerLastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.customerEmail || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter subscriptions for current business with search
  const filteredSubscriptions = businessSubscriptions.filter(
    (sub) =>
      getCustomerName(sub.subscriptionCustomerId).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getPlanName(sub.subscriptionPlanId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter mandates for current business with search
  const filteredMandates = businessMandates.filter(
    (mandate: any) =>
      (mandate.mandatePayerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      getBankName(mandate.mandateBankId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter transactions for current business with search
  const filteredTransactions = businessTransactions.filter(
    (txn: any) =>
      (txn.transactionDescription || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (txn.transactionReference || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic for products
  const productsTotalPages = Math.ceil(filteredProducts.length / productsPageSize);
  const paginatedProducts = filteredProducts.slice(
    (productsPage - 1) * productsPageSize,
    productsPage * productsPageSize
  );

  // Pagination logic for coupons
  const couponsTotalPages = Math.ceil(filteredCoupons.length / couponsPageSize);
  const paginatedCoupons = filteredCoupons.slice(
    (couponsPage - 1) * couponsPageSize,
    couponsPage * couponsPageSize
  );

  // Pagination logic for team members
  const teamTotalPages = Math.ceil(filteredTeamMembers.length / teamPageSize);
  const paginatedTeamMembers = filteredTeamMembers.slice(
    (teamPage - 1) * teamPageSize,
    teamPage * teamPageSize
  );

  // Pagination logic for customers (business-specific)
  const customersTotalPages = Math.ceil(filteredCustomers.length / customersPageSize);
  const paginatedCustomers = filteredCustomers.slice(
    (customersPage - 1) * customersPageSize,
    customersPage * customersPageSize
  );

  // Pagination logic for subscriptions (business-specific)
  const subscriptionsTotalPages = Math.ceil(filteredSubscriptions.length / subscriptionsPageSize);
  const paginatedSubscriptions = filteredSubscriptions.slice(
    (subscriptionsPage - 1) * subscriptionsPageSize,
    subscriptionsPage * subscriptionsPageSize
  );

  // Pagination logic for mandates (business-specific)
  const mandatesTotalPages = Math.ceil(filteredMandates.length / mandatesPageSize);
  const paginatedMandates = filteredMandates.slice(
    (mandatesPage - 1) * mandatesPageSize,
    mandatesPage * mandatesPageSize
  );

  // Pagination logic for transactions (business-specific)
  const transactionsTotalPages = Math.ceil(filteredTransactions.length / transactionsPageSize);
  const paginatedTransactions = filteredTransactions.slice(
    (transactionsPage - 1) * transactionsPageSize,
    transactionsPage * transactionsPageSize
  );

  // Tier limit helper - shows upgrade modal on 402 responses
  const handleTierError = (error: any, fallbackMsg: string): boolean => {
    if (error?.response?.status === 402) {
      setUpgradeMessage(error.response.data?.message || 'You have reached your plan limit. Please upgrade to continue.');
      setUpgradeModal(true);
      return true;
    }
    toast.error(error?.response?.data?.message || error?.message || fallbackMsg);
    return false;
  };

  // Product handlers
  const handleCreateProduct = () => {
    setProductName('');
    setProductDescription('');
    setProductAmount('');
    setCreateProductModal(true);
  };

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setProductName(product.productName || '');
    setProductDescription(product.productDescription || '');
    setProductAmount(product.productAmount != null ? formatAmountInput(String(product.productAmount)) : '');
    setEditProductModal(true);
  };

  const handleDeleteProduct = (product: any) => {
    setSelectedProduct(product);
    setDeleteProductModal(true);
  };

  const confirmCreateProduct = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await productsApi.create({
        productName,
        productDescription: productDescription || undefined,
        productAmount: productAmount ? parseFloat(stripCommas(productAmount)) : undefined,
        productBusinessId: business?.businessId || undefined,
      });
      toast.success(`Product "${productName}" has been created`);
      setCreateProductModal(false);
      refetchProducts();
    } catch (error: any) {
      handleTierError(error, 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmEditProduct = async () => {
    if (isSubmitting || !selectedProduct?.productId) return;
    setIsSubmitting(true);
    try {
      await productsApi.update(selectedProduct.productId, {
        productName,
        productDescription: productDescription || undefined,
        productAmount: productAmount ? parseFloat(stripCommas(productAmount)) : undefined,
      });
      toast.success(`Product "${productName}" has been updated`);
      setEditProductModal(false);
      refetchProducts();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to update product';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteProduct = async () => {
    if (isSubmitting || !selectedProduct?.productId) return;
    setIsSubmitting(true);
    try {
      await productsApi.delete(selectedProduct.productId);
      toast.success(`Product "${selectedProduct?.productName}" has been deleted`);
      setDeleteProductModal(false);
      refetchProducts();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to delete product';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Product selection handler for Plan creation
  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find((p) => p.productId === productId);
    if (product) {
      setPlanDescription(product.productDescription || '');
      if (product.productAmount != null) {
        setPlanAmount(formatAmountInput(String(product.productAmount)));
      }
    }
  };

  // Plan handlers
  const handleCreatePlan = () => {
    setPlanName('');
    setPlanDescription('');
    setPlanAmount('');
    setPlanFrequency('Monthly');
    setPlanTrialPeriod('');
    setSelectedProductId('');
    setCreatePlanModal(true);
  };

  const handleEditPlan = (plan: any) => {
    setSelectedPlan(plan);
    setPlanName(plan.planName || '');
    setPlanDescription(plan.planDescription || '');
    setPlanAmount(plan.planAmount ? formatAmountInput(plan.planAmount) : '');
    setPlanFrequency(plan.planBillingInterval || 'MONTHLY');
    setPlanTrialPeriod((plan.planTrialDays ?? '').toString());
    setEditPlanModal(true);
  };

  const handleDeletePlan = (plan: any) => {
    setSelectedPlan(plan);
    setDeletePlanModal(true);
  };

  const confirmCreatePlan = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const intervalMap: Record<string, 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'> = {
        'Daily': 'DAILY',
        'Weekly': 'WEEKLY',
        'Monthly': 'MONTHLY',
        'Quarterly': 'QUARTERLY',
        'Yearly': 'YEARLY',
      };
      await plansApi.create({
        planName,
        planDescription: planDescription || undefined,
        planAmount: stripCommas(planAmount),
        planBillingInterval: intervalMap[planFrequency] || 'MONTHLY',
        planTrialDays: planTrialPeriod ? parseInt(planTrialPeriod) : undefined,
        planProductId: selectedProductId || undefined,
      });
      toast.success(`Plan "${planName}" has been created`);
      setCreatePlanModal(false);
      refetchPlans();
    } catch (error: any) {
      handleTierError(error, 'Failed to create plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmEditPlan = async () => {
    if (isSubmitting || !selectedPlan?.planId) return;
    setIsSubmitting(true);
    try {
      await plansApi.update(selectedPlan.planId, {
        planName,
        planDescription: planDescription || undefined,
        planAmount: stripCommas(planAmount),
      });
      toast.success(`Plan "${planName}" has been updated`);
      setEditPlanModal(false);
      refetchPlans();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to update plan';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeletePlan = async () => {
    if (isSubmitting || !selectedPlan?.planId) return;
    setIsSubmitting(true);
    try {
      await plansApi.delete(selectedPlan.planId);
      toast.success(`Plan "${selectedPlan?.planName}" has been deleted`);
      setDeletePlanModal(false);
      refetchPlans();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to delete plan';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Customer handlers
  const handleAddCustomer = () => {
    if (!tierInfo?.customerManagementEnabled) {
      setUpgradeMessage('Customer management is not available on the FREE plan. Please upgrade your plan to add customers.');
      setUpgradeModal(true);
      return;
    }
    const max = tierInfo?.maxCustomers ?? 0;
    if (max !== -1 && (tierInfo?.currentCustomers ?? 0) >= max) {
      setUpgradeMessage(`You have reached your customer limit (${max}). Please upgrade your plan to add more customers.`);
      setUpgradeModal(true);
      return;
    }
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setAddCustomerModal(true);
  };

  const handleViewCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setViewCustomerModal(true);
  };

  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerName(`${customer.customerFirstName || ''} ${customer.customerLastName || ''}`);
    setCustomerEmail(customer.customerEmail || '');
    setCustomerPhone(customer.customerPhone || '');
    setEditCustomerModal(true);
  };

  const handleDeleteCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setDeleteCustomerModal(true);
  };

  const handleCheckCustomerStatus = async (customer: any) => {
    setCustomerStatusName(`${customer.customerFirstName || ''} ${customer.customerLastName || ''}`.trim());
    setCustomerStatusModal(true);
    setIsCheckingCustomerStatus(true);
    setCustomerStatusData(null);
    try {
      const data = await subscriptionsApi.checkCustomerStatus(customer.customerId);
      setCustomerStatusData(data);
    } catch {
      toast.error('Failed to check subscription status');
    } finally {
      setIsCheckingCustomerStatus(false);
    }
  };

  const handleCustomerAccountNumberChange = async (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setCustomerAccountNumber(cleaned);

      // Call real name enquiry API when 10 digits entered
      if (cleaned.length === 10 && customerBankCode) {
        setIsLookingUpAccount(true);
        try {
          const result = await billingApi.verifyBankAccount({
            bankCode: customerBankCode,
            accountNumber: cleaned,
          });
          setCustomerAccountName(result.accountName || '');

          // Auto-populate first and last name from verified account name
          // Nigerian bank names come as: LASTNAME FIRSTNAME MIDDLENAME
          const nameParts = (result.accountName || '').split(' ').filter(Boolean);
          if (nameParts.length >= 2) {
            setCustomerLastName(nameParts[0]); // First part is surname
            setCustomerName(nameParts.slice(1).join(' ')); // Rest is first + middle name
          } else if (nameParts.length === 1) {
            setCustomerName(nameParts[0]);
          }
        } catch (error) {
          console.error('Account verification failed:', error);
          toast.error('Failed to verify account. Please check the details.');
          setCustomerAccountName('');
        } finally {
          setIsLookingUpAccount(false);
        }
      } else {
        setCustomerAccountName('');
      }
    }
  };

  const resetAddCustomerForm = () => {
    setCustomerName('');
    setCustomerLastName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setLinkBankAccount(false);
    setCustomerBankCode('');
    setCustomerBankName('');
    setCustomerAccountNumber('');
    setCustomerAccountName('');
    setIsLookingUpAccount(false);
    setCustomerProductId('');
    setCustomerPlanId('');
    setApplyCouponCode('');
    setCouponValidation(null);
    setEmailOtpCode('');
    setEmailOtpMasked('');
    setPendingCustomerData(null);
  };

  const confirmAddCustomer = async () => {
    if (isSubmitting || isSendingEmailOtp) return;
    // First validate basic required customer info
    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }
    if (!customerEmail.trim()) {
      toast.error('Please enter customer email address');
      return;
    }
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Capture form values before sending OTP
    const formEmail = customerEmail.trim();
    const formPhone = customerPhone;
    const formBankCode = customerBankCode;
    const formAccountNumber = customerAccountNumber;
    const formAccountName = customerAccountName;
    const formPlanId = customerPlanId;
    const formCouponCode = couponValidation?.valid ? applyCouponCode.trim() : undefined;
    const formDiscountedAmount = couponValidation?.valid ? couponValidation.finalAmount : null;
    const formLinkBank = linkBankAccount;
    const formName = customerName.trim();
    const nameParts = formName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || customerLastName || firstName;

    // Store form data for after OTP verification
    setPendingCustomerData({
      formEmail, formPhone, formBankCode, formAccountNumber, formAccountName,
      formPlanId, formCouponCode, formDiscountedAmount, formLinkBank,
      formName, firstName, lastName,
    });

    // Send OTP to customer email
    setIsSendingEmailOtp(true);
    try {
      const result = await customersApi.sendCustomerEmailOtp(formEmail);
      setEmailOtpMasked(result.emailMasked);
      setEmailOtpCode('');
      setEmailOtpModal(true);
      toast.success(`Verification code sent to ${result.emailMasked}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send verification code');
      setPendingCustomerData(null);
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const handleResendEmailOtp = async () => {
    if (!pendingCustomerData?.formEmail || isSendingEmailOtp) return;
    setIsSendingEmailOtp(true);
    try {
      const result = await customersApi.sendCustomerEmailOtp(pendingCustomerData.formEmail);
      setEmailOtpMasked(result.emailMasked);
      setEmailOtpCode('');
      toast.success('Verification code resent');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to resend verification code');
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (emailOtpCode.length !== 6 || !pendingCustomerData) return;
    setIsVerifyingEmailOtp(true);
    try {
      await customersApi.verifyCustomerEmailOtp(pendingCustomerData.formEmail, emailOtpCode);
      toast.success('Email verified successfully');
      setEmailOtpModal(false);

      // Proceed with actual customer creation
      await proceedWithCustomerCreation(pendingCustomerData);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid or expired verification code');
      setEmailOtpCode('');
    } finally {
      setIsVerifyingEmailOtp(false);
    }
  };

  const proceedWithCustomerCreation = async (data: any) => {
    const {
      formEmail, formPhone, formBankCode, formAccountNumber, formAccountName,
      formPlanId, formCouponCode, formDiscountedAmount, formLinkBank,
      formName, firstName, lastName,
    } = data;
    const fullName = `${firstName} ${lastName}`.trim();
    const selectedPlan = formPlanId ? businessPlans.find((p: any) => p.planId === formPlanId) : null;

    setIsSubmitting(true);

    // If bank is linked, show the verification modal IMMEDIATELY
    if (formLinkBank && formBankCode && formAccountNumber && formPlanId) {
      setSelectedMandate({
        mandateAccountNumber: formAccountNumber,
        mandateAccountName: formAccountName,
        mandateBankId: formBankCode,
        mandatePayerName: formAccountName || fullName,
        mandatePayerEmail: formEmail,
        mandatePayerPhone: formPhone,
        mandateAmount: formDiscountedAmount != null ? formDiscountedAmount.toString() : (selectedPlan?.planAmount || '0'),
        mandateFrequency: selectedPlan?.planBillingInterval || 'MONTHLY',
      });
      setCopiedToClipboard(false);
      setAddCustomerModal(false);
      resetAddCustomerForm();
      setVerificationModal(true);
    }

    // Create customer, subscription, and mandate sequentially in the background
    try {
      // Step 1: Create customer
      const newCustomer = await customersApi.create({
        customerEmail: formEmail,
        customerFirstName: firstName,
        customerLastName: lastName,
        customerPhone: formPhone || undefined,
        customerBankCode: formLinkBank ? formBankCode || undefined : undefined,
        customerAccountNumber: formLinkBank ? formAccountNumber || undefined : undefined,
        customerAccountName: formLinkBank ? formAccountName || undefined : undefined,
        createUserAccount: true,
      });

      if (formLinkBank && formPlanId && formBankCode && formAccountNumber) {
        // Step 2: Create subscription (need subscription ID for mandate)
        const newSubscription = await subscriptionsApi.create({
          subscriptionCustomerId: newCustomer.customerId,
          subscriptionPlanId: formPlanId,
          subscriptionCouponCode: formCouponCode,
        });

        // Step 3: Create mandate with subscription ID and correct bank UUID
        const bankEntry = banksList.find((b: any) => b.bankCode === formBankCode);
        const bankUuid = bankEntry?.bankId;
        const mandateAmount = formDiscountedAmount != null ? formDiscountedAmount.toString() : (selectedPlan?.planAmount || '0');

        if (bankUuid) {
          try {
            const mandate = await billingApi.createMandate({
              mandateSubscriptionId: newSubscription.subscriptionId,
              mandateAccountNumber: formAccountNumber,
              mandateAccountName: formAccountName || undefined,
              mandateBankId: bankUuid,
              mandatePayerName: formAccountName || fullName,
              mandatePayerEmail: formEmail,
              mandatePayerPhone: formPhone || undefined,
              mandateAmount: mandateAmount,
              mandateFrequency: selectedPlan?.planBillingInterval || 'MONTHLY',
              mandateProductId: selectedPlan?.planProductId || undefined,
              mandateNarration: `Direct debit for ${selectedPlan?.planName || 'subscription'}`,
            });
            // Update verification modal with real mandate data
            setSelectedMandate(mandate);
            refetchMandates();
          } catch {
            toast.error('Failed to create mandate. Customer and subscription were created.');
          }
        } else {
          toast.error('Bank not found. Customer and subscription were created, but mandate was not.');
        }
      } else if (formPlanId) {
        // No bank linked, just create subscription
        await subscriptionsApi.create({
          subscriptionCustomerId: newCustomer.customerId,
          subscriptionPlanId: formPlanId,
          subscriptionCouponCode: formCouponCode,
        });
      }

      toast.success(`Customer "${formName}" created! Login credentials sent via email.`);

      if (!formLinkBank || !formBankCode || !formAccountNumber || !formPlanId) {
        // Only close modal here if we didn't already close it for verification
        setAddCustomerModal(false);
        resetAddCustomerForm();
      }
      refetchCustomers();
    } catch (error: any) {
      handleTierError(error, 'Failed to add customer');
    } finally {
      setIsSubmitting(false);
      setPendingCustomerData(null);
    }
  };

  const confirmEditCustomer = async () => {
    if (isSubmitting || !selectedCustomer?.customerId) return;
    setIsSubmitting(true);
    try {
      const nameParts = customerName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || firstName;

      await customersApi.update(selectedCustomer.customerId, {
        customerEmail: customerEmail,
        customerFirstName: firstName,
        customerLastName: lastName,
        customerPhone: customerPhone || undefined,
      });
      toast.success(`Customer "${customerName}" has been updated`);
      setEditCustomerModal(false);
      refetchCustomers();
    } catch (error) {
      toast.error('Failed to update customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteCustomer = async () => {
    if (isSubmitting || !selectedCustomer?.customerId) return;
    setIsSubmitting(true);
    try {
      await customersApi.delete(selectedCustomer.customerId);
      toast.success(`Customer "${selectedCustomer?.customerFirstName} ${selectedCustomer?.customerLastName}" has been deleted`);
      setDeleteCustomerModal(false);
      refetchCustomers();
    } catch (error) {
      toast.error('Failed to delete customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Subscription handlers
  const handleViewSubscription = (subscription: any) => {
    setSelectedSubscription(subscription);
    setViewSubscriptionModal(true);
  };

  const handleCancelSubscription = (subscription: any) => {
    setSelectedSubscription(subscription);
    setCancellationReason('');
    setCancelSubscriptionModal(true);
  };

  const confirmCancelSubscription = async () => {
    if (isSubmitting || !selectedSubscription?.subscriptionId) return;
    setIsSubmitting(true);
    try {
      await subscriptionsApi.cancel(selectedSubscription.subscriptionId, {
        subscriptionCancellationReason: cancellationReason || undefined,
      });
      toast.success(`Subscription has been cancelled`);
      refetchSubscriptions();
    } catch (error) {
      toast.error('Failed to cancel subscription');
    } finally {
      setIsSubmitting(false);
    }
    setCancelSubscriptionModal(false);
  };

  // Mandate handlers
  const handleViewMandate = (mandate: any) => {
    setSelectedMandate(mandate);
    setViewMandateModal(true);
  };

  const handleCancelMandate = (mandate: any) => {
    setSelectedMandate(mandate);
    setCancelMandateModal(true);
  };

  const handleActivateMandate = async (mandate: any) => {
    if (!mandate?.mandateId) return;
    try {
      await billingApi.activateMandate(mandate.mandateId);
      toast.success('Mandate has been activated');
      refetchMandates();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to activate mandate');
    }
  };

  const confirmCancelMandate = async () => {
    if (!selectedMandate?.mandateId) return;
    setIsCancellingMandate(true);
    try {
      await billingApi.cancelMandate(selectedMandate.mandateId);
      toast.success('Mandate has been cancelled');
      setCancelMandateModal(false);
      refetchMandates();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel mandate');
    } finally {
      setIsCancellingMandate(false);
    }
  };

  // Verification handlers
  const handleSendVerification = (mandate: any) => {
    setSelectedMandate(mandate);
    setCopiedToClipboard(false);
    setVerificationModal(true);
  };

  const handleSendVerificationForCustomer = (customer: any) => {
    // Find the mandate for this customer (mandates don't have direct customerId - this is placeholder)
    const customerMandate = businessMandates.find((m: any) => m.mandatePayerEmail === customer.customerEmail);
    if (customerMandate) {
      setSelectedMandate(customerMandate);
      setCopiedToClipboard(false);
      setVerificationModal(true);
    } else {
      toast.error('No linked bank account found for this customer');
    }
  };

  // Helper to resolve bank code to bank name
  const getBankName = (bankCodeOrId: string | null | undefined): string => {
    if (!bankCodeOrId) return 'Unknown Bank';
    const bank = banksList.find(b => b.bankCode === bankCodeOrId || b.bankId === bankCodeOrId);
    return bank?.bankName || bankCodeOrId;
  };

  const getVerificationText = () => {
    if (!selectedMandate || !business) return '';

    const customerBankName = getBankName(selectedMandate.mandateBankId);
    const businessBankNameResolved = getBankName(business.businessBankCode);
    const businessAccountNumber = business.businessAccountNumber || 'Not configured';
    const businessAccountName = business.businessAccountName || business.businessName;
    const mandateAcctLast4 = (selectedMandate.mandateAccountNumber || '').slice(-4);

    return `MANDATE ACTIVATION INSTRUCTIONS
====================================

Dear ${selectedMandate.mandatePayerName},

To activate your direct debit mandate with ${business.businessName}, please transfer exactly NGN 50.00 from your linked bank account to the account below:

YOUR BANK ACCOUNT (Source)
--------------------------
Bank: ${customerBankName}
Account: ***${mandateAcctLast4}

DESTINATION ACCOUNT (Transfer NGN 50.00 here)
-----------------------------------------
Bank: ${businessBankNameResolved}
Account Number: ${businessAccountNumber}
Account Name: ${businessAccountName}
Amount: NGN 50.00

MANDATE DETAILS
--------------------------
Recurring Amount: NGN ${selectedMandate.mandateAmount || '0.00'}
Billing Cycle: ${selectedMandate.mandateFrequency || 'MONTHLY'}
Biller: ${business.businessName}

IMPORTANT INSTRUCTIONS:
1. Transfer exactly NGN 50.00 to the destination account above
2. Use your registered account ending in ${mandateAcctLast4}
3. The transfer must come from the same bank account linked to your mandate
4. Once the NGN 50.00 is confirmed, your mandate will be activated
5. After activation, recurring debits will begin based on your subscription plan

This one-time payment confirms your authorization for ${business.businessName} to debit your account via NIBSS Direct Debit (NDD).

Thank you for your cooperation.

Best regards,
${business.businessName}`;
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getVerificationText());
      setCopiedToClipboard(true);
      toast.success('Verification details copied to clipboard');
      setTimeout(() => setCopiedToClipboard(false), 3000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleSendEmail = () => {
    if (!selectedMandate?.mandatePayerEmail) {
      toast.error('No email address available for this customer');
      return;
    }

    const subject = encodeURIComponent('Direct Debit Verification - Transfer ₦50.00');
    const body = encodeURIComponent(getVerificationText());
    window.open(`mailto:${selectedMandate.mandatePayerEmail}?subject=${subject}&body=${body}`, '_blank');
    toast.success(`Opening email client for ${selectedMandate.mandatePayerEmail}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!selectedMandate?.mandatePayerPhone) {
      toast.error('No phone number available for this customer');
      return;
    }

    // Clean the phone number - remove spaces, dashes, and ensure it has country code
    let phoneNumber = selectedMandate.mandatePayerPhone.replace(/[\s-()]/g, '');

    // If number starts with 0, replace with Nigeria country code
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '234' + phoneNumber.substring(1);
    }
    // If number doesn't start with +, add it for international format
    if (!phoneNumber.startsWith('+') && !phoneNumber.startsWith('234')) {
      phoneNumber = '234' + phoneNumber;
    }
    // Remove + if present (WhatsApp API doesn't need it)
    phoneNumber = phoneNumber.replace('+', '');

    const message = encodeURIComponent(getVerificationText());
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

    window.open(whatsappUrl, '_blank');
    toast.success(`Opening WhatsApp for ${selectedMandate.mandatePayerPhone}`);
  };

  // Coupon handlers
  const handleCreateCoupon = () => {
    setCouponCode('');
    setCouponType('Percentage');
    setCouponValue('');
    setCouponLimit('');
    setCouponValidTo('');
    setCreateCouponModal(true);
  };

  const handleEditCoupon = (coupon: any) => {
    setSelectedCoupon(coupon);
    setCouponCode(coupon.couponCode || '');
    setCouponType(coupon.couponType || 'Percentage');
    setCouponValue(coupon.couponValue ? formatAmountInput(coupon.couponValue) : '');
    setCouponLimit((coupon.couponMaxRedemptions || '').toString());
    setCouponValidTo(coupon.couponValidUntil ? coupon.couponValidUntil.split('T')[0] : '');
    setEditCouponModal(true);
  };

  const handleDeleteCoupon = (coupon: any) => {
    setSelectedCoupon(coupon);
    setDeleteCouponModal(true);
  };

  const confirmCreateCoupon = async () => {
    setIsSavingCoupon(true);
    try {
      await couponsApi.create({
        couponCode: couponCode,
        couponName: couponCode,
        couponType: couponType,
        couponValue: stripCommas(couponValue),
        couponMaxRedemptions: parseInt(couponLimit) || 100,
        couponValidUntil: couponValidTo ? `${couponValidTo}T23:59:59` : undefined,
        couponStatus: 'ACTIVE',
      });
      toast.success(`Coupon "${couponCode}" has been created`);
      setCreateCouponModal(false);
      refetchCoupons();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create coupon');
    } finally {
      setIsSavingCoupon(false);
    }
  };

  const confirmEditCoupon = async () => {
    if (!selectedCoupon?.couponId) return;
    setIsSavingCoupon(true);
    try {
      await couponsApi.update(selectedCoupon.couponId, {
        couponCode: couponCode,
        couponName: couponCode,
        couponType: couponType,
        couponValue: stripCommas(couponValue),
        couponMaxRedemptions: parseInt(couponLimit) || undefined,
        couponValidUntil: couponValidTo ? `${couponValidTo}T23:59:59` : undefined,
      });
      toast.success(`Coupon "${couponCode}" has been updated`);
      setEditCouponModal(false);
      refetchCoupons();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update coupon');
    } finally {
      setIsSavingCoupon(false);
    }
  };

  const confirmDeleteCoupon = async () => {
    if (!selectedCoupon?.couponId) return;
    setIsDeletingCoupon(true);
    try {
      await couponsApi.delete(selectedCoupon.couponId);
      toast.success(`Coupon "${selectedCoupon?.couponCode}" has been deleted`);
      setDeleteCouponModal(false);
      refetchCoupons();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete coupon');
    } finally {
      setIsDeletingCoupon(false);
    }
  };

  // Team member handlers
  const handleInviteTeam = () => {
    setTeamMemberEmail('');
    setTeamMemberRole('Admin');
    setInviteTeamModal(true);
  };

  const handleEditTeamMember = (member: any) => {
    setSelectedTeamMember(member);
    setTeamMemberRole(member.role);
    setEditTeamMemberModal(true);
  };

  const handleRemoveTeamMember = (member: any) => {
    setSelectedTeamMember(member);
    setRemoveTeamMemberModal(true);
  };

  const confirmInviteTeam = () => {
    toast.success(`Invitation sent to ${teamMemberEmail}`);
    setInviteTeamModal(false);
  };

  const confirmEditTeamMember = () => {
    toast.success(`Team member role updated`);
    setEditTeamMemberModal(false);
  };

  const confirmRemoveTeamMember = () => {
    toast.success(`Team member removed`);
    setRemoveTeamMemberModal(false);
  };

  // API Keys handlers
  const handleRegenerateKeys = () => {
    setRegenerateKeysModal(true);
  };

  const confirmRegenerateKeys = () => {
    toast.success('API keys have been regenerated');
    setRegenerateKeysModal(false);
  };

  // Webhook handlers
  const handleAddWebhook = () => {
    setWebhookUrl('');
    setWebhookEvent('payment.success');
    setWebhookSecret('');
    setAddWebhookModal(true);
  };

  const handleTestWebhook = (webhook: any) => {
    setSelectedWebhook(webhook);
    setTestWebhookModal(true);
  };

  const confirmAddWebhook = async () => {
    if (!webhookUrl) {
      toast.error('Please enter a webhook URL');
      return;
    }
    setIsAddingWebhook(true);
    try {
      await webhooksApi.create({
        webhookUrl,
        webhookEvents: [webhookEvent],
        webhookIsActive: true,
      });
      toast.success('Webhook has been added');
      await refetchWebhooks();
      setAddWebhookModal(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to add webhook');
    } finally {
      setIsAddingWebhook(false);
    }
  };

  const confirmTestWebhook = async () => {
    if (!selectedWebhook) return;
    setIsTestingWebhook(true);
    try {
      await webhooksApi.test(selectedWebhook.webhookId);
      toast.success('Test event sent successfully');
      setTestWebhookModal(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to send test event');
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      await webhooksApi.delete(webhookId);
      toast.success('Webhook deleted successfully');
      await refetchWebhooks();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete webhook');
    }
  };

  const handleLogout = async () => {
    await logout(); // Clear tokens from AuthContext
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
      setChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to change password');
    }
  };

  // Overview Section Component
  const OverviewSection = () => (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Overview</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Dashboard for <span className="font-medium text-foreground">{business?.businessName}</span>
        </p>
      </div>

      {/* KPI Cards - HuaweiWorldAnalytics Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Subscriptions Card */}
        <Card className="">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Active Subscriptions
                </p>
                <p className="text-3xl font-bold font-mono tracking-tight text-foreground">
                  {activeSubscriptionsCount.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {upcomingRenewalsCount} renewals this month
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-100 text-gray-600 flex-shrink-0">
                <UsersIcon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Recurring Revenue Card */}
        <Card className="">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Monthly Revenue
                </p>
                <p className="text-3xl font-bold font-mono tracking-tight text-foreground">
                  ₦{monthlyRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on active subscriptions
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-100 text-gray-600 flex-shrink-0">
                <NairaIcon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Successful Charges Card */}
        <Card className="">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Successful Charges
                </p>
                <p className="text-3xl font-bold font-mono tracking-tight text-foreground">
                  {successfulTransactionsCount.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {failedTransactionsCount} failed this period
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-100 text-gray-600 flex-shrink-0">
                <TrendingUpIcon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Renewals Card */}
        <Card className="">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Upcoming Renewals
                </p>
                <p className="text-3xl font-bold font-mono tracking-tight text-foreground">
                  {upcomingRenewalsCount}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Due within 30 days
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-100 text-gray-600 flex-shrink-0">
                <CalendarIcon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Plan Card */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                <TrendingUpIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Plan</p>
                <p className="text-xl font-bold text-foreground">{tierInfo?.tierName || 'FREE'}</p>
                <p className="text-sm text-muted-foreground">
                  {tierInfo?.customerManagementEnabled
                    ? `${tierInfo.currentCustomers}/${tierInfo.maxCustomers === -1 ? '∞' : tierInfo.maxCustomers} customers · ${tierInfo.currentMandates}/${tierInfo.maxMandates === -1 ? '∞' : tierInfo.maxMandates} mandates`
                    : 'Upgrade to add customers and use NDD services'}
                </p>
              </div>
            </div>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => handleSectionChange('settings')}
            >
              {tierInfo?.subscriptionStatus === 'ACTIVE' ? 'Manage Plan' : 'Upgrade Plan'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Growth Chart - Full Width */}
      <Card className="">
        <CardHeader>
          <CardTitle className="text-foreground">Revenue Growth</CardTitle>
          <p className="text-sm text-muted-foreground">Monthly revenue over the past 12 months</p>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.revenue} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRevenueGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorRevenueGreenStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#3b82f6" />
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
                  stroke="url(#colorRevenueGreenStroke)"
                  strokeWidth={2.5}
                  fill="url(#colorRevenueGreen)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Subscriber Growth Chart - Full Width */}
      <Card className="">
        <CardHeader>
          <CardTitle className="text-foreground">Subscriber Growth</CardTitle>
          <p className="text-sm text-muted-foreground">Active subscribers over the past 12 months</p>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.subscribers} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} width={50} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString(), 'Subscribers']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}
                />
                <Bar dataKey="count" fill="url(#colorBar)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {businessSubscriptions.slice(0, 5).map((sub) => (
                <div key={sub.subscriptionId} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors duration-200">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">{getCustomerName(sub.subscriptionCustomerId)}</div>
                    <div className="text-sm text-muted-foreground">{getPlanName(sub.subscriptionPlanId)}</div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="font-medium font-mono text-foreground">₦{getPlanAmount(sub.subscriptionPlanId).toLocaleString()}</div>
                    <StatusBadge status={sub.subscriptionStatus || 'UNKNOWN'} type="subscription" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {businessTransactions.slice(0, 5).map((txn: any) => (
                <div key={txn.transactionId} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors duration-200">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">{txn.transactionDescription || 'Transaction'}</div>
                    <div className="text-sm text-muted-foreground font-mono">{txn.transactionReference}</div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="font-medium font-mono text-foreground">₦{parseFloat(txn.transactionAmount || '0').toLocaleString()}</div>
                    <StatusBadge status={txn.transactionStatus || 'UNKNOWN'} type="payment" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Products Section Component
  const ProductsSection = () => (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Products</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => { refetchProducts(); toast.info('Refreshing products...'); }}>
            <RefreshIcon className="h-4 w-4" />
          </Button>
          <Button onClick={handleCreateProduct} className="bg-purple-600 hover:bg-purple-700 transition-colors duration-200 shadow-sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>
      <Card className="">
        <CardHeader>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={productSearchQuery}
              onChange={(e) => setProductSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Product Name</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount (₦)</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => (
                  <tr key={product.productId} className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-150">
                    <td className="py-4 px-4">
                      <div className="font-medium text-foreground">{product.productName}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-muted-foreground max-w-xs truncate">{product.productDescription}</div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="text-sm font-medium text-foreground">{product.productAmount != null ? `₦${Number(product.productAmount).toLocaleString()}` : '-'}</div>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={product.productStatus || 'ACTIVE'} type="general" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-muted-foreground">{product.productCreatedAt ? new Date(product.productCreatedAt).toLocaleDateString() : '-'}</div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVerticalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                            <EditIcon className="h-4 w-4 mr-2" />
                            Edit Product
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteProduct(product)} className="text-red-600">
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete Product
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
            currentPage={productsPage}
            totalPages={productsTotalPages}
            pageSize={productsPageSize}
            totalItems={filteredProducts.length}
            onPageChange={setProductsPage}
            onPageSizeChange={setProductsPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );

  // Plans Section Component
  const PlansSection = () => (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Subscription Plans</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure pricing and billing options</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => refetchPlans()} disabled={plansLoading}>
            <RefreshIcon className={`h-4 w-4 ${plansLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleCreatePlan} className="bg-purple-600 hover:bg-purple-700 transition-colors duration-200 shadow-sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businessPlans.map((plan) => (
          <Card key={plan.planId} className="">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg text-foreground">{plan.planName}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{plan.planDescription}</p>
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
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => handleDeletePlan(plan)}>
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-foreground mb-4">
                ₦{parseFloat(plan.planAmount || '0').toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground">/{(plan.planBillingInterval || 'MONTHLY').toLowerCase()}</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Subscribers</span>
                  <span className="font-medium text-foreground">{businessSubscriptions.filter(s => s.subscriptionPlanId === plan.planId && (s.subscriptionStatus === 'ACTIVE' || s.subscriptionStatus === 'TRIALING')).length}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Trial Period</span>
                  <span className="font-medium text-foreground">{plan.planTrialDays ?? 0} days</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={plan.planStatus || 'UNKNOWN'} type="general" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Customers Section Component
  const CustomersSection = () => (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Customers</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your customer base</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline" onClick={() => refetchCustomers()} disabled={customersLoading}>
            <RefreshIcon className={`h-4 w-4 ${customersLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleAddCustomer} className="bg-purple-600 hover:bg-purple-700 transition-colors duration-200 shadow-sm">
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>
      <Card className="">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Subscriptions</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Paid</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.map((customer) => (
                  <tr key={customer.customerId} className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-150">
                    <td className="py-4 px-4 font-medium text-foreground">{customer.customerFirstName} {customer.customerLastName}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{customer.customerEmail}</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={customer.customerStatus || 'ACTIVE'} type="general" />
                    </td>
                    <td className="py-4 px-4 text-sm text-foreground text-right">{getSubscriptionCount(customer.customerId)}</td>
                    <td className="py-4 px-4 text-sm font-mono text-foreground text-right">₦0</td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVerticalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewCustomer(customer)}>
                            <EyeIcon className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                            <EditIcon className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCheckCustomerStatus(customer)}>
                            <TrendingUpIcon className="h-4 w-4 mr-2" />
                            Check Subscription
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSendVerificationForCustomer(customer)}>
                            <ShareIcon className="h-4 w-4 mr-2" />
                            Send Verification
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => {
                            try {
                              const result = await customersApi.resendWelcomeEmail(customer.customerId);
                              toast.success(result.message || 'Welcome email resent successfully');
                            } catch (err: any) {
                              const msg = err?.response?.data?.message || err?.message || 'Failed to resend email';
                              toast.error(msg);
                            }
                          }}>
                            <MailIcon className="h-4 w-4 mr-2" />
                            Resend Welcome Email
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCustomer(customer)}>
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete
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
            currentPage={customersPage}
            totalPages={customersTotalPages}
            pageSize={customersPageSize}
            totalItems={filteredCustomers.length}
            onPageChange={setCustomersPage}
            onPageSizeChange={setCustomersPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );

  // Active Subscribers Section Component
  const loadActiveSubscribers = async () => {
    setIsLoadingActiveSubscribers(true);
    try {
      const res = await subscriptionsApi.getActiveSubscribers(activeSubsPage - 1, activeSubsPageSize);
      setActiveSubscribers(res.content);
      setActiveSubsTotalPages(res.totalPages);
    } catch {
      toast.error('Failed to load active subscribers');
    } finally {
      setIsLoadingActiveSubscribers(false);
    }
  };

  const ActiveSubscribersSection = () => (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Active Subscribers</h2>
            <p className="text-sm text-muted-foreground mt-1">Customers currently paying or in trial</p>
          </div>
          <Button variant="outline" onClick={loadActiveSubscribers} disabled={isLoadingActiveSubscribers}>
            <RefreshIcon className={`h-4 w-4 ${isLoadingActiveSubscribers ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            {isLoadingActiveSubscribers && activeSubscribers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Loading active subscribers...</div>
            ) : activeSubscribers.length === 0 ? (
              <EmptyState
                icon={TrendingUpIcon}
                title="No active subscribers yet"
                description="Active and trialing subscribers will appear here once customers subscribe to your plans."
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Subscription Plan</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Next Billing</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Mandate</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Started</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSubscribers.map((sub) => (
                        <tr key={sub.subscriptionId} className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-150">
                          <td className="py-4 px-4 font-medium text-foreground">{sub.customerName || 'N/A'}</td>
                          <td className="py-4 px-4 text-sm text-muted-foreground">{sub.customerEmail || 'N/A'}</td>
                          <td className="py-4 px-4 text-sm text-muted-foreground">{sub.productName ? `${sub.productName} - ${sub.planName}` : sub.planName || 'N/A'}</td>
                          <td className="py-4 px-4">
                            <StatusBadge status={sub.subscriptionStatus || 'UNKNOWN'} type="subscription" />
                          </td>
                          <td className="py-4 px-4 text-sm font-mono text-foreground text-right">
                            {sub.planAmount ? `₦${Number(sub.planAmount).toLocaleString()}` : 'N/A'}
                          </td>
                          <td className="py-4 px-4 text-sm text-muted-foreground">
                            {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-4 px-4">
                            {(() => {
                              const mandate = businessMandates.find((m: any) => m.mandateSubscriptionId === sub.subscriptionId);
                              return <StatusBadge status={mandate?.mandateStatus || 'N/A'} type="mandate" />;
                            })()}
                          </td>
                          <td className="py-4 px-4 text-sm text-muted-foreground">
                            {sub.subscriptionStartDate ? new Date(sub.subscriptionStartDate).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <TablePagination
                  currentPage={activeSubsPage}
                  totalPages={activeSubsTotalPages}
                  pageSize={activeSubsPageSize}
                  totalItems={activeSubscribers.length}
                  onPageChange={setActiveSubsPage}
                  onPageSizeChange={setActiveSubsPageSize}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
  );

  // Subscriptions Section Component
  const SubscriptionsSection = () => (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">All Subscriptions</h2>
          <p className="text-sm text-muted-foreground mt-1">Track and manage active subscriptions</p>
        </div>
        <Button variant="outline" onClick={() => refetchSubscriptions()} disabled={subscriptionsLoading}>
          <RefreshIcon className={`h-4 w-4 ${subscriptionsLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <Card className="">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Plan</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Next Billing</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Mandate</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSubscriptions.map((sub) => (
                  <tr key={sub.subscriptionId} className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-150">
                    <td className="py-4 px-4 font-medium text-foreground">{getCustomerName(sub.subscriptionCustomerId)}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{getPlanName(sub.subscriptionPlanId)}</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={sub.subscriptionStatus || 'UNKNOWN'} type="subscription" />
                    </td>
                    <td className="py-4 px-4 text-sm font-mono text-foreground text-right">₦{getPlanAmount(sub.subscriptionPlanId).toLocaleString()}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {sub.subscriptionCurrentPeriodEnd ? new Date(sub.subscriptionCurrentPeriodEnd).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-4 px-4">
                      {(() => {
                        const mandate = businessMandates.find((m: any) => m.mandateSubscriptionId === sub.subscriptionId);
                        return <StatusBadge status={mandate?.mandateStatus || 'N/A'} type="mandate" />;
                      })()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVerticalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewSubscription(sub)}>
                            <EyeIcon className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {(sub.subscriptionStatus === 'PENDING_ACTIVATION' || sub.subscriptionStatus === 'TRIALING') && (
                            <DropdownMenuItem className="text-green-600" onClick={async () => {
                              try {
                                await subscriptionsApi.activate(sub.subscriptionId);
                                toast.success('Subscription activated successfully');
                                refetchSubscriptions();
                              } catch (err: any) {
                                toast.error(err?.response?.data?.message || 'Failed to activate');
                              }
                            }}>
                              <CheckIcon className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          {(sub.subscriptionStatus === 'ACTIVE' || sub.subscriptionStatus === 'TRIALING') && (
                            <DropdownMenuItem className="text-red-600" onClick={() => handleCancelSubscription(sub)}>
                              <BanIcon className="h-4 w-4 mr-2" />
                              Cancel Subscription
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={subscriptionsPage}
            totalPages={subscriptionsTotalPages}
            pageSize={subscriptionsPageSize}
            totalItems={filteredSubscriptions.length}
            onPageChange={setSubscriptionsPage}
            onPageSizeChange={setSubscriptionsPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );

  // Mandates Section Component
  const handleRefreshMandates = async () => {
    setIsRefreshingMandates(true);
    try {
      await refetchMandates();
      toast.success('Mandate statuses refreshed');
    } catch (err) {
      toast.error('Failed to refresh mandates');
    } finally {
      setIsRefreshingMandates(false);
    }
  };

  const MandatesSection = () => (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Direct Debit Mandates</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage bank account authorizations</p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefreshMandates}
          disabled={isRefreshingMandates}
          className="gap-2"
        >
          <RefreshIcon className={`h-4 w-4 ${isRefreshingMandates ? 'animate-spin' : ''}`} />
          {isRefreshingMandates ? 'Refreshing...' : 'Refresh Status'}
        </Button>
      </div>
      <Card className="">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Bank</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Account</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Frequency</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMandates.map((mandate: any) => (
                  <tr key={mandate.mandateId} className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-150">
                    <td className="py-4 px-4 font-medium text-foreground">{mandate.mandatePayerName}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{getBankName(mandate.mandateBankId)}</td>
                    <td className="py-4 px-4 text-sm font-mono text-muted-foreground">***{(mandate.mandateAccountNumber || '').slice(-4)}</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={mandate.mandateStatus || 'UNKNOWN'} type="mandate" />
                    </td>
                    <td className="py-4 px-4 text-sm font-mono text-foreground text-right">₦{parseFloat(mandate.mandateAmount || '0').toLocaleString()}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{mandate.mandateFrequency}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {mandate.mandateCreatedAt ? new Date(mandate.mandateCreatedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVerticalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewMandate(mandate)}>
                            <EyeIcon className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSendVerification(mandate)}>
                            <ShareIcon className="h-4 w-4 mr-2" />
                            Send Verification
                          </DropdownMenuItem>
                          {mandate.mandateStatus === 'PENDING' && (
                            <DropdownMenuItem className="text-green-600" onClick={() => handleActivateMandate(mandate)}>
                              <CheckIcon className="h-4 w-4 mr-2" />
                              Activate Mandate
                            </DropdownMenuItem>
                          )}
                          {mandate.mandateStatus === 'ACTIVE' && (
                            <DropdownMenuItem className="text-red-600" onClick={() => handleCancelMandate(mandate)}>
                              <BanIcon className="h-4 w-4 mr-2" />
                              Cancel Mandate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={mandatesPage}
            totalPages={mandatesTotalPages}
            pageSize={mandatesPageSize}
            totalItems={filteredMandates.length}
            onPageChange={setMandatesPage}
            onPageSizeChange={setMandatesPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );

  // Transactions Section Component
  const TransactionsSection = () => (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Transaction History</h2>
          <p className="text-sm text-muted-foreground mt-1">View all payment transactions</p>
        </div>
        <Button variant="outline" onClick={() => toast.info('Refreshing transactions...')}>
          <RefreshIcon className="h-4 w-4" />
        </Button>
      </div>
      <Card className="">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Reference</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Retry Count</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((txn: any) => (
                  <tr key={txn.transactionId} className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-150">
                    <td className="py-4 px-4 font-mono text-sm text-foreground">{txn.transactionReference}</td>
                    <td className="py-4 px-4 text-sm text-foreground">{txn.transactionDescription || 'N/A'}</td>
                    <td className="py-4 px-4 text-sm font-mono text-foreground text-right">₦{parseFloat(txn.transactionAmount || '0').toLocaleString()}</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={txn.transactionStatus || 'UNKNOWN'} type="payment" />
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground text-right">0</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {txn.transactionCreatedAt ? new Date(txn.transactionCreatedAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={transactionsPage}
            totalPages={transactionsTotalPages}
            pageSize={transactionsPageSize}
            totalItems={filteredTransactions.length}
            onPageChange={setTransactionsPage}
            onPageSizeChange={setTransactionsPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );

  // Coupons Section Component
  const CouponsSection = () => (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Discount Coupons</h2>
          <p className="text-sm text-muted-foreground mt-1">Create and manage promotional codes</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => { refetchCoupons(); toast.info('Refreshing coupons...'); }}>
            <RefreshIcon className="h-4 w-4" />
          </Button>
          <Button onClick={handleCreateCoupon} className="bg-purple-600 hover:bg-purple-700 transition-colors duration-200 shadow-sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Coupon
          </Button>
        </div>
      </div>
      <Card className="">
        <CardHeader>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search coupons..."
              value={couponSearchQuery}
              onChange={(e) => setCouponSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Code</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Discount</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Usage</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Valid Until</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCoupons.map((coupon) => (
                  <tr key={coupon.couponId} className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-150">
                    <td className="py-4 px-4">
                      <div className="font-mono font-medium text-foreground">{coupon.couponCode}</div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="text-sm font-mono text-foreground">
                        {coupon.couponType === 'Percentage' ? `${coupon.couponValue}%` : `₦${Number(coupon.couponValue || 0).toLocaleString()}`}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="text-sm text-foreground">
                        {coupon.couponRedemptionCount || 0}/{coupon.couponMaxRedemptions || 0}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-muted-foreground">
                        {coupon.couponValidUntil ? new Date(coupon.couponValidUntil).toLocaleDateString() : '—'}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={coupon.couponStatus || 'ACTIVE'} type="general" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVerticalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditCoupon(coupon)}>
                            <EditIcon className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCoupon(coupon)}>
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete
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
            currentPage={couponsPage}
            totalPages={couponsTotalPages}
            pageSize={couponsPageSize}
            totalItems={filteredCoupons.length}
            onPageChange={setCouponsPage}
            onPageSizeChange={setCouponsPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );

  // Webhooks Section Component
  const WebhooksSection = () => (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Webhooks</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure API keys and webhook endpoints</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => { refetchWebhooks(); toast.info('Refreshing webhooks...'); }}>
            <RefreshIcon className="h-4 w-4" />
          </Button>
          <Button onClick={handleAddWebhook} className="bg-purple-600 hover:bg-purple-700 transition-colors duration-200 shadow-sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Webhook
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="">
          <CardHeader>
            <CardTitle className="text-foreground">API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Public Key</div>
                <div className="font-mono text-sm text-foreground break-all">
                  pk_{business?.businessSlug || 'test'}_••••••••••••
                </div>
              </div>
              <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Secret Key</div>
                <div className="font-mono text-sm text-muted-foreground">
                  sk_{business?.businessSlug || 'test'}_••••••••••••
                </div>
              </div>
              <Button variant="outline" className="w-full transition-colors duration-200" onClick={handleRegenerateKeys}>
                <KeyIcon className="h-4 w-4 mr-2" />
                Regenerate Keys
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader>
            <CardTitle className="text-foreground">Webhook Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingWebhooks ? (
              <div className="text-center py-8 text-muted-foreground">Loading webhooks...</div>
            ) : businessWebhooks.length === 0 ? (
              <EmptyState
                icon={WebhookIcon}
                title="No webhooks configured"
                description="Set up webhook endpoints to receive real-time notifications"
                actionLabel="Add Webhook"
                onAction={handleAddWebhook}
              />
            ) : (
              <div className="space-y-3">
                {businessWebhooks.map((webhook) => (
                  <div key={webhook.webhookId} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm text-foreground truncate">{webhook.webhookUrl}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Events: {webhook.webhookEvents.join(', ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <StatusBadge status={webhook.webhookIsActive ? 'active' : 'inactive'} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestWebhook(webhook)}
                      >
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteWebhook(webhook.webhookId)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Settings Section Component
  const SettingsSection = () => (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage account settings</p>
      </div>

      {/* Plan & Billing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Plan & Billing</CardTitle>
          <p className="text-sm text-muted-foreground">
            Current plan: <span className="font-semibold">{tierInfo?.tierName || 'FREE'}</span>
            {tierInfo?.subscriptionStatus === 'ACTIVE' && tierInfo?.currentPeriodEnd && (
              <> · Next billing: {new Date(tierInfo.currentPeriodEnd).toLocaleDateString()}</>
            )}
            {tierInfo?.subscriptionStatus === 'PENDING_MANDATE' && (
              <> · <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 ml-1">Pending Activation</Badge></>
            )}
            {tierInfo?.subscriptionStatus === 'PAST_DUE' && (
              <> · <Badge className="bg-red-100 text-red-800 border-red-200 ml-1">Past Due</Badge></>
            )}
          </p>
        </CardHeader>
        <CardContent>
          {/* Tier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableTiers
              .sort((a: any, b: any) => (a.serviceTierSortOrder ?? 0) - (b.serviceTierSortOrder ?? 0))
              .map((tier: any) => {
                const price = tier.serviceTierMonthlyPrice;
                const isCurrentTier = tierInfo?.tierId
                  ? tierInfo.tierId === tier.serviceTierId
                  : tier.serviceTierName?.toUpperCase() === (tierInfo?.tierName || 'FREE').toUpperCase();
                const isFree = parseFloat(price || '0') === 0;
                const currentSortOrder = tierInfo?.tierId
                  ? availableTiers.find((t: any) => t.serviceTierId === tierInfo.tierId)?.serviceTierSortOrder ?? 0
                  : -1; // FREE has no tier row, treat as lowest
                const tierSortOrder = tier.serviceTierSortOrder ?? 0;
                const isDowngrade = tierSortOrder < currentSortOrder || (isFree && tierInfo?.tierId);
                return (
                  <div
                    key={tier.serviceTierId}
                    className={`relative flex flex-col rounded-xl border-2 p-5 transition-all ${isCurrentTier ? 'border-purple-500 bg-purple-50/50' : tier.serviceTierIsPopular ? 'border-purple-300' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    {tier.serviceTierIsPopular && (
                      <Badge className="absolute -top-2.5 left-4 bg-purple-600 text-white text-xs">Popular</Badge>
                    )}
                    {isCurrentTier && (
                      <Badge className="absolute -top-2.5 right-4 bg-green-600 text-white text-xs">Current</Badge>
                    )}
                    <h3 className="font-bold text-lg text-foreground">{tier.serviceTierName}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{tier.serviceTierDescription || ''}</p>
                    <div className="mt-3">
                      <span className="text-2xl font-bold text-foreground">{isFree ? 'Free' : formatPrice(price)}</span>
                      {!isFree && <span className="text-sm text-muted-foreground">/mo</span>}
                    </div>
                    <ul className="mt-3 space-y-1 text-sm text-muted-foreground flex-1">
                      <li>Customers: {formatLimit(tier.serviceTierMaxCustomers)}</li>
                      <li>Mandates: {formatLimit(tier.serviceTierMaxMandates)}</li>
                      <li>Products: {formatLimit(tier.serviceTierMaxProducts)}</li>
                      <li>Subscriptions: {formatLimit(tier.serviceTierMaxSubscriptions)}</li>
                      {tier.serviceTierNddEnabled && <li className="text-green-600 font-medium">NDD Enabled</li>}
                      {tier.serviceTierAllowCustomerManagement && <li className="text-green-600 font-medium">Customer Management</li>}
                    </ul>
                    <div className="mt-4">
                      {isCurrentTier ? (
                        <Button disabled className="w-full" variant="outline">Current Plan</Button>
                      ) : isFree && tierInfo?.tierId ? (
                        <Button
                          className="w-full"
                          variant="destructive"
                          onClick={() => setDowngradeConfirmModal(true)}
                        >
                          Downgrade to Free
                        </Button>
                      ) : isDowngrade ? (
                        <Button
                          className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                          variant="outline"
                          onClick={() => {
                            setSelectedUpgradeTier(tier);
                            setUpgradeConfirmModal(true);
                          }}
                        >
                          Downgrade
                        </Button>
                      ) : (
                        <Button
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => {
                            setSelectedUpgradeTier(tier);
                            setUpgradeConfirmModal(true);
                          }}
                        >
                          {tierInfo?.tierId ? 'Upgrade' : 'Upgrade'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Settlement Bank Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Settlement Bank Account</CardTitle>
          <p className="text-sm text-muted-foreground">Set your bank account for receiving NDD settlement payouts</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bank</Label>
              <Popover open={settBankOpen} onOpenChange={setSettBankOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={settBankOpen} className="w-full justify-between font-normal">
                    {settBankCode ? settBanksList.find(b => b.bankCode === settBankCode)?.bankName || 'Select bank' : 'Select bank'}
                    <SearchIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search bank..." />
                    <CommandList>
                      <CommandEmpty>No bank found.</CommandEmpty>
                      <CommandGroup>
                        {settBanksList.map((bank) => (
                          <CommandItem
                            key={bank.bankCode}
                            value={bank.bankName}
                            onSelect={() => {
                              setSettBankCode(bank.bankCode);
                              setSettBankName(bank.bankName);
                              setSettAccountName('');
                              setSettBankOpen(false);
                            }}
                          >
                            <CheckIcon className={`mr-2 h-4 w-4 ${settBankCode === bank.bankCode ? 'opacity-100' : 'opacity-0'}`} />
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
                value={settAccountNumber}
                maxLength={10}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  setSettAccountNumber(cleaned);
                  if (cleaned.length === 10 && settBankCode) {
                    setIsLookingUpSettAccount(true);
                    setSettAccountName('');
                    billingApi.verifyBankAccount({ bankCode: settBankCode, accountNumber: cleaned })
                      .then((res) => setSettAccountName(res.accountName || ''))
                      .catch(() => toast.error('Account lookup failed'))
                      .finally(() => setIsLookingUpSettAccount(false));
                  }
                }}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Account Name</Label>
              <Input
                value={isLookingUpSettAccount ? 'Looking up...' : settAccountName}
                disabled
                className="bg-muted/50"
              />
            </div>
            <div className="md:col-span-2">
              <Button
                disabled={!settBankCode || !settAccountNumber || !settAccountName || isSavingBankAccount}
                className="bg-purple-600 hover:bg-purple-700"
                onClick={async () => {
                  if (!business?.businessId) return;
                  setIsSavingBankAccount(true);
                  try {
                    await businessesApi.update(business.businessId, {
                      businessBankCode: settBankCode,
                      businessAccountName: settAccountName,
                      businessAccountNumber: settAccountNumber,
                    });
                    refreshBusiness();
                    toast.success('Bank account saved');
                  } catch (error: any) {
                    const msg = error?.response?.data?.message || 'Failed to save bank account';
                    toast.error(msg);
                  } finally {
                    setIsSavingBankAccount(false);
                  }
                }}
              >
                {isSavingBankAccount ? 'Saving...' : 'Save Bank Account'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settlements History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Settlements</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSettlements ? (
            <p className="text-sm text-muted-foreground">Loading settlements...</p>
          ) : settlements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No settlements yet. Settlements will appear here once payouts are processed.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {settlements.map((s) => (
                <div key={s.settlementId} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors duration-200">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold font-mono text-foreground">
                      {s.settlementCurrency || '₦'}{parseFloat(s.settlementNetAmount || s.settlementAmount || '0').toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground font-mono">{s.settlementReference}</div>
                    {s.settlementBankAccountNumber && (
                      <div className="text-xs text-muted-foreground mt-1">****{s.settlementBankAccountNumber.slice(-4)}</div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <StatusBadge status={s.settlementStatus || 'PENDING'} type="general" />
                    {s.settlementPaidAt && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(s.settlementPaidAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection />;
      case 'products':
        return <ProductsSection />;
      case 'plans':
        return <PlansSection />;
      case 'customers':
        return <CustomersSection />;
      case 'subscriptions':
        return <SubscriptionsSection />;
      case 'active-subscribers':
        return <ActiveSubscribersSection />;
      case 'mandates':
        return <MandatesSection />;
      case 'transactions':
        return <TransactionsSection />;
      case 'coupons':
        return <CouponsSection />;
      case 'webhooks':
        return <WebhooksSection />;
      case 'settings':
        return SettingsSection();
      default:
        return <OverviewSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader
        title="Business Dashboard"
        subtitle={business?.businessName || 'Loading...'}
        userMenu={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200">
                <span className="text-sm font-medium text-foreground">{user?.firstName} {user?.lastName}</span>
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold shadow-sm cursor-pointer">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-56 z-[9999]">
              <DropdownMenuItem onClick={() => setChangePasswordModal(true)}>
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
                    onClick={() => handleSectionChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer ${
                      isActive
                        ? 'bg-purple-600 text-white'
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
            <button onClick={() => toast.info('API documentation coming soon')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span>API Docs</span>
            </button>
            <button onClick={() => toast.info('Help & Support coming soon')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>Help & Support</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-gradient-to-br from-slate-100/80 via-gray-100/50 to-purple-50/30 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {renderActiveSection()}
          </div>
        </main>
      </div>

      {/* Create Plan Modal */}
      <Dialog open={createPlanModal} onOpenChange={setCreatePlanModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Subscription Plan</DialogTitle>
            <DialogDescription>Add a new subscription plan for your customers</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="product-select">Select Product</Label>
              <Select value={selectedProductId} onValueChange={handleProductSelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.productId} value={product.productId}>
                      {product.productName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Selecting a product will auto-populate amount and description</p>
            </div>
            <div>
              <Label htmlFor="plan-name">Plan Name</Label>
              <Input
                id="plan-name"
                placeholder="e.g., Premium Monthly Plan"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="plan-description">Description</Label>
              <Textarea
                id="plan-description"
                placeholder="Brief description of the plan"
                value={planDescription}
                onChange={(e) => setPlanDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plan-amount">Amount (₦)</Label>
                <Input
                  id="plan-amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g., 5,000"
                  value={planAmount}
                  onChange={(e) => setPlanAmount(formatAmountInput(e.target.value))}
                  className="mt-1"
                  disabled={!!(selectedProductId && products.find(p => p.productId === selectedProductId)?.productAmount)}
                />
                {selectedProductId && products.find(p => p.productId === selectedProductId)?.productAmount && (
                  <p className="text-xs text-gray-500 mt-1">Amount set by product</p>
                )}
              </div>
              <div>
                <Label htmlFor="plan-frequency">Billing Frequency</Label>
                <Select value={planFrequency} onValueChange={setPlanFrequency}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="plan-trial">Trial Period (days)</Label>
              <Input
                id="plan-trial"
                type="number"
                placeholder="e.g., 7"
                value={planTrialPeriod}
                onChange={(e) => setPlanTrialPeriod(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatePlanModal(false)}>Cancel</Button>
            <Button onClick={confirmCreatePlan} className="bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Plan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Modal */}
      <Dialog open={editPlanModal} onOpenChange={setEditPlanModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>Update plan details for {selectedPlan?.planName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-plan-name">Plan Name</Label>
              <Input
                id="edit-plan-name"
                placeholder="e.g., Premium Plan"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-plan-description">Description</Label>
              <Textarea
                id="edit-plan-description"
                placeholder="Brief description of the plan"
                value={planDescription}
                onChange={(e) => setPlanDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-plan-amount">Amount (₦)</Label>
                <Input
                  id="edit-plan-amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g., 5,000"
                  value={planAmount}
                  onChange={(e) => setPlanAmount(formatAmountInput(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-plan-frequency">Billing Frequency</Label>
                <Select value={planFrequency} onValueChange={setPlanFrequency}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-plan-trial">Trial Period (days)</Label>
              <Input
                id="edit-plan-trial"
                type="number"
                placeholder="e.g., 7"
                value={planTrialPeriod}
                onChange={(e) => setPlanTrialPeriod(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPlanModal(false)}>Cancel</Button>
            <Button onClick={confirmEditPlan} className="bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update Plan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Modal */}
      <Dialog open={deletePlanModal} onOpenChange={setDeletePlanModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedPlan?.planName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePlanModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeletePlan} disabled={isSubmitting}>{isSubmitting ? 'Deleting...' : 'Delete Plan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Customer Sheet */}
      <Sheet open={addCustomerModal} onOpenChange={(open) => {
        setAddCustomerModal(open);
        if (!open) resetAddCustomerForm();
      }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-8">
          <SheetHeader className="mb-10">
            <SheetTitle className="text-2xl font-bold">Add Customer</SheetTitle>
            <SheetDescription className="text-base">
              Create a new customer account and optionally link their bank account
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-8">
            {/* Personal Details Section */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                Personal Details
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer-first-name" className="text-sm font-medium">First Name</Label>
                  <Input
                    id="customer-first-name"
                    placeholder="John"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-last-name" className="text-sm font-medium">Last Name</Label>
                  <Input
                    id="customer-last-name"
                    placeholder="Doe"
                    value={customerLastName}
                    onChange={(e) => setCustomerLastName(e.target.value)}
                    className="mt-1.5 h-11"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="customer-email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    placeholder="john@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-phone" className="text-sm font-medium">Phone Number</Label>
                  <Input
                    id="customer-phone"
                    type="tel"
                    placeholder="+234 801 234 5678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="mt-1.5 h-11"
                  />
                </div>
              </div>
            </div>

            {/* Bank Account Toggle - Clean switch */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
              <div>
                <p className="font-medium">Link Bank Account</p>
                <p className="text-sm text-muted-foreground">Add customer's bank details now</p>
              </div>
              <Switch
                checked={linkBankAccount}
                onCheckedChange={(checked) => {
                  setLinkBankAccount(checked);
                  if (!checked) {
                    setCustomerBankName('');
                    setCustomerAccountNumber('');
                    setCustomerAccountName('');
                  }
                }}
              />
            </div>

            {/* Bank Details Section - Only when toggle is on */}
            {linkBankAccount && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Bank Account Details
                </p>
                <div>
                  <Label htmlFor="customer-bank" className="text-sm font-medium">Bank Name</Label>
                  <Popover open={custBankOpen} onOpenChange={setCustBankOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={custBankOpen} className="w-full justify-between font-normal mt-1.5 h-11">
                        {customerBankCode ? banksList.find(b => b.bankCode === customerBankCode)?.bankName || 'Select bank' : (isLoadingBanks ? 'Loading banks...' : 'Select bank')}
                        <SearchIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[9999]" align="start">
                      <Command>
                        <CommandInput placeholder="Search bank..." />
                        <CommandList>
                          <CommandEmpty>No bank found.</CommandEmpty>
                          <CommandGroup>
                            {banksList.map((bank) => (
                              <CommandItem
                                key={bank.bankCode}
                                value={bank.bankName}
                                onSelect={() => {
                                  setCustomerBankCode(bank.bankCode);
                                  setCustomerBankName(bank.bankName);
                                  setCustomerAccountName('');
                                  if (customerAccountNumber.length === 10) {
                                    handleCustomerAccountNumberChange(customerAccountNumber);
                                  }
                                  setCustBankOpen(false);
                                }}
                              >
                                <CheckIcon className={`mr-2 h-4 w-4 ${customerBankCode === bank.bankCode ? 'opacity-100' : 'opacity-0'}`} />
                                {bank.bankName}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="customer-account-number" className="text-sm font-medium">Account Number</Label>
                  <Input
                    id="customer-account-number"
                    placeholder="Enter 10-digit account number"
                    value={customerAccountNumber}
                    onChange={(e) => handleCustomerAccountNumberChange(e.target.value)}
                    disabled={!customerBankCode}
                    className="mt-1.5 h-11 font-mono"
                  />
                  {isLookingUpAccount && (
                    <p className="text-sm text-muted-foreground mt-2">Looking up account...</p>
                  )}
                </div>
                {customerAccountName && !isLookingUpAccount && (
                  <div className="p-4 rounded-lg bg-green-50/50 border border-green-200/50">
                    <p className="text-xs text-muted-foreground mb-1">Verified Account Name</p>
                    <p className="font-semibold text-green-900">{customerAccountName}</p>
                  </div>
                )}
              </div>
            )}

            {/* Subscription Plan Section - Only when bank account is verified */}
            {linkBankAccount && customerAccountName && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Subscription Plan
                </p>
                <div>
                  <Label className="text-sm font-medium">Select Plan</Label>
                  <Select value={customerPlanId} onValueChange={(val) => {
                    setCustomerPlanId(val);
                    // Auto-set product ID from plan
                    const plan = businessPlans.find(p => p.planId === val);
                    if (plan) setCustomerProductId(plan.planProductId || '');
                  }}>
                    <SelectTrigger className="mt-1.5 h-11">
                      <SelectValue placeholder="Select a subscription plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessPlans.filter(p => p.planStatus === 'ACTIVE').map(plan => {
                        const product = products.find(pr => pr.productId === plan.planProductId);
                        return (
                          <SelectItem key={plan.planId} value={plan.planId}>
                            <span className="font-medium">{plan.planName}</span>
                            <span className="text-muted-foreground ml-2">
                              {product?.productName && `(${product.productName}) `}- ₦{parseFloat(plan.planAmount || '0').toLocaleString()}/{(plan.planBillingInterval || 'MONTHLY').toLowerCase()}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {customerPlanId && (() => {
                  const selectedPlan = businessPlans.find(p => p.planId === customerPlanId);
                  const selectedProduct = products.find(pr => pr.productId === selectedPlan?.planProductId);
                  return (
                    <div className="p-5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <CheckIcon className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-900">{selectedPlan?.planName}</p>
                          <p className="text-xs text-green-700">{selectedProduct?.productName}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-green-200">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Amount</p>
                          <p className="text-xl font-bold font-mono text-green-900">₦{parseFloat(selectedPlan?.planAmount || '0').toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Billing Cycle</p>
                          <p className="text-lg font-semibold text-green-900">{selectedPlan?.planBillingInterval || 'MONTHLY'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Coupon Code */}
            {customerPlanId && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Coupon Code (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={applyCouponCode}
                    onChange={(e) => {
                      setApplyCouponCode(e.target.value.toUpperCase());
                      if (couponValidation) setCouponValidation(null);
                    }}
                    className="flex-1 font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!applyCouponCode.trim() || isValidatingCoupon}
                    onClick={async () => {
                      setIsValidatingCoupon(true);
                      try {
                        const selectedPlan = businessPlans.find(p => p.planId === customerPlanId);
                        const amount = parseFloat(selectedPlan?.planAmount || '0');
                        const result = await couponsApi.validate({ couponCode: applyCouponCode.trim(), amount });
                        setCouponValidation(result);
                      } catch {
                        setCouponValidation({ valid: false, discountAmount: 0, finalAmount: 0, message: 'Failed to validate coupon' });
                      } finally {
                        setIsValidatingCoupon(false);
                      }
                    }}
                  >
                    {isValidatingCoupon ? 'Checking...' : 'Apply'}
                  </Button>
                  {couponValidation && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="px-2"
                      onClick={() => { setApplyCouponCode(''); setCouponValidation(null); }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {couponValidation && (
                  couponValidation.valid ? (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-1">
                        <CheckIcon className="h-4 w-4" />
                        {couponValidation.message}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Discount:</span>
                        <span className="font-mono font-semibold text-green-700">-₦{couponValidation.discountAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-muted-foreground">Final Amount:</span>
                        <span className="font-mono font-bold text-green-900">₦{couponValidation.finalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm text-red-700">{couponValidation.message}</p>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Info note - subtle */}
            {!linkBankAccount && (
              <div className="p-4 rounded-lg bg-muted/30 border">
                <p className="text-sm text-muted-foreground">
                  A welcome email will be sent with password setup instructions. Bank account can be added later during subscription.
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 mt-8 pt-6 border-t">
            <Button variant="outline" className="flex-1" onClick={() => {
              setAddCustomerModal(false);
              resetAddCustomerForm();
            }}>
              Cancel
            </Button>
            <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={confirmAddCustomer} disabled={isSubmitting || isSendingEmailOtp}>
              {isSendingEmailOtp ? 'Sending Code...' : isSubmitting ? 'Processing...' : linkBankAccount ? 'Add & Continue' : 'Send Invite'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Customer Subscription Status Dialog */}
      <Dialog open={customerStatusModal} onOpenChange={setCustomerStatusModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Subscription Status</DialogTitle>
            <DialogDescription>
              {customerStatusName ? `Checking subscriptions for ${customerStatusName}` : 'Customer subscription status'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isCheckingCustomerStatus ? (
              <div className="text-center py-8 text-muted-foreground">Checking subscription status...</div>
            ) : customerStatusData ? (
              <div className="space-y-4">
                <div className={`flex items-center gap-3 p-4 rounded-xl border ${customerStatusData.isSubscribed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${customerStatusData.isSubscribed ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <TrendingUpIcon className={`h-5 w-5 ${customerStatusData.isSubscribed ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className={`font-semibold ${customerStatusData.isSubscribed ? 'text-green-900' : 'text-gray-700'}`}>
                      {customerStatusData.isSubscribed ? 'Active Subscriber' : 'Not Subscribed'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {customerStatusData.totalActive} active subscription{customerStatusData.totalActive !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {customerStatusData.subscriptions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Plans</h4>
                    {customerStatusData.subscriptions.map((sub: any) => (
                      <div key={sub.subscriptionId} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                        <div>
                          <p className="font-medium text-foreground">{sub.planName || 'Unknown Plan'}</p>
                          <p className="text-sm text-muted-foreground">
                            Started {sub.startDate ? new Date(sub.startDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <p className="font-mono font-medium text-foreground">
                              {sub.planAmount ? `₦${Number(sub.planAmount).toLocaleString()}` : 'N/A'}
                            </p>
                            <StatusBadge status={sub.status || 'UNKNOWN'} type="subscription" />
                          </div>
                          {(sub.status === 'PENDING_ACTIVATION' || sub.status === 'TRIALING') && sub.subscriptionId && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white ml-2"
                              onClick={async () => {
                                try {
                                  await subscriptionsApi.activate(sub.subscriptionId);
                                  toast.success('Subscription activated successfully');
                                  // Refresh the status data
                                  if (customerStatusData?.customerId) {
                                    const updated = await subscriptionsApi.checkCustomerStatus(customerStatusData.customerId);
                                    setCustomerStatusData(updated);
                                  }
                                  refetchSubscriptions();
                                } catch (err: any) {
                                  toast.error(err?.response?.data?.message || 'Failed to activate subscription');
                                }
                              }}
                            >
                              Activate
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No data available</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomerStatusModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email OTP Verification Dialog */}
      <Dialog open={emailOtpModal} onOpenChange={(open) => {
        if (!open) {
          setEmailOtpModal(false);
          setEmailOtpCode('');
          setPendingCustomerData(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Customer Email</DialogTitle>
            <DialogDescription>
              A 6-digit verification code has been sent to <strong>{emailOtpMasked}</strong>.
              Please ask the customer to check their email and share the code with you.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex gap-3">
                <MailIcon className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-purple-900">
                  <p className="font-medium mb-1">Email Verification Required</p>
                  <p className="text-purple-800">
                    Enter the 6-digit code the customer received at {emailOtpMasked} to verify their email address before creating their account.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center py-4">
              <InputOTP
                maxLength={6}
                value={emailOtpCode}
                onChange={setEmailOtpCode}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
                  <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
                  <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
                  <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
                  <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
                  <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
                </InputOTPGroup>
              </InputOTP>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  Didn't receive the code?{' '}
                  <button
                    onClick={handleResendEmailOtp}
                    disabled={isSendingEmailOtp}
                    className="text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
                  >
                    {isSendingEmailOtp ? 'Sending...' : 'Resend Code'}
                  </button>
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button variant="outline" onClick={() => {
              setEmailOtpModal(false);
              setEmailOtpCode('');
              setPendingCustomerData(null);
            }} disabled={isVerifyingEmailOtp}>
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleVerifyEmailOtp}
              disabled={emailOtpCode.length !== 6 || isVerifyingEmailOtp}
            >
              {isVerifyingEmailOtp ? 'Verifying...' : 'Verify & Continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Customer Modal */}
      <Dialog open={viewCustomerModal} onOpenChange={setViewCustomerModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>Complete information about {selectedCustomer?.customerFirstName} {selectedCustomer?.customerLastName}</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Name</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedCustomer.customerFirstName} {selectedCustomer.customerLastName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedCustomer.customerEmail}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={selectedCustomer.customerStatus || 'ACTIVE'} type="general" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Active Subscriptions</Label>
                  <p className="text-sm text-gray-900 mt-1">{getSubscriptionCount(selectedCustomer.customerId)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Phone</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedCustomer.customerPhone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Customer Since</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedCustomer.customerCreatedAt ? new Date(selectedCustomer.customerCreatedAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewCustomerModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Modal */}
      <Dialog open={editCustomerModal} onOpenChange={setEditCustomerModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-customer-name">Full Name</Label>
              <Input
                id="edit-customer-name"
                placeholder="e.g., John Doe"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-customer-email">Email Address</Label>
              <Input
                id="edit-customer-email"
                type="email"
                placeholder="e.g., john@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-customer-phone">Phone Number</Label>
              <Input
                id="edit-customer-phone"
                placeholder="e.g., +234 801 234 5678"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCustomerModal(false)}>Cancel</Button>
            <Button onClick={confirmEditCustomer} className="bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update Customer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Customer Modal */}
      <Dialog open={deleteCustomerModal} onOpenChange={setDeleteCustomerModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedCustomer?.customerFirstName} {selectedCustomer?.customerLastName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCustomerModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteCustomer} disabled={isSubmitting}>{isSubmitting ? 'Deleting...' : 'Delete Customer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Subscription Modal */}
      <Dialog open={viewSubscriptionModal} onOpenChange={setViewSubscriptionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
            <DialogDescription>Complete information about this subscription</DialogDescription>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Customer</Label>
                  <p className="text-sm text-gray-900 mt-1">{getCustomerName(selectedSubscription.subscriptionCustomerId)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Plan</Label>
                  <p className="text-sm text-gray-900 mt-1">{getPlanName(selectedSubscription.subscriptionPlanId)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={selectedSubscription.subscriptionStatus || 'UNKNOWN'} type="subscription" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Amount</Label>
                  <p className="text-sm text-gray-900 mt-1">₦{getPlanAmount(selectedSubscription.subscriptionPlanId).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Next Billing Date</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedSubscription.subscriptionCurrentPeriodEnd ? new Date(selectedSubscription.subscriptionCurrentPeriodEnd).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Start Date</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedSubscription.subscriptionStartDate ? new Date(selectedSubscription.subscriptionStartDate).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewSubscriptionModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Modal */}
      <Dialog open={cancelSubscriptionModal} onOpenChange={setCancelSubscriptionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this subscription for {getCustomerName(selectedSubscription?.subscriptionCustomerId || null)}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancel-reason">Reason for Cancellation</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Enter the reason for cancelling this subscription..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelSubscriptionModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmCancelSubscription} disabled={isSubmitting}>{isSubmitting ? 'Cancelling...' : 'Cancel Subscription'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Mandate Modal */}
      <Dialog open={viewMandateModal} onOpenChange={setViewMandateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mandate Details</DialogTitle>
            <DialogDescription>Complete information about this mandate</DialogDescription>
          </DialogHeader>
          {selectedMandate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Customer</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedMandate.mandatePayerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Bank</Label>
                  <p className="text-sm text-gray-900 mt-1">{getBankName(selectedMandate.mandateBankId)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Account Number</Label>
                  <p className="text-sm text-gray-900 mt-1">***{(selectedMandate.mandateAccountNumber || '').slice(-4)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={selectedMandate.mandateStatus || 'UNKNOWN'} type="mandate" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Amount</Label>
                  <p className="text-sm text-gray-900 mt-1">₦{parseFloat(selectedMandate.mandateAmount || '0').toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Frequency</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedMandate.mandateFrequency}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Created Date</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedMandate.mandateCreatedAt ? new Date(selectedMandate.mandateCreatedAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewMandateModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Mandate Modal */}
      <Dialog open={cancelMandateModal} onOpenChange={setCancelMandateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Mandate</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this direct debit mandate for {selectedMandate?.mandatePayerName}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelMandateModal(false)} disabled={isCancellingMandate}>Cancel</Button>
            <Button variant="destructive" onClick={confirmCancelMandate} disabled={isCancellingMandate}>{isCancellingMandate ? 'Cancelling...' : 'Cancel Mandate'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Coupon Modal */}
      <Dialog open={createCouponModal} onOpenChange={setCreateCouponModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Discount Coupon</DialogTitle>
            <DialogDescription>Add a new discount coupon for customers</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="coupon-code">Coupon Code</Label>
              <Input
                id="coupon-code"
                placeholder="e.g., SAVE20"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coupon-type">Discount Type</Label>
                <Select value={couponType} onValueChange={setCouponType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Percentage">Percentage</SelectItem>
                    <SelectItem value="Fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="coupon-value">
                  {couponType === 'Percentage' ? 'Discount (%)' : 'Amount (₦)'}
                </Label>
                <Input
                  id="coupon-value"
                  type="text"
                  inputMode="decimal"
                  placeholder={couponType === 'Percentage' ? 'e.g., 20' : 'e.g., 1,000'}
                  value={couponValue}
                  onChange={(e) => setCouponValue(couponType === 'Fixed' ? formatAmountInput(e.target.value) : e.target.value.replace(/[^\d.]/g, ''))}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coupon-limit">Usage Limit</Label>
                <Input
                  id="coupon-limit"
                  type="number"
                  placeholder="e.g., 100"
                  value={couponLimit}
                  onChange={(e) => setCouponLimit(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="coupon-valid">Valid Until</Label>
                <Input
                  id="coupon-valid"
                  type="date"
                  value={couponValidTo}
                  onChange={(e) => setCouponValidTo(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateCouponModal(false)} disabled={isSavingCoupon}>Cancel</Button>
            <Button onClick={confirmCreateCoupon} className="bg-purple-600 hover:bg-purple-700" disabled={isSavingCoupon}>{isSavingCoupon ? 'Creating...' : 'Create Coupon'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Coupon Modal */}
      <Dialog open={editCouponModal} onOpenChange={setEditCouponModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>Update coupon details for {selectedCoupon?.code}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-coupon-code">Coupon Code</Label>
              <Input
                id="edit-coupon-code"
                placeholder="e.g., SAVE20"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-coupon-type">Discount Type</Label>
                <Select value={couponType} onValueChange={setCouponType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Percentage">Percentage</SelectItem>
                    <SelectItem value="Fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-coupon-value">
                  {couponType === 'Percentage' ? 'Discount (%)' : 'Amount (₦)'}
                </Label>
                <Input
                  id="edit-coupon-value"
                  type="text"
                  inputMode="decimal"
                  placeholder={couponType === 'Percentage' ? 'e.g., 20' : 'e.g., 1,000'}
                  value={couponValue}
                  onChange={(e) => setCouponValue(couponType === 'Fixed' ? formatAmountInput(e.target.value) : e.target.value.replace(/[^\d.]/g, ''))}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-coupon-limit">Usage Limit</Label>
                <Input
                  id="edit-coupon-limit"
                  type="number"
                  placeholder="e.g., 100"
                  value={couponLimit}
                  onChange={(e) => setCouponLimit(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-coupon-valid">Valid Until</Label>
                <Input
                  id="edit-coupon-valid"
                  type="date"
                  value={couponValidTo}
                  onChange={(e) => setCouponValidTo(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCouponModal(false)} disabled={isSavingCoupon}>Cancel</Button>
            <Button onClick={confirmEditCoupon} className="bg-purple-600 hover:bg-purple-700" disabled={isSavingCoupon}>{isSavingCoupon ? 'Updating...' : 'Update Coupon'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Coupon Modal */}
      <Dialog open={deleteCouponModal} onOpenChange={setDeleteCouponModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the coupon "{selectedCoupon?.couponCode}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCouponModal(false)} disabled={isDeletingCoupon}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteCoupon} disabled={isDeletingCoupon}>{isDeletingCoupon ? 'Deleting...' : 'Delete Coupon'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Plan Modal */}
      <Dialog open={upgradeModal} onOpenChange={setUpgradeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Your Plan</DialogTitle>
            <DialogDescription>
              {upgradeMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
            <TrendingUpIcon className="h-8 w-8 text-purple-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">You&apos;re on the {tierInfo?.tierName || 'FREE'} plan</p>
              <p className="text-sm text-muted-foreground">Upgrade to unlock higher limits and more features.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeModal(false)}>Cancel</Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => { setUpgradeModal(false); handleSectionChange('settings'); }}
            >
              View Plans
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Confirmation Modal */}
      <Dialog open={upgradeConfirmModal} onOpenChange={setUpgradeConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Tier Upgrade</DialogTitle>
            <DialogDescription>
              You are about to upgrade to the <span className="font-semibold">{selectedUpgradeTier?.serviceTierName}</span> plan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="font-medium">{selectedUpgradeTier?.serviceTierName}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-muted-foreground">Monthly Amount</span>
              <span className="font-bold text-lg">
                {formatPrice(selectedUpgradeTier?.serviceTierMonthlyPrice)}
              </span>
            </div>

            {/* Your Account (Source) */}
            <div className="p-3 rounded-lg border bg-card">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Your Account (Transfer From)</p>
              {business?.businessAccountNumber ? (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank</span>
                    <span className="font-medium">{settBanksList.find(b => b.bankCode === business?.businessBankCode)?.bankName || business?.businessBankCode}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Account</span>
                    <span className="flex items-center gap-1">
                      <span className="font-mono font-medium">{business.businessAccountNumber}</span>
                      <button onClick={() => { navigator.clipboard.writeText(business.businessAccountNumber); toast.success('Copied!'); }} className="text-muted-foreground hover:text-foreground"><CopyIcon className="h-3 w-3" /></button>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{business.businessAccountName || business.businessName}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-amber-600">No bank account set. Please add one in Settings first.</p>
              )}
            </div>

            {/* Platform Account (Destination) */}
            <div className="p-3 rounded-lg border-2 border-green-200 bg-green-50/30">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Suscribly Account (Transfer ₦50 Here)</p>
              {platformAccount?.accountNumber ? (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank</span>
                    <span className="font-medium">{platformAccount.bankName || platformAccount.bankCode}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Account</span>
                    <span className="flex items-center gap-1">
                      <span className="font-mono font-medium">{platformAccount.accountNumber}</span>
                      <button onClick={() => { navigator.clipboard.writeText(platformAccount.accountNumber); toast.success('Copied!'); }} className="text-muted-foreground hover:text-foreground"><CopyIcon className="h-3 w-3" /></button>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{platformAccount.accountName}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Platform billing not configured yet.</p>
              )}
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              You will need to transfer ₦50 from your linked account to the Suscribly account to activate your mandate. After activation, ₦{parseFloat(selectedUpgradeTier?.serviceTierMonthlyPrice || '0').toLocaleString()} will be debited monthly.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeConfirmModal(false)} disabled={upgradeInProgress}>Cancel</Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={upgradeInProgress}
              onClick={async () => {
                setUpgradeInProgress(true);
                try {
                  const { tierUpgradeApi } = await import('@/lib/api/tierUpgrade');
                  const result = await tierUpgradeApi.initiate({
                    serviceTierId: selectedUpgradeTier.serviceTierId,
                    billingCycle: 'MONTHLY',
                  });
                  setTierUpgradeResult(result);
                  setUpgradeConfirmModal(false);
                  // Always show verification sheet with platform account details
                  setTierVerificationSheet(true);
                  // Refresh tier info
                  const { businessTierApi: tierApi } = await import('@/lib/api/serviceTiers');
                  const info = await tierApi.getMyTier();
                  setTierInfo(info);
                } catch (error: any) {
                  const msg = error?.response?.data?.message || 'Failed to initiate tier upgrade';
                  toast.error(msg);
                } finally {
                  setUpgradeInProgress(false);
                }
              }}
            >
              {upgradeInProgress ? 'Processing...' : 'Confirm Upgrade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Downgrade to Free Confirmation */}
      <Dialog open={downgradeConfirmModal} onOpenChange={setDowngradeConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Downgrade to Free Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your {tierInfo?.tierName} subscription and downgrade to the Free plan?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              <p className="font-medium mb-1">You will lose access to:</p>
              <ul className="list-disc list-inside space-y-1">
                {tierInfo?.nddEnabled && <li>NDD Direct Debit services</li>}
                {tierInfo?.customerManagementEnabled && <li>Customer management</li>}
                <li>Higher limits on customers, products, mandates, and subscriptions</li>
              </ul>
              <p className="mt-2">Your current mandate will be cancelled. This takes effect immediately.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDowngradeConfirmModal(false)} disabled={downgradeInProgress}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={downgradeInProgress}
              onClick={async () => {
                setDowngradeInProgress(true);
                try {
                  const { tierUpgradeApi } = await import('@/lib/api/tierUpgrade');
                  await tierUpgradeApi.cancel();
                  toast.success('Subscription cancelled. You are now on the Free plan.');
                  setDowngradeConfirmModal(false);
                  // Refresh tier info
                  const { businessTierApi: tierApi } = await import('@/lib/api/serviceTiers');
                  const info = await tierApi.getMyTier();
                  setTierInfo(info);
                } catch (error: any) {
                  const msg = error?.response?.data?.message || 'Failed to cancel subscription';
                  toast.error(msg);
                } finally {
                  setDowngradeInProgress(false);
                }
              }}
            >
              {downgradeInProgress ? 'Cancelling...' : 'Confirm Downgrade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tier Upgrade Verification Sheet */}
      <Sheet open={tierVerificationSheet} onOpenChange={(open) => { if (!open) stopTierPolling(); setTierVerificationSheet(open); }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-8">
          <SheetHeader className="mb-10">
            <SheetTitle className="text-2xl font-bold">Activate Your Subscription</SheetTitle>
            <SheetDescription className="text-base">
              Transfer ₦50 from your linked account to activate your {tierUpgradeResult?.serviceTierName} tier mandate
            </SheetDescription>
          </SheetHeader>

          {tierUpgradeResult && (
            <>
              <div className="space-y-8">
                {/* Status Banner */}
                {tierUpgradeResult.businessSubscriptionStatus === 'ACTIVE' ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50/50 border border-green-200/50">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm text-green-700">Subscription activated! Your {tierUpgradeResult.serviceTierName} plan is now active.</span>
                  </div>
                ) : tierPollingActive ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50/50 border border-blue-200/50">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-sm text-blue-700">Waiting for payment confirmation from your bank...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50/50 border border-amber-200/50">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-sm text-amber-700">Transfer ₦50 from your account below, then click "I have sent the money"</span>
                  </div>
                )}

                {/* Your Linked Account (Source) */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Your Linked Bank Account (Transfer From)
                  </p>
                  <div className="p-5 rounded-xl border bg-card/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Bank</p>
                        <p className="text-lg font-semibold">{tierUpgradeResult.payerBankName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Account Number</p>
                        <p className="text-lg font-mono flex items-center gap-2">{tierUpgradeResult.payerAccountNumber || 'N/A'}
                          {tierUpgradeResult.payerAccountNumber && <button onClick={() => { navigator.clipboard.writeText(tierUpgradeResult.payerAccountNumber); toast.success('Copied!'); }} className="text-muted-foreground hover:text-foreground"><CopyIcon className="h-4 w-4" /></button>}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Account Name</p>
                      <p className="text-lg font-semibold">{tierUpgradeResult.payerAccountName || 'N/A'}</p>
                    </div>
                  </div>
                  {!tierUpgradeResult.payerAccountNumber && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      Please add your bank account in Settings first
                    </p>
                  )}
                </div>

                {/* Arrow indicator */}
                <div className="flex justify-center">
                  <svg className="h-8 w-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>

                {/* Suscribly Platform Account (Destination) */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Suscribly Account (Transfer ₦50 Here)
                  </p>
                  <div className="p-5 rounded-xl border-2 border-green-200 bg-green-50/30">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Bank</p>
                        <p className="text-lg font-semibold">{tierUpgradeResult.platformBankName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Account Number</p>
                        <p className="text-lg font-mono flex items-center gap-2">{tierUpgradeResult.platformAccountNumber || 'N/A'}
                          {tierUpgradeResult.platformAccountNumber && <button onClick={() => { navigator.clipboard.writeText(tierUpgradeResult.platformAccountNumber); toast.success('Copied!'); }} className="text-muted-foreground hover:text-foreground"><CopyIcon className="h-4 w-4" /></button>}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <p className="text-xs text-muted-foreground mb-1">Account Name</p>
                      <p className="text-lg font-semibold">{tierUpgradeResult.platformAccountName || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Subscription Details */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Subscription Details
                  </p>
                  <div className="p-5 rounded-xl border bg-blue-50/30 border-blue-200/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Mandate Code</p>
                        <p className="text-lg font-semibold">{tierUpgradeResult.mandateCode || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Plan</p>
                        <p className="text-lg font-semibold">{tierUpgradeResult.serviceTierName}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-blue-200/50">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Recurring Amount</p>
                          <p className="text-2xl font-bold">₦{parseFloat(tierUpgradeResult.amount || '0').toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">Billing Cycle</p>
                          <p className="text-lg font-medium">{tierUpgradeResult.billingCycle}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Amount */}
                <div className="text-center py-6">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Activation Transfer Amount
                  </p>
                  <p className="text-4xl font-bold font-mono">₦50.00</p>
                </div>

                {/* Instructions */}
                <div className="p-5 rounded-xl bg-muted/30 border">
                  <p className="text-sm font-medium mb-3">How to Activate</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">1</span>
                      Transfer exactly ₦50.00 from your linked bank account to the Suscribly account above
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">2</span>
                      The transfer must come from the same bank account linked to your business
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">3</span>
                      Once confirmed, your mandate will be activated via NIBSS NDD
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">4</span>
                      After activation, monthly debits of ₦{parseFloat(tierUpgradeResult.amount || '0').toLocaleString()} will begin for your {tierUpgradeResult.serviceTierName} plan
                    </li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t">
                {tierUpgradeResult.businessSubscriptionStatus === 'ACTIVE' ? (
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      stopTierPolling();
                      setTierVerificationSheet(false);
                    }}
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Close
                  </Button>
                ) : tierPollingActive ? (
                  <Button
                    className="flex-1"
                    variant="outline"
                    disabled
                  >
                    <svg className="h-4 w-4 mr-2 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Checking for payment confirmation...
                  </Button>
                ) : (
                  <Button
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    onClick={() => {
                      startTierPolling();
                    }}
                  >
                    I have sent the money
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Regenerate API Keys Modal */}
      <Dialog open={regenerateKeysModal} onOpenChange={setRegenerateKeysModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate API Keys</DialogTitle>
            <DialogDescription>
              This will invalidate your current API keys. Any applications using the old keys will stop working.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenerateKeysModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmRegenerateKeys}>Regenerate Keys</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Webhook Modal */}
      <Dialog open={addWebhookModal} onOpenChange={setAddWebhookModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
            <DialogDescription>Configure a webhook endpoint to receive real-time notifications</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://your-domain.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="webhook-event">Event Type</Label>
              <Select value={webhookEvent} onValueChange={setWebhookEvent}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment.success">Payment Success</SelectItem>
                  <SelectItem value="payment.failed">Payment Failed</SelectItem>
                  <SelectItem value="subscription.created">Subscription Created</SelectItem>
                  <SelectItem value="subscription.cancelled">Subscription Cancelled</SelectItem>
                  <SelectItem value="mandate.created">Mandate Created</SelectItem>
                  <SelectItem value="mandate.cancelled">Mandate Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="webhook-secret">Secret Key (optional)</Label>
              <Input
                id="webhook-secret"
                type="password"
                placeholder="Secret for webhook verification"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddWebhookModal(false)} disabled={isAddingWebhook}>Cancel</Button>
            <Button onClick={confirmAddWebhook} className="bg-purple-600 hover:bg-purple-700" disabled={isAddingWebhook}>{isAddingWebhook ? 'Adding...' : 'Add Webhook'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Webhook Modal */}
      <Dialog open={testWebhookModal} onOpenChange={setTestWebhookModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Webhook</DialogTitle>
            <DialogDescription>
              Send a test event to your webhook endpoint to verify configuration
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestWebhookModal(false)} disabled={isTestingWebhook}>Cancel</Button>
            <Button onClick={confirmTestWebhook} className="bg-purple-600 hover:bg-purple-700" disabled={isTestingWebhook}>{isTestingWebhook ? 'Sending...' : 'Send Test Event'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Product Modal */}
      <Dialog open={createProductModal} onOpenChange={setCreateProductModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Create a product that you can use in subscription plans</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                placeholder="e.g., Premium Streaming Package"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                placeholder="Brief description of the product"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="product-amount">Amount (₦)</Label>
              <Input
                id="product-amount"
                type="text"
                inputMode="decimal"
                placeholder="e.g., 5,000"
                value={productAmount}
                onChange={(e) => setProductAmount(formatAmountInput(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateProductModal(false)}>Cancel</Button>
            <Button onClick={confirmCreateProduct} className="bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Product'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={editProductModal} onOpenChange={setEditProductModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-product-name">Product Name</Label>
              <Input
                id="edit-product-name"
                placeholder="e.g., Premium Streaming Package"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-product-description">Description</Label>
              <Textarea
                id="edit-product-description"
                placeholder="Brief description of the product"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-product-amount">Amount (₦)</Label>
              <Input
                id="edit-product-amount"
                type="text"
                inputMode="decimal"
                placeholder="e.g., 5,000"
                value={productAmount}
                onChange={(e) => setProductAmount(formatAmountInput(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProductModal(false)}>Cancel</Button>
            <Button onClick={confirmEditProduct} className="bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update Product'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Modal */}
      <Dialog open={deleteProductModal} onOpenChange={setDeleteProductModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedProduct?.productName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProductModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteProduct} disabled={isSubmitting}>{isSubmitting ? 'Deleting...' : 'Delete'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
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
            <Button onClick={handleChangePassword} className="bg-purple-600 hover:bg-purple-700">Change Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mandate Verification Sheet - Clean Silicon Valley Style */}
      <Sheet open={verificationModal} onOpenChange={setVerificationModal}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-8">
          <SheetHeader className="mb-10">
            <SheetTitle className="text-2xl font-bold">Payment Verification</SheetTitle>
            <SheetDescription className="text-base">
              Share these details with your customer to complete account verification
            </SheetDescription>
          </SheetHeader>

          {selectedMandate && (
            <>
              <div className="space-y-8" id="verification-content">
                {/* Status Banner - subtle */}
                <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50/50 border border-amber-200/50">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-sm text-amber-700">Awaiting customer verification</span>
                </div>

                {/* Customer Account - Clean card */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Customer's Linked Bank Account
                  </p>
                  <div className="p-5 rounded-xl border bg-card/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Bank</p>
                        <p className="text-lg font-semibold">{getBankName(selectedMandate.mandateBankId)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Account</p>
                        <p className="text-lg font-mono">{selectedMandate.mandateAccountNumber}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Account Holder</p>
                      <p className="text-lg font-semibold">{selectedMandate.mandatePayerName}</p>
                    </div>
                    {selectedMandate.mandatePayerEmail && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Customer Email</p>
                        <p className="text-sm font-medium text-primary">{selectedMandate.mandatePayerEmail}</p>
                      </div>
                    )}
                    {selectedMandate.mandatePayerPhone && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Customer Phone</p>
                        <p className="text-sm font-medium text-[#25D366]">{selectedMandate.mandatePayerPhone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow indicator */}
                <div className="flex justify-center">
                  <svg className="h-8 w-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>

                {/* Destination Account */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Destination Account (Transfer ₦50 here)
                  </p>
                  <div className="p-5 rounded-xl border-2 border-green-200 bg-green-50/30">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Bank</p>
                        <p className="text-lg font-semibold">{getBankName(business?.businessBankCode)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Account Number</p>
                        <p className="text-lg font-mono">{business?.businessAccountNumber || 'Not configured'}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <p className="text-xs text-muted-foreground mb-1">Account Name</p>
                      <p className="text-lg font-semibold">{business?.businessAccountName || business?.businessName}</p>
                    </div>
                  </div>
                  {!business?.businessAccountNumber && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      Please configure your bank details in Settings to receive the ₦50 activation fee
                    </p>
                  )}
                </div>

                {/* Subscription Plan Details - Only show if plan was selected */}
                {selectedMandate.mandateProductId && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      Subscription Details
                    </p>
                    <div className="p-5 rounded-xl border bg-blue-50/30 border-blue-200/50">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Mandate Code</p>
                          <p className="text-lg font-semibold">{selectedMandate.mandateCode || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Narration</p>
                          <p className="text-lg font-semibold">{selectedMandate.mandateNarration || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-blue-200/50">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Recurring Amount</p>
                            <p className="text-2xl font-bold">₦{parseFloat(selectedMandate.mandateAmount || '0').toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">Billing Cycle</p>
                            <p className="text-lg font-medium">{selectedMandate.mandateFrequency}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Amount - Large and prominent */}
                <div className="text-center py-6">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Verification Amount
                  </p>
                  <p className="text-4xl font-bold font-mono">₦50.00</p>
                </div>

                {/* Instructions - Clean list */}
                <div className="p-5 rounded-xl bg-muted/30 border">
                  <p className="text-sm font-medium mb-3">Instructions for Customer</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">1</span>
                      Transfer exactly ₦50.00 from the linked account to the destination account above
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">2</span>
                      Once the ₦50 is confirmed, your mandate will be activated via NIBSS NDD
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">3</span>
                      {selectedMandate.mandateFrequency
                        ? `After activation, ${selectedMandate.mandateFrequency.toLowerCase()} debits of ₦${parseFloat(selectedMandate.mandateAmount || '0').toLocaleString()} will begin based on your plan`
                        : 'After activation, direct debit payments will begin based on your subscription plan'}
                    </li>
                  </ul>
                </div>

                {/* Print-only content */}
                <div className="hidden print:block text-center mt-8 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">{business?.businessName} - Subscription Management</p>
                </div>
              </div>

              {/* Actions - Clean buttons */}
              <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t print:hidden">
                <Button variant="outline" onClick={handleCopyToClipboard}>
                  {copiedToClipboard ? <CheckIcon className="h-4 w-4 mr-2" /> : <CopyIcon className="h-4 w-4 mr-2" />}
                  {copiedToClipboard ? 'Copied' : 'Copy'}
                </Button>
                <Button variant="outline" onClick={handleSendEmail}>
                  <MailIcon className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShareWhatsApp}
                  className="border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  onClick={() => {
                    setVerificationModal(false);
                    toast.success('Mandate details shared. Mandate will activate once customer completes ₦50 transfer.');
                  }}
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Done
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
