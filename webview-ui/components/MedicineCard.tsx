import React, { useState, useRef, useEffect } from 'react';
import { Tag, Tooltip, Checkbox, Button } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, EditOutlined, DeleteOutlined, HistoryOutlined } from '@ant-design/icons';
import MedicineHistory from './MedicineHistory';

export interface Medicine {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    times: string[]; // e.g., ["08:00", "14:00", "20:00"]
    timesOfDay?: ('morning' | 'afternoon' | 'evening' | 'night')[]; // Time of day labels
    foodTiming?: ('before-food' | 'after-food' | 'with-food' | 'empty-stomach')[]; // Food timing per dose
    notes: string;
    duration: string;
    isRecurring?: boolean; // For chronic/long-term medications
    colorTag: string;
    icon: string;
    isActive: boolean;
    createdAt: number;
    intakeTracking?: { [date: string]: boolean[] }; // Track intake per time slot per day
    currentQuantity?: number; // Current stock level
    totalQuantity?: number; // Full refill amount
    refillThreshold?: number; // Alert when stock is below this
}

interface MedicineCardProps {
    medicine: Medicine;
    theme: any;
    onEdit: (medicine: Medicine) => void;
    onDelete: (id: string) => void;
    onToggleActive: (id: string) => void;
    onToggleIntake?: (medicineId: string, date: string, timeIndex: number) => void;
}

