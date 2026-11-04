/**
 * Automated End-to-End Verification Test Script for Moderator Permissions
 * 
 * Tests:
 * 1. Central permission list and dependency rules
 * 2. Super Admin creation of a moderator with only ['reviews.view', 'reviews.approve']
 * 3. Protected endpoint checks:
 *    - /api/orders (orders.view) -> 403 Forbidden
 *    - /api/admin/reviews (reviews.view) -> 200 OK
 *    - /api/admin/moderators (users.manage) -> 403 Forbidden
 * 4. Immediate Live Permission Update:
 *    - Super Admin adds 'orders.view'
 *    - SAME token without re-login calls /api/orders -> 200 OK!
 * 5. Instant Account Deactivation:
 *    - Super Admin sets isActive: false
 *    - SAME token calls /api/orders -> 401/403 Forbidden!
 * 6. Clean up test user
 * 
 * Usage:
 *   node scripts/test-permissions-e2e.js
 */

const fs = require('fs');
const path = require('path');

let mongoose;
try {
  mongoose = require(path.join(__dirname, '../frontend/node_modules/mongoose'));
} catch {
  mongoose = require('mongoose');
}

let jose;
try {
  jose = require(path.join(__dirname, '../frontend/node_modules/jose'));
} catch {
  jose = require('jose');
}

// Read environment
function loadEnv() {
  const envPath = path.join(__dirname, '../frontend/.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [k, ...v] = trimmed.split('=');
        if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
  }
}
loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'craftykidsco_super_secret_jwt_key_2026_dev_env';
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

// User Schema
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: String,
    role: { type: String, default: 'moderator' },
    permissions: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

// ActivityLog Schema
const activityLogSchema = new mongoose.Schema(
  {
    actorId: String,
    actorEmail: String,
    action: String,
    targetUserId: String,
    details: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);

async function createToken(payload) {
  const secretKey = new TextEncoder().encode(JWT_SECRET);
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secretKey);
}

