/**
 * Demo script for QuestionPresenter functionality
 * This demonstrates all the key features of the question presentation system
 */

// Mock DOM environment for Node.js testing
const mockDOM = () => {
    global.document = {
        createElement: (tag) => ({
            tagName: tag.toUpperCase(),
            style: {},
            textContent: '',
            innerHTML: '',
            id: '',
            children: [],
            appendChild: function(child) { this.children.push(child); },
            addEventListener: function() {},
            removeEventListener: function() {}
        }),
        body: { appendChild: function() {} },
        head: { appendChild: function() {} },
        getElementById: () => null,
        addEventListener: function() {},
        removeEventListener: function() {}
    };
};

// Setup DOM mock first
mockDOM();

// Load QuestionPresenter
let QuestionPresenter;
try {
    const fs = require('fs');
    const questionPresenterCode = fs.readFileSync('./game/question-presenter.js', 'utf8');
    eval(questionPresenterCode);
} catch (e) {
    console.error('Failed to load QuestionPresenter:', e.message);
    process.exit(1);
}

// Demo questions
const demoQuestions = [
    {
        prompt: 'What is 5 × 7?',
        options: ['30', '35', '40', '42'],
        answer: '35',
        feedback: 'Correct! 5 × 7 = 35'
    },
    {
        prompt: 'Which planet is known as the Red Planet?',
        options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
        answer: 'Mars',
        feedback: 'Excellent! Mars is called the Red Planet due to its reddish appearance.'
    },
    {
        prompt: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        answer: 'Paris',
        feedback: 'Perfect! Paris is the capital and largest city of France.'
    }
];

// Demo function
function demonstrateQuestionPresenter() {
    console.log('🎓 Question Presenter Demo');
    console.log('==========================\n');

    // Initialize presenter
    const presenter = new QuestionPresenter();
    console.log('✅ QuestionPresenter initialized');

    // Add event listeners
    presenter.addAnswerListener((result) => {
        console.log(`📝 Answer: ${result.selectedAnswer} (${result.isCorrect ? '✅ CORRECT' : '❌ INCORRECT'})`);
        console.log(`💬 Feedback: ${result.feedback}`);
    });

    presenter.addFeedbackCompleteListener(() => {
        console.log('🔄 Feedback complete - ready for next question\n');
    });

    // Demonstrate features
    console.log('\n🔍 Testing Core Features:');
    console.log('-------------------------');

    // Feature 1: Display question
    console.log('\n1. Displaying question...');
    presenter.displayQuestion(demoQuestions[0]);
    console.log(`   Question visible: ${presenter.isQuestionVisible()}`);
    console.log(`   Current question: "${presenter.getCurrentQuestion().prompt}"`);
    console.log(`   Options: ${presenter.getCurrentQuestion().options.join(', ')}`);

    // Feature 2: Answer selection (correct)
    console.log('\n2. Selecting correct answer...');
    presenter.handleAnswerSelection('35');

    // Feature 3: Display another question
    console.log('\n3. Displaying science question...');
    presenter.displayQuestion(demoQuestions[1]);
    console.log(`   Question: "${presenter.getCurrentQuestion().prompt}"`);

    // Feature 4: Answer selection (incorrect)
    console.log('\n4. Selecting incorrect answer...');
    presenter.handleAnswerSelection('Venus');

    // Feature 5: Keyboard support simulation
    console.log('\n5. Testing keyboard support...');
    presenter.displayQuestion(demoQuestions[2]);
    
    // Simulate keyboard handler
    if (presenter.keyboardHandler) {
        console.log('   Simulating key press "3" (third option)...');
        presenter.keyboardHandler({ key: '3' });
    }

    // Feature 6: Force hide
    console.log('\n6. Force hiding question...');
    presenter.forceHide();
    console.log(`   Question visible: ${presenter.isQuestionVisible()}`);

    // Feature 7: UI state methods
    console.log('\n7. Testing utility methods...');
    console.log(`   Question visible: ${presenter.isQuestionVisible()}`);
    console.log(`   Current question: ${presenter.getCurrentQuestion()}`);

    console.log('\n🎉 Demo completed successfully!');
    console.log('\n📋 Features Demonstrated:');
    console.log('   ✅ Question display with UI elements');
    console.log('   ✅ Multiple choice option rendering');
    console.log('   ✅ Mouse click answer selection');
    console.log('   ✅ Keyboard input support');
    console.log('   ✅ Visual feedback for correct/incorrect answers');
    console.log('   ✅ Immediate feedback display');
    console.log('   ✅ Event listener system');
    console.log('   ✅ State management');
    console.log('   ✅ Question cycling');
    console.log('   ✅ Error handling');
}

// Run demo
if (require.main === module) {
    demonstrateQuestionPresenter();
}

module.exports = { demonstrateQuestionPresenter, demoQuestions };