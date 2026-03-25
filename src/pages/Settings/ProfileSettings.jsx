import React, { useEffect } from 'react';
import styled from 'styled-components';
import ProfileInfo from '../../components/profile/ProfileInfo';
import ChangePasswordForm from '../../components/forms/ChangePasswordForm';

const Page = styled.div`
  padding: 32px 40px;
  background: ${({ theme }) => theme?.colors?.background || '#f5f7fa'};
  min-height: 100vh;
  box-sizing: border-box;
  font-family: 'DM Sans', sans-serif;
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const Title = styled.h2`
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 800;
  color: ${({ theme }) => theme?.colors?.text || '#1a202c'};
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme?.colors?.textSecondary || '#718096'};
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  max-width: 600px;
`;

export default function ProfileSettings() {
  useEffect(() => {
    document.title = 'My Profile | ClinicOS';
  }, []);

  return (
    <Page>
      <Header>
        <Title>My Profile</Title>
        <Subtitle>Manage your account settings and update your password.</Subtitle>
      </Header>
      
      <Layout>
        <ProfileInfo />
        <ChangePasswordForm />
      </Layout>
    </Page>
  );
}
