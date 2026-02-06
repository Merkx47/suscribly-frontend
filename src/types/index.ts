// Mandate Workflow States
export type MandateStatus =
  | 'Biller Initiated'
  | 'Biller Approved'
  | 'Biller Rejected'
  | 'Bank Pending'
  | 'Bank Approved'
  | 'Bank Rejected'
  | 'Active'
  | 'Suspended'
  | 'Cancelled';

// Subscription Status
export type SubscriptionStatus = 'Active' | 'Paused' | 'Cancelled' | 'Expired';

// Payment Status
export type PaymentStatus = 'Pending' | 'Processing' | 'Success' | 'Failed';

// Billing Frequency
export type BillingFrequency =
  | 'One-time'
  | 'Daily'
  | 'Weekly'
  | 'Monthly'
  | 'Quarterly'
  | 'Yearly'
  | 'Multi-year';

// User Roles
export type UserRole = 'Super Admin' | 'Admin' | 'Support' | 'Owner' | 'Member';

// Platform Plan
export interface PlatformPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  limits: {
    subscribers: number;
    transactions: number;
  };
}

// Business (for Admin portal - represents a business using the platform)
export interface Business {
  id: string;
  businessName: string;
  email: string;
  phone: string;
  plan: string;
  status: 'Active' | 'Suspended' | 'Inactive';
  activeSubscribers: number;
  monthlyRevenue: number;
  joinedDate: string;
}

// Customer
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  subscriptions: number;
  totalPaid: number;
  joinedDate: string;
  businessId?: string;
}

// Product
export interface Product {
  id: string;
  name: string;
  description: string;
  amount: number;
  status: 'Active' | 'Inactive';
  createdDate: string;
  businessId?: string;
}

// Subscription Plan
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  frequency: BillingFrequency;
  trialPeriod: number;
  status: 'Active' | 'Inactive';
  subscribers: number;
  productId?: string;
  businessId?: string;
}

// Subscription
export interface Subscription {
  id: string;
  planId: string;
  planName: string;
  customerId: string;
  customerName: string;
  status: SubscriptionStatus;
  amount: number;
  frequency: BillingFrequency;
  nextBillingDate: string;
  startDate: string;
  mandateStatus: MandateStatus;
}

// Mandate
export interface Mandate {
  id: string;
  customerId: string;
  customerName: string;
  bankName: string;
  accountNumber: string;
  status: MandateStatus;
  amount: number;
  frequency: BillingFrequency;
  createdDate: string;
  approvedDate?: string;
}

// Transaction/Charge
export interface Transaction {
  id: string;
  subscriptionId: string;
  customerId: string;
  customerName: string;
  amount: number;
  status: PaymentStatus;
  date: string;
  retryCount: number;
  reference: string;
}

// Coupon
export interface Coupon {
  id: string;
  code: string;
  type: 'Percentage' | 'Fixed';
  value: number;
  usageLimit: number;
  usageCount: number;
  validFrom: string;
  validTo: string;
  status: 'Active' | 'Expired' | 'Inactive';
}

// Team Member
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  lastActive: string;
}

// Settlement
export interface Settlement {
  id: string;
  amount: number;
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  date: string;
  bankAccount: string;
  reference: string;
}

// Activity Log
export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

// Dashboard Metrics
export interface DashboardMetrics {
  totalRevenue: number;
  activeSubscribers: number;
  successfulCharges: number;
  failedCharges: number;
  upcomingRenewals: number;
  monthlyRecurringRevenue: number;
  churnRate: number;
  growthRate: number;
}
