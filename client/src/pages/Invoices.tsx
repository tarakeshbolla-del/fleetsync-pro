import { useEffect, useState } from 'react';
import { CheckCircle, Download, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { invoicesApi, api } from '../lib/api';
import { formatDate, formatCurrency, getStatusColor } from '../lib/utils';

interface Invoice {
    id: string;
    weeklyRate: string;
    tolls: string;
    fines: string;
    credits: string;
    amount: string;
    dueDate: string;
    paidAt: string | null;
    status: string;
    rental: { driver: { name: string }; vehicle: { plate: string } };
}

export function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [downloading, setDownloading] = useState<string | null>(null);

    useEffect(() => {
        loadInvoices();
    }, [filter]);

    const loadInvoices = async () => {
        setLoading(true);
        try {
            const response = await invoicesApi.getAll(filter === 'all' ? undefined : { status: filter });
            setInvoices(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPaid = async (id: string) => {
        await invoicesApi.pay(id);
        loadInvoices();
    };

    const handleDownloadPdf = async (id: string) => {
        setDownloading(id);
        try {
            const response = await api.get(`/api/invoices/${id}/pdf`, {
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${id.slice(0, 8)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert('Failed to download invoice');
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Invoices</h1>
                <p className="text-slate-500">Billing and payment tracking</p>
            </div>

            <div className="flex gap-2">
                {['all', 'PENDING', 'PAID', 'OVERDUE'].map((status) => (
                    <Button
                        key={status}
                        variant={filter === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(status)}
                        className={filter === status ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : ''}
                    >
                        {status === 'all' ? 'All' : status}
                    </Button>
                ))}
            </div>

            <Card className="border-0 shadow-lg shadow-slate-100">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left p-4 text-sm font-medium text-slate-500">Driver</th>
                                    <th className="text-left p-4 text-sm font-medium text-slate-500">Vehicle</th>
                                    <th className="text-right p-4 text-sm font-medium text-slate-500">Rate</th>
                                    <th className="text-right p-4 text-sm font-medium text-slate-500">Extras</th>
                                    <th className="text-right p-4 text-sm font-medium text-slate-500">Total</th>
                                    <th className="text-left p-4 text-sm font-medium text-slate-500">Due Date</th>
                                    <th className="text-center p-4 text-sm font-medium text-slate-500">Status</th>
                                    <th className="text-center p-4 text-sm font-medium text-slate-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={8} className="p-8 text-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                    </td></tr>
                                ) : invoices.length === 0 ? (
                                    <tr><td colSpan={8} className="p-8 text-center text-slate-500">No invoices found</td></tr>
                                ) : (
                                    invoices.map((inv) => (
                                        <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="p-4 font-medium">{inv.rental.driver.name}</td>
                                            <td className="p-4">{inv.rental.vehicle.plate}</td>
                                            <td className="p-4 text-right">{formatCurrency(inv.weeklyRate)}</td>
                                            <td className="p-4 text-right text-sm text-slate-500">
                                                +{formatCurrency(parseFloat(inv.tolls) + parseFloat(inv.fines))} -{formatCurrency(inv.credits)}
                                            </td>
                                            <td className="p-4 text-right font-semibold">{formatCurrency(inv.amount)}</td>
                                            <td className="p-4">{formatDate(inv.dueDate)}</td>
                                            <td className="p-4 text-center">
                                                <Badge className={getStatusColor(inv.status)}>{inv.status}</Badge>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDownloadPdf(inv.id)}
                                                        disabled={downloading === inv.id}
                                                    >
                                                        {downloading === inv.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Download className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                    {inv.status === 'PENDING' && (
                                                        <Button size="sm" variant="success" onClick={() => handleMarkPaid(inv.id)}>
                                                            <CheckCircle className="w-4 h-4 mr-1" /> Paid
                                                        </Button>
                                                    )}
                                                </div>
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
