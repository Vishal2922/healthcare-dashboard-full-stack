import React from 'react';
import { useSelector } from 'react-redux';
import styled, { useTheme } from 'styled-components';
import {
  Drawer, Button, Space, Tag, Typography, Descriptions,
  Table, Divider, Alert, Skeleton, Popconfirm,
} from 'antd';
import {
  CheckCircleOutlined, FileTextOutlined, WarningOutlined,
  DownloadOutlined, DisconnectOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import {
  selectSelectedInvoice,
  selectBillingDetailLoading,
} from '../../modules/billing/selectors';

import { downloadInvoicePDF } from '../../utils/invoicePDF';

const { Title, Text } = Typography;

const DrawerHeader = styled.div`
  display: flex; align-items: flex-start; justify-content: space-between;
  flex-wrap: wrap; gap: 12px;
`;
const ItemsTable = styled.div`
  margin: 16px 0;
`;
const TotalSection = styled.div`
  display: flex; flex-direction: column; align-items: flex-end;
  padding: 12px 0;
  border-top: 1px solid #f0f0f0;
  gap: 4px;
`;

const STATUS_CONFIG = {
  paid:          { color: 'success', label: 'Paid',          icon: <CheckCircleOutlined /> },
  unpaid:        { color: 'warning', label: 'Unpaid',        icon: <WarningOutlined /> },
  pending:       { color: 'warning', label: 'Pending',       icon: <WarningOutlined /> },
  overdue:       { color: 'error',   label: 'Overdue',       icon: <WarningOutlined /> },
  cancelled:     { color: 'default', label: 'Cancelled',     icon: <FileTextOutlined /> },
  partially_paid:{ color: 'processing', label: 'Partial',    icon: <CheckCircleOutlined /> },
  refunded:      { color: 'purple',  label: 'Refunded',      icon: <CheckCircleOutlined /> },
};

function formatCurrency(amount) {
  if (!amount && amount !== 0) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(d) {
  return d ? dayjs(d).format('DD MMM YYYY') : '—';
}

const lineItemColumns = [
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    render: (t) => <Text>{t || '—'}</Text>,
  },
  {
    title: 'Qty',
    dataIndex: 'quantity',
    key: 'quantity',
    width: 60,
    align: 'center',
    render: (v) => v ?? 1,
  },
  {
    title: 'Unit Price',
    dataIndex: 'unit_price',
    key: 'unit_price',
    width: 120,
    align: 'right',
    render: (v) => <Text>{formatCurrency(v)}</Text>,
  },
  {
    title: 'Subtotal',
    key: 'subtotal',
    width: 120,
    align: 'right',
    render: (_, r) => (
      <Text strong>{formatCurrency((r.quantity || 1) * (r.unit_price || 0))}</Text>
    ),
  },
];

export default function InvoiceDetailDrawer({
  open,
  onClose,
  onStatusChange,
  canCreate     = false,
  canPay        = false,
  formLoading   = false,
  isOnline      = true,
  userRole      = '',
}) {
  const theme         = useTheme();
  const invoice       = useSelector(selectSelectedInvoice);
  const detailLoading = useSelector(selectBillingDetailLoading);

  const statusCfg = STATUS_CONFIG[invoice?.status] || {
    color: 'default', label: invoice?.status,
  };

  const invoiceNumber = invoice?.invoice_number
    || `INV-${String(invoice?.id || '').padStart(4, '0')}`;

  const handleDownload = () => {
    if (!invoice) return;
    downloadInvoicePDF(invoice, { themeColor: theme.colors.primary });
  };

  const isPending   = invoice?.status === 'unpaid' || invoice?.status === 'pending' || invoice?.status === 'overdue';
  const isCancelled = invoice?.status === 'cancelled';

  return (
    <Drawer
      title={
        <DrawerHeader>
          <div>
            <Title level={5} style={{ margin: 0 }}>
              {invoiceNumber}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Created {formatDate(invoice?.created_at)}
            </Text>
          </div>
          {invoice?.status && (
            <Tag
              color={statusCfg.color}
              icon={statusCfg.icon}
              style={{ borderRadius: 6, fontWeight: 600 }}
            >
              {statusCfg.label}
            </Tag>
          )}
        </DrawerHeader>
      }
      placement="right"
      width={580}
      open={open}
      onClose={onClose}
      footer={
        invoice ? (
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            {/* Download button — always available */}
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              style={{ borderRadius: 6 }}
            >
              Download PDF
            </Button>

            {/* Status action buttons */}
            <Space>
              {canPay && isPending && isOnline && (
                <Popconfirm
                  title="Mark this invoice as paid?"
                  onConfirm={() => {
                    const payload = { id: invoice.id, status: 'paid' };
                    if (userRole === 'Patient') {
                      payload.payment_method = 'other';
                    }
                    onStatusChange(payload);
                  }}
                  okText="Yes, mark paid"
                  cancelText="Cancel"
                >
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    loading={formLoading}
                    style={{
                      borderRadius: 6, fontWeight: 600,
                      background: '#52c41a', borderColor: '#52c41a',
                    }}
                  >
                    Mark as Paid
                  </Button>
                </Popconfirm>
              )}
              {canCreate && !isCancelled && isOnline && (
                <Popconfirm
                  title="Cancel this invoice?"
                  onConfirm={() => onStatusChange({ id: invoice.id, status: 'cancelled' })}
                  okText="Cancel Invoice"
                  cancelText="Keep"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger loading={formLoading} style={{ borderRadius: 6 }}>
                    Cancel Invoice
                  </Button>
                </Popconfirm>
              )}
            </Space>
          </Space>
        ) : null
      }
    >
      {!isOnline && (
        <Alert
          type="warning"
          showIcon
          icon={<DisconnectOutlined />}
          message="Offline — status changes will sync when reconnected."
          style={{ borderRadius: 8, marginBottom: 16 }}
        />
      )}

      {detailLoading || !invoice ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <>
          {/* ── Patient & Invoice Details ────────────────────────────── */}
          <Descriptions column={2} size="small" style={{ marginBottom: 20 }}>
            <Descriptions.Item label="Patient">
              <Text strong>
                {invoice.patient_name
                  || invoice.patient?.name
                  || invoice.patient?.full_name
                  || `ID #${invoice.patient_id}`}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Patient ID">
              #{invoice.patient_id || '—'}
            </Descriptions.Item>
            {invoice.appointment_id && (
              <Descriptions.Item label="Appointment ID">
                #{invoice.appointment_id}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Due Date">
              <Text style={{
                color: isPending && dayjs(invoice.due_date).isBefore(dayjs())
                  ? '#ff4d4f' : 'inherit',
              }}>
                {formatDate(invoice.due_date)}
              </Text>
            </Descriptions.Item>
            {invoice.provider_name && (
              <Descriptions.Item label="Provider">
                {invoice.provider_name}
              </Descriptions.Item>
            )}
            {invoice.payment_method && (
              <Descriptions.Item label="Payment Method">
                {invoice.payment_method}
              </Descriptions.Item>
            )}
            {invoice.paid_at && (
              <Descriptions.Item label="Paid On">
                {formatDate(invoice.paid_at)}
              </Descriptions.Item>
            )}
          </Descriptions>

          <Divider style={{ margin: '0 0 16px' }} />

          {/* ── Line Items ───────────────────────────────────────────── */}
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
            Invoice Items
          </Text>
          <ItemsTable>
            <Table
              columns={lineItemColumns}
              dataSource={
                Array.isArray(invoice.items) && invoice.items.length > 0
                  ? invoice.items
                  : [{ description: 'Medical Services', quantity: 1, unit_price: invoice.amount }]
              }
              rowKey={(r, i) => r.id ?? i}
              pagination={false}
              size="small"
              style={{ borderRadius: 8, overflow: 'hidden' }}
            />
          </ItemsTable>

          {/* ── Total breakdown ──────────────────────────────────────── */}
          <TotalSection>
            {parseFloat(invoice.amount || 0) !== parseFloat(invoice.total_amount || 0) && (
              <>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Subtotal: {formatCurrency(invoice.amount)}
                </Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Tax: {formatCurrency(invoice.tax || 0)}
                </Text>
              </>
            )}
            <Text strong style={{ fontSize: 18 }}>
              Total: {formatCurrency(invoice.total_amount)}
            </Text>
          </TotalSection>

          {/* ── Notes ───────────────────────────────────────────────── */}
          {invoice.notes && (
            <>
              <Divider style={{ margin: '8px 0 12px' }} />
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Notes
              </Text>
              <Text>{invoice.notes}</Text>
            </>
          )}
        </>
      )}
    </Drawer>
  );
}