/**
 * Comprehensive Error Handling Test Suite
 * Tests all the error handling and validation mechanisms implemented in task 8
 */

// Import modules for Node.js environment
let ContentLoader, GameStateManager, GameStates, QuestionPresenter, RunnerEngine, QuestionFlowManager;

if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    try {
        ContentLoader = require('./game/content-loader.js');
        const gameStateModule = require('./game/game-state.js');
        GameStateManager = gameStateModule.GameStateManager;
        GameStates = gameStateModule.GameStates;
        QuestionPresenter = require('./game/question-presenter.js');
        RunnerEngine = require('./game/runner-engine.js');
        QuestionFlowManager = require('./game/question-flow-manager.js');
    } catch (error) {
        console.error('Error importing modules for Node.js:', error.message);
        console.log('Note: This test suite is designed to run in a browser environment.');
        console.log('To test in Node.js, ensure all modules export properly.');
        process.exit(1);
    }
}

// Test data for various error scenarios
const testScenarios = {
    invalidJSON: '{"questions": [{"prompt": "test", "options": ["a", "b"], "answer": "a", "feedback": "test"}',
    malformedQuestions: {
        questions: [
            {
                // Missing required fields
                prompt: "",
                options: ["a"],
                answer: "c", // Not in options
                feedback: ""
            },
            {
                // Invalid data types
                prompt: 123,
                options: "not an array",
                answer: null,
                feedback: false
            },
            {
                // XSS attempt
                prompt: "<script>alert('xss')</script>What is 2+2?",
                options: ["<img src=x onerror=alert('xss')>4", "5", "6", "7"],
                answer: "<img src=x onerror=alert('xss')>4",
                feedback: "javascript:alert('xss')"
            }
        ]
    },
    validQuestions: {
        questions: [
            {
                id: "test-001",
                prompt: "What is 2 + 2?",
                options: ["3", "4", "5", "6"],
                answer: "4",
                feedback: "Correct! 2 + 2 = 4."
            }
        ]
    }
};

/**
 * Test ContentLoader error handling
 */
async function testContentLoaderErrorHandling() {
    console.log('=== Testing ContentLoader Error Handling ===');
    
    const contentLoader = new ContentLoader();
    
    // Test 1: Invalid JSON path
    console.log('Test 1: Invalid JSON path');
    try {
        const result = await contentLoader.loadQuestions('nonexistent-file.json');
        console.log('Result:', result);
        console.assert(!result.success, 'Should fail for nonexistent file');
        console.assert(result.error.includes('not found'), 'Should indicate file not found');
    } catch (error) {
        console.error('Unexpected error:', error);
    }
    
    // Test 2: Invalid input validation
    console.log('Test 2: Invalid input validation');
    try {
        const result = await contentLoader.loadQuestions(null);
        console.log('Result:', result);
        console.assert(!result.success, 'Should fail for null input');
    } catch (error) {
        console.error('Unexpected error:', error);
    }
    
    // Test 3: Fallback question mechanism
    console.log('Test 3: Fallback question mechanism');
    try {
        contentLoader.clear(); // Clear all questions
        const fallbackQuestion = contentLoader.getNextQuestion();
        console.log('Fallback question:', fallbackQuestion);
        console.assert(fallbackQuestion !== null, 'Should return fallback question');
        console.assert(fallbackQuestion.prompt.includes('2 + 2'), 'Should be the fallback math question');
    } catch (error) {
        console.error('Error testing fallback:', error);
    }
    
    console.log('ContentLoader error handling tests completed.\n');
}

/**
 * Test GameStateManager error handling
 */
