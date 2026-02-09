import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Routes
import vehicleRoutes from './routes/vehicles.js';
import driverRoutes from './routes/drivers.js';
import rentalRoutes from './routes/rentals.js';
import invoiceRoutes from './routes/invoices.js';
import onboardingRoutes from './routes/onboarding.js';
import tollRoutes from './routes/tolls.js';
import authRoutes from './routes/auth.js';
import complianceRoutes from './routes/compliance.js';
import analyticsRoutes from './routes/analytics.js';
import driverDashboardRoutes from './routes/driver-dashboard.js';
import documentsRoutes from './routes/documents.js';


// Load environment variables
dotenv.config();

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads (simulating S3)
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/tolls', tollRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/driver/dashboard', driverDashboardRoutes);
app.use('/api/documents', documentsRoutes);


// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    const { fileURLToPath } = require('url');

    // Serve client build
    app.use(express.static(path.join(__dirname, '../../client/dist')));

    // Handle React routing
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ error: 'API endpoint not found' });
        }
        res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
    });
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 FleetSync Pro API running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
