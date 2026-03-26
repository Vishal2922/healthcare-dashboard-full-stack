import { NavLink } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import {
  DashboardOutlined,
  TeamOutlined,
  CalendarOutlined,
  ScheduleOutlined,
  DollarOutlined,
  MedicineBoxOutlined,
  UserOutlined,
  FileTextOutlined,
  BgColorsOutlined,
  IdcardOutlined,
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
  PATIENT:      'Patient',
};

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    Icon: DashboardOutlined,
    roles: [ROLES.ADMIN, ROLES.PROVIDER, ROLES.PHARMACIST, ROLES.NURSE, ROLES.RECEPTIONIST, ROLES.PATIENT],
  },
  {
    to: '/patients',
    label: 'Patients',
    Icon: TeamOutlined,
    roles: [ROLES.ADMIN, ROLES.PROVIDER, ROLES.NURSE, ROLES.RECEPTIONIST],
  },
  {
    to: '/appointments',
    label: 'Appointments',
    Icon: ScheduleOutlined,
    roles: [ROLES.ADMIN, ROLES.PROVIDER, ROLES.NURSE, ROLES.PATIENT],
  },
  {
    to: '/appointments/calendar',
    label: 'Calendar',
    Icon: CalendarOutlined,
    roles: [ROLES.ADMIN, ROLES.PROVIDER, ROLES.RECEPTIONIST],
  },
  {
    to: '/prescriptions',
    label: 'Prescriptions',
    Icon: FileTextOutlined,
    roles: [ROLES.ADMIN, ROLES.PROVIDER, ROLES.PHARMACIST],
  },
  {
    to: '/billing',
    label: 'Billing',
    Icon: DollarOutlined,
    roles: [ROLES.RECEPTIONIST, ROLES.PATIENT],
  },
  {
    to: '/settings/profile',
    label: 'My Profile',
    Icon: IdcardOutlined,
    roles: [ROLES.ADMIN, ROLES.PROVIDER, ROLES.PHARMACIST, ROLES.NURSE, ROLES.RECEPTIONIST, ROLES.PATIENT],
  },
  {
    to: '/settings/staff',
    label: 'Staff',
    Icon: MedicineBoxOutlined,
    roles: [ROLES.ADMIN],
  },
  {
    to: '/settings/users',
    label: 'Users',
    Icon: UserOutlined,
    roles: [ROLES.ADMIN],
  },
  {
    to: '/settings/theme',
    label: 'Brand Color',
    Icon: BgColorsOutlined,
    roles: [ROLES.ADMIN],
  },
];

const SETTINGS_PATHS = ['/settings/profile', '/settings/users', '/settings/staff', '/settings/theme'];

// ─── Styled Components ────────────────────────────────────────────────────────
const Nav = styled.aside`
  position: fixed;
  top: ${HEADER_HEIGHT}px;
  left: 0;
  width: ${({ $open }) => ($open ? `${SIDEBAR_WIDTH}px` : '0')};
  height: calc(100vh - ${HEADER_HEIGHT}px);
  background: ${({ theme }) => theme.colors.sidebarBg || '#fff'};
  border-right: 1px solid ${({ theme }) => theme.colors.sidebarBorder || theme.colors.border};
  overflow-y: auto;
  overflow-x: hidden;
  transition: width 0.25s ease, background 0.25s ease;
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
  color: ${({ theme }) => theme.colors.textSecondary || '#a0aab4'};
  padding: 16px 20px 6px;
  white-space: nowrap;
  opacity: 0.7;
`;

export default function Sidebar({ isOpen }) {
  const { user } = useAuth();
  const role = user?.role;
  const theme = useTheme();

  const visible       = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
  const mainItems     = visible.filter((i) => !SETTINGS_PATHS.includes(i.to));
  const settingsItems = visible.filter((i) => SETTINGS_PATHS.includes(i.to));

  const navLinkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 20px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: isActive ? 600 : 400,
    color: isActive
      ? (theme.colors.sidebarTextActive || '#0e1b2a')
      : (theme.colors.sidebarText || '#718096'),
    background: isActive
      ? (theme.colors.sidebarActiveBg || '#f0fdf9')
      : 'transparent',
    borderLeft: isActive
      ? `3px solid ${theme.colors.primary}`
      : '3px solid transparent',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s',
  });

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