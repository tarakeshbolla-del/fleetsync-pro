import { Router } from 'express';
import { prisma } from '../index.js';

const router = Router();

// Get active rental dashboard data for driver
router.get('/active-rental', async (req, res) => {
    try {
        // In a real app, get driverId from JWT token
        const driverId = req.query.driverId as string;

        if (!driverId) {
            return res.status(400).json({ error: 'Driver ID required' });
        }

        // Get active rental for driver
        const rental = await prisma.rental.findFirst({
            where: {
                driverId,
                status: 'ACTIVE'
            },
            include: {
                vehicle: true,
                driver: true
            }
        });

        if (!rental) {
            return res.json({
                hasActiveRental: false,
                vehicle: null,
                documents: null,
                shiftStatus: null,
                lastConditionReport: null
            });
        }

        // Get or create today's shift
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let shift = await prisma.shift.findFirst({
            where: {
                rentalId: rental.id,
                driverId,
                createdAt: { gte: today }
            },
            include: {
                conditionReport: true
            }
        });

        if (!shift) {
            shift = await prisma.shift.create({
                data: {
                    rentalId: rental.id,
                    driverId,
                    status: 'NOT_STARTED'
                },
                include: {
                    conditionReport: true
                }
            });
        }

        // Build response
        const response = {
            hasActiveRental: true,
            rentalId: rental.id,
            vehicle: {
                id: rental.vehicle.id,
                make: rental.vehicle.make,
                model: rental.vehicle.model,
                plate: rental.vehicle.plate,
                vin: rental.vehicle.vin,
                color: rental.vehicle.color,
                year: rental.vehicle.year,
                imageUrl: `/images/vehicles/${rental.vehicle.make.toLowerCase()}-${rental.vehicle.model.toLowerCase().replace(' ', '-')}.jpg`
            },
            documents: {
                regoUrl: `/api/documents/rego/${rental.vehicle.id}`,
                ctpUrl: `/api/documents/ctp/${rental.vehicle.id}`,
                pinkSlipUrl: `/api/documents/pink-slip/${rental.vehicle.id}`,
                rentalAgreementUrl: `/api/documents/rental-agreement/${rental.id}`
            },
            shiftId: shift.id,
            shiftStatus: shift.status,
            startedAt: shift.startedAt,
            lastConditionReport: shift.conditionReport?.verifiedAt || null
        };

        res.json(response);
    } catch (error) {
        console.error('Get active rental error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// Start shift with condition report
router.post('/start-shift', async (req, res) => {
    try {
        const { shiftId, vehicleId, driverId, damageMarkers, notes, photos } = req.body;

        // Update shift to ACTIVE
        const shift = await prisma.shift.update({
            where: { id: shiftId },
            data: {
                status: 'ACTIVE',
                startedAt: new Date()
            }
        });

        // Create condition report
        const conditionReport = await prisma.conditionReport.create({
            data: {
                shiftId,
                vehicleId,
                driverId,
                damageMarkers: damageMarkers ? JSON.stringify(damageMarkers) : null,
                notes,
                photos: photos || []
            }
        });

        res.json({
            success: true,
            shift,
            conditionReport
        });
    } catch (error) {
        console.error('Start shift error:', error);
        res.status(500).json({ error: 'Failed to start shift' });
    }
});

// End shift
router.post('/end-shift', async (req, res) => {
    try {
        const { shiftId } = req.body;

        const shift = await prisma.shift.update({
            where: { id: shiftId },
            data: {
                status: 'ENDED',
                endedAt: new Date()
            }
        });

        res.json({ success: true, shift });
    } catch (error) {
        console.error('End shift error:', error);
        res.status(500).json({ error: 'Failed to end shift' });
    }
});

// Request vehicle return
router.post('/return-vehicle', async (req, res) => {
    try {
        const { rentalId, shiftId } = req.body;

        // End current shift
        if (shiftId) {
            await prisma.shift.update({
                where: { id: shiftId },
                data: {
                    status: 'ENDED',
                    endedAt: new Date()
                }
            });
        }

        // Mark rental for return (admin will complete)
        // In a real app, this might create a return request
        res.json({
            success: true,
            message: 'Return request submitted. Please return the vehicle to the depot.'
        });
    } catch (error) {
        console.error('Return vehicle error:', error);
        res.status(500).json({ error: 'Failed to process return request' });
    }
});

// Report accident (offline-first)
router.post('/accident-report', async (req, res) => {
    try {
        const {
            rentalId,
            driverId,
            vehicleId,
            isSafe,
            emergencyCalled,
            scenePhotos,
            thirdPartyName,
            thirdPartyPhone,
            thirdPartyPlate,
            thirdPartyInsurer,
            description,
            location,
            occurredAt
        } = req.body;

        const report = await prisma.accidentReport.create({
            data: {
                rentalId,
                driverId,
                vehicleId,
                isSafe: isSafe ?? true,
                emergencyCalled: emergencyCalled ?? false,
                scenePhotos: scenePhotos || [],
                thirdPartyName,
                thirdPartyPhone,
                thirdPartyPlate,
                thirdPartyInsurer,
                description,
                location,
                occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
                syncedAt: new Date()
            }
        });

        res.json({ success: true, report });
    } catch (error) {
        console.error('Accident report error:', error);
        res.status(500).json({ error: 'Failed to save accident report' });
    }
});

export default router;
