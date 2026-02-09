import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { vehiclesApi, driversApi, analyticsApi, complianceApi } from '../lib/api';

// Types
export interface Vehicle {
    id: string;
    vin: string;
    plate: string;
    make: string;
    model: string;
    year: number;
    color: string;
    status: 'DRAFT' | 'AVAILABLE' | 'RENTED' | 'SUSPENDED';
    regoExpiry: string;
    ctpExpiry: string;
    pinkSlipExpiry: string;
    weeklyRate: string;
    bondAmount: string;
    compliance: {
        rego: 'GREEN' | 'AMBER' | 'RED';
        ctp: 'GREEN' | 'AMBER' | 'RED';
        pinkSlip: 'GREEN' | 'AMBER' | 'RED';
    };
    currentDriver: Driver | null;
}

export interface Driver {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    licenseNo: string;
    vevoStatus: 'PENDING' | 'APPROVED' | 'DENIED' | 'RESTRICTED';
    status: 'PENDING_APPROVAL' | 'ACTIVE' | 'BLOCKED' | 'INACTIVE';
    balance: string;
}

export interface DashboardStats {
    vehicles: { total: number; byStatus: Record<string, number> };
    drivers: { total: number; byStatus: Record<string, number> };
    rentals: { active: number };
    invoices: { pending: { count: number; total: number }; overdue: { count: number; total: number } };
    alerts: number;
}

export interface Alert {
    id: string;
    type: string;
    message: string;
    vehicleId: string | null;
    resolved: boolean;
    createdAt: string;
}

// Async thunks
export const fetchVehicles = createAsyncThunk('fleet/fetchVehicles', async () => {
    const response = await vehiclesApi.getAll();
    return response.data;
});

export const fetchDrivers = createAsyncThunk('fleet/fetchDrivers', async () => {
    const response = await driversApi.getAll();
    return response.data;
});

export const fetchDashboard = createAsyncThunk('fleet/fetchDashboard', async () => {
    const response = await analyticsApi.getDashboard();
    return response.data;
});

export const fetchAlerts = createAsyncThunk('fleet/fetchAlerts', async () => {
    const response = await complianceApi.getAlerts();
    return response.data;
});

// Slice
interface FleetState {
    vehicles: Vehicle[];
    drivers: Driver[];
    dashboard: DashboardStats | null;
    alerts: Alert[];
    loading: boolean;
    error: string | null;
}

const initialState: FleetState = {
    vehicles: [],
    drivers: [],
    dashboard: null,
    alerts: [],
    loading: false,
    error: null,
};

const fleetSlice = createSlice({
    name: 'fleet',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchVehicles.pending, (state) => { state.loading = true; })
            .addCase(fetchVehicles.fulfilled, (state, action: PayloadAction<Vehicle[]>) => {
                state.loading = false;
                state.vehicles = action.payload;
            })
            .addCase(fetchVehicles.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch vehicles';
            })
            .addCase(fetchDrivers.pending, (state) => { state.loading = true; })
            .addCase(fetchDrivers.fulfilled, (state, action: PayloadAction<Driver[]>) => {
                state.loading = false;
                state.drivers = action.payload;
            })
            .addCase(fetchDrivers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch drivers';
            })
            .addCase(fetchDashboard.fulfilled, (state, action: PayloadAction<DashboardStats>) => {
                state.dashboard = action.payload;
            })
            .addCase(fetchAlerts.fulfilled, (state, action: PayloadAction<Alert[]>) => {
                state.alerts = action.payload;
            });
    },
});

export const { clearError } = fleetSlice.actions;

// Auth slice
interface AuthState {
    user: { id: string; email: string; name: string; role: string } | null;
    token: string | null;
    isAuthenticated: boolean;
}

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        token: localStorage.getItem('token'),
        isAuthenticated: !!localStorage.getItem('token'),
    } as AuthState,
    reducers: {
        setCredentials: (state, action: PayloadAction<{ user: AuthState['user']; token: string }>) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            localStorage.setItem('token', action.payload.token);
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
        },
    },
});

export const { setCredentials, logout } = authSlice.actions;

// Store
export const store = configureStore({
    reducer: {
        fleet: fleetSlice.reducer,
        auth: authSlice.reducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
