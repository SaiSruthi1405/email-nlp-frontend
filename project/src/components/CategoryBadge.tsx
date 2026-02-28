import { Briefcase, Calendar, Star, Inbox, Ban } from 'lucide-react';

interface CategoryBadgeProps {
  category: 'job' | 'event' | 'important' | 'others' | 'spam';
  size?: 'sm' | 'md';
}

export default function CategoryBadge({ category, size = 'md' }: CategoryBadgeProps) {
  const configs = {
    job: {
      icon: Briefcase,
      label: 'Job',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
    },
    event: {
      icon: Calendar,
      label: 'Event',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
    },
    important: {
      icon: Star,
      label: 'Important',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
    },
    others: {
      icon: Inbox,
      label: 'Others',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
    },
    spam: {
      icon: Ban,
      label: 'Spam',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
    },
  };

  const config = configs[category];
  const Icon = config.icon;

  const sizeClasses = size === 'sm'
    ? 'px-2 py-1 text-xs'
    : 'px-3 py-1.5 text-sm';

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rounded-full font-medium ${config.bgColor} ${config.textColor} ${sizeClasses}`}
    >
      <Icon className={iconSize} />
      <span>{config.label}</span>
    </span>
  );
}
