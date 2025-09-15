#!/usr/bin/env node

/**
 * Comprehensive Game Feature Test Suite
 * Tests all implemented game features and components
 */

const path = require('path');

// Import all game modules
let ContentLoader, GameStateManager, GameStates, QuestionPresenter, RunnerEngine, QuestionFlowManager;

try {
    ContentLoader = require('./game/content-loader.js');
    const gameStateModule = require('./game/game-state.js');
    GameStateManager = gameStateModule.GameStateManager;
    GameStates = gameStateModule.GameStates;
    QuestionPresenter = require('./game/question-presenter.js');
    RunnerEngine = require('./game/runner-engine.js');
    QuestionFlowManager = require('./game/question-flow-manager.js');
} catch (error) {
    console.error('❌ Failed to import game modules:', error.message);
    process.exit(1);
}

/**
 * Test results tracking
 */
class TestTracker {
    constructor() {
        this.results = [];
        this.categories = {};
    }

    addTest(category, name, status, details = '') {
        const test = { category, name, status, details, timestamp: Date.now() };
        this.results.push(test);
        
        if (!this.categories[category]) {
            this.categories[category] = { passed: 0, failed: 0, total: 0 };
        }
        
        this.categories[category].total++;
        if (status === 'pass') {
            this.categories[category].passed++;
        } else {
            this.categories[category].failed++;
        }
    }

    printResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 COMPREHENSIVE GAME TEST RESULTS');
        console.log('='.repeat(60));

        Object.keys(this.categories).forEach(category => {
            const stats = this.categories[category];
            const successRate = Math.round((stats.passed / stats.total) * 100);
            const status = stats.failed === 0 ? '✅' : '⚠️';
            
            console.log(`\n${status} ${category.toUpperCase()}: ${stats.passed}/${stats.total} passed (${successRate}%)`);
            
            // Show failed tests
            const failedTests = this.results.filter(t => t.category === category && t.status !== 'pass');
            if (failedTests.length > 0) {
                failedTests.forEach(test => {
                    console.log(`   ❌ ${test.name}: ${test.details}`);
                });
            }
        });

        const totalPassed = this.results.filter(r => r.status === 'pass').length;
        const totalTests = this.results.length;
        const overallSuccess = Math.round((totalPassed / totalTests) * 100);

        console.log('\n' + '='.repeat(60));
        console.log(`🎯 OVERALL RESULTS: ${totalPassed}/${totalTests} tests passed (${overallSuccess}%)`);
        
        if (overallSuccess === 100) {
            console.log('🎉 ALL GAME FEATURES ARE WORKING CORRECTLY!');
        } else if (overallSuccess >= 90) {
            console.log('✅ Game is mostly functional with minor issues');
        } else if (overallSuccess >= 75) {
            console.log('⚠️  Game has some issues that should be addressed');
        } else {
            console.log('❌ Game has significant issues requiring attention');
        }
        
        console.log('='.repeat(60));
    }
}

const tracker = new TestTracker();

/**
 * Test ContentLoader functionality
 */
