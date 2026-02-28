import { AlertCircle, Circle, ArrowDown } from 'lucide-react';

interface PriorityBadgeProps {
  priority: 'high' | 'medium' | 'low';
  size?: 'sm' | 'md';
}

export default function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const configs = {
    high: {
      icon: AlertCircle,
      label: 'High',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
    },
    medium: {
      icon: Circle,
      label: 'Medium',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
    },
    low: {
      icon: ArrowDown,
      label: 'Low',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-600',
    },
  };

  const config = configs[priority];
  const Icon = config.icon;

  const sizeClasses = size === 'sm'
    ? 'px-2 py-1 text-xs'
    : 'px-3 py-1.5 text-sm';

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <span
      className={`inline-flex items-center space-x-1 rounded-full font-medium ${config.bgColor} ${config.textColor} ${sizeClasses}`}
    >
      <Icon className={iconSize} />
      <span>{config.label}</span>
    </span>
  );
}
