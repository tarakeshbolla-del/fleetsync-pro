import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Car, LogIn, User, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { authApi } from '../lib/api';
import { setCredentials } from '../store';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authApi.login(email, password);
            const { user, token } = response.data;

            dispatch(setCredentials({ user, token }));

            if (user.driverId) {
                localStorage.setItem('driverId', user.driverId);
            }

            if (user.role === 'DRIVER') {
                navigate('/dashboard/operations');
            } else {
                navigate('/');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const fillAdminCredentials = () => {
        setEmail('admin@fleetsync.com.au');
        setPassword('admin123');
    };

    const fillDriverCredentials = () => {
        setEmail('john.smith@email.com');
        setPassword('driver123');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
            </div>

            {/* Pattern overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJoLTYweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNhKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />

            <Card className="w-full max-w-md relative border-0 shadow-2xl shadow-indigo-900/20 bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden">
                {/* Top gradient bar */}
                <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                <CardHeader className="text-center pt-8 pb-2">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-xl shadow-indigo-200 relative">
                        <Car className="w-8 h-8 text-white" />
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
                            <Sparkles className="w-3 h-3 text-amber-800" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Welcome Back</CardTitle>
                    <CardDescription className="text-slate-500">Sign in to FleetSync Pro</CardDescription>
                </CardHeader>

                <CardContent className="px-8 pb-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Email</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                className="h-12 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Password</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="h-12 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-200 transition-all duration-300"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4 mr-2" />
                                    Sign In
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Quick Login Buttons */}
                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <p className="text-xs text-slate-500 text-center mb-3 font-medium">
                            Quick Demo Access
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={fillAdminCredentials}
                                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-100 transition-all duration-200"
                            >
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                                    <Car className="w-4 h-4 text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-slate-700">Fleet Admin</p>
                                    <p className="text-xs text-slate-500">Full access</p>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={fillDriverCredentials}
                                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-100 transition-all duration-200"
                            >
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-slate-700">Driver</p>
                                    <p className="text-xs text-slate-500">Mobile view</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
