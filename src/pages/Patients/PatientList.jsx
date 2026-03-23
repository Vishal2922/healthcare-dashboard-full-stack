import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import {
  Table, Button, Input, Select, Tag, Avatar, Space, Tooltip,
  Popconfirm, Alert, Typography, Row, Col, Card, Badge, Dropdown,
} from 'antd';
import {
  UserAddOutlined, SearchOutlined, EyeOutlined, EditOutlined,
  DeleteOutlined, ReloadOutlined, WifiOutlined, DisconnectOutlined,
  ClockCircleOutlined, FilterOutlined, MoreOutlined, UserOutlined,
  ManOutlined, WomanOutlined,
} from '@ant-design/icons';

import usePatients from '../../modules/patients/hooks/usePatients';
import { fetchPatientsRequest } from '../../modules/patients/patientSlice';
import useDebounce from '../../hooks/useDebounce';
import usePermission from '../../hooks/usePermission';
import PatientFormDrawer from '../../components/forms/PatientFormDrawer';

const { Title, Text } = Typography;
const { Search }      = Input;
const { Option }      = Select;

const PageWrapper = styled.div`
  padding: 24px; min-height: 100vh;
  background: ${({ theme }) => theme.colors?.background || '#f7f5f0'};
`;
const PageHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px; flex-wrap: wrap; gap: 16px;
`;
const HeaderLeft = styled.div`display: flex; align-items: center; gap: 12px;`;
const PageIcon = styled.div`
  width: 48px; height: 48px; border-radius: 12px;
  background: ${({ theme }) => theme.colors?.primary || '#4f46e5'};
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; color: #fff; flex-shrink: 0;
`;
const StatsCard = styled(Card)`
  border-radius: 12px; border: none;
  box-shadow: 0 1px 6px rgba(0,0,0,0.07); text-align: center;
  .ant-card-body { padding: 16px 12px; }
`;
const StatValue = styled.div`
  font-size: 28px; font-weight: 700; line-height: 1;
  color: ${({ color }) => color || '#1a1a1a'}; margin-bottom: 4px;
`;
const TableCard = styled(Card)`
  border-radius: 12px; border: none;
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
  .ant-card-body { padding: 0; }
`;
const FilterBar = styled.div`
  display: flex; gap: 12px; padding: 16px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors?.border || '#f0f0f0'};
  flex-wrap: wrap; background: #fff; border-radius: 12px 12px 0 0;
`;
const PatientAvatar = styled(Avatar)`
  background: ${({ $gender }) =>
    $gender === 'Female' ? '#eb2f96' : $gender === 'Male' ? '#1890ff' : '#722ed1'};
  font-weight: 700; font-size: 15px;
