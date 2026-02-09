import { prisma } from '../index.js';
import { VehicleStatus } from '@prisma/client';

export class VehicleService {
    /**
     * Validate vehicle compliance based on NSW requirements
     * If any expiry date < today, set status to SUSPENDED
     */
    static async validateCompliance(vehicleId: string): Promise<{
        isCompliant: boolean;
        issues: string[];
        vehicle: any;
    }> {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId }
        });

        if (!vehicle) {
            throw new Error('Vehicle not found');
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const issues: string[] = [];

        // Check rego expiry
        if (vehicle.regoExpiry < today) {
            issues.push('Registration has expired');
        }

        // Check CTP (Green Slip) expiry
        if (vehicle.ctpExpiry < today) {
            issues.push('CTP (Green Slip) has expired');
        }

        // Check Pink Slip expiry
        if (vehicle.pinkSlipExpiry < today) {
            issues.push('Pink Slip (Safety Check) has expired');
        }

        const isCompliant = issues.length === 0;

        // Auto-suspend if not compliant
        if (!isCompliant && vehicle.status !== VehicleStatus.SUSPENDED) {
            await prisma.vehicle.update({
                where: { id: vehicleId },
                data: { status: VehicleStatus.SUSPENDED }
            });
        }

        return {
            isCompliant,
            issues,
            vehicle: await prisma.vehicle.findUnique({ where: { id: vehicleId } })
        };
    }

    /**
     * Get compliance status for all dates
     * Returns "traffic light" status: GREEN (>30 days), AMBER (<30 days), RED (expired)
     */
    static getComplianceStatus(expiryDate: Date): 'GREEN' | 'AMBER' | 'RED' {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'RED';
        if (diffDays <= 30) return 'AMBER';
        return 'GREEN';
    }

    /**
     * Get all vehicles with compliance status
     */
    static async getAllWithCompliance() {
        const vehicles = await prisma.vehicle.findMany({
            include: {
                rentals: {
                    where: { status: 'ACTIVE' },
                    include: { driver: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return vehicles.map(vehicle => ({
            ...vehicle,
            compliance: {
                rego: this.getComplianceStatus(vehicle.regoExpiry),
                ctp: this.getComplianceStatus(vehicle.ctpExpiry),
                pinkSlip: this.getComplianceStatus(vehicle.pinkSlipExpiry)
            },
            currentDriver: vehicle.rentals[0]?.driver || null
        }));
    }

    /**
     * Create a new vehicle
     */
    static async create(data: {
        vin: string;
        plate: string;
        make: string;
        model: string;
        year: number;
        color: string;
        regoExpiry: Date;
        ctpExpiry: Date;
        pinkSlipExpiry: Date;
        weeklyRate?: number;
        bondAmount?: number;
    }) {
        return prisma.vehicle.create({
            data: {
                ...data,
                status: VehicleStatus.DRAFT
            }
        });
    }

    /**
     * Update vehicle and check compliance
     */
    static async update(id: string, data: Partial<{
        vin: string;
        plate: string;
        make: string;
        model: string;
        year: number;
        color: string;
        status: VehicleStatus;
        regoExpiry: Date;
        ctpExpiry: Date;
        pinkSlipExpiry: Date;
        weeklyRate: number;
        bondAmount: number;
    }>) {
        const vehicle = await prisma.vehicle.update({
            where: { id },
            data
        });

        // Re-validate compliance after update
        await this.validateCompliance(id);

        return prisma.vehicle.findUnique({ where: { id } });
    }

    /**
     * Delete vehicle (only if not rented)
     */
    static async delete(id: string) {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
            include: { rentals: { where: { status: 'ACTIVE' } } }
        });

        if (!vehicle) {
            throw new Error('Vehicle not found');
        }

        if (vehicle.rentals.length > 0) {
            throw new Error('Cannot delete vehicle with active rental');
        }

        return prisma.vehicle.delete({ where: { id } });
    }
}
