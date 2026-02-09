import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Car, Upload, Check, AlertTriangle, User, FileText, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { onboardingApi, driversApi } from '../lib/api';

type Step = 'validate' | 'form' | 'verify' | 'complete' | 'error';

interface OnboardingData {
    name: string;
    email: string;
    phone: string;
    licenseNo: string;
    licenseExpiry: string;
    passportNo: string;
    address: string;
}

export function OnboardingPage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('validate');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [vevoStatus, setVevoStatus] = useState<string>('');
    const [formData, setFormData] = useState<OnboardingData>({
        name: '',
        email: '',
        phone: '',
        licenseNo: '',
        licenseExpiry: '',
        passportNo: '',
        address: '',
    });

    useEffect(() => {
        if (token) {
            validateToken();
        }
    }, [token]);

    const validateToken = async () => {
        try {
            const response = await onboardingApi.validate(token!);
            setEmail(response.data.email);
            setFormData(prev => ({ ...prev, email: response.data.email }));
            setStep('form');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid or expired link');
            setStep('error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // First verify VEVO
            const vevoResponse = await onboardingApi.verify(formData.passportNo);
            setVevoStatus(vevoResponse.data.status);

            if (vevoResponse.data.status === 'DENIED') {
                setStep('error');
                setError('VEVO verification failed. Your work rights could not be confirmed.');
                return;
            }

            // Create driver record
            await driversApi.create({
                ...formData,
                vevoStatus: vevoResponse.data.status,
                status: 'PENDING_APPROVAL',
            });

            setStep('complete');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Submission failed');
        } finally {
            setLoading(false);
        }
    };

    if (loading && step === 'validate') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {/* Logo Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Car className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">FleetSync Pro</h1>
                    <p className="text-blue-200">Driver Onboarding</p>
                </div>

                {/* Progress Steps */}
                {step !== 'error' && (
                    <div className="flex items-center justify-center gap-2 mb-6">
                        {['Details', 'Verification', 'Complete'].map((label, i) => (
                            <div key={label} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${i === 0 && step === 'form' ? 'bg-white text-blue-600' :
                                        i === 1 && step === 'verify' ? 'bg-white text-blue-600' :
                                            i === 2 && step === 'complete' ? 'bg-emerald-500 text-white' :
                                                'bg-white/20 text-white/60'
                                    }`}>
                                    {i === 2 && step === 'complete' ? <Check className="w-4 h-4" /> : i + 1}
                                </div>
                                {i < 2 && <div className="w-8 h-0.5 bg-white/20" />}
                            </div>
                        ))}
                    </div>
                )}

                <Card className="animate-fade-in">
                    {step === 'error' && (
                        <>
                            <CardHeader className="text-center">
                                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="w-8 h-8 text-red-500" />
                                </div>
                                <CardTitle className="text-red-600">Verification Failed</CardTitle>
                                <CardDescription>{error}</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-sm text-slate-500 mb-4">
                                    Please contact the fleet administrator for assistance.
                                </p>
                            </CardContent>
                        </>
                    )}

                    {step === 'form' && (
                        <>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-500" />
                                    Driver Details
                                </CardTitle>
                                <CardDescription>
                                    Complete your profile to join the fleet
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {error && (
                                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="text-sm font-medium text-slate-700">Full Name *</label>
                                            <Input name="name" value={formData.name} onChange={handleChange} required />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-sm font-medium text-slate-700">Email</label>
                                            <Input value={email} disabled className="bg-slate-50" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-sm font-medium text-slate-700">Phone *</label>
                                            <Input name="phone" value={formData.phone} onChange={handleChange} required placeholder="0412 345 678" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-slate-700">License No. *</label>
                                            <Input name="licenseNo" value={formData.licenseNo} onChange={handleChange} required />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-slate-700">License Expiry *</label>
                                            <Input name="licenseExpiry" type="date" value={formData.licenseExpiry} onChange={handleChange} required />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                                <Shield className="w-4 h-4" />
                                                Passport Number * (for VEVO check)
                                            </label>
                                            <Input
                                                name="passportNo"
                                                value={formData.passportNo}
                                                onChange={handleChange}
                                                required
                                                placeholder="PA1234567"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">
                                                This will be verified against VEVO for work rights
                                            </p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-sm font-medium text-slate-700">Address</label>
                                            <Input name="address" value={formData.address} onChange={handleChange} />
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                        ) : (
                                            <>Submit Application</>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </>
                    )}

                    {step === 'complete' && (
                        <>
                            <CardHeader className="text-center">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                                    <Check className="w-8 h-8 text-emerald-500" />
                                </div>
                                <CardTitle className="text-emerald-600">Application Submitted!</CardTitle>
                                <CardDescription>Your application is pending review</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center space-y-4">
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-slate-600">VEVO Status:</span>
                                    <Badge variant="success">{vevoStatus}</Badge>
                                </div>
                                <p className="text-sm text-slate-500">
                                    The fleet administrator will review your application and contact you shortly.
                                </p>
                            </CardContent>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}
