import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';  
import { setAuthCookies, clearAuthCookies } from '../common/cookies.js';
import encrypt_pass from '../common/pass_encryption.js';
import User from '../models/users.model.js';
import Role from '../models/roles.model.js';
import Permission from '../models/permission.model.js';
import RolePermission from '../models/rolePermission.model.js';
import authenticateJWT from '../middleware/authenticateJWT.js';

dotenv.config();

export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    console.log('Registration data:', { name, email, role });

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: 'All fields are required: name, email, password, role'
      });
    }

    const allowedRoles = ['Developer', 'QA', 'Manager'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: 'Invalid role. Choose from: Developer, QA, Manager'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email'
      });
    }

    const selectedRole = await Role.findOne({ name: role });

    const passwordHash = await encrypt_pass(password);
    console.log('✅ Password hashed successfully');

    const user = await User.create({ name, email: email.toLowerCase().trim(), passwordHash, role: selectedRole._id });

    const rolePermissions = await RolePermission.find({ role: selectedRole._id }).populate('permission');

    const permissions = rolePermissions.map(rp => rp.permission?.name).filter(name => name);

    const payload = { sub: user._id.toString(), role: selectedRole.name, permissions };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });

    // Prepare user data for cookie
    const userData = { id: user._id, name: user.name, email: user.email, role: selectedRole.name, permissions };

    setAuthCookies(res, token, userData);

    res.status(201).json({
      message: 'Registration successful!',
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
  }
}

export async function login(req, res) {

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate('role');

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      console.log('❌ Password invalid');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('✅ Password correct!');

    console.log('🔍 Checking RolePermission aggregation...');

    // SIMPLER: Use aggregation to get permission names directly
    const permissionsData = await RolePermission.aggregate([
      { $match: { role: user.role._id } },
      {
        $lookup: {
          from: 'permissions',
          localField: 'permission',
          foreignField: '_id',
          as: 'permissionDoc'
        }
      },
      { $unwind: '$permissionDoc' },
      { $project: { permissionName: '$permissionDoc.name' } }
    ]);

    console.log(`📋 Aggregation result count: ${permissionsData.length}`);
    console.log('📋 Aggregation result:', JSON.stringify(permissionsData, null, 2));

    // ALSO try a direct query to see what's in role_permissions
    const directQuery = await RolePermission.find({ role: user.role._id });
    console.log(`📋 Direct RolePermission query count: ${directQuery.length}`);
    console.log('📋 Direct RolePermission data:', JSON.stringify(directQuery, null, 2));

    // After the direct query, add:
    console.log('🔍 Checking if permission IDs exist in database...');

    // Get all permission IDs from role_permissions
    const permissionIds = directQuery.map(rp => rp.permission);
    console.log('Permission IDs to check:', permissionIds);

    // Check if these exist in permissions collection
    const existingPermissions = await Permission.find({
      _id: { $in: permissionIds }
    });
    console.log(`Found ${existingPermissions.length} matching permissions:`);
    existingPermissions.forEach(p => {
      console.log(`  - ${p._id}: ${p.name}`);
    });

    // Also check ALL permissions in database
    const allPermissions = await Permission.find({});
    console.log(`\n📋 ALL permissions in database (${allPermissions.length}):`);
    allPermissions.forEach(p => {
      console.log(`  - ${p._id}: ${p.name}`);
    });

    // Extract just the permission names
    const permissions = permissionsData.map(p => p.permissionName);

    console.log(`🔑 Extracted Permissions for ${user.role?.name}:`, permissions);

    const payload = {
      sub: user._id.toString(),
      role: user.role?.name,
      permissions
    };

    console.log('📦 JWT payload:', payload);

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' }
    );

    // Prepare user data for cookie
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role?.name,
      permissions
    };

    // Set cookies instead of sending in response body
    setAuthCookies(res, token, userData);

    console.log('🎉 Login successful! Cookies set.');

    // Send success response
    res.json({
      message: 'Login successful!',
      user: userData
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
}

// Add logout function
export async function logout(req, res) {
  try {
    clearAuthCookies(res);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: error.message
    });
  }
}

// Add verify endpoint to check if user is logged in
export async function verify(req, res) {
  try {
    // The token is automatically sent via cookies
    // We just need to return the user data if authenticated
    if (req.user) {
      res.json({
        authenticated: true,
        user: req.user
      });
    } else {
      res.status(401).json({
        authenticated: false,
        message: 'Not authenticated'
      });
    }
  } catch (error) {
    console.error('❌ Verify error:', error);
    res.status(500).json({
      error: 'Verification failed',
      message: error.message
    });
  }
}