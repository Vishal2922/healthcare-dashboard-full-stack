import React, { useEffect } from 'react';
import styled from 'styled-components';
import {
  Drawer, Form, Input, Select, Button, Space, Divider,
  Alert, Typography, Row, Col, DatePicker,
} from 'antd';
import {
  UserOutlined, MailOutlined, PhoneOutlined,
  EnvironmentOutlined, DisconnectOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

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

/**
 * PatientFormDrawer
 *
 * Used from both PatientList (create/edit) and PatientProfile (edit).
 *
 * Props:
 *   open          → boolean
 *   onClose       → () => void
 *   onSubmit      → (values) => void  — caller handles dispatch
 *   initialValues → null (create) | patient object (edit)
 *   loading       → boolean
 *   isOnline      → boolean
 */
export default function PatientFormDrawer({
  open,
  onClose,
  onSubmit,
  initialValues = null,
  loading       = false,
  isOnline      = true,
}) {
  const [form]  = Form.useForm();
  const isEdit  = !!initialValues;

  // ── Populate form when editing ────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    if (isEdit) {
      form.setFieldsValue({
        full_name:           initialValues.full_name,
        dob:                 initialValues.dob ? dayjs(initialValues.dob) : null,
        gender:              initialValues.gender,
        phone:               initialValues.phone        || '',
        email:               initialValues.email        || '',
        address:             initialValues.address      || '',
        blood_group:         initialValues.blood_group  || undefined,
        emergency_contact:   initialValues.emergency_contact || '',
        allergies:           initialValues.allergies    || '',
        chronic_conditions:  initialValues.chronic_conditions || '',
        current_medications: initialValues.current_medications || '',
        notes:               initialValues.notes        || '',
      });
    } else {
      form.resetFields();
    }
  }, [open, initialValues, isEdit, form]);

  const handleFinish = (values) => {
    const payload = {
      ...values,
      dob: values.dob ? values.dob.format('YYYY-MM-DD') : null,
    };
    onSubmit(payload);
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      title={
        <DrawerTitle>
          <Title level={5} style={{ margin: 0 }}>
            {isEdit ? 'Edit Patient Record' : 'Register New Patient'}
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {isEdit
              ? `Editing: ${initialValues?.full_name}`
              : 'Enter patient details to create a new record'}
          </Text>
        </DrawerTitle>
      }
      placement="right"
      width={520}
      open={open}
      onClose={handleClose}
      destroyOnClose
      footer={
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} style={{ borderRadius: 6 }}>Cancel</Button>
          <Button
            type="primary"
            loading={loading}
            onClick={() => form.submit()}
            style={{ borderRadius: 6, fontWeight: 600 }}
          >
            {isEdit ? 'Save Changes' : 'Register Patient'}
          </Button>
        </Space>
      }
    >
      {!isOnline && (
        <Alert
          type="warning"
          showIcon
          icon={<DisconnectOutlined />}
          message="Offline mode"
          description="This action will be queued and synced automatically when reconnected."
          style={{ borderRadius: 8, marginBottom: 20 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        requiredMark={false}
        size="middle"
      >
        {/* ── Basic Info ──────────────────────────────────────────────────── */}
        <SectionLabel>Basic Information</SectionLabel>
        <Form.Item
          name="full_name"
          label="Full Name"
          rules={[
            { required: true, message: 'Full name is required' },
            { min: 2,         message: 'At least 2 characters' },
          ]}
        >
          <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Patient full name" />
        </Form.Item>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              name="dob"
              label="Date of Birth"
              rules={[{ required: true, message: 'Date of birth required' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="DD/MM/YYYY"
                disabledDate={(d) => d && d.isAfter(dayjs())}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="gender"
              label="Gender"
              rules={[{ required: true, message: 'Gender required' }]}
            >
              <Select placeholder="Select gender">
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              name="blood_group"
              label="Blood Group"
            >
              <Select placeholder="Select" allowClear>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((bg) => (
                  <Option key={bg} value={bg}>{bg}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[
                { required: true, message: 'Phone number required' },
                { pattern: /^[0-9+\-\s()]{7,15}$/, message: 'Enter valid phone' },
              ]}
            >
              <Input prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="+91 98765 43210" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="email"
          label="Email Address"
          rules={[{ type: 'email', message: 'Enter valid email' }]}
        >
          <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="patient@email.com" />
        </Form.Item>

        <Form.Item name="address" label="Address">
          <Input prefix={<EnvironmentOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Street, City, State" />
        </Form.Item>

        <Form.Item name="emergency_contact" label="Emergency Contact">
          <Input prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Name — +91 xxxxx xxxxx" />
        </Form.Item>

        <Divider style={{ margin: '8px 0 16px' }} />

        {/* ── Medical History ─────────────────────────────────────────────── */}
        <SectionLabel>Medical History (Optional)</SectionLabel>

        <Form.Item name="allergies" label="Known Allergies">
          <TextArea rows={2} placeholder="e.g. Penicillin, Pollen…" />
        </Form.Item>

        <Form.Item name="chronic_conditions" label="Chronic Conditions">
          <TextArea rows={2} placeholder="e.g. Diabetes Type 2, Hypertension…" />
        </Form.Item>

        <Form.Item name="current_medications" label="Current Medications">
          <TextArea rows={2} placeholder="e.g. Metformin 500mg twice daily…" />
        </Form.Item>

        <Form.Item name="notes" label="Clinical Notes">
          <TextArea rows={3} placeholder="Any additional notes for the care team…" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
