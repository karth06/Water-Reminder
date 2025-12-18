import React, { useEffect, useRef } from 'react';
import { Medicine } from './MedicineCard';
import { Form, Input, Select, TimePicker, Button, Checkbox, Space, Row, Col, Card, Typography } from 'antd';
import { MinusCircleOutlined, PlusOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

interface MedicineFormProps {
    medicine?: Medicine;
    onSave: (medicine: Medicine) => void;
    onCancel: () => void;
    theme: any;
}

const PRESET_COLORS = [
    '#6B9BD1', '#A8C5A1', '#E8B86D', '#E89B7C', '#B8A8D4', '#7dd3c0', '#f9c74f', '#ff6b9d'
];

const PRESET_ICONS = ['💊', '💉', '🩹', '🧪', '⚕️', '🏥', '💚', '❤️', '🌟', '✨', '🦋', '🌸'];

const PRESET_FREQUENCIES = [
    'Once daily', 'Twice daily', 'Three times daily', 'Four times daily',
    'Every 4 hours', 'Every 6 hours', 'Every 8 hours', 'Every 12 hours',
    'As needed', 'Weekly', 'Custom'
];

const PRESET_DURATIONS = [
    '3 days', '5 days', '7 days', '10 days', '14 days', '1 month', '3 months', '6 months', 'Ongoing', 'Custom'
];

const MedicineForm: React.FC<MedicineFormProps> = ({ medicine, onSave, onCancel, theme }) => {
    const [form] = Form.useForm();
    const formRef = useRef<HTMLDivElement>(null);
    const selectedIcon = Form.useWatch('icon', form);
    const selectedColor = Form.useWatch('colorTag', form);
    const selectedDurationUnit = Form.useWatch('durationUnit', form);

    useEffect(() => {
        // Entrance animation
        if (formRef.current) {
            formRef.current.style.opacity = '0';
            formRef.current.style.transform = 'translateY(20px)';
            requestAnimationFrame(() => {
                if (formRef.current) {
                    formRef.current.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                    formRef.current.style.opacity = '1';
                    formRef.current.style.transform = 'translateY(0)';
                }
            });
        }
    }, []);

    const onFinish = (values: any) => {
        // Helper to determine period from time
        const getPeriod = (time: dayjs.Dayjs) => {
            const hour = time.hour();
            if (hour >= 5 && hour < 12) return 'morning';
            if (hour >= 12 && hour < 17) return 'afternoon';
            if (hour >= 17 && hour < 21) return 'evening';
            return 'night';
        };

        // Transform form values to Medicine object
        const times = values.reminders.map((r: any) => r.time ? r.time.format('HH:mm') : '08:00');
        const timesOfDay = values.reminders.map((r: any) => r.time ? getPeriod(r.time) : 'morning');
        const foodTiming = values.reminders.map((r: any) => r.foodTiming || 'after-food');

        // Construct duration string
        let duration = 'Ongoing';
        if (values.durationUnit !== 'Ongoing') {
            const val = values.durationValue;
            const unit = values.durationUnit; // 'days' or 'months'
            // Handle singular/plural
            let finalUnit = unit;
            if (parseInt(val) === 1) {
                if (unit === 'days') finalUnit = 'day';
                if (unit === 'months') finalUnit = 'month';
            }
            duration = `${val} ${finalUnit}`;
        }

        const medicineData: Medicine = {
            id: medicine?.id || `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: values.name,
            dosage: values.dosage,
            frequency: values.frequency,
            times: times,
            timesOfDay: timesOfDay,
            foodTiming: foodTiming,
            notes: values.notes || '',
            duration: duration,
            isRecurring: values.durationUnit === 'Ongoing',
            colorTag: values.colorTag,
            icon: values.icon,
            isActive: medicine?.isActive ?? true,
            createdAt: medicine?.createdAt || Date.now(),
            currentQuantity: values.currentQuantity ? parseInt(values.currentQuantity) : undefined,
            totalQuantity: values.totalQuantity ? parseInt(values.totalQuantity) : undefined,
            refillThreshold: values.refillThreshold ? parseInt(values.refillThreshold) : undefined
        };

        onSave(medicineData);
    };

    // Parse existing duration
    const parseDuration = (dur: string) => {
        if (!dur || dur === 'Ongoing' || dur === 'Custom') return { value: undefined, unit: 'Ongoing' };
        const match = dur.match(/^(\d+)\s+(day|days|month|months)$/);
        if (match) {
            let unit = match[2];
            if (unit === 'day') unit = 'days';
            if (unit === 'month') unit = 'months';
            return { value: match[1], unit: unit };
        }
        return { value: 7, unit: 'days' };
    };

    const { value: initVal, unit: initUnit } = medicine ? parseDuration(medicine.duration) : { value: 7, unit: 'days' };

    const initialValues = medicine ? {
        name: medicine.name,
        dosage: medicine.dosage,
        frequency: medicine.frequency,
        durationValue: initVal,
        durationUnit: initUnit,
        isRecurring: medicine.isRecurring,
        colorTag: medicine.colorTag,
        icon: medicine.icon,
        notes: medicine.notes,
        reminders: medicine.times.map((t, i) => ({
            time: dayjs(t, 'HH:mm'),
            foodTiming: medicine.foodTiming[i]
        }))
    } : {
        frequency: 'Once daily',
        durationValue: 7,
        durationUnit: 'days',
        colorTag: PRESET_COLORS[0],
        icon: '💊',
        reminders: [{ time: dayjs('08:00', 'HH:mm'), foodTiming: 'after-food' }]
    };

    return (
        <div ref={formRef} style={{
            padding: '24px',
            background: theme.neutral.glass,
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: '20px',
            border: `1px solid ${theme.neutral.border}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            maxHeight: '85vh',
            overflowY: 'auto',
            overflowX: 'hidden'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <Title level={4} style={{ margin: 0, color: theme.neutral.text }}>
                    {medicine ? '✏️ Edit Medicine' : '➕ Add New Medicine'}
                </Title>
                <Button type="text" icon={<CloseOutlined />} onClick={onCancel} style={{ color: theme.neutral.text }} />
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={initialValues}
                requiredMark="optional"
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="name" label="Medicine Name" rules={[{ required: true, message: 'Please enter medicine name' }]}>
                            <Input placeholder="e.g., Aspirin" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="dosage" label="Dosage" rules={[{ required: true, message: 'Please enter dosage' }]}>
                            <Input placeholder="e.g., 500mg" />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item label="Icon & Color">
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Form.Item name="icon" noStyle>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                {PRESET_ICONS.map(ico => (
                                    <div
                                        key={ico}
                                        onClick={() => form.setFieldsValue({ icon: ico })}
                                        style={{
                                            cursor: 'pointer',
                                            padding: '8px',
                                            borderRadius: '8px',
                                            border: selectedIcon === ico ? `2px solid ${theme.primary.base}` : `1px solid ${theme.neutral.border}`,
                                            background: selectedIcon === ico ? theme.primary.glass : 'transparent',
                                            fontSize: '20px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {ico}
                                    </div>
                                ))}
                            </div>
                        </Form.Item>
                        <Form.Item name="colorTag" noStyle>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {PRESET_COLORS.map(color => (
                                    <div
                                        key={color}
                                        onClick={() => form.setFieldsValue({ colorTag: color })}
                                        style={{
                                            cursor: 'pointer',
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            background: color,
                                            border: selectedColor === color ? `3px solid ${theme.neutral.text}` : '2px solid transparent',
                                            boxShadow: selectedColor === color ? '0 0 10px rgba(0,0,0,0.3)' : 'none',
                                            transition: 'all 0.2s'
                                        }}
                                    />
                                ))}
                            </div>
                        </Form.Item>
                    </Space>
                </Form.Item>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="frequency" label="Frequency">
                            <Select>
                                {PRESET_FREQUENCIES.map(f => <Option key={f} value={f}>{f}</Option>)}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Duration" required style={{ marginBottom: 0 }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Form.Item
                                    name="durationValue"
                                    rules={[{ required: selectedDurationUnit !== 'Ongoing', message: 'Required' }]}
                                    style={{ flex: 1, marginBottom: 24 }}
                                >
                                    <Input 
                                        type="number" 
                                        placeholder="Num" 
                                        disabled={selectedDurationUnit === 'Ongoing'}
                                        min={1}
                                    />
                                </Form.Item>
                                <Form.Item
                                    name="durationUnit"
                                    rules={[{ required: true }]}
                                    style={{ width: '120px', marginBottom: 24 }}
                                >
                                    <Select>
                                        <Option value="days">Days</Option>
                                        <Option value="months">Months</Option>
                                        <Option value="Ongoing">Ongoing</Option>
                                    </Select>
                                </Form.Item>
                            </div>
                        </Form.Item>
                    </Col>
                </Row>

                {/* Refill Tracking Section */}
                <div style={{ marginBottom: 24, padding: 16, background: theme.neutral.glass, borderRadius: 8, border: `1px solid ${theme.neutral.border}` }}>
                    <Text strong style={{ display: 'block', marginBottom: 16, color: theme.neutral.text }}>📦 Refill Tracking (Optional)</Text>
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Form.Item name="currentQuantity" label="Current Stock" style={{ marginBottom: 0 }}>
                                <Input type="number" placeholder="e.g. 30" min={0} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="totalQuantity" label="Full Refill Size" style={{ marginBottom: 0 }}>
                                <Input type="number" placeholder="e.g. 100" min={1} />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="refillThreshold" label="Low Stock Alert Threshold" style={{ marginBottom: 0 }}>
                                <Input type="number" placeholder="e.g. 5" min={1} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>

                <Form.List name="reminders">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }, index) => (
                                <Card 
                                    key={key} 
                                    size="small" 
                                    style={{ marginBottom: 16, background: theme.neutral.glass, borderColor: theme.neutral.border }}
                                    title={<Text strong style={{ color: theme.neutral.text }}>Reminder #{index + 1}</Text>}
                                    extra={fields.length > 1 ? <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f', cursor: 'pointer' }} /> : null}
                                >
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'time']}
                                                label="Time"
                                                rules={[{ required: true, message: 'Missing time' }]}
                                            >
                                                <TimePicker use12Hours format="h:mm a" style={{ width: '100%' }} inputReadOnly />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'foodTiming']}
                                                label="Food"
                                            >
                                                <Select>
                                                    <Option value="before-food">Before Food</Option>
                                                    <Option value="after-food">After Food</Option>
                                                    <Option value="with-food">With Food</Option>
                                                    <Option value="empty-stomach">Empty Stomach</Option>
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>
                            ))}
                            <Form.Item>
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                    Add Reminder Time
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>

                <Form.Item name="notes" label="Instructions / Notes">
                    <TextArea rows={3} placeholder="e.g., Take with plenty of water" />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Button onClick={onCancel} style={{ flex: 1 }} size="large">
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} style={{ flex: 1 }} size="large">
                            {medicine ? 'Update Medicine' : 'Add Medicine'}
                        </Button>
                    </div>
                </Form.Item>
            </Form>
        </div>
    );
};

export default MedicineForm;