`;

const GENDER_COLORS = {
  Male:   { color: '#1890ff', bg: '#e6f7ff' },
  Female: { color: '#eb2f96', bg: '#fff0f6' },
  Other:  { color: '#722ed1', bg: '#f9f0ff' },
};

function GenderTag({ gender }) {
  const cfg  = GENDER_COLORS[gender] || { color: '#8c8c8c', bg: '#fafafa' };
  const icon = gender === 'Male' ? <ManOutlined />
             : gender === 'Female' ? <WomanOutlined />
             : <UserOutlined />;
  return (
    <Tag icon={icon} style={{
      color: cfg.color, background: cfg.bg,
      border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12,
    }}>
      {gender}
    </Tag>
  );
}

function calcAge(dob) {
  if (!dob) return '—';
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function buildMenuItems({ record, navigate, onEdit, onDelete, canDelete, formLoading }) {
  const baseItems = [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'View Profile',
      onClick: () => navigate(`/patients/${record.id}`),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit',
      onClick: () => onEdit(record),
    },
  ];

  if (!canDelete) return baseItems;

  return [
    ...baseItems,
    { type: 'divider' },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      danger: true,
      label: (
        <Popconfirm
          title="Delete this patient?"
          description="This action is permanent and cannot be undone."
          onConfirm={(e) => { e?.stopPropagation(); onDelete(record.id); }}
          onCancel={(e) => e?.stopPropagation()}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true, loading: formLoading }}
        >
          <span onClick={(e) => e.stopPropagation()}>Delete</span>
        </Popconfirm>
      ),
      onClick: () => {},
    },
  ];
}

function buildColumns({ navigate, onEdit, onDelete, canEdit, canDelete, formLoading }) {
  return [
    {
      title: 'Patient', dataIndex: 'full_name', key: 'full_name',
      render: (name, record) => (
        <Space>
          <PatientAvatar $gender={record.gender} size={36}>
            {name?.charAt(0)?.toUpperCase() || 'P'}
          </PatientAvatar>
          <div>
            <div
              style={{ cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
              onClick={() => navigate(`/patients/${record.id}`)}
            >
              {name}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>#{record.id}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Age / DOB', dataIndex: 'dob', key: 'dob',
      render: (dob) => (
        <div>
          <Text strong style={{ fontSize: 14 }}>{calcAge(dob)} yrs</Text><br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dob ? new Date(dob).toLocaleDateString('en-IN') : '—'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Gender', dataIndex: 'gender', key: 'gender',
      render: (g) => g ? <GenderTag gender={g} /> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Contact', key: 'contact',
      render: (_, r) => (
        <div>
          <Text style={{ display: 'block', fontSize: 13 }}>{r.phone || '—'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.email || ''}</Text>
        </div>
      ),
    },
    {
      title: 'Blood Group', dataIndex: 'blood_group', key: 'blood_group',
      render: (bg) => bg
        ? <Tag color="red" style={{ borderRadius: 6, fontWeight: 700 }}>{bg}</Tag>
        : <Text type="secondary">—</Text>,
    },
    {
      title: 'Status', dataIndex: 'is_active', key: 'is_active',
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
      title: '', key: 'actions', width: 60, align: 'center',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: buildMenuItems({
              record, navigate, onEdit, onDelete, canDelete, formLoading,
            }),
          }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button icon={<MoreOutlined />} type="text" size="small" />
        </Dropdown>
      ),
    },
  ];
}

export default function PatientList() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const pts       = usePatients();
  const { can }   = usePermission();

  const canCreate = can('patients', 'create');
  const canEdit   = can('patients', 'edit');
  // FIX: only declared here — was also destructured from pts below causing the build error
  const canDelete = can('patients', 'delete');

  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [searchText,  setSearchText]  = useState('');
  const debouncedSearch = useDebounce(searchText, 400);

  const applyFilters  = pts.accessDenied ? null : pts.applyFilters;
  const fetchPatients = pts.accessDenied ? null : pts.fetchPatients;
  const clearFilters  = pts.accessDenied ? null : pts.clearFilters;

  useEffect(() => {
    if (!applyFilters) return;
    applyFilters({ search: debouncedSearch });
    dispatch(fetchPatientsRequest({ page: 1, filters: { search: debouncedSearch } }));
  }, [debouncedSearch]); // eslint-disable-line

  if (pts.accessDenied) {
    return (
      <PageWrapper>
        <Alert type="error" showIcon message="Access Denied"
          description={`Your role (${pts.userRole}) does not have access to Patient Management.`}
          style={{ borderRadius: 8, maxWidth: 520, margin: '80px auto' }} />
      </PageWrapper>
    );
  }

  // FIX: canDelete removed from here — already declared above
  const {
    patientList, meta, filters, listLoading, formLoading,
    error, successMessage, isOnline, pendingCount, isFlushing,
    createPatient, updatePatient, deletePatient,
    dismissError, dismissSuccess,
  } = pts;

  const handleOpenCreate = () => { setEditTarget(null);    setDrawerOpen(true);  };
  const handleOpenEdit   = (r)  => { setEditTarget(r);     setDrawerOpen(true);  };
  const handleClose      = ()   => { setDrawerOpen(false); setEditTarget(null);  };

  const handleFormSubmit = (values) => {
    editTarget
      ? updatePatient({ id: editTarget.id, ...values })
      : createPatient(values);
    handleClose();
  };

  const handleTableChange = (pag) => {
    fetchPatients({ page: pag.current, per_page: pag.pageSize });
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
    canEdit, canDelete, formLoading,
  });

  const maleCount   = patientList.filter((p) => p.gender === 'Male').length;
  const femaleCount = patientList.filter((p) => p.gender === 'Female').length;

  return (
    <PageWrapper>
      {!isOnline && (
        <Alert type="warning" showIcon
          message={pendingCount > 0
            ? `Offline — ${pendingCount} action${pendingCount > 1 ? 's' : ''} queued`
            : "You're offline — changes will sync when reconnected"}
          style={{ borderRadius: 8, marginBottom: 16 }} />
      )}
      {isFlushing && (
        <Alert type="info" showIcon icon={<ClockCircleOutlined />}
          message={`Syncing ${pendingCount} queued action${pendingCount > 1 ? 's' : ''}…`}
          style={{ borderRadius: 8, marginBottom: 16 }} />
      )}
      {error && (
        <Alert type="error" showIcon message={error} closable onClose={dismissError}
          style={{ borderRadius: 8, marginBottom: 16 }} />
      )}
      {successMessage && (
        <Alert type="success" showIcon message={successMessage} closable onClose={dismissSuccess}
          style={{ borderRadius: 8, marginBottom: 16 }} />
      )}

      <PageHeader>
        <HeaderLeft>
          <PageIcon><UserOutlined /></PageIcon>
          <div>
            <Title level={4} style={{ margin: 0 }}>Patient Management</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              <Space size={4}>
                {isOnline
                  ? <><WifiOutlined style={{ color: '#52c41a' }} /> Online</>
                  : <><DisconnectOutlined style={{ color: '#faad14' }} /> Offline</>}
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
          {canCreate && (
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={handleOpenCreate}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              Register Patient
            </Button>
          )}
        </Space>
      </PageHeader>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Patients', value: meta.total,   color: '#4f46e5' },
          { label: 'Male',           value: maleCount,    color: '#1890ff' },
          { label: 'Female',         value: femaleCount,  color: '#eb2f96' },
          { label: 'Pending Sync',   value: pendingCount, color: pendingCount > 0 ? '#faad14' : '#bfbfbf' },
        ].map((s) => (
          <Col xs={12} sm={6} key={s.label}>
            <StatsCard>
              <StatValue color={s.color}>{s.value}</StatValue>
              <Text type="secondary" style={{ fontSize: 12 }}>{s.label}</Text>
            </StatsCard>
          </Col>
        ))}
      </Row>

      <TableCard>
        <FilterBar>
          <Search placeholder="Search name, phone, or email…" prefix={<SearchOutlined />}
            value={searchText} onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }} allowClear />
          <Select placeholder="Gender" allowClear style={{ width: 130 }}
            onChange={handleGenderFilter} value={filters.gender}>
            <Option value="Male">Male</Option>
            <Option value="Female">Female</Option>
            <Option value="Other">Other</Option>
          </Select>
          <Select placeholder="Status" allowClear style={{ width: 130 }}
            onChange={handleStatusFilter} value={filters.status}>
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
            current: meta.page, pageSize: meta.per_page, total: meta.total,
            showSizeChanger: true, showTotal: (t) => `${t} patients`,
            style: { padding: '16px 20px' },
          }}
          onChange={handleTableChange}
          scroll={{ x: 900 }}
          onRow={(record) => ({
            onDoubleClick: () => navigate(`/patients/${record.id}`),
          })}
          style={{ borderRadius: '0 0 12px 12px' }}
        />
      </TableCard>

      {(canCreate || canEdit) && (
        <PatientFormDrawer
          open={drawerOpen}
          onClose={handleClose}
          onSubmit={handleFormSubmit}
          initialValues={editTarget}
          loading={formLoading}
          isOnline={isOnline}
        />
      )}
    </PageWrapper>
  );
}