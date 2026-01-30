import { Link } from 'react-router-dom';
import { ReccurLogo } from '@/app/components/ReccurLogo';

interface PortalHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  userMenu?: React.ReactNode;
}

export function PortalHeader({ title, subtitle, actions, userMenu }: PortalHeaderProps) {
  return (
    <header className="h-16 border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="h-full px-6 flex items-center justify-between gap-4">
        {/* Left section - Logo and Title */}
        <div className="flex items-center gap-6">
          <Link to="/" className="hover:opacity-80 flex-shrink-0">
            <ReccurLogo size="sm" showText={true} />
          </Link>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

          {/* Title */}
          <div className="hidden sm:block">
            <span className="text-lg font-semibold text-gray-900">{title}</span>
            {subtitle && (
              <span className="text-sm text-gray-500 ml-3">{subtitle}</span>
            )}
          </div>
        </div>

        {/* Right section - Controls */}
        <div className="flex items-center gap-3">
          {actions}
          {userMenu}
        </div>
      </div>
    </header>
  );
}
