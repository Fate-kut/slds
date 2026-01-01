/**
 * StatusBadge Component
 * Displays status indicators with appropriate colors and icons
 * Used for locker status, exam mode, and other system states
 */

import React from 'react';
import { Lock, Unlock, BookOpen, FileText, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Badge variant types
type BadgeVariant = 'locked' | 'unlocked' | 'exam' | 'normal' | 'warning';

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

/**
 * Get the appropriate icon for each variant
 */
const getIcon = (variant: BadgeVariant, size: number) => {
  const iconProps = { size, className: 'flex-shrink-0' };
  
  switch (variant) {
    case 'locked':
      return <Lock {...iconProps} />;
    case 'unlocked':
      return <Unlock {...iconProps} />;
    case 'exam':
      return <FileText {...iconProps} />;
    case 'normal':
      return <BookOpen {...iconProps} />;
    case 'warning':
      return <AlertTriangle {...iconProps} />;
    default:
      return null;
  }
};

/**
 * Get default label for each variant
 */
const getDefaultLabel = (variant: BadgeVariant): string => {
  switch (variant) {
    case 'locked':
      return 'Locked';
    case 'unlocked':
      return 'Unlocked';
    case 'exam':
      return 'Exam Mode';
    case 'normal':
      return 'Normal Mode';
    case 'warning':
      return 'Warning';
    default:
      return '';
  }
};

/**
 * StatusBadge Component
 * Renders a styled badge with icon and label
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  label,
  size = 'md',
  showIcon = true,
  className,
}) => {
  // Determine icon size based on badge size
  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 18 : 14;
  
  // Size-specific styles
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
  };
  
  // Variant-specific styles using design system classes
  const variantStyles = {
    locked: 'status-locked',
    unlocked: 'status-unlocked',
    exam: 'status-exam',
    normal: 'status-normal',
    warning: 'status-exam', // Reuse exam styling for warnings
  };
  
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        'transition-all duration-200',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
    >
      {showIcon && getIcon(variant, iconSize)}
      <span>{label || getDefaultLabel(variant)}</span>
    </span>
  );
};

export default StatusBadge;
