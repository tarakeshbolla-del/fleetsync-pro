import { Router } from 'express';
import { prisma } from '../index.js';
import { UberMockService } from '../services/UberMockService.js';

const router = Router();

// Get dashboard analytics
router.get('/dashboard', async (req, res) => {
    try {
        // Fleet stats
        const vehicleStats = await prisma.vehicle.groupBy({
            by: ['status'],
            _count: { id: true }
        });

        const driverStats = await prisma.driver.groupBy({
            by: ['status'],
            _count: { id: true }
        });

        // Active rentals
        const activeRentals = await prisma.rental.count({
            where: { status: 'ACTIVE' }
        });

        // Pending invoices
        const pendingInvoices = await prisma.invoice.aggregate({
            where: { status: 'PENDING' },
            _count: { id: true },
            _sum: { amount: true }
        });

        // Overdue invoices
        const overdueInvoices = await prisma.invoice.aggregate({
            where: { status: 'OVERDUE' },
            _count: { id: true },
            _sum: { amount: true }
        });

        // Unresolved alerts
        const alertCount = await prisma.alert.count({
            where: { resolved: false }
        });

        res.json({
            vehicles: {
                total: vehicleStats.reduce((sum, s) => sum + s._count.id, 0),
                byStatus: Object.fromEntries(vehicleStats.map(s => [s.status, s._count.id]))
            },
            drivers: {
                total: driverStats.reduce((sum, s) => sum + s._count.id, 0),
                byStatus: Object.fromEntries(driverStats.map(s => [s.status, s._count.id]))
            },
            rentals: {
                active: activeRentals
            },
            invoices: {
                pending: {
                    count: pendingInvoices._count.id || 0,
                    total: Number(pendingInvoices._sum.amount) || 0
                },
                overdue: {
                    count: overdueInvoices._count.id || 0,
                    total: Number(overdueInvoices._sum.amount) || 0
                }
            },
            alerts: alertCount
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// Get driver earnings (from Uber mock)
router.get('/drivers/:id/earnings', async (req, res) => {
    try {
        const driverId = req.params.id;
        const weeks = parseInt(req.query.weeks as string) || 4;

        // Get current earnings
        const currentEarnings = UberMockService.fetchWeeklyEarnings(driverId);

        // Get historical earnings
        const historicalEarnings = UberMockService.fetchHistoricalEarnings(driverId, weeks);

        // Get analytics summary
        const analytics = UberMockService.fetchDriverAnalytics(driverId);

        res.json({
            current: currentEarnings,
            history: historicalEarnings,
            analytics
        });
    } catch (error) {
        console.error('Get earnings error:', error);
        res.status(500).json({ error: 'Failed to fetch earnings' });
    }
});

// Get ROI summary
router.get('/roi', async (req, res) => {
    try {
        // Get all active rentals with earnings
        const activeRentals = await prisma.rental.findMany({
            where: { status: 'ACTIVE' },
            include: {
                vehicle: true,
                driver: true
            }
        });

        const roiData = activeRentals.map(rental => {
            const earnings = UberMockService.fetchWeeklyEarnings(rental.driverId);
            const weeklyRate = Number(rental.weeklyRate);
            const profitMargin = earnings.grossEarnings > weeklyRate
                ? ((earnings.grossEarnings - weeklyRate) / earnings.grossEarnings * 100).toFixed(1)
                : 0;

            return {
                vehicleId: rental.vehicleId,
                plate: rental.vehicle.plate,
                driverId: rental.driverId,
                driverName: rental.driver.name,
                weeklyRate,
                driverEarnings: earnings.grossEarnings,
                netEarnings: earnings.netEarnings,
                trips: earnings.trips,
                profitMargin: `${profitMargin}%`
            };
        });

        res.json(roiData);
    } catch (error) {
        console.error('ROI error:', error);
        res.status(500).json({ error: 'Failed to calculate ROI' });
    }
});

export default router;
