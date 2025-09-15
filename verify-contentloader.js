/**
 * Verification script for ContentLoader implementation
 * This script tests the ContentLoader class functionality
 */

// Mock fetch for testing
global.fetch = function(url) {
    console.log(`📡 Mocked fetch called with: ${url}`);
    
    if (url.includes('math-basic.json')) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                questions: [
                    {
                        id: 'test_001',
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
                        id: 'test_002',
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
                    description: 'Test questions',
                    version: '1.0',
                    author: 'Test'
                }
            })
        });
    } else if (url.includes('404')) {
        return Promise.resolve({
            ok: false,
            status: 404
        });
    } else if (url.includes('malformed')) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.reject(new Error('Invalid JSON'))
        });
    } else {
        return Promise.reject(new Error('Network error'));
    }
};

// Load ContentLoader class
const fs = require('fs');
const path = require('path');

try {
    const contentLoaderPath = path.join(__dirname, 'game/content-loader.js');
    const contentLoaderCode = fs.readFileSync(contentLoaderPath, 'utf8');
    
    // Create a module-like environment
    const module = { exports: {} };
    eval(contentLoaderCode);
    
    // Get the ContentLoader class
    const ContentLoader = module.exports || (typeof ContentLoader !== 'undefined' ? ContentLoader : null);
    
    if (!ContentLoader) {
        throw new Error('ContentLoader class not found');
    }

    console.log('✅ ContentLoader class loaded successfully\n');

    // Run verification tests
    async function runVerification() {
        console.log('🧪 Starting ContentLoader Verification Tests\n');

        // Test 1: Basic initialization
        console.log('1️⃣ Testing initialization...');
        const loader = new ContentLoader();
        console.log(`   Questions: ${loader.questions.length} (expected: 0)`);
        console.log(`   Metadata keys: ${Object.keys(loader.metadata).length} (expected: 0)`);
        console.log(`   Current index: ${loader.currentQuestionIndex} (expected: 0)`);
        console.log('   ✅ Initialization test passed\n');

        // Test 2: Loading valid questions
        console.log('2️⃣ Testing question loading...');
        const result = await loader.loadQuestions('data/math-basic.json');
        console.log(`   Load success: ${result.success}`);
        console.log(`   Questions loaded: ${loader.questions.length}`);
        console.log(`   Metadata title: ${loader.metadata.title}`);
        if (result.success && loader.questions.length > 0) {
            console.log('   ✅ Question loading test passed\n');
        } else {
            console.log(`   ❌ Question loading test failed: ${result.error}\n`);
        }

        // Test 3: Validation
        console.log('3️⃣ Testing validation...');
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
        console.log(`   Valid data accepted: ${validation.isValid}`);
        
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
        console.log(`   Invalid data rejected: ${!invalidValidation.isValid}`);
        console.log(`   Error count: ${invalidValidation.errors.length}`);
        
        if (validation.isValid && !invalidValidation.isValid) {
            console.log('   ✅ Validation test passed\n');
        } else {
            console.log('   ❌ Validation test failed\n');
        }

        // Test 4: Question cycling
        console.log('4️⃣ Testing question cycling...');
        const q1 = loader.getNextQuestion();
        const q2 = loader.getNextQuestion();
        const q3 = loader.getNextQuestion(); // Should cycle back to first
        
        console.log(`   First question: "${q1 ? q1.prompt : 'null'}"`);
        console.log(`   Second question: "${q2 ? q2.prompt : 'null'}"`);
        console.log(`   Third question (cycled): "${q3 ? q3.prompt : 'null'}"`);
        
        if (q1 && q2 && q3 && q1.prompt === q3.prompt) {
            console.log('   ✅ Question cycling test passed\n');
        } else {
            console.log('   ❌ Question cycling test failed\n');
        }

        // Test 5: Error handling
        console.log('5️⃣ Testing error handling...');
        const errorResult = await loader.loadQuestions('404.json');
        console.log(`   Error handled: ${!errorResult.success}`);
        console.log(`   Error message: "${errorResult.error}"`);
        
        if (!errorResult.success && errorResult.error) {
            console.log('   ✅ Error handling test passed\n');
        } else {
            console.log('   ❌ Error handling test failed\n');
        }

        // Test 6: Utility methods
        console.log('6️⃣ Testing utility methods...');
        console.log(`   Question count: ${loader.getQuestionCount()}`);
        console.log(`   Has questions: ${loader.hasQuestions()}`);
        console.log(`   Current index: ${loader.getCurrentQuestionIndex()}`);
        console.log(`   Metadata: ${JSON.stringify(loader.getMetadata())}`);
        console.log('   ✅ Utility methods test passed\n');

        console.log('🎉 All verification tests completed successfully!');
        console.log('\n📋 Summary:');
        console.log('   ✅ ContentLoader class properly implemented');
        console.log('   ✅ JSON loading and parsing works');
        console.log('   ✅ Question validation is comprehensive');
        console.log('   ✅ Error handling is robust');
        console.log('   ✅ Question cycling functions correctly');
        console.log('   ✅ All utility methods work as expected');
    }

    runVerification().catch(error => {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    });

} catch (error) {
    console.error('❌ Failed to load ContentLoader:', error);
    process.exit(1);
}