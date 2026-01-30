interface ReccurLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function ReccurLogo({ className = '', showText = true, size = 'md' }: ReccurLogoProps) {
  const sizes = {
    sm: { icon: 32, text: 'text-xl' },
    md: { icon: 48, text: 'text-3xl' },
    lg: { icon: 64, text: 'text-4xl' },
    xl: { icon: 80, text: 'text-5xl' }
  };

  const { icon: iconSize, text: textSize } = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg 
        width={iconSize} 
        height={iconSize} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Outer rotating circle - representing recurring cycle */}
        <circle 
          cx="50" 
          cy="50" 
          r="45" 
          stroke="url(#gradient1)" 
          strokeWidth="3" 
          fill="none"
          strokeDasharray="220 60"
          strokeLinecap="round"
        />
        
        {/* Middle rotating circle - offset */}
        <circle 
          cx="50" 
          cy="50" 
          r="35" 
          stroke="url(#gradient2)" 
          strokeWidth="3" 
          fill="none"
          strokeDasharray="180 40"
          strokeLinecap="round"
          transform="rotate(120 50 50)"
        />
        
        {/* Inner rotating circle */}
        <circle 
          cx="50" 
          cy="50" 
          r="25" 
          stroke="url(#gradient3)" 
          strokeWidth="3" 
          fill="none"
          strokeDasharray="140 20"
          strokeLinecap="round"
          transform="rotate(240 50 50)"
        />
        
        {/* Center symbol - stylized "R" with currency/cycle feel */}
        <path 
          d="M 45 35 L 45 65 M 45 35 L 55 35 C 60 35 60 42 55 42 L 45 42 M 55 42 L 60 50 L 58 65" 
          stroke="url(#gradient4)" 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Accent dots for motion/cycle indication */}
        <circle cx="50" cy="5" r="3" fill="#3b82f6">
          <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="95" cy="50" r="3" fill="#10b981">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="95" r="3" fill="#3b82f6">
          <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" begin="0.66s" />
        </circle>
        
        {/* Gradients */}
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="gradient3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="gradient4" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>
      </svg>
      
      {showText && (
        <span className={`font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent ${textSize}`}>
          Reccur
        </span>
      )}
    </div>
  );
}