async function testContentLoader() {
    console.log('🧪 Testing ContentLoader...');

    try {
        const loader = new ContentLoader();
        
        // Test 1: Basic instantiation
        if (loader && typeof loader.loadQuestions === 'function') {
            tracker.addTest('ContentLoader', 'Instantiation', 'pass');
        } else {
            tracker.addTest('ContentLoader', 'Instantiation', 'fail', 'Missing required methods');
        }

        // Test 2: Load valid questions
        try {
            const result = await loader.loadQuestions('data/math-basic.json');
            if (result.success) {
                tracker.addTest('ContentLoader', 'Load Valid Questions', 'pass', `Loaded ${loader.getQuestionCount()} questions`);
            } else {
                tracker.addTest('ContentLoader', 'Load Valid Questions', 'fail', result.error);
            }
        } catch (error) {
            tracker.addTest('ContentLoader', 'Load Valid Questions', 'fail', error.message);
        }

        // Test 3: Question retrieval
        const question = loader.getNextQuestion();
        if (question && question.prompt && Array.isArray(question.options)) {
            tracker.addTest('ContentLoader', 'Question Retrieval', 'pass', `Got question: "${question.prompt.substring(0, 30)}..."`);
        } else {
            tracker.addTest('ContentLoader', 'Question Retrieval', 'fail', 'Invalid question structure');
        }

        // Test 4: Fallback mechanism
        loader.clear();
        const fallback = loader.getNextQuestion();
        if (fallback && fallback.prompt.includes('2 + 2')) {
            tracker.addTest('ContentLoader', 'Fallback Mechanism', 'pass');
        } else {
            tracker.addTest('ContentLoader', 'Fallback Mechanism', 'fail', 'Fallback not working');
        }

        // Test 5: Error handling
        const errorResult = await loader.loadQuestions('nonexistent.json');
        if (!errorResult.success && errorResult.error) {
            tracker.addTest('ContentLoader', 'Error Handling', 'pass');
        } else {
            tracker.addTest('ContentLoader', 'Error Handling', 'fail', 'Should fail for invalid file');
        }

        // Test 6: Enhanced features (subject config support)
        if (typeof loader.loadQuestionsForSubject === 'function' && 
            typeof loader.getQuestionsByType === 'function') {
            tracker.addTest('ContentLoader', 'Enhanced Features', 'pass', 'Subject config and type filtering available');
        } else {
            tracker.addTest('ContentLoader', 'Enhanced Features', 'fail', 'Missing enhanced features');
        }

    } catch (error) {
        tracker.addTest('ContentLoader', 'Critical Error', 'fail', error.message);
    }
}

/**
 * Test GameStateManager functionality
 */
function testGameStateManager() {
    console.log('🧪 Testing GameStateManager...');

    try {
        const gameState = new GameStateManager();

        // Test 1: Basic instantiation and initial state
        if (gameState.getCurrentState() === GameStates.MENU) {
            tracker.addTest('GameState', 'Instantiation', 'pass');
        } else {
            tracker.addTest('GameState', 'Instantiation', 'fail', `Wrong initial state: ${gameState.getCurrentState()}`);
        }

        // Test 2: State transitions
        gameState.setState(GameStates.PLAYING);
        if (gameState.getCurrentState() === GameStates.PLAYING) {
            tracker.addTest('GameState', 'State Transitions', 'pass');
        } else {
            tracker.addTest('GameState', 'State Transitions', 'fail', 'State not updated');
        }

        // Test 3: Score management
        const initialScore = gameState.gameState.score;
        gameState.updateScore(100);
        if (gameState.gameState.score === initialScore + 100) {
            tracker.addTest('GameState', 'Score Management', 'pass');
        } else {
            tracker.addTest('GameState', 'Score Management', 'fail', 'Score not updated correctly');
        }

        // Test 4: Time tracking
        const initialTime = gameState.gameState.gameTime;
        gameState.updateGameTime(1000);
        if (gameState.gameState.gameTime === initialTime + 1000) {
            tracker.addTest('GameState', 'Time Tracking', 'pass');
        } else {
            tracker.addTest('GameState', 'Time Tracking', 'fail', 'Time not updated correctly');
        }

        // Test 5: Question timing
        if (typeof gameState.shouldTriggerQuestion === 'function' && 
            typeof gameState.resetQuestionTimer === 'function') {
            tracker.addTest('GameState', 'Question Timing', 'pass');
        } else {
            tracker.addTest('GameState', 'Question Timing', 'fail', 'Missing question timing methods');
        }

        // Test 6: Answer recording
        gameState.recordAnswer(true);
        if (gameState.gameState.questionsAnswered > 0 && gameState.gameState.correctAnswers > 0) {
            tracker.addTest('GameState', 'Answer Recording', 'pass');
        } else {
            tracker.addTest('GameState', 'Answer Recording', 'fail', 'Answer not recorded correctly');
        }

        // Test 7: Game statistics
        const stats = gameState.getGameStats();
        if (stats && typeof stats.accuracy === 'number' && typeof stats.score === 'number') {
            tracker.addTest('GameState', 'Statistics', 'pass');
        } else {
            tracker.addTest('GameState', 'Statistics', 'fail', 'Invalid statistics');
        }

        // Test 8: Error handling
        const initialState = gameState.getCurrentState();
        gameState.setState('invalid_state');
        if (gameState.getCurrentState() === initialState) {
            tracker.addTest('GameState', 'Error Handling', 'pass');
        } else {
            tracker.addTest('GameState', 'Error Handling', 'fail', 'Should reject invalid state');
        }

    } catch (error) {
        tracker.addTest('GameState', 'Critical Error', 'fail', error.message);
    }
}

