#!/usr/bin/env node

/**
 * Node.js Error Handling Test Runner
 * Simplified test runner for error handling verification
 */

const path = require('path');

// Import modules
let ContentLoader, GameStateManager, GameStates;

try {
    ContentLoader = require('./game/content-loader.js');
    const gameStateModule = require('./game/game-state.js');
    GameStateManager = gameStateModule.GameStateManager;
    GameStates = gameStateModule.GameStates;
} catch (error) {
    console.error('Failed to import modules:', error.message);
    process.exit(1);
}

/**
 * Test ContentLoader error handling
 */
async function testContentLoaderErrorHandling() {
    console.log('=== Testing ContentLoader Error Handling ===');
    
    const contentLoader = new ContentLoader();
    let testsPassed = 0;
    let totalTests = 0;
    
    // Test 1: Invalid JSON path
    console.log('Test 1: Invalid JSON path');
    totalTests++;
    try {
        const result = await contentLoader.loadQuestions('nonexistent-file.json');
        if (!result.success && (result.error.includes('not found') || result.error.includes('Failed to parse URL'))) {
            console.log('✅ PASS: Correctly handles missing file');
            testsPassed++;
        } else {
            console.log('❌ FAIL: Should fail for nonexistent file. Got:', result);
        }
    } catch (error) {
        console.log('❌ FAIL: Unexpected error:', error.message);
    }
    
    // Test 2: Invalid input validation
    console.log('Test 2: Invalid input validation');
    totalTests++;
    try {
        const result = await contentLoader.loadQuestions(null);
        if (!result.success) {
            console.log('✅ PASS: Correctly rejects null input');
            testsPassed++;
        } else {
            console.log('❌ FAIL: Should fail for null input');
        }
    } catch (error) {
        console.log('❌ FAIL: Unexpected error:', error.message);
    }
    
    // Test 3: Fallback question mechanism
    console.log('Test 3: Fallback question mechanism');
    totalTests++;
    try {
        contentLoader.clear();
        const fallbackQuestion = contentLoader.getNextQuestion();
        if (fallbackQuestion && fallbackQuestion.prompt.includes('2 + 2')) {
            console.log('✅ PASS: Returns fallback question correctly');
            testsPassed++;
        } else {
            console.log('❌ FAIL: Fallback question not working');
        }
    } catch (error) {
        console.log('❌ FAIL: Error testing fallback:', error.message);
    }
    
    console.log(`ContentLoader Tests: ${testsPassed}/${totalTests} passed\n`);
    return { passed: testsPassed, total: totalTests };
}

/**
 * Test GameStateManager error handling
 */
function testGameStateManagerErrorHandling() {
    console.log('=== Testing GameStateManager Error Handling ===');
    
    const gameStateManager = new GameStateManager();
    let testsPassed = 0;
    let totalTests = 0;
    
    // Test 1: Invalid state transitions
    console.log('Test 1: Invalid state transitions');
    totalTests++;
    try {
        const initialState = gameStateManager.getCurrentState();
        gameStateManager.setState('invalid_state');
        if (gameStateManager.getCurrentState() === initialState) {
            console.log('✅ PASS: Correctly rejects invalid state');
            testsPassed++;
        } else {
            console.log('❌ FAIL: Should not accept invalid state');
        }
    } catch (error) {
        console.log('❌ FAIL: Error in state transition test:', error.message);
    }
    
    // Test 2: Invalid score updates
    console.log('Test 2: Invalid score updates');
    totalTests++;
    try {
        const initialScore = gameStateManager.gameState.score;
        gameStateManager.updateScore('not a number');
        if (gameStateManager.gameState.score === initialScore) {
            console.log('✅ PASS: Correctly rejects invalid score');
            testsPassed++;
        } else {
            console.log('❌ FAIL: Score should not change with invalid input');
        }
    } catch (error) {
        console.log('❌ FAIL: Error in score update test:', error.message);
    }
    
    // Test 3: Invalid time updates
    console.log('Test 3: Invalid time updates');
    totalTests++;
    try {
        const initialTime = gameStateManager.gameState.gameTime;
        gameStateManager.updateGameTime(-100);
        if (gameStateManager.gameState.gameTime === initialTime) {
            console.log('✅ PASS: Correctly rejects negative time');
            testsPassed++;
        } else {
            console.log('❌ FAIL: Time should not change with negative input');
        }
    } catch (error) {
        console.log('❌ FAIL: Error in time update test:', error.message);
    }
    
    // Test 4: Invalid answer recording
    console.log('Test 4: Invalid answer recording');
    totalTests++;
    try {
        const initialAnswered = gameStateManager.gameState.questionsAnswered;
        gameStateManager.recordAnswer('not a boolean');
        if (gameStateManager.gameState.questionsAnswered === initialAnswered) {
            console.log('✅ PASS: Correctly rejects invalid answer type');
            testsPassed++;
        } else {
            console.log('❌ FAIL: Questions answered should not change with invalid input');
        }
    } catch (error) {
        console.log('❌ FAIL: Error in answer recording test:', error.message);
    }
    
    console.log(`GameStateManager Tests: ${testsPassed}/${totalTests} passed\n`);
    return { passed: testsPassed, total: totalTests };
}

/**
 * Run all error handling tests
 */
async function runAllErrorHandlingTests() {
    console.log('🧪 Starting Comprehensive Error Handling Tests\n');
    
    const startTime = Date.now();
    let totalPassed = 0;
    let totalTests = 0;
    
    try {
        // Test ContentLoader
        const contentLoaderResults = await testContentLoaderErrorHandling();
        totalPassed += contentLoaderResults.passed;
        totalTests += contentLoaderResults.total;
        
        // Test GameStateManager
        const gameStateResults = testGameStateManagerErrorHandling();
        totalPassed += gameStateResults.passed;
        totalTests += gameStateResults.total;
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('=== TEST SUMMARY ===');
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${totalPassed}`);
        console.log(`Failed: ${totalTests - totalPassed}`);
        console.log(`Success Rate: ${Math.round((totalPassed / totalTests) * 100)}%`);
        console.log(`Duration: ${duration}ms`);
        
        if (totalPassed === totalTests) {
            console.log('\n🎉 All error handling tests PASSED!');
            console.log('✅ Your error handling system is working correctly.');
            process.exit(0);
        } else {
            console.log('\n⚠️  Some tests FAILED. Review the error handling implementation.');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Critical error during testing:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the tests
if (require.main === module) {
    runAllErrorHandlingTests();
}

module.exports = {
    testContentLoaderErrorHandling,
    testGameStateManagerErrorHandling,
    runAllErrorHandlingTests
};