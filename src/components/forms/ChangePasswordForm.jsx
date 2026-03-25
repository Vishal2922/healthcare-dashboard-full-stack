import React, { useState } from 'react';
import styled from 'styled-components';
import axiosClient from '../../services/axiosClient';

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
  margin: 0 0 20px 0;
  font-size: 13px;
  color: ${({ theme }) => theme?.colors?.textSecondary || '#718096'};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme?.colors?.textSecondary || '#4a5568'};
`;

const Input = styled.input`
  padding: 10px 14px;
  border: 1px solid ${({ theme }) => theme?.colors?.border || '#e2e8f0'};
  border-radius: 8px;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  color: ${({ theme }) => theme?.colors?.text || '#1a202c'};
  background: ${({ theme }) => theme?.colors?.background || '#fff'};
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme?.colors?.primary || '#3182ce'};
    box-shadow: 0 0 0 3px ${({ theme }) => theme?.colors?.primary ? `${theme.colors.primary}20` : 'rgba(49, 130, 206, 0.1)'};
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  background: ${({ theme }) => theme?.colors?.primary || '#3182ce'};
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  align-self: flex-start;
  margin-top: 8px;
  
  &:hover:not(:disabled) {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Message = styled.div`
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  background: ${({ $type, theme }) => $type === 'error' ? (theme?.colors?.danger ? `${theme.colors.danger}15` : '#fff5f5') : '#f0fdf4'};
  color: ${({ $type, theme }) => $type === 'error' ? (theme?.colors?.danger || '#e53e3e') : '#166534'};
  border: 1px solid ${({ $type, theme }) => $type === 'error' ? (theme?.colors?.danger ? `${theme.colors.danger}30` : '#feb2b2') : '#bbf7d0'};
  margin-bottom: 16px;
`;

export default function ChangePasswordForm() {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [status, setStatus] = useState(null); // { type: 'error' | 'success', message: '' }
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (formData.new_password !== formData.confirm_password) {
      return setStatus({ type: 'error', message: "New passwords do not match." });
    }

    if (formData.new_password === formData.current_password) {
      return setStatus({ type: 'error', message: "New password must be different from the current password." });
    }

    setLoading(true);
    try {
      const response = await axiosClient.post('/api/auth/change-password', {
        current_password: formData.current_password,
        new_password: formData.new_password,
      });

      setStatus({ type: 'success', message: response?.data?.message || 'Password changed successfully.' });
      setFormData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to change password. Please check your current password and try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Title>Change Password</Title>
      <Subtitle>Update your password to keep your account secure.</Subtitle>

      {status && (
        <Message $type={status.type}>{status.message}</Message>
      )}

      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="current_password">Current Password</Label>
          <Input
            id="current_password"
            name="current_password"
            type="password"
            required
            value={formData.current_password}
            onChange={handleChange}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="new_password">New Password</Label>
          <Input
            id="new_password"
            name="new_password"
            type="password"
            required
            minLength={8}
            value={formData.new_password}
            onChange={handleChange}
            placeholder="At least 8 chars, 1 uppercase, 1 number, 1 symbol"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="confirm_password">Confirm New Password</Label>
          <Input
            id="confirm_password"
            name="confirm_password"
            type="password"
            required
            minLength={8}
            value={formData.confirm_password}
            onChange={handleChange}
          />
        </FormGroup>

        <Button type="submit" disabled={loading}>
          {loading ? 'Changing...' : 'Change Password'}
        </Button>
      </Form>
    </Card>
  );
}
