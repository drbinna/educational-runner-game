/**
 * Comprehensive ContentLoader Functionality Test
 * Tests the ContentLoader after IDE formatting to ensure everything works correctly
 */

console.log('🧪 ContentLoader Functionality Test\n');

// Mock fetch for testing
global.fetch = function(url) {
    console.log(`📡 Fetch called: ${url}`);
    
    if (url === 'data/math-basic.json' || url.includes('valid')) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                questions: [
                    {
                        id: 'math_001',
                        type: 'multiple_choice',
                        prompt: 'What is 2 + 2?',
                        options: ['3', '4', '5'],
                        answer: '4',
                        feedback: 'Correct! 2 + 2 equals 4.',
                        difficulty: 1,
                        subject: 'math',
                        topic: 'addition'
                    },
                    {
                        id: 'math_002',
                        type: 'multiple_choice',
                        prompt: 'What is 5 × 3?',
                        options: ['15', '10', '20'],
                        answer: '15',
                        feedback: 'Great! 5 × 3 = 15.',
                        difficulty: 1,
                        subject: 'math',
                        topic: 'multiplication'
                    }
                ],
                metadata: {
                    title: 'Basic Math Practice',
                    description: 'Fundamental arithmetic operations',
                    version: '1.0',
                    author: 'Educational Team'
                }
            })
        });
    } else if (url.includes('404') || url.includes('nonexistent')) {
        return Promise.resolve({
            ok: false,
            status: 404
        });
    } else if (url.includes('500')) {
        return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error'
        });
    } else if (url.includes('malformed')) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.reject(new Error('Unexpected token in JSON'))
        });
    } else {
        return Promise.reject(new Error('Network connection failed'));
    }
};

// Load ContentLoader
const fs = require('fs');
const path = require('path');

