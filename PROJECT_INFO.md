# Reccur - B2B2C Subscription Management Platform

## Overview
Reccur is a comprehensive subscription management and recurring payment platform designed for the Nigerian market. It enables businesses to collect automated payments from customers via bank account direct debits through NIBSS integration.

## Architecture

### Three-Portal System

#### 1. Platform Admin Dashboard (`/platform-admin`)
**Users:** Reccur's internal team (super admins, admins, support staff)

**Key Features:**
- Platform-wide metrics and analytics
- Tenant management (view, suspend, activate accounts)
- Platform pricing tier management (Free, Starter, Growth, Enterprise)
- Revenue tracking and billing
- Activity logs and audit trails
- NIBSS integration settings

#### 2. Tenant Dashboard (`/tenant`)
**Users:** Businesses collecting recurring payments from their customers

**Key Features:**
- Business metrics (MRR, active subscribers, churn rate)
- Subscription plan builder with flexible billing cycles
  - One-time, Daily, Weekly, Monthly, Quarterly, Yearly, Multi-year
- Customer management
- Subscription tracking
- Direct debit mandate management (10-state workflow)
- Transaction history with retry tracking
- Discount coupon system
- Team member management
- Settlement tracking
- API key management
- Webhook configuration

#### 3. Customer Portal (`/customer`)
**Users:** End customers (payers) subscribing to business services

**Key Features:**
- Active subscription overview
- Subscription details and cancellation flow
- Payment history with receipt downloads
- Bank account/mandate management
- Profile and password management

## Mandate Workflow States

The platform tracks direct debit mandates through 10 distinct states:

1. **Biller Initiated** - Business creates mandate request
2. **Biller Pending** - Awaiting internal approval
3. **Biller Approved** - Business approves mandate
4. **Biller Rejected** - Business rejects mandate
5. **Bank Pending** - Sent to bank for approval
6. **Bank Approved** - Bank approves mandate
7. **Bank Rejected** - Bank rejects mandate
8. **Active** - Mandate is active and charges can be processed
9. **Suspended** - Temporarily suspended
10. **Cancelled** - Permanently cancelled

## Design System

### Color Palette
- **Primary (Trust):** Blue (#3b82f6) - Platform admin, primary actions
- **Secondary (Finance):** Green (#10b981) - Revenue, success states
- **Status Colors:**
  - Success/Active: Green (#10b981)
  - Pending/Warning: Yellow/Orange (#f59e0b)
  - Failed/Rejected: Red (#ef4444)
  - Neutral/Inactive: Gray (#6b7280)

### Typography
- Professional and clean
- Hierarchical structure for data-heavy interfaces
- Monospace for reference numbers and codes

### Components

#### Status Badges
- `MandateStatus` - 10-state workflow badges
- `SubscriptionStatus` - Active, Paused, Cancelled, Expired
- `PaymentStatus` - Pending, Processing, Success, Failed

#### Data Tables
- Pagination support
- Search and filter functionality
- Responsive design
- Action menus

#### Charts
- Revenue trend line charts (Recharts)
- Subscriber growth bar charts
- Payment success rate pie charts

#### Empty States
- Friendly messaging
- Clear call-to-action
- Contextual icons

#### Loading Skeletons
- Metric card skeletons
- Table skeletons
- Chart skeletons
- Dashboard skeletons

## Tech Stack

### Frontend
- **React 18.3.1** - UI library
- **TypeScript** - Type safety
- **React Router DOM 7.13.0** - Navigation
- **Tailwind CSS 4.1.12** - Styling
- **Recharts 2.15.2** - Data visualization
- **Lucide React** - Icons
- **Radix UI** - Accessible component primitives

### Mock Data
Comprehensive mock data demonstrates:
- 4 platform pricing plans
- 4 sample tenants with realistic metrics
- Customer subscriptions and transactions
- Mandate workflow examples
- Coupon and settlement data
- Activity logs

## Key User Flows

### Tenant Onboarding Flow
1. Business registration and KYC verification
2. Bank account setup
3. Create first subscription plan
4. Invite first customer
5. Customer subscribes and authorizes mandate
6. First successful recurring charge

### Customer Subscription Flow
1. Customer discovers and selects plan
2. Provides bank account details
3. Mandate authorization (Biller → Bank approval)
4. Mandate becomes Active
5. Recurring charges begin
6. Payment notifications

### Payment Failure Flow
1. Charge attempt fails
2. Automatic retry attempts (configurable)
3. Customer notification
4. Support team intervention if needed
5. Resolution and retry

## Mobile Responsive
All portals are fully responsive with:
- Adaptive layouts for mobile, tablet, and desktop
- Touch-friendly interactions
- Collapsible tables on small screens
- Bottom navigation for mobile

## Future Enhancements

### Recommended for Production
1. **Backend Integration**
   - Supabase for multi-tenant database
   - Row-level security for data isolation
   - Real-time subscriptions for live updates

2. **Authentication**
   - Email/password with 2FA
   - Role-based access control (RBAC)
   - Session management

3. **NIBSS Integration**
   - Direct debit mandate API
   - Payment processing webhooks
   - Bank reconciliation

4. **Notifications**
   - Email notifications (SendGrid/Mailgun)
   - SMS notifications (Twilio/Termii)
   - In-app notifications

5. **Compliance & Security**
   - PCI DSS compliance for payment data
   - Data encryption at rest and in transit
   - Audit logging
   - GDPR/NDPR compliance

6. **Analytics**
   - Advanced reporting
   - Export to CSV/Excel
   - Custom date ranges
   - Cohort analysis

7. **API**
   - RESTful API for integrations
   - Webhook events
   - API documentation (Swagger)
   - Rate limiting

## Development

### Running Locally
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Project Structure
```
src/
├── app/
│   ├── components/
│   │   ├── portals/
│   │   │   ├── PlatformAdminDashboard.tsx
│   │   │   ├── TenantDashboard.tsx
│   │   │   └── CustomerPortal.tsx
│   │   ├── ui/ (Radix UI components)
│   │   ├── StatusBadges.tsx
│   │   ├── MetricCard.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   ├── OnboardingGuide.tsx
│   │   └── QuickActions.tsx
│   └── App.tsx
├── data/
│   └── mockData.ts
├── types/
│   └── index.ts
└── styles/
```

## License
Proprietary - Reccur Platform

## Support
For questions or support, contact the development team.

---

**Note:** This is a comprehensive UI demonstration with mock data. Production deployment requires backend integration, proper authentication, NIBSS API integration, and compliance measures for handling financial transactions and PII.