const MedicineCard: React.FC<MedicineCardProps> = ({ medicine, theme, onEdit, onDelete, onToggleActive, onToggleIntake }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        if (cardRef.current) {
            cardRef.current.style.opacity = '0';
            cardRef.current.style.transform = 'scale(0.95)';
            requestAnimationFrame(() => {
                if (cardRef.current) {
                    cardRef.current.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                    cardRef.current.style.opacity = '1';
                    cardRef.current.style.transform = 'scale(1)';
                }
            });
        }
    }, []);

    // Get today's date in YYYY-MM-DD format
    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const todayDate = getTodayDate();

    // Check if intake is marked for a specific time slot today
    const isIntakeTaken = (timeIndex: number) => {
        if (!medicine.intakeTracking || !medicine.intakeTracking[todayDate]) {
            return false;
        }
        return medicine.intakeTracking[todayDate][timeIndex] || false;
    };

    // Handle intake checkbox toggle
    const handleIntakeToggle = (timeIndex: number) => {
        if (onToggleIntake) {
            onToggleIntake(medicine.id, todayDate, timeIndex);
        }
    };

    // Get next scheduled time
    const getNextScheduledTime = () => {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const upcomingTimes = medicine.times.filter(time => time > currentTime);
        if (upcomingTimes.length > 0) {
            return upcomingTimes[0];
        }
        // If no upcoming times today, return first time for tomorrow
        return medicine.times[0] + ' (Tomorrow)';
    };

    // Get status of a dose
    const getDoseStatus = (time: string, isTaken: boolean) => {
        if (isTaken) return 'taken';
        
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        if (time < currentTime) return 'missed';
        return 'pending';
    };

    return (
        <div
            ref={cardRef}
            style={{
                padding: '20px',
                background: medicine.isActive 
                    ? `linear-gradient(135deg, ${theme.neutral.glass}, ${theme.neutral.glass})`
                    : theme.neutral.glass,
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                borderRadius: '20px',
                border: `1px solid ${medicine.isActive ? medicine.colorTag : theme.neutral.border}`,
                boxShadow: medicine.isActive 
                    ? `0 8px 24px -6px ${medicine.colorTag}40`
                    : '0 4px 12px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: medicine.isActive ? 1 : 0.7
            }}
        >
            {/* Active Indicator Glow */}
            {medicine.isActive && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '100%',
                        background: `radial-gradient(circle at top left, ${medicine.colorTag}20 0%, transparent 60%)`,
                        pointerEvents: 'none',
                        animation: 'pulse 3s ease-in-out infinite'
                    }}
                />
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    <div
                        style={{
                            fontSize: '36px',
                            width: '64px',
                            height: '64px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: `${medicine.colorTag}15`,
                            borderRadius: '16px',
                            border: `1px solid ${medicine.colorTag}30`
                        }}
                    >
                        {medicine.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3
                            style={{
                                margin: 0,
                                fontSize: '18px',
                                fontWeight: '700',
                                color: theme.neutral.text,
                                marginBottom: '4px'
                            }}
                        >
                            {medicine.name}
                        </h3>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <Tag color={medicine.colorTag} style={{ margin: 0, borderRadius: '6px' }}>
                                {medicine.dosage}
                            </Tag>
                            <Tag bordered={false} style={{ margin: 0, background: theme.neutral.glass, color: theme.neutral.textSoft }}>
                                {medicine.frequency}
                            </Tag>
                        </div>
                    </div>
                </div>
                
                <Tag 
                    color={medicine.isActive ? 'success' : 'default'}
                    style={{ 
                        cursor: 'pointer', 
                        margin: 0, 
                        padding: '4px 12px', 
                        borderRadius: '12px',
                        fontSize: '12px'
                    }}
                    onClick={() => onToggleActive(medicine.id)}
                >
                    {medicine.isActive ? 'ACTIVE' : 'PAUSED'}
                </Tag>
            </div>

            {/* Today's Intake Tracker - Prominent Display */}
            {medicine.isActive && (
                <div
                    style={{
                        padding: '16px',
                        background: `linear-gradient(145deg, ${medicine.colorTag}15, rgba(0,0,0,0.2))`,
                        borderRadius: '16px',
                        marginBottom: '20px',
                        border: `1px solid ${medicine.colorTag}30`,
                        position: 'relative',
                        zIndex: 1,
                        animation: `borderPulse-${medicine.id} 4s ease-in-out infinite`
                    }}
                >
                    <div style={{ 
                        fontSize: '12px', 
                        fontWeight: '600',
                        color: theme.neutral.textSoft, 
                        marginBottom: '12px', 
                        textTransform: 'uppercase', 
                        letterSpacing: '1px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <span>Today's Schedule</span>
                        <span style={{ fontSize: '11px' }}>
                            {getTodayDate()}
                        </span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {medicine.times.map((time, idx) => {
                            const taken = isIntakeTaken(idx);
                            const status = getDoseStatus(time, taken);
                            
                            let statusColor = theme.neutral.border;
                            let statusBg = theme.neutral.glass;
                            let statusIcon = <ClockCircleOutlined />;
                            let statusText = 'Pending';
                            
                            if (status === 'taken') {
                                statusColor = '#52c41a'; // Green
                                statusBg = 'rgba(82, 196, 26, 0.15)';
                                statusIcon = <CheckCircleOutlined />;
                                statusText = 'Taken';
                            } else if (status === 'missed') {
                                statusColor = '#ff4d4f'; // Red
                                statusBg = 'rgba(255, 77, 79, 0.15)';
                                statusIcon = <CloseCircleOutlined />;
                                statusText = 'Missed';
                            } else {
                                statusColor = '#1890ff'; // Blue
                                statusBg = 'rgba(24, 144, 255, 0.15)';
                            }

                            const timeOfDayIcon = {
                                'morning': '🌅',
                                'afternoon': '☀️',
                                'evening': '🌆',
                                'night': '🌙'
                            }[medicine.timesOfDay?.[idx] || 'morning'];

                            const foodTimingIcon = {
                                'before-food': '🍽️ Before Food',
                                'after-food': '🍴 After Food',
                                'with-food': '🥗 With Food',
                                'empty-stomach': '⏰ Empty Stomach'
                            }[medicine.foodTiming?.[idx] || 'after-food'];

                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleIntakeToggle(idx)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 16px',
                                        background: statusBg,
                                        border: `1px solid ${status === 'pending' ? theme.neutral.border : statusColor}`,
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        opacity: status === 'missed' ? 0.9 : 1
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ 
                                            fontSize: '16px', 
                                            fontWeight: '700', 
                                            color: theme.neutral.text,
                                            fontFamily: '"SF Mono", monospace'
                                        }}>
                                            {time}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ fontSize: '11px', color: theme.neutral.text }}>
                                                {timeOfDayIcon} {medicine.timesOfDay?.[idx]}
                                            </span>
                                            <span style={{ fontSize: '10px', color: theme.neutral.textSoft }}>
                                                {foodTimingIcon}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '6px',
                                        color: statusColor,
                                        fontWeight: '600',
                                        fontSize: '12px'
                                    }}>
                                        {statusText}
                                        {statusIcon}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Stock Level Indicator */}
                    {medicine.currentQuantity !== undefined && (
                        <div style={{ marginTop: '20px', padding: '12px 16px', background: theme.neutral.glass, borderRadius: '12px', border: `1px solid ${theme.neutral.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '11px', fontWeight: '600', color: theme.neutral.textSoft, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <span>Stock Level</span>
                                <span style={{ color: (medicine.currentQuantity || 0) <= (medicine.refillThreshold || 5) ? '#ff4d4f' : theme.neutral.text }}>
                                    {medicine.currentQuantity} <span style={{ opacity: 0.5 }}>/</span> {medicine.totalQuantity || 100}
                                </span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${Math.min(100, Math.max(0, ((medicine.currentQuantity || 0) / (medicine.totalQuantity || 100)) * 100))}%`,
                                    background: (medicine.currentQuantity || 0) <= (medicine.refillThreshold || 5) ? '#ff4d4f' : medicine.colorTag,
                                    borderRadius: '3px',
                                    transition: 'width 0.5s ease'
                                }} />
                            </div>
                            {(medicine.currentQuantity || 0) <= (medicine.refillThreshold || 5) && (
                                <div style={{ marginTop: '8px', fontSize: '11px', color: '#ff4d4f', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                                    ⚠️ Low stock! Consider refilling soon.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', background: theme.neutral.glass, borderRadius: '12px', border: `1px solid ${theme.neutral.border}` }}>
                    <div style={{ fontSize: '10px', color: theme.neutral.textSoft, marginBottom: '4px', textTransform: 'uppercase' }}>Duration</div>
                    <div style={{ fontWeight: '600', color: theme.neutral.text }}>{medicine.duration}</div>
                </div>
                {medicine.isRecurring && (
                    <div style={{ padding: '12px', background: `${medicine.colorTag}10`, borderRadius: '12px', border: `1px solid ${medicine.colorTag}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <span style={{ color: medicine.colorTag }}>🔄 Recurring</span>
                    </div>
                )}
            </div>

            {/* Notes */}
            {medicine.notes && (
                <div
                    style={{
                        padding: '12px 16px',
                        background: theme.neutral.glass,
                        borderRadius: '12px',
                        marginBottom: '16px',
                        border: `1px dashed ${theme.neutral.border}`,
                    }}
                >
                    <p style={{ margin: 0, fontSize: '12px', color: theme.neutral.textSoft, fontStyle: 'italic' }}>
                        "{medicine.notes}"
                    </p>
                </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                <Button 
                    icon={<HistoryOutlined />} 
                    onClick={() => setShowHistory(true)}
                    style={{ flex: 1, borderRadius: '10px' }}
                >
                    History
                </Button>
                <Button 
                    icon={<EditOutlined />} 
                    onClick={() => onEdit(medicine)}
                    style={{ flex: 1, borderRadius: '10px' }}
                >
                    Edit
                </Button>
                <Button 
                    danger
                    icon={<DeleteOutlined />} 
                    onClick={() => onDelete(medicine.id)}
                    style={{ flex: 1, borderRadius: '10px' }}
                >
                    Delete
                </Button>
            </div>

            <MedicineHistory 
                medicine={medicine}
                visible={showHistory}
                onClose={() => setShowHistory(false)}
                theme={theme}
            />

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                @keyframes bounceIn {
                    0% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes borderPulse-${medicine.id} {
                    0% { border-color: ${medicine.colorTag}30; box-shadow: 0 0 0 0 ${medicine.colorTag}00; }
                    50% { border-color: ${medicine.colorTag}80; box-shadow: 0 0 15px ${medicine.colorTag}20; }
                    100% { border-color: ${medicine.colorTag}30; box-shadow: 0 0 0 0 ${medicine.colorTag}00; }
                }
            `}</style>
        </div>
    );
};

export default MedicineCard;