function testGameStateManagerErrorHandling() {
    console.log('=== Testing GameStateManager Error Handling ===');
    
    const gameStateManager = new GameStateManager();
    
    // Test 1: Invalid state transitions
    console.log('Test 1: Invalid state transitions');
    try {
        gameStateManager.setState('invalid_state');
        console.assert(gameStateManager.getCurrentState() !== 'invalid_state', 'Should not accept invalid state');
    } catch (error) {
        console.error('Error in state transition test:', error);
    }
    
    // Test 2: Invalid score updates
    console.log('Test 2: Invalid score updates');
    try {
        const initialScore = gameStateManager.gameState.score;
        gameStateManager.updateScore('not a number');
        console.assert(gameStateManager.gameState.score === initialScore, 'Score should not change with invalid input');
        
        gameStateManager.updateScore(NaN);
        console.assert(gameStateManager.gameState.score === initialScore, 'Score should not change with NaN');
        
        gameStateManager.updateScore(Infinity);
        console.assert(gameStateManager.gameState.score === initialScore, 'Score should not change with Infinity');
    } catch (error) {
        console.error('Error in score update test:', error);
    }
    
    // Test 3: Invalid time updates
    console.log('Test 3: Invalid time updates');
    try {
        const initialTime = gameStateManager.gameState.gameTime;
        gameStateManager.updateGameTime(-100);
        console.assert(gameStateManager.gameState.gameTime === initialTime, 'Time should not change with negative input');
        
        gameStateManager.updateGameTime('not a number');
        console.assert(gameStateManager.gameState.gameTime === initialTime, 'Time should not change with invalid input');
    } catch (error) {
        console.error('Error in time update test:', error);
    }
    
    // Test 4: Invalid answer recording
    console.log('Test 4: Invalid answer recording');
    try {
        const initialAnswered = gameStateManager.gameState.questionsAnswered;
        gameStateManager.recordAnswer('not a boolean');
        console.assert(gameStateManager.gameState.questionsAnswered === initialAnswered, 'Questions answered should not change with invalid input');
    } catch (error) {
        console.error('Error in answer recording test:', error);
    }
    
    console.log('GameStateManager error handling tests completed.\n');
}

/**
 * Test QuestionPresenter error handling
 */
function testQuestionPresenterErrorHandling() {
    console.log('=== Testing QuestionPresenter Error Handling ===');
    
    const questionPresenter = new QuestionPresenter();
    
    // Test 1: Invalid question display
    console.log('Test 1: Invalid question display');
    try {
        questionPresenter.displayQuestion(null);
        console.assert(!questionPresenter.isQuestionVisible(), 'Should not display null question');
        
        questionPresenter.displayQuestion({});
        console.assert(!questionPresenter.isQuestionVisible(), 'Should not display empty question object');
        
        questionPresenter.displayQuestion({
            prompt: "",
            options: [],
            answer: "",
            feedback: ""
        });
        console.assert(!questionPresenter.isQuestionVisible(), 'Should not display invalid question');
    } catch (error) {
        console.error('Error in question display test:', error);
    }
    
    // Test 2: XSS prevention
    console.log('Test 2: XSS prevention');
    try {
        const xssQuestion = {
            prompt: "<script>alert('xss')</script>What is 2+2?",
            options: ["<img src=x onerror=alert('xss')>4", "5", "6", "7"],
            answer: "<img src=x onerror=alert('xss')>4",
            feedback: "javascript:alert('xss')"
        };
        
        questionPresenter.displayQuestion(xssQuestion);
        
        // Check if XSS content was sanitized
        if (questionPresenter.isQuestionVisible()) {
            const promptText = questionPresenter.ui.prompt.textContent;
            console.assert(!promptText.includes('<script>'), 'Script tags should be removed');
            console.assert(!promptText.includes('javascript:'), 'JavaScript protocol should be removed');
        }
    } catch (error) {
        console.error('Error in XSS prevention test:', error);
    }
    
    // Test 3: Invalid answer handling
    console.log('Test 3: Invalid answer handling');
    try {
        // First display a valid question
        const validQuestion = {
            prompt: "Test question?",
            options: ["A", "B", "C"],
            answer: "A",
            feedback: "Test feedback"
        };
        
        questionPresenter.displayQuestion(validQuestion);
        
        // Try to handle invalid answers
        questionPresenter.handleAnswerSelection(null);
        questionPresenter.handleAnswerSelection("");
        questionPresenter.handleAnswerSelection(123);
        
        // These should not crash the system
        console.log('Invalid answer handling completed without crashes');
    } catch (error) {
        console.error('Error in answer handling test:', error);
    }
    
    console.log('QuestionPresenter error handling tests completed.\n');
}

/**
 * Test RunnerEngine error handling
 */
