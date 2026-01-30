import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { 
  PlusIcon, 
  UserPlusIcon, 
  PackageIcon, 
  CreditCardIcon, 
  FileTextIcon, 
  SettingsIcon, 
  LogOutIcon 
} from '@/app/components/icons/FinanceIcons';

export function QuickActions({ type }: { type: 'platform' | 'tenant' | 'customer' }) {
  if (type === 'platform') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Quick Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Platform Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add New Tenant
          </DropdownMenuItem>
          <DropdownMenuItem>
            <PackageIcon className="h-4 w-4 mr-2" />
            Create Platform Plan
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FileTextIcon className="h-4 w-4 mr-2" />
            Generate Report
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <SettingsIcon className="h-4 w-4 mr-2" />
            Platform Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (type === 'tenant') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Quick Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <PackageIcon className="h-4 w-4 mr-2" />
            Create New Plan
          </DropdownMenuItem>
          <DropdownMenuItem>
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Add Customer
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCardIcon className="h-4 w-4 mr-2" />
            Process Payment
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FileTextIcon className="h-4 w-4 mr-2" />
            Create Coupon
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Help & Documentation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return null;
}

export function UserMenu({ userName, userEmail, userInitials }: { userName: string; userEmail: string; userInitials: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-medium">
            {userInitials}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <SettingsIcon className="h-4 w-4 mr-2" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem>
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Help & Support
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600">
          <LogOutIcon className="h-4 w-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
