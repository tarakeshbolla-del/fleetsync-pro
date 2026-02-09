import { Router } from 'express';
import { prisma } from '../index.js';
import { VehicleService } from '../services/VehicleService.js';

const router = Router();

// Get all vehicles with compliance status
router.get('/', async (req, res) => {
    try {
        const vehicles = await VehicleService.getAllWithCompliance();
        res.json(vehicles);
    } catch (error) {
        console.error('Get vehicles error:', error);
        res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
});

// Get vehicle by ID
router.get('/:id', async (req, res) => {
    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: req.params.id },
            include: {
                rentals: {
                    include: { driver: true, invoices: true }
                },
                alerts: { where: { resolved: false } }
            }
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        // Add compliance status
        const compliance = {
            rego: VehicleService.getComplianceStatus(vehicle.regoExpiry),
            ctp: VehicleService.getComplianceStatus(vehicle.ctpExpiry),
            pinkSlip: VehicleService.getComplianceStatus(vehicle.pinkSlipExpiry)
        };

        res.json({ ...vehicle, compliance });
    } catch (error) {
        console.error('Get vehicle error:', error);
        res.status(500).json({ error: 'Failed to fetch vehicle' });
    }
});

// Create new vehicle
router.post('/', async (req, res) => {
    try {
        const {
            vin, plate, make, model, year, color,
            regoExpiry, ctpExpiry, pinkSlipExpiry,
            weeklyRate, bondAmount
        } = req.body;

        const vehicle = await VehicleService.create({
            vin,
            plate,
            make,
            model,
            year: parseInt(year),
            color,
            regoExpiry: new Date(regoExpiry),
            ctpExpiry: new Date(ctpExpiry),
            pinkSlipExpiry: new Date(pinkSlipExpiry),
            weeklyRate: weeklyRate ? parseFloat(weeklyRate) : undefined,
            bondAmount: bondAmount ? parseFloat(bondAmount) : undefined
        });

        res.status(201).json(vehicle);
    } catch (error: any) {
        console.error('Create vehicle error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Vehicle with this VIN or plate already exists' });
        }
        res.status(500).json({ error: 'Failed to create vehicle' });
    }
});

// Update vehicle
router.put('/:id', async (req, res) => {
    try {
        const {
            vin, plate, make, model, year, color, status,
            regoExpiry, ctpExpiry, pinkSlipExpiry,
            weeklyRate, bondAmount
        } = req.body;

        const updateData: any = {};
        if (vin) updateData.vin = vin;
        if (plate) updateData.plate = plate;
        if (make) updateData.make = make;
        if (model) updateData.model = model;
        if (year) updateData.year = parseInt(year);
        if (color) updateData.color = color;
        if (status) updateData.status = status;
        if (regoExpiry) updateData.regoExpiry = new Date(regoExpiry);
        if (ctpExpiry) updateData.ctpExpiry = new Date(ctpExpiry);
        if (pinkSlipExpiry) updateData.pinkSlipExpiry = new Date(pinkSlipExpiry);
        if (weeklyRate) updateData.weeklyRate = parseFloat(weeklyRate);
        if (bondAmount) updateData.bondAmount = parseFloat(bondAmount);

        const vehicle = await VehicleService.update(req.params.id, updateData);
        res.json(vehicle);
    } catch (error: any) {
        console.error('Update vehicle error:', error);
        res.status(500).json({ error: error.message || 'Failed to update vehicle' });
    }
});

// Delete vehicle
router.delete('/:id', async (req, res) => {
    try {
        await VehicleService.delete(req.params.id);
        res.json({ message: 'Vehicle deleted successfully' });
    } catch (error: any) {
        console.error('Delete vehicle error:', error);
        res.status(400).json({ error: error.message || 'Failed to delete vehicle' });
    }
});

// Check vehicle compliance
router.post('/:id/check-compliance', async (req, res) => {
    try {
        const result = await VehicleService.validateCompliance(req.params.id);
        res.json(result);
    } catch (error: any) {
        console.error('Compliance check error:', error);
        res.status(400).json({ error: error.message || 'Failed to check compliance' });
    }
});

export default router;
