// Home.jsx
import React from "react";

export default function Home() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px', padding: '20px' }}>
      <h1>Welcome to Bugzilla Replica</h1>
      <h3>Your Bug Tracking Solution</h3>
      
      <div style={{ maxWidth: '600px', margin: '30px auto', textAlign: 'left', padding: '20px', background: '#f8f9fa', color: "black", borderRadius: '5px' }}>
        <h4>Features:</h4>
        <ul style={{ textAlign: 'left', display: 'inline-block' }}>
          <li>Role-based access control (Administrator, Manager, Developer, QA)</li>
          <li>Report, track, and resolve bugs</li>
          <li>Assign bugs to developers</li>
          <li>Verify fixes with QA</li>
          <li>Priority-based bug management</li>
        </ul>
      </div>

      <div style={{ marginTop: '30px' }}>
        <a href="/login">
          <button style={{ 
            padding: '12px 30px', 
            background: '#007bff', 
            color: 'white', 
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            marginRight: '15px'
          }}>
            Login
          </button>
        </a>
        <a href="/register">
          <button style={{ 
            padding: '12px 30px', 
            background: '#28a745', 
            color: 'white', 
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px'
          }}>
            Register
          </button>
        </a>
      </div>
    </div>
  );
}