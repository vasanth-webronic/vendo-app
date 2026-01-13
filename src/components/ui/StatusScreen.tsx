import { LucideIcon, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { ReactNode } from 'react';

interface StatusScreenProps {
  icon?: LucideIcon;
  iconColor?: 'success' | 'destructive' | 'warning' | 'primary';
  title: string;
  subtitle?: string;
  description?: string;
  children?: ReactNode;
  showSpinner?: boolean;
}

const iconColors = {
  success: 'text-success',
  destructive: 'text-destructive',
  warning: 'text-warning',
  primary: 'text-primary',
};

const iconBgColors = {
  success: 'bg-success/10',
  destructive: 'bg-destructive/10',
  warning: 'bg-warning/10',
  primary: 'bg-primary/10',
};

export const StatusScreen = ({
  icon: Icon,
  iconColor = 'primary',
  title,
  subtitle,
  description,
  children,
  showSpinner = false,
}: StatusScreenProps) => {
  return (
    <div className="vm-status-screen bg-background">
      {/* Icon or Spinner */}
      <div className="mb-8">
        {showSpinner ? (
          <div className="vm-spinner" />
        ) : Icon ? (
          <div
            className={`w-24 h-24 rounded-full ${iconBgColors[iconColor]} flex items-center justify-center animate-scale-in`}
          >
            <Icon className={`w-12 h-12 ${iconColors[iconColor]}`} />
          </div>
        ) : null}
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-foreground mb-2 animate-fade-in">
        {title}
      </h1>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xl font-semibold text-price mb-4 animate-fade-in">
          {subtitle}
        </p>
      )}

      {/* Description */}
      {description && (
        <p className="text-muted-foreground max-w-xs animate-fade-in">
          {description}
        </p>
      )}

      {/* Actions */}
      {children && (
        <div className="w-full max-w-xs mt-8 space-y-3 animate-slide-up">
          {children}
        </div>
      )}
    </div>
  );
};
