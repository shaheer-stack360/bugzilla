export default function checkPermission(requiredPermission) {
  return (req, res, next) => {
    console.log('🔐 Checking permission:', {
      required: requiredPermission,
      userPermissions: req.user?.permissions,
      userId: req.user?.id,
      userRole: req.user?.role
    });
    
    if (!req.user) {
      console.log('❌ No user found in request');
      return res.status(401).json({ 
        success: false,
        message: 'Not authenticated' 
      });
    }

    const userPermissions = req.user.permissions || [];
    
    // Check if user has the required permission
    const hasPermission = userPermissions.includes(requiredPermission);
    
    if (hasPermission) {
      console.log(`✅ User has permission: ${requiredPermission}`);
      next();
    } else {
      console.log(`❌ User lacks permission: ${requiredPermission}`);
      console.log(`   Available permissions: ${userPermissions.join(', ')}`);
      return res.status(403).json({ 
        success: false,
        message: 'Insufficient permissions',
        requiredPermission,
        availablePermissions: userPermissions
      });
    }
  };
}