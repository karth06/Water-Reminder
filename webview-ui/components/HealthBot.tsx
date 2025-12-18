import React, { useState, useEffect } from 'react';

interface HealthBotProps {
    theme: any;
    message?: string;
}

const BOT_MESSAGES = [
    "Don't forget your meds! 💊",
    "Stay healthy, stay happy! ✨",
    "I'm here to help you! 🤖",
    "You're doing great! 🌟",
    "Health is wealth! 💎",
    "Time for a water break? 💧",
    "Keep up the streak! 🔥",
    "Your body thanks you! ❤️"
];

const HealthBot: React.FC<HealthBotProps> = ({ theme, message }) => {
    const [currentMessage, setCurrentMessage] = useState(message || BOT_MESSAGES[0]);
    const [isBlinking, setIsBlinking] = useState(false);
    const [isBouncing, setIsBouncing] = useState(false);

    useEffect(() => {
        // Random blinking
        const blinkInterval = setInterval(() => {
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 150);
        }, 3000 + Math.random() * 2000);

        // Random bouncing
        const bounceInterval = setInterval(() => {
            setIsBouncing(true);
            setTimeout(() => setIsBouncing(false), 1000);
        }, 5000);

        // Random messages if none provided
        let messageInterval: NodeJS.Timeout;
        if (!message) {
            messageInterval = setInterval(() => {
                setCurrentMessage(BOT_MESSAGES[Math.floor(Math.random() * BOT_MESSAGES.length)]);
            }, 10000);
        }

        return () => {
            clearInterval(blinkInterval);
            clearInterval(bounceInterval);
            if (messageInterval) clearInterval(messageInterval);
        };
    }, [message]);

    return (
        <div style={{ 
            position: 'relative', 
            display: 'flex', 
            alignItems: 'flex-end', 
            gap: '12px',
            padding: '10px'
        }}>
            {/* Speech Bubble */}
            <div style={{
                background: theme.neutral.glass,
                padding: '8px 16px',
                borderRadius: '12px 12px 12px 0',
                border: `1px solid ${theme.primary.base}`,
                marginBottom: '20px',
                maxWidth: '200px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                animation: 'fadeIn 0.5s ease-out',
                position: 'relative'
            }}>
                <span style={{ color: theme.neutral.text, fontSize: '13px', fontWeight: 500 }}>
                    {currentMessage}
                </span>
                {/* Bubble Tail */}
                <div style={{
                    position: 'absolute',
                    bottom: '-6px',
                    left: '0',
                    width: '0',
                    height: '0',
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderTop: `8px solid ${theme.primary.base}`,
                    transform: 'rotate(45deg)'
                }} />
            </div>

            {/* Bot Character */}
            <div 
                style={{
                    width: '60px',
                    height: '60px',
                    cursor: 'pointer',
                    transform: isBouncing ? 'translateY(-10px)' : 'translateY(0)',
                    transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onClick={() => {
                    setIsBouncing(true);
                    setTimeout(() => setIsBouncing(false), 500);
                    setCurrentMessage(BOT_MESSAGES[Math.floor(Math.random() * BOT_MESSAGES.length)]);
                }}
            >
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    {/* Glow Effect */}
                    <defs>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Body/Head */}
                    <rect 
                        x="20" y="20" width="60" height="50" rx="15" 
                        fill={theme.primary.base} 
                        stroke={theme.neutral.text} 
                        strokeWidth="2"
                    />
                    
                    {/* Antenna */}
                    <line x1="50" y1="20" x2="50" y2="10" stroke={theme.neutral.text} strokeWidth="2" />
                    <circle cx="50" cy="10" r="4" fill={theme.accent.amber} filter="url(#glow)">
                        <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
                    </circle>

                    {/* Screen/Face */}
                    <rect x="28" y="30" width="44" height="30" rx="8" fill="#000" opacity="0.8" />

                    {/* Eyes */}
                    <g fill={theme.accent.sage}>
                        <circle cx="40" cy="42" r={isBlinking ? "1" : "4"} transition="r 0.1s" />
                        <circle cx="60" cy="42" r={isBlinking ? "1" : "4"} transition="r 0.1s" />
                    </g>

                    {/* Mouth */}
                    <path 
                        d="M 40 52 Q 50 58 60 52" 
                        stroke={theme.accent.sage} 
                        strokeWidth="2" 
                        fill="none" 
                        strokeLinecap="round"
                    />

                    {/* Headphones/Ears */}
                    <rect x="15" y="35" width="5" height="20" rx="2" fill={theme.neutral.text} />
                    <rect x="80" y="35" width="5" height="20" rx="2" fill={theme.neutral.text} />
                </svg>
            </div>
        </div>
    );
};

export default HealthBot;
