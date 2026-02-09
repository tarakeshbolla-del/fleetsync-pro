import { cn } from "../../lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
    const variants = {
        default: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
        secondary: 'bg-slate-100 text-slate-700 border border-slate-200',
        destructive: 'bg-red-100 text-red-700 border border-red-200',
        outline: 'text-slate-700 border border-slate-300 bg-white',
        success: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        warning: 'bg-amber-100 text-amber-700 border border-amber-200',
    };

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
                variants[variant],
                className
            )}
            {...props}
        />
    )
}
