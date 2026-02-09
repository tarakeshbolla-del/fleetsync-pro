import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// API functions
export const authApi = {
    login: (email: string, password: string) =>
        api.post('/api/auth/login', { email, password }),
    register: (data: { email: string; password: string; name: string }) =>
        api.post('/api/auth/register', data),
    me: () => api.get('/api/auth/me'),
};

export const vehiclesApi = {
    getAll: () => api.get('/api/vehicles'),
    getById: (id: string) => api.get(`/api/vehicles/${id}`),
    create: (data: any) => api.post('/api/vehicles', data),
    update: (id: string, data: any) => api.put(`/api/vehicles/${id}`, data),
    delete: (id: string) => api.delete(`/api/vehicles/${id}`),
    checkCompliance: (id: string) => api.post(`/api/vehicles/${id}/check-compliance`),
};

export const driversApi = {
    getAll: (status?: string) => api.get('/api/drivers', { params: { status } }),
    getById: (id: string) => api.get(`/api/drivers/${id}`),
    create: (data: any) => api.post('/api/drivers', data),
    update: (id: string, data: any) => api.put(`/api/drivers/${id}`, data),
    delete: (id: string) => api.delete(`/api/drivers/${id}`),
    approve: (id: string) => api.post(`/api/drivers/${id}/approve`),
    block: (id: string) => api.post(`/api/drivers/${id}/block`),
    vevoCheck: (id: string) => api.post(`/api/drivers/${id}/vevo-check`),
};

export const rentalsApi = {
    getAll: (status?: string) => api.get('/api/rentals', { params: { status } }),
    getActive: () => api.get('/api/rentals/active'),
    getById: (id: string) => api.get(`/api/rentals/${id}`),
    create: (data: any) => api.post('/api/rentals', data),
    end: (id: string) => api.post(`/api/rentals/${id}/end`),
};

export const invoicesApi = {
    getAll: (params?: { status?: string; driverId?: string }) =>
        api.get('/api/invoices', { params }),
    getById: (id: string) => api.get(`/api/invoices/${id}`),
    generate: (data: any) => api.post('/api/invoices/generate', data),
    pay: (id: string) => api.post(`/api/invoices/${id}/pay`),
    runBillingCycle: () => api.post('/api/invoices/run-billing-cycle'),
};

export const complianceApi = {
    check: () => api.post('/api/compliance/check'),
    getAlerts: () => api.get('/api/compliance/alerts'),
    resolveAlert: (id: string) => api.post(`/api/compliance/alerts/${id}/resolve`),
    getUpcomingExpiries: () => api.get('/api/compliance/upcoming-expiries'),
};

export const analyticsApi = {
    getDashboard: () => api.get('/api/analytics/dashboard'),
    getDriverEarnings: (driverId: string, weeks?: number) =>
        api.get(`/api/analytics/drivers/${driverId}/earnings`, { params: { weeks } }),
    getRoi: () => api.get('/api/analytics/roi'),
};

export const onboardingApi = {
    generateLink: (email: string) => api.post('/api/onboarding/generate-link', { email }),
    validate: (token: string) => api.get(`/api/onboarding/validate/${token}`),
    verify: (passportNo: string) => api.post('/api/onboarding/verify', { passportNo }),
};

export const driverDashboardApi = {
    getActiveRental: (driverId: string) =>
        api.get('/api/driver/dashboard/active-rental', { params: { driverId } }),
    startShift: (data: { shiftId: string; vehicleId: string; driverId: string; damageMarkers: any[]; notes: string; photos: string[] }) =>
        api.post('/api/driver/dashboard/start-shift', data),
    endShift: (shiftId: string) =>
        api.post('/api/driver/dashboard/end-shift', { shiftId }),
    returnVehicle: (data: { rentalId: string; shiftId?: string }) =>
        api.post('/api/driver/dashboard/return-vehicle', data),
    reportAccident: (data: any) =>
        api.post('/api/driver/dashboard/accident-report', data),
};

