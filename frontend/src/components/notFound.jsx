// components/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h2>404 - Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/">
        <button style={{ padding: '10px 20px', marginTop: '20px' }}>
          Go to Homepage
        </button>
      </Link>
    </div>
  );
}