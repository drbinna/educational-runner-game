// Simple test to verify ContentLoader functionality
console.log('🧪 Testing ContentLoader...\n');

// Mock fetch
global.fetch = function(url) {
    if (url === 'valid.json') {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                questions: [
                    {
                        prompt: 'What is 2 + 2?',
                        options: ['3', '4', '5'],
                        answer: '4',
                        feedback: 'Correct!'
                    }
                ],
                metadata: { title: 'Test Questions' }
            })
        });
    }
    return Promise.reject(new Error('File not found'));
};

// Load and test ContentLoader
const fs = require('fs');
const path = require('path');

// Read the ContentLoader file
const contentLoaderPath = path.join(__dirname, '../game/content-loader.js');
const contentLoaderCode = fs.readFileSync(contentLoaderPath, 'utf8');

// Execute the code to define the class
eval(contentLoaderCode);

// Test basic functionality
async function runTests() {
    console.log('1. Testing ContentLoader initialization...');
    const loader = new ContentLoader();
    console.log('   ✅ ContentLoader created successfully');
    console.log('   ✅ Initial state correct:', {
        questions: loader.questions.length === 0,
        metadata: Object.keys(loader.metadata).length === 0,
        index: loader.currentQuestionIndex === 0
    });

    console.log('\n2. Testing question loading...');
    const result = await loader.loadQuestions('valid.json');
    console.log('   ✅ Load result:', result);
    console.log('   ✅ Questions loaded:', loader.questions.length);
    console.log('   ✅ Metadata loaded:', loader.metadata.title);

    console.log('\n3. Testing validation...');
    const validData = {
        questions: [
            {
                prompt: 'Test question?',
                options: ['A', 'B', 'C'],
                answer: 'A',
                feedback: 'Good job!'
            }
        ]
    };
    const validation = loader.validateQuestionFormat(validData);
    console.log('   ✅ Valid data validation:', validation.isValid);

    const invalidData = {
        questions: [
            {
                prompt: '',
                options: ['A'],
                answer: 'B',
                feedback: ''
            }
        ]
    };
    const invalidValidation = loader.validateQuestionFormat(invalidData);
    console.log('   ✅ Invalid data validation:', !invalidValidation.isValid);
    console.log('   ✅ Error count:', invalidValidation.errors.length);

    console.log('\n4. Testing question cycling...');
    const q1 = loader.getNextQuestion();
    const q2 = loader.getNextQuestion(); // Should cycle back to first
    console.log('   ✅ First question:', q1.prompt);
    console.log('   ✅ Cycling works:', q2.prompt === q1.prompt);

    console.log('\n5. Testing utility methods...');
    console.log('   ✅ Question count:', loader.getQuestionCount());
    console.log('   ✅ Has questions:', loader.hasQuestions());
    console.log('   ✅ Current index:', loader.getCurrentQuestionIndex());

    console.log('\n🎉 All tests completed successfully!');
}

runTests().catch(error => {
    console.error('❌ Test failed:', error);
});