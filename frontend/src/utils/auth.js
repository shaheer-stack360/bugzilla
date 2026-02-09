// Check if user is authenticated (cookie exists)
export const isAuthenticated = () => {
  return document.cookie.includes('token=');
};

// Store user data in session storage
export const setUser = (user) => {
  sessionStorage.setItem('user', JSON.stringify(user));
};

export const getUser = () => {
  const user = sessionStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const clearUser = () => {
  sessionStorage.removeItem('user');
};

// Role helpers
export const isAdmin = () => getUser()?.role === 'Administrator';
export const isQA = () => getUser()?.role === 'QA';
export const isDeveloper = () => getUser()?.role === 'Developer';
export const isManager = () => getUser()?.role === 'Manager';