import "dotenv/config";
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('Starting Database Seeding...')

    // Clean up existing data for a fresh seed
    await prisma.payment.deleteMany()
    await prisma.duesProfile.deleteMany()
    await prisma.user.deleteMany()

    // Create Mock User
    const user = await prisma.user.create({
        data: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'member@church.org',
            phone: '+1 (555) 000-0000',
            passwordHash: 'mock-hashed-password-123', // Real app would use bcrypt
            role: 'member',
            duesProfile: {
                create: {
                    totalArrears: 100.0,
                    currentMonthDue: 100.0,
                    status: 'Partially Paid',
                }
            },
            payments: {
                create: [
                    { amount: 100.0, status: 'Completed', type: 'full', transactionId: 'INV001' },
                    { amount: 100.0, status: 'Completed', type: 'full', transactionId: 'INV002' },
                    { amount: 50.0, status: 'Completed', type: 'installment', transactionId: 'INV003' },
                ]
            }
        }
    })

    console.log('Seeded Member:', user.email)
    console.log('Seeding Completed Successfully.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
