// Test that writes output to a file
const fs = require('fs');

let output = '';
function log(message) {
    output += message + '\n';
    console.log(message);
}

log('Testing ContentLoader functionality...');

try {
    // Load ContentLoader
    const contentLoaderCode = fs.readFileSync('game/content-loader.js', 'utf8');
    const module = { exports: {} };
    eval(contentLoaderCode);
    const ContentLoader = module.exports;
    
    log('✅ ContentLoader loaded');
    
    // Test instantiation
    const loader = new ContentLoader();
    log('✅ ContentLoader instantiated');
    
    // Test basic properties
    log(`Questions length: ${loader.questions.length}`);
    log(`Metadata keys: ${Object.keys(loader.metadata).length}`);
    log(`Current index: ${loader.currentQuestionIndex}`);
    
    // Test validation
    const validData = {
        questions: [
            {
                prompt: 'Test?',
                options: ['A', 'B'],
                answer: 'A',
                feedback: 'Good!'
            }
        ]
    };
    
    const result = loader.validateQuestionFormat(validData);
    log(`Validation result: ${result.isValid}`);
    log(`Validation errors: ${result.errors.length}`);
    
    // Test utility methods
    log(`Question count: ${loader.getQuestionCount()}`);
    log(`Has questions: ${loader.hasQuestions()}`);
    log(`Get next question: ${loader.getNextQuestion()}`);
    
    log('✅ All basic tests passed');
    
} catch (error) {
    log(`❌ Error: ${error.message}`);
}

// Write output to file
fs.writeFileSync('test-results.txt', output);
log('Results written to test-results.txt');