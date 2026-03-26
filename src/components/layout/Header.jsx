import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import {
  HeartFilled,
  MenuOutlined,
  BellOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import useAuth from '../../modules/auth/hooks/useAuth';
import useNotification from '../../modules/notifications/hooks/useNotification';
import NotificationDropdown from '../notifications/NotificationDropdown';
import { useAppTheme } from '../../context/ThemeContext';

const HEADER_HEIGHT = 64;

const Bar = styled.header`
  position: fixed;
  top: 0; left: 0; right: 0;
  height: ${HEADER_HEIGHT}px;
  background: ${({ theme }) => theme.colors.headerBg || '#0e1b2a'};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 200;
  box-shadow: 0 1px 0 rgba(255,255,255,0.06);
  transition: background 0.25s ease;
  transform: translateY(${({ $hidden }) => ($hidden ? '-100%' : '0')});
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;

const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
`;

const BrandIcon = styled.div`
  width: 32px; height: 32px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.primary};
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 16px;
`;

const BrandName = styled.span`
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  font-size: 17px;
  color: ${({ theme }) => theme.colors.headerText || 'rgba(255,255,255,0.9)'};
  letter-spacing: 0.01em;
`;

const MenuBtn = styled.button`
  background: none; border: none;
  color: ${({ theme }) => theme.colors.headerTextMuted || 'rgba(255,255,255,0.55)'};
  font-size: 18px; cursor: pointer;
  padding: 6px 8px; border-radius: 6px;
  margin-right: 8px;
  transition: color 0.15s, background 0.15s;
  &:hover { color: ${({ theme }) => theme.colors.headerText || '#fff'}; background: rgba(255,255,255,0.07); }
`;

const Right = styled.div`
  display: flex; align-items: center; gap: 8px;
`;

const BellWrap = styled.div`
  position: relative;
  display: flex; align-items: center;
`;

const BellBtn = styled.button`
  background: none; border: none;
  color: ${({ $active, theme }) => ($active ? (theme.colors.headerText || '#fff') : (theme.colors.headerTextMuted || 'rgba(255,255,255,0.55)'))};
  font-size: 18px; cursor: pointer;
  padding: 6px 8px; border-radius: 6px;
  transition: color 0.15s, background 0.15s;
  &:hover { color: ${({ theme }) => theme.colors.headerText || '#fff'}; background: rgba(255,255,255,0.07); }
`;

const Badge = styled.span`
  position: absolute; top: 2px; right: 2px;
  background: #e53e3e; color: #fff;
  border-radius: 10px; font-size: 9px;
  font-weight: 700; padding: 1px 4px;
  min-width: 14px; text-align: center;
  pointer-events: none;
`;

const Divider = styled.div`
  width: 1px; height: 24px;
  background: rgba(255,255,255,0.1);
  margin: 0 4px;
`;

const UserBtn = styled.button`
  background: none; border: none;
  display: flex; align-items: center; gap: 8px;
  cursor: pointer; padding: 4px 8px; border-radius: 8px;
  transition: background 0.15s;
  &:hover { background: rgba(255,255,255,0.07); }
`;

const Avatar = styled.div`
  width: 32px; height: 32px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff; font-size: 13px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
`;

const UserInfo = styled.div`
  text-align: left; line-height: 1.3;
`;

const UserName = styled.div`
  font-family: 'DM Sans', sans-serif;
  font-size: 13px; font-weight: 600;
  color: ${({ theme }) => theme.colors.headerText || 'rgba(255,255,255,0.9)'};
`;

const UserRole = styled.div`
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  color: rgba(255,255,255,0.35);
`;

const LogoutBtn = styled.button`
  background: none; border: none;
  color: rgba(255,255,255,0.4);
  font-size: 16px; cursor: pointer;
  padding: 6px 8px; border-radius: 6px;
  transition: color 0.15s, background 0.15s;
  display: flex; align-items: center;
  &:hover { color: #fc8181; background: rgba(252,129,129,0.1); }
`;

/* ─── Theme Toggle ──────────────────────────────────────── */
const ThemeToggleWrap = styled.div`
  position: relative;
  display: flex; align-items: center;
`;

const ThemeBtn = styled.button`
  background: none; border: none;
  color: ${({ theme }) => theme.colors.headerTextMuted || 'rgba(255,255,255,0.55)'};
  font-size: 17px; cursor: pointer;
  padding: 6px 8px; border-radius: 6px;
  transition: color 0.15s, background 0.15s;
  display: flex; align-items: center;
  &:hover { color: ${({ theme }) => theme.colors.headerText || '#fff'}; background: rgba(255,255,255,0.07); }
`;

const ThemeDropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  min-width: 170px;
  padding: 6px;
  z-index: 300;
  animation: fadeInTheme 0.15s ease;

  @keyframes fadeInTheme {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

const ThemeOption = styled.button`
  display: flex; align-items: center; gap: 10px;
  width: 100%;
  background: ${({ $active, theme }) => $active ? (theme.colors.sidebarActiveBg || '#f0fdf9') : 'none'};
  border: none;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: ${({ $active }) => $active ? 600 : 400};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.text};
  transition: background 0.12s;

  &:hover {
    background: ${({ theme }) => theme.colors.sidebarActiveBg || '#f0fdf9'};
  }
`;

const ThemeIcon = styled.span`
  font-size: 16px;
  display: flex; align-items: center;
`;

const THEME_OPTIONS = [
  { key: 'light', label: 'Light',  icon: '☀️' },
  { key: 'warm',  label: 'Warm',   icon: '🌤️' },
  { key: 'dark',  label: 'Dark',   icon: '🌙' },
];

const themeIconMap = {
  light: '☀️',
  warm: '🌤️',
  dark: '🌙'
};

function getThemeIcon(mode) {
  return themeIconMap[mode] || '🌤️';
}

export default function Header({ onMenuToggle, hidden }) {
  const { user, logout } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    markAllLoading,
    markRead,
    markAllRead,
    deleteNotification,
    isMarking,
    isDeleting,
  } = useNotification();

  const { themeMode, changeThemeMode } = useAppTheme();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  const themeRef = useRef(null);

  const toggleDropdown = useCallback(() => setDropdownOpen((o) => !o), []);
  const closeDropdown  = useCallback(() => setDropdownOpen(false), []);

  // Close theme dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleThemeSelect = useCallback((mode) => {
    changeThemeMode(mode);
    setThemeOpen(false);
  }, [changeThemeMode]);

  return (
    <Bar $hidden={hidden}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <MenuBtn onClick={onMenuToggle} title="Toggle sidebar">
          <MenuOutlined />
        </MenuBtn>
        <Brand to="/dashboard">
          <BrandIcon><HeartFilled /></BrandIcon>
          <BrandName>ClinicOS</BrandName>
        </Brand>
      </div>

      <Right>
        {/* Theme Toggle */}
        <ThemeToggleWrap ref={themeRef}>
          <ThemeBtn
            onClick={() => setThemeOpen(o => !o)}
            title="Change theme"
            id="theme-toggle"
          >
            {getThemeIcon(themeMode)}
          </ThemeBtn>
          {themeOpen && (
            <ThemeDropdown>
              {THEME_OPTIONS.map(opt => (
                <ThemeOption
                  key={opt.key}
                  $active={themeMode === opt.key}
                  onClick={() => handleThemeSelect(opt.key)}
                >
                  <ThemeIcon>{opt.icon}</ThemeIcon>
                  {opt.label}
                </ThemeOption>
              ))}
            </ThemeDropdown>
          )}
        </ThemeToggleWrap>

        {/* Notifications */}
        <BellWrap>
          <BellBtn
            $active={dropdownOpen}
            onClick={toggleDropdown}
            title="Notifications"
            id="notification-bell"
          >
            <BellOutlined />
          </BellBtn>
          {unreadCount > 0 && <Badge>{unreadCount > 99 ? '99+' : unreadCount}</Badge>}

          {dropdownOpen && (
            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              loading={loading}
              markAllLoading={markAllLoading}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
              onDelete={deleteNotification}
              onClose={closeDropdown}
              isMarking={isMarking}
              isDeleting={isDeleting}
              isAdmin={user?.role?.toLowerCase() === 'admin'}
            />
          )}
        </BellWrap>

        <Divider />

        <UserBtn>
          <Avatar>
            {user?.username?.charAt(0)?.toUpperCase() || <UserOutlined />}
          </Avatar>
          <UserInfo>
            <UserName>{user?.username || 'User'}</UserName>
            <UserRole>{user?.role || ''}</UserRole>
          </UserInfo>
        </UserBtn>

        <LogoutBtn onClick={logout} title="Logout">
          <LogoutOutlined />
        </LogoutBtn>
      </Right>
    </Bar>
  );
}