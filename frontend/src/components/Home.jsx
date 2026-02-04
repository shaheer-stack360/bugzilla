import React from "react";

export default function Home() {
  return (
    <div>
      <h1>Welcome to Bugzilla Replica</h1>
      <h3>Your Bug Tracking Solution</h3>
      <p>Please log in to access your bug tracking dashboard.</p>
      <a href="/login">
        <button>Go to Login</button>
      </a>
    </div>
  );
}