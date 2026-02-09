import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
    }).format(num);
}

export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(date));
}

export function getDaysUntil(date: string | Date): number {
    const target = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getComplianceColor(status: 'GREEN' | 'AMBER' | 'RED'): string {
    switch (status) {
        case 'GREEN': return 'bg-emerald-500';
        case 'AMBER': return 'bg-amber-500';
        case 'RED': return 'bg-red-500';
        default: return 'bg-gray-500';
    }
}

export function getStatusColor(status: string): string {
    switch (status) {
        case 'AVAILABLE': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        case 'RENTED': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        case 'DRAFT': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        case 'SUSPENDED': return 'bg-red-500/10 text-red-500 border-red-500/20';
        case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        case 'BLOCKED': return 'bg-red-500/10 text-red-500 border-red-500/20';
        case 'PENDING_APPROVAL': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        case 'APPROVED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        case 'DENIED': return 'bg-red-500/10 text-red-500 border-red-500/20';
        case 'PAID': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        case 'PENDING': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        case 'OVERDUE': return 'bg-red-500/10 text-red-500 border-red-500/20';
        default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
}
