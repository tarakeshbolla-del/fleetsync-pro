import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    LayoutDashboard, Car, Users, FileText, Calendar,
    AlertTriangle, LogOut, Menu, X, Bell, Sparkles
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { logout } from '../../store';
import type { RootState } from '../../store';
import { cn } from '../../lib/utils';

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/fleet', icon: Car, label: 'Fleet' },
    { path: '/drivers', icon: Users, label: 'Drivers' },
    { path: '/rentals', icon: Calendar, label: 'Rentals' },
    { path: '/invoices', icon: FileText, label: 'Invoices' },
    { path: '/compliance', icon: AlertTriangle, label: 'Compliance' },
];

export function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const { alerts } = useSelector((state: RootState) => state.fleet);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed top-0 left-0 z-50 h-full w-64 bg-white/90 backdrop-blur-xl border-r border-indigo-100 transform transition-transform duration-300 ease-out lg:translate-x-0 shadow-xl shadow-indigo-100/50",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-6 py-5 border-b border-indigo-100">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-200">
                            <Car className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">FleetSync Pro</h1>
                            <p className="text-xs text-slate-500">Fleet Management</p>
                        </div>
                        <button
                            className="ml-auto lg:hidden p-2 rounded-lg hover:bg-indigo-50"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) => cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-200"
                                        : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                                {item.label === 'Compliance' && alerts.length > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 shadow-sm">
                                        {alerts.length}
                                    </span>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* User section */}
                    <div className="p-4 border-t border-indigo-100">
                        <div className="flex items-center gap-3 px-2 py-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold shadow-lg shadow-indigo-200">
                                {user?.name?.charAt(0) || 'A'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">
                                    {user?.name || 'Admin'}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    {user?.email || 'admin@fleetsync.com.au'}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="hover:bg-red-50 hover:text-red-600"
                            >
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-indigo-100 shadow-sm">
                    <div className="flex items-center justify-between px-4 py-3 lg:px-6">
                        <button
                            className="lg:hidden p-2 rounded-xl hover:bg-indigo-50 text-slate-600"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <div className="hidden lg:flex items-center gap-2 text-sm text-slate-500">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span>Welcome back, <span className="font-semibold text-slate-700">{user?.name || 'Admin'}</span></span>
                        </div>

                        <div className="flex items-center gap-3 ml-auto">
                            <button className="relative p-2.5 rounded-xl hover:bg-indigo-50 transition-colors">
                                <Bell className="w-5 h-5 text-slate-600" />
                                {alerts.length > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