/**
 * Test QuestionPresenter functionality
 */
function testQuestionPresenter() {
    console.log('🧪 Testing QuestionPresenter...');

    try {
        const presenter = new QuestionPresenter();

        // Test 1: Basic instantiation
        if (presenter && typeof presenter.displayQuestion === 'function') {
            tracker.addTest('QuestionPresenter', 'Instantiation', 'pass');
        } else {
            tracker.addTest('QuestionPresenter', 'Instantiation', 'fail', 'Missing required methods');
        }

        // Test 2: Question validation
        if (typeof presenter.validateQuestion === 'function') {
            const validQuestion = {
                prompt: 'Test question?',
                options: ['A', 'B', 'C'],
                answer: 'A',
                feedback: 'Good job!'
            };
            const validation = presenter.validateQuestion(validQuestion);
            if (validation.isValid) {
                tracker.addTest('QuestionPresenter', 'Question Validation', 'pass');
            } else {
                tracker.addTest('QuestionPresenter', 'Question Validation', 'fail', validation.errors.join(', '));
            }
        } else {
            tracker.addTest('QuestionPresenter', 'Question Validation', 'fail', 'Missing validation method');
        }

        // Test 3: UI initialization
        if (presenter.ui && presenter.ui.container) {
            tracker.addTest('QuestionPresenter', 'UI Initialization', 'pass');
        } else {
            tracker.addTest('QuestionPresenter', 'UI Initialization', 'fail', 'UI not properly initialized');
        }

        // Test 4: Enhanced features (type handlers)
        if (typeof presenter.displayQuestionWithTypeHandler === 'function' &&
            typeof presenter.renderQuestionWithKaboom === 'function') {
            tracker.addTest('QuestionPresenter', 'Enhanced Features', 'pass', 'Type handlers and Kaboom support');
        } else {
            tracker.addTest('QuestionPresenter', 'Enhanced Features', 'fail', 'Missing enhanced features');
        }

        // Test 5: Input handling
        if (typeof presenter.setupQuestionTypeInput === 'function' &&
            typeof presenter.addKeyboardSupport === 'function') {
            tracker.addTest('QuestionPresenter', 'Input Handling', 'pass');
        } else {
            tracker.addTest('QuestionPresenter', 'Input Handling', 'fail', 'Missing input handling methods');
        }

        // Test 6: Error handling
        presenter.displayQuestion(null);
        if (!presenter.isQuestionVisible()) {
            tracker.addTest('QuestionPresenter', 'Error Handling', 'pass');
        } else {
            tracker.addTest('QuestionPresenter', 'Error Handling', 'fail', 'Should not display null question');
        }

        // Test 7: Text sanitization
        if (typeof presenter.sanitizeText === 'function') {
            const dangerous = '<script>alert("xss")</script>Test';
            const safe = presenter.sanitizeText(dangerous);
            if (!safe.includes('<script>')) {
                tracker.addTest('QuestionPresenter', 'Text Sanitization', 'pass');
            } else {
                tracker.addTest('QuestionPresenter', 'Text Sanitization', 'fail', 'XSS content not removed');
            }
        } else {
            tracker.addTest('QuestionPresenter', 'Text Sanitization', 'fail', 'Missing sanitization method');
        }

    } catch (error) {
        tracker.addTest('QuestionPresenter', 'Critical Error', 'fail', error.message);
    }
}

/**
 * Test RunnerEngine functionality
 */
