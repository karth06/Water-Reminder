import '@testing-library/jest-dom';

// Mock VSCode API
(global as any).acquireVsCodeApi = () => ({
    postMessage: jest.fn(),
    setState: jest.fn(),
    getState: jest.fn()
});

// Mock matchMedia for Ant Design
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Mock fetch
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({ q: "Stay hydrated!", a: "Water Bot" }),
    })
) as jest.Mock;
