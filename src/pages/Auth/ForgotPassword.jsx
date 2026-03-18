import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f7f5f0' }}>
      <Result
        icon={<span style={{ fontSize: 64 }}>🔑</span>}
        title="Forgot Password"
        subTitle="Password reset — your teammate will implement this."
        extra={<Button type="primary" onClick={() => navigate('/login')} style={{ borderRadius: 8 }}>Back to Login</Button>}
      />
    </div>
  );
}