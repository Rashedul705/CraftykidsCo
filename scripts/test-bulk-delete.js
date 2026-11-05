const http = require('http');
const path = require('path');
const jose = require(path.join(__dirname, '../frontend/node_modules/jose'));
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({
  path: path.join(__dirname, '../frontend/.env.local'),
});
if (!process.env.JWT_SECRET) {
  require(path.join(__dirname, '../backend/node_modules/dotenv')).config({
    path: path.join(__dirname, '../frontend/.env'),
  });
}
if (!process.env.JWT_SECRET) {
  require(path.join(__dirname, '../backend/node_modules/dotenv')).config({
    path: path.join(__dirname, '../backend/.env'),
  });
}

if (!process.env.JWT_SECRET) {
  throw new Error('[FATAL SECURITY CONFIGURATION ERROR] JWT_SECRET environment variable is missing.');
}

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

async function createToken(payload) {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(secretKey);
}

function request(options, body) {
  return new Promise((resolve, reject) => {
    const payloadStr = body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const headers = { ...(options.headers || {}) };
    if (payloadStr) {
      headers['Content-Length'] = Buffer.byteLength(payloadStr);
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }
    const finalOptions = { ...options, headers };

    const req = http.request(finalOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({ status: res.statusCode, data: json });
      });
    });
    req.on('error', reject);
    if (payloadStr) {
      req.write(payloadStr);
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Bulk Delete Verification Tests...\n');
  let passed = 0;
  let total = 0;

  function assert(name, condition, details = '') {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} - ${details}`);
    }
  }

  const superAdminToken = await createToken({
    email: 'admin@craftykidsco.com',
    role: 'super_admin',
    name: 'Super Admin',
    isSuperAdmin: true,
  });

  // Create a real DB moderator with view permissions only
  const testModEmail = `bulk_test_mod_${Date.now()}@craftykidsco.com`;
  const createModRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/moderators',
      method: 'POST',
      headers: {
        'Cookie': `crafty_admin_token=${superAdminToken}`,
      },
    },
    {
      name: 'Restricted Moderator',
      email: testModEmail,
      password: 'password123',
      permissions: ['products.view', 'customers.view'],
    }
  );

  const modUserId = createModRes.data?.moderator?._id || createModRes.data?.moderator?.id;

  const restrictedModToken = await createToken({
    userId: modUserId,
    email: testModEmail,
    role: 'moderator',
    permissions: ['products.view', 'customers.view'],
    isSuperAdmin: false,
  });

  try {
    // TEST 1: DELETE /api/products without auth => 401
    const res1 = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/products',
        method: 'DELETE',
      },
      { ids: ['test-dummy-1'] }
    );
    assert('Product bulk delete requires authentication (401)', res1.status === 401, `Got ${res1.status}`);

    // TEST 2: DELETE /api/products without products.delete => 403
    const res2 = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/products',
        method: 'DELETE',
        headers: {
          'Cookie': `crafty_admin_token=${restrictedModToken}`,
        },
      },
      { ids: ['test-dummy-1'] }
    );
    assert(
      'Product bulk delete forbidden without products.delete permission (403)',
      res2.status === 403,
      `Got ${res2.status}`
    );

    // TEST 3: DELETE /api/products with empty ids => 400
    const res3 = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/products',
        method: 'DELETE',
        headers: {
          'Cookie': `crafty_admin_token=${superAdminToken}`,
        },
      },
      { ids: [] }
    );
    assert('Product bulk delete rejects empty ids (400)', res3.status === 400, `Got ${res3.status}`);

    // TEST 4: DELETE /api/products with Super Admin => 200
    const res4 = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/products',
        method: 'DELETE',
        headers: {
          'Cookie': `crafty_admin_token=${superAdminToken}`,
        },
      },
      { ids: ['non-existent-product-dummy-id'] }
    );
    assert(
      'Product bulk delete executes successfully for Super Admin (200)',
      res4.status === 200 && res4.data.success === true,
      `Got ${res4.status}: ${JSON.stringify(res4.data)}`
    );

    // TEST 5: DELETE /api/customers without auth => 401
    const res5 = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/customers',
        method: 'DELETE',
      },
      { phones: ['01700000000'] }
    );
    assert('Customer bulk delete requires authentication (401)', res5.status === 401, `Got ${res5.status}`);

    // TEST 6: DELETE /api/customers without customers.delete => 403
    const res6 = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/customers',
        method: 'DELETE',
        headers: {
          'Cookie': `crafty_admin_token=${restrictedModToken}`,
        },
      },
      { phones: ['01700000000'] }
    );
    assert(
      'Customer bulk delete forbidden without customers.delete permission (403)',
      res6.status === 403,
      `Got ${res6.status}`
    );

    // TEST 7: DELETE /api/customers with empty phones => 400
    const res7 = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/customers',
        method: 'DELETE',
        headers: {
          'Cookie': `crafty_admin_token=${superAdminToken}`,
        },
      },
      { phones: [] }
    );
    assert('Customer bulk delete rejects empty phones (400)', res7.status === 400, `Got ${res7.status}`);

    // TEST 8: DELETE /api/customers with Super Admin => 200
    const res8 = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/customers',
        method: 'DELETE',
        headers: {
          'Cookie': `crafty_admin_token=${superAdminToken}`,
        },
      },
      { phones: ['01999999999'] }
    );
    assert(
      'Customer bulk delete executes successfully for Super Admin (200)',
      res8.status === 200 && res8.data.success === true,
      `Got ${res8.status}: ${JSON.stringify(res8.data)}`
    );

    // TEST 9: GET /api/customers with Super Admin => 200
    const res9 = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/customers',
      method: 'GET',
      headers: {
        'Cookie': `crafty_admin_token=${superAdminToken}`,
      },
    });
    assert('Customer list endpoint returns 200', res9.status === 200 && res9.data.success === true, `Got ${res9.status}`);

  } finally {
    // Cleanup created test moderator
    if (modUserId) {
      await request({
        hostname: 'localhost',
        port: 3000,
        path: `/api/admin/moderators/${modUserId}`,
        method: 'DELETE',
        headers: {
          'Cookie': `crafty_admin_token=${superAdminToken}`,
        },
      });
    }
  }

  console.log(`\n📊 Test Summary: ${passed}/${total} tests passed.`);
  process.exit(passed === total ? 0 : 1);
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
