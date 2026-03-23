import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import {
  Drawer, Button, Space, Tag, Typography, Descriptions,
  Table, Divider, Alert, Skeleton, Popconfirm, Row, Col, Badge,
} from 'antd';
import {
  CheckCircleOutlined, FileTextOutlined, WarningOutlined,
  PrinterOutlined, DisconnectOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import {
  selectSelectedInvoice,
  selectBillingDetailLoading,
} from '../../modules/billing/selectors';

const { Title, Text } = Typography;

const DrawerHeader = styled.div`
  display: flex; align-items: flex-start; justify-content: space-between;
  flex-wrap: wrap; gap: 12px;
`;
const ItemsTable = styled.div`
  margin: 16px 0;
`;
const TotalSection = styled.div`
  display: flex; justify-content: flex-end;
  padding: 12px 0;
  border-top: 1px solid #f0f0f0;
`;

const STATUS_CONFIG = {
  paid:      { color: 'success', label: 'Paid',      icon: <CheckCircleOutlined /> },
  unpaid:    { color: 'warning', label: 'Unpaid',    icon: <WarningOutlined /> },
  overdue:   { color: 'error',   label: 'Overdue',   icon: <WarningOutlined /> },
  cancelled: { color: 'default', label: 'Cancelled', icon: <FileTextOutlined /> },
};

function formatCurrency(amount) {
  if (!amount && amount !== 0) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(d) {
  return d ? dayjs(d).format('DD MMM YYYY') : '—';
}

const lineItemColumns = [
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    render: (t) => <Text>{t}</Text>,
  },
  {
    title: 'Qty',
    dataIndex: 'quantity',
    key: 'quantity',
    width: 60,
    align: 'center',
  },
  {
    title: 'Unit Price',
    dataIndex: 'unit_price',
    key: 'unit_price',
    width: 110,
    align: 'right',
    render: (v) => <Text>{formatCurrency(v)}</Text>,
  },
  {
    title: 'Subtotal',
    key: 'subtotal',
    width: 110,
    align: 'right',
    render: (_, r) => (
      <Text strong>{formatCurrency((r.quantity || 1) * (r.unit_price || 0))}</Text>
    ),
  },
];

/**
 * InvoiceDetailDrawer — view full invoice + status actions
 *
 * Reads selectedInvoice from Redux store directly (already fetched by InvoicePage).
 */
export default function InvoiceDetailDrawer({
  open,
  onClose,
  onStatusChange,
  canWrite      = false,
  formLoading   = false,
  isOnline      = true,
}) {
  const invoice       = useSelector(selectSelectedInvoice);
  const detailLoading = useSelector(selectBillingDetailLoading);

  const statusCfg = STATUS_CONFIG[invoice?.status] || { color: 'default', label: invoice?.status };

  return (
    <Drawer
      title={
        <DrawerHeader>
          <div>
            <Title level={5} style={{ margin: 0 }}>
              {invoice?.invoice_number || `INV-${String(invoice?.id || '').padStart(4, '0')}`}
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
      width={560}
      open={open}
      onClose={onClose}
      footer={
        canWrite && invoice && invoice.status !== 'cancelled' && isOnline ? (
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            {invoice.status === 'unpaid' || invoice.status === 'overdue' ? (
              <Popconfirm
                title="Mark this invoice as paid?"
                onConfirm={() => onStatusChange({ id: invoice.id, status: 'paid' })}
                okText="Yes, mark paid"
                cancelText="Cancel"
              >
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={formLoading}
                  style={{ borderRadius: 6, fontWeight: 600, background: '#52c41a', borderColor: '#52c41a' }}
                >
                  Mark as Paid
                </Button>
              </Popconfirm>
            ) : null}
            {invoice.status !== 'cancelled' && (
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
          {/* ── Patient & Appointment ──────────────────────────────── */}
          <Descriptions column={2} size="small" style={{ marginBottom: 20 }}>
            <Descriptions.Item label="Patient">
              <Text strong>
                {invoice.patient_name || invoice.patient?.name || invoice.patient?.full_name || `ID #${invoice.patient_id}`}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Patient ID">
              {invoice.patient_id || '—'}
            </Descriptions.Item>
            {invoice.appointment_id && (
              <Descriptions.Item label="Appointment ID">
                #{invoice.appointment_id}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Due Date">
              <Text style={{
                color: invoice.status === 'unpaid' && dayjs(invoice.due_date).isBefore(dayjs())
                  ? '#ff4d4f' : 'inherit',
              }}>
                {formatDate(invoice.due_date)}
              </Text>
            </Descriptions.Item>
            {invoice.payment_method && (
              <Descriptions.Item label="Payment Method">
                {invoice.payment_method}
              </Descriptions.Item>
            )}
          </Descriptions>

          <Divider style={{ margin: '0 0 16px' }} />

          {/* ── Line Items ─────────────────────────────────────────── */}
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
            Invoice Items
          </Text>
          <ItemsTable>
            <Table
              columns={lineItemColumns}
              dataSource={invoice.items || []}
              rowKey={(r, i) => r.id || i}
              pagination={false}
              size="small"
              style={{ borderRadius: 8, overflow: 'hidden' }}
            />
          </ItemsTable>

          {/* ── Total ─────────────────────────────────────────────── */}
          <TotalSection>
            <Text strong style={{ fontSize: 18 }}>
              Total: {formatCurrency(invoice.total_amount)}
            </Text>
          </TotalSection>

          {/* ── Notes ─────────────────────────────────────────────── */}
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
