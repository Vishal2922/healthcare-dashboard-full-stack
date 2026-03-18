import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import {
  DashboardOutlined,
  TeamOutlined,
  CalendarOutlined,
  ScheduleOutlined,
  DollarOutlined,
  MedicineBoxOutlined,
  UserOutlined,
  LockOutlined,
} from '@ant-design/icons';
import useAuth from '../../modules/auth/hooks/useAuth';

const SIDEBAR_WIDTH = 240;
const HEADER_HEIGHT = 64;

const ROLES = {
  ADMIN:        'Admin',
  PROVIDER:     'Provider',
  NURSE:        'Nurse',
  RECEPTIONIST: 'Receptionist',
  PHARMACIST:   'Pharmacist',
};

const NAV_ITEMS = [
  { to: '/dashboard',             label: 'Dashboard',    Icon: DashboardOutlined,   roles: [ROLES.ADMIN, ROLES.PROVIDER, ROLES.PHARMACIST] },
  { to: '/patients',              label: 'Patients',     Icon: TeamOutlined,        roles: [ROLES.ADMIN, ROLES.PROVIDER, ROLES.NURSE, ROLES.RECEPTIONIST] },
  { to: '/appointments',          label: 'Appointments', Icon: ScheduleOutlined,    roles: [ROLES.ADMIN, ROLES.PROVIDER, ROLES.NURSE, ROLES.RECEPTIONIST] },
  { to: '/appointments/calendar', label: 'Calendar',     Icon: CalendarOutlined,    roles: [ROLES.ADMIN, ROLES.PROVIDER, ROLES.NURSE, ROLES.RECEPTIONIST] },
  { to: '/billing',               label: 'Billing',      Icon: DollarOutlined,      roles: [ROLES.ADMIN, ROLES.PROVIDER] },
  { to: '/staff',                 label: 'Staff',        Icon: MedicineBoxOutlined, roles: [ROLES.ADMIN] },
  { to: '/settings/users',        label: 'Users',        Icon: UserOutlined,        roles: [ROLES.ADMIN] },
  { to: '/settings/security',     label: 'Security',     Icon: LockOutlined,        roles: [ROLES.ADMIN] },
];

const Nav = styled.aside`
  position: fixed;
  top: ${HEADER_HEIGHT}px;
  left: 0;
  width: ${({ $open }) => ($open ? `${SIDEBAR_WIDTH}px` : '0')};
  height: calc(100vh - ${HEADER_HEIGHT}px);
  background: #fff;
  border-right: 1px solid #edf2f7;
  overflow-y: auto;
  overflow-x: hidden;
  transition: width 0.25s ease;
  z-index: 100;
`;

const NavList = styled.nav`
  padding: ${({ $open }) => ($open ? '16px 0' : '0')};
  min-width: ${SIDEBAR_WIDTH}px;
`;

const SectionLabel = styled.div`
  font-family: 'DM Sans', sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #a0aab4;
  padding: 16px 20px 6px;
  white-space: nowrap;
`;

const navLinkStyle = ({ isActive }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 20px',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 14,
  fontWeight: isActive ? 600 : 400,
  color: isActive ? '#0e1b2a' : '#718096',
  background: isActive ? '#f0fdf9' : 'transparent',
  borderLeft: isActive ? '3px solid #20b486' : '3px solid transparent',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  transition: 'all 0.15s',
});

export default function Sidebar({ isOpen }) {
  const { user } = useAuth();
  const role = user?.role;

  const visible = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
  const mainItems = visible.filter((i) => !['/settings/users', '/settings/security'].includes(i.to));
  const settingsItems = visible.filter((i) => ['/settings/users', '/settings/security'].includes(i.to));

  return (
    <Nav $open={isOpen}>
      <NavList $open={isOpen}>
        {mainItems.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} style={navLinkStyle}>
            <Icon style={{ fontSize: 16 }} />
            {label}
          </NavLink>
        ))}

        {settingsItems.length > 0 && (
          <>
            <SectionLabel>Settings</SectionLabel>
            {settingsItems.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} style={navLinkStyle}>
                <Icon style={{ fontSize: 16 }} />
                {label}
              </NavLink>
            ))}
          </>
        )}
      </NavList>
    </Nav>
  );
}