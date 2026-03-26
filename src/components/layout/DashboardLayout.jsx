/**
 * DashboardLayout.jsx  (UPDATED — integrates OfflineBanner)
 * ─────────────────────────────────────────────────────────────────────────────
 * Changes from original:
 *   • OfflineBanner added above the main layout
 *   • paddingTop added to main content area to account for the banner height
 *     when it is visible (banner is position:fixed, 42px tall)
 *   • OfflineQueueDrawer wired to queue count badge in Header via state
 */

import { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Header   from './Header';
import Sidebar  from './Sidebar';
import Footer   from './Footer';
import OfflineBanner     from '../OfflineBanner';
import OfflineQueueDrawer from '../OfflineQueueDrawer';
import useOfflineQueue from '../../hooks/useOfflineQueue';


export default function DashboardLayout() {
  const [queueDrawerOpen, setQueueDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen]         = useState(true);
  const { pendingCount, isOnline } = useOfflineQueue();


  return (
    <>
      {/* ── Fixed top banner (offline / syncing status) ──────────────────── */}
      <OfflineBanner />

      {/* ── Slide-in queue detail drawer ─────────────────────────────────── */}
      <OfflineQueueDrawer
        open={queueDrawerOpen}
        onClose={() => setQueueDrawerOpen(false)}
      />

      {/*
        Outer wrapper — adds top padding equal to the banner height so
        the fixed banner never covers page content.
        The banner is 42px tall; only show padding when offline or there
        are pending items (i.e. when banner is actually visible).
      */}
      <div style={{
        display:       'flex',
        flexDirection: 'column',
        minHeight:     '100vh',
        paddingTop:    (!isOnline || pendingCount > 0) ? '42px' : '0',
        transition:    'padding-top 0.25s',
      }}>
        <Header
          onQueueBadgeClick={() => setQueueDrawerOpen(true)}
          pendingCount={pendingCount}
          onMenuToggle={() => setSidebarOpen(p => !p)}
        />

        <div style={{ display: 'flex', flex: 1 }}>
          <Sidebar isOpen={sidebarOpen} />
          <main 
            style={{ 
              flex: 1, 
              overflow: 'auto', 
              padding: '24px',
              marginTop: '64px',
              marginLeft: sidebarOpen ? '240px' : '0',
              transition: 'margin-left 0.25s ease'
            }}
          >
            <Outlet />
          </main>
        </div>

        <Footer />
      </div>
    </>
  );
}