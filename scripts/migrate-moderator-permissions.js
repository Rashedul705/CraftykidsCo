/**
 * Migration Script: Migrate & Seed Moderator Permissions
 * 
 * Ensures all existing users and moderators in MongoDB Atlas have:
 * - A valid `permissions` array (defaults to [] if missing or non-array)
 * - `isActive: true` if undefined
 * 
 * Usage:
 *   node scripts/migrate-moderator-permissions.js
 */

const fs = require('fs');
const path = require('path');

let mongoose;
try {
  mongoose = require('mongoose');
} catch {
  try {
    mongoose = require(path.join(__dirname, '../frontend/node_modules/mongoose'));
  } catch {
    mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
  }
}

// Read MONGODB_URI from frontend/.env.local or .env
function loadEnv() {
  const envPaths = [
    path.join(__dirname, '../frontend/.env.local'),
    path.join(__dirname, '../frontend/.env'),
    path.join(__dirname, '../.env.local'),
    path.join(__dirname, '../.env'),
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...rest] = trimmed.split('=');
          if (key && rest.length > 0) {
            const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
            if (!process.env[key.trim()]) {
              process.env[key.trim()] = val;
            }
          }
        }
      });
    }
  }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment or .env.local');
  process.exit(1);
}

// User Schema
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: String,
    role: { type: String, default: 'customer' },
    permissions: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function runMigration() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database successfully.');

    // 1. Find users missing permissions field or where permissions is not an array
    const usersToUpdate = await User.find({
      $or: [
        { permissions: { $exists: false } },
        { permissions: null },
        { isActive: { $exists: false } },
      ],
    });

    console.log(`📋 Found ${usersToUpdate.length} user record(s) needing migration.`);

    let updatedCount = 0;
    for (const user of usersToUpdate) {
      const updates = {};
      if (!Array.isArray(user.permissions)) {
        updates.permissions = [];
      }
      if (user.isActive === undefined) {
        updates.isActive = true;
      }

      await User.updateOne({ _id: user._id }, { $set: updates });
      updatedCount++;
      console.log(`   ✓ Migrated user: ${user.email} (Role: ${user.role})`);
    }

    // 2. Summary of current staff & moderators in database
    const staffAndMods = await User.find({
      role: { $in: ['super_admin', 'ADMIN', 'admin', 'moderator', 'order_handler', 'product_manager'] },
    }).lean();

    console.log('\n📊 Current Staff & Admins in MongoDB Atlas:');
    if (staffAndMods.length === 0) {
      console.log('   (No staff or moderator records found yet. Super Admin can add them via /admin/moderators)');
    } else {
      staffAndMods.forEach((m) => {
        console.log(
          `   - ${m.email} | Name: ${m.name || 'N/A'} | Role: ${m.role} | Active: ${m.isActive !== false} | Perms: [${(m.permissions || []).join(', ')}]`
        );
      });
    }

    console.log(`\n🎉 Migration completed successfully! Total users updated: ${updatedCount}`);
  } catch (err) {
    console.error('❌ Migration failed with error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

runMigration();
