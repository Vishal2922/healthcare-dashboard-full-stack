import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function AppointmentCalendar() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f7f5f0' }}>
      <Result
        icon={<span style={{ fontSize: 64 }}>📆</span>}
        title="Appointment Calendar"
        subTitle="Calendar Module — your teammate will implement this."
        extra={<Button type="primary" onClick={() => navigate('/dashboard')} style={{ borderRadius: 8 }}>Back to Dashboard</Button>}
      />
    </div>
  );
}