import React, { useEffect, useState, useRef } from 'react';

// Use CSS animations only for reliability
const anime: any = {
    stagger: (delay: number, options?: any) => delay
};

interface TimerState {
    remainingSeconds: number;
    totalSeconds: number;
    isRunning: boolean;
    isPaused: boolean;
    dailyCount: number;
    dailyGoal: number;
    intervalMinutes: number;
    soundEnabled: boolean;
    soundType: string;
}

type Theme = 'dark' | 'light' | 'ocean' | 'forest';
type ViewMode = 'normal' | 'compact';

// @ts-ignore
const vscode = acquireVsCodeApi();

// Theme System
const THEMES = {
    dark: {
        name: 'Dark Ocean',
        bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        primary: { base: '#6B9BD1', light: '#8FB3E0', glass: 'rgba(107, 155, 209, 0.12)' },
        accent: { amber: '#E8B86D', coral: '#E89B7C', sage: '#A8C5A1', lavender: '#B8A8D4' },
        pause: { base: '#E8B86D', glass: 'rgba(232, 184, 109, 0.12)' },
        success: { base: '#A8C5A1', glass: 'rgba(168, 197, 161, 0.12)' },
        neutral: { glass: 'rgba(255, 255, 255, 0.04)', border: 'rgba(255, 255, 255, 0.08)', text: 'rgba(255, 255, 255, 0.85)', textSoft: 'rgba(255, 255, 255, 0.6)' },
        orb1: 'rgba(107, 155, 209, 0.1)', orb2: 'rgba(168, 197, 161, 0.08)'
    },
    light: {
        name: 'Light Breeze',
        bg: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        primary: { base: '#0369a1', light: '#0284c7', glass: 'rgba(3, 105, 161, 0.08)' },
        accent: { amber: '#d97706', coral: '#ea580c', sage: '#059669', lavender: '#7c3aed' },
        pause: { base: '#d97706', glass: 'rgba(217, 119, 6, 0.08)' },
        success: { base: '#059669', glass: 'rgba(5, 150, 105, 0.08)' },
        neutral: { glass: 'rgba(0, 0, 0, 0.02)', border: 'rgba(0, 0, 0, 0.08)', text: 'rgba(0, 0, 0, 0.87)', textSoft: 'rgba(0, 0, 0, 0.6)' },
        orb1: 'rgba(3, 105, 161, 0.08)', orb2: 'rgba(5, 150, 105, 0.06)'
    },
    ocean: {
        name: 'Deep Ocean',
        bg: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
        primary: { base: '#64ffda', light: '#80ffe8', glass: 'rgba(100, 255, 218, 0.1)' },
        accent: { amber: '#ffd700', coral: '#ff6b9d', sage: '#00d9ff', lavender: '#a78bfa' },
        pause: { base: '#ffd700', glass: 'rgba(255, 215, 0, 0.1)' },
        success: { base: '#00d9ff', glass: 'rgba(0, 217, 255, 0.1)' },
        neutral: { glass: 'rgba(100, 255, 218, 0.03)', border: 'rgba(100, 255, 218, 0.1)', text: 'rgba(204, 214, 246, 0.9)', textSoft: 'rgba(136, 146, 176, 0.7)' },
        orb1: 'rgba(100, 255, 218, 0.12)', orb2: 'rgba(0, 217, 255, 0.08)'
    },
    forest: {
        name: 'Forest Green',
        bg: 'linear-gradient(135deg, #1a2f23 0%, #2d4a35 100%)',
        primary: { base: '#7dd3c0', light: '#9de8d8', glass: 'rgba(125, 211, 192, 0.1)' },
        accent: { amber: '#f9c74f', coral: '#f8961e', sage: '#90be6d', lavender: '#b5a6d4' },
        pause: { base: '#f9c74f', glass: 'rgba(249, 199, 79, 0.1)' },
        success: { base: '#90be6d', glass: 'rgba(144, 190, 109, 0.1)' },
        neutral: { glass: 'rgba(255, 255, 255, 0.04)', border: 'rgba(125, 211, 192, 0.15)', text: 'rgba(255, 255, 255, 0.88)', textSoft: 'rgba(255, 255, 255, 0.65)' },
        orb1: 'rgba(125, 211, 192, 0.12)', orb2: 'rgba(144, 190, 109, 0.1)'
    }
};

