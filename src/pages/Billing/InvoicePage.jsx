import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import {
  Table, Button, Input, Select, Tag, Space, Tooltip,
  Popconfirm, Alert, Typography, Row, Col, Card,
  Badge, Dropdown, Statistic, DatePicker, Skeleton,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EyeOutlined,
  DeleteOutlined, ReloadOutlined, WifiOutlined, DisconnectOutlined,
  ClockCircleOutlined, FilterOutlined, MoreOutlined,
  FileTextOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  DollarOutlined, WarningOutlined, DownloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import useBilling from '../../modules/billing/hooks/useBilling';
import {
  fetchInvoicesRequest,
  serveFromCache as billServeFromCache,
  selectBillingMeta,
  selectBillingPageCache,
  selectBillingFilters,
  selectBillingPrefetching,
} from '../../modules/billing/billingSlice';
import usePrefetchPagination from '../../hooks/usePrefetchPagination';
import PaginationBar from '../../components/PaginationBar';
import useDebounce from '../../hooks/useDebounce';
import InvoiceFormDrawer from '../../components/forms/InvoiceFormDrawer';
import InvoiceDetailDrawer from '../../components/forms/InvoiceDetailDrawer';
import { downloadInvoicePDF } from '../../utils/invoicePDF';

const { Title, Text } = Typography;
const { Search }      = Input;
const { Option }      = Select;
const { RangePicker } = DatePicker;

// ─── Styled Components ────────────────────────────────────────────────────────
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
const SummaryCard = styled(Card)`
  border-radius: 12px; border: none;
  box-shadow: 0 1px 6px rgba(0,0,0,0.07);
  .ant-card-body { padding: 20px; }
  .ant-statistic-title { font-size: 13px; font-weight: 500; }
  .ant-statistic-content-value { font-size: 26px; font-weight: 700; }
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

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  paid:          { color: 'success',    label: 'Paid',      icon: <CheckCircleOutlined /> },
  unpaid:        { color: 'warning',    label: 'Unpaid',    icon: <ExclamationCircleOutlined /> },
  pending:       { color: 'warning',    label: 'Pending',   icon: <ExclamationCircleOutlined /> },
  overdue:       { color: 'error',      label: 'Overdue',   icon: <WarningOutlined /> },
  cancelled:     { color: 'default',    label: 'Cancelled', icon: <FileTextOutlined /> },
  partially_paid:{ color: 'processing', label: 'Partial',   icon: <CheckCircleOutlined /> },
  refunded:      { color: 'purple',     label: 'Refunded',  icon: <CheckCircleOutlined /> },
};

function StatusTag({ status }) {
  const cfg = STATUS_CONFIG[status] || { color: 'default', label: status };
  return (
    <Tag color={cfg.color} icon={cfg.icon} style={{ borderRadius: 6, fontWeight: 600, fontSize: 12 }}>
      {cfg.label}
    </Tag>
  );
}

function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(d) {
  return d ? dayjs(d).format('DD MMM YYYY') : '—';
}

// ─── Build dropdown items ─────────────────────────────────────────────────────
function buildMenuItems({ record, onView, onStatusChange, onDelete, onDownload, canWrite, canDelete }) {
  const items = [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'View Details',
      onClick: () => onView(record),
    },
    {
      // Download is always available for any invoice
      key: 'download',
      icon: <DownloadOutlined />,
      label: 'Download PDF',
      onClick: () => onDownload(record),
    },
  ];

  if (canWrite && (record.status === 'unpaid' || record.status === 'pending')) {
    items.push({
      key: 'mark-paid',
      icon: <CheckCircleOutlined />,
      label: 'Mark as Paid',
      onClick: () => onStatusChange({ id: record.id, status: 'paid' }),
    });
  }

  if (canWrite && record.status !== 'cancelled') {
    items.push({
      key: 'cancel',
      icon: <FileTextOutlined />,
      label: 'Cancel Invoice',
      onClick: () => onStatusChange({ id: record.id, status: 'cancelled' }),
    });
  }

  if (canDelete) {
    items.push({ type: 'divider' });
    items.push({
      key: 'delete',
      icon: <DeleteOutlined />,
      danger: true,
      label: (
        <Popconfirm
          title="Delete this invoice?"
          description="This action is permanent."
          onConfirm={(e) => { e?.stopPropagation(); onDelete(record.id); }}
          onCancel={(e) => e?.stopPropagation()}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <span onClick={(e) => e.stopPropagation()}>Delete</span>
        </Popconfirm>
      ),
      onClick: () => {},
    });
  }

  return items;
}

// ─── Table columns ────────────────────────────────────────────────────────────
function buildColumns({ onView, onStatusChange, onDelete, onDownload, canWrite, canDelete }) {
  return [
    {
      title: 'Invoice #',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
      render: (num, record) => (
        <div>
          <Text
            strong
            style={{ cursor: 'pointer', color: '#4f46e5', fontSize: 14 }}
            onClick={() => onView(record)}
          >
            {num || `INV-${String(record.id).padStart(4, '0')}`}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatDate(record.created_at)}
          </Text>
        </div>
      ),
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (_, r) => (
        <div>
          <Text strong style={{ fontSize: 14 }}>
            {r.patient_name || r.patient?.name || r.patient?.full_name || '—'}
          </Text>
          {r.patient_id && (
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              ID #{r.patient_id}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => (
        <Text strong style={{ fontSize: 14, color: '#1a1a1a' }}>
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (due, record) => {
        const isOverdue = ['unpaid', 'pending'].includes(record.status)
          && due && dayjs(due).isBefore(dayjs());
        return (
          <Text style={{ color: isOverdue ? '#ff4d4f' : 'inherit', fontSize: 13 }}>
            {formatDate(due)}
            {isOverdue && <WarningOutlined style={{ marginLeft: 4, color: '#ff4d4f' }} />}
          </Text>
        );
      },
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: buildMenuItems({
              record, onView, onStatusChange, onDelete, onDownload, canWrite, canDelete,
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

// ─── Page Component ───────────────────────────────────────────────────────────
export default function InvoicePage() {
  const dispatch = useDispatch();
  const billing  = useBilling();

  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [searchText,       setSearchText]       = useState('');
  const debouncedSearch = useDebounce(searchText, 400);

  const applyFilters  = billing.accessDenied ? null : billing.applyFilters;
  const fetchInvoices = billing.accessDenied ? null : billing.fetchInvoices;
  const clearFilters  = billing.accessDenied ? null : billing.clearFilters;

  // ── Prefetch pagination (must be before any conditional return) ─────────
  const prefetching = useSelector(selectBillingPrefetching);
  const {
    invoiceList, summary, meta, filters, listLoading, formLoading,
    summaryLoading, error, successMessage, isOnline, pendingCount, isFlushing,
    canWrite, canDelete,
    createInvoice, updateInvoiceStatus, deleteInvoice, fetchInvoiceById,
    selectInvoice, clearInvoice, dismissError, dismissSuccess,
  } = billing.accessDenied ? {} : billing;

  const pagination = usePrefetchPagination({
    fetchAction:          fetchInvoicesRequest,
    metaSelector:         selectBillingMeta,
    pageCacheSelector:    selectBillingPageCache,
    serveFromCacheAction: billServeFromCache,
    listLoading:          listLoading ?? false,
    debounceMs:           200,
    cacheKeyPrefix:       'billing',
    filtersSelector:      selectBillingFilters,
  });

  useEffect(() => {
    if (!applyFilters) return;
    applyFilters({ search: debouncedSearch });
    dispatch(fetchInvoicesRequest({ page: 1, filters: { search: debouncedSearch } }));
  }, [debouncedSearch]); // eslint-disable-line

  useEffect(() => {
    if (!fetchInvoices) return;
    fetchInvoices({ page: 1 });
  }, [fetchInvoices]);

  if (billing.accessDenied) {
    return (
      <PageWrapper>
        <Alert
          type="error"
          showIcon
          message="Access Denied"
          description={`Your role (${billing.userRole}) does not have access to Billing.`}
          style={{ borderRadius: 8, maxWidth: 520, margin: '80px auto' }}
        />
      </PageWrapper>
    );
  }

  const handleView = (record) => {
    selectInvoice(record);
    fetchInvoiceById(record.id);
    setDetailDrawerOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailDrawerOpen(false);
    clearInvoice();
  };

  const handleCreateSubmit = (values) => {
    createInvoice(values);
    setCreateDrawerOpen(false);
  };

  const handleStatusChange = (payload) => {
    updateInvoiceStatus(payload);
  };

  // Direct download from row — no need to open drawer
  const handleDownload = (record) => {
    downloadInvoicePDF(record);
  };

  const handleStatusFilter = (val) => {
    applyFilters({ status: val || null });
    dispatch(fetchInvoicesRequest({ page: 1, filters: { status: val || null } }));
  };

  const handleDateRange = (dates) => {
    const date_from = dates?.[0]?.format('YYYY-MM-DD') || null;
    const date_to   = dates?.[1]?.format('YYYY-MM-DD') || null;
    applyFilters({ date_from, date_to });
    dispatch(fetchInvoicesRequest({ page: 1, filters: { date_from, date_to } }));
  };

  const handleReset = () => {
    setSearchText('');
    clearFilters();
    fetchInvoices({ page: 1 });
  };

  const columns = buildColumns({
    onView:         handleView,
    onStatusChange: handleStatusChange,
    onDelete:       deleteInvoice,
    onDownload:     handleDownload,
    canWrite,
    canDelete,
  });

  return (
    <PageWrapper>
      {/* ── Banners ──────────────────────────────────────────────────── */}
      {!isOnline && (
        <Alert
          type="warning"
          showIcon
          message={pendingCount > 0
            ? `Offline — ${pendingCount} action${pendingCount > 1 ? 's' : ''} queued for sync`
            : "You're offline — changes will sync when reconnected"}
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
      {error && (
        <Alert type="error" showIcon message={error} closable onClose={dismissError}
          style={{ borderRadius: 8, marginBottom: 16 }} />
      )}
      {successMessage && (
        <Alert type="success" showIcon message={successMessage} closable onClose={dismissSuccess}
          style={{ borderRadius: 8, marginBottom: 16 }} />
      )}

      {/* ── Header ───────────────────────────────────────────────────── */}
      <PageHeader>
        <HeaderLeft>
          <PageIcon><DollarOutlined /></PageIcon>
          <div>
            <Title level={4} style={{ margin: 0 }}>Billing & Invoices</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              <Space size={4}>
                {isOnline
                  ? <><WifiOutlined style={{ color: '#52c41a' }} /> Online</>
                  : <><DisconnectOutlined style={{ color: '#faad14' }} /> Offline</>}
                — {meta.total} invoices
              </Space>
            </Text>
          </div>
        </HeaderLeft>
        <Space>
          <Tooltip title="Refresh">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => { fetchInvoices({ page: meta.page }); billing.fetchSummary(); }}
              loading={listLoading}
            />
          </Tooltip>
          {canWrite && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateDrawerOpen(true)}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              New Invoice
            </Button>
          )}
        </Space>
      </PageHeader>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {summaryLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Col xs={12} sm={6} key={i}>
              <SummaryCard><Skeleton active paragraph={{ rows: 1 }} /></SummaryCard>
            </Col>
          ))
        ) : (
          <>
            <Col xs={12} sm={6}>
              <SummaryCard>
                <Statistic
                  title="Total Invoices"
                  value={summary.total_invoices}
                  prefix={<FileTextOutlined style={{ color: '#4f46e5' }} />}
                  valueStyle={{ color: '#4f46e5' }}
                />
              </SummaryCard>
            </Col>
            <Col xs={12} sm={6}>
              <SummaryCard>
                <Statistic
                  title="Paid"
                  value={summary.paid}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </SummaryCard>
            </Col>
            <Col xs={12} sm={6}>
              <SummaryCard>
                <Statistic
                  title="Unpaid / Overdue"
                  value={`${summary.unpaid ?? 0} / ${summary.overdue ?? 0}`}
                  prefix={<WarningOutlined style={{ color: '#faad14' }} />}
                  valueStyle={{ color: '#faad14' }}
                />
              </SummaryCard>
            </Col>
            <Col xs={12} sm={6}>
              <SummaryCard>
                <Statistic
                  title="Revenue This Month"
                  value={summary.revenue_this_month ?? 0}
                  prefix="₹"
                  valueStyle={{ color: '#1890ff' }}
                  precision={0}
                />
              </SummaryCard>
            </Col>
          </>
        )}
      </Row>

      {/* ── Invoice Table ─────────────────────────────────────────────── */}
      <TableCard>
        <FilterBar>
          <Search
            placeholder="Search invoice # or patient…"
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
            onChange={handleStatusFilter}
            value={filters.status}
          >
            <Option value="pending">Pending</Option>
            <Option value="unpaid">Unpaid</Option>
            <Option value="paid">Paid</Option>
            <Option value="overdue">Overdue</Option>
            <Option value="cancelled">Cancelled</Option>
            <Option value="partially_paid">Partial</Option>
          </Select>
          <RangePicker
            style={{ width: 240 }}
            onChange={handleDateRange}
            placeholder={['From date', 'To date']}
          />
          <Button icon={<FilterOutlined />} onClick={handleReset} style={{ borderRadius: 6 }}>
            Reset
          </Button>
        </FilterBar>

        <Table
          columns={columns}
          dataSource={invoiceList}
          rowKey="id"
          loading={listLoading}
          pagination={false}
          scroll={{ x: 800 }}
          onRow={(record) => ({
            onDoubleClick: () => handleView(record),
          })}
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

      {/* ── Create Invoice Drawer ─────────────────────────────────────── */}
      {canWrite && (
        <InvoiceFormDrawer
          open={createDrawerOpen}
          onClose={() => setCreateDrawerOpen(false)}
          onSubmit={handleCreateSubmit}
          loading={formLoading}
          isOnline={isOnline}
        />
      )}

      {/* ── Invoice Detail Drawer ─────────────────────────────────────── */}
      <InvoiceDetailDrawer
        open={detailDrawerOpen}
        onClose={handleCloseDetail}
        onStatusChange={handleStatusChange}
        canWrite={canWrite}
        formLoading={formLoading}
        isOnline={isOnline}
      />
    </PageWrapper>
  );
}