function testRunnerEngine() {
    console.log('🧪 Testing RunnerEngine...');

    try {
        // Create mock game state manager
        const mockGameState = {
            gameState: { playerPosition: { x: 100, y: 300 } },
            getCurrentState: () => 'playing'
        };

        const engine = new RunnerEngine(mockGameState);

        // Test 1: Basic instantiation
        if (engine && typeof engine.updatePlayer === 'function') {
            tracker.addTest('RunnerEngine', 'Instantiation', 'pass');
        } else {
            tracker.addTest('RunnerEngine', 'Instantiation', 'fail', 'Missing required methods');
        }

        // Test 2: Player update
        if (typeof engine.updatePlayer === 'function' && 
            typeof engine.checkCollisions === 'function') {
            tracker.addTest('RunnerEngine', 'Player Mechanics', 'pass');
        } else {
            tracker.addTest('RunnerEngine', 'Player Mechanics', 'fail', 'Missing player mechanics');
        }

        // Test 3: Obstacle management
        if (typeof engine.generateObstacle === 'function' && 
            typeof engine.updateObstacles === 'function') {
            tracker.addTest('RunnerEngine', 'Obstacle Management', 'pass');
        } else {
            tracker.addTest('RunnerEngine', 'Obstacle Management', 'fail', 'Missing obstacle methods');
        }

        // Test 4: Collision detection
        engine.obstacles = [{ x: 100, y: 300, width: 30, height: 40 }];
        const collision = engine.checkCollisions();
        if (collision !== undefined) {
            tracker.addTest('RunnerEngine', 'Collision Detection', 'pass');
        } else {
            tracker.addTest('RunnerEngine', 'Collision Detection', 'fail', 'Collision detection not working');
        }

        // Test 5: Game loop
        if (typeof engine.update === 'function') {
            tracker.addTest('RunnerEngine', 'Game Loop', 'pass');
        } else {
            tracker.addTest('RunnerEngine', 'Game Loop', 'fail', 'Missing update method');
        }

        // Test 6: Error handling
        engine.obstacles = [null, { x: 'invalid', y: 100 }];
        try {
            engine.checkCollisions();
            tracker.addTest('RunnerEngine', 'Error Handling', 'pass');
        } catch (error) {
            tracker.addTest('RunnerEngine', 'Error Handling', 'fail', 'Should handle invalid obstacles gracefully');
        }

    } catch (error) {
        tracker.addTest('RunnerEngine', 'Critical Error', 'fail', error.message);
    }
}

/**
 * Test QuestionFlowManager functionality
 */
function testQuestionFlowManager() {
    console.log('🧪 Testing QuestionFlowManager...');

    try {
        // Create mock dependencies
        const mockContentLoader = {
            hasQuestions: () => true,
            getNextQuestion: () => ({
                prompt: 'Test?',
                options: ['A', 'B'],
                answer: 'A',
                feedback: 'Good!'
            }),
            resetQuestionQueue: () => {}
        };

        const mockQuestionPresenter = {
            displayQuestion: () => {},
            addAnswerListener: () => {},
            addFeedbackCompleteListener: () => {}
        };

        const mockGameStateManager = {
            addStateChangeListener: () => {},
            getCurrentState: () => 'playing',
            shouldTriggerQuestion: () => false,
            isQuestionPending: () => false,
            setQuestionPending: () => {},
            setState: () => {},
            updateGameTime: () => {},
            resetQuestionTimer: () => {}
        };

        const flowManager = new QuestionFlowManager(
            mockContentLoader,
            mockQuestionPresenter,
            mockGameStateManager
        );

        // Test 1: Basic instantiation
        if (flowManager && typeof flowManager.update === 'function') {
            tracker.addTest('QuestionFlow', 'Instantiation', 'pass');
        } else {
            tracker.addTest('QuestionFlow', 'Instantiation', 'fail', 'Missing required methods');
        }

        // Test 2: Question triggering
        if (typeof flowManager.triggerQuestion === 'function') {
            tracker.addTest('QuestionFlow', 'Question Triggering', 'pass');
        } else {
            tracker.addTest('QuestionFlow', 'Question Triggering', 'fail', 'Missing trigger method');
        }

        // Test 3: Flow management
        if (typeof flowManager.update === 'function' && 
            typeof flowManager.initialize === 'function') {
            tracker.addTest('QuestionFlow', 'Flow Management', 'pass');
        } else {
            tracker.addTest('QuestionFlow', 'Flow Management', 'fail', 'Missing flow methods');
        }

        // Test 4: Error handling
        try {
            flowManager.update('invalid_delta');
            tracker.addTest('QuestionFlow', 'Error Handling', 'pass');
        } catch (error) {
            tracker.addTest('QuestionFlow', 'Error Handling', 'fail', 'Should handle invalid input gracefully');
        }

    } catch (error) {
        tracker.addTest('QuestionFlow', 'Critical Error', 'fail', error.message);
    }
}

/**
 * Test game integration
 */
