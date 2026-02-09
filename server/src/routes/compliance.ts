import { Router } from 'express';
import { ComplianceService } from '../services/ComplianceService.js';

const router = Router();

// Run compliance check (watchdog)
router.post('/check', async (req, res) => {
    try {
        const result = await ComplianceService.checkExpiries();
        res.json(result);
    } catch (error) {
        console.error('Compliance check error:', error);
        res.status(500).json({ error: 'Failed to run compliance check' });
    }
});

// Get unresolved alerts
router.get('/alerts', async (req, res) => {
    try {
        const alerts = await ComplianceService.getUnresolvedAlerts();
        res.json(alerts);
    } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

// Resolve an alert
router.post('/alerts/:id/resolve', async (req, res) => {
    try {
        const alert = await ComplianceService.resolveAlert(req.params.id);
        res.json(alert);
    } catch (error) {
        console.error('Resolve alert error:', error);
        res.status(500).json({ error: 'Failed to resolve alert' });
    }
});

// Get upcoming expiries
router.get('/upcoming-expiries', async (req, res) => {
    try {
        const expiries = await ComplianceService.getUpcomingExpiries();
        res.json(expiries);
    } catch (error) {
        console.error('Get expiries error:', error);
        res.status(500).json({ error: 'Failed to fetch upcoming expiries' });
    }
});

export default router;
