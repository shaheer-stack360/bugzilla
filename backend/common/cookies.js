const setAuthCookies = (res, token, userData) => {
  res.cookie('token', token, {
    httpOnly: false,
    secure: false,
    sameSite: 'lax',
    maxAge: 5 * 60 * 60 * 1000,
    path: '/'
  });
};

// Helper function to clear cookies
const clearAuthCookies = (res) => {
  res.clearCookie('token', { 
    path: '/',
    secure: false, // Must match original cookie settings
    sameSite: 'lax'
  });
  res.clearCookie('user', { 
    path: '/',
    secure: false,
    sameSite: 'lax'
  });
};

export { setAuthCookies, clearAuthCookies };