// Funny, Motivational & Quirky Water Quotes
const WATER_QUOTES = [
    // Motivational
    "💧 Stay hydrated, stay awesome!",
    "🌊 Hydration is the foundation of good health!",
    "💪 Strong body, clear mind - it starts with water!",
    "⚡ Fuel your body with nature's perfect beverage!",
    "🚀 Launch into productivity with H2O power!",
    "🌟 Sparkle from the inside out - drink up!",
    "🎯 Champions stay hydrated. You're a champion!",
    "💎 Every sip is an investment in your future self!",
    "🎯 Goal: Become the most hydrated version of you!",
    "💎 Treat your body like the treasure it is!",
    "🔥 Water: The original fire extinguisher for burnout!",
    "🧘 Inner peace starts with proper hydration!",

    // Quirky
    "🦑 Be like an octopus - surrounded by water (internally)!",
    "🎪 Your cells are throwing a pool party - RSVP with water!",
    "🌐 Water: More reliable than your Wi-Fi connection!",
    "🎨 Picasso painted, you hydrate - both are art!",
    "🔮 Magic potion detected: Clear, tasteless, essential!",
    "🎵 H-2-O, H-2-O, it's off to drink we go!",
    "🌻 Be a well-watered plant, not a sad desk cactus!",
    "🔮 Plot twist: The secret to life is just... water!",
    "🔮 Fortune says: A glass of water brings clarity!",
    "🌺 Bloom like you just watered yourself (because you did)!",
    "🦄 Be magical like them!",
    "🎯 Achievement unlocked: Adulting with proper hydration!",
    "🌀 Water: The original life hack since 4 billion years ago!",
    "🎪 Step right up to the hydration station!",
    "🌊 Ride the wave of wellness - one sip at a time!",
    "💧 Drip by drip, you're doing amazing!",
    "🎁 Surprise! Your body loves water! Who knew?",
    "🌐 Stay connected to life's network: H2O!",
    "⏰ It's water o'clock somewhere! (It's here, it's now)"
];// Smart Reminder Quotes (Funny + Professional for paused/inactive users)
const SMART_REMINDER_QUOTES = [
    // Health & Wellness
    "💆 Fun fact: Hydration makes your skin glow! Your future self will thank you!",
    "🧠 Your brain is literally shrinking from dehydration. Let's fix that!",
    "😌 Stress? Anxiety? Try H2O therapy - it's free and tastes like nothing!",
    "✨ Flawless skin secret: It's not expensive cream, it's just... water!",
    "🎯 Productivity hack: Stay hydrated. Your brain runs 73% on water, not coffee!",
    "💪 Dehydration = Confusion, Fatigue, Grumpiness. Water = Superhuman mode!",
    
    // Funny Reminders
    "🚨 HYDRATION POLICE: You've been coding dry for 2 hours! Drink or face the consequences!",
    "🎪 Breaking news: Local developer forgets to drink water, becomes human raisin!",
    "💻 Status Update: Your body.exe has stopped responding. Try turning it on with water!",
    "🎮 Achievement locked: 'Actually Remembered to Drink Water'. Unlock it now!",
    "📢 PSA: Your body called. It said 'Hey, remember me? I need water!'",
    "🦸 Be a hero to your kidneys. They've been working hard. Give them water!",
    "☕ Debug tip: Before Googling that error, try hydrating. Works 60% of the time, every time!",
    "🏃 Running low on RAM? Download more water! (It actually works!)",
    "🎯 Pull request from your body: Please merge hydration into main branch ASAP!",
    
    // Mood & Mental Health
    "😊 Mood boost in 3... 2... 1... Just drink water! (Science approved!)",
    "🌈 Feeling foggy? 75% chance it's dehydration. The other 25%? Also dehydration!",
    "🎭 Plot twist: That afternoon slump isn't caffeine withdrawal, it's thirst!",
    "💡 Brain fog clearing spell: Drink water. Repeat. Watch magic happen!",
    "🧘 Zen Master says: The path to enlightenment starts with hydration!",
    
    // Professional Humor
    "📊 ROI on water: Reduced stress, improved focus, zero cost. Best investment ever!",
    "⚡ Energy levels low? Before reaching for caffeine, try the OG energy drink: Water!",
    "🎯 Peak performance requires peak hydration. Champions drink water!",
    "🔬 Science says: 2% dehydration = 20% brain performance loss. Time to hydrate!",
    "📈 Boost your KPIs: Key Performance Indicators include hydration levels!",
    "🚀 Mission critical: Fuel check required before launch. Drink water now!",
    "💼 Executive decision: Your wellness committee (your body) recommends water. Now!"
];

