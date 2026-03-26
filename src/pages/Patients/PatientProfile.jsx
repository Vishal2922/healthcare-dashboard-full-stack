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
import useAppointments from '../../modules/appointments/hooks/useAppointments';
import usePrescriptions from '../../modules/prescriptions/hooks/usePrescriptions';
import PatientFormDrawer from '../../components/forms/PatientFormDrawer';
import usePermission from '../../hooks/usePermission';

const { Title, Text, Paragraph } = Typography;

// ─── Styled ───────────────────────────────────────────────────────────────────
const PageWrapper = styled.div`
  padding: 24px;
  background: ${({ theme }) => theme.colors?.background || '#f7f5f0'};

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
  const { can }  = usePermission();

  // ── RBAC flags ─────────────────────────────────────────────────────────────
  const canEdit = can('patients', 'edit');

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

  const {
    list: appointments,
    loading: apptsLoading,
    loadAppointments
  } = useAppointments();

  const {
    list: prescriptions,
    listLoading: rxLoading,
    fetchPrescriptions
  } = usePrescriptions();

  // useEffect — always unconditional, guard inside
  useEffect(() => {
    if (!fetchPatientById) return; // accessDenied guard
    fetchPatientById(id);
    
    // Also fetch appointments and prescriptions for this patient
    loadAppointments({ patient_id: id, page: 1, per_page: 50 });
    fetchPrescriptions({ patient_id: id, page: 1, per_page: 50 });
  }, [id, fetchPatientById, loadAppointments, fetchPrescriptions]);

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
            {canEdit && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setDrawerOpen(true)}
                style={{ borderRadius: 8, fontWeight: 600 }}
              >
                Edit Patient
              </Button>
            )}
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
              key: 'appointments',
              label: <Space><CalendarOutlined />Appointments</Space>,
              children: <AppointmentsTab appointments={appointments} loading={apptsLoading} />,
            },
            {
              key: 'medical',
              label: <Space><MedicineBoxOutlined />Medical History</Space>,
              children: <MedicalHistoryTab patient={patient} prescriptions={prescriptions} loading={rxLoading} />,
            },
          ]}
        />
      </div>

      {/* ── Edit Drawer ───────────────────────────────────────────────────── */}
      {canEdit && (
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
      )}
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
function MedicalHistoryTab({ patient, prescriptions, loading }) {
  const fields = [
    { label: 'Known Allergies',     value: patient.allergies },
    { label: 'Chronic Conditions',  value: patient.chronic_conditions },
    { label: 'Current Medications', value: patient.current_medications },
    { label: 'Surgical History',    value: patient.surgical_history },
    { label: 'Family History',      value: patient.family_history },
    { label: 'Notes',               value: patient.notes },
  ];
  const hasFields = fields.some((f) => f.value);

  return (
    <div style={{ paddingTop: 20 }}>
      {hasFields && (
        <Row gutter={24} style={{ marginBottom: 24 }}>
          {fields.filter((f) => f.value).map((f) => (
            <Col xs={24} md={12} key={f.label}>
              <SectionCard size="small" title={f.label}>
                <Paragraph style={{ margin: 0, fontSize: 13 }}>{f.value}</Paragraph>
              </SectionCard>
            </Col>
          ))}
        </Row>
      )}

      <SectionCard title={<Space><MedicineBoxOutlined />Prescription History</Space>}>
        {loading ? (
          <Skeleton active />
        ) : !prescriptions || prescriptions.length === 0 ? (
          <EmptyState>
            <MedicineBoxOutlined style={{ fontSize: 32, marginBottom: 8, display: 'block' }} />
            <Text type="secondary">No prescriptions found for this patient.</Text>
          </EmptyState>
        ) : (
          <Row gutter={[16, 16]}>
            {prescriptions.map((rx) => (
              <Col xs={24} key={rx.id}>
                <Card size="small" style={{ borderRadius: 8, background: '#fafafa' }}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Text strong style={{ fontSize: 14 }}>{rx.medicine_name_plain || rx.medicine_name}</Text>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {rx.dosage_plain || rx.dosage} • {rx.duration_days} days
                      </div>
                    </Col>
                    <Col style={{ textAlign: 'right' }}>
                      <Tag color={rx.status === 'dispensed' ? 'success' : 'orange'}>
                        {rx.status?.toUpperCase()}
                      </Tag>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                        {new Date(rx.created_at).toLocaleDateString()}
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Tab: Appointments ────────────────────────────────────────────────────────
function AppointmentsTab({ appointments, loading }) {
  if (loading) return <div style={{ paddingTop: 40 }}><Skeleton active /></div>;

  if (!appointments || appointments.length === 0) {
    return (
      <EmptyState style={{ paddingTop: 40 }}>
        <CalendarOutlined style={{ fontSize: 40, marginBottom: 12, display: 'block', color: '#bfbfbf' }} />
        <Text type="secondary">No appointment history found.</Text>
      </EmptyState>
    );
  }

  return (
    <div style={{ paddingTop: 20 }}>
      <Row gutter={[0, 12]}>
        {appointments.map((appt) => (
          <Col span={24} key={appt.id}>
            <Card size="small" style={{ borderRadius: 10, border: '1px solid #f0f0f0' }}>
              <Row align="middle" gutter={16}>
                <Col>
                  <div style={{ 
                    width: 48, height: 48, borderRadius: 8, 
                    background: '#f0f5ff', color: '#1890ff',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, lineHeight: 1.2
                  }}>
                    <span>{new Date(appt.appointment_time).getDate()}</span>
                    <span style={{ fontSize: 10, textTransform: 'uppercase' }}>
                      {new Date(appt.appointment_time).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                  </div>
                </Col>
                <Col flex={1}>
                  <Text strong>{appt.doctor_name || `Doctor #${appt.doctor_id}`}</Text>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                    {new Date(appt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {appt.reason && ` • ${appt.reason}`}
                  </div>
                </Col>
                <Col>
                  <Tag color={
                    appt.status === 'completed' ? 'success' :
                    appt.status === 'cancelled' ? 'error' :
                    appt.status === 'pending'   ? 'gold' : 'processing'
                  }>
                    {appt.status?.toUpperCase()}
                  </Tag>
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}