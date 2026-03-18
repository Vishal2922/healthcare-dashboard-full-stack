import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f7f5f0' }}>
      <Result
        icon={<span style={{ fontSize: 64 }}>🏥</span>}
        title="Dashboard"
        subTitle="Dashboard Module — your teammate will implement this."
        extra={<Button type="primary" style={{ borderRadius: 8 }}>Loaded ✓</Button>}
      />
    </div>
  );
}