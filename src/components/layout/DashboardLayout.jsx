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

const Wrapper = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background || '#f7f5f0'};
  font-family: 'DM Sans', sans-serif;
  display: flex;
  flex-direction: column;
`;

const Main = styled.main`
  margin-top: ${HEADER_HEIGHT}px;
  margin-left: ${({ $sidebarOpen }) => ($sidebarOpen ? `${SIDEBAR_WIDTH}px` : '0')};
  transition: margin-left 0.25s ease;
  flex: 1;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.background || '#f7f5f0'};
  min-height: calc(100vh - ${HEADER_HEIGHT}px);
`;
export default function DashboardLayout() {
  const [queueDrawerOpen, setQueueDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen]         = useState(true);
  const [headerHidden, setHeaderHidden]       = useState(false);
  const lastScrollY                           = useRef(0);
  const { pendingCount, isOnline } = useOfflineQueue();

  useEffect(() => {
    const handleWindowScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 64) {
        setHeaderHidden(true);
      } else if (currentScrollY < lastScrollY.current) {
        setHeaderHidden(false);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, []);

  const handleMainScroll = (e) => {
    const currentScrollY = e.target.scrollTop;
    if (currentScrollY > lastScrollY.current && currentScrollY > 64) {
      setHeaderHidden(true);
    } else if (currentScrollY < lastScrollY.current) {
      setHeaderHidden(false);
    }
    lastScrollY.current = currentScrollY;
  };

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
          hidden={headerHidden}
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
            onScroll={handleMainScroll}
          >
            <Outlet />
          </main>
        </div>

        <Footer />
      </div>
    </>
  );
}