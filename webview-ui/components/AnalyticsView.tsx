import React from 'react';
import { Card, Typography, Progress, Row, Col, Statistic, Tooltip } from 'antd';
import { LineChartOutlined, MedicineBoxOutlined, TrophyOutlined, FireOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface AnalyticsViewProps {
    theme: any;
    waterHistory: { [date: string]: number };
    dailyGoal: number;
    medicines: any[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ theme, waterHistory, dailyGoal, medicines }) => {
    // --- Water Analytics ---
    const today = new Date().toISOString().split('T')[0];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
    });

    const waterData = last7Days.map(date => ({
        date,
        amount: waterHistory[date] || 0,
        label: new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
    }));

    const currentStreak = (() => {
        let streak = 0;
        const dates = Object.keys(waterHistory).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        for (const date of dates) {
            if (waterHistory[date] >= dailyGoal) streak++;
            else if (date !== today) break; // Don't break if today isn't finished yet
        }
        return streak;
    })();

    const totalWaterIntake = Object.values(waterHistory).reduce((a, b) => a + b, 0);

    // --- Medicine Analytics ---
    const medicineStats = medicines.map(med => {
        if (!med.intakeTracking) return { name: med.name, adherence: 0 };
        
        let taken = 0;
        let total = 0;
        Object.values(med.intakeTracking).forEach((day: any) => {
            if (Array.isArray(day)) {
                total += day.length;
                taken += day.filter((t: boolean) => t).length;
            }
        });
        
        return {
            name: med.name,
            adherence: total > 0 ? Math.round((taken / total) * 100) : 0
        };
    });

    const overallAdherence = medicineStats.length > 0 
        ? Math.round(medicineStats.reduce((acc, curr) => acc + curr.adherence, 0) / medicineStats.length)
        : 0;

    return (
        <div style={{ padding: '0 4px 24px 4px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0, color: theme.neutral.text, fontSize: '24px' }}>
                    Health Analytics
                </Title>
                <Text style={{ color: theme.neutral.textSoft }}>Your progress at a glance</Text>
            </div>

            {/* Key Stats Row */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={12}>
                    <Card 
                        bordered={false}
                        style={{ 
                            background: theme.neutral.glass, 
                            border: `1px solid ${theme.neutral.border}`,
                            textAlign: 'center'
                        }}
                    >
                        <Statistic 
                            title={<Text style={{ color: theme.neutral.textSoft }}>Hydration Streak</Text>}
                            value={currentStreak}
                            suffix="days"
                            prefix={<FireOutlined style={{ color: theme.accent.amber }} />}
                            valueStyle={{ color: theme.neutral.text }}
                        />
                    </Card>
                </Col>
                <Col span={12}>
                    <Card 
                        bordered={false}
                        style={{ 
                            background: theme.neutral.glass, 
                            border: `1px solid ${theme.neutral.border}`,
                            textAlign: 'center'
                        }}
                    >
                        <Statistic 
                            title={<Text style={{ color: theme.neutral.textSoft }}>Med Adherence</Text>}
                            value={overallAdherence}
                            suffix="%"
                            prefix={<MedicineBoxOutlined style={{ color: theme.accent.sage }} />}
                            valueStyle={{ color: theme.neutral.text }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Water Chart */}
            <Card 
                title={<span style={{ color: theme.neutral.text }}><LineChartOutlined /> Hydration History (Last 7 Days)</span>}
                bordered={false}
                style={{ 
                    background: theme.neutral.glass, 
                    border: `1px solid ${theme.neutral.border}`,
                    marginBottom: 24
                }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '150px', gap: '8px', paddingTop: '20px' }}>
                    {waterData.map((d, i) => {
                        const percent = Math.min(100, (d.amount / dailyGoal) * 100);
                        return (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                                <div style={{ 
                                    flex: 1, 
                                    width: '100%', 
                                    display: 'flex', 
                                    alignItems: 'flex-end', 
                                    justifyContent: 'center',
                                    position: 'relative'
                                }}>
                                    <Tooltip title={`${d.amount} / ${dailyGoal} ml`}>
                                        <div style={{ 
                                            width: '60%', 
                                            height: `${percent}%`, 
                                            background: percent >= 100 ? theme.success.base : theme.primary.base,
                                            borderRadius: '4px 4px 0 0',
                                            transition: 'height 0.5s ease',
                                            minHeight: d.amount > 0 ? '4px' : '0'
                                        }} />
                                    </Tooltip>
                                </div>
                                <Text style={{ fontSize: '10px', color: theme.neutral.textSoft, marginTop: '8px' }}>{d.label}</Text>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Medicine Adherence List */}
            <Card 
                title={<span style={{ color: theme.neutral.text }}><TrophyOutlined /> Medicine Consistency</span>}
                bordered={false}
                style={{ 
                    background: theme.neutral.glass, 
                    border: `1px solid ${theme.neutral.border}`
                }}
            >
                {medicineStats.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {medicineStats.map((med, i) => (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <Text style={{ color: theme.neutral.text }}>{med.name}</Text>
                                    <Text style={{ color: theme.neutral.textSoft }}>{med.adherence}%</Text>
                                </div>
                                <Progress 
                                    percent={med.adherence} 
                                    showInfo={false} 
                                    strokeColor={med.adherence > 80 ? theme.success.base : theme.accent.amber} 
                                    trailColor={theme.neutral.border}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <Text style={{ color: theme.neutral.textSoft, fontStyle: 'italic' }}>No medicines tracked yet.</Text>
                )}
            </Card>
        </div>
    );
};

export default AnalyticsView;