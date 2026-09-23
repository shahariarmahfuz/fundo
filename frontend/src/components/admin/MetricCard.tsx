import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  change,
  trend = 'neutral',
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("hover:border-slate-300 transition-colors", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">{title}</span>
          <div className="h-8 w-8 rounded-md bg-teal-50 flex items-center justify-center text-teal-700">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <span className="text-xl font-bold tracking-tight text-slate-900">{value}</span>
        </div>
        {(subtitle || change) && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs">
            {change && (
              <span
                className={cn(
                  "font-medium",
                  trend === 'up' && "text-emerald-600",
                  trend === 'down' && "text-rose-600",
                  trend === 'neutral' && "text-slate-500"
                )}
              >
                {change}
              </span>
            )}
            {subtitle && <span className="text-slate-400">{subtitle}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
