"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const arcadeui_1 = require("arcadeui");
// @ts-ignore
const vscode = acquireVsCodeApi();
function App() {
    const [state, setState] = (0, react_1.useState)({
        remainingSeconds: 0,
        totalSeconds: 0,
        isRunning: false,
        isPaused: false,
        dailyCount: 0,
        dailyGoal: 8
    });
    (0, react_1.useEffect)(() => {
        const handleMessage = (event) => {
            const message = event.data;
            if (message.type === 'update') {
                setState({
                    remainingSeconds: message.remainingSeconds,
                    totalSeconds: message.totalSeconds,
                    isRunning: message.isRunning,
                    isPaused: message.isPaused,
                    dailyCount: message.dailyCount,
                    dailyGoal: message.dailyGoal
                });
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    const handleStart = () => vscode.postMessage({ type: 'start' });
    const handlePause = () => vscode.postMessage({ type: 'pause' });
    const handleReset = () => vscode.postMessage({ type: 'reset' });
    const handleDrankWater = () => vscode.postMessage({ type: 'drankWater' });
    const percentage = Math.min(100, Math.round((state.dailyCount / state.dailyGoal) * 100));
    const statusText = state.isRunning && !state.isPaused ? 'Running' :
        state.isPaused ? 'Paused' : 'Ready';
    return (<div style={{ padding: '16px', maxWidth: '360px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
                    💧 Water Reminder
                </h2>
                <p style={{ fontSize: '14px', color: '#888' }}>
                    Stay hydrated while coding
                </p>
            </div>

            {/* Timer Card */}
            <arcadeui_1.Card variant="elevated" title="Timer" style={{ marginBottom: '16px' }}>
                <div style={{ textAlign: 'center', padding: '8px' }}>
                    <div style={{
            fontSize: '48px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            marginBottom: '8px'
        }}>
                        {formatTime(state.remainingSeconds)}
                    </div>
                    <div style={{ fontSize: '14px', color: '#888' }}>
                        {statusText}
                    </div>
                </div>
            </arcadeui_1.Card>

            {/* Progress Card */}
            <arcadeui_1.Card variant="elevated" title="Today's Progress" style={{ marginBottom: '16px' }}>
                <div style={{ padding: '8px' }}>
                    <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '12px'
        }}>
                        {state.dailyCount} / {state.dailyGoal}
                    </div>
                    <div style={{
            width: '100%',
            height: '8px',
            background: '#e0e0e0',
            borderRadius: '4px',
            overflow: 'hidden'
        }}>
                        <div style={{
            width: `${percentage}%`,
            height: '100%',
            background: '#4caf50',
            transition: 'width 0.3s ease'
        }}/>
                    </div>
                </div>
            </arcadeui_1.Card>

            {/* Controls */}
            <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '8px'
        }}>
                {state.isRunning && !state.isPaused ? (<arcadeui_1.Button variant="secondary" onClick={handlePause} style={{ width: '100%' }}>
                        Pause
                    </arcadeui_1.Button>) : (<arcadeui_1.Button variant="primary" onClick={handleStart} style={{ width: '100%' }}>
                        {state.isPaused ? 'Resume' : 'Start'}
                    </arcadeui_1.Button>)}
                <arcadeui_1.Button variant="secondary" onClick={handleReset} style={{ width: '100%' }}>
                    Reset
                </arcadeui_1.Button>
            </div>

            <arcadeui_1.Button variant="success" onClick={handleDrankWater} style={{ width: '100%' }}>
                I Drank Water
            </arcadeui_1.Button>
        </div>);
}
exports.default = App;
//# sourceMappingURL=App.js.map