import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function InvoicePage() {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
      <Result
        icon={<span style={{ fontSize: 64 }}>💳</span>}
        title="Billing & Invoices"
        subTitle="Billing Module — your teammate will implement this."
        extra={<Button type="primary" onClick={() => navigate('/dashboard')} style={{ borderRadius: 8 }}>Back to Dashboard</Button>}
      />
    </div>
  );
}