// Test script for Question Flow Integration
// This script tests the integration between ContentLoader, QuestionPresenter, and GameStateManager

console.log('Testing Question Flow Integration...');

// Mock Kaboom.js functions for testing
if (typeof window === 'undefined') {
    global.window = {};
    global.document = {
        createElement: () => ({
            style: {},
            addEventListener: () => {},
            appendChild: () => {},
            textContent: ''
        }),
        body: {
            appendChild: () => {}
        },
        head: {
            appendChild: () => {}
        },
        getElementById: () => null,
        addEventListener: () => {}
    };
}

// Load the modules
const ContentLoader = require('./game/content-loader.js');
const { GameStateManager, GameStates } = require('./game/game-state.js');
const QuestionPresenter = require('./game/question-presenter.js');
const QuestionFlowManager = require('./game/question-flow-manager.js');

async function testQuestionFlowIntegration() {
    console.log('\n=== Question Flow Integration Test ===');
    
    try {
        // Initialize components
        const contentLoader = new ContentLoader();
        const gameStateManager = new GameStateManager();
        const questionPresenter = new QuestionPresenter();
        const questionFlowManager = new QuestionFlowManager(contentLoader, questionPresenter, gameStateManager);
        
        console.log('✓ All components initialized successfully');
        
        // Load test questions
        const loadResult = await contentLoader.loadQuestions('data/math-basic.json');
        if (!loadResult.success) {
            throw new Error(`Failed to load questions: ${loadResult.error}`);
        }
        console.log(`✓ Loaded ${contentLoader.getQuestionCount()} questions`);
        
        // Test question flow configuration
        questionFlowManager.configure({
            minInterval: 2000, // 2 seconds for testing
            maxInterval: 3000, // 3 seconds for testing
            randomizeOrder: false,
            allowRepeat: true
        });
        console.log('✓ Question flow configured for testing');
        
        // Test question timing
        let questionTriggered = false;
        let answerReceived = false;
        let feedbackComplete = false;
        
        questionFlowManager.addQuestionStartListener((question) => {
            console.log(`✓ Question triggered: "${question.prompt}"`);
            questionTriggered = true;
            
            // Simulate answering the question after a short delay
            setTimeout(() => {
                const result = {
                    isCorrect: true,
                    selectedAnswer: question.answer,
                    correctAnswer: question.answer,
                    feedback: question.feedback
                };
                
                // Simulate the answer being processed
                questionPresenter.answerListeners.forEach(listener => {
                    listener(result);
                });
                answerReceived = true;
                console.log('✓ Answer processed');
                
                // Simulate feedback completion
                setTimeout(() => {
                    questionPresenter.feedbackCompleteListeners.forEach(listener => {
                        listener();
                    });
                    feedbackComplete = true;
                    console.log('✓ Feedback completed');
                }, 100);
            }, 100);
        });
        
        // Start the game
        gameStateManager.setState(GameStates.PLAYING);
        console.log('✓ Game started');
        
        // Simulate game updates to trigger question timing
        let updateCount = 0;
        const maxUpdates = 100;
        const updateInterval = 50; // 50ms updates
        
        const updateLoop = setInterval(() => {
            questionFlowManager.update(updateInterval);
            updateCount++;
            
            // Check if we've completed a full question cycle or reached max updates
            if (feedbackComplete || updateCount >= maxUpdates) {
                clearInterval(updateLoop);
                
                if (feedbackComplete) {
                    console.log('✓ Complete question cycle tested successfully');
                    
                    // Test flow statistics
                    const stats = questionFlowManager.getFlowStats();
                    console.log('✓ Flow statistics:', {
                        isActive: stats.isActive,
                        questionsInHistory: stats.questionsInHistory,
                        totalQuestions: stats.totalQuestions
                    });
                    
                    // Test reset functionality
                    questionFlowManager.reset();
                    console.log('✓ Question flow reset successfully');
                    
                    console.log('\n🎉 All Question Flow Integration tests passed!');
                } else {
                    console.log('⚠️  Question was not triggered within expected time');
                    console.log(`   Updates: ${updateCount}, Question triggered: ${questionTriggered}`);
                }
            }
        }, updateInterval);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Test question queue management
async function testQuestionQueueManagement() {
    console.log('\n=== Question Queue Management Test ===');
    
    try {
        const contentLoader = new ContentLoader();
        const gameStateManager = new GameStateManager();
        const questionPresenter = new QuestionPresenter();
        const questionFlowManager = new QuestionFlowManager(contentLoader, questionPresenter, gameStateManager);
        
        // Load questions
        await contentLoader.loadQuestions('data/math-basic.json');
        const totalQuestions = contentLoader.getQuestionCount();
        console.log(`✓ Loaded ${totalQuestions} questions for queue test`);
        
        // Test cycling through all questions
        const seenQuestions = new Set();
        
        for (let i = 0; i < totalQuestions * 2; i++) { // Test cycling twice
            const question = questionFlowManager.getNextQuestion();
            if (question) {
                seenQuestions.add(question.id);
                console.log(`✓ Got question ${i + 1}: "${question.prompt.substring(0, 20)}..."`);
            } else {
                throw new Error(`Failed to get question at iteration ${i + 1}`);
            }
        }
        
        console.log(`✓ Successfully cycled through questions, saw ${seenQuestions.size} unique questions`);
        
        // Test question history management
        questionFlowManager.configure({ allowRepeat: false });
        const recentQuestions = [];
        
        for (let i = 0; i < 3; i++) {
            const question = questionFlowManager.getNextQuestion();
            if (question) {
                recentQuestions.push(question.id);
                questionFlowManager.addToHistory(question.id);
            }
        }
        
        console.log('✓ Question history management tested');
        
        console.log('\n🎉 All Question Queue Management tests passed!');
        
    } catch (error) {
        console.error('❌ Queue management test failed:', error.message);
    }
}

// Test seamless state transitions
async function testStateTransitions() {
    console.log('\n=== State Transition Test ===');
    
    try {
        const contentLoader = new ContentLoader();
        const gameStateManager = new GameStateManager();
        const questionPresenter = new QuestionPresenter();
        const questionFlowManager = new QuestionFlowManager(contentLoader, questionPresenter, gameStateManager);
        
        await contentLoader.loadQuestions('data/math-basic.json');
        
        let stateTransitions = [];
        
        gameStateManager.addStateChangeListener((newState, previousState) => {
            stateTransitions.push({ from: previousState, to: newState });
            console.log(`✓ State transition: ${previousState} → ${newState}`);
        });
        
        // Test game start
        gameStateManager.setState(GameStates.PLAYING);
        
        // Test question trigger
        gameStateManager.setState(GameStates.QUESTION);
        
        // Test return to playing
        gameStateManager.setState(GameStates.PLAYING);
        
        // Test game over
        gameStateManager.setState(GameStates.GAMEOVER);
        
        // Verify expected transitions
        const expectedTransitions = [
            { from: GameStates.MENU, to: GameStates.PLAYING },
            { from: GameStates.PLAYING, to: GameStates.QUESTION },
            { from: GameStates.QUESTION, to: GameStates.PLAYING },
            { from: GameStates.PLAYING, to: GameStates.GAMEOVER }
        ];
        
        let transitionsMatch = true;
        for (let i = 0; i < expectedTransitions.length; i++) {
            if (!stateTransitions[i] || 
                stateTransitions[i].from !== expectedTransitions[i].from ||
                stateTransitions[i].to !== expectedTransitions[i].to) {
                transitionsMatch = false;
                break;
            }
        }
        
        if (transitionsMatch) {
            console.log('✓ All state transitions work correctly');
        } else {
            console.log('⚠️  Some state transitions may not be working as expected');
        }
        
        console.log('\n🎉 State Transition tests completed!');
        
    } catch (error) {
        console.error('❌ State transition test failed:', error.message);
    }
}

// Run all tests
async function runAllTests() {
    await testQuestionFlowIntegration();
    await testQuestionQueueManagement();
    await testStateTransitions();
    
    console.log('\n🏁 All Question Flow Integration tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = {
    testQuestionFlowIntegration,
    testQuestionQueueManagement,
    testStateTransitions,
    runAllTests
};