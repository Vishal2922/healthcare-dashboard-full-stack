import styled from 'styled-components';
import { SafetyCertificateOutlined } from '@ant-design/icons';

const Bar = styled.footer`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary || '#a0aab4'};
  border-top: 1px solid ${({ theme }) => theme.colors.border || '#edf2f7'};
  background: ${({ theme }) => theme.colors.surface || '#fff'};
  margin-top: auto;
`;

export default function Footer() {
  return (
    <Bar>
      <SafetyCertificateOutlined />
      © {new Date().getFullYear()} ClinicOS · JWT · CSRF protected · AES-256 encrypted
    </Bar>
  );
}