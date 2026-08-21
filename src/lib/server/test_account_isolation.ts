/**
 * Automated Verification Script for PROS Client Account Data Isolation
 * Verifies Section 18, 19, 20 & 24 Requirements
 */

import { apiGetAccount, apiGetOrderById, getUserReturnRequests, getUserLoyaltyTransactions, getUserWishlist, saveUserWishlist } from './accountApi';
import type { AdminUser } from '../../store/authContext';
import type { Order, DeliveryAddress } from '../../types/ecommerce';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ TEST FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ TEST PASSED: ${message}`);
  }
}

export async function runIsolationTests() {
  console.log('\n==================================================');
  console.log('🚀 STARTING PROS ACCOUNT ISOLATION TEST SUITE');
  console.log('==================================================\n');

  // 1. SETUP CLIENT A
  const clientA: AdminUser = {
    id: 'usr-client-A-1001',
    firstName: 'Amadou',
    lastName: 'Diallo',
    email: 'clientA@test.pros',
    phone: '+221 77 111 11 11',
    role: 'CLIENT',
    permissions: [],
    createdAt: new Date().toISOString(),
    status: 'ACTIVE',
  };

  // 2. SETUP CLIENT B
  const clientB: AdminUser = {
    id: 'usr-client-B-2002',
    firstName: 'Binta',
    lastName: 'Sow',
    email: 'clientB@test.pros',
    phone: '+221 78 222 22 22',
    role: 'CLIENT',
    permissions: [],
    createdAt: new Date().toISOString(),
    status: 'ACTIVE',
  };

  // Mock global storage arrays
  const allOrders: Order[] = [
    {
      id: 'ORD-TEST-B-999',
      trackingNumber: 'TRK-B-999',
      userId: clientB.id,
      customer: {
        firstName: clientB.firstName,
        lastName: clientB.lastName,
        email: clientB.email,
        phone: clientB.phone,
        address: 'Point E, Dakar',
        city: 'Dakar',
        region: 'Dakar',
        country: 'Sénégal',
      },
      items: [],
      totalAmount: 35000,
      subtotal: 35000,
      shippingFee: 2000,
      taxAmount: 0,
      currency: 'XOF',
      status: 'DELIVERED',
      paymentStatus: 'paid',
      paymentMethod: 'WAVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deliveryAddress: {
        id: 'addr-b1',
        customerId: clientB.id,
        label: 'DOMICILE',
        recipientName: 'Binta Sow',
        phone: '+221 78 222 22 22',
        addressLine1: 'Point E',
        city: 'Dakar',
        region: 'Dakar',
        country: 'Sénégal',
        isDefault: true,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    } as any,
  ];

  const allAddresses: DeliveryAddress[] = [
    {
      id: 'addr-A1',
      customerId: clientA.id,
      label: 'DOMICILE',
      recipientName: 'Amadou Diallo',
      phone: '+221 77 111 11 11',
      addressLine1: 'Almadies, Villa 4',
      city: 'Dakar',
      region: 'Dakar',
      country: 'Sénégal',
      isDefault: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'addr-B1',
      customerId: clientB.id,
      label: 'DOMICILE',
      recipientName: 'Binta Sow',
      phone: '+221 78 222 22 22',
      addressLine1: 'Point E, Rue 4',
      city: 'Dakar',
      region: 'Dakar',
      country: 'Sénégal',
      isDefault: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'addr-B2',
      customerId: clientB.id,
      label: 'BUREAU',
      recipientName: 'Binta Sow',
      phone: '+221 78 222 22 22',
      addressLine1: 'Plateau, Immeuble PROS',
      city: 'Dakar',
      region: 'Dakar',
      country: 'Sénégal',
      isDefault: false,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  // TEST 1: CLIENT A Initial Zero-State Verification
  console.log('--- TEST 1: Client A Zero State Verification ---');
  const resA = await apiGetAccount(clientA, [], [], [], null);
  assert(resA.success === true, 'Client A account fetched successfully');
  assert(resA.data?.stats.ordersCount === 0, 'Client A has 0 orders');
  assert(resA.data?.stats.addressesCount === 0, 'Client A initially has 0 addresses');
  assert(resA.data?.stats.loyaltyPoints === 0, 'Client A initially has 0 loyalty points');
  assert(resA.data?.stats.loyaltyTier === 'BRONZE', 'Client A starts at BRONZE tier');

  // TEST 2: Wishlist Isolation
  console.log('\n--- TEST 2: Wishlist Data Isolation ---');
  saveUserWishlist(clientA.id, ['prod-hoodie-01']);
  saveUserWishlist(clientB.id, ['prod-tshirt-02', 'prod-cap-03']);

  const wishA = getUserWishlist(clientA.id);
  const wishB = getUserWishlist(clientB.id);

  assert(wishA.length === 1 && wishA[0] === 'prod-hoodie-01', 'Client A sees ONLY their 1 wishlist product');
  assert(wishB.length === 2 && wishB.includes('prod-tshirt-02'), 'Client B sees ONLY their 2 wishlist products');
  assert(!wishA.includes('prod-tshirt-02'), 'Client A CANNOT see Client B wishlist data');

  // TEST 3: Address Isolation
  console.log('\n--- TEST 3: Address Isolation & Filtering ---');
  const resA_WithAddr = await apiGetAccount(clientA, [], allAddresses, wishA, null);
  const resB_WithAddr = await apiGetAccount(clientB, [], allAddresses, wishB, null);

  assert(resA_WithAddr.data?.stats.addressesCount === 1, 'Client A filters and sees strictly 1 address');
  assert(resB_WithAddr.data?.stats.addressesCount === 2, 'Client B filters and sees strictly 2 addresses');

  // TEST 4: Returns & Refunds Zero-State & Isolation
  console.log('\n--- TEST 4: Returns & Refunds Zero-State Isolation ---');
  const retA = getUserReturnRequests(clientA.id);
  const retB = getUserReturnRequests(clientB.id);
  assert(retA.length === 0, 'New Client A has 0 return requests');
  assert(retB.length === 0, 'New Client B has 0 return requests');

  // TEST 5: Loyalty Transactions Zero-State Isolation
  console.log('\n--- TEST 5: Loyalty Transactions Zero-State Isolation ---');
  const txnsA = getUserLoyaltyTransactions(clientA.email);
  assert(txnsA.length === 0, 'New Client A has 0 mock loyalty transactions');

  // TEST 6: RBAC Order Security & Ownership Protection (403 Check)
  console.log('\n--- TEST 6: RBAC Order Ownership Protection ---');
  const orderCheckUnauthorized = await apiGetOrderById(clientA, 'ORD-TEST-B-999', allOrders);
  assert(orderCheckUnauthorized.success === false, 'Client A requesting Client B order returns success = false');
  assert(orderCheckUnauthorized.status === 403, 'Client A requesting Client B order returns status 403 FORBIDDEN');

  const orderCheckAuthorized = await apiGetOrderById(clientB, 'ORD-TEST-B-999', allOrders);
  assert(orderCheckAuthorized.success === true, 'Client B requesting OWN order succeeds with 200 OK');

  console.log('\n==================================================');
  console.log('🎉 ALL ISOLATION & ZERO-STATE TESTS PASSED 100%!');
  console.log('==================================================\n');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('test_account_isolation')) {
  runIsolationTests();
}
