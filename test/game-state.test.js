/**
 * Unit tests for GameStateManager
 */

// Simple test framework (reused from existing tests)
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
            },
            toBeGreaterThan: (expected) => {
                if (actual <= expected) {
                    throw new Error(`Expected ${actual} to be greater than ${expected}`);
                }
            },
            toBeLessThan: (expected) => {
                if (actual >= expected) {
                    throw new Error(`Expected ${actual} to be less than ${expected}`);
                }
            },
            toBeGreaterThanOrEqual: (expected) => {
                if (actual < expected) {
                    throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
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

// Load GameStateManager
let GameStateManager, GameStates;
try {
    const gameStateModule = require('../game/game-state.js');
    GameStateManager = gameStateModule.GameStateManager;
    GameStates = gameStateModule.GameStates;
} catch (e) {
    console.log('Require failed, trying alternative method:', e.message);
    const fs = require('fs');
    const path = require('path');
    const gameStateCode = fs.readFileSync(path.join(__dirname, '../game/game-state.js'), 'utf8');
    eval(gameStateCode);
}

// Create test instance
const test = new SimpleTest();

// Run tests
test.describe('GameStateManager Tests', () => {
    
    test.test('should initialize with correct default state', () => {
        const manager = new GameStateManager();
        
        test.expect(manager.getCurrentState()).toBe(GameStates.MENU);
        test.expect(manager.gameState.score).toBe(0);
        test.expect(manager.gameState.lives).toBe(3);
        test.expect(manager.gameState.currentQuestionIndex).toBe(0);
        test.expect(manager.gameState.questionsAnswered).toBe(0);
        test.expect(manager.gameState.correctAnswers).toBe(0);
        test.expect(manager.gameState.gameTime).toBe(0);
        test.expect(manager.gameState.playerPosition).toEqual({ x: 100, y: 300 });
        test.expect(manager.gameState.gameSpeed).toBe(1.0);
        test.expect(manager.questionTimer).toBe(0);
        test.expect(manager.questionInterval).toBe(8000);
    });

    test.test('should transition between valid states', () => {
        const manager = new GameStateManager();
        
        manager.setState(GameStates.PLAYING);
        test.expect(manager.getCurrentState()).toBe(GameStates.PLAYING);
        
        manager.setState(GameStates.QUESTION);
        test.expect(manager.getCurrentState()).toBe(GameStates.QUESTION);
        
        manager.setState(GameStates.FEEDBACK);
        test.expect(manager.getCurrentState()).toBe(GameStates.FEEDBACK);
        
        manager.setState(GameStates.GAMEOVER);
        test.expect(manager.getCurrentState()).toBe(GameStates.GAMEOVER);
    });

    test.test('should reject invalid state transitions', () => {
        const manager = new GameStateManager();
        const originalState = manager.getCurrentState();
        
        // Mock console.warn to capture warning
        let warningMessage = '';
        const originalWarn = console.warn;
        console.warn = (msg) => { warningMessage = msg; };
        
        manager.setState('invalid_state');
        
        // Restore console.warn
        console.warn = originalWarn;
        
        test.expect(manager.getCurrentState()).toBe(originalState);
        test.expect(warningMessage).toContain('Invalid game state');
    });

    test.test('should notify state change listeners', () => {
        const manager = new GameStateManager();
        let listenerCalled = false;
        let newState = '';
        let previousState = '';
        
        const listener = (newS, prevS) => {
            listenerCalled = true;
            newState = newS;
            previousState = prevS;
        };
        
        manager.addStateChangeListener(listener);
        manager.setState(GameStates.PLAYING);
        
        test.expect(listenerCalled).toBe(true);
        test.expect(newState).toBe(GameStates.PLAYING);
        test.expect(previousState).toBe(GameStates.MENU);
    });

    test.test('should remove state change listeners', () => {
        const manager = new GameStateManager();
        let listenerCalled = false;
        
        const listener = () => { listenerCalled = true; };
        
        manager.addStateChangeListener(listener);
        manager.removeStateChangeListener(listener);
        manager.setState(GameStates.PLAYING);
        
        test.expect(listenerCalled).toBe(false);
    });

    test.test('should update score correctly', () => {
        const manager = new GameStateManager();
        
        manager.updateScore(100);
        test.expect(manager.gameState.score).toBe(100);
        
        manager.updateScore(50);
        test.expect(manager.gameState.score).toBe(150);
        
        manager.updateScore(-25);
        test.expect(manager.gameState.score).toBe(125);
        
        // Score should not go below 0
        manager.updateScore(-200);
        test.expect(manager.gameState.score).toBe(0);
    });

    test.test('should manage lives correctly', () => {
        const manager = new GameStateManager();
        
        test.expect(manager.gameState.lives).toBe(3);
        
        let hasLives = manager.decrementLives();
        test.expect(manager.gameState.lives).toBe(2);
        test.expect(hasLives).toBe(true);
        
        hasLives = manager.decrementLives();
        test.expect(manager.gameState.lives).toBe(1);
        test.expect(hasLives).toBe(true);
        
        hasLives = manager.decrementLives();
        test.expect(manager.gameState.lives).toBe(0);
        test.expect(hasLives).toBe(false);
        
        // Lives should not go below 0
        hasLives = manager.decrementLives();
        test.expect(manager.gameState.lives).toBe(0);
        test.expect(hasLives).toBe(false);
    });

    test.test('should update game time correctly', () => {
        const manager = new GameStateManager();
        
        manager.updateGameTime(1000); // 1 second
        test.expect(manager.gameState.gameTime).toBe(1000);
        
        manager.updateGameTime(500); // 0.5 seconds
        test.expect(manager.gameState.gameTime).toBe(1500);
    });

    test.test('should update question timer only in playing state', () => {
        const manager = new GameStateManager();
        
        // In menu state, question timer should not update
        manager.setState(GameStates.MENU);
        manager.updateGameTime(1000);
        test.expect(manager.questionTimer).toBe(0);
        
        // In playing state, question timer should update
        manager.setState(GameStates.PLAYING);
        manager.updateGameTime(1000);
        test.expect(manager.questionTimer).toBe(1000);
        
        manager.updateGameTime(2000);
        test.expect(manager.questionTimer).toBe(3000);
    });

    test.test('should trigger questions at correct intervals', () => {
        const manager = new GameStateManager();
        manager.setState(GameStates.PLAYING);
        
        // Should not trigger initially
        test.expect(manager.shouldTriggerQuestion()).toBe(false);
        
        // Should not trigger before interval
        manager.updateGameTime(7000);
        test.expect(manager.shouldTriggerQuestion()).toBe(false);
        
        // Should trigger after interval
        manager.updateGameTime(1500);
        test.expect(manager.shouldTriggerQuestion()).toBe(true);
    });

    test.test('should reset question timer', () => {
        const manager = new GameStateManager();
        manager.setState(GameStates.PLAYING);
        
        manager.updateGameTime(5000);
        test.expect(manager.questionTimer).toBe(5000);
        
        manager.resetQuestionTimer();
        test.expect(manager.questionTimer).toBe(0);
    });

    test.test('should record correct answers properly', () => {
        const manager = new GameStateManager();
        
        manager.recordAnswer(true);
        test.expect(manager.gameState.questionsAnswered).toBe(1);
        test.expect(manager.gameState.correctAnswers).toBe(1);
        test.expect(manager.gameState.score).toBe(100);
        
        manager.recordAnswer(true);
        test.expect(manager.gameState.questionsAnswered).toBe(2);
        test.expect(manager.gameState.correctAnswers).toBe(2);
        test.expect(manager.gameState.score).toBe(200);
    });

    test.test('should record incorrect answers properly', () => {
        const manager = new GameStateManager();
        
        manager.recordAnswer(false);
        test.expect(manager.gameState.questionsAnswered).toBe(1);
        test.expect(manager.gameState.correctAnswers).toBe(0);
        test.expect(manager.gameState.score).toBe(0); // Score can't go below 0
        
        // Add some score first
        manager.updateScore(100);
        manager.recordAnswer(false);
        test.expect(manager.gameState.questionsAnswered).toBe(2);
        test.expect(manager.gameState.correctAnswers).toBe(0);
        test.expect(manager.gameState.score).toBe(75); // 100 - 25 penalty
    });

    test.test('should reset game to initial state', () => {
        const manager = new GameStateManager();
        
        // Modify state
        manager.setState(GameStates.PLAYING);
        manager.updateScore(500);
        manager.decrementLives();
        manager.recordAnswer(true);
        manager.updateGameTime(10000);
        
        // Reset
        manager.resetGame();
        
        // Check all values are reset
        test.expect(manager.getCurrentState()).toBe(GameStates.MENU);
        test.expect(manager.gameState.score).toBe(0);
        test.expect(manager.gameState.lives).toBe(3);
        test.expect(manager.gameState.currentQuestionIndex).toBe(0);
        test.expect(manager.gameState.questionsAnswered).toBe(0);
        test.expect(manager.gameState.correctAnswers).toBe(0);
        test.expect(manager.gameState.gameTime).toBe(0);
        test.expect(manager.gameState.playerPosition).toEqual({ x: 100, y: 300 });
        test.expect(manager.gameState.gameSpeed).toBe(1.0);
        test.expect(manager.questionTimer).toBe(0);
    });

    test.test('should calculate game statistics correctly', () => {
        const manager = new GameStateManager();
        
        // Test with no questions answered
        let stats = manager.getGameStats();
        test.expect(stats.accuracy).toBe(0);
        test.expect(stats.questionsAnswered).toBe(0);
        test.expect(stats.correctAnswers).toBe(0);
        
        // Answer some questions
        manager.recordAnswer(true);
        manager.recordAnswer(true);
        manager.recordAnswer(false);
        manager.recordAnswer(true);
        manager.updateGameTime(30000); // 30 seconds
        
        stats = manager.getGameStats();
        test.expect(stats.score).toBe(275); // 3 correct (300) - 1 incorrect (25) = 275
        test.expect(stats.lives).toBe(3);
        test.expect(stats.questionsAnswered).toBe(4);
        test.expect(stats.correctAnswers).toBe(3);
        test.expect(stats.accuracy).toBe(75); // 3/4 = 75%
        test.expect(stats.gameTime).toBe(30); // 30 seconds
    });

    test.test('should handle edge cases in statistics calculation', () => {
        const manager = new GameStateManager();
        
        // Test accuracy calculation with zero questions
        let stats = manager.getGameStats();
        test.expect(stats.accuracy).toBe(0);
        
        // Test with only incorrect answers
        manager.recordAnswer(false);
        manager.recordAnswer(false);
        
        stats = manager.getGameStats();
        test.expect(stats.accuracy).toBe(0);
        
        // Test with only correct answers
        manager.resetGame();
        manager.recordAnswer(true);
        manager.recordAnswer(true);
        
        stats = manager.getGameStats();
        test.expect(stats.accuracy).toBe(100);
    });

    test.test('should handle performance under stress', () => {
        const manager = new GameStateManager();
        
        // Simulate rapid state changes
        const startTime = Date.now();
        for (let i = 0; i < 10000; i++) {
            manager.setState(GameStates.PLAYING);
            manager.updateScore(10);
            manager.updateGameTime(16); // 60fps
            manager.recordAnswer(i % 2 === 0);
            manager.setState(GameStates.QUESTION);
            manager.setState(GameStates.FEEDBACK);
        }
        const endTime = Date.now();
        
        test.expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
        test.expect(manager.gameState.questionsAnswered).toBe(10000);
        test.expect(manager.gameState.score).toBeGreaterThan(0);
    });

    test.test('should handle invalid input gracefully', () => {
        const manager = new GameStateManager();
        
        // Test invalid state transitions
        manager.setState(null);
        test.expect(manager.getCurrentState()).toBe(GameStates.MENU);
        
        manager.setState(undefined);
        test.expect(manager.getCurrentState()).toBe(GameStates.MENU);
        
        manager.setState(123);
        test.expect(manager.getCurrentState()).toBe(GameStates.MENU);
        
        // Test invalid score updates
        manager.updateScore(NaN);
        test.expect(manager.gameState.score).toBe(0);
        
        manager.updateScore(Infinity);
        test.expect(manager.gameState.score).toBe(0);
        
        manager.updateScore(-Infinity);
        test.expect(manager.gameState.score).toBe(0);
        
        // Test invalid time updates
        manager.updateGameTime(NaN);
        test.expect(manager.gameState.gameTime).toBe(0);
        
        manager.updateGameTime(-100);
        test.expect(manager.gameState.gameTime).toBe(0);
    });

    test.test('should handle memory leaks in listeners', () => {
        const manager = new GameStateManager();
        const listeners = [];
        
        // Add many listeners
        for (let i = 0; i < 1000; i++) {
            const listener = () => {};
            listeners.push(listener);
            manager.addStateChangeListener(listener);
        }
        
        test.expect(manager.stateChangeListeners).toHaveLength(1000);
        
        // Remove all listeners
        listeners.forEach(listener => {
            manager.removeStateChangeListener(listener);
        });
        
        test.expect(manager.stateChangeListeners).toHaveLength(0);
    });

    test.test('should provide performance feedback messages', () => {
        const manager = new GameStateManager();
        
        // Test different performance levels
        test.expect(manager.getPerformanceFeedback()).toContain('start learning');
        
        // High accuracy
        for (let i = 0; i < 10; i++) {
            manager.recordAnswer(true);
        }
        test.expect(manager.getPerformanceFeedback()).toContain('Excellent');
        
        // Medium accuracy
        manager.resetGame();
        for (let i = 0; i < 8; i++) {
            manager.recordAnswer(i < 6);
        }
        test.expect(manager.getPerformanceFeedback()).toContain('Great');
        
        // Low accuracy
        manager.resetGame();
        for (let i = 0; i < 10; i++) {
            manager.recordAnswer(i < 3);
        }
        test.expect(manager.getPerformanceFeedback()).toContain('Keep trying');
    });

    test.test('should maintain state consistency during complex operations', () => {
        const manager = new GameStateManager();
        
        // Simulate a game session
        manager.setState(GameStates.PLAYING);
        manager.updateGameTime(8500); // Trigger question
        
        test.expect(manager.shouldTriggerQuestion()).toBe(true);
        
        manager.setState(GameStates.QUESTION);
        manager.resetQuestionTimer();
        
        // Answer question correctly
        manager.recordAnswer(true);
        manager.setState(GameStates.FEEDBACK);
        
        // Continue playing
        manager.setState(GameStates.PLAYING);
        
        // Verify state is consistent
        test.expect(manager.gameState.questionsAnswered).toBe(1);
        test.expect(manager.gameState.correctAnswers).toBe(1);
        test.expect(manager.gameState.score).toBe(100);
        test.expect(manager.questionTimer).toBe(0);
    });
});

test.summary();