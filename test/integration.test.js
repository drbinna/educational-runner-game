/**
 * Integration tests for complete question-answer-feedback cycles
 * Tests the interaction between ContentLoader, GameStateManager, and QuestionPresenter
 */

// Mock DOM environment
global.document = {
    createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        style: {},
        textContent: '',
        innerHTML: '',
        id: '',
        children: [],
        appendChild: function(child) {
            this.children.push(child);
            child.parentNode = this;
        },
        addEventListener: function(event, handler) {
            this.eventListeners = this.eventListeners || {};
            this.eventListeners[event] = this.eventListeners[event] || [];
            this.eventListeners[event].push(handler);
        },
        removeEventListener: function(event, handler) {
            if (this.eventListeners && this.eventListeners[event]) {
                const index = this.eventListeners[event].indexOf(handler);
                if (index > -1) {
                    this.eventListeners[event].splice(index, 1);
                }
            }
        }
    }),
    body: {
        appendChild: function(child) {
            this.children = this.children || [];
            this.children.push(child);
        }
    },
    addEventListener: function() {},
    removeEventListener: function() {},
    head: {
        appendChild: function() {}
    }
};

// Mock fetch
global.fetch = jest.fn();

// Load required classes
const ContentLoader = require('../game/content-loader.js');
const { GameStateManager, GameStates } = require('../game/game-state.js');

// Mock QuestionPresenter since it's complex
class MockQuestionPresenter {
    constructor() {
        this.currentQuestion = null;
        this.isVisible = false;
        this.answerListeners = [];
        this.feedbackCompleteListeners = [];
    }

    displayQuestion(question) {
        this.currentQuestion = question;
        this.isVisible = true;
        return Promise.resolve();
    }

    hideQuestion() {
        this.currentQuestion = null;
        this.isVisible = false;
        this.feedbackCompleteListeners.forEach(listener => listener());
    }

    addAnswerListener(listener) {
        this.answerListeners.push(listener);
    }

    addFeedbackCompleteListener(listener) {
        this.feedbackCompleteListeners.push(listener);
    }

    simulateAnswer(answer, isCorrect) {
        const result = {
            isCorrect,
            selectedAnswer: answer,
            correctAnswer: this.currentQuestion.answer,
            feedback: this.currentQuestion.feedback
        };
        
        this.answerListeners.forEach(listener => listener(result));
        
        // Simulate feedback display time
        setTimeout(() => {
            this.hideQuestion();
        }, 100);
    }

    isQuestionVisible() {
        return this.isVisible;
    }
}