// Premium Glass Button
const GlassButton = ({ children, onClick, variant, icon, fullWidth = false, disabled = false, theme = 'dark' }: any) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const COLORS = THEMES[theme as Theme];
    const colors: any = {
        primary: { bg: COLORS.primary.glass, text: COLORS.primary.light, border: COLORS.primary.base },
        pause: { bg: COLORS.pause.glass, text: COLORS.accent.amber, border: COLORS.pause.base },
        success: { bg: COLORS.success.glass, text: COLORS.accent.sage, border: COLORS.success.base },
        lavender: { bg: 'rgba(184, 168, 212, 0.12)', text: COLORS.accent.lavender, border: COLORS.accent.lavender }
    };
    const colorScheme = colors[variant] || colors.primary;

    useEffect(() => {
        if (buttonRef.current) {
            buttonRef.current.style.opacity = '0';
            buttonRef.current.style.transform = 'scale(0.9)';
            requestAnimationFrame(() => {
                if (buttonRef.current) {
                    buttonRef.current.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                    buttonRef.current.style.opacity = '1';
                    buttonRef.current.style.transform = 'scale(1)';
                }
            });
        }
    }, []);

    const handleMouseEnter = () => {
        if (!disabled && buttonRef.current) {
            buttonRef.current.style.transform = 'scale(1.02)';
        }
    };

    const handleMouseLeave = () => {
        if (buttonRef.current) {
            buttonRef.current.style.transform = 'scale(1)';
        }
    };

    const handleClick = () => {
        if (!disabled && buttonRef.current) {
            buttonRef.current.style.transform = 'scale(0.95)';
            setTimeout(() => {
                if (buttonRef.current) buttonRef.current.style.transform = 'scale(1)';
            }, 150);
            onClick?.();
        }
    };

    return (
        <button
            ref={buttonRef}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            disabled={disabled}
            style={{
                position: 'relative', padding: '11px 22px', fontSize: '14px', fontWeight: '600', letterSpacing: '0.3px',
                border: `1px solid ${colorScheme.border}33`, 
                background: theme === 'neumorphic' ? COLORS.bg : colorScheme.bg,
                backdropFilter: 'blur(20px) saturate(180%)', 
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                color: colorScheme.text, 
                borderRadius: '14px', 
                cursor: disabled ? 'not-allowed' : 'pointer',
                width: fullWidth ? '100%' : 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                gap: '9px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: theme === 'neumorphic' 
                    ? '8px 8px 16px rgba(170, 180, 195, 0.6), -8px -8px 16px rgba(255, 255, 255, 0.9)'
                    : '0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.1)',
                opacity: disabled ? 0.5 : 1, overflow: 'hidden'
            }}
        >
            {icon && <span style={{ fontSize: '17px' }}>{icon}</span>}
            <span>{children}</span>
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', opacity: 0.6
            }} />
        </button>
    );
};



// Circular Timer Progress with anime.js
const CircularTimerProgress = ({ remainingSeconds, totalSeconds, dailyCount, dailyGoal, theme = 'dark' }: any) => {
    const COLORS = THEMES[theme as Theme];
    const circleRef = useRef<SVGCircleElement>(null);
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const percentage = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

    useEffect(() => {
        if (circleRef.current) {
            const offset = circumference - (percentage / 100) * circumference;
            circleRef.current.style.transition = 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)';
            circleRef.current.style.strokeDashoffset = String(offset);
        }
    }, [percentage, circumference]);

    const formatTime = (secs: number) => {
        const mins = Math.floor(secs / 60);
        const remainingSecs = secs % 60;
        return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto', overflow: 'visible' }}>
            <svg width="180" height="180" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
                <defs>
                    <linearGradient id={`circleGradient-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: COLORS.primary.base, stopOpacity: 1 }}>
                            <animate attributeName="stop-color" 
                                values={`${COLORS.primary.base};${COLORS.primary.light};${COLORS.accent.sage};${COLORS.primary.light};${COLORS.primary.base}`} 
                                dur="5s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="50%" style={{ stopColor: COLORS.primary.light, stopOpacity: 1 }}>
                            <animate attributeName="stop-color" 
                                values={`${COLORS.primary.light};${COLORS.accent.sage};${COLORS.primary.base};${COLORS.accent.sage};${COLORS.primary.light}`} 
                                dur="5s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="100%" style={{ stopColor: COLORS.accent.sage, stopOpacity: 1 }}>
                            <animate attributeName="stop-color" 
                                values={`${COLORS.accent.sage};${COLORS.primary.base};${COLORS.primary.light};${COLORS.primary.base};${COLORS.accent.sage}`} 
                                dur="5s" repeatCount="indefinite" />
                        </stop>
                    </linearGradient>
                    <filter id="progressGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <circle cx="90" cy="90" r={radius} stroke={COLORS.neutral.border} strokeWidth="6" fill="none" opacity="0.3" />
                <circle
                    ref={circleRef} cx="90" cy="90" r={radius} stroke={`url(#circleGradient-${theme})`} strokeWidth="8" fill="none"
                    strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference}
                    style={{ filter: 'url(#progressGlow)' }}
                />
            </svg>
            <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center'
            }}>
                <div style={{ fontSize: '32px', fontWeight: '300', fontFamily: '"SF Mono", monospace', color: COLORS.neutral.text, letterSpacing: '2px' }}>
                    {formatTime(remainingSeconds)}
                </div>
                <div style={{ fontSize: '11px', color: COLORS.neutral.textSoft, marginTop: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {dailyCount}/{dailyGoal} Today
                </div>
            </div>
        </div>
    );
};

