import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
    DialogDescription,
} from '../components/ui/dialog';
import { rentalsApi, vehiclesApi, driversApi } from '../lib/api';
import { formatDate, formatCurrency, getStatusColor } from '../lib/utils';

interface Rental {
    id: string;
    startDate: string;
    endDate: string | null;
    weeklyRate: string;
    bondAmount: string;
    status: string;
    nextPaymentDate: string;
    driver: { name: string; email: string };
    vehicle: { plate: string; make: string; model: string };
}

interface Vehicle {
    id: string;
    plate: string;
    make: string;
    model: string;
    status: string;
    weeklyRate: string;
    bondAmount: string;
}

interface Driver {
    id: string;
    name: string;
    email: string;
    status: string;
}

export function RentalsPage() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ACTIVE');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Available options for dropdown
    const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
    const [activeDrivers, setActiveDrivers] = useState<Driver[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        vehicleId: '',
        driverId: '',
        weeklyRate: '',
        bondAmount: '',
        startDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        loadRentals();
    }, [filter]);

    const loadRentals = async () => {
        setLoading(true);
        try {
            const response = await rentalsApi.getAll(filter === 'all' ? undefined : filter);
            setRentals(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadOptions = async () => {
        try {
            const [vehiclesRes, driversRes] = await Promise.all([
                vehiclesApi.getAll(),
                driversApi.getAll('ACTIVE'),
            ]);
            // Only show available vehicles
            setAvailableVehicles(vehiclesRes.data.filter((v: Vehicle) => v.status === 'AVAILABLE'));
            setActiveDrivers(driversRes.data.filter((d: Driver) => d.status === 'ACTIVE'));
        } catch (err) {
            console.error(err);
        }
    };

    const handleDialogOpen = (open: boolean) => {
        setDialogOpen(open);
        if (open) {
            loadOptions();
        } else {
            setFormData({
                vehicleId: '',
                driverId: '',
                weeklyRate: '',
                bondAmount: '',
                startDate: new Date().toISOString().split('T')[0],
            });
        }
    };

    const handleVehicleChange = (vehicleId: string) => {
        const vehicle = availableVehicles.find(v => v.id === vehicleId);
        if (vehicle) {
            setFormData({
                ...formData,
                vehicleId,
                weeklyRate: vehicle.weeklyRate,
                bondAmount: vehicle.bondAmount,
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await rentalsApi.create(formData);
            setDialogOpen(false);
            loadRentals();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to create rental');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Rentals</h1>
                    <p className="text-slate-500">Manage vehicle assignments</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={handleDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200">
                            <Plus className="w-4 h-4" />
                            New Rental
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Rental</DialogTitle>
                            <DialogDescription>
                                Assign a vehicle to an active driver
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="vehicleId">Vehicle</Label>
                                <Select
                                    id="vehicleId"
                                    value={formData.vehicleId}
                                    onChange={(e) => handleVehicleChange(e.target.value)}
                                    required
                                >
                                    <option value="">Select a vehicle...</option>
                                    {availableVehicles.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.plate} - {v.make} {v.model} ({formatCurrency(v.weeklyRate)}/wk)
                                        </option>
                                    ))}
                                </Select>
                                {availableVehicles.length === 0 && (
                                    <p className="text-xs text-amber-600">No available vehicles</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="driverId">Driver</Label>
                                <Select
                                    id="driverId"
                                    value={formData.driverId}
                                    onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                                    required
                                >
                                    <option value="">Select a driver...</option>
                                    {activeDrivers.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.name} ({d.email})
                                        </option>
                                    ))}
                                </Select>
                                {activeDrivers.length === 0 && (
                                    <p className="text-xs text-amber-600">No active drivers</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="weeklyRate">Weekly Rate (AUD)</Label>
                                    <Input
                                        id="weeklyRate"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.weeklyRate}
                                        onChange={(e) => setFormData({ ...formData, weeklyRate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bondAmount">Bond Amount (AUD)</Label>
                                    <Input
                                        id="bondAmount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.bondAmount}
                                        onChange={(e) => setFormData({ ...formData, bondAmount: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    required
                                />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting || availableVehicles.length === 0 || activeDrivers.length === 0}
                                >
                                    {submitting ? 'Creating...' : 'Create Rental'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex gap-2">
                {['ACTIVE', 'COMPLETED', 'all'].map((status) => (
                    <Button
                        key={status}
                        variant={filter === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(status)}
                    >
                        {status === 'all' ? 'All' : status}
                    </Button>
                ))}
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left p-4 text-sm font-medium text-slate-500">Vehicle</th>
                                    <th className="text-left p-4 text-sm font-medium text-slate-500">Driver</th>
                                    <th className="text-left p-4 text-sm font-medium text-slate-500">Start Date</th>
                                    <th className="text-left p-4 text-sm font-medium text-slate-500">Next Payment</th>
                                    <th className="text-right p-4 text-sm font-medium text-slate-500">Weekly Rate</th>
                                    <th className="text-center p-4 text-sm font-medium text-slate-500">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="p-8 text-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                    </td></tr>
                                ) : rentals.length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-slate-500">No rentals found</td></tr>
                                ) : (
                                    rentals.map((rental) => (
                                        <tr key={rental.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="p-4">
                                                <p className="font-semibold">{rental.vehicle.plate}</p>
                                                <p className="text-sm text-slate-500">{rental.vehicle.make} {rental.vehicle.model}</p>
                                            </td>
                                            <td className="p-4">
                                                <p className="font-medium">{rental.driver.name}</p>
                                                <p className="text-sm text-slate-500">{rental.driver.email}</p>
                                            </td>
                                            <td className="p-4">{formatDate(rental.startDate)}</td>
                                            <td className="p-4">{formatDate(rental.nextPaymentDate)}</td>
                                            <td className="p-4 text-right font-medium">{formatCurrency(rental.weeklyRate)}</td>
                                            <td className="p-4 text-center">
                                                <Badge className={getStatusColor(rental.status)}>{rental.status}</Badge>
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
