import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  Drawer, Form, Input, Button, Space, Alert, Typography,
  Row, Col, DatePicker, Divider, InputNumber, Select,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, DisconnectOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea }    = Input;
const { Option }      = Select;

const DrawerTitle = styled.div`
  display: flex; flex-direction: column; gap: 2px;
`;
const SectionLabel = styled(Text)`
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.8px; color: #8c8c8c; display: block; margin-bottom: 12px;
`;
const LineItemRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 80px 100px 32px;
  gap: 8px;
  align-items: flex-start;
  margin-bottom: 8px;
`;
const TotalRow = styled.div`
  display: flex; justify-content: flex-end;
  padding: 12px 0; font-size: 16px; font-weight: 700;
`;

/**
 * InvoiceFormDrawer — Create new invoice
 * Line items: description, quantity, unit_price
 * Total calculated client-side (confirmed by backend)
 */
export default function InvoiceFormDrawer({
  open,
  onClose,
  onSubmit,
  loading  = false,
  isOnline = true,
}) {
  const [form]  = Form.useForm();
  const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0 }]);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setItems([{ description: '', quantity: 1, unit_price: 0 }]);
    }
  }, [open, form]);

  const addItem = () => setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);

  const removeItem = (idx) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, value) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const total = items.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
  }, 0);

  const handleFinish = (values) => {
    const validItems = items.filter((item) => item.description.trim());
    if (validItems.length === 0) return;
    onSubmit({
      ...values,
      due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
      items: validItems,
      total_amount: total,
    });
  };

  const handleClose = () => {
    form.resetFields();
    setItems([{ description: '', quantity: 1, unit_price: 0 }]);
    onClose();
  };

  return (
    <Drawer
      title={
        <DrawerTitle>
          <Title level={5} style={{ margin: 0 }}>Create New Invoice</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Fill in the details to generate an invoice
          </Text>
        </DrawerTitle>
      }
      placement="right"
      width={560}
      open={open}
      onClose={handleClose}
      destroyOnClose
      footer={
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong style={{ fontSize: 15 }}>
            Total: ₹{total.toLocaleString('en-IN')}
          </Text>
          <Space>
            <Button onClick={handleClose} style={{ borderRadius: 6 }}>Cancel</Button>
            <Button
              type="primary"
              loading={loading}
              onClick={() => form.submit()}
              style={{ borderRadius: 6, fontWeight: 600 }}
            >
              Create Invoice
            </Button>
          </Space>
        </Space>
      }
    >
      {!isOnline && (
        <Alert
          type="warning"
          showIcon
          icon={<DisconnectOutlined />}
          message="Offline mode — invoice will be queued and synced automatically."
          style={{ borderRadius: 8, marginBottom: 20 }}
        />
      )}

      <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark={false}>

        {/* ── Patient & Appointment ──────────────────────────────────── */}
        <SectionLabel>Patient Details</SectionLabel>
        <Row gutter={12}>
          <Col span={14}>
            <Form.Item
              name="patient_id"
              label="Patient ID"
              rules={[{ required: true, message: 'Patient ID required' }]}
            >
              <Input placeholder="e.g. 42" type="number" />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item name="appointment_id" label="Appointment ID (optional)">
              <Input placeholder="e.g. 15" type="number" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              name="due_date"
              label="Due Date"
              rules={[{ required: true, message: 'Due date required' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                disabledDate={(d) => d && d.isBefore(dayjs(), 'day')}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="payment_method" label="Payment Method">
              <Select placeholder="Select method" allowClear>
                <Option value="cash">Cash</Option>
                <Option value="card">Card</Option>
                <Option value="upi">UPI</Option>
                <Option value="insurance">Insurance</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: '4px 0 16px' }} />

        {/* ── Line Items ─────────────────────────────────────────────── */}
        <SectionLabel>Invoice Items</SectionLabel>

        <div style={{ marginBottom: 4 }}>
          <Row gutter={8}>
            <Col flex="1"><Text type="secondary" style={{ fontSize: 12 }}>Description</Text></Col>
            <Col style={{ width: 80 }}><Text type="secondary" style={{ fontSize: 12 }}>Qty</Text></Col>
            <Col style={{ width: 100 }}><Text type="secondary" style={{ fontSize: 12 }}>Unit Price (₹)</Text></Col>
            <Col style={{ width: 32 }} />
          </Row>
        </div>

        {items.map((item, idx) => (
          <LineItemRow key={idx}>
            <Input
              placeholder="e.g. Consultation fee"
              value={item.description}
              onChange={(e) => updateItem(idx, 'description', e.target.value)}
            />
            <InputNumber
              min={1}
              value={item.quantity}
              onChange={(v) => updateItem(idx, 'quantity', v)}
              style={{ width: '100%' }}
            />
            <InputNumber
              min={0}
              value={item.unit_price}
              onChange={(v) => updateItem(idx, 'unit_price', v)}
              style={{ width: '100%' }}
            />
            <Button
              icon={<DeleteOutlined />}
              type="text"
              danger
              size="small"
              onClick={() => removeItem(idx)}
              disabled={items.length === 1}
            />
          </LineItemRow>
        ))}

        <Button
          icon={<PlusOutlined />}
          type="dashed"
          onClick={addItem}
          style={{ width: '100%', marginBottom: 16, borderRadius: 6 }}
        >
          Add Item
        </Button>

        <TotalRow>
          <Text strong style={{ fontSize: 16 }}>
            Total: ₹{total.toLocaleString('en-IN')}
          </Text>
        </TotalRow>

        <Divider style={{ margin: '4px 0 16px' }} />

        {/* ── Notes ─────────────────────────────────────────────────── */}
        <Form.Item name="notes" label="Notes (optional)">
          <TextArea rows={2} placeholder="Any additional notes for this invoice…" />
        </Form.Item>

      </Form>
    </Drawer>
  );
}
