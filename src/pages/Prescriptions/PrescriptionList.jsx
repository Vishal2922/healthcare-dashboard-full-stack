/**
 * PrescriptionList — Prescription Management Page
 *
 * Role-aware rendering:
 *   Provider    → full table + "New Prescription" button + Edit
 *   Pharmacist  → full table + "Dispense" button on pending rows
 *   Admin       → read-only table, no action buttons
 */
import React, { useEffect, useState, useCallback } from 'react';
import styled, { useTheme } from 'styled-components';
import {
  Table, Button, Input, Select, Tag, Space, Tooltip,
  Alert, Typography, Card, Popconfirm,
} from 'antd';
import {
  MedicineBoxOutlined, PlusOutlined, SearchOutlined,
  CheckCircleOutlined, ClockCircleOutlined,
  ReloadOutlined, FilterOutlined, DownloadOutlined,
  UserOutlined,
} from '@ant-design/icons';

import usePrescriptions from '../../modules/prescriptions/hooks/usePrescriptions';
import {
  fetchPrescriptionsRequest,
  serveFromCache as rxServeFromCache,
  selectPrescriptionMeta,
  selectPrescriptionPageCache,
  selectPrescriptionFilters,
  selectPrescriptionPrefetching,
} from '../../modules/prescriptions/prescriptionSlice';
import usePrefetchPagination from '../../hooks/usePrefetchPagination';
import PaginationBar from '../../components/PaginationBar';
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
const { Search }      = Input;
const { Option }      = Select;

// ─── Styled Components ────────────────────────────────────────────────────────
const PageWrapper = styled.div`
  padding: 8px 0;
`;

const PageHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px; flex-wrap: wrap; gap: 16px;
`;

const HeaderLeft = styled.div`
  display: flex; align-items: center; gap: 12px;
`;

const PageIcon = styled.div`
  width: 48px; height: 48px; border-radius: 12px;
  background: ${({ theme }) => theme.colors.primary};
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; color: #fff; flex-shrink: 0;
`;

// ── Stats section ─────────────────────────────────────────────────────────────
const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
  margin-bottom: 24px;
`;

const StatCard = styled(Card)`
  border-radius: 12px; border: none;
  box-shadow: 0 1px 6px rgba(0,0,0,0.07);
  .ant-card-body { padding: 16px 18px; }
`;

const StatHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.07em; color: #a0aab4;
`;

const StatIconWrap = styled.div`
  width: 28px; height: 28px; border-radius: 7px;
  background: ${({ $bg }) => $bg || '#f0fdf9'};
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: ${({ $color, theme }) => $color || theme.colors.primary};
`;

const StatValue = styled.div`
  font-size: 28px; font-weight: 800;
  color: ${({ $color }) => $color || '#0e1b2a'};
  line-height: 1;
`;

const StatNote = styled.div`
  font-size: 11px; color: #a0aab4; margin-top: 4px;
`;

// ── Table section ─────────────────────────────────────────────────────────────
const TableCard = styled(Card)`
  border-radius: 12px; border: none;
  box-shadow: 0 1px 6px rgba(0,0,0,0.07);
  .ant-card-body { padding: 0; }
`;

const FilterBar = styled.div`
  display: flex; align-items: center; gap: 12px;
  padding: 16px 20px; border-bottom: 1px solid #f0f0f0;
  flex-wrap: wrap;
