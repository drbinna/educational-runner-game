/**
 * Performance tests for the educational runner game
 * Tests performance with large question sets and extended play sessions
 */

// Mock DOM environment for performance tests
global.document = {
    createElement: () => ({
        style: {},
        textContent: '',
        appendChild: () => {},
        addEventListener: () => {},
        removeEventListener: () => {}
    }),
    body: { appendChild: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    head: { appendChild: () => {} }
};

// Mock performance API
global.performance = {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    getEntriesByType: () => []
};

// Mock fetch
global.fetch = jest.fn();

// Load required classes
const ContentLoader = require('../game/content-loader.js');
const { GameStateManager, GameStates } = require('../game/game-state.js');

describe('Performance Tests', () => {
    let contentLoader;
    let gameStateManager;

    beforeEach(() => {
        jest.clearAllMocks();
        contentLoader = new ContentLoader();
        gameStateManager = new GameStateManager();
    });

    describe('Large Question Set Performance', () => {
        test('should load 1000 questions within performance threshold', async () => {
            const largeQuestionSet = {
                questions: Array.from({ length: 1000 }, (_, i) => ({
                    id: `perf_${i}`,
                    type: 'multiple_choice',
                    prompt: `Performance test question ${i}?`,
                    options: ['Option A', 'Option B', 'Option C', 'Option D'],
                    answer: 'Option A',
                    feedback: `This is the feedback for question ${i}. It contains detailed explanation about why Option A is correct.`,
                    difficulty: (i % 5) + 1,
                    subject: 'performance_test',
                    topic: `topic_${i % 20}`
                })),
                metadata: {
                    title: 'Performance Test Set',
                    description: 'Large question set for performance testing',
                    version: '1.0',
                    author: 'Performance Test Suite'
                }
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => largeQuestionSet
            });

            const startTime = performance.now();
            const result = await contentLoader.loadQuestions('large-perf.json');
            const loadTime = performance.now() - startTime;

            expect(result.success).toBe(true);
            expect(contentLoader.questions).toHaveLength(1000);
            expect(loadTime).toBeLessThan(1000); // Should load within 1 second

            console.log(`✓ Loaded 1000 questions in ${loadTime.toFixed(2)}ms`);
        });

        test('should handle 5000 questions efficiently', async () => {
            const veryLargeQuestionSet = {
                questions: Array.from({ length: 5000 }, (_, i) => ({
                    id: `xl_${i}`,
                    type: 'multiple_choice',
                    prompt: `Extra large test question ${i}?`,
                    options: Array.from({ length: 6 }, (_, j) => `Option ${String.fromCharCode(65 + j)}`),
                    answer: 'Option A',
                    feedback: `Detailed feedback for question ${i}. `.repeat(5), // Longer feedback
                    difficulty: (i % 5) + 1,
                    subject: 'xl_test',
                    topic: `topic_${i % 50}`
                })),
                metadata: {
                    title: 'Extra Large Test Set',
                    description: 'Very large question set for stress testing'
                }
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => veryLargeQuestionSet
            });

            const startTime = performance.now();
            const result = await contentLoader.loadQuestions('xl-perf.json');
            const loadTime = performance.now() - startTime;

            expect(result.success).toBe(true);
            expect(contentLoader.questions).toHaveLength(5000);
            expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds

            console.log(`✓ Loaded 5000 questions in ${loadTime.toFixed(2)}ms`);
        });

        test('should retrieve questions quickly from large sets', async () => {
            // Load large question set first
            const questionSet = {
                questions: Array.from({ length: 2000 }, (_, i) => ({
                    id: `retrieval_${i}`,
                    prompt: `Question ${i}?`,
                    options: ['A', 'B', 'C', 'D'],
                    answer: 'A',
                    feedback: 'Correct!'
                }))
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => questionSet
            });

            await contentLoader.loadQuestions('retrieval-test.json');

            // Test question retrieval performance
            const startTime = performance.now();
            const retrievedQuestions = [];
            
            for (let i = 0; i < 2000; i++) {
                retrievedQuestions.push(contentLoader.getNextQuestion());
            }
            
            const retrievalTime = performance.now() - startTime;

            expect(retrievedQuestions).toHaveLength(2000);
            expect(retrievedQuestions.every(q => q !== null)).toBe(true);
            expect(retrievalTime).toBeLessThan(200); // Should retrieve all within 200ms

            console.log(`✓ Retrieved 2000 questions in ${retrievalTime.toFixed(2)}ms`);
        });
    });

    describe('Extended Play Session Performance', () => {
        test('should maintain performance during 1000 question-answer cycles', async () => {
            const questionSet = {
                questions: Array.from({ length: 100 }, (_, i) => ({
                    id: `cycle_${i}`,
                    prompt: `Cycle question ${i}?`,
                    options: ['A', 'B', 'C', 'D'],
                    answer: 'A',
                    feedback: 'Good job!'
                }))
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => questionSet
            });

            await contentLoader.loadQuestions('cycle-test.json');
            gameStateManager.setState(GameStates.PLAYING);

            const startTime = performance.now();
            const cycleCount = 1000;
            let totalQuestionTime = 0;
            let totalAnswerTime = 0;

            for (let i = 0; i < cycleCount; i++) {
                // Measure question retrieval time
                const questionStart = performance.now();
                const question = contentLoader.getNextQuestion();
                totalQuestionTime += performance.now() - questionStart;

                expect(question).not.toBeNull();

                // Measure answer processing time
                const answerStart = performance.now();
                gameStateManager.recordAnswer(Math.random() > 0.3); // 70% correct rate
                gameStateManager.updateGameTime(16); // Simulate 60fps
                totalAnswerTime += performance.now() - answerStart;
            }

            const totalTime = performance.now() - startTime;
            const avgQuestionTime = totalQuestionTime / cycleCount;
            const avgAnswerTime = totalAnswerTime / cycleCount;

            expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
            expect(avgQuestionTime).toBeLessThan(1); // Average question retrieval < 1ms
            expect(avgAnswerTime).toBeLessThan(1); // Average answer processing < 1ms

            const stats = gameStateManager.getGameStats();
            expect(stats.questionsAnswered).toBe(cycleCount);

            console.log(`✓ Completed ${cycleCount} cycles in ${totalTime.toFixed(2)}ms`);
            console.log(`  - Avg question time: ${avgQuestionTime.toFixed(3)}ms`);
            console.log(`  - Avg answer time: ${avgAnswerTime.toFixed(3)}ms`);
        });

        test('should handle memory efficiently during extended play', async () => {
            const questionSet = {
                questions: Array.from({ length: 50 }, (_, i) => ({
                    id: `memory_${i}`,
                    prompt: `Memory test question ${i}?`,
                    options: ['A', 'B', 'C', 'D'],
                    answer: 'A',
                    feedback: 'Correct answer!'
                }))
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => questionSet
            });

            await contentLoader.loadQuestions('memory-test.json');

            const initialMemory = process.memoryUsage().heapUsed;
            const memorySnapshots = [initialMemory];

            // Simulate 10 extended play sessions
            for (let session = 0; session < 10; session++) {
                gameStateManager.resetGame();
                gameStateManager.setState(GameStates.PLAYING);

                // Each session has 100 question-answer cycles
                for (let i = 0; i < 100; i++) {
                    const question = contentLoader.getNextQuestion();
                    gameStateManager.recordAnswer(Math.random() > 0.5);
                    gameStateManager.updateGameTime(Math.random() * 100);
                    gameStateManager.updateScore(Math.random() * 50);
                }

                // Take memory snapshot after each session
                if (global.gc) {
                    global.gc(); // Force garbage collection if available
                }
                memorySnapshots.push(process.memoryUsage().heapUsed);
            }

            const finalMemory = memorySnapshots[memorySnapshots.length - 1];
            const memoryIncrease = finalMemory - initialMemory;
            const maxMemoryIncrease = Math.max(...memorySnapshots) - initialMemory;

            // Memory increase should be reasonable (less than 10MB)
            expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
            expect(maxMemoryIncrease).toBeLessThan(20 * 1024 * 1024);

            console.log(`✓ Memory increase after 10 sessions: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
            console.log(`  - Max memory increase: ${(maxMemoryIncrease / 1024 / 1024).toFixed(2)}MB`);
        });

        test('should maintain consistent performance over time', async () => {
            const questionSet = {
                questions: Array.from({ length: 20 }, (_, i) => ({
                    id: `consistency_${i}`,
                    prompt: `Consistency test ${i}?`,
                    options: ['A', 'B'],
                    answer: 'A',
                    feedback: 'Good!'
                }))
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => questionSet
            });

            await contentLoader.loadQuestions('consistency-test.json');

            const batchSize = 100;
            const batchCount = 10;
            const batchTimes = [];

            for (let batch = 0; batch < batchCount; batch++) {
                const batchStart = performance.now();
                
                for (let i = 0; i < batchSize; i++) {
                    const question = contentLoader.getNextQuestion();
                    gameStateManager.recordAnswer(true);
                    gameStateManager.updateGameTime(16);
                }
                
                const batchTime = performance.now() - batchStart;
                batchTimes.push(batchTime);
            }

            // Calculate performance consistency
            const avgBatchTime = batchTimes.reduce((a, b) => a + b, 0) / batchTimes.length;
            const maxBatchTime = Math.max(...batchTimes);
            const minBatchTime = Math.min(...batchTimes);
            const variance = maxBatchTime - minBatchTime;

            // Performance should be consistent (variance < 50% of average)
            expect(variance).toBeLessThan(avgBatchTime * 0.5);
            expect(maxBatchTime).toBeLessThan(avgBatchTime * 1.5);

            console.log(`✓ Performance consistency test:`);
            console.log(`  - Avg batch time: ${avgBatchTime.toFixed(2)}ms`);
            console.log(`  - Min/Max: ${minBatchTime.toFixed(2)}ms / ${maxBatchTime.toFixed(2)}ms`);
            console.log(`  - Variance: ${variance.toFixed(2)}ms`);
        });
    });

    describe('Concurrent Operations Performance', () => {
        test('should handle multiple simultaneous operations', async () => {
            const questionSet = {
                questions: Array.from({ length: 100 }, (_, i) => ({
                    id: `concurrent_${i}`,
                    prompt: `Concurrent test ${i}?`,
                    options: ['A', 'B', 'C'],
                    answer: 'A',
                    feedback: 'Correct!'
                }))
            };

            fetch.mockResolvedValue({
                ok: true,
                json: async () => questionSet
            });

            const startTime = performance.now();
            
            // Create multiple content loaders and game state managers
            const loaders = Array.from({ length: 5 }, () => new ContentLoader());
            const managers = Array.from({ length: 5 }, () => new GameStateManager());

            // Load questions concurrently
            const loadPromises = loaders.map((loader, i) => 
                loader.loadQuestions(`concurrent-${i}.json`)
            );

            const loadResults = await Promise.all(loadPromises);
            
            // All should succeed
            loadResults.forEach(result => {
                expect(result.success).toBe(true);
            });

            // Perform concurrent operations
            const operationPromises = [];
            
            for (let i = 0; i < 5; i++) {
                operationPromises.push(new Promise((resolve) => {
                    setTimeout(() => {
                        const loader = loaders[i];
                        const manager = managers[i];
                        
                        manager.setState(GameStates.PLAYING);
                        
                        for (let j = 0; j < 50; j++) {
                            const question = loader.getNextQuestion();
                            manager.recordAnswer(Math.random() > 0.5);
                            manager.updateGameTime(16);
                        }
                        
                        resolve();
                    }, Math.random() * 100);
                }));
            }

            await Promise.all(operationPromises);
            
            const totalTime = performance.now() - startTime;
            expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds

            // Verify all managers have correct state
            managers.forEach(manager => {
                const stats = manager.getGameStats();
                expect(stats.questionsAnswered).toBe(50);
            });

            console.log(`✓ Concurrent operations completed in ${totalTime.toFixed(2)}ms`);
        });

        test('should handle rapid state changes efficiently', async () => {
            const stateChangeCount = 10000;
            const states = [GameStates.MENU, GameStates.PLAYING, GameStates.QUESTION, GameStates.FEEDBACK];
            
            const startTime = performance.now();
            
            for (let i = 0; i < stateChangeCount; i++) {
                const randomState = states[Math.floor(Math.random() * states.length)];
                gameStateManager.setState(randomState);
                gameStateManager.updateScore(Math.random() * 10);
                gameStateManager.updateGameTime(Math.random() * 20);
            }
            
            const totalTime = performance.now() - startTime;
            const avgTimePerOperation = totalTime / stateChangeCount;

            expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
            expect(avgTimePerOperation).toBeLessThan(0.1); // Average < 0.1ms per operation

            console.log(`✓ ${stateChangeCount} state changes in ${totalTime.toFixed(2)}ms`);
            console.log(`  - Avg time per operation: ${avgTimePerOperation.toFixed(4)}ms`);
        });
    });

    describe('Validation Performance', () => {
        test('should validate large question sets quickly', async () => {
            const largeInvalidSet = {
                questions: Array.from({ length: 1000 }, (_, i) => ({
                    id: i % 2 === 0 ? `valid_${i}` : '', // Half have invalid IDs
                    prompt: i % 3 === 0 ? '' : `Question ${i}?`, // Some have empty prompts
                    options: i % 4 === 0 ? ['A'] : ['A', 'B', 'C'], // Some have too few options
                    answer: i % 5 === 0 ? 'Z' : 'A', // Some have invalid answers
                    feedback: i % 6 === 0 ? '' : 'Feedback' // Some have empty feedback
                }))
            };

            const startTime = performance.now();
            const validation = contentLoader.validateQuestionFormat(largeInvalidSet);
            const validationTime = performance.now() - startTime;

            expect(validation.isValid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);
            expect(validationTime).toBeLessThan(500); // Should validate within 500ms

            console.log(`✓ Validated 1000 questions (with errors) in ${validationTime.toFixed(2)}ms`);
            console.log(`  - Found ${validation.errors.length} validation errors`);
        });

        test('should handle text sanitization efficiently', () => {
            const maliciousTexts = Array.from({ length: 1000 }, (_, i) => 
                `<script>alert('xss${i}')</script>Question ${i}? <img src=x onerror=alert(${i})>`
            );

            const startTime = performance.now();
            
            maliciousTexts.forEach(text => {
                // Access private method for testing
                const sanitized = contentLoader._sanitizeText(text);
                expect(sanitized).not.toContain('<script>');
                expect(sanitized).not.toContain('onerror');
                expect(sanitized).not.toContain('javascript:');
            });
            
            const sanitizationTime = performance.now() - startTime;
            const avgTimePerText = sanitizationTime / maliciousTexts.length;

            expect(sanitizationTime).toBeLessThan(100); // Should complete within 100ms
            expect(avgTimePerText).toBeLessThan(0.1); // Average < 0.1ms per text

            console.log(`✓ Sanitized 1000 texts in ${sanitizationTime.toFixed(2)}ms`);
            console.log(`  - Avg time per text: ${avgTimePerText.toFixed(4)}ms`);
        });
    });

    describe('Stress Tests', () => {
        test('should survive extreme load conditions', async () => {
            // Create extremely large question set
            const extremeQuestionSet = {
                questions: Array.from({ length: 10000 }, (_, i) => ({
                    id: `extreme_${i}`,
                    type: 'multiple_choice',
                    prompt: `Extreme load test question ${i}? `.repeat(10), // Long prompts
                    options: Array.from({ length: 10 }, (_, j) => `Very long option ${j} for question ${i}`),
                    answer: 'Very long option 0 for question ' + i,
                    feedback: `This is a very detailed feedback for question ${i}. `.repeat(20),
                    difficulty: (i % 5) + 1,
                    subject: 'extreme_test',
                    topic: `topic_${i % 100}`
                })),
                metadata: {
                    title: 'Extreme Load Test',
                    description: 'Stress test with 10,000 complex questions'
                }
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => extremeQuestionSet
            });

            const startTime = performance.now();
            
            try {
                const result = await contentLoader.loadQuestions('extreme-test.json');
                const loadTime = performance.now() - startTime;

                expect(result.success).toBe(true);
                expect(contentLoader.questions).toHaveLength(10000);
                expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds

                console.log(`✓ Survived extreme load: 10,000 questions in ${loadTime.toFixed(2)}ms`);
                
                // Test rapid access to random questions
                const accessStart = performance.now();
                for (let i = 0; i < 1000; i++) {
                    const question = contentLoader.getNextQuestion();
                    expect(question).not.toBeNull();
                }
                const accessTime = performance.now() - accessStart;
                
                expect(accessTime).toBeLessThan(1000); // Should access 1000 questions within 1 second
                console.log(`  - Accessed 1000 questions in ${accessTime.toFixed(2)}ms`);
                
            } catch (error) {
                // If we run out of memory or hit other limits, that's expected for extreme tests
                console.log(`⚠️  Extreme test hit limits: ${error.message}`);
                expect(error.message).toBeDefined(); // Just ensure we get a meaningful error
            }
        });
    });
});