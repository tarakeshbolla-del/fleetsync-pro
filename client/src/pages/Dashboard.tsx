import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Car, Users, DollarSign, AlertTriangle, TrendingUp, Calendar, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { fetchDashboard, fetchAlerts } from '../store';
import type { RootState, AppDispatch } from '../store';
import { formatCurrency } from '../lib/utils';

export function Dashboard() {
    const dispatch = useDispatch<AppDispatch>();
    const { dashboard, alerts } = useSelector((state: RootState) => state.fleet);

    useEffect(() => {
        dispatch(fetchDashboard());
        dispatch(fetchAlerts());
    }, [dispatch]);

    if (!dashboard) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center animate-pulse">
                        <Car className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-slate-500 text-sm">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const stats = [
        {
            title: 'Total Vehicles',
            value: dashboard.vehicles.total,
            icon: Car,
            change: `${dashboard.vehicles.byStatus['AVAILABLE'] || 0} available`,
            gradient: 'from-indigo-500 to-indigo-600',
            bgGradient: 'from-indigo-50 to-indigo-100',
            textColor: 'text-indigo-600',
        },
        {
            title: 'Active Drivers',
            value: dashboard.drivers.byStatus['ACTIVE'] || 0,
            icon: Users,
            change: `${dashboard.drivers.total} total`,
            gradient: 'from-emerald-500 to-teal-600',
            bgGradient: 'from-emerald-50 to-teal-100',
            textColor: 'text-emerald-600',
        },
        {
            title: 'Active Rentals',
            value: dashboard.rentals.active,
            icon: Calendar,
            change: 'Currently rented',
            gradient: 'from-purple-500 to-pink-600',
            bgGradient: 'from-purple-50 to-pink-100',
            textColor: 'text-purple-600',
        },
        {
            title: 'Pending Revenue',
            value: formatCurrency(dashboard.invoices.pending.total),
            icon: DollarSign,
            change: `${dashboard.invoices.pending.count} invoices`,
            gradient: 'from-amber-500 to-orange-600',
            bgGradient: 'from-amber-50 to-orange-100',
            textColor: 'text-amber-600',
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                    <p className="text-slate-500">
                        Overview of your fleet management operations
                    </p>
                </div>
                <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-indigo-200">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">Live Dashboard</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <Card key={index} className="overflow-hidden border-0 shadow-lg shadow-slate-100 hover:shadow-xl transition-shadow duration-300">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">{stat.title}</p>
                                    <p className={`text-2xl font-bold mt-1 ${stat.textColor}`}>
                                        {stat.value}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {stat.change}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                                    <stat.icon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Alerts & Vehicle Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Alerts */}
                <Card className="border-0 shadow-lg shadow-slate-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
                                <AlertTriangle className="w-4 h-4 text-white" />
                            </div>
                            Compliance Alerts
                        </CardTitle>
                        <Badge className={alerts.length > 0 ? "bg-red-100 text-red-700 border-0" : "bg-emerald-100 text-emerald-700 border-0"}>
                            {alerts.length} Active
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        {alerts.length === 0 ? (
                            <div className="text-center py-6">
                                <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
                                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                                </div>
                                <p className="text-slate-600 font-medium">All Clear!</p>
                                <p className="text-sm text-slate-500">No active alerts. All vehicles are compliant.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {alerts.slice(0, 5).map((alert) => (
                                    <div
                                        key={alert.id}
                                        className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100"
                                    >
                                        <div className="p-1.5 rounded-lg bg-red-500">
                                            <AlertTriangle className="w-3 h-3 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-red-700">
                                                {alert.type.replace(/_/g, ' ')}
                                            </p>
                                            <p className="text-xs text-red-600 mt-0.5">
                                                {alert.message}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Vehicle Status Breakdown */}
                <Card className="border-0 shadow-lg shadow-slate-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
                                <TrendingUp className="w-4 h-4 text-white" />
                            </div>
                            Fleet Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(dashboard.vehicles.byStatus).map(([status, count]) => {
                                const percentage = Math.round((count / dashboard.vehicles.total) * 100);
                                const colors: Record<string, { bar: string, text: string }> = {
                                    AVAILABLE: { bar: 'from-emerald-400 to-teal-500', text: 'text-emerald-600' },
                                    RENTED: { bar: 'from-indigo-400 to-purple-500', text: 'text-indigo-600' },
                                    SUSPENDED: { bar: 'from-red-400 to-rose-500', text: 'text-red-600' },
                                    DRAFT: { bar: 'from-slate-300 to-slate-400', text: 'text-slate-500' },
                                };
                                const color = colors[status] || { bar: 'from-slate-300 to-slate-400', text: 'text-slate-500' };
                                return (
                                    <div key={status}>
                                        <div className="flex items-center justify-between text-sm mb-2">
                                            <span className="text-slate-600 font-medium">{status}</span>
                                            <span className={`font-bold ${color.text}`}>{count} ({percentage}%)</span>
                                        </div>
                                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-gradient-to-r ${color.bar} rounded-full transition-all duration-700`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Overdue Invoices Warning */}
            {dashboard.invoices.overdue.count > 0 && (
                <Card className="border-0 bg-gradient-to-r from-red-50 to-rose-50 shadow-lg shadow-red-100">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-200">
                                <DollarSign className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-red-700">
                                    {dashboard.invoices.overdue.count} Overdue Invoices
                                </p>
                                <p className="text-sm text-red-600">
                                    Total outstanding: {formatCurrency(dashboard.invoices.overdue.total)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