async function testGameIntegration() {
    console.log('🧪 Testing Game Integration...');

    try {
        // Test 1: Module compatibility
        const loader = new ContentLoader();
        const gameState = new GameStateManager();
        const presenter = new QuestionPresenter();
        
        if (loader && gameState && presenter) {
            tracker.addTest('Integration', 'Module Compatibility', 'pass');
        } else {
            tracker.addTest('Integration', 'Module Compatibility', 'fail', 'Modules not compatible');
        }

        // Test 2: Data flow
        await loader.loadQuestions('data/math-basic.json');
        const question = loader.getNextQuestion();
        
        if (question && presenter.validateQuestion) {
            const validation = presenter.validateQuestion(question);
            if (validation.isValid) {
                tracker.addTest('Integration', 'Data Flow', 'pass');
            } else {
                tracker.addTest('Integration', 'Data Flow', 'fail', 'Question validation failed');
            }
        } else {
            tracker.addTest('Integration', 'Data Flow', 'fail', 'Cannot validate question flow');
        }

        // Test 3: State synchronization
        gameState.setState(GameStates.QUESTION);
        gameState.recordAnswer(true);
        const stats = gameState.getGameStats();
        
        if (stats.questionsAnswered > 0) {
            tracker.addTest('Integration', 'State Synchronization', 'pass');
        } else {
            tracker.addTest('Integration', 'State Synchronization', 'fail', 'State not synchronized');
        }

    } catch (error) {
        tracker.addTest('Integration', 'Critical Error', 'fail', error.message);
    }
}

/**
 * Test file structure and dependencies
 */
function testFileStructure() {
    console.log('🧪 Testing File Structure...');

    const fs = require('fs');
    
    // Test 1: Core game files
    const coreFiles = [
        'game/content-loader.js',
        'game/game-state.js',
        'game/question-presenter.js',
        'game/runner-engine.js',
        'game/question-flow-manager.js'
    ];

    let missingFiles = [];
    coreFiles.forEach(file => {
        if (!fs.existsSync(file)) {
            missingFiles.push(file);
        }
    });

    if (missingFiles.length === 0) {
        tracker.addTest('FileStructure', 'Core Game Files', 'pass');
    } else {
        tracker.addTest('FileStructure', 'Core Game Files', 'fail', `Missing: ${missingFiles.join(', ')}`);
    }

    // Test 2: Data files
    if (fs.existsSync('data/math-basic.json')) {
        tracker.addTest('FileStructure', 'Data Files', 'pass');
    } else {
        tracker.addTest('FileStructure', 'Data Files', 'fail', 'Missing data files');
    }

    // Test 3: Test files
    const testFiles = ['run-error-tests.js', 'simple-error-test.html'];
    let missingTestFiles = [];
    testFiles.forEach(file => {
        if (!fs.existsSync(file)) {
            missingTestFiles.push(file);
        }
    });

    if (missingTestFiles.length === 0) {
        tracker.addTest('FileStructure', 'Test Files', 'pass');
    } else {
        tracker.addTest('FileStructure', 'Test Files', 'fail', `Missing: ${missingTestFiles.join(', ')}`);
    }

    // Test 4: Documentation
    if (fs.existsSync('README.md')) {
        tracker.addTest('FileStructure', 'Documentation', 'pass');
    } else {
        tracker.addTest('FileStructure', 'Documentation', 'fail', 'Missing README.md');
    }
}

/**
 * Run all tests
 */
async function runComprehensiveTests() {
    console.log('🚀 Starting Comprehensive Game Feature Tests...\n');
    const startTime = Date.now();

    try {
        // Test file structure first
        testFileStructure();
        
        // Test core components
        await testContentLoader();
        testGameStateManager();
        testQuestionPresenter();
        testRunnerEngine();
        testQuestionFlowManager();
        
        // Test integration
        await testGameIntegration();
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`\n⏱️  Test Duration: ${duration}ms`);
        tracker.printResults();
        
        const totalPassed = tracker.results.filter(r => r.status === 'pass').length;
        const totalTests = tracker.results.length;
        
        process.exit(totalPassed === totalTests ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Critical error during comprehensive testing:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the tests
if (require.main === module) {
    runComprehensiveTests();
}

module.exports = {
    runComprehensiveTests,
    testContentLoader,
    testGameStateManager,
    testQuestionPresenter,
    testRunnerEngine,
    testQuestionFlowManager
};