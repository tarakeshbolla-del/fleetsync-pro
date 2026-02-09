import { prisma } from '../index.js';
import { VehicleStatus, AlertType } from '@prisma/client';

export class ComplianceService {
    /**
     * Check all vehicle expiries and suspend non-compliant vehicles
     * Creates alerts for admin notification
     */
    static async checkExpiries() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all active vehicles (AVAILABLE or RENTED)
        const vehicles = await prisma.vehicle.findMany({
            where: {
                status: {
                    in: [VehicleStatus.AVAILABLE, VehicleStatus.RENTED]
                }
            }
        });

        const results: any[] = [];

        for (const vehicle of vehicles) {
            const issues: { type: AlertType; message: string }[] = [];

            // Check rego expiry
            if (vehicle.regoExpiry < today) {
                issues.push({
                    type: AlertType.REGO_EXPIRY,
                    message: `Registration expired on ${vehicle.regoExpiry.toLocaleDateString()}`
                });
            }

            // Check CTP expiry
            if (vehicle.ctpExpiry < today) {
                issues.push({
                    type: AlertType.CTP_EXPIRY,
                    message: `CTP (Green Slip) expired on ${vehicle.ctpExpiry.toLocaleDateString()}`
                });
            }

            // Check Pink Slip expiry
            if (vehicle.pinkSlipExpiry < today) {
                issues.push({
                    type: AlertType.PINK_SLIP_EXPIRY,
                    message: `Pink Slip (Safety Check) expired on ${vehicle.pinkSlipExpiry.toLocaleDateString()}`
                });
            }

            if (issues.length > 0) {
                // Suspend vehicle
                await prisma.vehicle.update({
                    where: { id: vehicle.id },
                    data: { status: VehicleStatus.SUSPENDED }
                });

                // Create alerts for each issue
                for (const issue of issues) {
                    // Check if alert already exists
                    const existingAlert = await prisma.alert.findFirst({
                        where: {
                            vehicleId: vehicle.id,
                            type: issue.type,
                            resolved: false
                        }
                    });

                    if (!existingAlert) {
                        await prisma.alert.create({
                            data: {
                                type: issue.type,
                                message: `${vehicle.plate}: ${issue.message}`,
                                vehicleId: vehicle.id
                            }
                        });
                    }
                }

                results.push({
                    vehicleId: vehicle.id,
                    plate: vehicle.plate,
                    issues: issues.map(i => i.type),
                    status: 'suspended'
                });
            }
        }

        return {
            checkedCount: vehicles.length,
            suspendedCount: results.length,
            details: results
        };
    }

    /**
     * Get all unresolved alerts
     */
    static async getUnresolvedAlerts() {
        return prisma.alert.findMany({
            where: { resolved: false },
            include: { vehicle: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Resolve an alert
     */
    static async resolveAlert(alertId: string) {
        return prisma.alert.update({
            where: { id: alertId },
            data: {
                resolved: true,
                resolvedAt: new Date()
            }
        });
    }

    /**
     * Get upcoming expiries (within 30 days)
     */
    static async getUpcomingExpiries() {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        const vehicles = await prisma.vehicle.findMany({
            where: {
                status: { not: VehicleStatus.SUSPENDED },
                OR: [
                    { regoExpiry: { lte: thirtyDaysFromNow } },
                    { ctpExpiry: { lte: thirtyDaysFromNow } },
                    { pinkSlipExpiry: { lte: thirtyDaysFromNow } }
                ]
            }
        });

        return vehicles.map(v => {
            const expiries: string[] = [];
            if (v.regoExpiry <= thirtyDaysFromNow) {
                expiries.push(`Rego: ${v.regoExpiry.toLocaleDateString()}`);
            }
            if (v.ctpExpiry <= thirtyDaysFromNow) {
                expiries.push(`CTP: ${v.ctpExpiry.toLocaleDateString()}`);
            }
            if (v.pinkSlipExpiry <= thirtyDaysFromNow) {
                expiries.push(`Pink Slip: ${v.pinkSlipExpiry.toLocaleDateString()}`);
            }
            return {
                vehicleId: v.id,
                plate: v.plate,
                upcomingExpiries: expiries
            };
        });
    }
}
