import React, { useRef, useEffect } from 'react';

interface NavigationTabsProps {
    activeTab: 'water' | 'medicine' | 'analytics';
    onTabChange: (tab: 'water' | 'medicine' | 'analytics') => void;
    theme: any;
}

const NavigationTabs: React.FC<NavigationTabsProps> = ({ activeTab, onTabChange, theme }) => {
    const tabsRef = useRef<HTMLDivElement>(null);
    const indicatorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Smooth entry animation
        if (tabsRef.current) {
            tabsRef.current.style.opacity = '0';
            tabsRef.current.style.transform = 'translateY(-10px)';
            requestAnimationFrame(() => {
                if (tabsRef.current) {
                    tabsRef.current.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                    tabsRef.current.style.opacity = '1';
                    tabsRef.current.style.transform = 'translateY(0)';
                }
            });
        }
    }, []);

    useEffect(() => {
        // Animate indicator position
        if (indicatorRef.current) {
            let translateX = '0%';
            if (activeTab === 'medicine') translateX = '100%';
            if (activeTab === 'analytics') translateX = '200%';
            indicatorRef.current.style.transform = `translateX(${translateX})`;
        }
    }, [activeTab]);

    const handleTabClick = (tab: 'water' | 'medicine' | 'analytics') => {
        onTabChange(tab);
    };

    return (
        <div
            ref={tabsRef}
            style={{
                position: 'relative',
                display: 'flex',
                gap: '8px',
                padding: '6px',
                marginBottom: '24px',
                background: theme.neutral.glass,
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                borderRadius: '16px',
                border: `1px solid ${theme.neutral.border}`,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
                overflow: 'hidden'
            }}
        >
            {/* Animated Indicator */}
            <div
                ref={indicatorRef}
                style={{
                    position: 'absolute',
                    top: '6px',
                    left: '6px',
                    width: 'calc(33.33% - 8px)',
                    height: 'calc(100% - 12px)',
                    background: `linear-gradient(135deg, ${theme.primary.base}, ${theme.accent.sage})`,
                    borderRadius: '12px',
                    boxShadow: `0 4px 16px ${theme.primary.base}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 0,
                    animation: 'subtleGlow 3s ease-in-out infinite'
                }}
            />

            {/* Water Tab */}
            <button
                onClick={() => handleTabClick('water')}
                style={{
                    flex: 1,
                    padding: '12px 10px',
                    border: 'none',
                    background: 'transparent',
                    color: activeTab === 'water' ? '#ffffff' : theme.neutral.textSoft,
                    fontSize: '13px',
                    fontWeight: '600',
                    letterSpacing: '0.3px',
                    cursor: 'pointer',
                    borderRadius: '10px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 1,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    textShadow: activeTab === 'water' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                    transform: activeTab === 'water' ? 'scale(1)' : 'scale(0.96)'
                }}
                onMouseEnter={(e) => {
                    if (activeTab !== 'water') {
                        e.currentTarget.style.color = theme.neutral.text;
                    }
                }}
                onMouseLeave={(e) => {
                    if (activeTab !== 'water') {
                        e.currentTarget.style.color = theme.neutral.textSoft;
                    }
                }}
            >
                <span style={{ fontSize: '16px' }}>💧</span>
                <span>Water</span>
            </button>

            {/* Medicine Tab */}
            <button
                onClick={() => handleTabClick('medicine')}
                style={{
                    flex: 1,
                    padding: '12px 10px',
                    border: 'none',
                    background: 'transparent',
                    color: activeTab === 'medicine' ? '#ffffff' : theme.neutral.textSoft,
                    fontSize: '13px',
                    fontWeight: '600',
                    letterSpacing: '0.3px',
                    cursor: 'pointer',
                    borderRadius: '10px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 1,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    textShadow: activeTab === 'medicine' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                    transform: activeTab === 'medicine' ? 'scale(1)' : 'scale(0.96)'
                }}
                onMouseEnter={(e) => {
                    if (activeTab !== 'medicine') {
                        e.currentTarget.style.color = theme.neutral.text;
                    }
                }}
                onMouseLeave={(e) => {
                    if (activeTab !== 'medicine') {
                        e.currentTarget.style.color = theme.neutral.textSoft;
                    }
                }}
            >
                <span style={{ fontSize: '16px' }}>💊</span>
                <span>Meds</span>
            </button>

            {/* Analytics Tab */}
            <button
                onClick={() => handleTabClick('analytics')}
                style={{
                    flex: 1,
                    padding: '12px 10px',
                    border: 'none',
                    background: 'transparent',
                    color: activeTab === 'analytics' ? '#ffffff' : theme.neutral.textSoft,
                    fontSize: '13px',
                    fontWeight: '600',
                    letterSpacing: '0.3px',
                    cursor: 'pointer',
                    borderRadius: '10px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 1,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    textShadow: activeTab === 'analytics' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                    transform: activeTab === 'analytics' ? 'scale(1)' : 'scale(0.96)'
                }}
                onMouseEnter={(e) => {
                    if (activeTab !== 'analytics') {
                        e.currentTarget.style.color = theme.neutral.text;
                    }
                }}
                onMouseLeave={(e) => {
                    if (activeTab !== 'analytics') {
                        e.currentTarget.style.color = theme.neutral.textSoft;
                    }
                }}
            >
                <span style={{ fontSize: '16px' }}>📊</span>
                <span>Stats</span>
            </button>

            <style>{`
                @keyframes subtleGlow {
                    0%, 100% { 
                        box-shadow: 0 4px 16px ${theme.primary.base}40, inset 0 1px 0 rgba(255,255,255,0.2);
                    }
                    50% { 
                        box-shadow: 0 4px 24px ${theme.primary.base}60, inset 0 1px 0 rgba(255,255,255,0.3);
                    }
                }
            `}</style>
        </div>
    );
};

export default NavigationTabs;