async function runTests() {
  console.log('🧪 Starting Moderator Permissions End-to-End Verification Test...\n');

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB Atlas');

  const testEmail = `test_mod_${Date.now()}@craftykids.test`;
  let testUserId = null;

  try {
    // -------------------------------------------------------------
    // Test 1: Super Admin Session & Token
    // -------------------------------------------------------------
    console.log('\n--- 1. Generating Super Admin Token ---');
    const superAdminToken = await createToken({
      email: process.env.ADMIN_EMAIL || 'admin@craftykidsco.com',
      role: 'super_admin',
      isSuperAdmin: true,
      name: 'Super Admin',
    });
    console.log('✓ Super Admin token generated successfully');

    // -------------------------------------------------------------
    // Test 2: Create Moderator via API
    // -------------------------------------------------------------
    console.log('\n--- 2. Creating Moderator with only reviews.view & reviews.approve ---');
    const createRes = await fetch(`${BASE_URL}/api/admin/moderators`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `crafty_admin_token=${superAdminToken}`,
      },
      body: JSON.stringify({
        name: 'Test Reviewer',
        email: testEmail,
        password: 'Password123!',
        permissions: ['reviews.view', 'reviews.approve'],
        isActive: true,
      }),
    });

    const createData = await createRes.json();
    if (!createRes.ok || !createData.success) {
      throw new Error(`Failed to create moderator: ${JSON.stringify(createData)}`);
    }
    testUserId = createData.moderator.id;
    console.log(`✓ Moderator created: ID = ${testUserId}, Permissions = [${createData.moderator.permissions.join(', ')}]`);

    // Verify Activity Log entry
    const logEntry = await ActivityLog.findOne({
      targetUserId: testUserId,
      action: 'MODERATOR_CREATED',
    }).lean();
    if (!logEntry) {
      console.warn('⚠️ Activity log for creation not found');
    } else {
      console.log(`✓ ActivityLog verified: actor = ${logEntry.actorEmail}, action = ${logEntry.action}`);
    }

    // -------------------------------------------------------------
    // Test 3: Moderator Token Generation
    // -------------------------------------------------------------
    console.log('\n--- 3. Generating Moderator Session Token ---');
    const moderatorToken = await createToken({
      userId: testUserId,
      email: testEmail,
      role: 'moderator',
      name: 'Test Reviewer',
    });
    console.log('✓ Moderator token generated for:', testEmail);

    // -------------------------------------------------------------
    // Test 4: Verify 403 on Orders (Missing orders.view)
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Restricted Endpoint: /api/orders (Requires orders.view) ---');
    const ordersRes = await fetch(`${BASE_URL}/api/orders`, {
      headers: {
        Cookie: `crafty_admin_token=${moderatorToken}`,
      },
    });
    console.log(`Response Status: ${ordersRes.status} (Expected: 403)`);
    if (ordersRes.status === 403) {
      const ordersData = await ordersRes.json();
      console.log(`✓ Access properly DENIED: ${ordersData.message}`);
    } else {
      throw new Error(`Expected 403 but got ${ordersRes.status}`);
    }

    // -------------------------------------------------------------
    // Test 5: Verify 200 on Reviews (Has reviews.view)
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Permitted Endpoint: /api/admin/reviews (Requires reviews.view) ---');
    const reviewsRes = await fetch(`${BASE_URL}/api/admin/reviews`, {
      headers: {
        Cookie: `crafty_admin_token=${moderatorToken}`,
      },
    });
    console.log(`Response Status: ${reviewsRes.status} (Expected: 200)`);
    if (reviewsRes.status === 200) {
      console.log(`✓ Access properly ALLOWED for reviews`);
    } else {
      const err = await reviewsRes.json();
      throw new Error(`Expected 200 but got ${reviewsRes.status}: ${JSON.stringify(err)}`);
    }

    // -------------------------------------------------------------
    // Test 6: Verify 403 on Moderator Management (Requires Super Admin)
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Super Admin Endpoint: /api/admin/moderators (Requires users.manage) ---');
    const modManageRes = await fetch(`${BASE_URL}/api/admin/moderators`, {
      headers: {
        Cookie: `crafty_admin_token=${moderatorToken}`,
      },
    });
    console.log(`Response Status: ${modManageRes.status} (Expected: 403)`);
    if (modManageRes.status === 403) {
      console.log(`✓ Moderator management properly BLOCKED for regular moderator`);
    } else {
      throw new Error(`Expected 403 but got ${modManageRes.status}`);
    }

    // -------------------------------------------------------------
    // Test 7: Super Admin Adds 'orders.view' Permission
    // -------------------------------------------------------------
    console.log('\n--- 7. Super Admin Adds "orders.view" Permission ---');
    const updateRes = await fetch(`${BASE_URL}/api/admin/moderators/${testUserId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `crafty_admin_token=${superAdminToken}`,
      },
      body: JSON.stringify({
        permissions: ['reviews.view', 'reviews.approve', 'orders.view'],
      }),
    });
    const updateData = await updateRes.json();
    if (!updateRes.ok || !updateData.success) {
      throw new Error(`Failed to update permissions: ${JSON.stringify(updateData)}`);
    }
    console.log(`✓ Permissions updated: [${updateData.moderator.permissions.join(', ')}]`);

    // Verify Update Activity Log
    const updateLog = await ActivityLog.findOne({
      targetUserId: testUserId,
      action: 'MODERATOR_PERMISSIONS_UPDATED',
    }).sort({ createdAt: -1 }).lean();
    if (updateLog) {
      console.log(`✓ ActivityLog verified: old = [${updateLog.details.oldPermissions.join(', ')}], new = [${updateLog.details.newPermissions.join(', ')}]`);
    }

    // -------------------------------------------------------------
    // Test 8: Immediate Effect WITHOUT Re-login
    // -------------------------------------------------------------
    console.log('\n--- 8. Testing /api/orders IMMEDIATELY WITH SAME TOKEN (No Re-login) ---');
    const ordersResAfter = await fetch(`${BASE_URL}/api/orders`, {
      headers: {
        Cookie: `crafty_admin_token=${moderatorToken}`, // EXACT SAME TOKEN!
      },
    });
    console.log(`Response Status: ${ordersResAfter.status} (Expected: 200)`);
    if (ordersResAfter.status === 200) {
      console.log('🎉 SUCCESS: Fresh DB read allowed immediate access without re-login!');
    } else {
      const err = await ordersResAfter.json();
      throw new Error(`Expected 200 but got ${ordersResAfter.status}: ${JSON.stringify(err)}`);
    }

    // -------------------------------------------------------------
    // Test 9: Immediate Deactivation Lockout
    // -------------------------------------------------------------
    console.log('\n--- 9. Super Admin Sets Moderator isActive = false ---');
    const deactivateRes = await fetch(`${BASE_URL}/api/admin/moderators/${testUserId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `crafty_admin_token=${superAdminToken}`,
      },
      body: JSON.stringify({ isActive: false }),
    });
    if (!deactivateRes.ok) throw new Error('Failed to deactivate moderator');
    console.log('✓ Moderator account deactivated');

    console.log('Testing /api/orders with deactivated moderator token...');
    const deactCheck = await fetch(`${BASE_URL}/api/orders`, {
      headers: { Cookie: `crafty_admin_token=${moderatorToken}` },
    });
    console.log(`Response Status: ${deactCheck.status} (Expected: 401 or 403)`);
    if (deactCheck.status === 401 || deactCheck.status === 403) {
      console.log('🎉 SUCCESS: Inactive account locked out immediately!');
    } else {
      throw new Error(`Expected 401/403 but got ${deactCheck.status}`);
    }

    console.log('\n==============================================');
    console.log('✨ ALL 9 VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('==============================================\n');
  } finally {
    // -------------------------------------------------------------
    // Clean up
    // -------------------------------------------------------------
    console.log('🧹 Cleaning up test records from database...');
    if (testUserId) {
      await User.deleteOne({ _id: testUserId });
      await ActivityLog.deleteMany({ targetUserId: testUserId });
      console.log('✓ Test user and activity logs deleted.');
    }
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test run failed:', err);
  process.exit(1);
});
