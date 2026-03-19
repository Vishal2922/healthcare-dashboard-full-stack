import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styled, { useTheme } from 'styled-components';
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Avatar,
  Space,
  Tooltip,
  Popconfirm,
  Alert,
  Typography,
  Row,
  Col,
  Card,
  Badge,
  Dropdown,
  Menu,
} from 'antd';
import {
  UserAddOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  WifiOutlined,
  DisconnectOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  MoreOutlined,
  UserOutlined,
  ManOutlined,
  WomanOutlined,
} from '@ant-design/icons';

import usePatients from '../../modules/patients/hooks/usePatients';
import { fetchPatientsRequest } from '../../modules/patients/patientSlice';
import useDebounce from '../../hooks/useDebounce';
import PatientFormDrawer from '../../components/forms/PatientFormDrawer';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// ─── Styled Components ────────────────────────────────────────────────────────
const PageWrapper = styled.div`
  padding: 24px;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors?.background || '#f7f5f0'};
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
  background: ${({ theme }) => theme.colors?.primary || '#4f46e5'};
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
  color: ${({ color }) => color || '#1a1a1a'};
  margin-bottom: 4px;
`;

const TableCard = styled(Card)`
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);

  .ant-card-body { padding: 0; }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors?.border || '#f0f0f0'};
  flex-wrap: wrap;
  background: #fff;
  border-radius: 12px 12px 0 0;
`;

const PatientAvatar = styled(Avatar)`
  background: ${({ $gender }) =>
    $gender === 'Female' ? '#eb2f96' : $gender === 'Male' ? '#1890ff' : '#722ed1'};
  font-weight: 700;
  font-size: 15px;
`;

