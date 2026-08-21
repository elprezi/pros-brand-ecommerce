// Database Seed Script for PROS — PRÉSIDENT OUSMANE SONKO Platform
// Phase 1 Audit Compliant: Supabase Auth ready with authUserId & Environment configurable credentials

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting PROS Phase 1 Database Seeding...');

  // Configurable Demo Credentials from Environment Variables
  const adminEmail = process.env.DEMO_ADMIN_EMAIL || 'admin@pros-official.sn';
  const staffEmail = process.env.DEMO_STAFF_EMAIL || 'staff@pros-official.sn';
  const customerEmail = process.env.DEMO_CUSTOMER_EMAIL || 'client@pros-official.sn';

  // 1. Clean existing records
  await prisma.auditLog.deleteMany({});
  await prisma.productReview.deleteMany({});
  await prisma.shipmentEvent.deleteMany({});
  await prisma.shipment.deleteMany({});
  await prisma.paymentTransaction.deleteMany({});
  await prisma.stockReservation.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.orderStatusHistory.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.collection.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.color.deleteMany({});
  await prisma.size.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.customerProfile.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Seed Users linked with Supabase Auth UUIDs
  const adminUser = await prisma.user.create({
    data: {
      authUserId: 'sb-auth-admin-uuid-0000-000000000001',
      email: adminEmail,
      firstName: 'Ousmane',
      lastName: 'Sonko',
      role: 'ADMIN',
      status: 'ACTIVE',
      phone: '+221770000001',
      profile: {
        create: {
          firstName: 'Ousmane',
          lastName: 'Sonko',
          phone: '+221770000001'
        }
      }
    }
  });

  const staffUser = await prisma.user.create({
    data: {
      authUserId: 'sb-auth-staff-uuid-0000-000000000002',
      email: staffEmail,
      firstName: 'Agent',
      lastName: 'Staff',
      role: 'STAFF',
      status: 'ACTIVE',
      phone: '+221770000002',
      profile: {
        create: {
          firstName: 'Agent',
          lastName: 'Staff',
          phone: '+221770000002'
        }
      }
    }
  });

  const customerUser = await prisma.user.create({
    data: {
      authUserId: 'sb-auth-customer-uuid-0000-000000000003',
      email: customerEmail,
      firstName: 'Moussa',
      lastName: 'Diop',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      phone: '+221770000003',
      profile: {
        create: {
          firstName: 'Moussa',
          lastName: 'Diop',
          phone: '+221770000003'
        }
      }
    }
  });

  console.log(`✅ Demo Accounts Created:
    - Admin: ${adminUser.email} (Role: ${adminUser.role})
    - Staff: ${staffUser.email} (Role: ${staffUser.role})
    - Customer: ${customerUser.email} (Role: ${customerUser.role})
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
