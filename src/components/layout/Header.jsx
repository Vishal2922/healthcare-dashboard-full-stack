import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import {
  HeartFilled,
  MenuOutlined,
  BellOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import useAuth from '../../modules/auth/hooks/useAuth';

const HEADER_HEIGHT = 64;

const Bar = styled.header`
  position: fixed;
  top: 0; left: 0; right: 0;
  height: ${HEADER_HEIGHT}px;
  background: #0e1b2a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 200;
  box-shadow: 0 1px 0 rgba(255,255,255,0.06);
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
  background: #20b486;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 16px;
`;

const BrandName = styled.span`
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  font-size: 17px;
  color: rgba(255,255,255,0.9);
  letter-spacing: 0.01em;
`;

const MenuBtn = styled.button`
  background: none; border: none;
  color: rgba(255,255,255,0.55);
  font-size: 18px; cursor: pointer;
  padding: 6px 8px; border-radius: 6px;
  margin-right: 8px;
  transition: color 0.15s, background 0.15s;
  &:hover { color: #fff; background: rgba(255,255,255,0.07); }
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
  color: rgba(255,255,255,0.55);
  font-size: 18px; cursor: pointer;
  padding: 6px 8px; border-radius: 6px;
  transition: color 0.15s, background 0.15s;
  &:hover { color: #fff; background: rgba(255,255,255,0.07); }
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
  background: #20b486;
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
  color: rgba(255,255,255,0.9);
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

export default function Header({ onMenuToggle, unreadCount = 0 }) {
  const { user, logout } = useAuth();

  return (
    <Bar>
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
        <BellWrap>
          <BellBtn title="Notifications">
            <BellOutlined />
          </BellBtn>
          {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
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