import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Shield, Plus, UserCheck, UserX, Copy, Check } from 'lucide-react';
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
    DialogDescription,
} from '../components/ui/dialog';
import { fetchDrivers } from '../store';
import type { RootState, AppDispatch } from '../store';
import { driversApi, onboardingApi } from '../lib/api';
import { getStatusColor, formatCurrency } from '../lib/utils';

export function DriversPage() {
    const dispatch = useDispatch<AppDispatch>();
    const { drivers, loading } = useSelector((state: RootState) => state.fleet);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        dispatch(fetchDrivers());
    }, [dispatch]);

    const handleApprove = async (id: string) => {
        await driversApi.approve(id);
        dispatch(fetchDrivers());
    };

    const handleBlock = async (id: string) => {
        await driversApi.block(id);
        dispatch(fetchDrivers());
    };

    const handleGenerateLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const response = await onboardingApi.generateLink(email);
            setGeneratedLink(response.data.link);
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to generate link');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEmail('');
        setGeneratedLink('');
        setCopied(false);
    };

    const filteredDrivers = drivers.filter(d => {
        const matchesSearch =
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.email.toLowerCase().includes(search.toLowerCase()) ||
            d.licenseNo.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Driver Management</h1>
                    <p className="text-slate-500">
                        Manage drivers and onboarding applications
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => open ? setDialogOpen(true) : handleCloseDialog()}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200">
                            <Plus className="w-4 h-4" />
                            Invite Driver
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Invite New Driver</DialogTitle>
                            <DialogDescription>
                                Generate a magic link to send to a driver for onboarding
                            </DialogDescription>
                        </DialogHeader>

                        {!generatedLink ? (
                            <form onSubmit={handleGenerateLink} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Driver Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="driver@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={submitting}>
                                        {submitting ? 'Generating...' : 'Generate Link'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                    <p className="text-sm text-emerald-600 font-medium mb-2">
                                        ✅ Magic link generated!
                                    </p>
                                    <p className="text-xs text-slate-500 mb-3">
                                        Send this link to the driver. It expires in 7 days.
                                    </p>
                                    <div className="flex gap-2">
                                        <Input
                                            value={generatedLink}
                                            readOnly
                                            className="text-sm"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCopyLink}
                                            className="shrink-0"
                                        >
                                            {copied ? (
                                                <Check className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" onClick={handleCloseDialog}>
                                        Done
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
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
                                placeholder="Search by name, email or license..."
                                className="pl-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {['all', 'ACTIVE', 'PENDING_APPROVAL', 'BLOCKED'].map((status) => (
                                <Button
                                    key={status}
                                    variant={statusFilter === status ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setStatusFilter(status)}
                                >
                                    {status === 'all' ? 'All' : status.replace('_', ' ')}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Driver Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredDrivers.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        No drivers found
                    </div>
                ) : (
                    filteredDrivers.map((driver) => (
                        <Card key={driver.id} className="overflow-hidden">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg shrink-0">
                                        {driver.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="font-semibold text-slate-900 truncate">
                                                    {driver.name}
                                                </h3>
                                                <p className="text-sm text-slate-500 truncate">
                                                    {driver.email}
                                                </p>
                                            </div>
                                            <Badge className={getStatusColor(driver.status)}>
                                                {driver.status.replace('_', ' ')}
                                            </Badge>
                                        </div>

                                        <div className="mt-3 space-y-2 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500">License:</span>
                                                <span className="font-medium">{driver.licenseNo}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500">VEVO Status:</span>
                                                <Badge className={getStatusColor(driver.vevoStatus)}>
                                                    <Shield className="w-3 h-3 mr-1" />
                                                    {driver.vevoStatus}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500">Balance:</span>
                                                <span className={`font-medium ${parseFloat(driver.balance) < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                    {formatCurrency(driver.balance)}
                                                </span>
                                            </div>
                                        </div>

                                        {driver.status === 'PENDING_APPROVAL' && (
                                            <div className="flex gap-2 mt-4">
                                                <Button
                                                    size="sm"
                                                    variant="success"
                                                    className="flex-1 gap-1"
                                                    onClick={() => handleApprove(driver.id)}
                                                    disabled={driver.vevoStatus === 'DENIED'}
                                                >
                                                    <UserCheck className="w-4 h-4" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="flex-1 gap-1"
                                                    onClick={() => handleBlock(driver.id)}
                                                >
                                                    <UserX className="w-4 h-4" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
