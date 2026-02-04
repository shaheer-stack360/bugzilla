import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/users.model.js';
import Role from '../models/roles.model.js';
import Permission from '../models/permission.model.js';
import RolePermission from '../models/rolePermission.model.js';

dotenv.config();

export async function register(req, res) {
  console.log('\n📝 ========== REGISTRATION ATTEMPT ==========');
  
  try {
    const { name, email, password, role } = req.body;
    
    console.log('Registration data:', { name, email, role });
    
    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        message: 'All fields are required: name, email, password, role' 
      });
    }

    const allowedRoles = ['Developer', 'QA Tester', 'Project Manager'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role. Choose from: Developer, QA Tester, Project Manager' 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this email' 
      });
    }

    const selectedRole = await Role.findOne({ name: role });
    
    if (!selectedRole) {
      return res.status(400).json({ 
        message: `Role '${role}' not found in system` 
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    console.log('✅ Password hashed successfully');

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      role: selectedRole._id
    });

    console.log(`✅ User created: ${user.email} with role: ${selectedRole.name}`);

    const rolePermissions = await RolePermission.find({ 
      role: selectedRole._id 
    }).populate('permission');

    console.log(`📋 Found ${rolePermissions.length} role-permission mappings`);
    
    const permissions = rolePermissions
      .map(rp => rp.permission?.name)
      .filter(name => name);

    console.log(`🔑 Permissions for ${selectedRole.name}:`, permissions);

    const payload = { 
      sub: user._id.toString(),
      role: selectedRole.name,
      permissions
    };
    
    console.log('📦 JWT payload:', payload);
    
    const token = jwt.sign(
      payload, 
      process.env.JWT_SECRET, 
      { expiresIn: '5h' }
    );

    res.status(201).json({ 
      message: 'Registration successful!',
      token,
      user: { 
        id: user._id,
        name: user.name,
        email: user.email,
        role: selectedRole.name,
        permissions 
      } 
    });
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      message: error.message 
    });
  }
}

export async function login(req, res) {
  console.log('\n🔐 ========== LOGIN ATTEMPT ==========');
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    }).populate('role');
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log(`✅ User found: ${user.email}`);
    console.log(`   Role: ${user.role?.name}`);

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      console.log('❌ Password invalid');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('✅ Password correct!');

    const rolePermissions = await RolePermission.find({ 
      role: user.role._id 
    }).populate('permission');

    console.log(`📋 Found ${rolePermissions.length} role-permission mappings`);
    
    const permissions = rolePermissions
      .map(rp => rp.permission?.name)
      .filter(name => name);
    
    console.log(`🔑 Permissions for ${user.role?.name}:`, permissions);

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

    console.log('🎉 Login successful!');
    
    res.json({ 
      token, 
      user: { 
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role?.name,
        permissions 
      } 
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      message: error.message 
    });
  }
}


export default function authenticateJWT() {
  return (req, res, next) => {
    const auth = req.headers.authorization;
    
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing token' });
    }

    const token = auth.split(' ')[1];
    
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
      
      console.log('🔐 JWT decoded:', {
        sub: payload.sub,
        role: payload.role,
        permissions: payload.permissions
      });
      
      req.user = { 
        id: payload.sub,
        role: payload.role,
        permissions: payload.permissions || [] 
      };
      
      next();
    } catch (err) {
      console.error('JWT verification error:', err);
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}