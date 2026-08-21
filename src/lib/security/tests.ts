import { evaluateRouteGuard } from '../../../middleware';
import { requireRole, requirePermission } from '../auth/serverAuth';
import { createSession } from '../auth/session';
import { validateRoleMutation } from '../auth/permissions';
import { handleAdminProductApi } from '../../pages/api/admin/products';

export interface TestCaseResult {
  testId: number;
  description: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export function runMandatorySecurityTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  const tokenCustomer = 'test_token_customer';
  const tokenStaff = 'test_token_staff';
  const tokenAdmin = 'test_token_admin';

  createSession(tokenCustomer, {
    id: 'cust-1',
    email: 'client@pros-official.sn',
    firstName: 'Moussa',
    lastName: 'Diop',
    role: 'CUSTOMER',
    status: 'ACTIVE',
  });

  createSession(tokenStaff, {
    id: 'staff-1',
    email: 'staff@pros-official.sn',
    firstName: 'Agent',
    lastName: 'Staff',
    role: 'STAFF',
    status: 'ACTIVE',
  });

  createSession(tokenAdmin, {
    id: 'admin-1',
    email: 'admin@pros-official.sn',
    firstName: 'Ousmane',
    lastName: 'Sonko',
    role: 'ADMIN',
    status: 'ACTIVE',
  });

  // TEST 1: Anonymous GET /admin -> redirect /admin/login
  const guard1 = evaluateRouteGuard('/admin', null);
  results.push({
    testId: 1,
    description: 'Anonymous GET /admin',
    expected: '/admin/login',
    actual: guard1.redirectTo || 'allowed',
    passed: guard1.allowed === false && (guard1.redirectTo === '/admin/login' || guard1.redirectTo === '/auth/login?redirect=/admin'),
  });

  // TEST 2: CUSTOMER GET /admin -> redirect /admin/unauthorized
  const guard2 = evaluateRouteGuard('/admin', 'CUSTOMER');
  results.push({
    testId: 2,
    description: 'CUSTOMER GET /admin',
    expected: '/admin/unauthorized',
    actual: guard2.redirectTo || 'allowed',
    passed: guard2.allowed === false && guard2.redirectTo === '/admin/unauthorized',
  });

  // TEST 3: CUSTOMER GET /api/admin/* -> HTTP 403 Forbidden
  const api3 = requireRole(tokenCustomer, 'ADMIN');
  results.push({
    testId: 3,
    description: 'CUSTOMER GET /api/admin/*',
    expected: '403',
    actual: String(api3.statusCode),
    passed: api3.statusCode === 403,
  });

  // TEST 4: ADMIN GET /admin -> Dashboard
  const guard4 = evaluateRouteGuard('/admin', 'ADMIN');
  results.push({
    testId: 4,
    description: 'ADMIN GET /admin',
    expected: 'allowed',
    actual: guard4.allowed ? 'allowed' : (guard4.redirectTo || 'blocked'),
    passed: guard4.allowed === true,
  });

  // TEST 5: STAFF GET /admin -> Dashboard with limited permissions
  const guard5 = evaluateRouteGuard('/admin', 'STAFF');
  const staffCustPerm = requirePermission(tokenStaff, 'MANAGE_CUSTOMERS');
  const staffProdPerm = requirePermission(tokenStaff, 'MANAGE_PRODUCTS');
  const staffPassed = guard5.allowed === true && staffCustPerm.statusCode === 403 && staffProdPerm.statusCode === undefined;

  results.push({
    testId: 5,
    description: 'STAFF GET /admin (Limited Permissions)',
    expected: 'allowed_with_restrictions',
    actual: staffPassed ? 'allowed_with_restrictions' : 'failed',
    passed: staffPassed,
  });

  // TEST 6: CUSTOMER attempts to modify role -> HTTP 403 Forbidden
  const custSession = getSessionMock(tokenCustomer);
  const canMutate = validateRoleMutation(custSession, 'cust-1', 'ADMIN');
  results.push({
    testId: 6,
    description: 'CUSTOMER role escalation attempt',
    expected: '403_forbidden',
    actual: canMutate ? 'allowed' : '403_forbidden',
    passed: canMutate === false,
  });

  // TEST 7: Unauthenticated calls protected API -> HTTP 401 Unauthorized
  const api7 = requireRole(null, 'ADMIN');
  results.push({
    testId: 7,
    description: 'Unauthenticated calls protected API',
    expected: '401',
    actual: String(api7.statusCode),
    passed: api7.statusCode === 401,
  });

  // TEST 8 (PHASE 2 CRITICAL): CUSTOMER attempts POST /api/admin/products -> HTTP 403 Forbidden
  const api8 = handleAdminProductApi({
    token: tokenCustomer,
    action: 'CREATE',
    product: { name: 'Fake Product', price: 100 },
  });
  results.push({
    testId: 8,
    description: 'CUSTOMER POST /api/admin/products',
    expected: '403',
    actual: String(api8.status),
    passed: api8.status === 403,
  });

  return results;
}

function getSessionMock(token: string) {
  if (token === 'test_token_customer') {
    return {
      id: 'cust-1',
      email: 'client@pros-official.sn',
      firstName: 'Moussa',
      lastName: 'Diop',
      role: 'CUSTOMER' as const,
      status: 'ACTIVE' as const,
    };
  }
  return null;
}
