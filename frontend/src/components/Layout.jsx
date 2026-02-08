import Navigation from './Navigation';
import './Layout.css';

export default function Layout({ children }) {
  return (
    <div className="layout">
      <Navigation />
      <main className="layout-main">
        {children}
      </main>
      <footer className="layout-footer">
        <p>&copy; 2026 Bugzilla Clone. All rights reserved.</p>
      </footer>
    </div>
  );
}
