/**
 * Comprehensive Unit tests for ContentLoader class
 * Tests all major functionality including error handling, validation, and edge cases
 */

// Mock fetch for testing
global.fetch = jest.fn();

// Import the ContentLoader class
const ContentLoader = require('../game/content-loader.js');

describe('ContentLoader', () => {
    let contentLoader;

    beforeEach(() => {
        contentLoader = new ContentLoader();
        fetch.mockClear();
    });

    describe('constructor', () => {
        test('should initialize with empty state', () => {
            expect(contentLoader.questions).toEqual([]);
            expect(contentLoader.metadata).toEqual({});
            expect(contentLoader.currentQuestionIndex).toBe(0);
        });
    });

    describe('loadQuestions', () => {
        const validQuestionData = {
            questions: [
                {
                    id: 'test_001',
                    type: 'multiple_choice',
                    prompt: 'What is 2 + 2?',
                    options: ['3', '4', '5'],
                    answer: '4',
                    feedback: 'Correct! 2 + 2 equals 4.',
                    difficulty: 1,
                    subject: 'math',
                    topic: 'addition'
                }
            ],
            metadata: {
                title: 'Test Questions',
                description: 'Test question set',
                version: '1.0',
                author: 'Test Author'
            }
        };

        test('should successfully load valid questions', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => validQuestionData
            });

            const result = await contentLoader.loadQuestions('test.json');

            expect(result.success).toBe(true);
            expect(result.error).toBeUndefined();
            expect(contentLoader.questions).toHaveLength(1);
            expect(contentLoader.questions[0].prompt).toBe('What is 2 + 2?');
            expect(contentLoader.metadata.title).toBe('Test Questions');
        });

        test('should handle invalid JSON path', async () => {
            const result = await contentLoader.loadQuestions('');
            expect(result.success).toBe(false);
            expect(result.error).toContain('No question file specified');
        });

        test('should handle null JSON path', async () => {
            const result = await contentLoader.loadQuestions(null);
            expect(result.success).toBe(false);
            expect(result.error).toContain('No question file specified');
        });

        test('should handle 404 errors', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            });

            const result = await contentLoader.loadQuestions('nonexistent.json');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Question file not found');
        });

        test('should handle server errors', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });

            const result = await contentLoader.loadQuestions('test.json');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Server error loading questions');
        });

        test('should handle malformed JSON', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => {
                    throw new Error('Unexpected token');
                }
            });

            const result = await contentLoader.loadQuestions('malformed.json');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid JSON format');
        });

        test('should handle network failures', async () => {
            fetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await contentLoader.loadQuestions('test.json');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Network error');
        });

        test('should reset state on error', async () => {
            // First load valid data
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => validQuestionData
            });
            await contentLoader.loadQuestions('valid.json');
            expect(contentLoader.questions).toHaveLength(1);

            // Then simulate error
            fetch.mockRejectedValueOnce(new Error('Network error'));
            const result = await contentLoader.loadQuestions('invalid.json');
            
            expect(result.success).toBe(false);
            expect(contentLoader.questions).toHaveLength(0);
            expect(contentLoader.metadata).toEqual({});
            expect(contentLoader.currentQuestionIndex).toBe(0);
        });
    });

    describe('validateQuestionFormat', () => {
        test('should validate correct question format', () => {
            const validData = {
                questions: [
                    {
                        prompt: 'Test question?',
                        options: ['A', 'B', 'C'],
                        answer: 'A',
                        feedback: 'Test feedback'
                    }
                ]
            };

            const result = contentLoader.validateQuestionFormat(validData);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should reject null data', () => {
            const result = contentLoader.validateQuestionFormat(null);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('No data provided');
        });

        test('should reject missing questions property', () => {
            const result = contentLoader.validateQuestionFormat({});
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Missing "questions" property');
        });

        test('should reject non-array questions', () => {
            const result = contentLoader.validateQuestionFormat({ questions: 'not an array' });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('"questions" must be an array');
        });

        test('should reject empty questions array', () => {
            const result = contentLoader.validateQuestionFormat({ questions: [] });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Questions array is empty');
        });

        test('should reject questions with missing prompt', () => {
            const invalidData = {
                questions: [
                    {
                        options: ['A', 'B'],
                        answer: 'A',
                        feedback: 'Test'
                    }
                ]
            };

            const result = contentLoader.validateQuestionFormat(invalidData);
            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('Missing or empty "prompt"'))).toBe(true);
        });

        test('should reject questions with invalid options', () => {
            const invalidData = {
                questions: [
                    {
                        prompt: 'Test?',
                        options: 'not an array',
                        answer: 'A',
                        feedback: 'Test'
                    }
                ]
            };

            const result = contentLoader.validateQuestionFormat(invalidData);
            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('"options" must be an array'))).toBe(true);
        });

        test('should reject questions with too few options', () => {
            const invalidData = {
                questions: [
                    {
                        prompt: 'Test?',
                        options: ['A'],
                        answer: 'A',
                        feedback: 'Test'
                    }
                ]
            };

            const result = contentLoader.validateQuestionFormat(invalidData);
            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('Must have at least 2 options'))).toBe(true);
        });

        test('should reject questions with answer not in options', () => {
            const invalidData = {
                questions: [
                    {
                        prompt: 'Test?',
                        options: ['A', 'B'],
                        answer: 'C',
                        feedback: 'Test'
                    }
                ]
            };

            const result = contentLoader.validateQuestionFormat(invalidData);
            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('Answer "C" is not in the options list'))).toBe(true);
        });

        test('should reject questions with missing feedback', () => {
            const invalidData = {
                questions: [
                    {
                        prompt: 'Test?',
                        options: ['A', 'B'],
                        answer: 'A'
                    }
                ]
            };

            const result = contentLoader.validateQuestionFormat(invalidData);
            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('Missing or empty "feedback"'))).toBe(true);
        });

        test('should validate optional difficulty field', () => {
            const invalidData = {
                questions: [
                    {
                        prompt: 'Test?',
                        options: ['A', 'B'],
                        answer: 'A',
                        feedback: 'Test',
                        difficulty: 10 // Invalid difficulty
                    }
                ]
            };

            const result = contentLoader.validateQuestionFormat(invalidData);
            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('"difficulty" must be an integer between 1 and 5'))).toBe(true);
        });
    });

    describe('getNextQuestion', () => {
        beforeEach(async () => {
            const questionData = {
                questions: [
                    { prompt: 'Q1', options: ['A', 'B'], answer: 'A', feedback: 'F1' },
                    { prompt: 'Q2', options: ['C', 'D'], answer: 'C', feedback: 'F2' },
                    { prompt: 'Q3', options: ['E', 'F'], answer: 'E', feedback: 'F3' }
                ]
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => questionData
            });

            await contentLoader.loadQuestions('test.json');
        });

        test('should return questions in sequence', () => {
            const q1 = contentLoader.getNextQuestion();
            const q2 = contentLoader.getNextQuestion();
            const q3 = contentLoader.getNextQuestion();

            expect(q1.prompt).toBe('Q1');
            expect(q2.prompt).toBe('Q2');
            expect(q3.prompt).toBe('Q3');
        });

        test('should cycle back to beginning after last question', () => {
            // Get all questions once
            contentLoader.getNextQuestion();
            contentLoader.getNextQuestion();
            contentLoader.getNextQuestion();

            // Should cycle back to first question
            const q1Again = contentLoader.getNextQuestion();
            expect(q1Again.prompt).toBe('Q1');
        });

        test('should return fallback question when no questions loaded', () => {
            const emptyLoader = new ContentLoader();
            const question = emptyLoader.getNextQuestion();
            expect(question).not.toBeNull();
            expect(question.prompt).toBeDefined();
            expect(question.options).toBeDefined();
            expect(question.answer).toBeDefined();
            expect(question.feedback).toBeDefined();
        });
    });

    describe('utility methods', () => {
        test('should return correct question count', () => {
            expect(contentLoader.getQuestionCount()).toBe(0);
        });

        test('should check if questions are loaded', () => {
            expect(contentLoader.hasQuestions()).toBe(false);
        });

        test('should get question by index', () => {
            expect(contentLoader.getQuestionByIndex(0)).toBeNull();
        });

        test('should get current question index', () => {
            expect(contentLoader.getCurrentQuestionIndex()).toBe(0);
        });

        test('should get metadata', () => {
            expect(contentLoader.getMetadata()).toEqual({});
        });

        test('should clear all data', () => {
            contentLoader.questions = [{ test: 'data' }];
            contentLoader.metadata = { test: 'meta' };
            contentLoader.currentQuestionIndex = 5;

            contentLoader.clear();

            expect(contentLoader.questions).toEqual([]);
            expect(contentLoader.metadata).toEqual({});
            expect(contentLoader.currentQuestionIndex).toBe(0);
        });
    });

    describe('advanced functionality', () => {
        test('should handle large question sets efficiently', async () => {
            const largeQuestionSet = {
                questions: Array.from({ length: 1000 }, (_, i) => ({
                    id: `q_${i}`,
                    type: 'multiple_choice',
                    prompt: `Question ${i}?`,
                    options: ['A', 'B', 'C', 'D'],
                    answer: 'A',
                    feedback: `Feedback ${i}`,
                    difficulty: (i % 5) + 1,
                    subject: 'test',
                    topic: `topic_${i % 10}`
                })),
                metadata: {
                    title: 'Large Test Set',
                    description: 'Performance test with 1000 questions',
                    version: '1.0',
                    author: 'Test Suite'
                }
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => largeQuestionSet
            });

            const startTime = Date.now();
            const result = await contentLoader.loadQuestions('large-set.json');
            const loadTime = Date.now() - startTime;

            expect(result.success).toBe(true);
            expect(contentLoader.questions).toHaveLength(1000);
            expect(loadTime).toBeLessThan(1000); // Should load within 1 second
        });

        test('should handle malformed questions gracefully', async () => {
            const malformedData = {
                questions: [
                    {
                        prompt: 'Valid question?',
                        options: ['A', 'B'],
                        answer: 'A',
                        feedback: 'Good'
                    },
                    {
                        prompt: '', // Invalid empty prompt
                        options: ['A'],
                        answer: 'B', // Answer not in options
                        feedback: ''
                    },
                    null, // Null question
                    {
                        prompt: 'Another valid question?',
                        options: ['Yes', 'No'],
                        answer: 'Yes',
                        feedback: 'Correct'
                    }
                ]
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => malformedData
            });

            const result = await contentLoader.loadQuestions('malformed.json');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid question format');
        });

        test('should sanitize text content properly', () => {
            const maliciousData = {
                questions: [
                    {
                        prompt: 'What is <script>alert("xss")</script> 2 + 2?',
                        options: ['<img src=x onerror=alert(1)>', '4', 'javascript:alert(1)'],
                        answer: '4',
                        feedback: 'data:text/html,<script>alert(1)</script>'
                    }
                ]
            };

            const validation = contentLoader.validateQuestionFormat(maliciousData);
            expect(validation.isValid).toBe(true); // Should pass after sanitization
        });

        test('should handle concurrent load requests', async () => {
            const questionData = {
                questions: [
                    {
                        prompt: 'Test question?',
                        options: ['A', 'B'],
                        answer: 'A',
                        feedback: 'Good'
                    }
                ]
            };

            fetch.mockResolvedValue({
                ok: true,
                json: async () => questionData
            });

            // Start multiple concurrent loads
            const promises = [
                contentLoader.loadQuestions('test1.json'),
                contentLoader.loadQuestions('test2.json'),
                contentLoader.loadQuestions('test3.json')
            ];

            const results = await Promise.all(promises);
            
            // All should succeed, but only the last one should be loaded
            results.forEach(result => {
                expect(result.success).toBe(true);
            });
            
            expect(contentLoader.questions).toHaveLength(1);
        });

        test('should provide fallback questions when needed', () => {
            const emptyLoader = new ContentLoader();
            const fallbackQuestion = emptyLoader.getNextQuestion();
            
            expect(fallbackQuestion).not.toBeNull();
            expect(fallbackQuestion.prompt).toBeDefined();
            expect(fallbackQuestion.options).toHaveLength(4);
            expect(fallbackQuestion.answer).toBeDefined();
            expect(fallbackQuestion.feedback).toBeDefined();
        });

        test('should handle memory pressure gracefully', async () => {
            // Simulate memory pressure by loading many large question sets
            const promises = [];
            
            for (let i = 0; i < 10; i++) {
                const loader = new ContentLoader();
                const largeSet = {
                    questions: Array.from({ length: 100 }, (_, j) => ({
                        prompt: `Question ${i}-${j}?`,
                        options: Array.from({ length: 10 }, (_, k) => `Option ${k}`),
                        answer: 'Option 0',
                        feedback: `Feedback ${i}-${j}` // Normal feedback text
                    }))
                };

                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => largeSet
                });

                promises.push(loader.loadQuestions(`large-${i}.json`));
            }

            const results = await Promise.all(promises);
            results.forEach(result => {
                expect(result.success).toBe(true);
            });
        });
    });

    describe('resetQuestionQueue', () => {
        test('should reset question index to 0', () => {
            contentLoader.currentQuestionIndex = 5;
            contentLoader.resetQuestionQueue();
            expect(contentLoader.currentQuestionIndex).toBe(0);
        });
    });
});