/**
 * PrescriptionFormDrawer
 *
 * Used by Provider to create a new prescription.
 * Only rendered when userRole === 'Provider' (enforced by parent).
 *
 * Props:
 *   open           → boolean
 *   onClose        → () => void
 *   onSubmit       → (values) => void
 *   initialValues  → null (create) | prescription object (edit)
 *   loading        → boolean
 *   patients       → array of { id, full_name } for the dropdown
 */
import React, { useEffect } from 'react';
import styled from 'styled-components';
import {
  Drawer, Form, Input, Select, Button, Space,
  Divider, Alert, Typography, Row, Col, InputNumber,
} from 'antd';
import {
  MedicineBoxOutlined,
  UserOutlined,
  FileTextOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option }      = Select;
const { TextArea }    = Input;

const SectionLabel = styled(Text)`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #8c8c8c;
  display: block;
  margin: 4px 0 12px;
`;

const DrawerTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export default function PrescriptionFormDrawer({
  open,
  onClose,
  onSubmit,
  initialValues = null,
  loading       = false,
  patients      = [],
}) {
  const [form] = Form.useForm();
  const isEdit = !!initialValues;

  // ── Populate or reset form ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      form.setFieldsValue({
        patient_id:     initialValues.patient_id,
        medicine_name:  initialValues.medicine_name_plain  ?? '',
        dosage:         initialValues.dosage_plain         ?? '',
        duration_days:  initialValues.duration_days        ?? 7,
        notes:          initialValues.notes_plain          ?? '',
        appointment_id: initialValues.appointment_id       ?? undefined,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ duration_days: 7 });
    }
  }, [open, initialValues, isEdit, form]);

  const handleFinish = (values) => {
    onSubmit(isEdit ? { ...values, id: initialValues.id } : values);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={520}
      title={
        <DrawerTitle>
          <Title level={5} style={{ margin: 0 }}>
            {isEdit ? 'Edit Prescription' : 'New Prescription'}
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {isEdit ? 'Update prescription details' : 'Create an encrypted prescription record'}
          </Text>
        </DrawerTitle>
      }
      footer={
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={loading}
            icon={<MedicineBoxOutlined />}
            style={{ borderRadius: 8, fontWeight: 600 }}
          >
            {isEdit ? 'Update Prescription' : 'Create Prescription'}
          </Button>
        </Space>
      }
      destroyOnClose
    >
      <Alert
        type="info"
        showIcon
        title="Sensitive fields (medicine name, dosage) are AES-256 encrypted before storage."
        style={{ borderRadius: 8, marginBottom: 20, fontSize: 12 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        requiredMark={false}
      >
        {/* ── Patient ──────────────────────────────────────────────────────── */}
        <SectionLabel><UserOutlined style={{ marginRight: 6 }} />Patient</SectionLabel>

        <Form.Item
          name="patient_id"
          label="Patient"
          rules={[{ required: true, message: 'Please select a patient' }]}
        >
          <Select
            showSearch
            placeholder="Select patient…"
            optionFilterProp="children"
            style={{ borderRadius: 8 }}
            disabled={isEdit}
          >
            {patients.map((p) => (
              <Option key={p.id} value={p.id}>
                {p.full_name || p.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="appointment_id" label="Linked Appointment (optional)">
          <InputNumber
            placeholder="Appointment ID"
            style={{ width: '100%', borderRadius: 8 }}
            min={1}
          />
        </Form.Item>

        <Divider style={{ margin: '8px 0 16px' }} />

        {/* ── Medicine ─────────────────────────────────────────────────────── */}
        <SectionLabel><MedicineBoxOutlined style={{ marginRight: 6 }} />Prescription Details</SectionLabel>

        <Row gutter={12}>
          <Col span={24}>
            <Form.Item
              name="medicine_name"
              label="Medicine Name"
              rules={[
                { required: true, message: 'Medicine name is required' },
                { min: 3, message: 'At least 3 characters' },
              ]}
            >
              <Input
                placeholder="e.g. Amoxicillin 500mg"
                style={{ borderRadius: 8 }}
                prefix={<MedicineBoxOutlined style={{ color: '#bfbfbf' }} />}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={14}>
            <Form.Item
              name="dosage"
              label="Dosage & Frequency"
              rules={[{ required: true, message: 'Dosage is required' }]}
            >
              <Input
                placeholder="e.g. 1 tablet twice daily"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item
              name="duration_days"
              label="Duration (days)"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                min={1}
                max={365}
                style={{ width: '100%', borderRadius: 8 }}
                placeholder="7"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: '8px 0 16px' }} />

        {/* ── Notes ────────────────────────────────────────────────────────── */}
        <SectionLabel><FileTextOutlined style={{ marginRight: 6 }} />Clinical Notes</SectionLabel>

        <Form.Item name="notes" label="Notes (optional)">
          <TextArea
            rows={3}
            placeholder="Additional instructions, warnings, or observations…"
            style={{ borderRadius: 8 }}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}