/**
 * Jest setup file for comprehensive testing
 * Configures global mocks and test utilities
 */

// Increase timeout for all tests
jest.setTimeout(30000);

// Mock console methods to reduce noise during testing
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

// Only show console output for actual errors during tests
console.error = (...args) => {
  // Only show actual errors, not expected test errors
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Test error')) {
    return;
  }
  originalConsoleError(...args);
};

console.warn = (...args) => {
  // Suppress expected warnings during tests
  if (args[0] && typeof args[0] === 'string' && 
      (args[0].includes('Test warning') || args[0].includes('Mock'))) {
    return;
  }
  originalConsoleWarn(...args);
};

// Suppress info logs during tests unless explicitly needed
console.log = (...args) => {
  if (process.env.JEST_VERBOSE === 'true') {
    originalConsoleLog(...args);
  }
};

// Global test utilities
global.testUtils = {
  // Create a mock question for testing
  createMockQuestion: (overrides = {}) => ({
    id: 'test_001',
    type: 'multiple_choice',
    prompt: 'Test question?',
    options: ['A', 'B', 'C', 'D'],
    answer: 'A',
    feedback: 'Test feedback',
    difficulty: 1,
    subject: 'test',
    topic: 'testing',
    ...overrides
  }),

  // Create a mock question set
  createMockQuestionSet: (count = 3, overrides = {}) => ({
    questions: Array.from({ length: count }, (_, i) => 
      global.testUtils.createMockQuestion({
        id: `test_${i + 1}`,
        prompt: `Test question ${i + 1}?`,
        ...overrides
      })
    ),
    metadata: {
      title: 'Test Question Set',
      description: 'Questions for testing',
      version: '1.0',
      author: 'Test Suite',
      ...overrides.metadata
    }
  }),

  // Wait for a specified amount of time
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Create a performance timer
  createTimer: () => {
    const start = Date.now();
    return {
      elapsed: () => Date.now() - start,
      stop: () => Date.now() - start
    };
  },

  // Mock DOM element
  createMockElement: (tag = 'div') => ({
    tagName: tag.toUpperCase(),
    style: {},
    textContent: '',
    innerHTML: '',
    id: '',
    className: '',
    children: [],
    parentNode: null,
    appendChild: jest.fn(function(child) {
      this.children.push(child);
      child.parentNode = this;
      return child;
    }),
    removeChild: jest.fn(function(child) {
      const index = this.children.indexOf(child);
      if (index > -1) {
        this.children.splice(index, 1);
        child.parentNode = null;
      }
      return child;
    }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getAttribute: jest.fn(),
    setAttribute: jest.fn(),
    removeAttribute: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(() => false),
      toggle: jest.fn()
    },
    click: jest.fn(),
    focus: jest.fn(),
    blur: jest.fn()
  }),

  // Mock fetch response
  createMockFetchResponse: (data, ok = true, status = 200) => ({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: jest.fn(() => Promise.resolve(data)),
    text: jest.fn(() => Promise.resolve(JSON.stringify(data))),
    headers: new Map()
  }),

  // Performance measurement utilities
  measurePerformance: async (fn, iterations = 1) => {
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await fn();
      const end = Date.now();
      times.push(end - start);
    }
    
    return {
      times,
      average: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      total: times.reduce((a, b) => a + b, 0)
    };
  },

  // Memory usage utilities
  getMemoryUsage: () => {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage();
    }
    return { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 };
  },

  // Simulate user interactions
  simulateUserInteraction: {
    click: (element) => {
      if (element.click) element.click();
      if (element.eventListeners && element.eventListeners.click) {
        element.eventListeners.click.forEach(handler => handler({ type: 'click' }));
      }
    },
    
    keyPress: (element, key) => {
      const event = { type: 'keydown', key };
      if (element.eventListeners && element.eventListeners.keydown) {
        element.eventListeners.keydown.forEach(handler => handler(event));
      }
    },
    
    input: (element, value) => {
      element.value = value;
      const event = { type: 'input', target: element };
      if (element.eventListeners && element.eventListeners.input) {
        element.eventListeners.input.forEach(handler => handler(event));
      }
    }
  }
};

// Global mocks for browser APIs
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn();

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => [])
};

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Cleanup after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset console methods if they were mocked
  if (console.error !== originalConsoleError) {
    console.error = originalConsoleError;
  }
  if (console.warn !== originalConsoleWarn) {
    console.warn = originalConsoleWarn;
  }
  if (console.log !== originalConsoleLog) {
    console.log = originalConsoleLog;
  }
});

// Global cleanup
afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});