describe('Integration Tests - Complete Question-Answer-Feedback Cycles', () => {
    let contentLoader;
    let gameStateManager;
    let questionPresenter;

    const sampleQuestions = {
        questions: [
            {
                id: 'math_001',
                type: 'multiple_choice',
                prompt: 'What is 5 + 3?',
                options: ['6', '7', '8', '9'],
                answer: '8',
                feedback: 'Correct! 5 + 3 = 8',
                difficulty: 1,
                subject: 'math',
                topic: 'addition'
            },
            {
                id: 'math_002',
                type: 'multiple_choice',
                prompt: 'What is 12 - 4?',
                options: ['6', '7', '8', '9'],
                answer: '8',
                feedback: 'Correct! 12 - 4 = 8',
                difficulty: 1,
                subject: 'math',
                topic: 'subtraction'
            },
            {
                id: 'science_001',
                type: 'multiple_choice',
                prompt: 'What planet is closest to the Sun?',
                options: ['Venus', 'Mercury', 'Earth', 'Mars'],
                answer: 'Mercury',
                feedback: 'Correct! Mercury is the closest planet to the Sun.',
                difficulty: 2,
                subject: 'science',
                topic: 'astronomy'
            }
        ],
        metadata: {
            title: 'Integration Test Questions',
            description: 'Questions for testing integration',
            version: '1.0',
            author: 'Test Suite'
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        contentLoader = new ContentLoader();
        gameStateManager = new GameStateManager();
        questionPresenter = new MockQuestionPresenter();

        // Mock successful fetch
        fetch.mockResolvedValue({
            ok: true,
            json: async () => sampleQuestions
        });
    });

    describe('Complete Game Flow Integration', () => {
        test('should handle complete question cycle with correct answer', async (done) => {
            // Load questions
            const loadResult = await contentLoader.loadQuestions('test.json');
            expect(loadResult.success).toBe(true);

            // Set up game state
            gameStateManager.setState(GameStates.PLAYING);
            
            // Get first question
            const question = contentLoader.getNextQuestion();
            expect(question).not.toBeNull();
            expect(question.prompt).toBe('What is 5 + 3?');

            // Display question
            await questionPresenter.displayQuestion(question);
            expect(questionPresenter.isQuestionVisible()).toBe(true);

            // Set up answer listener
            questionPresenter.addAnswerListener((result) => {
                try {
                    expect(result.isCorrect).toBe(true);
                    expect(result.selectedAnswer).toBe('8');
                    expect(result.correctAnswer).toBe('8');
                    expect(result.feedback).toBe('Correct! 5 + 3 = 8');

                    // Record answer in game state
                    gameStateManager.recordAnswer(result.isCorrect);
                    
                    // Verify game state updated correctly
                    const stats = gameStateManager.getGameStats();
                    expect(stats.questionsAnswered).toBe(1);
                    expect(stats.correctAnswers).toBe(1);
                    expect(stats.accuracy).toBe(100);
                    expect(stats.score).toBe(100);

                    done();
                } catch (error) {
                    done(error);
                }
            });

            // Simulate correct answer
            questionPresenter.simulateAnswer('8', true);
        });

        test('should handle complete question cycle with incorrect answer', async (done) => {
            // Load questions
            await contentLoader.loadQuestions('test.json');
            gameStateManager.setState(GameStates.PLAYING);
            
            const question = contentLoader.getNextQuestion();
            await questionPresenter.displayQuestion(question);

            questionPresenter.addAnswerListener((result) => {
                try {
                    expect(result.isCorrect).toBe(false);
                    expect(result.selectedAnswer).toBe('7');
                    expect(result.correctAnswer).toBe('8');

                    gameStateManager.recordAnswer(result.isCorrect);
                    
                    const stats = gameStateManager.getGameStats();
                    expect(stats.questionsAnswered).toBe(1);
                    expect(stats.correctAnswers).toBe(0);
                    expect(stats.accuracy).toBe(0);
                    expect(stats.score).toBe(0); // Score can't go below 0

                    done();
                } catch (error) {
                    done(error);
                }
            });

            questionPresenter.simulateAnswer('7', false);
        });

        test('should handle multiple question cycles', async () => {
            await contentLoader.loadQuestions('test.json');
            gameStateManager.setState(GameStates.PLAYING);

            const results = [];
            const answers = ['8', '7', 'Mercury']; // First wrong, others correct
            const expectedCorrect = [true, false, true];

            for (let i = 0; i < 3; i++) {
                const question = contentLoader.getNextQuestion();
                expect(question).not.toBeNull();

                await questionPresenter.displayQuestion(question);

                await new Promise((resolve) => {
                    questionPresenter.addAnswerListener((result) => {
                        results.push(result);
                        gameStateManager.recordAnswer(result.isCorrect);
                        resolve();
                    });

                    questionPresenter.simulateAnswer(answers[i], expectedCorrect[i]);
                });
            }

            // Verify final game state
            const stats = gameStateManager.getGameStats();
            expect(stats.questionsAnswered).toBe(3);
            expect(stats.correctAnswers).toBe(2);
            expect(stats.accuracy).toBe(67); // 2/3 = 66.67%, rounded to 67
            expect(stats.score).toBe(150); // 200 (2 correct) - 50 (1 incorrect)
        });

        test('should handle question cycling and queue management', async () => {
            await contentLoader.loadQuestions('test.json');
            
            // Get all questions once
            const firstCycle = [];
            for (let i = 0; i < 3; i++) {
                firstCycle.push(contentLoader.getNextQuestion());
            }

            // Should cycle back to beginning
            const secondCycle = [];
            for (let i = 0; i < 3; i++) {
                secondCycle.push(contentLoader.getNextQuestion());
            }

            // Verify cycling works
            expect(firstCycle[0].id).toBe(secondCycle[0].id);
            expect(firstCycle[1].id).toBe(secondCycle[1].id);
            expect(firstCycle[2].id).toBe(secondCycle[2].id);
        });
    });

    describe('Error Handling Integration', () => {
        test('should handle content loading failures gracefully', async () => {
            // Mock fetch failure
            fetch.mockRejectedValueOnce(new Error('Network error'));

            const loadResult = await contentLoader.loadQuestions('failed.json');
            expect(loadResult.success).toBe(false);
            expect(loadResult.error).toContain('Network error');

            // Should still provide fallback question
            const question = contentLoader.getNextQuestion();
            expect(question).not.toBeNull();
            expect(question.prompt).toBeDefined();
        });

        test('should handle malformed question data', async () => {
            const malformedData = {
                questions: [
                    {
                        prompt: 'Valid question?',
                        options: ['A', 'B'],
                        answer: 'A',
                        feedback: 'Good'
                    },
                    {
                        // Missing required fields
                        prompt: '',
                        options: [],
                        answer: '',
                        feedback: ''
                    }
                ]
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => malformedData
            });

            const loadResult = await contentLoader.loadQuestions('malformed.json');
            expect(loadResult.success).toBe(false);
            
            // Should fall back to default questions
            const question = contentLoader.getNextQuestion();
            expect(question).not.toBeNull();
        });

        test('should handle game state corruption', () => {
            // Corrupt game state
            gameStateManager.gameState = null;
            
            // Should handle gracefully
            expect(() => {
                gameStateManager.updateScore(100);
                gameStateManager.recordAnswer(true);
            }).not.toThrow();
        });
    });

    describe('Performance Integration Tests', () => {
        test('should handle rapid question-answer cycles', async () => {
            await contentLoader.loadQuestions('test.json');
            gameStateManager.setState(GameStates.PLAYING);

            const startTime = Date.now();
            const cycleCount = 100;

            for (let i = 0; i < cycleCount; i++) {
                const question = contentLoader.getNextQuestion();
                await questionPresenter.displayQuestion(question);
                
                await new Promise((resolve) => {
                    questionPresenter.addAnswerListener((result) => {
                        gameStateManager.recordAnswer(result.isCorrect);
                        resolve();
                    });
                    
                    questionPresenter.simulateAnswer(question.answer, true);
                });
            }

            const endTime = Date.now();
            const totalTime = endTime - startTime;

            expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
            
            const stats = gameStateManager.getGameStats();
            expect(stats.questionsAnswered).toBe(cycleCount);
            expect(stats.correctAnswers).toBe(cycleCount);
        });

        test('should handle memory usage during extended play', async () => {
            await contentLoader.loadQuestions('test.json');
            
            // Simulate extended play session
            const initialMemory = process.memoryUsage().heapUsed;
            
            for (let session = 0; session < 10; session++) {
                gameStateManager.resetGame();
                gameStateManager.setState(GameStates.PLAYING);
                
                for (let i = 0; i < 50; i++) {
                    const question = contentLoader.getNextQuestion();
                    await questionPresenter.displayQuestion(question);
                    
                    await new Promise((resolve) => {
                        questionPresenter.addAnswerListener((result) => {
                            gameStateManager.recordAnswer(result.isCorrect);
                            resolve();
                        });
                        
                        questionPresenter.simulateAnswer(question.answer, Math.random() > 0.3);
                    });
                }
            }
            
            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;
            
            // Memory increase should be reasonable (less than 50MB)
            expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
        });

        test('should maintain performance with large question sets', async () => {
            // Create large question set
            const largeQuestionSet = {
                questions: Array.from({ length: 1000 }, (_, i) => ({
                    id: `large_${i}`,
                    type: 'multiple_choice',
                    prompt: `Large question ${i}?`,
                    options: ['A', 'B', 'C', 'D'],
                    answer: 'A',
                    feedback: `Feedback for question ${i}`,
                    difficulty: (i % 5) + 1,
                    subject: 'test',
                    topic: `topic_${i % 10}`
                })),
                metadata: {
                    title: 'Large Question Set',
                    description: 'Performance test with 1000 questions'
                }
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => largeQuestionSet
            });

            const startTime = Date.now();
            const loadResult = await contentLoader.loadQuestions('large.json');
            const loadTime = Date.now() - startTime;

            expect(loadResult.success).toBe(true);
            expect(loadTime).toBeLessThan(2000); // Should load within 2 seconds

            // Test question retrieval performance
            const retrievalStart = Date.now();
            for (let i = 0; i < 1000; i++) {
                const question = contentLoader.getNextQuestion();
                expect(question).not.toBeNull();
            }
            const retrievalTime = Date.now() - retrievalStart;

            expect(retrievalTime).toBeLessThan(100); // Should retrieve 1000 questions within 100ms
        });
    });

    describe('State Synchronization Tests', () => {
        test('should maintain state consistency across components', async () => {
            await contentLoader.loadQuestions('test.json');
            
            // Set up state change listener
            let stateChanges = [];
            gameStateManager.addStateChangeListener((newState, oldState) => {
                stateChanges.push({ newState, oldState });
            });

            // Simulate game flow
            gameStateManager.setState(GameStates.PLAYING);
            expect(stateChanges).toHaveLength(1);
            expect(stateChanges[0].newState).toBe(GameStates.PLAYING);

            const question = contentLoader.getNextQuestion();
            gameStateManager.setState(GameStates.QUESTION);
            
            await questionPresenter.displayQuestion(question);
            
            await new Promise((resolve) => {
                questionPresenter.addAnswerListener((result) => {
                    gameStateManager.recordAnswer(result.isCorrect);
                    gameStateManager.setState(GameStates.FEEDBACK);
                    
                    setTimeout(() => {
                        gameStateManager.setState(GameStates.PLAYING);
                        resolve();
                    }, 50);
                });
                
                questionPresenter.simulateAnswer(question.answer, true);
            });

            // Verify state transitions
            expect(stateChanges).toHaveLength(4);
            expect(stateChanges[1].newState).toBe(GameStates.QUESTION);
            expect(stateChanges[2].newState).toBe(GameStates.FEEDBACK);
            expect(stateChanges[3].newState).toBe(GameStates.PLAYING);
        });

        test('should handle concurrent state updates', async () => {
            await contentLoader.loadQuestions('test.json');
            
            // Simulate concurrent updates
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(new Promise((resolve) => {
                    setTimeout(() => {
                        gameStateManager.updateScore(10);
                        gameStateManager.recordAnswer(true);
                        resolve();
                    }, Math.random() * 100);
                }));
            }

            await Promise.all(promises);

            const stats = gameStateManager.getGameStats();
            expect(stats.score).toBe(1000); // 10 * 100 points
            expect(stats.questionsAnswered).toBe(10);
            expect(stats.correctAnswers).toBe(10);
        });
    });
});