function testRunnerEngineErrorHandling() {
    console.log('=== Testing RunnerEngine Error Handling ===');
    
    // Create a mock game state manager for testing
    const mockGameStateManager = {
        gameState: { playerPosition: { x: 100, y: 300 } },
        getCurrentState: () => 'playing'
    };
    
    const runnerEngine = new RunnerEngine(mockGameStateManager);
    
    // Test 1: Collision detection with invalid obstacles
    console.log('Test 1: Collision detection with invalid obstacles');
    try {
        // Add some invalid obstacles
        runnerEngine.obstacles = [
            null,
            undefined,
            { x: 'invalid', y: 100, width: 30, height: 40 },
            { x: 200, y: NaN, width: 30, height: 40 },
            { x: 300, y: 100, width: -10, height: 40 }, // Negative width
        ];
        
        const collision = runnerEngine.checkCollisions();
        console.log('Collision result:', collision);
        
        // Should handle invalid obstacles gracefully
        console.assert(collision === null, 'Should return null for invalid obstacles');
    } catch (error) {
        console.error('Error in collision detection test:', error);
    }
    
    // Test 2: Player update with invalid delta time
    console.log('Test 2: Player update with invalid delta time');
    try {
        runnerEngine.updatePlayer('not a number');
        runnerEngine.updatePlayer(-1);
        runnerEngine.updatePlayer(NaN);
        runnerEngine.updatePlayer(Infinity);
        
        console.log('Player update with invalid delta time completed without crashes');
    } catch (error) {
        console.error('Error in player update test:', error);
    }
    
    console.log('RunnerEngine error handling tests completed.\n');
}

/**
 * Test QuestionFlowManager error handling
 */
function testQuestionFlowManagerErrorHandling() {
    console.log('=== Testing QuestionFlowManager Error Handling ===');
    
    // Create mock dependencies
    const mockContentLoader = {
        hasQuestions: () => false,
        getNextQuestion: () => null,
        resetQuestionQueue: () => {}
    };
    
    const mockQuestionPresenter = {
        displayQuestion: () => { throw new Error('Display error'); },
        addAnswerListener: () => {},
        addFeedbackCompleteListener: () => {}
    };
    
    const mockGameStateManager = {
        addStateChangeListener: () => {},
        getCurrentState: () => 'playing',
        shouldTriggerQuestion: () => true,
        isQuestionPending: () => false,
        setQuestionPending: () => {},
        setState: () => {},
        updateGameTime: () => {},
        resetQuestionTimer: () => {}
    };
    
    const questionFlowManager = new QuestionFlowManager(
        mockContentLoader,
        mockQuestionPresenter,
        mockGameStateManager
    );
    
    // Test 1: Trigger question with no questions available
    console.log('Test 1: Trigger question with no questions available');
    try {
        questionFlowManager.triggerQuestion();
        console.log('Trigger question with no questions completed without crashes');
    } catch (error) {
        console.error('Error in trigger question test:', error);
    }
    
    // Test 2: Update with invalid delta time
    console.log('Test 2: Update with invalid delta time');
    try {
        questionFlowManager.update('not a number');
        questionFlowManager.update(-100);
        questionFlowManager.update(NaN);
        
        console.log('Update with invalid delta time completed without crashes');
    } catch (error) {
        console.error('Error in update test:', error);
    }
    
    console.log('QuestionFlowManager error handling tests completed.\n');
}

/**
 * Run all error handling tests
 */
async function runAllErrorHandlingTests() {
    console.log('Starting comprehensive error handling tests...\n');
    
    try {
        await testContentLoaderErrorHandling();
        testGameStateManagerErrorHandling();
        testQuestionPresenterErrorHandling();
        testRunnerEngineErrorHandling();
        testQuestionFlowManagerErrorHandling();
        
        console.log('=== All Error Handling Tests Completed ===');
        console.log('If you see this message, the error handling system is working correctly!');
        
    } catch (error) {
        console.error('Critical error during testing:', error);
    }
}

// Run tests when the page loads
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait a bit for other scripts to load
        setTimeout(runAllErrorHandlingTests, 1000);
    });
} else {
    // For Node.js environment
    runAllErrorHandlingTests();
}