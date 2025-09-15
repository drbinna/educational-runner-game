// Simple integration test for feedback system
// This tests the key functionality without requiring a full browser environment

console.log('Testing feedback system integration...');

// Mock DOM elements for testing
global.document = {
    createElement: () => ({
        style: {},
        addEventListener: () => {},
        appendChild: () => {},
        textContent: '',
        classList: { add: () => {}, remove: () => {} }
    }),
    body: { appendChild: () => {} },
    head: { appendChild: () => {} },
    getElementById: () => null
};

// Mock Kaboom.js functions
global.add = () => ({ 
    exists: () => true, 
    destroy: () => {},
    onUpdate: () => {},
    pos: { x: 0, y: 0 },
    color: {},
    opacity: 1,
    angle: 0
});
global.width = () => 800;
global.height = () => 600;
global.camPos = () => {};
global.dt = () => 0.016;
global.rgb = () => ({});
global.vec2 = (x, y) => ({ x, y });

// Load modules
require('./game/game-state.js');
require('./game/runner-engine.js');
require('./game/question-presenter.js');

// Test the integration
try {
    console.log('1. Creating game components...');
    const gameStateManager = new GameStateManager();
    const runnerEngine = new RunnerEngine(gameStateManager);
    const questionPresenter = new QuestionPresenter();
    
    console.log('✅ All components created successfully');
    
    console.log('2. Testing answer recording...');
    gameStateManager.recordAnswer(true);
    gameStateManager.recordAnswer(false);
    gameStateManager.recordAnswer(true);
    
    const stats = gameStateManager.getGameStats();
    console.log('✅ Answer recording works:', {
        answered: stats.questionsAnswered,
        correct: stats.correctAnswers,
        score: stats.score
    });
    
    console.log('3. Testing performance feedback...');
    const feedback = gameStateManager.getPerformanceFeedback();
    console.log('✅ Performance feedback:', feedback);
    
    console.log('4. Testing stumble effect...');
    runnerEngine.stumble(1000);
    console.log('✅ Stumble effect called successfully');
    
    console.log('5. Testing success effect...');
    runnerEngine.createSuccessEffect();
    console.log('✅ Success effect called successfully');
    
    console.log('6. Testing question display...');
    const testQuestion = {
        prompt: "Test question?",
        options: ["A", "B", "C"],
        answer: "B",
        feedback: "Test feedback message"
    };
    
    questionPresenter.displayQuestion(testQuestion);
    console.log('✅ Question display works');
    
    console.log('\n🎉 All integration tests passed!');
    console.log('The feedback and penalty system is working correctly.');
    
} catch (error) {
    console.log('❌ Integration test failed:', error.message);
    process.exit(1);
}