import React, { useState, useEffect } from 'react';
import { Button, Modal, Input, message, Typography, Card, Select, Alert } from 'antd';
import { LockOutlined, UnlockOutlined, SafetyCertificateOutlined, PlusOutlined } from '@ant-design/icons';
import MedicinePagination from './MedicinePagination';
import MedicineForm from './MedicineForm';
import ErrorBoundary from './ErrorBoundary';
import { Medicine } from './MedicineCard';
import { getMedicineQuote, MedicineQuote, formatQuoteForDisplay } from '../utils/medicineQuotes';

const { Title, Text } = Typography;

// Security Questions Pool
const SECURITY_QUESTIONS = [
    "What city were you born in?",
    "What was your first pet's name?",
    "What is your mother's maiden name?",
    "What was your childhood nickname?",
    "What street did you grow up on?",
    "What was the name of your elementary school?",
    "What is your favorite book?",
    "What was your first car's make and model?",
    "What is your father's middle name?",
    "In what city did you meet your spouse/partner?"
];

interface MedicineViewProps {
    theme: any;
    vscode: any;
}

const MedicineView: React.FC<MedicineViewProps> = ({ theme, vscode }) => {
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState<Medicine | undefined>(undefined);
    const [currentQuote, setCurrentQuote] = useState<string>('');
    const [isLoadingQuote, setIsLoadingQuote] = useState(false);
    
    // Lock System State
    const [isLocked, setIsLocked] = useState(false);
    const [hasPassword, setHasPassword] = useState(false);
    const [showLockModal, setShowLockModal] = useState(false);
    const [lockPassword, setLockPassword] = useState('');
    const [isSettingPassword, setIsSettingPassword] = useState(false);
    
    // Security Questions State
    const [securityQA, setSecurityQA] = useState<Array<{question: string, answer: string}>>([
        { question: SECURITY_QUESTIONS[0], answer: '' },
        { question: SECURITY_QUESTIONS[1], answer: '' },
        { question: SECURITY_QUESTIONS[2], answer: '' }
    ]);
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const [recoveryQuestions, setRecoveryQuestions] = useState<string[]>([]);
    const [recoveryAnswers, setRecoveryAnswers] = useState<string[]>(['', '', '']);
    
    // Reset Password State
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [verificationError, setVerificationError] = useState(false);

    // Load initial state
    useEffect(() => {
        vscode.postMessage({ type: 'getLockState' });
        vscode.postMessage({ type: 'getMedicines' });
    }, [vscode]);

    // Listen for messages
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'medicinesUpdate') {
                setMedicines(message.medicines || []);
            } else if (message.type === 'lockState') {
                setHasPassword(message.hasPassword);
                setIsLocked(message.isLocked);
            } else if (message.type === 'unlockSuccess') {
                setIsLocked(false);
                setShowLockModal(false);
                setLockPassword('');
            } else if (message.type === 'unlockFailed') {
                // Handled by UI feedback usually, but could add specific logic here
            } else if (message.type === 'passwordReset') {
                setHasPassword(false);
                setIsLocked(false);
                setShowLockModal(false);
                setShowForgotPasswordModal(false);
                setLockPassword('');
                message.success('Password reset successfully!');
            } else if (message.type === 'securityQuestions') {
                setRecoveryQuestions(message.questions || []);
            } else if (message.type === 'securityVerificationSuccess') {
                setShowForgotPasswordModal(false);
                setShowResetPasswordModal(true);
                setVerificationError(false);
                message.success('Identity verified! Please set a new password.');
            } else if (message.type === 'securityVerificationFailed') {
                setVerificationError(true);
                message.error('Incorrect answers. Please try again.');
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleLockAction = () => {
        if (isLocked) {
            // Already locked, showing modal to unlock
            setShowLockModal(true);
            setIsSettingPassword(false);
        } else {
            if (hasPassword) {
                // Has password, just lock it
                vscode.postMessage({ type: 'lock' });
                setIsLocked(true);
            } else {
                // No password, set one up
                setShowLockModal(true);
                setIsSettingPassword(true);
            }
        }
    };

    const handleModalSubmit = () => {
        if (!lockPassword) {
            message.error('Please enter a password');
            return;
        }

        if (isSettingPassword) {
            // Validate security questions
            const hasEmptyAnswers = securityQA.some(qa => !qa.answer.trim());
            if (hasEmptyAnswers) {
                message.error('Please answer all security questions');
                return;
            }

            // Send password and security questions
            vscode.postMessage({ type: 'setPassword', password: lockPassword });
            vscode.postMessage({ type: 'setSecurityQuestions', questionsAndAnswers: securityQA });
            setHasPassword(true);
            setIsLocked(false);
            setShowLockModal(false);
            setLockPassword('');
            // Reset security Q&A for next time
            setSecurityQA([
                { question: SECURITY_QUESTIONS[0], answer: '' },
                { question: SECURITY_QUESTIONS[1], answer: '' },
                { question: SECURITY_QUESTIONS[2], answer: '' }
            ]);
            message.success('Password and security questions set successfully!');
        } else {
            vscode.postMessage({ type: 'unlock', password: lockPassword });
            setLockPassword('');
        }
    };

    const handleForgotPassword = () => {
        setShowLockModal(false);
        vscode.postMessage({ type: 'getSecurityQuestions' });
        setShowForgotPasswordModal(true);
        setRecoveryAnswers(['', '', '']);
        setVerificationError(false);
    };

    const handleResetPasswordSubmit = () => {
        if (!newPassword) {
            message.error('Please enter a new password');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            message.error('Passwords do not match');
            return;
        }
        
        vscode.postMessage({ type: 'setPassword', password: newPassword });
        // Also unlock since we just reset it
        vscode.postMessage({ type: 'unlock', password: newPassword });
        
        setShowResetPasswordModal(false);
        setNewPassword('');
        setConfirmNewPassword('');
        message.success('Password updated successfully!');
    };

    const handleVerifySecurityAnswers = () => {
        const hasEmptyAnswers = recoveryAnswers.some(ans => !ans.trim());
        if (hasEmptyAnswers) {
            message.error('Please answer all questions');
            return;
        }
        setVerificationError(false);
        vscode.postMessage({ type: 'verifySecurityAnswers', answers: recoveryAnswers });
    };

    // Load initial quote
    useEffect(() => {
        loadNewQuote();
        // Change quote every 30 seconds
        const quoteInterval = setInterval(loadNewQuote, 30000);
        return () => clearInterval(quoteInterval);
    }, []);

    const loadNewQuote = async () => {
        setIsLoadingQuote(true);
        try {
            const quote = await getMedicineQuote();
            setCurrentQuote(formatQuoteForDisplay(quote));
        } catch (error) {
            console.error('Error loading quote:', error);
        } finally {
            setIsLoadingQuote(false);
        }
    };

    const handleSaveMedicine = (medicine: Medicine) => {
        vscode.postMessage({
            type: 'saveMedicine',
            medicine
        });
        setShowForm(false);
        setEditingMedicine(undefined);
    };

    const handleEditMedicine = (medicine: Medicine) => {
        setEditingMedicine(medicine);
        setShowForm(true);
    };

    const handleDeleteMedicine = (id: string) => {
        vscode.postMessage({
            type: 'deleteMedicine',
            medicineId: id
        });
    };

    const handleToggleActive = (id: string) => {
        vscode.postMessage({
            type: 'toggleMedicineActive',
            medicineId: id
        });
    };

    const handleToggleIntake = (medicineId: string, date: string, timeIndex: number) => {
        // Optimistic update for quantity
        const med = medicines.find(m => m.id === medicineId);
        if (med && med.currentQuantity !== undefined) {
            const isTaken = med.intakeTracking?.[date]?.[timeIndex];
            // If currently taken (true), we are untaking it -> increment
            // If currently not taken (false/undefined), we are taking it -> decrement
            const newQuantity = isTaken 
                ? med.currentQuantity + 1 
                : Math.max(0, med.currentQuantity - 1);
            
            // Update local state immediately for responsiveness
            const updatedMedicines = medicines.map(m => 
                m.id === medicineId ? { ...m, currentQuantity: newQuantity } : m
            );
            setMedicines(updatedMedicines);
        }

        vscode.postMessage({
            type: 'toggleMedicineIntake',
            medicineId,
            date,
            timeIndex
        });
    };

    const handleAddNew = () => {
        setEditingMedicine(undefined);
        setShowForm(true);
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditingMedicine(undefined);
    };

    return (
        <div style={{ 
            paddingBottom: '28px', 
            position: 'relative',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            overflowX: 'hidden'
        }}>
            {/* Header */}
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                marginBottom: '24px',
                position: 'relative'
            }}>
                <div style={{ 
                    fontSize: '42px', 
                    marginBottom: '8px', 
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                }}>
                    💊
                </div>
                <Title level={2} style={{ margin: 0, color: theme.neutral.text, fontSize: '24px', fontWeight: '600' }}>
                    Medicine Reminder
                </Title>
                <Text style={{ color: theme.neutral.textSoft, fontSize: '13px' }}>
                    Your personal health assistant
                </Text>
            </div>

            {/* Quote Display */}
            <div
                style={{
                    padding: '18px 24px',
                    background: 'linear-gradient(135deg, rgba(168, 197, 161, 0.12) 0%, rgba(125, 211, 192, 0.08) 100%)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '18px',
                    border: '2px solid transparent',
                    backgroundImage: `linear-gradient(${theme.neutral.glass}, ${theme.neutral.glass}), linear-gradient(90deg, ${theme.accent.sage}, ${theme.primary.base}, ${theme.accent.lavender}, ${theme.accent.amber})`,
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    backgroundSize: '100% 100%, 300% 300%',
                    animation: 'gradientShift 8s ease infinite',
                    textAlign: 'center' as const,
                    marginBottom: '20px',
                    boxShadow: `0 8px 32px ${theme.accent.sage}26, inset 0 1px 0 rgba(255,255,255,0.1)`,
                    minHeight: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {isLoadingQuote ? (
                    <p style={{ fontSize: '13px', color: theme.neutral.textSoft, margin: 0, fontStyle: 'italic' }}>
                        Loading inspiration...
                    </p>
                ) : (
                    <p
                        style={{
                            fontSize: '13px',
                            fontStyle: 'italic',
                            color: theme.neutral.text,
                            margin: 0,
                            lineHeight: '1.7',
                            letterSpacing: '0.4px',
                            fontWeight: '500',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}
                    >
                        {currentQuote}
                    </p>
                )}
            </div>

            {/* Lock Overlay */}
            {isLocked && (
                <div
                    style={{
                        position: 'absolute',
                        top: '180px',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(15, 23, 42, 0.95)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderRadius: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '20px',
                        zIndex: 10,
                        padding: '40px'
                    }}
                >
                    <div style={{ fontSize: '80px', filter: 'drop-shadow(0 4px 16px rgba(232, 184, 109, 0.6))' }}>
                        🔒
                    </div>
                    <h3 style={{ color: theme.neutral.text, fontSize: '18px', fontWeight: '700', margin: 0 }}>
                        Medicines Locked
                    </h3>
                    <p style={{ color: theme.neutral.textSoft, fontSize: '13px', margin: 0, textAlign: 'center', marginBottom: '20px' }}>
                        Your medicine information is protected.
                    </p>
                    <Button 
                        type="primary" 
                        icon={<UnlockOutlined />} 
                        onClick={handleLockAction}
                        size="large"
                        style={{ 
                            background: `linear-gradient(135deg, ${theme.primary.base}, ${theme.accent.sage})`,
                            border: 'none',
                            height: '48px',
                            paddingLeft: '32px',
                            paddingRight: '32px',
                            fontSize: '15px',
                            fontWeight: '600'
                        }}
                    >
                        Unlock Medicines
                    </Button>
                </div>
            )}

            {/* Lock Modal */}
            <Modal
                title={isSettingPassword ? "🔐 Set Password & Security Questions" : "🔓 Unlock Medicines"}
                open={showLockModal}
                onOk={handleModalSubmit}
                onCancel={() => { 
                    setShowLockModal(false); 
                    setLockPassword(''); 
                    setSecurityQA([
                        { question: SECURITY_QUESTIONS[0], answer: '' },
                        { question: SECURITY_QUESTIONS[1], answer: '' },
                        { question: SECURITY_QUESTIONS[2], answer: '' }
                    ]);
                }}
                okText={isSettingPassword ? "Set Password" : "Unlock"}
                cancelText="Cancel"
                width={isSettingPassword ? 600 : 400}
            >
                <div style={{ marginBottom: 16 }}>
                    <Text>{isSettingPassword 
                        ? "Create a password and answer security questions for password recovery." 
                        : "Enter your password to view medicines."}</Text>
                </div>
                <Input.Password
                    placeholder="Enter password"
                    value={lockPassword}
                    onChange={(e) => setLockPassword(e.target.value)}
                    onPressEnter={!isSettingPassword ? handleModalSubmit : undefined}
                    style={{ marginBottom: isSettingPassword ? 24 : 0 }}
                />
                
                {isSettingPassword && (
                    <div>
                        <Text strong style={{ display: 'block', marginBottom: 12 }}>Security Questions (for password recovery):</Text>
                        {securityQA.map((qa, index) => (
                            <div key={index} style={{ marginBottom: 16 }}>
                                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                                    Question {index + 1}:
                                </Text>
                                <Select
                                    value={qa.question}
                                    onChange={(value) => {
                                        const newQA = [...securityQA];
                                        newQA[index].question = value;
                                        setSecurityQA(newQA);
                                    }}
                                    style={{
                                        width: '100%',
                                        marginBottom: 8
                                    }}
                                    placeholder="Select a security question"
                                >
                                    {SECURITY_QUESTIONS.map((q, i) => (
                                        <Select.Option key={i} value={q}>{q}</Select.Option>
                                    ))}
                                </Select>
                                <Input
                                    placeholder="Your answer"
                                    value={qa.answer}
                                    onChange={(e) => {
                                        const newQA = [...securityQA];
                                        newQA[index].answer = e.target.value;
                                        setSecurityQA(newQA);
                                    }}
                                />
                            </div>
                        ))}
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            💡 Keep your answers simple and memorable. They are case-insensitive.
                        </Text>
                    </div>
                )}
                
                {!isSettingPassword && (
                    <div style={{ marginTop: 12, textAlign: 'right' }}>
                        <Button 
                            type="link" 
                            size="small"
                            onClick={handleForgotPassword}
                            style={{ padding: 0, fontSize: '12px', color: theme.accent.sage }}
                        >
                            Forgot Password?
                        </Button>
                    </div>
                )}
            </Modal>

            {/* Forgot Password Modal - Security Question Verification */}
            <Modal
                title="🔐 Verify Your Identity"
                open={showForgotPasswordModal}
                onOk={handleVerifySecurityAnswers}
                onCancel={() => { 
                    setShowForgotPasswordModal(false); 
                    setRecoveryAnswers(['', '', '']);
                    setVerificationError(false);
                }}
                okText="Verify"
                cancelText="Cancel"
                width={500}
            >
                {verificationError && (
                    <Alert
                        message="Incorrect Answers"
                        description="The information you entered does not match our records. Please try again."
                        type="error"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}
                <div style={{ marginBottom: 16 }}>
                    <Text>Answer your security questions to reset your password:</Text>
                </div>
                {recoveryQuestions.length > 0 ? (
                    recoveryQuestions.map((question, index) => (
                        <div key={index} style={{ marginBottom: 16 }}>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                Question {index + 1}: {question}
                            </Text>
                            <Input
                                placeholder="Your answer"
                                value={recoveryAnswers[index]}
                                status={verificationError ? "error" : ""}
                                onChange={(e) => {
                                    const newAnswers = [...recoveryAnswers];
                                    newAnswers[index] = e.target.value;
                                    setRecoveryAnswers(newAnswers);
                                    if (verificationError) setVerificationError(false);
                                }}
                                onPressEnter={index === recoveryQuestions.length - 1 ? handleVerifySecurityAnswers : undefined}
                            />
                        </div>
                    ))
                ) : (
                    <Text type="secondary">No security questions found. Please contact support.</Text>
                )}
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 12 }}>
                    ✓ Answers are case-insensitive
                </Text>
            </Modal>

            {/* Reset Password Modal */}
            <Modal
                title="🔑 Reset Password"
                open={showResetPasswordModal}
                onOk={handleResetPasswordSubmit}
                onCancel={() => {
                    setShowResetPasswordModal(false);
                    setNewPassword('');
                    setConfirmNewPassword('');
                }}
                okText="Update Password"
                cancelText="Cancel"
                width={400}
            >
                <div style={{ marginBottom: 16 }}>
                    <Text>Please enter your new password.</Text>
                </div>
                <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>New Password</Text>
                    <Input.Password
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </div>
                <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Confirm New Password</Text>
                    <Input.Password
                        placeholder="Confirm new password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        onPressEnter={handleResetPasswordSubmit}
                    />
                </div>
            </Modal>

            {/* Lock Screen Overlay */}
            {isLocked && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 20px',
                    background: theme.neutral.glass,
                    borderRadius: '20px',
                    border: `1px solid ${theme.neutral.border}`,
                    textAlign: 'center'
                }}>
                    <LockOutlined style={{ fontSize: '48px', color: theme.neutral.text, marginBottom: '16px' }} />
                    <Title level={4} style={{ color: theme.neutral.text, marginBottom: '8px' }}>Medicines Locked</Title>
                    <Text style={{ color: theme.neutral.textSoft, marginBottom: '24px', display: 'block' }}>
                        Your medicine list is protected.
                    </Text>
                    <Button type="primary" onClick={handleLockAction} icon={<UnlockOutlined />} size="large">
                        Unlock to View
                    </Button>
                </div>
            )}

            {/* Main Content (hidden when locked) */}
            {!isLocked && (
                <>
                    {/* Header with Lock Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                        <Button 
                            type="text" 
                            icon={hasPassword ? <LockOutlined /> : <SafetyCertificateOutlined />} 
                            onClick={handleLockAction}
                            style={{ color: theme.neutral.text }}
                        >
                            {hasPassword ? "Lock View" : "Set Password"}
                        </Button>
                    </div>

                    {showForm ? (
                        <MedicineForm
                            medicine={editingMedicine}
                            onSave={handleSaveMedicine}
                            onCancel={handleCancelForm}
                            theme={theme}
                        />
                    ) : (
                        <>
                            {/* Add New Medicine Button */}
                            <Button
                                type="primary"
                                onClick={handleAddNew}
                                icon={<PlusOutlined />}
                                size="large"
                                block
                                style={{ 
                                    marginBottom: '20px',
                                    height: '50px',
                                    borderRadius: '12px',
                                    background: `linear-gradient(135deg, ${theme.primary.base}, ${theme.accent.sage})`,
                                    border: 'none'
                                }}
                            >
                                Add New Medicine
                            </Button>

                            {/* Medicine List with Pagination */}
                            <MedicinePagination
                                medicines={medicines}
                                theme={theme}
                                onEdit={handleEditMedicine}
                                onDelete={handleDeleteMedicine}
                                onToggleActive={handleToggleActive}
                                onToggleIntake={handleToggleIntake}
                                itemsPerPage={2}
                            />

                            {/* Medicine Stats (if medicines exist) */}
                            {medicines.length > 0 && (
                                <div
                                    style={{
                                        marginTop: '20px',
                                        padding: '16px',
                                        background: theme.neutral.glass,
                                        backdropFilter: 'blur(20px)',
                                        borderRadius: '16px',
                                        border: `1px solid ${theme.neutral.border}`,
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '12px'
                                    }}
                                >
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '24px', fontWeight: '700', color: theme.accent.sage }}>
                                            {medicines.filter(m => m.isActive).length}
                                        </div>
                                        <div style={{ fontSize: '10px', color: theme.neutral.textSoft, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                            Active
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '24px', fontWeight: '700', color: theme.neutral.text }}>
                                            {medicines.reduce((acc, m) => acc + m.times.length, 0)}
                                        </div>
                                        <div style={{ fontSize: '10px', color: theme.neutral.textSoft, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                            Daily Doses
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            <style>{`
                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `}</style>
        </div>
    );
};

export default MedicineView;
