/**
 * PrescriptionList — Prescription Management Page
 *
 * Role-aware rendering:
 *   Provider    → full table + "New Prescription" button + Edit
 *   Pharmacist  → full table + "Dispense" button on pending rows
 *   Admin       → read-only table, no action buttons
 */
import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import {
  Table, Button, Input, Select, Tag, Space, Tooltip,
  Alert, Typography, Row, Col, Card, Popconfirm,
} from 'antd';
import {
  MedicineBoxOutlined, PlusOutlined, SearchOutlined,
  CheckCircleOutlined, ClockCircleOutlined,
  ReloadOutlined, FilterOutlined, DownloadOutlined,
} from '@ant-design/icons';


import usePrescriptions from '../../modules/prescriptions/hooks/usePrescriptions';
import usePermission from '../../hooks/usePermission';
import useAuth from '../../modules/auth/hooks/useAuth';
import { useSelector } from 'react-redux';
import { selectPatientList } from '../../modules/patients/selectors';
import { useDispatch } from 'react-redux';
import { fetchPatientsRequest } from '../../modules/patients/patientSlice';
import useDebounce from '../../hooks/useDebounce';
import PrescriptionFormDrawer from './PrescriptionFormDrawer';
import { downloadPrescriptionPDF } from '../../utils/prescriptionPDF';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// ─── Styled Components ────────────────────────────────────────────────────────
const PageWrapper = styled.div`
  padding: 8px 0;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PageIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #20b486;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #fff;
  flex-shrink: 0;
`;

const StatsCard = styled(Card)`
  border-radius: 12px;
  border: none;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.07);
  text-align: center;
  .ant-card-body { padding: 16px 12px; }
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  color: ${({ $color }) => $color || '#1a1a1a'};
  margin-bottom: 4px;
`;

