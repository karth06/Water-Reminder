module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/webview-ui'],
    testMatch: ['**/__tests__/**/*.test.tsx', '**/__tests__/**/*.test.ts'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: {
                jsx: 'react',
                esModuleInterop: true,
                allowSyntheticDefaultImports: true
            }
        }]
    },
    collectCoverageFrom: [
        'webview-ui/**/*.{ts,tsx}',
        '!webview-ui/**/*.d.ts',
        '!webview-ui/index.tsx'
    ],
    setupFilesAfterEnv: ['<rootDir>/webview-ui/__tests__/setup.ts']
};
