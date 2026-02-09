import { Router } from 'express';
import { prisma } from '../index.js';
import { DriverService } from '../services/DriverService.js';
import { DriverStatus } from '@prisma/client';

const router = Router();

// Get all drivers
router.get('/', async (req, res) => {
    try {
        const status = req.query.status as DriverStatus | undefined;
        const drivers = await DriverService.getAll(status);
        res.json(drivers);
    } catch (error) {
        console.error('Get drivers error:', error);
        res.status(500).json({ error: 'Failed to fetch drivers' });
    }
});

// Get driver by ID
router.get('/:id', async (req, res) => {
    try {
        const driver = await DriverService.getById(req.params.id);
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }
        res.json(driver);
    } catch (error) {
        console.error('Get driver error:', error);
        res.status(500).json({ error: 'Failed to fetch driver' });
    }
});

// Register new driver
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, licenseNo, licenseExpiry, passportNo } = req.body;

        const driver = await DriverService.registerDriver({
            name,
            email,
            phone,
            licenseNo,
            licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : undefined,
            passportNo
        });

        res.status(201).json(driver);
    } catch (error: any) {
        console.error('Register driver error:', error);
        res.status(400).json({ error: error.message || 'Failed to register driver' });
    }
});

// Update driver
router.put('/:id', async (req, res) => {
    try {
        const { name, email, phone, licenseNo, licenseExpiry, passportNo, status } = req.body;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (licenseNo) updateData.licenseNo = licenseNo;
        if (licenseExpiry) updateData.licenseExpiry = new Date(licenseExpiry);
        if (passportNo) updateData.passportNo = passportNo;
        if (status) updateData.status = status;

        const driver = await prisma.driver.update({
            where: { id: req.params.id },
            data: updateData
        });

        res.json(driver);
    } catch (error: any) {
        console.error('Update driver error:', error);
        res.status(500).json({ error: error.message || 'Failed to update driver' });
    }
});

// Delete driver
router.delete('/:id', async (req, res) => {
    try {
        // Check for active rentals
        const driver = await prisma.driver.findUnique({
            where: { id: req.params.id },
            include: { rentals: { where: { status: 'ACTIVE' } } }
        });

        if (driver?.rentals.length) {
            return res.status(400).json({ error: 'Cannot delete driver with active rental' });
        }

        await prisma.driver.delete({ where: { id: req.params.id } });
        res.json({ message: 'Driver deleted successfully' });
    } catch (error) {
        console.error('Delete driver error:', error);
        res.status(500).json({ error: 'Failed to delete driver' });
    }
});

// Run VEVO check
router.post('/:id/vevo-check', async (req, res) => {
    try {
        const driver = await DriverService.runVevoCheck(req.params.id);
        res.json(driver);
    } catch (error: any) {
        console.error('VEVO check error:', error);
        res.status(400).json({ error: error.message || 'Failed to run VEVO check' });
    }
});

// Approve driver
router.post('/:id/approve', async (req, res) => {
    try {
        const driver = await DriverService.approveDriver(req.params.id);
        res.json(driver);
    } catch (error: any) {
        console.error('Approve driver error:', error);
        res.status(400).json({ error: error.message || 'Failed to approve driver' });
    }
});

// Block driver
router.post('/:id/block', async (req, res) => {
    try {
        const driver = await DriverService.blockDriver(req.params.id);
        res.json(driver);
    } catch (error: any) {
        console.error('Block driver error:', error);
        res.status(400).json({ error: error.message || 'Failed to block driver' });
    }
});

export default router;
