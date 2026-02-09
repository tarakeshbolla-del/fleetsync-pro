import { Router } from 'express';
import { prisma } from '../index.js';
import { RentalService } from '../services/RentalService.js';

const router = Router();

// Get all rentals
router.get('/', async (req, res) => {
    try {
        const status = req.query.status as string | undefined;
        const where: any = {};

        if (status) {
            where.status = status;
        }

        const rentals = await prisma.rental.findMany({
            where,
            include: {
                driver: true,
                vehicle: true,
                invoices: { take: 3, orderBy: { dueDate: 'desc' } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(rentals);
    } catch (error) {
        console.error('Get rentals error:', error);
        res.status(500).json({ error: 'Failed to fetch rentals' });
    }
});

// Get active rentals
router.get('/active', async (req, res) => {
    try {
        const rentals = await RentalService.getActiveRentals();
        res.json(rentals);
    } catch (error) {
        console.error('Get active rentals error:', error);
        res.status(500).json({ error: 'Failed to fetch active rentals' });
    }
});

// Get rental by ID
router.get('/:id', async (req, res) => {
    try {
        const rental = await prisma.rental.findUnique({
            where: { id: req.params.id },
            include: {
                driver: true,
                vehicle: true,
                invoices: true
            }
        });

        if (!rental) {
            return res.status(404).json({ error: 'Rental not found' });
        }

        res.json(rental);
    } catch (error) {
        console.error('Get rental error:', error);
        res.status(500).json({ error: 'Failed to fetch rental' });
    }
});

// Create new rental
router.post('/', async (req, res) => {
    try {
        const { driverId, vehicleId, bondAmount, weeklyRate, startDate } = req.body;

        const rental = await RentalService.createRental({
            driverId,
            vehicleId,
            bondAmount: parseFloat(bondAmount),
            weeklyRate: parseFloat(weeklyRate),
            startDate: startDate ? new Date(startDate) : undefined
        });

        res.status(201).json(rental);
    } catch (error: any) {
        console.error('Create rental error:', error);
        res.status(400).json({ error: error.message || 'Failed to create rental' });
    }
});

// End rental
router.post('/:id/end', async (req, res) => {
    try {
        const rental = await RentalService.endRental(req.params.id);
        res.json(rental);
    } catch (error: any) {
        console.error('End rental error:', error);
        res.status(400).json({ error: error.message || 'Failed to end rental' });
    }
});

export default router;
