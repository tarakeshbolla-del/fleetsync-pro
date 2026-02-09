import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Plus, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from '../components/ui/dialog';
import { fetchVehicles } from '../store';
import type { RootState, AppDispatch } from '../store';
import { vehiclesApi } from '../lib/api';
import { formatCurrency, formatDate, getStatusColor, cn } from '../lib/utils';

function ComplianceBadge({ status }: { status: 'GREEN' | 'AMBER' | 'RED' }) {
    const colors = {
        GREEN: 'bg-emerald-500',
        AMBER: 'bg-amber-500',
        RED: 'bg-red-500',
    };
    return (
        <span className={cn('w-3 h-3 rounded-full inline-block', colors[status])}
            title={status === 'GREEN' ? '> 30 days' : status === 'AMBER' ? '< 30 days' : 'Expired'}
        />
    );
}

// Helper to get date string for input default value (6 months from now)
function getDefaultExpiry() {
    const date = new Date();
    date.setMonth(date.getMonth() + 6);
    return date.toISOString().split('T')[0];
}

export function FleetPage() {
    const dispatch = useDispatch<AppDispatch>();
    const { vehicles, loading } = useSelector((state: RootState) => state.fleet);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        vin: '',
        plate: '',
        make: '',
        model: '',
        year: new Date().getFullYear().toString(),
        color: '',
        regoExpiry: getDefaultExpiry(),
        ctpExpiry: getDefaultExpiry(),
        pinkSlipExpiry: getDefaultExpiry(),
        weeklyRate: '450',
        bondAmount: '1000',
    });

    useEffect(() => {
        dispatch(fetchVehicles());
    }, [dispatch]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Cascading date handler: Rego → CTP → Pink Slip
    const handleComplianceDateChange = (field: 'regoExpiry' | 'ctpExpiry' | 'pinkSlipExpiry', value: string) => {
        const updates: Partial<typeof formData> = { [field]: value };

        if (field === 'regoExpiry') {
            // When Rego changes, update CTP and Pink Slip to match
            updates.ctpExpiry = value;
            updates.pinkSlipExpiry = value;
        } else if (field === 'ctpExpiry') {
            // When CTP changes, update Pink Slip to match
            updates.pinkSlipExpiry = value;
        }
        // Pink Slip only updates itself

        setFormData(prev => ({ ...prev, ...updates }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await vehiclesApi.create(formData);
            setDialogOpen(false);
            setFormData({
                vin: '',
                plate: '',
                make: '',
                model: '',
                year: new Date().getFullYear().toString(),
                color: '',
                regoExpiry: getDefaultExpiry(),
                ctpExpiry: getDefaultExpiry(),
                pinkSlipExpiry: getDefaultExpiry(),
                weeklyRate: '450',
                bondAmount: '1000',
            });
            dispatch(fetchVehicles());
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to create vehicle');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredVehicles = vehicles.filter(v => {
        const matchesSearch =
            v.plate.toLowerCase().includes(search.toLowerCase()) ||
            v.vin.toLowerCase().includes(search.toLowerCase()) ||
            v.make.toLowerCase().includes(search.toLowerCase()) ||
            v.model.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Fleet Management</h1>
                    <p className="text-slate-500">
                        Manage your vehicles and track compliance
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200">
                            <Plus className="w-4 h-4" />
                            Add Vehicle
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add New Vehicle</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="vin">VIN</Label>
                                    <Input
                                        id="vin"
                                        name="vin"
                                        placeholder="e.g. 1HGBH41JXMN109186"
                                        value={formData.vin}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="plate">Plate Number</Label>
                                    <Input
                                        id="plate"
                                        name="plate"
                                        placeholder="e.g. ABC123"
                                        value={formData.plate}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="make">Make</Label>
                                    <Input
                                        id="make"
                                        name="make"
                                        placeholder="e.g. Toyota"
                                        value={formData.make}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="model">Model</Label>
                                    <Input
                                        id="model"
                                        name="model"
                                        placeholder="e.g. Camry"
                                        value={formData.model}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="year">Year</Label>
                                    <Input
                                        id="year"
                                        name="year"
                                        type="number"
                                        min="2000"
                                        max="2030"
                                        value={formData.year}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="color">Color</Label>
                                    <Input
                                        id="color"
                                        name="color"
                                        placeholder="e.g. White"
                                        value={formData.color}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <h4 className="text-sm font-medium">Compliance Dates</h4>
                                    <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Linked</span>
                                </div>
                                <p className="text-xs text-slate-500 mb-3">Dates cascade: Rego → CTP → Pink Slip</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-2 relative">
                                        <Label htmlFor="regoExpiry" className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                            Rego Expiry
                                        </Label>
                                        <Input
                                            id="regoExpiry"
                                            name="regoExpiry"
                                            type="date"
                                            value={formData.regoExpiry}
                                            onChange={(e) => handleComplianceDateChange('regoExpiry', e.target.value)}
                                            required
                                            className="border-indigo-200 focus:ring-indigo-500"
                                        />
                                        <div className="hidden sm:block absolute -right-3 top-1/2 w-6 h-0.5 bg-gradient-to-r from-indigo-300 to-purple-300"></div>
                                    </div>
                                    <div className="space-y-2 relative">
                                        <Label htmlFor="ctpExpiry" className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                            CTP Expiry
                                        </Label>
                                        <Input
                                            id="ctpExpiry"
                                            name="ctpExpiry"
                                            type="date"
                                            value={formData.ctpExpiry}
                                            onChange={(e) => handleComplianceDateChange('ctpExpiry', e.target.value)}
                                            required
                                            className="border-purple-200 focus:ring-purple-500"
                                        />
                                        <div className="hidden sm:block absolute -right-3 top-1/2 w-6 h-0.5 bg-gradient-to-r from-purple-300 to-pink-300"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pinkSlipExpiry" className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                                            Pink Slip Expiry
                                        </Label>
                                        <Input
                                            id="pinkSlipExpiry"
                                            name="pinkSlipExpiry"
                                            type="date"
                                            value={formData.pinkSlipExpiry}
                                            onChange={(e) => handleComplianceDateChange('pinkSlipExpiry', e.target.value)}
                                            required
                                            className="border-pink-200 focus:ring-pink-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium mb-3">Rates</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="weeklyRate">Weekly Rate (AUD)</Label>
                                        <Input
                                            id="weeklyRate"
                                            name="weeklyRate"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.weeklyRate}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bondAmount">Bond Amount (AUD)</Label>
                                        <Input
                                            id="bondAmount"
                                            name="bondAmount"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.bondAmount}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? 'Creating...' : 'Create Vehicle'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search by plate, VIN, make or model..."
                                className="pl-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            {['all', 'AVAILABLE', 'RENTED', 'SUSPENDED'].map((status) => (
                                <Button
                                    key={status}
                                    variant={statusFilter === status ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setStatusFilter(status)}
                                >
                                    {status === 'all' ? 'All' : status}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Legend */}
            <div className="flex items-center gap-6 text-sm text-slate-600">
                <span className="font-medium">Compliance:</span>
                <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" /> {'>'} 30 days
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" /> {'<'} 30 days
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500" /> Expired
                </span>
            </div>

            {/* Vehicle Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left p-4 text-sm font-medium text-slate-500">Vehicle</th>
                                    <th className="text-left p-4 text-sm font-medium text-slate-500">Status</th>
                                    <th className="text-left p-4 text-sm font-medium text-slate-500">Driver</th>
                                    <th className="text-center p-4 text-sm font-medium text-slate-500">Rego</th>
                                    <th className="text-center p-4 text-sm font-medium text-slate-500">CTP</th>
                                    <th className="text-center p-4 text-sm font-medium text-slate-500">Pink Slip</th>
                                    <th className="text-right p-4 text-sm font-medium text-slate-500">Weekly Rate</th>
                                    <th className="text-center p-4 text-sm font-medium text-slate-500"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                        </td>
                                    </tr>
                                ) : filteredVehicles.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-slate-500">
                                            No vehicles found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredVehicles.map((vehicle) => (
                                        <tr
                                            key={vehicle.id}
                                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                                        >
                                            <td className="p-4">
                                                <div>
                                                    <p className="font-semibold text-slate-900">{vehicle.plate}</p>
                                                    <p className="text-sm text-slate-500">
                                                        {vehicle.year} {vehicle.make} {vehicle.model}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge className={getStatusColor(vehicle.status)}>
                                                    {vehicle.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                {vehicle.currentDriver ? (
                                                    <span className="text-sm text-slate-900">
                                                        {vehicle.currentDriver.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <ComplianceBadge status={vehicle.compliance.rego} />
                                                    <span className="text-xs text-slate-500">{formatDate(vehicle.regoExpiry)}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <ComplianceBadge status={vehicle.compliance.ctp} />
                                                    <span className="text-xs text-slate-500">{formatDate(vehicle.ctpExpiry)}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <ComplianceBadge status={vehicle.compliance.pinkSlip} />
                                                    <span className="text-xs text-slate-500">{formatDate(vehicle.pinkSlipExpiry)}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className="font-medium text-slate-900">
                                                    {formatCurrency(vehicle.weeklyRate)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
