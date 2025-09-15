/**
 * Test suite for QuestionPresenter class
 */

// Simple test framework
class SimpleTest {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    describe(name, fn) {
        console.log(`\n📋 ${name}`);
        fn();
    }

    test(name, fn) {
        try {
            fn();
            console.log(`  ✅ ${name}`);
            this.passed++;
        } catch (error) {
            console.log(`  ❌ ${name}`);
            console.log(`     Error: ${error.message}`);
            this.failed++;
        }
    }

    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected}, got ${actual}`);
                }
            },
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
                }
            },
            toBeNull: () => {
                if (actual !== null) {
                    throw new Error(`Expected null, got ${actual}`);
                }
            },
            toBeUndefined: () => {
                if (actual !== undefined) {
                    throw new Error(`Expected undefined, got ${actual}`);
                }
            },
            toHaveLength: (expected) => {
                if (!actual || actual.length !== expected) {
                    throw new Error(`Expected length ${expected}, got ${actual ? actual.length : 'undefined'}`);
                }
            },
            toContain: (expected) => {
                if (!actual || !actual.includes(expected)) {
                    throw new Error(`Expected "${actual}" to contain "${expected}"`);
                }
            },
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`Expected truthy value, got ${actual}`);
                }
            },
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`Expected falsy value, got ${actual}`);
                }
            }
        };
    }

    summary() {
        console.log(`\n📊 Test Summary:`);
        console.log(`   Passed: ${this.passed}`);
        console.log(`   Failed: ${this.failed}`);
        console.log(`   Total: ${this.passed + this.failed}`);
        
        if (this.failed === 0) {
            console.log(`\n🎉 All tests passed!`);
        } else {
            console.log(`\n💥 ${this.failed} test(s) failed`);
        }
    }
}

// Mock DOM environment
global.document = {
    createElement: (tag) => {
        const element = {
            tagName: tag.toUpperCase(),
            style: {},
            textContent: '',
            innerHTML: '',
            id: '',
            children: [],
            appendChild: function(child) {
                this.children.push(child);
                child.parentNode = this;
            },
            addEventListener: function(event, handler) {
                this.eventListeners = this.eventListeners || {};
                this.eventListeners[event] = this.eventListeners[event] || [];
                this.eventListeners[event].push(handler);
            },
            removeEventListener: function(event, handler) {
                if (this.eventListeners && this.eventListeners[event]) {
                    const index = this.eventListeners[event].indexOf(handler);
                    if (index > -1) {
                        this.eventListeners[event].splice(index, 1);
                    }
                }
            },
            dispatchEvent: function(event) {
                if (this.eventListeners && this.eventListeners[event.type]) {
                    this.eventListeners[event.type].forEach(handler => handler(event));
                }
            }
        };
        
        // Add specific properties for different element types
        if (tag === 'button') {
            element.click = function() {
                this.dispatchEvent({ type: 'click' });
            };
        }
        
        return element;
    },
    body: {
        appendChild: function(child) {
            this.children = this.children || [];
            this.children.push(child);
        }
    },
    addEventListener: function(event, handler) {
        this.eventListeners = this.eventListeners || {};
        this.eventListeners[event] = this.eventListeners[event] || [];
        this.eventListeners[event].push(handler);
    },
    removeEventListener: function(event, handler) {
        if (this.eventListeners && this.eventListeners[event]) {
            const index = this.eventListeners[event].indexOf(handler);
            if (index > -1) {
                this.eventListeners[event].splice(index, 1);
            }
        }
    }
};

// Load QuestionPresenter
let QuestionPresenter;
try {
    QuestionPresenter = require('../game/question-presenter.js');
} catch (e) {
    const fs = require('fs');
    const path = require('path');
    const questionPresenterCode = fs.readFileSync(path.join(__dirname, '../game/question-presenter.js'), 'utf8');
    eval(questionPresenterCode);
}

// Create test instance
const test = new SimpleTest();

// Sample question for testing
const sampleQuestion = {
    prompt: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    answer: '4',
    feedback: 'Correct! 2 + 2 equals 4.'
};

// Run tests
test.describe('QuestionPresenter Tests', () => {
    
    test.test('should initialize with correct default state', () => {
        const presenter = new QuestionPresenter();
        
        test.expect(presenter.currentQuestion).toBeNull();
        test.expect(presenter.answerOptions).toEqual([]);
        test.expect(presenter.isWaitingForAnswer).toBe(false);
        test.expect(presenter.ui.isVisible).toBe(false);
        test.expect(presenter.answerListeners).toHaveLength(0);
        test.expect(presenter.feedbackCompleteListeners).toHaveLength(0);
    });

    test.test('should create UI elements during initialization', () => {
        const presenter = new QuestionPresenter();
        
        test.expect(presenter.ui.container).toBeTruthy();
        test.expect(presenter.ui.prompt).toBeTruthy();
        test.expect(presenter.ui.feedback).toBeTruthy();
        test.expect(presenter.optionsContainer).toBeTruthy();
    });

    test.test('should display question correctly', () => {
        const presenter = new QuestionPresenter();
        
        presenter.displayQuestion(sampleQuestion);
        
        test.expect(presenter.currentQuestion).toEqual(sampleQuestion);
        test.expect(presenter.answerOptions).toEqual(sampleQuestion.options);
        test.expect(presenter.isWaitingForAnswer).toBe(true);
        test.expect(presenter.ui.isVisible).toBe(true);
        test.expect(presenter.ui.prompt.textContent).toBe(sampleQuestion.prompt);
        test.expect(presenter.ui.options).toHaveLength(4);
    });

    test.test('should handle null question gracefully', () => {
        const presenter = new QuestionPresenter();
        
        // Should not throw error
        presenter.displayQuestion(null);
        
        test.expect(presenter.currentQuestion).toBeNull();
        test.expect(presenter.isWaitingForAnswer).toBe(false);
    });

    test.test('should create option buttons with correct text', () => {
        const presenter = new QuestionPresenter();
        
        presenter.displayQuestion(sampleQuestion);
        
        presenter.ui.options.forEach((button, index) => {
            test.expect(button.textContent).toBe(sampleQuestion.options[index]);
        });
    });

    test.test('should handle correct answer selection', () => {
        const presenter = new QuestionPresenter();
        let answerResult = null;
        
        presenter.addAnswerListener((result) => {
            answerResult = result;
        });
        
        presenter.displayQuestion(sampleQuestion);
        presenter.handleAnswerSelection('4'); // Correct answer
        
        test.expect(answerResult).toBeTruthy();
        test.expect(answerResult.isCorrect).toBe(true);
        test.expect(answerResult.selectedAnswer).toBe('4');
        test.expect(answerResult.correctAnswer).toBe('4');
        test.expect(answerResult.feedback).toBe(sampleQuestion.feedback);
        test.expect(presenter.isWaitingForAnswer).toBe(false);
    });

    test.test('should handle incorrect answer selection', () => {
        const presenter = new QuestionPresenter();
        let answerResult = null;
        
        presenter.addAnswerListener((result) => {
            answerResult = result;
        });
        
        presenter.displayQuestion(sampleQuestion);
        presenter.handleAnswerSelection('3'); // Incorrect answer
        
        test.expect(answerResult).toBeTruthy();
        test.expect(answerResult.isCorrect).toBe(false);
        test.expect(answerResult.selectedAnswer).toBe('3');
        test.expect(answerResult.correctAnswer).toBe('4');
        test.expect(answerResult.feedback).toBe(sampleQuestion.feedback);
        test.expect(presenter.isWaitingForAnswer).toBe(false);
    });

    test.test('should ignore answer selection when not waiting', () => {
        const presenter = new QuestionPresenter();
        let answerResult = null;
        
        presenter.addAnswerListener((result) => {
            answerResult = result;
        });
        
        // Don't display question first
        presenter.handleAnswerSelection('4');
        
        test.expect(answerResult).toBeNull();
    });

    test.test('should show feedback with correct styling for correct answer', () => {
        const presenter = new QuestionPresenter();
        
        presenter.displayQuestion(sampleQuestion);
        presenter.showFeedback(true, sampleQuestion.feedback);
        
        test.expect(presenter.ui.feedback.textContent).toBe(sampleQuestion.feedback);
        test.expect(presenter.ui.feedback.style.display).toBe('block');
        test.expect(presenter.ui.feedback.style.backgroundColor).toBe('#d4edda');
        test.expect(presenter.ui.feedback.style.color).toBe('#155724');
    });

    test.test('should show feedback with correct styling for incorrect answer', () => {
        const presenter = new QuestionPresenter();
        
        presenter.displayQuestion(sampleQuestion);
        presenter.showFeedback(false, sampleQuestion.feedback);
        
        test.expect(presenter.ui.feedback.textContent).toBe(sampleQuestion.feedback);
        test.expect(presenter.ui.feedback.style.display).toBe('block');
        test.expect(presenter.ui.feedback.style.backgroundColor).toBe('#f8d7da');
        test.expect(presenter.ui.feedback.style.color).toBe('#721c24');
    });

    test.test('should hide question and reset state', () => {
        const presenter = new QuestionPresenter();
        let feedbackComplete = false;
        
        presenter.addFeedbackCompleteListener(() => {
            feedbackComplete = true;
        });
        
        presenter.displayQuestion(sampleQuestion);
        presenter.hideQuestion();
        
        test.expect(presenter.ui.isVisible).toBe(false);
        test.expect(presenter.currentQuestion).toBeNull();
        test.expect(presenter.isWaitingForAnswer).toBe(false);
        test.expect(feedbackComplete).toBe(true);
    });

    test.test('should add and notify answer listeners', () => {
        const presenter = new QuestionPresenter();
        let listener1Called = false;
        let listener2Called = false;
        
        presenter.addAnswerListener(() => { listener1Called = true; });
        presenter.addAnswerListener(() => { listener2Called = true; });
        
        presenter.displayQuestion(sampleQuestion);
        presenter.handleAnswerSelection('4');
        
        test.expect(listener1Called).toBe(true);
        test.expect(listener2Called).toBe(true);
    });

    test.test('should add and notify feedback complete listeners', () => {
        const presenter = new QuestionPresenter();
        let listener1Called = false;
        let listener2Called = false;
        
        presenter.addFeedbackCompleteListener(() => { listener1Called = true; });
        presenter.addFeedbackCompleteListener(() => { listener2Called = true; });
        
        presenter.hideQuestion();
        
        test.expect(listener1Called).toBe(true);
        test.expect(listener2Called).toBe(true);
    });

    test.test('should report question visibility correctly', () => {
        const presenter = new QuestionPresenter();
        
        test.expect(presenter.isQuestionVisible()).toBe(false);
        
        presenter.displayQuestion(sampleQuestion);
        test.expect(presenter.isQuestionVisible()).toBe(true);
        
        presenter.hideQuestion();
        test.expect(presenter.isQuestionVisible()).toBe(false);
    });

    test.test('should return current question correctly', () => {
        const presenter = new QuestionPresenter();
        
        test.expect(presenter.getCurrentQuestion()).toBeNull();
        
        presenter.displayQuestion(sampleQuestion);
        test.expect(presenter.getCurrentQuestion()).toEqual(sampleQuestion);
        
        presenter.hideQuestion();
        test.expect(presenter.getCurrentQuestion()).toBeNull();
    });

    test.test('should force hide question', () => {
        const presenter = new QuestionPresenter();
        
        presenter.displayQuestion(sampleQuestion);
        test.expect(presenter.isQuestionVisible()).toBe(true);
        
        presenter.forceHide();
        test.expect(presenter.isQuestionVisible()).toBe(false);
        test.expect(presenter.currentQuestion).toBeNull();
    });

    test.test('should handle keyboard support setup and cleanup', () => {
        const presenter = new QuestionPresenter();
        
        // Mock document event listeners
        let keydownHandler = null;
        document.addEventListener = (event, handler) => {
            if (event === 'keydown') {
                keydownHandler = handler;
            }
        };
        document.removeEventListener = (event, handler) => {
            if (event === 'keydown' && handler === keydownHandler) {
                keydownHandler = null;
            }
        };
        
        presenter.displayQuestion(sampleQuestion);
        test.expect(keydownHandler).toBeTruthy();
        
        presenter.hideQuestion();
        test.expect(keydownHandler).toBeNull();
    });

    test.test('should handle keyboard input for answer selection', () => {
        const presenter = new QuestionPresenter();
        let answerResult = null;
        
        presenter.addAnswerListener((result) => {
            answerResult = result;
        });
        
        // Mock keyboard handler
        presenter.displayQuestion(sampleQuestion);
        
        // Simulate pressing '2' key (should select second option)
        if (presenter.keyboardHandler) {
            presenter.keyboardHandler({ key: '2' });
            test.expect(answerResult.selectedAnswer).toBe('4'); // Second option
        }
    });

    test.test('should handle visual feedback for button highlighting', () => {
        const presenter = new QuestionPresenter();
        
        presenter.displayQuestion(sampleQuestion);
        presenter.handleAnswerSelection('4'); // Correct answer
        
        // Check that buttons have been styled appropriately
        presenter.ui.options.forEach(button => {
            if (button.textContent === '4') {
                // Correct answer should be highlighted green
                test.expect(button.style.backgroundColor).toBe('#4CAF50');
                test.expect(button.style.color).toBe('white');
            } else {
                // Other options should be dimmed
                test.expect(button.style.backgroundColor).toBe('#ccc');
                test.expect(button.style.opacity).toBe('0.6');
            }
            test.expect(button.style.cursor).toBe('default');
        });
    });

    test.test('should handle visual feedback for incorrect answer', () => {
        const presenter = new QuestionPresenter();
        
        presenter.displayQuestion(sampleQuestion);
        presenter.handleAnswerSelection('3'); // Incorrect answer
        
        presenter.ui.options.forEach(button => {
            if (button.textContent === '4') {
                // Correct answer should be highlighted green
                test.expect(button.style.backgroundColor).toBe('#4CAF50');
                test.expect(button.style.color).toBe('white');
            } else if (button.textContent === '3') {
                // Incorrect selection should be highlighted red
                test.expect(button.style.backgroundColor).toBe('#f44336');
                test.expect(button.style.color).toBe('white');
            } else {
                // Other options should be dimmed
                test.expect(button.style.backgroundColor).toBe('#ccc');
                test.expect(button.style.opacity).toBe('0.6');
            }
        });
    });
});

test.summary();