// Animated Quote Display with Gradient Glow
const QuoteDisplay = ({ quote, theme }: { quote: string; theme: Theme }) => {
    const COLORS = THEMES[theme];
    // Extract emoji and text separately for proper rendering
    const emojiMatch = quote.match(/^([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+)/u);
    const emoji = emojiMatch ? emojiMatch[0] : '';
    const text = emoji ? quote.slice(emoji.length).trim() : quote;
    const quoteRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        if (quoteRef.current && textRef.current) {
            quoteRef.current.style.opacity = '0';
            quoteRef.current.style.transform = 'translateY(20px)';

            requestAnimationFrame(() => {
                if (quoteRef.current) {
                    quoteRef.current.style.transition = 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
                    quoteRef.current.style.opacity = '1';
                    quoteRef.current.style.transform = 'translateY(0)';
                }
            });

            // Simple fade-in without character splitting to preserve emojis
            if (textRef.current) {
                textRef.current.style.opacity = '0';
                textRef.current.style.transform = 'translateY(-10px)';
                requestAnimationFrame(() => {
                    if (textRef.current) {
                        textRef.current.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s';
                        textRef.current.style.opacity = '1';
                        textRef.current.style.transform = 'translateY(0)';
                    }
                });
            }
        }
    }, [quote]);

    return (
        <div ref={quoteRef} style={{
            padding: '18px 24px',
            background: 'linear-gradient(135deg, rgba(107, 155, 209, 0.08) 0%, rgba(168, 197, 161, 0.08) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '18px',
            border: '2px solid transparent',
            backgroundImage: `linear-gradient(135deg, ${theme === 'light' ? 'rgba(240, 249, 255, 0.9), rgba(224, 242, 254, 0.9)' : 'rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.9)'}), linear-gradient(90deg, ${COLORS.primary.base}, ${COLORS.accent.sage}, ${COLORS.accent.lavender}, ${COLORS.accent.amber}, ${COLORS.primary.base})`,
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
            backgroundSize: '100% 100%, 300% 300%',
            animation: 'gradientShift 8s ease infinite',
            textAlign: 'center',
            marginBottom: '20px',
            boxShadow: `0 8px 32px ${COLORS.primary.base}26, inset 0 1px 0 rgba(255,255,255,0.1)`,
            transition: 'all 0.5s ease'
        }}>
            <p ref={textRef} style={{
                fontSize: '13px', fontStyle: 'italic',
                color: COLORS.neutral.text,
                margin: 0, lineHeight: '1.7', letterSpacing: '0.4px', fontWeight: '500',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            }}>
                <span style={{
                    display: 'inline-block',
                    verticalAlign: 'baseline',
                    lineHeight: '1',
                    fontSize: '14px'
                }}>"{emoji} {text}"</span>
            </p>
        </div>
    );
};function App() {
    const getRandomQuote = () => WATER_QUOTES[Math.floor(Math.random() * WATER_QUOTES.length)];
    
    const [state, setState] = useState<TimerState>({
        remainingSeconds: 0, totalSeconds: 0, isRunning: false, isPaused: false,
        dailyCount: 0, dailyGoal: 8, intervalMinutes: 30,
        soundEnabled: true, soundType: 'alarm-1'
    });
    const [showSettings, setShowSettings] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [currentTheme, setCurrentTheme] = useState<Theme>('dark');
    const [viewMode, setViewMode] = useState<ViewMode>('normal');
    const [stats, setStats] = useState<any>({ currentStreak: 0, totalGlasses: 0, caffeineCount: 0, longestStreak: 0, weeklyAverage: 0 });
    const [currentQuote, setCurrentQuote] = useState(getRandomQuote());
    const containerRef = useRef<HTMLDivElement>(null);

    console.log('App component rendered', state);

    useEffect(() => {
        console.log('App mounted, containerRef:', containerRef.current);
        if (containerRef.current) {
            const children = Array.from(containerRef.current.children) as HTMLElement[];
            children.forEach((child, index) => {
                child.style.opacity = '0';
                child.style.transform = 'translateY(30px)';
                child.style.transition = 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                child.style.transitionDelay = `${index * 80}ms`;
                requestAnimationFrame(() => {
                    child.style.opacity = '1';
                    child.style.transform = 'translateY(0)';
                });
            });
        }
    }, []);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'update') {
                setState((prev: any) => ({
                    ...prev,
                    remainingSeconds: message.remainingSeconds, totalSeconds: message.totalSeconds,
                    isRunning: message.isRunning, isPaused: message.isPaused, dailyCount: message.dailyCount,
                    // Don't update dailyGoal and intervalMinutes here - let user interactions update them optimistically
                    // dailyGoal: message.dailyGoal || 8,
                    // intervalMinutes: message.intervalMinutes || 30,
                    caffeineCount: message.caffeineCount || 0
                }));
            } else if (message.type === 'intervalUpdated') {
                // Only update intervalMinutes when backend confirms the change
                setState((prev: any) => ({
                    ...prev,
                    intervalMinutes: message.intervalMinutes
                }));
            } else if (message.type === 'goalUpdated') {
                // Only update dailyGoal when backend confirms the change
                setState((prev: any) => ({
                    ...prev,
                    dailyGoal: message.dailyGoal
                }));
            } else if (message.type === 'stats') {
                setStats({
                    currentStreak: message.currentStreak || 0,
                    longestStreak: message.longestStreak || 0,
                    totalGlasses: message.totalGlasses || 0,
                    weeklyAverage: message.weeklyAverage || 0,
                    peakHours: message.peakHours || [],
                    caffeineCount: message.caffeineCount || 0,
                    recommendedWater: message.recommendedWater || 0
                });
            }
        };
        window.addEventListener('message', handleMessage);
        vscode.postMessage({ type: 'getState' });
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleStart = () => {
        setCurrentQuote(getRandomQuote());
        vscode.postMessage({ type: 'start' });
    };

    const handlePause = () => {
        setCurrentQuote(getRandomQuote());
        vscode.postMessage({ type: 'pause' });
    };
    const handleReset = () => {
        setCurrentQuote(getRandomQuote());
        vscode.postMessage({ type: 'reset' });
    };

    const showCelebration = () => {
        // Create celebration confetti effect
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            const colors = [COLORS.primary.base, COLORS.accent.sage, COLORS.accent.amber, COLORS.accent.lavender];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 10 + 5;
            const startX = Math.random() * window.innerWidth;
            const moveX = (Math.random() - 0.5) * 300;
            const moveY = Math.random() * 400 + 200;
            
            particle.style.cssText = `
                position: fixed; width: ${size}px; height: ${size}px;
                background: ${color}; border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                left: ${startX}px; top: -20px; pointer-events: none; z-index: 10000;
                opacity: 1; transition: all 2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            `;
            document.body.appendChild(particle);
            
            requestAnimationFrame(() => {
                particle.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${Math.random() * 720}deg)`;
                particle.style.opacity = '0';
            });
            
            setTimeout(() => particle.remove(), 2000);
        }
    };

    const handleDrankWater = () => {
        setCurrentQuote(getRandomQuote());
        
        // Check if reaching goal
        const willReachGoal = (state.dailyCount + 1) >= state.dailyGoal;
        
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: fixed; width: 100px; height: 100px; border-radius: 50%;
            background: radial-gradient(circle, ${COLORS.accent.sage}40 0%, transparent 70%);
            pointer-events: none; z-index: 9999; top: 50%; left: 50%; transform: translate(-50%, -50%);
        `;
        document.body.appendChild(ripple);
        ripple.style.transform = 'translate(-50%, -50%) scale(0)';
        ripple.style.opacity = '0.7';
        ripple.style.transition = 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
        requestAnimationFrame(() => {
            ripple.style.transform = 'translate(-50%, -50%) scale(4)';
            ripple.style.opacity = '0';
        });
        setTimeout(() => ripple.remove(), 1200);
        
        vscode.postMessage({ type: 'drankWater' });
        
        // Show celebration if reaching goal
        if (willReachGoal) {
            setTimeout(() => showCelebration(), 500);
        }
        
        // Always auto-restart timer after drinking water
        setTimeout(() => {
            vscode.postMessage({ type: 'start' });
        }, 1500);
    };

    const handleIntervalChange = (minutes: number) => {
        // Update local state immediately for responsiveness
        setState(prev => ({ ...prev, intervalMinutes: minutes }));
        vscode.postMessage({ type: 'updateInterval', intervalMinutes: minutes });
    };
    const handleGoalChange = (goal: number) => {
        // Update local state immediately for responsiveness
        setState(prev => ({ ...prev, dailyGoal: goal }));
        vscode.postMessage({ type: 'updateGoal', dailyGoal: goal });
    };

    const handleGoalIncrement = () => {
        setState(prev => {
            const newGoal = Math.min(20, prev.dailyGoal + 1);
            vscode.postMessage({ type: 'updateGoal', dailyGoal: newGoal });
            return { ...prev, dailyGoal: newGoal };
        });
    };

    const handleGoalDecrement = () => {
        setState(prev => {
            const newGoal = Math.max(1, prev.dailyGoal - 1);
            vscode.postMessage({ type: 'updateGoal', dailyGoal: newGoal });
            return { ...prev, dailyGoal: newGoal };
        });
    };

    const theme = THEMES[currentTheme];
    const COLORS = theme; // Use current theme colors

    const percentage = Math.min(100, Math.round((state.dailyCount / state.dailyGoal) * 100));
    const statusText = state.isRunning && !state.isPaused ? 'Active' : state.isPaused ? 'Paused' : 'Ready';
    const intervalPresets = [30, 45, 60, 90, 120];

    return (
        <div style={{
            minHeight: '100vh',
            background: theme.bg,
            position: 'relative', overflow: 'hidden',
            transition: 'background 0.5s ease'
        }}>
            {/* Professional Animated Background */}
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'radial-gradient(circle at 20% 30%, rgba(107, 155, 209, 0.15) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(168, 197, 161, 0.12) 0%, transparent 40%)',
                animation: 'drift 15s ease-in-out infinite', pointerEvents: 'none'
            }} />
            <div style={{
                position: 'fixed', top: '10%', left: '10%', width: '300px', height: '300px',
                background: `radial-gradient(circle, ${theme.orb1} 0%, transparent 70%)`,
                borderRadius: '50%', filter: 'blur(60px)',
                animation: 'float 20s ease-in-out infinite', pointerEvents: 'none',
                transition: 'background 0.5s ease'
            }} />
            <div style={{
                position: 'fixed', bottom: '10%', right: '10%', width: '250px', height: '250px',
                background: `radial-gradient(circle, ${theme.orb2} 0%, transparent 70%)`,
                borderRadius: '50%', filter: 'blur(60px)',
                animation: 'float 18s ease-in-out infinite reverse', pointerEvents: 'none',
                transition: 'background 0.5s ease'
            }} />
            <style>{`
                @keyframes drift {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(20px, -20px); }
                }
                @keyframes float {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -30px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div ref={containerRef} style={{
                padding: viewMode === 'compact' ? '16px 12px' : '24px 20px',
                maxWidth: viewMode === 'compact' ? '360px' : '420px',
                margin: '0 auto',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
                position: 'relative', zIndex: 1,
                transition: 'all 0.3s ease'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '20px', opacity: 0 }}>
                    <div style={{ fontSize: '42px', marginBottom: '10px', filter: 'drop-shadow(0 4px 16px rgba(107, 155, 209, 0.3))' }}>💧</div>
                    <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '4px', color: COLORS.neutral.text, letterSpacing: '-0.5px' }}>
                        Water Reminder
                    </h1>
                    <p style={{ fontSize: '12px', color: COLORS.neutral.textSoft, margin: 0 }}>Stay hydrated, stay focused</p>
                </div>

                <div style={{ opacity: 0 }}><QuoteDisplay quote={currentQuote} theme={currentTheme} /></div>

                <div style={{
                    textAlign: 'center', marginBottom: '20px', padding: '28px 20px',
                    background: (currentTheme === 'light' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(15, 23, 42, 0.6)'),
                    backdropFilter: 'blur(20px)', 
                    WebkitBackdropFilter: 'blur(20px)', 
                    borderRadius: '24px', 
                    border: `1px solid ${COLORS.neutral.border}`,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)', 
                    opacity: 0,
                    transition: 'all 0.5s ease'
                }}>
                    <CircularTimerProgress 
                        remainingSeconds={state.remainingSeconds} 
                        totalSeconds={state.totalSeconds}
                        dailyCount={state.dailyCount}
                        dailyGoal={state.dailyGoal}
                        theme={currentTheme}
                    />
                    <div style={{
                        fontSize: '11px', fontWeight: '600', color: COLORS.neutral.textSoft,
                        textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '16px'
                    }}>{statusText}</div>
                </div>



                <div style={{ marginBottom: '14px', opacity: 0 }}>
                    <GlassButton variant="lavender" icon="⚙" fullWidth onClick={() => setShowSettings(!showSettings)} theme={currentTheme}>
                        {showSettings ? 'Hide Settings' : 'Show Settings'}
                    </GlassButton>
                </div>

                {showSettings && (
                    <div style={{
                        marginBottom: '20px', padding: '20px',
                        background: currentTheme === 'light' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(20px)', 
                        WebkitBackdropFilter: 'blur(20px)',
                        borderRadius: '18px', 
                        border: `1px solid ${COLORS.neutral.border}`,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                        transition: 'all 0.3s ease'
                    }}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                fontSize: '11px', fontWeight: '700', marginBottom: '10px', display: 'block',
                                color: COLORS.neutral.textSoft, textTransform: 'uppercase', letterSpacing: '1.2px'
                            }}>Theme</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {(['dark', 'light', 'ocean', 'forest'] as Theme[]).map(t => (
                                    <button key={t} onClick={() => setCurrentTheme(t)} style={{
                                        padding: '10px', 
                                        border: `2px solid ${currentTheme === t ? COLORS.primary.base : COLORS.neutral.border}`,
                                        background: currentTheme === t ? COLORS.primary.glass : (currentTheme === 'light' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(15, 23, 42, 0.4)'),
                                        backdropFilter: 'blur(10px)', 
                                        color: currentTheme === t ? COLORS.primary.light : COLORS.neutral.text,
                                        borderRadius: '10px', 
                                        cursor: 'pointer', fontSize: '11px', fontWeight: '600',
                                        transition: 'all 0.3s', textTransform: 'capitalize',
                                        boxShadow: 'none'
                                    }}>
                                        {THEMES[t].name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                fontSize: '11px', fontWeight: '700', marginBottom: '10px', display: 'block',
                                color: COLORS.neutral.textSoft, textTransform: 'uppercase', letterSpacing: '1.2px'
                            }}>View Mode</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <button onClick={() => setViewMode('normal')} style={{
                                    padding: '10px', 
                                    border: `2px solid ${viewMode === 'normal' ? COLORS.primary.base : COLORS.neutral.border}`,
                                    background: viewMode === 'normal' ? COLORS.primary.glass : 'rgba(15, 23, 42, 0.4)',
                                    backdropFilter: 'blur(10px)', 
                                    color: viewMode === 'normal' ? COLORS.primary.light : COLORS.neutral.text,
                                    borderRadius: '10px', 
                                    cursor: 'pointer', fontSize: '11px', fontWeight: '600',
                                    transition: 'all 0.3s',
                                    boxShadow: 'none'
                                }}>
                                    📱 Normal
                                </button>
                                <button onClick={() => setViewMode('compact')} style={{
                                    padding: '10px', 
                                    border: `2px solid ${viewMode === 'compact' ? COLORS.primary.base : COLORS.neutral.border}`,
                                    background: viewMode === 'compact' ? COLORS.primary.glass : 'rgba(15, 23, 42, 0.4)',
                                    backdropFilter: 'blur(10px)', 
                                    color: viewMode === 'compact' ? COLORS.primary.light : COLORS.neutral.text,
                                    borderRadius: '10px', 
                                    cursor: 'pointer', fontSize: '11px', fontWeight: '600',
                                    transition: 'all 0.3s',
                                    boxShadow: 'none'
                                }}>
                                    📦 Compact
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                fontSize: '11px', fontWeight: '700', marginBottom: '10px', display: 'block',
                                color: COLORS.neutral.textSoft, textTransform: 'uppercase', letterSpacing: '1.2px'
                            }}>Reminder Interval</label>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {intervalPresets.map(minutes => (
                                    <button key={minutes} onClick={() => handleIntervalChange(minutes)} style={{
                                        padding: '8px 14px', 
                                        border: state.intervalMinutes === minutes ? `1px solid ${COLORS.accent.amber}` : `1px solid ${COLORS.neutral.border}`,
                                        background: state.intervalMinutes === minutes ? COLORS.pause.glass : (currentTheme === 'light' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(15, 23, 42, 0.4)'),
                                        backdropFilter: 'blur(10px)', 
                                        color: state.intervalMinutes === minutes ? COLORS.accent.amber : COLORS.neutral.textSoft,
                                        borderRadius: '10px', 
                                        cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s',
                                        boxShadow: 'none'
                                    }}>
                                        {minutes}m
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label style={{
                                fontSize: '11px', fontWeight: '700', marginBottom: '10px', display: 'block',
                                color: COLORS.neutral.textSoft, textTransform: 'uppercase', letterSpacing: '1.2px'
                            }}>Daily Goal</label>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button onClick={handleGoalDecrement} disabled={state.dailyGoal <= 1} style={{
                                    padding: '10px 16px', 
                                    border: `1px solid ${COLORS.neutral.border}`,
                                    background: currentTheme === 'light' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(15, 23, 42, 0.4)',
                                    backdropFilter: 'blur(10px)', 
                                    color: COLORS.neutral.text, 
                                    borderRadius: '10px',
                                    cursor: state.dailyGoal > 1 ? 'pointer' : 'not-allowed', fontSize: '18px', fontWeight: '600',
                                    transition: 'all 0.2s', opacity: state.dailyGoal > 1 ? 1 : 0.4,
                                    boxShadow: 'none'
                                }}>−</button>
                                <div style={{
                                    flex: 1, textAlign: 'center', fontSize: '16px', fontWeight: '600', padding: '10px',
                                    background: currentTheme === 'light' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(15, 23, 42, 0.4)',
                                    backdropFilter: 'blur(10px)', 
                                    borderRadius: '10px',
                                    border: `1px solid ${COLORS.neutral.border}`, 
                                    color: COLORS.neutral.text,
                                    boxShadow: 'none'
                                }}>{state.dailyGoal} glasses</div>
                                <button onClick={handleGoalIncrement} disabled={state.dailyGoal >= 20} style={{
                                    padding: '10px 16px', 
                                    border: `1px solid ${COLORS.neutral.border}`,
                                    background: currentTheme === 'light' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(15, 23, 42, 0.4)',
                                    backdropFilter: 'blur(10px)', 
                                    color: COLORS.neutral.text, 
                                    borderRadius: '10px',
                                    cursor: state.dailyGoal < 20 ? 'pointer' : 'not-allowed', fontSize: '18px', fontWeight: '600',
                                    transition: 'all 0.2s', opacity: state.dailyGoal < 20 ? 1 : 0.4,
                                    boxShadow: 'none'
                                }}>+</button>
                            </div>
                        </div>

                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px', opacity: 0 }}>
                    {state.isRunning && !state.isPaused ? (
                        <GlassButton variant="pause" icon="⏸" fullWidth onClick={handlePause} theme={currentTheme}>Pause</GlassButton>
                    ) : (
                        <GlassButton variant="primary" icon="▶" fullWidth onClick={handleStart} theme={currentTheme}>
                            {state.isPaused ? 'Resume' : 'Start'}
                        </GlassButton>
                    )}
                    <GlassButton variant="pause" icon="↻" fullWidth onClick={handleReset} theme={currentTheme}>Reset</GlassButton>
                </div>

                <div style={{ marginBottom: '12px', opacity: 0 }}>
                    <GlassButton variant="success" icon="💧" fullWidth onClick={handleDrankWater} theme={currentTheme}>Log Water Intake</GlassButton>
                </div>

                <div style={{ marginBottom: '14px', opacity: 0 }}>
                    <GlassButton variant="lavender" icon="☕" fullWidth onClick={() => vscode.postMessage({ type: 'logCaffeine' })} theme={currentTheme}>
                        Log Caffeine
                    </GlassButton>
                </div>

                <div style={{ marginBottom: '14px', opacity: 0 }}>
                    <GlassButton variant="primary" icon="📊" fullWidth onClick={() => { setShowStats(!showStats); if (!showStats) vscode.postMessage({ type: 'getStats' }); }} theme={currentTheme}>
                        {showStats ? 'Hide Stats' : 'Show Stats'}
                    </GlassButton>
                </div>

                {showStats && (
                    <div style={{
                        marginBottom: '20px', padding: '20px',
                        background: currentTheme === 'light' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(20px)', 
                        WebkitBackdropFilter: 'blur(20px)',
                        borderRadius: '18px', 
                        border: `1px solid ${COLORS.neutral.border}`,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                        animation: 'fadeIn 0.3s ease-in-out',
                        transition: 'all 0.5s ease'
                    }}>
                        <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: COLORS.neutral.text, textTransform: 'uppercase', letterSpacing: '1.2px', textAlign: 'center' }}>
                            📊 Your Hydration Stats
                        </h3>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            <div style={{ padding: '12px', background: COLORS.primary.glass, borderRadius: '12px', border: `1px solid ${COLORS.primary.base}40` }}>
                                <div style={{ fontSize: '10px', color: COLORS.neutral.textSoft, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Streak</div>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary.base }}>🔥 {stats.currentStreak} days</div>
                            </div>
                            <div style={{ padding: '12px', background: COLORS.success.glass, borderRadius: '12px', border: `1px solid ${COLORS.accent.sage}40` }}>
                                <div style={{ fontSize: '10px', color: COLORS.neutral.textSoft, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Glasses</div>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.accent.sage }}>💧 {stats.totalGlasses}</div>
                            </div>
                            <div style={{ padding: '12px', background: COLORS.pause.glass, borderRadius: '12px', border: `1px solid ${COLORS.accent.amber}40` }}>
                                <div style={{ fontSize: '10px', color: COLORS.neutral.textSoft, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Longest Streak</div>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.accent.amber }}>🏆 {stats.longestStreak} days</div>
                            </div>
                            <div style={{ padding: '12px', background: 'rgba(168, 168, 212, 0.12)', borderRadius: '12px', border: `1px solid ${COLORS.accent.lavender}40` }}>
                                <div style={{ fontSize: '10px', color: COLORS.neutral.textSoft, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Caffeine Today</div>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.accent.lavender }}>☕ {stats.caffeineCount || 0} cups</div>
                            </div>
                            {(stats.caffeineCount || 0) > 0 && (
                                <div style={{ padding: '12px', background: 'rgba(255, 100, 100, 0.1)', borderRadius: '12px', border: '1px solid rgba(255, 100, 100, 0.3)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '11px', color: COLORS.neutral.text }}>
                                        💡 Recommended: {stats.recommendedWater} extra glasses to offset caffeine
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;

