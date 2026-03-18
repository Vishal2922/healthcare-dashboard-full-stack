import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  Row, Col, Card, Avatar, Tag, Button, Skeleton, Alert,
  Typography, Space, Tabs, Badge,
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, UserOutlined, PhoneOutlined,
  MailOutlined, EnvironmentOutlined, CalendarOutlined,
  MedicineBoxOutlined, HeartOutlined, DisconnectOutlined,
} from '@ant-design/icons';

import usePatients from '../../modules/patients/hooks/usePatients';
import PatientFormDrawer from '../../components/forms/PatientFormDrawer';

const { Title, Text, Paragraph } = Typography;

// ─── Styled ───────────────────────────────────────────────────────────────────
const PageWrapper = styled.div`
  padding: 24px;
  background: ${({ theme }) => theme.colors?.background || '#f7f5f0'};
  min-height: 100vh;
`;
const ProfileCard = styled(Card)`
  border-radius: 14px; border: none;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  .ant-card-body { padding: 28px; }
`;
const AvatarWrap = styled.div`
  display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
`;
const LargeAvatar = styled(Avatar)`
  background: ${({ $gender }) =>
    $gender === 'Female' ? '#eb2f96' : $gender === 'Male' ? '#1890ff' : '#722ed1'};
  font-size: 32px; font-weight: 700; flex-shrink: 0;
`;
const SectionCard = styled(Card)`
  border-radius: 12px; border: none;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06); margin-bottom: 16px;
  .ant-card-head { border-bottom: 1px solid #f5f5f5; }
  .ant-card-head-title { font-weight: 700; font-size: 14px; }
`;
const InfoItem = styled.div`
  display: flex; align-items: flex-start; gap: 10px; padding: 8px 0;
  .icon {
    color: ${({ theme }) => theme.colors?.primary || '#4f46e5'};
    font-size: 16px; margin-top: 2px; flex-shrink: 0;
  }
`;
const EmptyState = styled.div`
  text-align: center; padding: 40px; color: #bfbfbf;
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcAge(dob) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}
function formatDate(d) {
  return d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
}
const BLOOD_COLORS = {
  'A+': 'red',    'A-': 'volcano', 'B+': 'orange',  'B-': 'gold',
  'AB+': 'purple','AB-': 'magenta','O+': 'blue',     'O-': 'geekblue',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function PatientProfile() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const pts      = usePatients();

  // useState — always unconditional
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Destructure BEFORE useEffect so the dep array is stable
  // pts.accessDenied case: these will be undefined — that's fine,
  // the effect guards internally and the early return below handles the UI.
  const fetchPatientById = pts.accessDenied ? null : pts.fetchPatientById;
  const updatePatient    = pts.accessDenied ? null : pts.updatePatient;
  const formLoading      = pts.accessDenied ? false : pts.formLoading;
  const detailLoading    = pts.accessDenied ? false : pts.detailLoading;
  const selectedPatient  = pts.accessDenied ? null  : pts.selectedPatient;
  const error            = pts.accessDenied ? null  : pts.error;
  const successMessage   = pts.accessDenied ? null  : pts.successMessage;
  const isOnline         = pts.accessDenied ? true  : pts.isOnline;
  const dismissError     = pts.accessDenied ? null  : pts.dismissError;
  const dismissSuccess   = pts.accessDenied ? null  : pts.dismissSuccess;

  // useEffect — always unconditional, guard inside
  useEffect(() => {
    if (!fetchPatientById) return; // accessDenied guard
    fetchPatientById(id);
  }, [id, fetchPatientById]);

  // ── RBAC guard — AFTER all hooks ──────────────────────────────────────────
  if (pts.accessDenied) {
    return (
      <PageWrapper>
        <Alert
          type="error"
          showIcon
          message="Access Denied"
          description={`Your role (${pts.userRole}) cannot view patient records.`}
          style={{ borderRadius: 8, maxWidth: 520, margin: '80px auto' }}
        />
      </PageWrapper>
    );
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (detailLoading || !selectedPatient) {
    return (
      <PageWrapper>
        <Button
          icon={<ArrowLeftOutlined />}
          type="text"
          onClick={() => navigate('/patients')}
          style={{ marginBottom: 20 }}
        >
          Back to Patients
        </Button>
        <ProfileCard>
          <Skeleton active avatar={{ size: 80 }} paragraph={{ rows: 4 }} />
        </ProfileCard>
      </PageWrapper>
    );
  }

  const patient = selectedPatient;
  const age     = calcAge(patient.dob);

  return (
    <PageWrapper>
      {/* ── Feedback ─────────────────────────────────────────────────────── */}
      {!isOnline && (
        <Alert
          type="warning"
          showIcon
          icon={<DisconnectOutlined />}
          message="Offline — edits will sync when reconnected"
          style={{ borderRadius: 8, marginBottom: 16 }}
        />
      )}
      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          closable
          onClose={dismissError}
          style={{ borderRadius: 8, marginBottom: 16 }}
        />
      )}
      {successMessage && (
        <Alert
          type="success"
          showIcon
          message={successMessage}
          closable
          onClose={dismissSuccess}
          style={{ borderRadius: 8, marginBottom: 16 }}
        />
      )}

      {/* ── Back ─────────────────────────────────────────────────────────── */}
      <Button
        icon={<ArrowLeftOutlined />}
        type="text"
        onClick={() => navigate('/patients')}
        style={{ marginBottom: 20, paddingLeft: 0 }}
      >
        Back to Patients
      </Button>

      {/* ── Profile Header ────────────────────────────────────────────────── */}
      <ProfileCard style={{ marginBottom: 20 }}>
        <Row justify="space-between" align="top" wrap>
          <Col>
            <AvatarWrap>
              <LargeAvatar $gender={patient.gender} size={80}>
                {patient.full_name?.charAt(0)?.toUpperCase() || 'P'}
              </LargeAvatar>
              <div>
                <Title level={3} style={{ margin: 0 }}>{patient.full_name}</Title>
                <Space size={8} style={{ marginTop: 6, flexWrap: 'wrap' }}>
                  <Tag style={{ borderRadius: 6, border: 'none', background: '#f0f0f0' }}>
                    ID #{patient.id}
                  </Tag>
                  {patient.gender && (
                    <Tag
                      color={
                        patient.gender === 'Female' ? 'pink'
                        : patient.gender === 'Male'   ? 'blue'
                        : 'purple'
                      }
                      style={{ borderRadius: 6 }}
                    >
                      {patient.gender}
                    </Tag>
                  )}
                  {age && (
                    <Tag style={{ borderRadius: 6, border: 'none', background: '#fff7e6', color: '#d46b08' }}>
                      {age} yrs
                    </Tag>
                  )}
                  {patient.blood_group && (
                    <Tag
                      color={BLOOD_COLORS[patient.blood_group] || 'red'}
                      style={{ borderRadius: 6, fontWeight: 700 }}
                    >
                      {patient.blood_group}
                    </Tag>
                  )}
                  <Badge
                    status={patient.is_active ? 'success' : 'default'}
                    text={
                      <Text style={{ fontSize: 13 }}>
                        {patient.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    }
                  />
                </Space>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Registered on {formatDate(patient.created_at)}
                  </Text>
                </div>
              </div>
            </AvatarWrap>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setDrawerOpen(true)}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              Edit Patient
            </Button>
          </Col>
        </Row>
      </ProfileCard>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff', borderRadius: 12,
        padding: '0 20px 20px',
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
      }}>
        <Tabs
          defaultActiveKey="info"
          items={[
            {
              key: 'info',
              label: <Space><UserOutlined />Personal Info</Space>,
              children: <PersonalInfoTab patient={patient} />,
            },
            {
              key: 'medical',
              label: <Space><MedicineBoxOutlined />Medical History</Space>,
              children: <MedicalHistoryTab patient={patient} />,
            },
            {
              key: 'appointments',
              label: <Space><CalendarOutlined />Appointments</Space>,
              children: <AppointmentsTab />,
            },
          ]}
        />
      </div>

      {/* ── Edit Drawer ───────────────────────────────────────────────────── */}
      <PatientFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={(values) => {
          updatePatient({ id: patient.id, ...values });
          setDrawerOpen(false);
        }}
        initialValues={patient}
        loading={formLoading}
        isOnline={isOnline}
      />
    </PageWrapper>
  );
}

// ─── Tab: Personal Info ───────────────────────────────────────────────────────
function PersonalInfoTab({ patient }) {
  return (
    <div style={{ paddingTop: 20 }}>
      <Row gutter={24}>
        <Col xs={24} md={12}>
          <SectionCard title={<Space><PhoneOutlined />Contact Details</Space>}>
            {[
              { icon: <PhoneOutlined />,       label: 'Phone',   value: patient.phone },
              { icon: <MailOutlined />,         label: 'Email',   value: patient.email },
              { icon: <EnvironmentOutlined />,  label: 'Address', value: patient.address },
            ].map((row) => (
              <InfoItem key={row.label}>
                <span className="icon">{row.icon}</span>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{row.label}</Text>
                  <Text strong>{row.value || '—'}</Text>
                </div>
              </InfoItem>
            ))}
          </SectionCard>
        </Col>
        <Col xs={24} md={12}>
          <SectionCard title={<Space><HeartOutlined />Basic Info</Space>}>
            {[
              {
                icon: <CalendarOutlined />,
                label: 'Date of Birth',
                value: patient.dob
                  ? `${new Date(patient.dob).toLocaleDateString('en-IN')} (${calcAge(patient.dob)} yrs)`
                  : '—',
              },
              { icon: <UserOutlined />,  label: 'Gender',      value: patient.gender },
              { icon: <HeartOutlined />, label: 'Blood Group', value: patient.blood_group },
            ].map((row) => (
              <InfoItem key={row.label}>
                <span className="icon">{row.icon}</span>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{row.label}</Text>
                  <Text strong>{row.value || '—'}</Text>
                </div>
              </InfoItem>
            ))}
          </SectionCard>
        </Col>
      </Row>
      {patient.emergency_contact && (
        <SectionCard title="Emergency Contact">
          <Text>{patient.emergency_contact}</Text>
        </SectionCard>
      )}
    </div>
  );
}

// ─── Tab: Medical History ─────────────────────────────────────────────────────
function MedicalHistoryTab({ patient }) {
  const fields = [
    { label: 'Known Allergies',     value: patient.allergies },
    { label: 'Chronic Conditions',  value: patient.chronic_conditions },
    { label: 'Current Medications', value: patient.current_medications },
    { label: 'Surgical History',    value: patient.surgical_history },
    { label: 'Family History',      value: patient.family_history },
    { label: 'Notes',               value: patient.notes },
  ];
  const hasAny = fields.some((f) => f.value);

  if (!hasAny) {
    return (
      <EmptyState>
        <MedicineBoxOutlined style={{ fontSize: 40, marginBottom: 12, display: 'block' }} />
        <Text type="secondary">No medical history recorded yet.</Text>
      </EmptyState>
    );
  }

  return (
    <div style={{ paddingTop: 20 }}>
      <Row gutter={24}>
        {fields.filter((f) => f.value).map((f) => (
          <Col xs={24} md={12} key={f.label}>
            <SectionCard size="small" title={f.label}>
              <Paragraph style={{ margin: 0 }}>{f.value}</Paragraph>
            </SectionCard>
          </Col>
        ))}
      </Row>
    </div>
  );
}

// ─── Tab: Appointments (placeholder) ─────────────────────────────────────────
function AppointmentsTab() {
  return (
    <EmptyState style={{ paddingTop: 40 }}>
      <CalendarOutlined style={{ fontSize: 40, marginBottom: 12, display: 'block', color: '#bfbfbf' }} />
      <Text type="secondary">
        Appointment history will appear here once the Appointments module is connected.
      </Text>
    </EmptyState>
  );
}