const TableCard = styled(Card)`
  border-radius: 12px;
  border: none;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.07);
  .ant-card-body { padding: 0; }
`;

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-wrap: wrap;
`;

// ─── Status badge helper ──────────────────────────────────────────────────────
function StatusBadge({ status }) {
  if (status === 'dispensed') {
    return (
      <Tag color="success" icon={<CheckCircleOutlined />}
        style={{ borderRadius: 6, fontWeight: 600, fontSize: 11 }}>
        Dispensed
      </Tag>
    );
  }
  return (
    <Tag color="orange" icon={<ClockCircleOutlined />}
      style={{ borderRadius: 6, fontWeight: 600, fontSize: 11 }}>
      Pending
    </Tag>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────
export default function PrescriptionList() {
  const dispatch = useDispatch();

  const {
    hasAccess, list, listLoading, formLoading,
    error, successMessage,
    fetchPrescriptions, createPrescription, updatePrescription,
    dispensePrescription, dismissError, dismissSuccess,
  } = usePrescriptions();

  const { can, role: userRole } = usePermission();
  const { user } = useAuth();

  // ── Load patient list independently (Pharmacist doesn't have patients access)
  // ── so we fetch patients directly from Redux store, not via usePatients hook
  const patientList = useSelector(selectPatientList);
  useEffect(() => {
    // Only Provider needs patient list for the create form
    if (can('patients', 'view')) {
      dispatch(fetchPatientsRequest({ page: 1, per_page: 200 }));
    }
  }, []); // eslint-disable-line

  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [searchText,   setSearchText]   = useState('');
  const [statusFilter, setStatusFilter] = useState(null);

  const debouncedSearch = useDebounce(searchText, 300);

  // ── RBAC flags ─────────────────────────────────────────────────────────────
  const canCreate   = can('prescriptions', 'create');   // Provider only
  const canUpdate   = can('prescriptions', 'update');   // Provider + Pharmacist
  const canDispense = can('prescriptions', 'dispense'); // Pharmacist only

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filteredList = list.filter((rx) => {
    const q = debouncedSearch.toLowerCase();
    const matchSearch = !q || (
      String(rx.id).includes(q) ||
      (rx.medicine_name_plain || '').toLowerCase().includes(q) ||
      (rx.patient_name || '').toLowerCase().includes(q)
    );
    const matchStatus = !statusFilter || rx.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const pending   = list.filter((r) => r.status === 'pending').length;
  const dispensed = list.filter((r) => r.status === 'dispensed').length;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleOpenCreate = () => { setEditTarget(null); setDrawerOpen(true); };
  const handleOpenEdit   = (rec) => { setEditTarget(rec); setDrawerOpen(true); };
  const handleClose      = () => { setDrawerOpen(false); setEditTarget(null); };

  const handleFormSubmit = useCallback((values) => {
    if (editTarget) {
      updatePrescription({ ...values, id: editTarget.id });
    } else {
      createPrescription(values);
    }
    handleClose();
  }, [editTarget, updatePrescription, createPrescription]); // eslint-disable-line

  const handleDispense = useCallback((id) => {
    dispensePrescription(id);
  }, [dispensePrescription]);

  const handleReset = () => {
    setSearchText('');
    setStatusFilter(null);
  };

  const handleDownload = useCallback((record) => {
    downloadPrescriptionPDF(record, {
      doctorName: record.provider_name || user?.username || 'Attending Physician',
    });
  }, [user]);

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 65,
      render: (id) => <Text type="secondary" style={{ fontSize: 12 }}>#{id}</Text>,
    },
    {
      title: 'Patient',
      dataIndex: 'patient_name',
      render: (name, rec) => (
        <Text strong style={{ fontSize: 13 }}>
          {name || `Patient #${rec.patient_id}`}
        </Text>
      ),
    },
    {
      title: 'Medicine',
      dataIndex: 'medicine_name_plain',
      render: (val) => val
        ? <Text style={{ fontSize: 13 }}>{val}</Text>
        : <Text type="secondary" style={{ fontSize: 12 }}>Encrypted</Text>,
    },
    {
      title: 'Dosage',
      dataIndex: 'dosage_plain',
      render: (val) => <Text style={{ fontSize: 12, color: '#555' }}>{val || '—'}</Text>,
    },
    {
      title: 'Duration',
      dataIndex: 'duration_days',
      width: 90,
      render: (d) => <Text style={{ fontSize: 12 }}>{d ? `${d} days` : '—'}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      render: (status) => <StatusBadge status={status} />,
    },
    {
      title: 'Provider',
      dataIndex: 'provider_name',
      render: (name, rec) => (
        <Text style={{ fontSize: 12 }}>{name || `#${rec.provider_id}`}</Text>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      width: 100,
      render: (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—',
    },
    // Actions column — Download always visible; write actions based on role
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size={6}>
          {/* Provider can edit pending prescriptions */}
          {canUpdate && !canDispense && record.status === 'pending' && (
            <Tooltip title="Edit prescription">
              <Button
                size="small"
                icon={<MedicineBoxOutlined />}
                onClick={() => handleOpenEdit(record)}
                style={{ borderRadius: 6 }}
              >
                Edit
              </Button>
            </Tooltip>
          )}
          {/* Pharmacist dispenses pending prescriptions */}
          {canDispense && record.status === 'pending' && (
            <Popconfirm
              title="Mark as dispensed?"
              description="Confirm the medication has been given to the patient."
              onConfirm={() => handleDispense(record.id)}
              okText="Dispense"
              cancelText="Cancel"
              okButtonProps={{
                style: { borderRadius: 6, background: '#20b486', borderColor: '#20b486' },
              }}
            >
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={formLoading}
                style={{ borderRadius: 6, background: '#20b486', borderColor: '#20b486' }}
              >
                Dispense
              </Button>
            </Popconfirm>
          )}
          {canDispense && record.status === 'dispensed' && (
            <Tag color="success" style={{ borderRadius: 6, fontSize: 11 }}>✓ Done</Tag>
          )}
          {/* Download — always visible for all roles */}
          <Tooltip title="Download prescription PDF">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
              style={{ borderRadius: 6, color: '#0e1b2a', borderColor: '#cbd5e1' }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ── Access Denied ─────────────────────────────────────────────────────────
  if (!hasAccess) {
    return (
      <PageWrapper>
        <Alert
          type="error"
          showIcon
          title="Access Denied"
          description="You do not have permission to view prescriptions."
          style={{ borderRadius: 8, maxWidth: 500 }}
        />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
        {/* ── Alerts ──────────────────────────────────────────────────────── */}
        {error && (
          <Alert type="error" showIcon title={error} closable onClose={dismissError}
            style={{ borderRadius: 8, marginBottom: 16 }} />
        )}
        {successMessage && (
          <Alert type="success" showIcon title={successMessage} closable onClose={dismissSuccess}
            style={{ borderRadius: 8, marginBottom: 16 }} />
        )}

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <PageHeader>
          <HeaderLeft>
            <PageIcon><MedicineBoxOutlined /></PageIcon>
            <div>
              <Title level={4} style={{ margin: 0 }}>Prescriptions</Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {list.length} total · {pending} pending · {dispensed} dispensed
                {userRole === 'Pharmacist' && (
                  <Tag color="blue" style={{ marginLeft: 8, borderRadius: 6, fontSize: 11 }}>
                    Pharmacist View
                  </Tag>
                )}
              </Text>
            </div>
          </HeaderLeft>

          <Space>
            <Tooltip title="Refresh">
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchPrescriptions}
                loading={listLoading}
              />
            </Tooltip>
            {canCreate && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleOpenCreate}
                style={{
                  borderRadius: 8,
                  fontWeight: 600,
                  background: '#20b486',
                  borderColor: '#20b486',
                }}
              >
                New Prescription
              </Button>
            )}
          </Space>
        </PageHeader>

        {/* ── Stats Row ───────────────────────────────────────────────────── */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          {[
            { label: 'Total',     value: list.length, color: '#4f46e5' },
            { label: 'Pending',   value: pending,     color: '#fa8c16' },
            { label: 'Dispensed', value: dispensed,   color: '#20b486' },
          ].map((s) => (
            <Col xs={8} key={s.label}>
              <StatsCard>
                <StatValue $color={s.color}>{s.value}</StatValue>
                <Text type="secondary" style={{ fontSize: 12 }}>{s.label}</Text>
              </StatsCard>
            </Col>
          ))}
        </Row>

        {/* ── Table ───────────────────────────────────────────────────────── */}
        <TableCard>
          <FilterBar>
            <Search
              placeholder="Search patient, medicine…"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 260 }}
              allowClear
            />
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 140 }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="pending">Pending</Option>
              <Option value="dispensed">Dispensed</Option>
            </Select>
            <Button icon={<FilterOutlined />} onClick={handleReset} style={{ borderRadius: 6 }}>
              Reset
            </Button>
          </FilterBar>

          <Table
            columns={columns}
            dataSource={filteredList}
            rowKey="id"
            loading={listLoading}
            pagination={{
              pageSize: 15,
              showSizeChanger: true,
              showTotal: (t) => `${t} prescriptions`,
              style: { padding: '16px 20px' },
            }}
            scroll={{ x: 900 }}
            style={{ borderRadius: '0 0 12px 12px' }}
          />
        </TableCard>

        {/* ── Create / Edit Drawer (Provider only) ────────────────────────── */}
        {canCreate && (
          <PrescriptionFormDrawer
            open={drawerOpen}
            onClose={handleClose}
            onSubmit={handleFormSubmit}
            initialValues={editTarget}
            loading={formLoading}
            patients={patientList}
          />
        )}
      </PageWrapper>
  );
}