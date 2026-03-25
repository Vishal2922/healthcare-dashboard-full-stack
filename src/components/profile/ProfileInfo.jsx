import React from 'react';
import styled from 'styled-components';
import { UserOutlined, MailOutlined, SafetyCertificateOutlined, SafetyCertificateFilled } from '@ant-design/icons';
import useAuth from '../../modules/auth/hooks/useAuth';

const Card = styled.div`
  background: ${({ theme }) => theme?.colors?.surface || '#fff'};
  border: 1px solid ${({ theme }) => theme?.colors?.border || '#e2e8f0'};
  border-radius: 12px;
  padding: 24px;
`;

const Title = styled.h3`
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme?.colors?.text || '#1a202c'};
`;

const Subtitle = styled.p`
  margin: 0 0 24px 0;
  font-size: 13px;
  color: ${({ theme }) => theme?.colors?.textSecondary || '#718096'};
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid ${({ theme }) => theme?.colors?.border || '#f0f0f0'};
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const IconWrapper = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${({ theme }) => theme?.colors?.background || '#f7fafc'};
  color: ${({ theme }) => theme?.colors?.primary || '#3182ce'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
`;

const InfoText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.span`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: ${({ theme }) => theme?.colors?.textSecondary || '#a0aec0'};
`;

const Value = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme?.colors?.text || '#2d3748'};
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  background: ${({ $isAdmin, theme }) => $isAdmin ? (theme?.colors?.danger ? `${theme.colors.danger}15` : '#fee2e2') : (theme?.colors?.primary ? `${theme.colors.primary}15` : '#e0e7ff')};
  color: ${({ $isAdmin, theme }) => $isAdmin ? (theme?.colors?.danger || '#dc2626') : (theme?.colors?.primary || '#4f46e5')};
`;

export default function ProfileInfo() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Card>
      <Title>Profile Information</Title>
      <Subtitle>Your personal account details</Subtitle>

      <InfoRow>
        <IconWrapper><UserOutlined /></IconWrapper>
        <InfoText>
          <Label>Username</Label>
          <Value>{user.username || '—'}</Value>
        </InfoText>
      </InfoRow>

      <InfoRow>
        <IconWrapper><MailOutlined /></IconWrapper>
        <InfoText>
          <Label>Email Address</Label>
          <Value>{user.email || '—'}</Value>
        </InfoText>
      </InfoRow>

      <InfoRow>
        <IconWrapper><SafetyCertificateOutlined /></IconWrapper>
        <InfoText>
          <Label>Role</Label>
          <Value>
            <Badge $isAdmin={user.role === 'admin' || user.role === 'superadmin'}>
              {user.role === 'admin' || user.role === 'superadmin' ? <SafetyCertificateFilled style={{ fontSize: 12 }}/> : null}
              {user.role}
            </Badge>
          </Value>
        </InfoText>
      </InfoRow>
    </Card>
  );
}
