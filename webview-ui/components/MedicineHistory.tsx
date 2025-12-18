import React, { useState } from 'react';
import { Modal, Tabs, Timeline, Statistic, Row, Col, Tag, Calendar, Badge, Typography, Tooltip } from 'antd';
import { 
    CheckCircleOutlined, 
    CloseCircleOutlined, 
    ClockCircleOutlined, 
    MedicineBoxOutlined,
    CalendarOutlined,
    HistoryOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import { Medicine } from './MedicineCard';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface MedicineHistoryProps {
    medicine: Medicine;
    visible: boolean;
    onClose: () => void;
    theme: any;
}

const MedicineHistory: React.FC<MedicineHistoryProps> = ({ medicine, visible, onClose, theme }) => {
    // Calculate stats
    const calculateStats = () => {
        if (!medicine.intakeTracking) return { taken: 0, missed: 0, adherence: 0 };
        
        let takenCount = 0;
        let totalTrackedDays = 0;
        let totalDoses = 0;

        Object.entries(medicine.intakeTracking).forEach(([date, intakes]) => {
            intakes.forEach(taken => {
                if (taken) takenCount++;
            });
            // Assuming if a day is tracked, all doses for that day are accounted for
            // This is a simplification. Ideally we check past dates vs creation date.
        });

        // A better approximation for "Missed"
        // Iterate from creation date (or reasonable start) to today
        // For now, let's just count explicit "taken" vs total possible in tracked days
        // This might be tricky without full history. 
        // Let's stick to what we have: 
        // We can iterate last 30 days.
        
        let missedCount = 0;
        const today = dayjs();
        
        // Check last 30 days
        for (let i = 0; i < 30; i++) {
            const date = today.subtract(i, 'day').format('YYYY-MM-DD');
            const dayIntakes = medicine.intakeTracking?.[date];
            
            if (dayIntakes) {
                dayIntakes.forEach(taken => {
                    if (taken) takenCount++;
                    else missedCount++;
                });
            } else if (i > 0) { // Don't count today as missed if not tracked yet
                // If no record for a past day, assume missed if medicine was active?
                // Let's just count explicit tracking for now to avoid false negatives
            }
        }

        const total = takenCount + missedCount;
        const adherence = total > 0 ? Math.round((takenCount / total) * 100) : 0;

        return { taken: takenCount, missed: missedCount, adherence };
    };

    const stats = calculateStats();

    // Helper to format time to 12h
    const formatTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    };

    // Calendar Cell Render
    const dateCellRender = (value: Dayjs) => {
        const dateStr = value.format('YYYY-MM-DD');
        const intakes = medicine.intakeTracking?.[dateStr];
        
        if (!intakes) return null;

        const takenCount = intakes.filter(t => t).length;
        const totalDoses = medicine.times.length;
        
        let status: 'success' | 'warning' | 'error' = 'error';
        if (takenCount === totalDoses) status = 'success';
        else if (takenCount > 0) status = 'warning';

        return (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {intakes.map((taken, idx) => (
                    <li key={idx}>
                        <Badge 
                            status={taken ? 'success' : 'error'} 
                            text={<span style={{ fontSize: '10px' }}>{formatTime(medicine.times[idx])}</span>} 
                        />
                    </li>
                ))}
            </ul>
        );
    };

    // Timeline Items
    const getTimelineItems = () => {
        const items = [];
        const today = dayjs();
        
        // Add upcoming
        const nextDose = getNextDose();
        if (nextDose) {
            items.push({
                color: 'blue',
                dot: <ClockCircleOutlined style={{ fontSize: '16px' }} />,
                children: (
                    <>
                        <Text strong>Upcoming Dose</Text>
                        <br/>
                        <Text type="secondary">{formatTime(nextDose.time)} - {nextDose.label}</Text>
                        <div style={{ marginTop: 4 }}>
                            <Tag color="blue">{nextDose.food}</Tag>
                        </div>
                    </>
                )
            });
        }

        // Add history (last 7 days)
        for (let i = 0; i < 7; i++) {
            const date = today.subtract(i, 'day');
            const dateStr = date.format('YYYY-MM-DD');
            const intakes = medicine.intakeTracking?.[dateStr];

            if (intakes) {
                intakes.forEach((taken, idx) => {
                    items.push({
                        color: taken ? 'green' : 'red',
                        dot: taken ? <CheckCircleOutlined /> : <CloseCircleOutlined />,
                        children: (
                            <>
                                <Text strong>{date.format('MMM D')} - {formatTime(medicine.times[idx])}</Text>
                                <br/>
                                <Text type="secondary">{taken ? 'Taken on time' : 'Missed dose'}</Text>
                            </>
                        )
                    });
                });
            }
        }
        return items;
    };

    const getNextDose = () => {
        const now = dayjs();
        const currentTime = now.format('HH:mm');
        
        // Check today's remaining times
        for (let i = 0; i < medicine.times.length; i++) {
            if (medicine.times[i] > currentTime) {
                return {
                    time: medicine.times[i],
                    label: 'Today',
                    food: medicine.foodTiming?.[i] || 'After Food'
                };
            }
        }
        
        // Return first time tomorrow
        return {
            time: medicine.times[0],
            label: 'Tomorrow',
            food: medicine.foodTiming?.[0] || 'After Food'
        };
    };

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                        fontSize: '24px', 
                        background: `${medicine.colorTag}20`, 
                        padding: '8px', 
                        borderRadius: '8px',
                        lineHeight: 1
                    }}>
                        {medicine.icon}
                    </div>
                    <div>
                        <Title level={4} style={{ margin: 0 }}>{medicine.name}</Title>
                        <Text type="secondary">{medicine.dosage} • {medicine.frequency}</Text>
                    </div>
                </div>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={700}
            bodyStyle={{ padding: '24px' }}
        >
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col span={8}>
                    <Statistic 
                        title="Adherence" 
                        value={stats.adherence} 
                        suffix="%" 
                        valueStyle={{ color: stats.adherence > 80 ? '#52c41a' : stats.adherence > 50 ? '#faad14' : '#ff4d4f' }}
                        prefix={<CheckCircleOutlined />}
                    />
                </Col>
                <Col span={8}>
                    <Statistic 
                        title="Taken" 
                        value={stats.taken} 
                        valueStyle={{ color: '#52c41a' }}
                    />
                </Col>
                <Col span={8}>
                    <Statistic 
                        title="Missed" 
                        value={stats.missed} 
                        valueStyle={{ color: '#ff4d4f' }}
                    />
                </Col>
            </Row>

            <Tabs
                defaultActiveKey="1"
                items={[
                    {
                        key: '1',
                        label: <span><HistoryOutlined /> Timeline</span>,
                        children: (
                            <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '20px 0' }}>
                                <Timeline mode="left" items={getTimelineItems()} />
                            </div>
                        )
                    },
                    {
                        key: '2',
                        label: <span><CalendarOutlined /> Calendar</span>,
                        children: (
                            <div style={{ border: `1px solid ${theme.neutral.border}`, borderRadius: '8px', padding: '12px' }}>
                                <Calendar 
                                    fullscreen={false} 
                                    dateCellRender={dateCellRender}
                                    disabledDate={(date) => date.isAfter(dayjs())}
                                />
                            </div>
                        )
                    },
                    {
                        key: '3',
                        label: <span><InfoCircleOutlined /> Details</span>,
                        children: (
                            <div style={{ padding: '12px' }}>
                                <Title level={5}>Schedule & Instructions</Title>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                                    <div style={{ padding: '16px', background: theme.neutral.glass, borderRadius: '12px', border: `1px solid ${theme.neutral.border}` }}>
                                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>⏰ Daily Schedule</Text>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {medicine.times.map((time, idx) => (
                                                <div 
                                                    key={idx} 
                                                    style={{ 
                                                        padding: '4px 12px', 
                                                        fontSize: '14px',
                                                        borderRadius: '6px',
                                                        border: `1px solid ${medicine.colorTag}`,
                                                        color: medicine.colorTag,
                                                        background: 'transparent',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    {formatTime(time)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ padding: '16px', background: theme.neutral.glass, borderRadius: '12px', border: `1px solid ${theme.neutral.border}` }}>
                                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>🍽️ Food Instructions</Text>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {medicine.times.map((time, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Text>{formatTime(time)}</Text>
                                                    <Tag color="blue">{medicine.foodTiming?.[idx] || 'After Food'}</Tag>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ padding: '16px', background: theme.neutral.glass, borderRadius: '12px', border: `1px solid ${theme.neutral.border}` }}>
                                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>📅 Duration</Text>
                                        <Text>{medicine.duration}</Text>
                                        {medicine.isRecurring && <Tag color="purple" style={{ marginLeft: '8px' }}>Recurring</Tag>}
                                    </div>
                                </div>
                            </div>
                        )
                    }
                ]}
            />
        </Modal>
    );
};

export default MedicineHistory;
