/**
 * Simple test runner for ContentLoader
 */

// Mock console for cleaner output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Simple test framework
class SimpleTest {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    describe(name, fn) {
        console.log(`\n📋 ${name}`);
        fn();
    }

    test(name, fn) {
        try {
            fn();
            console.log(`  ✅ ${name}`);
            this.passed++;
        } catch (error) {
            console.log(`  ❌ ${name}`);
            console.log(`     Error: ${error.message}`);
            this.failed++;
        }
    }

    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected}, got ${actual}`);
                }
            },
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
                }
            },
            toBeNull: () => {
                if (actual !== null) {
                    throw new Error(`Expected null, got ${actual}`);
                }
            },
            toBeUndefined: () => {
                if (actual !== undefined) {
                    throw new Error(`Expected undefined, got ${actual}`);
                }
            },
            toHaveLength: (expected) => {
                if (!actual || actual.length !== expected) {
                    throw new Error(`Expected length ${expected}, got ${actual ? actual.length : 'undefined'}`);
                }
            },
            toContain: (expected) => {
                if (!actual || !actual.includes(expected)) {
                    throw new Error(`Expected "${actual}" to contain "${expected}"`);
                }
            }
        };
    }

    summary() {
        console.log(`\n📊 Test Summary:`);
        console.log(`   Passed: ${this.passed}`);
        console.log(`   Failed: ${this.failed}`);
        console.log(`   Total: ${this.passed + this.failed}`);
        
        if (this.failed === 0) {
            console.log(`\n🎉 All tests passed!`);
        } else {
            console.log(`\n💥 ${this.failed} test(s) failed`);
        }
    }
}

// Mock fetch
global.fetch = function(url) {
    // Return different responses based on URL for testing
    if (url.includes('valid')) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                questions: [
                    {
                        prompt: 'What is 2 + 2?',
                        options: ['3', '4', '5'],
                        answer: '4',
                        feedback: 'Correct!'
                    }
                ],
                metadata: { title: 'Test' }
            })
        });
    } else if (url.includes('404')) {
        return Promise.resolve({
            ok: false,
            status: 404
        });
    } else if (url.includes('malformed')) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.reject(new Error('Invalid JSON'))
        });
    } else {
        return Promise.reject(new Error('Network error'));
    }
};

// Load ContentLoader - handle both module and browser environments
let ContentLoader;
try {
    console.log('Attempting to load ContentLoader...');
    ContentLoader = require('../game/content-loader.js');
    console.log('ContentLoader loaded successfully');
} catch (e) {
    console.log('Require failed, trying alternative method:', e.message);
    // If require fails, try to load it differently
    const fs = require('fs');
    const path = require('path');
    const contentLoaderCode = fs.readFileSync(path.join(__dirname, '../game/content-loader.js'), 'utf8');
    eval(contentLoaderCode);
    console.log('ContentLoader loaded via eval');
}

// Create test instance
const test = new SimpleTest();

// Run tests
test.describe('ContentLoader Tests', () => {
    
    test.test('should initialize with empty state', () => {
        const loader = new ContentLoader();
        test.expect(loader.questions).toEqual([]);
        test.expect(loader.metadata).toEqual({});
        test.expect(loader.currentQuestionIndex).toBe(0);
    });

    test.test('should load valid questions successfully', async () => {
        const loader = new ContentLoader();
        const result = await loader.loadQuestions('valid.json');
        
        test.expect(result.success).toBe(true);
        test.expect(loader.questions).toHaveLength(1);
        test.expect(loader.questions[0].prompt).toBe('What is 2 + 2?');
    });

    test.test('should handle 404 errors', async () => {
        const loader = new ContentLoader();
        const result = await loader.loadQuestions('404.json');
        
        test.expect(result.success).toBe(false);
        test.expect(result.error).toContain('Question file not found');
    });

    test.test('should handle malformed JSON', async () => {
        const loader = new ContentLoader();
        const result = await loader.loadQuestions('malformed.json');
        
        test.expect(result.success).toBe(false);
        test.expect(result.error).toContain('Invalid JSON format');
    });

    test.test('should validate question format correctly', () => {
        const loader = new ContentLoader();
        
        const validData = {
            questions: [
                {
                    prompt: 'Test?',
                    options: ['A', 'B'],
                    answer: 'A',
                    feedback: 'Good!'
                }
            ]
        };
        
        const result = loader.validateQuestionFormat(validData);
        test.expect(result.isValid).toBe(true);
        test.expect(result.errors).toHaveLength(0);
    });

    test.test('should reject invalid question format', () => {
        const loader = new ContentLoader();
        
        const invalidData = {
            questions: [
                {
                    prompt: '',
                    options: ['A'],
                    answer: 'B',
                    feedback: ''
                }
            ]
        };
        
        const result = loader.validateQuestionFormat(invalidData);
        test.expect(result.isValid).toBe(false);
        test.expect(result.errors.length > 0).toBe(true);
    });

    test.test('should cycle through questions', async () => {
        const loader = new ContentLoader();
        
        // Mock multiple questions
        global.fetch = () => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                questions: [
                    { prompt: 'Q1', options: ['A', 'B'], answer: 'A', feedback: 'F1' },
                    { prompt: 'Q2', options: ['C', 'D'], answer: 'C', feedback: 'F2' }
                ]
            })
        });
        
        await loader.loadQuestions('test.json');
        
        const q1 = loader.getNextQuestion();
        const q2 = loader.getNextQuestion();
        const q1Again = loader.getNextQuestion();
        
        test.expect(q1.prompt).toBe('Q1');
        test.expect(q2.prompt).toBe('Q2');
        test.expect(q1Again.prompt).toBe('Q1');
    });

    test.test('should return null for empty question set', () => {
        const loader = new ContentLoader();
        test.expect(loader.getNextQuestion()).toBeNull();
    });

    test.test('utility methods should work correctly', () => {
        const loader = new ContentLoader();
        
        test.expect(loader.getQuestionCount()).toBe(0);
        test.expect(loader.hasQuestions()).toBe(false);
        test.expect(loader.getQuestionByIndex(0)).toBeNull();
        test.expect(loader.getCurrentQuestionIndex()).toBe(0);
        test.expect(loader.getMetadata()).toEqual({});
        
        loader.clear();
        test.expect(loader.questions).toEqual([]);
    });
});

test.summary();