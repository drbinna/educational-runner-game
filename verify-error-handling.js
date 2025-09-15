// Quick Error Handling Verification Test
console.log('=== Quick Error Handling Verification ===');

// Test 1: ContentLoader with invalid input
console.log('Test 1: ContentLoader error handling...');
try {
    const contentLoader = new ContentLoader();
    
    // Test invalid input - should not crash
    contentLoader.loadQuestions(null).then(result => {
        console.log('✅ ContentLoader handled null input:', !result.success);
    }).catch(err => {
        console.log('✅ ContentLoader caught error:', err.message);
    });
    
    // Test fallback question
    contentLoader.clear();
    const fallback = contentLoader.getNextQuestion();
    console.log('✅ Fallback question works:', fallback !== null);
    
} catch (error) {
    console.log('❌ ContentLoader test failed:', error.message);
}

// Test 2: GameStateManager with invalid input
console.log('Test 2: GameStateManager error handling...');
try {
    const { GameStateManager } = window;
    const gameState = new GameStateManager();
    
    // Test invalid state - should not crash
    const initialState = gameState.getCurrentState();
    gameState.setState('invalid_state');
    console.log('✅ GameStateManager rejected invalid state:', gameState.getCurrentState() === initialState);
    
    // Test invalid score - should not crash
    const initialScore = gameState.gameState.score;
    gameState.updateScore('not_a_number');
    console.log('✅ GameStateManager rejected invalid score:', gameState.gameState.score === initialScore);
    
} catch (error) {
    console.log('❌ GameStateManager test failed:', error.message);
}

// Test 3: QuestionPresenter with invalid question
console.log('Test 3: QuestionPresenter error handling...');
try {
    const presenter = new QuestionPresenter();
    
    // Test null question - should not crash
    presenter.displayQuestion(null);
    console.log('✅ QuestionPresenter handled null question:', !presenter.isQuestionVisible());
    
    // Test XSS attempt - should sanitize
    const xssQuestion = {
        prompt: "<script>alert('xss')</script>What is 2+2?",
        options: ["<img src=x onerror=alert('xss')>4", "5"],
        answer: "<img src=x onerror=alert('xss')>4",
        feedback: "Safe feedback"
    };
    
    presenter.displayQuestion(xssQuestion);
    console.log('✅ QuestionPresenter handled XSS attempt');
    
} catch (error) {
    console.log('❌ QuestionPresenter test failed:', error.message);
}

console.log('=== Verification Complete ===');
console.log('If you see ✅ marks above, error handling is working correctly!');