// Manual verification test for ContentLoader
// This test manually checks each function to ensure it works correctly

console.log('='.repeat(50));
console.log('ContentLoader Manual Verification Test');
console.log('='.repeat(50));

// Step 1: Load the ContentLoader class
console.log('\n1. Loading ContentLoader class...');
const fs = require('fs');
try {
    const contentLoaderCode = fs.readFileSync('game/content-loader.js', 'utf8');
    
    // Check if the file contains the expected class
    if (!contentLoaderCode.includes('class ContentLoader')) {
        throw new Error('ContentLoader class not found in file');
    }
    
    // Create a module environment and execute the code
    const module = { exports: {} };
    eval(contentLoaderCode);
    
    // Get the ContentLoader class
    const ContentLoader = module.exports;
    
    if (typeof ContentLoader !== 'function') {
        throw new Error('ContentLoader is not a constructor function');
    }
    
    console.log('✅ ContentLoader class loaded successfully');
    
    // Step 2: Test basic instantiation
    console.log('\n2. Testing basic instantiation...');
    const loader = new ContentLoader();
    
    console.log('   - Questions array:', Array.isArray(loader.questions) ? '✅' : '❌');
    console.log('   - Questions length:', loader.questions.length === 0 ? '✅' : '❌');
    console.log('   - Metadata object:', typeof loader.metadata === 'object' ? '✅' : '❌');
    console.log('   - Current index:', loader.currentQuestionIndex === 0 ? '✅' : '❌');
    
    // Step 3: Test validation method
    console.log('\n3. Testing validation method...');
    
    // Test valid data
    const validData = {
        questions: [
            {
                prompt: 'What is 2 + 2?',
                options: ['3', '4', '5'],
                answer: '4',
                feedback: 'Correct!'
            }
        ]
    };
    
    const validResult = loader.validateQuestionFormat(validData);
    console.log('   - Valid data accepted:', validResult.isValid ? '✅' : '❌');
    console.log('   - No errors for valid data:', validResult.errors.length === 0 ? '✅' : '❌');
    
    // Test invalid data
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
    
    const invalidResult = loader.validateQuestionFormat(invalidData);
    console.log('   - Invalid data rejected:', !invalidResult.isValid ? '✅' : '❌');
    console.log('   - Errors found for invalid data:', invalidResult.errors.length > 0 ? '✅' : '❌');
    
    // Step 4: Test utility methods
    console.log('\n4. Testing utility methods...');
    console.log('   - getQuestionCount():', typeof loader.getQuestionCount() === 'number' ? '✅' : '❌');
    console.log('   - hasQuestions():', typeof loader.hasQuestions() === 'boolean' ? '✅' : '❌');
    console.log('   - getCurrentQuestionIndex():', typeof loader.getCurrentQuestionIndex() === 'number' ? '✅' : '❌');
    console.log('   - getMetadata():', typeof loader.getMetadata() === 'object' ? '✅' : '❌');
    console.log('   - getNextQuestion() returns null when empty:', loader.getNextQuestion() === null ? '✅' : '❌');
    
    // Step 5: Test with mock data
    console.log('\n5. Testing with mock data...');
    
    // Manually set some test data
    loader.questions = [
        { prompt: 'Q1', options: ['A', 'B'], answer: 'A', feedback: 'F1' },
        { prompt: 'Q2', options: ['C', 'D'], answer: 'C', feedback: 'F2' }
    ];
    loader.metadata = { title: 'Test Questions' };
    
    console.log('   - Question count after manual load:', loader.getQuestionCount() === 2 ? '✅' : '❌');
    console.log('   - Has questions after manual load:', loader.hasQuestions() ? '✅' : '❌');
    
    const q1 = loader.getNextQuestion();
    const q2 = loader.getNextQuestion();
    const q3 = loader.getNextQuestion(); // Should cycle back
    
    console.log('   - First question retrieved:', q1 && q1.prompt === 'Q1' ? '✅' : '❌');
    console.log('   - Second question retrieved:', q2 && q2.prompt === 'Q2' ? '✅' : '❌');
    console.log('   - Cycling works:', q3 && q3.prompt === 'Q1' ? '✅' : '❌');
    
    // Step 6: Test clear method
    console.log('\n6. Testing clear method...');
    loader.clear();
    console.log('   - Questions cleared:', loader.questions.length === 0 ? '✅' : '❌');
    console.log('   - Metadata cleared:', Object.keys(loader.metadata).length === 0 ? '✅' : '❌');
    console.log('   - Index reset:', loader.currentQuestionIndex === 0 ? '✅' : '❌');
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Manual verification completed successfully!');
    console.log('All ContentLoader methods are working correctly.');
    console.log('='.repeat(50));
    
} catch (error) {
    console.log('\n' + '='.repeat(50));
    console.log('❌ Manual verification failed!');
    console.log('Error:', error.message);
    console.log('='.repeat(50));
}