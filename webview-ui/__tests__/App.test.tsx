import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

describe('Water Reminder App', () => {
    beforeEach(() => {
        // Mock VSCode API
        (global as any).acquireVsCodeApi = () => ({
            postMessage: jest.fn(),
            setState: jest.fn(),
            getState: jest.fn()
        });
    });

    test('renders Water Reminder heading', () => {
        render(<App />);
        const heading = screen.getByText(/Water Reminder/i);
        expect(heading).toBeInTheDocument();
    });

    test('renders motivational quote', () => {
        render(<App />);
        // Should have a quote in quotes
        const quoteElements = screen.getAllByText(/"/);
        expect(quoteElements.length).toBeGreaterThan(0);
    });

    test('renders Start button initially', () => {
        render(<App />);
        const startButton = screen.getByText(/Start/i);
        expect(startButton).toBeInTheDocument();
    });

    test('renders Reset button', () => {
        render(<App />);
        const resetButton = screen.getByText(/Reset/i);
        expect(resetButton).toBeInTheDocument();
    });

    test('renders I Drank Water button', () => {
        render(<App />);
        const drankButton = screen.getByText(/I Drank Water/i);
        expect(drankButton).toBeInTheDocument();
    });

    test('circular timer progress is rendered', () => {
        const { container } = render(<App />);
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });

    test('displays timer in MM:SS format', () => {
        const { container } = render(<App />);
        // Timer should show 00:00 or similar format
        const timerPattern = /\d{2}:\d{2}/;
        const timerElement = container.querySelector('div[style*="font-family"]');
        expect(timerElement?.textContent).toMatch(timerPattern);
    });

    test('buttons are clickable and not disabled', () => {
        render(<App />);
        const startButton = screen.getByText(/Start/i);
        const resetButton = screen.getByText(/Reset/i);
        const drankButton = screen.getByText(/I Drank Water/i);

        expect(startButton).not.toBeDisabled();
        expect(resetButton).not.toBeDisabled();
        expect(drankButton).not.toBeDisabled();
    });

    test('renders with dark background theme', () => {
        const { container } = render(<App />);
        const mainDiv = container.firstChild as HTMLElement;
        expect(mainDiv.style.background).toContain('gradient');
    });

    test('renders animated background elements', () => {
        const { container } = render(<App />);
        const backgroundDivs = container.querySelectorAll('div[style*="radial-gradient"]');
        expect(backgroundDivs.length).toBeGreaterThan(0);
    });

    test('quote has gradient glow styling', () => {
        const { container } = render(<App />);
        const quoteContainer = container.querySelector('div[style*="background-image"]');
        expect(quoteContainer).toBeInTheDocument();
    });

    test('circular progress displays daily count', () => {
        const { container } = render(<App />);
        // Should show something like "0/8" for daily count
        const countText = screen.getByText(/\/\d+/);
        expect(countText).toBeInTheDocument();
    });
});