try {
    const contentLoaderPath = path.join(__dirname, 'game/content-loader.js');
    const contentLoaderCode = fs.readFileSync(contentLoaderPath, 'utf8');
    
    // Create module environment
    const module = { exports: {} };
    eval(contentLoaderCode);
    
    const ContentLoader = module.exports;
    
    if (!ContentLoader) {
        throw new Error('ContentLoader not exported properly');
    }

    console.log('✅ ContentLoader loaded successfully\n');

    // Test runner
    let testCount = 0;
    let passCount = 0;
    let failCount = 0;

    function runTest(name, testFn) {
        testCount++;
        console.log(`${testCount}. ${name}`);
        
        try {
            const result = testFn();
            if (result instanceof Promise) {
                return result.then(() => {
                    console.log('   ✅ PASSED\n');
                    passCount++;
                }).catch(error => {
                    console.log(`   ❌ FAILED: ${error.message}\n`);
                    failCount++;
                });
            } else {
                console.log('   ✅ PASSED\n');
                passCount++;
            }
        } catch (error) {
            console.log(`   ❌ FAILED: ${error.message}\n`);
            failCount++;
        }
    }

    function assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    // Run all tests
    async function runAllTests() {
        console.log('🚀 Starting ContentLoader Tests...\n');

        // Test 1: Basic initialization
        await runTest('Basic Initialization', () => {
            const loader = new ContentLoader();
            assert(Array.isArray(loader.questions), 'questions should be an array');
            assert(loader.questions.length === 0, 'questions should be empty initially');
            assert(typeof loader.metadata === 'object', 'metadata should be an object');
            assert(Object.keys(loader.metadata).length === 0, 'metadata should be empty initially');
            assert(loader.currentQuestionIndex === 0, 'currentQuestionIndex should be 0');
            console.log('   - Questions array initialized: ✓');
            console.log('   - Metadata object initialized: ✓');
            console.log('   - Current index set to 0: ✓');
        });

        // Test 2: Load valid questions
        await runTest('Load Valid Questions', async () => {
            const loader = new ContentLoader();
            const result = await loader.loadQuestions('data/math-basic.json');
            
            assert(result.success === true, 'Load should succeed');
            assert(!result.error, 'Should not have error on success');
            assert(loader.questions.length === 2, 'Should load 2 questions');
            assert(loader.metadata.title === 'Basic Math Practice', 'Should load metadata');
            assert(loader.currentQuestionIndex === 0, 'Index should reset to 0');
            
            console.log(`   - Loaded ${loader.questions.length} questions: ✓`);
            console.log(`   - Metadata loaded: ${loader.metadata.title}: ✓`);
            console.log('   - Success result returned: ✓');
        });

        // Test 3: Question validation - valid data
        await runTest('Question Validation - Valid Data', () => {
            const loader = new ContentLoader();
            const validData = {
                questions: [
                    {
                        prompt: 'What is the capital of France?',
                        options: ['London', 'Paris', 'Berlin', 'Madrid'],
                        answer: 'Paris',
                        feedback: 'Correct! Paris is the capital of France.',
                        difficulty: 2,
                        type: 'multiple_choice'
                    }
                ]
            };
            
            const result = loader.validateQuestionFormat(validData);
            assert(result.isValid === true, 'Valid data should pass validation');
            assert(result.errors.length === 0, 'Should have no errors');
            
            console.log('   - Valid question format accepted: ✓');
            console.log('   - No validation errors: ✓');
        });

        // Test 4: Question validation - invalid data
        await runTest('Question Validation - Invalid Data', () => {
            const loader = new ContentLoader();
            const invalidData = {
                questions: [
                    {
                        prompt: '',  // Empty prompt
                        options: ['A'],  // Too few options
                        answer: 'B',  // Answer not in options
                        feedback: '',  // Empty feedback
                        difficulty: 10  // Invalid difficulty
                    }
                ]
            };
            
            const result = loader.validateQuestionFormat(invalidData);
            assert(result.isValid === false, 'Invalid data should fail validation');
            assert(result.errors.length > 0, 'Should have validation errors');
            
            console.log(`   - Invalid data rejected: ✓`);
            console.log(`   - Found ${result.errors.length} validation errors: ✓`);
            console.log(`   - Sample error: "${result.errors[0]}"`);
        });

        // Test 5: Error handling - 404
        await runTest('Error Handling - 404 Not Found', async () => {
            const loader = new ContentLoader();
            const result = await loader.loadQuestions('nonexistent.json');
            
            assert(result.success === false, 'Should fail for 404');
            assert(result.error.includes('Question file not found'), 'Should have 404 error message');
            assert(loader.questions.length === 0, 'Questions should be empty after error');
            
            console.log('   - 404 error handled correctly: ✓');
            console.log('   - State reset on error: ✓');
        });

        // Test 6: Error handling - Malformed JSON
        await runTest('Error Handling - Malformed JSON', async () => {
            const loader = new ContentLoader();
            const result = await loader.loadQuestions('malformed.json');
            
            assert(result.success === false, 'Should fail for malformed JSON');
            assert(result.error.includes('Invalid JSON format'), 'Should have JSON error message');
            
            console.log('   - Malformed JSON handled: ✓');
            console.log('   - Appropriate error message: ✓');
        });

        // Test 7: Question cycling
        await runTest('Question Cycling', async () => {
            const loader = new ContentLoader();
            await loader.loadQuestions('valid.json');
            
            const q1 = loader.getNextQuestion();
            const q2 = loader.getNextQuestion();
            const q3 = loader.getNextQuestion(); // Should cycle back to first
            
            assert(q1 !== null, 'First question should not be null');
            assert(q2 !== null, 'Second question should not be null');
            assert(q3 !== null, 'Third question should not be null');
            assert(q1.prompt === q3.prompt, 'Should cycle back to first question');
            assert(q1.prompt !== q2.prompt, 'Questions should be different');
            
            console.log(`   - Q1: "${q1.prompt}": ✓`);
            console.log(`   - Q2: "${q2.prompt}": ✓`);
            console.log('   - Cycling works correctly: ✓');
        });

        // Test 8: Utility methods
        await runTest('Utility Methods', async () => {
            const loader = new ContentLoader();
            
            // Test empty state
            assert(loader.getQuestionCount() === 0, 'Empty count should be 0');
            assert(loader.hasQuestions() === false, 'Should not have questions initially');
            assert(loader.getQuestionByIndex(0) === null, 'Should return null for invalid index');
            assert(loader.getCurrentQuestionIndex() === 0, 'Current index should be 0');
            
            // Load questions and test again
            await loader.loadQuestions('valid.json');
            
            assert(loader.getQuestionCount() === 2, 'Should have 2 questions');
            assert(loader.hasQuestions() === true, 'Should have questions after loading');
            assert(loader.getQuestionByIndex(0) !== null, 'Should return question for valid index');
            assert(loader.getQuestionByIndex(10) === null, 'Should return null for out-of-bounds index');
            
            const metadata = loader.getMetadata();
            assert(typeof metadata === 'object', 'Metadata should be object');
            assert(metadata.title === 'Basic Math Practice', 'Should return correct metadata');
            
            // Test clear
            loader.clear();
            assert(loader.getQuestionCount() === 0, 'Should be empty after clear');
            assert(loader.hasQuestions() === false, 'Should not have questions after clear');
            
            console.log('   - Question count methods: ✓');
            console.log('   - Index methods: ✓');
            console.log('   - Metadata methods: ✓');
            console.log('   - Clear method: ✓');
        });

        // Test 9: Input validation
        await runTest('Input Validation', async () => {
            const loader = new ContentLoader();
            
            // Test invalid inputs
            const result1 = await loader.loadQuestions('');
            assert(result1.success === false, 'Empty string should fail');
            
            const result2 = await loader.loadQuestions(null);
            assert(result2.success === false, 'Null should fail');
            
            const result3 = await loader.loadQuestions(undefined);
            assert(result3.success === false, 'Undefined should fail');
            
            console.log('   - Empty string rejected: ✓');
            console.log('   - Null input rejected: ✓');
            console.log('   - Undefined input rejected: ✓');
        });

        // Test 10: State management
        await runTest('State Management', async () => {
            const loader = new ContentLoader();
            
            // Load valid data first
            await loader.loadQuestions('valid.json');
            assert(loader.questions.length > 0, 'Should have questions');
            
            // Try to load invalid data - should reset state
            await loader.loadQuestions('404.json');
            assert(loader.questions.length === 0, 'Should reset questions on error');
            assert(Object.keys(loader.metadata).length === 0, 'Should reset metadata on error');
            assert(loader.currentQuestionIndex === 0, 'Should reset index on error');
            
            console.log('   - State preserved on success: ✓');
            console.log('   - State reset on error: ✓');
        });

        // Summary
        console.log('📊 Test Results Summary:');
        console.log(`   Total Tests: ${testCount}`);
        console.log(`   Passed: ${passCount}`);
        console.log(`   Failed: ${failCount}`);
        
        if (failCount === 0) {
            console.log('\n🎉 All tests passed! ContentLoader is working correctly.');
        } else {
            console.log(`\n💥 ${failCount} test(s) failed. Please check the implementation.`);
        }
        
        console.log('\n✅ ContentLoader functionality verification complete!');
    }

    // Run all tests
    runAllTests().catch(error => {
        console.error('❌ Test suite failed:', error);
    });

} catch (error) {
    console.error('❌ Failed to load ContentLoader:', error.message);
}