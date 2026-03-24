import React, { useState } from 'react';
import styled from 'styled-components';
import { useAppTheme } from '../../context/ThemeContext';
import { BgColorsOutlined, CheckCircleOutlined } from '@ant-design/icons';

const Page = styled.div`
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  font-family: 'DM Sans', sans-serif;
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 2rem;
  color: ${({ theme }) => theme.colors.text};
`;

const Section = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  margin-bottom: 2rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const HelpText = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 1.5rem 0;
  opacity: 0.8;
`;

const ColorContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 2rem;
`;

const ColorInput = styled.input`
  height: 44px;
  width: 60px;
  border: none;
  cursor: pointer;
  border-radius: 8px;
  padding: 0;
  background: transparent;
`;

const ColorHex = styled.div`
  font-family: monospace;
  font-size: 16px;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: 8px 12px;
  border-radius: 6px;
  color: ${({ theme }) => theme.colors.text};
`;

const PreviewSwatch = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: ${({ $color }) => $color};
  border: 2px solid ${({ theme }) => theme.colors.border};
`;

const Button = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.9;
  }
`;

export default function ThemeSettings() {
  const { primaryColor, changeBrandColor } = useAppTheme();
  const [localColor, setLocalColor] = useState(primaryColor);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await changeBrandColor(localColor);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Page>
      <Title><BgColorsOutlined style={{ color: localColor }} /> Brand Color Settings</Title>
      <Section>
        <Label>Tenant Brand Color</Label>
        <HelpText>
          Choose the primary brand color for your clinic. This color will be applied across the entire
          application for all staff members.
        </HelpText>
        <ColorContainer>
          <ColorInput type="color" value={localColor} onChange={e => setLocalColor(e.target.value)} />
          <ColorHex>{localColor.toUpperCase()}</ColorHex>
          <PreviewSwatch $color={localColor} title="Preview" />
        </ColorContainer>

        <Button onClick={handleSave}>
          {saved ? <><CheckCircleOutlined /> Saved Successfully</> : 'Save Brand Color'}
        </Button>
      </Section>
    </Page>
  );
}
