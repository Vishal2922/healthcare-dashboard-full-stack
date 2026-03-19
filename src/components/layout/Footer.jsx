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
  color: #a0aab4;
  border-top: 1px solid #edf2f7;
  background: #fff;
  margin-top: 40px;
`;

export default function Footer() {
  return (
    <Bar>
      <SafetyCertificateOutlined />
      © {new Date().getFullYear()} ClinicOS · JWT · CSRF protected · AES-256 encrypted
    </Bar>
  );
}