`;

// ─── Status badge ─────────────────────────────────────────────────────────────
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
  const theme = useTheme();

  const {
    hasAccess, list, listLoading, formLoading,
    error, successMessage,
    fetchPrescriptions, createPrescription, updatePrescription,
    dispensePrescription, dismissError, dismissSuccess,
  } = usePrescriptions();

  const { can, role: userRole } = usePermission();
  const { user } = useAuth();

  const patientList = useSelector(selectPatientList);
  useEffect(() => {
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
  const canCreate   = can('prescriptions', 'create');
  const canUpdate   = can('prescriptions', 'update');
  const canDispense = can('prescriptions', 'dispense');

  // ── Prefetch pagination ────────────────────────────────────────────────────
  const prefetching = useSelector(selectPrescriptionPrefetching);

  const pagination = usePrefetchPagination({
    fetchAction:          fetchPrescriptionsRequest,
    metaSelector:         selectPrescriptionMeta,
    pageCacheSelector:    selectPrescriptionPageCache,
    serveFromCacheAction: rxServeFromCache,
    listLoading:          listLoading ?? false,
    debounceMs:           200,
    cacheKeyPrefix:       'prescriptions',
    filtersSelector:      selectPrescriptionFilters,
  });

  // ── Computed stats from full list ──────────────────────────────────────────
  const total      = pagination.total || list.length;
  const pending    = list.filter((r) => r.status === 'pending').length;
  const dispensed  = list.filter((r) => r.status === 'dispensed').length;

  // Prescriptions created today
  const todayStr   = new Date().toLocaleDateString('en-IN');
  const today      = list.filter((r) =>
    r.created_at && new Date(r.created_at).toLocaleDateString('en-IN') === todayStr
  ).length;

  // Pending rate percentage
  const pendingRate = total > 0 ? Math.round((pending / total) * 100) : 0;
  const dispenseRate = total > 0 ? Math.round((dispensed / total) * 100) : 0;

  // ── Filtered list ──────────────────────────────────────────────────────────
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
      themeColor: theme.colors.primary,
    });
  }, [user, theme]);

  // ── Table columns ──────────────────────────────────────────────────────────
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
      render: (d) => d
        ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
        : '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size={6}>
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
          {canDispense && record.status === 'pending' && (
            <Popconfirm
              title="Mark as dispensed?"
              description="Confirm the medication has been given to the patient."
              onConfirm={() => handleDispense(record.id)}
              okText="Dispense"
              cancelText="Cancel"
              okButtonProps={{
                style: { borderRadius: 6, background: theme.colors.primary, borderColor: theme.colors.primary },
              }}
            >
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={formLoading}
                style={{ borderRadius: 6, background: theme.colors.primary, borderColor: theme.colors.primary }}
              >
                Dispense
              </Button>
            </Popconfirm>
          )}
          {canDispense && record.status === 'dispensed' && (
            <Tag color="success" style={{ borderRadius: 6, fontSize: 11 }}>✓ Done</Tag>
          )}
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

  // ── Access Denied ──────────────────────────────────────────────────────────
  if (!hasAccess) {
    return (
      <PageWrapper>
        <Alert
          type="error" showIcon
          description="You do not have permission to view prescriptions."
          style={{ borderRadius: 8, maxWidth: 500 }}
        />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* ── Alerts ────────────────────────────────────────────────────────── */}
      {error && (
        <Alert type="error" showIcon message={error} closable onClose={dismissError}
          style={{ borderRadius: 8, marginBottom: 16 }} />
      )}
      {successMessage && (
        <Alert type="success" showIcon message={successMessage} closable onClose={dismissSuccess}
          style={{ borderRadius: 8, marginBottom: 16 }} />
      )}

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <PageHeader>
        <HeaderLeft>
          <PageIcon><MedicineBoxOutlined /></PageIcon>
          <div>
            <Title level={4} style={{ margin: 0 }}>Prescriptions</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {total} total · {pending} pending · {dispensed} dispensed
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
                borderRadius: 8, fontWeight: 600,
                background: theme.colors.primary, borderColor: theme.colors.primary,
              }}
            >
              New Prescription
            </Button>
          )}
        </Space>
      </PageHeader>

      {/* ── Stats Row ─────────────────────────────────────────────────────── */}
      <StatsRow>
        {[
          {
            label: 'Total',
            value: total,
            note: `${today} added today`,
            color: '#4f46e5',
            iconBg: '#ede9fe', iconColor: '#4f46e5',
            Icon: MedicineBoxOutlined,
          },
          {
            label: 'Pending',
            value: pending,
            note: `${pendingRate}% of total`,
            color: '#d97706',
            iconBg: '#fff3cd', iconColor: '#d97706',
            Icon: ClockCircleOutlined,
          },
          {
            label: 'Dispensed',
            value: dispensed,
            note: `${dispenseRate}% completion`,
            color: theme.colors.primary,
            iconBg: `${theme.colors.primary}15`, iconColor: theme.colors.primary,
            Icon: CheckCircleOutlined,
          },
          {
            label: 'Today',
            value: today,
            note: 'Prescriptions today',
            color: '#2b6cb0',
            iconBg: '#ebf8ff', iconColor: '#2b6cb0',
            Icon: UserOutlined,
          },
        ].map(({ label, value, note, color, iconBg, iconColor, Icon }) => (
          <StatCard key={label}>
            <StatHeader>
              <StatLabel>{label}</StatLabel>
              <StatIconWrap $bg={iconBg} $color={iconColor}>
                <Icon />
              </StatIconWrap>
            </StatHeader>
            <StatValue $color={color}>{value}</StatValue>
            <StatNote>{note}</StatNote>
          </StatCard>
        ))}
      </StatsRow>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
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
          <Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>
            Showing {filteredList.length} of {total}
          </Text>
        </FilterBar>

        <Table
          columns={columns}
          dataSource={filteredList}
          rowKey="id"
          loading={listLoading}
          pagination={false}
          scroll={{ x: 900 }}
          style={{ borderRadius: '0 0 12px 12px' }}
        />

        {/* Prefetch pagination bar */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid #f9fafb' }}>
          <PaginationBar
            {...pagination}
            isPrefetching={prefetching}
          />
        </div>
      </TableCard>

      {/* ── Create / Edit Drawer ──────────────────────────────────────────── */}
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