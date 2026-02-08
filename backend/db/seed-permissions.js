/**
 * Database seed script to populate roles and permissions
 * Run this script once to set up the initial role and permission structure
 * Usage: node backend/db/seed-permissions.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Role from '../models/roles.model.js';
import Permission from '../models/permission.model.js';
import RolePermission from '../models/rolePermission.model.js';

dotenv.config();

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to preserve existing)
    // await Role.deleteMany({});
    // await Permission.deleteMany({});
    // await RolePermission.deleteMany({});

    // Define all permissions
    const permissionNames = [
      'bug:read',
      'bug:create',
      'bug:update',
      'bug:delete',
      'bug:resolve',
      'bug:verify',
      'bug:assign',
      'user:read',
      'user:update',
      'user:delete'
    ];

    console.log('Creating permissions...');
    const permissions = {};
    for (const name of permissionNames) {
      let perm = await Permission.findOne({ name });
      if (!perm) {
        perm = await Permission.create({ name, description: `Permission to ${name}` });
      }
      permissions[name] = perm._id;
      console.log(`✓ Permission: ${name}`);
    }

    // Define roles with their permissions
    const roleDefinitions = {
      Administrator: {
        description: 'Administrator - Can do anything',
        permissions: Object.values(permissions) // All permissions
      },
      Manager: {
        description: 'Manager - Can view bugs and set priority',
        permissions: [permissions['bug:read'], permissions['bug:update']]
      },
      Developer: {
        description: 'Developer - Can see and resolve assigned bugs',
        permissions: [permissions['bug:read'], permissions['bug:resolve']]
      },
      QA: {
        description: 'QA - Can perform all bug-related actions',
        permissions: [
          permissions['bug:read'],
          permissions['bug:create'],
          permissions['bug:update'],
          permissions['bug:resolve'],
          permissions['bug:verify']
        ]
      }
    };

    console.log('\nCreating roles and mapping permissions...');
    for (const [roleName, roleConfig] of Object.entries(roleDefinitions)) {
      let role = await Role.findOne({ name: roleName });
      if (!role) {
        role = await Role.create({
          name: roleName,
          description: roleConfig.description,
          isSystemRole: true
        });
      }
      console.log(`✓ Role: ${roleName}`);

      // Map permissions to role
      for (const permissionId of roleConfig.permissions) {
        const exists = await RolePermission.findOne({ role: role._id, permission: permissionId });
        if (!exists) {
          await RolePermission.create({ role: role._id, permission: permissionId });
        }
      }
      console.log(`  └─ Mapped ${roleConfig.permissions.length} permissions`);
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\nRole Permissions Summary:');
    console.log('- Administrator: All permissions');
    console.log('- Manager: bug:read, bug:update');
    console.log('- Developer: bug:read, bug:resolve');
    console.log('- QA: bug:read, bug:create, bug:update, bug:resolve, bug:verify');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

seedDatabase();
