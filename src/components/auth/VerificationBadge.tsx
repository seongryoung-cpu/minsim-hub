import { Shield, ShieldCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { VerificationLevel } from '@/types/auth';

interface VerificationBadgeProps {
  level: VerificationLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const levelConfig: Record<VerificationLevel, {
  icon: typeof Shield;
  label: string;
  color: string;
  bgColor: string;
}> = {
  anonymous: {
    icon: ShieldAlert,
    label: '미인증',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  social: {
    icon: Shield,
    label: '소셜 인증',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  phone: {
    icon: ShieldCheck,
    label: '휴대폰 인증',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  identity: {
    icon: CheckCircle2,
    label: '본인 인증',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
};

const sizeConfig = {
  sm: { icon: 'w-3 h-3', text: 'text-xs', padding: 'px-1.5 py-0.5' },
  md: { icon: 'w-4 h-4', text: 'text-sm', padding: 'px-2 py-1' },
  lg: { icon: 'w-5 h-5', text: 'text-base', padding: 'px-3 py-1.5' },
};

export function VerificationBadge({ level, showLabel = true, size = 'md' }: VerificationBadgeProps) {
  const config = levelConfig[level];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full ${config.bgColor} ${sizes.padding}`}>
      <Icon className={`${sizes.icon} ${config.color}`} />
      {showLabel && (
        <span className={`${sizes.text} font-medium ${config.color}`}>
          {config.label}
        </span>
      )}
    </div>
  );
}
