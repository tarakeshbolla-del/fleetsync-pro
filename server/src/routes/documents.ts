import { Router } from 'express';

const router = Router();

// Dummy document data for testing
const DUMMY_DOCUMENTS = {
    rego: {
        title: 'Vehicle Registration Certificate',
        type: 'NSW Registration',
        issueDate: '2024-01-15',
        expiryDate: '2025-01-15',
        details: {
            registrationNo: 'ABC-123',
            plateNo: 'ABC123',
            vehicleType: 'Motor Vehicle - Passenger',
            make: 'Toyota',
            model: 'Camry',
            year: '2023',
            colour: 'White',
            vin: 'WVWZZZ3CZ2E123466',
            engineNo: 'ENG123456789',
            grossVehicleMass: '1850 kg',
            taraWeight: '1450 kg',
            owner: 'FleetSync Pty Ltd',
            ownerAddress: '123 Fleet Street, Sydney NSW 2000'
        }
    },
    ctp: {
        title: 'CTP Green Slip Insurance',
        type: 'Compulsory Third Party Insurance',
        policyNo: 'CTP-2024-789456',
        issueDate: '2024-01-15',
        expiryDate: '2025-01-15',
        insurer: 'NRMA Insurance',
        details: {
            vehiclePlate: 'ABC123',
            vehicleType: 'Private Passenger Vehicle',
            policyHolder: 'FleetSync Pty Ltd',
            coverType: 'Class 1 - Private Use',
            premiumPaid: '$485.00',
            effectiveDate: '2024-01-15 00:00:00',
            expiryTime: '2025-01-15 23:59:59'
        }
    },
    'pink-slip': {
        title: 'Pink Slip - Safety Inspection Report',
        type: 'NSW eInspection Certificate',
        inspectionDate: '2024-06-15',
        validUntil: '2025-06-15',
        stationNo: 'AIS-12345',
        stationName: 'FleetSync Service Centre',
        details: {
            vehiclePlate: 'ABC123',
            vehicleVin: 'WVWZZZ3CZ2E123466',
            odometer: '45,678 km',
            inspectorNo: 'INS-789',
            result: 'PASS',
            items: [
                { name: 'Brakes', status: 'PASS' },
                { name: 'Steering', status: 'PASS' },
                { name: 'Suspension', status: 'PASS' },
                { name: 'Tyres', status: 'PASS' },
                { name: 'Lights', status: 'PASS' },
                { name: 'Windscreen', status: 'PASS' },
                { name: 'Seatbelts', status: 'PASS' },
                { name: 'Body Condition', status: 'PASS' }
            ]
        }
    },
    'rental-agreement': {
        title: 'Vehicle Rental Agreement',
        type: 'Rideshare Vehicle Lease',
        agreementNo: 'FSP-2024-001',
        startDate: '2024-01-20',
        status: 'Active',
        details: {
            lessor: 'FleetSync Pty Ltd',
            lessorABN: '12 345 678 901',
            lessee: 'John Smith',
            lesseeEmail: 'john.smith@email.com',
            vehicle: '2023 Toyota Camry Hybrid (ABC123)',
            weeklyRate: '$500.00',
            bondAmount: '$1,200.00',
            paymentDay: 'Monday',
            minimumTerm: '4 weeks',
            permittedUse: 'Rideshare (Uber, DiDi, Ola)',
            insuranceCover: 'Comprehensive - Included in rental',
            maintenanceResponsibility: 'Lessor',
            fuelResponsibility: 'Lessee'
        },
        terms: [
            'Driver must maintain valid rideshare registration',
            'Vehicle must be returned with same fuel level',
            'Damage beyond normal wear will be charged to bond',
            'Weekly payments due every Monday by 5pm',
            'Late payments incur $50 admin fee'
        ]
    }
};

// Get document by type
router.get('/:type/:vehicleId', (req, res) => {
    const { type } = req.params;

    const doc = DUMMY_DOCUMENTS[type as keyof typeof DUMMY_DOCUMENTS];

    if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
    }

    res.json(doc);
});

// Get rental agreement
router.get('/rental-agreement/:rentalId', (req, res) => {
    res.json(DUMMY_DOCUMENTS['rental-agreement']);
});

export default router;