const ClickableRow = styled.div`
  cursor: pointer;
  &:hover { text-decoration: underline; }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const GENDER_COLORS = {
  Male:   { color: '#1890ff', bg: '#e6f7ff' },
  Female: { color: '#eb2f96', bg: '#fff0f6' },
  Other:  { color: '#722ed1', bg: '#f9f0ff' },
};

function GenderTag({ gender }) {
  const cfg = GENDER_COLORS[gender] || { color: '#8c8c8c', bg: '#fafafa' };
  const icon = gender === 'Male' ? <ManOutlined /> : gender === 'Female' ? <WomanOutlined /> : <UserOutlined />;
  return (
    <Tag
      icon={icon}
      style={{
        color: cfg.color,
        background: cfg.bg,
        border: 'none',
        borderRadius: 6,
        fontWeight: 600,
        fontSize: 12,
      }}
    >
      {gender}
    </Tag>
  );
}

function calcAge(dob) {
  if (!dob) return '—';
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

// ─── Table Columns ────────────────────────────────────────────────────────────
function buildColumns({ navigate, onEdit, onDelete, canDelete, formLoading }) {
  return [
    {
      title: 'Patient',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (name, record) => (
        <Space>
          <PatientAvatar $gender={record.gender} size={36}>
            {name?.charAt(0)?.toUpperCase() || 'P'}
          </PatientAvatar>
          <div>
            <ClickableRow onClick={() => navigate(`/patients/${record.id}`)}>
              <Text strong style={{ display: 'block', lineHeight: 1.3, fontSize: 14 }}>
                {name}
              </Text>
            </ClickableRow>
            <Text type="secondary" style={{ fontSize: 12 }}>
              #{record.id}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Age / DOB',
      dataIndex: 'dob',
      key: 'dob',
      render: (dob) => (
        <div>
          <Text strong style={{ fontSize: 14 }}>{calcAge(dob)} yrs</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dob ? new Date(dob).toLocaleDateString('en-IN') : '—'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      render: (g) => <GenderTag gender={g} />,
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div>
          <Text style={{ display: 'block', fontSize: 13 }}>{record.phone || '—'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.email || ''}</Text>
        </div>
      ),
    },
    {
      title: 'Blood Group',
      dataIndex: 'blood_group',
      key: 'blood_group',
      render: (bg) =>
        bg ? (
          <Tag color="red" style={{ borderRadius: 6, fontWeight: 700 }}>
            {bg}
          </Tag>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <Badge
          status={active ? 'success' : 'default'}
          text={
            <Text style={{ fontSize: 13, color: active ? '#52c41a' : '#8c8c8c' }}>
              {active ? 'Active' : 'Inactive'}
            </Text>
          }
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item
                key="view"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/patients/${record.id}`)}
              >
                View Profile
              </Menu.Item>
              <Menu.Item
                key="edit"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
              >
                Edit
              </Menu.Item>
              {canDelete && (
                <>
                  <Menu.Divider />
                  <Menu.Item key="delete" danger>
                    <Popconfirm
                      title="Delete this patient?"
                      description="This action is permanent and cannot be undone."
                      onConfirm={() => onDelete(record.id)}
                      okText="Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true, loading: formLoading }}
                    >
                      <Space>
                        <DeleteOutlined />
                        Delete
                      </Space>
                    </Popconfirm>
                  </Menu.Item>
                </>
              )}
            </Menu>
          }
          trigger={['click']}
          placement="bottomRight"
        >
          <Button icon={<MoreOutlined />} type="text" size="small" />
        </Dropdown>
      ),
    },
  ];
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PatientList() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const pts       = usePatients();

  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [searchText,   setSearchText]   = useState('');
  const debouncedSearch = useDebounce(searchText, 400);

  const {
    patientList = [], meta = { page: 1, per_page: 10, total: 0 },
    filters = {}, listLoading = false, formLoading = false,
    error = null, successMessage = null, isOnline = true, 
    pendingCount = 0, isFlushing = false, canDelete = false,
    fetchPatients, createPatient, updatePatient, deletePatient,
    applyFilters, clearFilters, dismissError, dismissSuccess,
  } = pts;

  // ── Search debounce ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!applyFilters) return;
    applyFilters({ search: debouncedSearch });
    dispatch(fetchPatientsRequest({ page: 1, filters: { search: debouncedSearch } }));
  }, [debouncedSearch, applyFilters, dispatch]);

  // ── Access guard ────────────────────────────────────────────────────────────
  if (pts.accessDenied) {
    return (
      <PageWrapper>
        <Alert
          type="error"
          showIcon
          message="Access Denied"
          description={`Your role (${pts.userRole}) does not have access to Patient Management.`}
          style={{ borderRadius: 8, maxWidth: 520, margin: '80px auto' }}
        />
      </PageWrapper>
    );
  }

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleOpenCreate = () => { setEditTarget(null); setDrawerOpen(true); };
  const handleOpenEdit   = (rec) => { setEditTarget(rec); setDrawerOpen(true); };
  const handleClose      = () => { setDrawerOpen(false); setEditTarget(null); };

  const handleFormSubmit = (values) => {
    editTarget ? updatePatient({ id: editTarget.id, ...values })
               : createPatient(values);
    handleClose();
  };

  const handleTableChange = (pagination) => {
    fetchPatients({ page: pagination.current, per_page: pagination.pageSize });
  };

  const handleGenderFilter = (val) => {
    applyFilters({ gender: val || null });
    dispatch(fetchPatientsRequest({ page: 1, filters: { gender: val || null } }));
  };

  const handleStatusFilter = (val) => {
    applyFilters({ status: val || 'active' });
    dispatch(fetchPatientsRequest({ page: 1, filters: { status: val } }));
  };

  const handleReset = () => {
    setSearchText('');
    clearFilters();
    fetchPatients({ page: 1 });
  };

  const columns = buildColumns({
    navigate, onEdit: handleOpenEdit, onDelete: deletePatient,
    canDelete, formLoading,
  });

  // ── Stats ────────────────────────────────────────────────────────────────────
  const maleCount   = patientList.filter((p) => p.gender === 'Male').length;
  const femaleCount = patientList.filter((p) => p.gender === 'Female').length;

  return (
    <PageWrapper>
      {/* ── Offline / Sync Banners ──────────────────────────────────────────── */}
      {!isOnline && (
        <Alert
          type="warning"
          showIcon
          icon={<DisconnectOutlined />}
          message={
            pendingCount > 0
              ? `Offline — ${pendingCount} action${pendingCount > 1 ? 's' : ''} queued for sync`
              : "You're offline — changes will sync when reconnected"
          }
          style={{ borderRadius: 8, marginBottom: 16 }}
        />
      )}
      {isFlushing && (
        <Alert
          type="info"
          showIcon
          icon={<ClockCircleOutlined />}
          message={`Syncing ${pendingCount} queued action${pendingCount > 1 ? 's' : ''}…`}
          style={{ borderRadius: 8, marginBottom: 16 }}
        />
      )}

      {/* ── Error / Success ─────────────────────────────────────────────────── */}
      {error && (
        <Alert type="error" showIcon message={error} closable onClose={dismissError}
          style={{ borderRadius: 8, marginBottom: 16 }} />
      )}
      {successMessage && (
        <Alert type="success" showIcon message={successMessage} closable onClose={dismissSuccess}
          style={{ borderRadius: 8, marginBottom: 16 }} />
      )}

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <PageHeader>
        <HeaderLeft>
          <PageIcon><UserOutlined /></PageIcon>
          <div>
            <Title level={4} style={{ margin: 0 }}>Patient Management</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              <Space size={4}>
                {isOnline
                  ? <><WifiOutlined style={{ color: '#52c41a' }} /> Online</>
                  : <><DisconnectOutlined style={{ color: '#faad14' }} /> Offline</>
                }
                — {meta.total} patients
              </Space>
            </Text>
          </div>
        </HeaderLeft>

        <Space>
          <Tooltip title="Refresh">
            <Button icon={<ReloadOutlined />}
              onClick={() => fetchPatients({ page: meta.page })}
              loading={listLoading} />
          </Tooltip>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={handleOpenCreate}
            style={{ borderRadius: 8, fontWeight: 600 }}
          >
            Register Patient
          </Button>
        </Space>
      </PageHeader>

      {/* ── Stats Row ───────────────────────────────────────────────────────── */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Patients',  value: meta.total,  color: '#4f46e5' },
          { label: 'Male',            value: maleCount,   color: '#1890ff' },
          { label: 'Female',          value: femaleCount, color: '#eb2f96' },
          { label: 'Pending Sync',    value: pendingCount, color: pendingCount > 0 ? '#faad14' : '#bfbfbf' },
        ].map((s) => (
          <Col xs={12} sm={6} key={s.label}>
            <StatsCard>
              <StatValue color={s.color}>{s.value}</StatValue>
              <Text type="secondary" style={{ fontSize: 12 }}>{s.label}</Text>
            </StatsCard>
          </Col>
        ))}
      </Row>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <TableCard>
        <FilterBar>
          <Search
            placeholder="Search name, phone, or email…"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
            allowClear
          />
          <Select
            placeholder="Gender"
            allowClear
            style={{ width: 130 }}
            onChange={handleGenderFilter}
            value={filters.gender}
          >
            <Option value="Male">Male</Option>
            <Option value="Female">Female</Option>
            <Option value="Other">Other</Option>
          </Select>
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 130 }}
            onChange={handleStatusFilter}
            value={filters.status}
          >
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
            <Option value="all">All</Option>
          </Select>
          <Button icon={<FilterOutlined />} onClick={handleReset} style={{ borderRadius: 6 }}>
            Reset
          </Button>
        </FilterBar>

        <Table
          columns={columns}
          dataSource={patientList}
          rowKey="id"
          loading={listLoading}
          pagination={{
            current:         meta.page,
            pageSize:        meta.per_page,
            total:           meta.total,
            showSizeChanger: true,
            showTotal:       (t) => `${t} patients`,
            style:           { padding: '16px 20px' },
          }}
          onChange={handleTableChange}
          scroll={{ x: 900 }}
          onRow={(record) => ({
            onDoubleClick: () => navigate(`/patients/${record.id}`),
          })}
          style={{ borderRadius: '0 0 12px 12px' }}
        />
      </TableCard>

      {/* ── Drawer ──────────────────────────────────────────────────────────── */}
      <PatientFormDrawer
        open={drawerOpen}
        onClose={handleClose}
        onSubmit={handleFormSubmit}
        initialValues={editTarget}
        loading={formLoading}
        isOnline={isOnline}
      />
    </PageWrapper>
  );
}
