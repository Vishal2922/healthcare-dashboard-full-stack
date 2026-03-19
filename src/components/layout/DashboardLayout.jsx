import { useState } from 'react';
import styled from 'styled-components';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const SIDEBAR_WIDTH = 240;
const HEADER_HEIGHT = 64;

const Wrapper = styled.div`
  min-height: 100vh;
  background: #f7f5f0;
  font-family: 'DM Sans', sans-serif;
`;

const Main = styled.main`
  margin-top: ${HEADER_HEIGHT}px;
  margin-left: ${({ $sidebarOpen }) => ($sidebarOpen ? `${SIDEBAR_WIDTH}px` : '0')};
  transition: margin-left 0.25s ease;
  min-height: calc(100vh - ${HEADER_HEIGHT}px);
  display: flex;
  flex-direction: column;
`;

const Content = styled.div`
  flex: 1;
  padding: 32px;
`;

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Wrapper>
      <Header
        onMenuToggle={() => setSidebarOpen((o) => !o)}
        unreadCount={0}
      />
      <Sidebar isOpen={sidebarOpen} />
      <Main $sidebarOpen={sidebarOpen}>
        <Content>{children}</Content>
        <Footer />
      </Main>
    </Wrapper>
  );
}