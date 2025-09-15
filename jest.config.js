/**
 * Jest configuration for comprehensive testing suite
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/test/**/*.test.js',
    '**/__tests__/**/*.js'
  ],
  
  // Coverage configuration
  collectCoverage: false, // Enable only when explicitly requested
  collectCoverageFrom: [
    'game/**/*.js',
    '!game/**/*.test.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    }
  },
  
  // Test timeout (30 seconds for performance tests)
  testTimeout: 30000,
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  
  // Module paths
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // Transform configuration
  transform: {},
  
  // Verbose output for better debugging
  verbose: true,
  
  // Error handling
  bail: false, // Don't stop on first failure
  maxWorkers: '50%', // Use half of available CPU cores
  
  // Test result processor
  reporters: ['default'],
  
  // Global variables available in tests
  globals: {
    'NODE_ENV': 'test'
  },
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Test categories with different configurations
  projects: [
    {
      displayName: 'unit',
      testMatch: ['**/test/**/content-loader.test.js', '**/test/**/game-state.test.js', '**/test/**/question-presenter.test.js', '**/test/**/runner-mechanics.test.js'],
      testTimeout: 10000
    },
    {
      displayName: 'integration',
      testMatch: ['**/test/**/integration.test.js'],
      testTimeout: 20000
    },
    {
      displayName: 'performance',
      testMatch: ['**/test/**/performance.test.js'],
      testTimeout: 60000
    },
    {
      displayName: 'browser-compatibility',
      testMatch: ['**/test/**/browser-compatibility.test.js'],
      testTimeout: 15000
    }
  ]
};