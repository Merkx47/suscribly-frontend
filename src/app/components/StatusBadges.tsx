import { Badge } from '@/app/components/ui/badge';
import type { MandateStatus, SubscriptionStatus, PaymentStatus } from '@/types';

interface StatusBadgeProps {
  status: MandateStatus | SubscriptionStatus | PaymentStatus | string;
  type: 'mandate' | 'subscription' | 'payment' | 'general';
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  // Normalize status to Title Case for matching (handles "ACTIVE" -> "Active", "PENDING_ACTIVATION" -> "Pending Activation", etc.)
  const normalized = (status || 'Unknown')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const getStatusColor = () => {
    if (type === 'mandate') {
      const mandateColors: Record<string, string> = {
        'Biller Initiated': 'bg-blue-100 text-blue-800 border-blue-200',
        'Biller Approved': 'bg-green-100 text-green-800 border-green-200',
        'Biller Rejected': 'bg-red-100 text-red-800 border-red-200',
        'Bank Pending': 'bg-orange-100 text-orange-800 border-orange-200',
        'Bank Approved': 'bg-emerald-100 text-emerald-800 border-emerald-200',
        'Bank Rejected': 'bg-red-100 text-red-800 border-red-200',
        'Active': 'bg-green-100 text-green-800 border-green-200',
        'Suspended': 'bg-gray-100 text-gray-800 border-gray-200',
        'Cancelled': 'bg-gray-100 text-gray-800 border-gray-200',
      };
      return mandateColors[normalized] || 'bg-gray-100 text-gray-800 border-gray-200';
    }

    if (type === 'subscription') {
      const subscriptionColors: Record<string, string> = {
        'Active': 'bg-green-100 text-green-800 border-green-200',
        'Pending Activation': 'bg-orange-100 text-orange-800 border-orange-200',
        'Trialing': 'bg-blue-100 text-blue-800 border-blue-200',
        'Past Due': 'bg-red-100 text-red-800 border-red-200',
        'Paused': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'Cancelled': 'bg-gray-100 text-gray-800 border-gray-200',
        'Expired': 'bg-red-100 text-red-800 border-red-200',
      };
      return subscriptionColors[normalized] || 'bg-gray-100 text-gray-800 border-gray-200';
    }

    if (type === 'payment') {
      const paymentColors: Record<string, string> = {
        'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'Processing': 'bg-blue-100 text-blue-800 border-blue-200',
        'Success': 'bg-green-100 text-green-800 border-green-200',
        'Failed': 'bg-red-100 text-red-800 border-red-200',
      };
      return paymentColors[normalized] || 'bg-gray-100 text-gray-800 border-gray-200';
    }

    // General status colors
    const generalColors: Record<string, string> = {
      'Active': 'bg-green-100 text-green-800 border-green-200',
      'Inactive': 'bg-gray-100 text-gray-800 border-gray-200',
      'Suspended': 'bg-red-100 text-red-800 border-red-200',
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Completed': 'bg-green-100 text-green-800 border-green-200',
      'Processing': 'bg-blue-100 text-blue-800 border-blue-200',
      'Expired': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return generalColors[normalized] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Badge variant="outline" className={`${getStatusColor()} font-medium shadow-sm`}>
      {normalized}
    </Badge>
  );
}
