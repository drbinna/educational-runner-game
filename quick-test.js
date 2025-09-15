// Quick test of ContentLoader functionality
console.log('Testing ContentLoader...');

// Mock fetch
global.fetch = (url) => {
    console.log('Fetch called with:', url);
    return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
            questions: [
                {
                    prompt: 'Test question?',
                    options: ['A', 'B', 'C'],
                    answer: 'A',
                    feedback: 'Correct!'
                }
            ],
            metadata: { title: 'Test' }
        })
    });
};

// Load ContentLoader
const fs = require('fs');
const code = fs.readFileSync('game/content-loader.js', 'utf8');
const module = { exports: {} };
eval(code);
const ContentLoader = module.exports;

// Test
async function test() {
    console.log('Creating ContentLoader...');
    const loader = new ContentLoader();
    
    console.log('Initial state:', {
        questions: loader.questions.length,
        metadata: Object.keys(loader.metadata).length,
        index: loader.currentQuestionIndex
    });
    
    console.log('Loading questions...');
    const result = await loader.loadQuestions('test.json');
    
    console.log('Load result:', result);
    console.log('Final state:', {
        questions: loader.questions.length,
        metadata: loader.metadata.title,
        index: loader.currentQuestionIndex
    });
    
    console.log('Getting next question...');
    const question = loader.getNextQuestion();
    console.log('Question:', question ? question.prompt : 'null');
    
    console.log('Test complete!');
}

test().catch(console.error);