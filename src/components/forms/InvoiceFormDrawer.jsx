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
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllPatientsRequest,
  selectAllPatients,
  selectAllPatientsLoading,
} from '../../modules/patients/patientSlice';

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
  grid-template-columns: 1fr 80px 110px 32px;
  gap: 8px;
  align-items: flex-start;
  margin-bottom: 8px;
`;
const TotalBox = styled.div`
  background: #f7f9fb;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
`;
const TotalLine = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #4a5568;
  margin-bottom: 4px;
  &:last-child { margin-bottom: 0; font-size: 15px; font-weight: 700; color: #0e1b2a; }
`;

export default function InvoiceFormDrawer({
  open,
  onClose,
  onSubmit,
  loading  = false,
  isOnline = true,
}) {
  const [form]  = Form.useForm();
  const dispatch = useDispatch();
  const patients = useSelector(selectAllPatients);
  const patientsLoading = useSelector(selectAllPatientsLoading);

  const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0 }]);
  const [taxPercent, setTaxPercent] = useState(0);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setItems([{ description: '', quantity: 1, unit_price: 0 }]);
      setTaxPercent(0);
      dispatch(fetchAllPatientsRequest());
    }
  }, [open, form, dispatch]);

  const addItem = () => setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);

  const removeItem = (idx) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, value) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  // Subtotal before tax
  const subtotal = items.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
  }, 0);

  const taxAmount = Math.round(subtotal * ((Number(taxPercent) || 0) / 100) * 100) / 100;
  const grandTotal = Math.round((subtotal + taxAmount) * 100) / 100;

  const handleFinish = (values) => {
    const validItems = items.filter((item) => item.description.trim());
    if (validItems.length === 0) {
      return; // guard — at least one item required
    }

    // FIX: send `amount` (subtotal) and `tax_percent` so backend can validate
    // and recalculate. Also send total_amount for reference.
    onSubmit({
      patient_id:     Number(values.patient_id),
      appointment_id: values.appointment_id ? Number(values.appointment_id) : null,
      due_date:       values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
      payment_method: values.payment_method || null,
      notes:          values.notes || null,
      // These three are what the backend validates and uses:
      amount:         subtotal,
      tax_percent:    Number(taxPercent) || 0,
      total_amount:   grandTotal,
      // Line items sent for reference (backend currently uses amount directly)
      items:          validItems,
    });
  };

  const handleClose = () => {
    form.resetFields();
    setItems([{ description: '', quantity: 1, unit_price: 0 }]);
    setTaxPercent(0);
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
      width={580}
      open={open}
      onClose={handleClose}
      destroyOnClose
      footer={
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong style={{ fontSize: 15 }}>
            Total: ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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

        {/* ── Patient & Appointment ─────────────────────────────────────── */}
        <SectionLabel>Patient Details</SectionLabel>
        <Row gutter={12}>
          <Col span={14}>
            <Form.Item
              name="patient_id"
              label="Patient"
              rules={[{ required: true, message: 'Please select a patient' }]}
            >
              <Select
                showSearch
                placeholder="Select patient name"
                loading={patientsLoading}
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={patients.map(p => ({
                  value: p.id,
                  label: p.full_name || p.name
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item
              name="appointment_id"
              label="Appointment ID (optional)"
            >
              <Input placeholder="e.g. 15" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              name="due_date"
              label="Due Date"
              rules={[{ required: true, message: 'Due date is required' }]}
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

        {/* ── Line Items ────────────────────────────────────────────────── */}
        <SectionLabel>Invoice Items</SectionLabel>

        <div style={{ marginBottom: 6 }}>
          <Row gutter={8}>
            <Col flex="1"><Text type="secondary" style={{ fontSize: 12 }}>Description</Text></Col>
            <Col style={{ width: 80 }}><Text type="secondary" style={{ fontSize: 12 }}>Qty</Text></Col>
            <Col style={{ width: 110 }}><Text type="secondary" style={{ fontSize: 12 }}>Unit Price (₹)</Text></Col>
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
              onChange={(v) => updateItem(idx, 'quantity', v ?? 1)}
              style={{ width: '100%' }}
            />
            <InputNumber
              min={0}
              precision={2}
              value={item.unit_price}
              onChange={(v) => updateItem(idx, 'unit_price', v ?? 0)}
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

        {/* ── Tax & Total ───────────────────────────────────────────────── */}
        <Row gutter={12} style={{ marginBottom: 12 }}>
          <Col span={10}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Tax %
            </Text>
            <InputNumber
              min={0}
              max={100}
              precision={2}
              value={taxPercent}
              onChange={(v) => setTaxPercent(v ?? 0)}
              style={{ width: '100%' }}
              placeholder="0"
            />
          </Col>
        </Row>

        <TotalBox>
          <TotalLine>
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </TotalLine>
          {taxAmount > 0 && (
            <TotalLine>
              <span>Tax ({taxPercent}%)</span>
              <span>₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </TotalLine>
          )}
          <TotalLine>
            <span>Total</span>
            <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </TotalLine>
        </TotalBox>

        <Divider style={{ margin: '4px 0 16px' }} />

        {/* ── Notes ─────────────────────────────────────────────────────── */}
        <Form.Item name="notes" label="Notes (optional)">
          <TextArea rows={2} placeholder="Any additional notes for this invoice…" />
        </Form.Item>

      </Form>
    </Drawer>
  );
}