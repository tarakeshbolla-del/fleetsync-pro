import { PrismaClient, VehicleStatus, VevoStatus, DriverStatus, RentalStatus, InvoiceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding FleetSync Pro database...\n');

    // Clear existing data
    await prisma.earningsRecord.deleteMany();
    await prisma.tollCharge.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.rental.deleteMany();
    await prisma.onboardingToken.deleteMany();
    await prisma.driver.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();

    // 1. Create Admin User
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
        data: {
            email: 'admin@fleetsync.com.au',
            password: adminPassword,
            name: 'Fleet Admin',
            role: 'ADMIN'
        }
    });
    console.log(`   Created: ${admin.email}`);

    // 2. Create 20 Vehicles
    console.log('\n🚗 Creating vehicles...');
    const vehicleData = [
        // AVAILABLE vehicles (10)
        { vin: 'WVWZZZ3CZ2E123456', plate: 'ABC123', make: 'Toyota', model: 'Camry', year: 2022, color: 'White', status: VehicleStatus.AVAILABLE, regoExpiry: addDays(90), ctpExpiry: addDays(120), pinkSlipExpiry: addDays(180), weeklyRate: 450, bondAmount: 1000 },
        { vin: 'WVWZZZ3CZ2E123457', plate: 'DEF456', make: 'Toyota', model: 'Corolla', year: 2023, color: 'Silver', status: VehicleStatus.AVAILABLE, regoExpiry: addDays(60), ctpExpiry: addDays(90), pinkSlipExpiry: addDays(150), weeklyRate: 400, bondAmount: 900 },
        { vin: 'WVWZZZ3CZ2E123458', plate: 'GHI789', make: 'Hyundai', model: 'i30', year: 2022, color: 'Black', status: VehicleStatus.AVAILABLE, regoExpiry: addDays(45), ctpExpiry: addDays(60), pinkSlipExpiry: addDays(120), weeklyRate: 380, bondAmount: 850 },
        { vin: 'WVWZZZ3CZ2E123459', plate: 'JKL012', make: 'Kia', model: 'Cerato', year: 2023, color: 'Red', status: VehicleStatus.AVAILABLE, regoExpiry: addDays(100), ctpExpiry: addDays(130), pinkSlipExpiry: addDays(200), weeklyRate: 390, bondAmount: 900 },
        { vin: 'WVWZZZ3CZ2E123460', plate: 'MNO345', make: 'Mazda', model: '3', year: 2022, color: 'Blue', status: VehicleStatus.AVAILABLE, regoExpiry: addDays(75), ctpExpiry: addDays(100), pinkSlipExpiry: addDays(160), weeklyRate: 420, bondAmount: 950 },
        { vin: 'WVWZZZ3CZ2E123461', plate: 'PQR678', make: 'Honda', model: 'Civic', year: 2023, color: 'White', status: VehicleStatus.AVAILABLE, regoExpiry: addDays(50), ctpExpiry: addDays(80), pinkSlipExpiry: addDays(140), weeklyRate: 430, bondAmount: 1000 },
        { vin: 'WVWZZZ3CZ2E123462', plate: 'STU901', make: 'Toyota', model: 'Yaris', year: 2021, color: 'Grey', status: VehicleStatus.AVAILABLE, regoExpiry: addDays(25), ctpExpiry: addDays(40), pinkSlipExpiry: addDays(100), weeklyRate: 350, bondAmount: 800 },
        { vin: 'WVWZZZ3CZ2E123463', plate: 'VWX234', make: 'Hyundai', model: 'Elantra', year: 2022, color: 'Black', status: VehicleStatus.AVAILABLE, regoExpiry: addDays(80), ctpExpiry: addDays(110), pinkSlipExpiry: addDays(170), weeklyRate: 400, bondAmount: 900 },
        { vin: 'WVWZZZ3CZ2E123464', plate: 'YZA567', make: 'Kia', model: 'Rio', year: 2023, color: 'Silver', status: VehicleStatus.AVAILABLE, regoExpiry: addDays(35), ctpExpiry: addDays(55), pinkSlipExpiry: addDays(115), weeklyRate: 360, bondAmount: 850 },
        { vin: 'WVWZZZ3CZ2E123465', plate: 'BCD890', make: 'Mazda', model: 'CX-3', year: 2022, color: 'Red', status: VehicleStatus.AVAILABLE, regoExpiry: addDays(65), ctpExpiry: addDays(95), pinkSlipExpiry: addDays(155), weeklyRate: 470, bondAmount: 1100 },
        // RENTED vehicles (8)
        { vin: 'WVWZZZ3CZ2E123466', plate: 'EFG123', make: 'Toyota', model: 'Camry Hybrid', year: 2023, color: 'White', status: VehicleStatus.RENTED, regoExpiry: addDays(70), ctpExpiry: addDays(100), pinkSlipExpiry: addDays(160), weeklyRate: 500, bondAmount: 1200 },
        { vin: 'WVWZZZ3CZ2E123467', plate: 'HIJ456', make: 'Toyota', model: 'RAV4', year: 2022, color: 'Blue', status: VehicleStatus.RENTED, regoExpiry: addDays(55), ctpExpiry: addDays(85), pinkSlipExpiry: addDays(145), weeklyRate: 520, bondAmount: 1300 },
        { vin: 'WVWZZZ3CZ2E123468', plate: 'KLM789', make: 'Hyundai', model: 'Tucson', year: 2023, color: 'Black', status: VehicleStatus.RENTED, regoExpiry: addDays(40), ctpExpiry: addDays(70), pinkSlipExpiry: addDays(130), weeklyRate: 490, bondAmount: 1150 },
        { vin: 'WVWZZZ3CZ2E123469', plate: 'NOP012', make: 'Kia', model: 'Sportage', year: 2022, color: 'Grey', status: VehicleStatus.RENTED, regoExpiry: addDays(85), ctpExpiry: addDays(115), pinkSlipExpiry: addDays(175), weeklyRate: 480, bondAmount: 1100 },
        { vin: 'WVWZZZ3CZ2E123470', plate: 'QRS345', make: 'Mazda', model: 'CX-5', year: 2023, color: 'Red', status: VehicleStatus.RENTED, regoExpiry: addDays(30), ctpExpiry: addDays(60), pinkSlipExpiry: addDays(120), weeklyRate: 530, bondAmount: 1250 },
        { vin: 'WVWZZZ3CZ2E123471', plate: 'TUV678', make: 'Honda', model: 'HR-V', year: 2022, color: 'White', status: VehicleStatus.RENTED, regoExpiry: addDays(95), ctpExpiry: addDays(125), pinkSlipExpiry: addDays(185), weeklyRate: 460, bondAmount: 1050 },
        { vin: 'WVWZZZ3CZ2E123472', plate: 'WXY901', make: 'Toyota', model: 'C-HR', year: 2023, color: 'Silver', status: VehicleStatus.RENTED, regoExpiry: addDays(20), ctpExpiry: addDays(50), pinkSlipExpiry: addDays(110), weeklyRate: 470, bondAmount: 1100 },
        { vin: 'WVWZZZ3CZ2E123473', plate: 'ZAB234', make: 'Hyundai', model: 'Kona', year: 2022, color: 'Blue', status: VehicleStatus.RENTED, regoExpiry: addDays(110), ctpExpiry: addDays(140), pinkSlipExpiry: addDays(200), weeklyRate: 450, bondAmount: 1000 },
        // SUSPENDED vehicles (2 - expired pink slips)
        { vin: 'WVWZZZ3CZ2E123474', plate: 'CDE567', make: 'Nissan', model: 'Pulsar', year: 2020, color: 'Black', status: VehicleStatus.SUSPENDED, regoExpiry: addDays(30), ctpExpiry: addDays(60), pinkSlipExpiry: addDays(-10), weeklyRate: 320, bondAmount: 750 },
        { vin: 'WVWZZZ3CZ2E123475', plate: 'FGH890', make: 'Mitsubishi', model: 'Lancer', year: 2019, color: 'Grey', status: VehicleStatus.SUSPENDED, regoExpiry: addDays(-5), ctpExpiry: addDays(45), pinkSlipExpiry: addDays(-30), weeklyRate: 300, bondAmount: 700 },
    ];

    const vehicles = await Promise.all(
        vehicleData.map(v => prisma.vehicle.create({ data: v }))
    );
    console.log(`   Created ${vehicles.length} vehicles`);

    // Create alerts for suspended vehicles
    await prisma.alert.create({
        data: {
            type: 'PINK_SLIP_EXPIRY',
            message: 'CDE567: Pink Slip (Safety Check) expired',
            vehicleId: vehicles[18].id
        }
    });
    await prisma.alert.create({
        data: {
            type: 'REGO_EXPIRY',
            message: 'FGH890: Registration expired',
            vehicleId: vehicles[19].id
        }
    });
    await prisma.alert.create({
        data: {
            type: 'PINK_SLIP_EXPIRY',
            message: 'FGH890: Pink Slip (Safety Check) expired',
            vehicleId: vehicles[19].id
        }
    });

    // 3. Create 5 Drivers with User accounts
    console.log('\n🧑‍✈️ Creating drivers...');
    const driverPassword = await bcrypt.hash('driver123', 10);

    const driverData = [
        { name: 'John Smith', email: 'john.smith@email.com', phone: '0412345678', licenseNo: 'NSW1234567', licenseExpiry: addDays(365), passportNo: 'PA1234567', vevoStatus: VevoStatus.APPROVED, status: DriverStatus.ACTIVE },
        { name: 'Sarah Chen', email: 'sarah.chen@email.com', phone: '0423456789', licenseNo: 'NSW2345678', licenseExpiry: addDays(400), passportNo: 'PA2345678', vevoStatus: VevoStatus.APPROVED, status: DriverStatus.ACTIVE },
        { name: 'Mohammed Ali', email: 'mohammed.ali@email.com', phone: '0434567890', licenseNo: 'NSW3456789', licenseExpiry: addDays(200), passportNo: 'PA3456789', vevoStatus: VevoStatus.APPROVED, status: DriverStatus.ACTIVE },
        { name: 'Emma Thompson', email: 'emma.thompson@email.com', phone: '0445678901', licenseNo: 'NSW4567890', licenseExpiry: addDays(500), passportNo: 'PA4567890', vevoStatus: VevoStatus.APPROVED, status: DriverStatus.ACTIVE },
        { name: 'Raj Patel', email: 'raj.patel@email.com', phone: '0456789012', licenseNo: 'NSW5678901', licenseExpiry: addDays(300), passportNo: 'PA5670000', vevoStatus: VevoStatus.DENIED, status: DriverStatus.BLOCKED }, // Ends in 0000 - DENIED
    ];

    const drivers = [];
    for (const d of driverData) {
        // Create user account for driver
        const user = await prisma.user.create({
            data: {
                email: d.email,
                password: driverPassword,
                name: d.name,
                role: 'DRIVER'
            }
        });

        // Create driver linked to user
        const driver = await prisma.driver.create({
            data: {
                ...d,
                userId: user.id,
                vevoCheckedAt: new Date(),
                balance: Math.random() * 500 - 250 // Random balance between -250 and 250
            }
        });
        drivers.push(driver);
    }
    console.log(`   Created ${drivers.length} drivers with user accounts (1 with VEVO DENIED)`);

    // 4. Create rentals for active drivers with rented vehicles
    console.log('\n📋 Creating rentals...');
    const rentedVehicles = vehicles.filter(v => v.status === VehicleStatus.RENTED);
    const activeDrivers = drivers.filter(d => d.status === DriverStatus.ACTIVE);

    const rentals = [];
    for (let i = 0; i < rentedVehicles.length && i < activeDrivers.length; i++) {
        const startDate = addDays(-28 + (i * 7)); // Stagger start dates
        const rental = await prisma.rental.create({
            data: {
                driverId: activeDrivers[i % activeDrivers.length].id,
                vehicleId: rentedVehicles[i].id,
                startDate,
                bondAmount: rentedVehicles[i].bondAmount,
                weeklyRate: rentedVehicles[i].weeklyRate,
                nextPaymentDate: addDays(7),
                status: RentalStatus.ACTIVE
            }
        });
        rentals.push(rental);
    }
    console.log(`   Created ${rentals.length} active rentals`);

    // 5. Create 4 weeks of invoice history
    console.log('\n💰 Creating invoice history...');
    let invoiceCount = 0;

    for (const rental of rentals) {
        for (let week = 0; week < 4; week++) {
            const dueDate = addDays(-7 * (3 - week)); // Past invoices
            const weeklyRate = Number(rental.weeklyRate);
            const tolls = Math.random() * 50;
            const fines = week === 2 ? Math.random() * 100 : 0; // Random fine in week 2
            const credits = week === 1 ? 20 : 0; // Credit in week 1
            const amount = weeklyRate + tolls + fines - credits;

            await prisma.invoice.create({
                data: {
                    rentalId: rental.id,
                    weeklyRate,
                    tolls,
                    fines,
                    credits,
                    amount,
                    dueDate,
                    status: week < 3 ? InvoiceStatus.PAID : InvoiceStatus.PENDING,
                    paidAt: week < 3 ? dueDate : null
                }
            });
            invoiceCount++;
        }
    }
    console.log(`   Created ${invoiceCount} invoices (4 weeks history per rental)`);

    // 6. Create earnings records for charts
    console.log('\n📊 Creating earnings records...');
    let earningsCount = 0;

    for (const driver of activeDrivers) {
        for (let week = 0; week < 4; week++) {
            const weekStarting = getMonday(addDays(-7 * (3 - week)));
            const grossEarnings = 800 + Math.random() * 700; // $800 - $1500

            await prisma.earningsRecord.create({
                data: {
                    driverId: driver.id,
                    weekStarting,
                    grossEarnings,
                    netEarnings: grossEarnings * 0.75,
                    trips: Math.floor(40 + Math.random() * 40),
                    platform: 'uber'
                }
            });
            earningsCount++;
        }
    }
    console.log(`   Created ${earningsCount} earnings records`);

    console.log('\n✅ Seeding complete!\n');
    console.log('Login credentials:');
    console.log('  Admin:');
    console.log('    Email: admin@fleetsync.com.au');
    console.log('    Password: admin123');
    console.log('  Driver:');
    console.log('    Email: john.smith@email.com');
    console.log('    Password: driver123');
}

function addDays(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
}

function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

main()
    .catch((e) => {
        console.error('Seeding error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
