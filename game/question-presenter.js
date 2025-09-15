/**
 * @typedef {Object} Question
 * @property {string} prompt - The question text
 * @property {string[]} options - Array of answer options
 * @property {string} answer - The correct answer
 * @property {string} feedback - Feedback text to show after answering
 * @property {string} [type] - Optional question type
 * @property {number} [difficulty] - Optional difficulty level
 * @property {string} [subject] - Optional subject category
 * @property {string} [topic] - Optional topic category
 */

/**
 * @typedef {Object} QuestionUI
 * @property {HTMLElement} container - Main container element
 * @property {HTMLElement} prompt - Question prompt element
 * @property {HTMLElement[]} options - Array of option button elements
 * @property {HTMLElement} feedback - Feedback display element
 * @property {boolean} isVisible - Whether the UI is currently visible
 */

/**
 * @typedef {Object} AnswerResult
 * @property {boolean} isCorrect - Whether the answer was correct
 * @property {string} selectedAnswer - The answer that was selected
 * @property {string} correctAnswer - The correct answer
 * @property {string} feedback - Feedback text to display
 */

/**
 * QuestionPresenter class handles the display and interaction of educational questions
 */
class QuestionPresenter {
    constructor(questionTypeHandler = null, subjectConfigManager = null) {
        /** @type {Question|null} */
        this.currentQuestion = null;

        /** @type {string[]} */
        this.answerOptions = [];

        /** @type {QuestionUI} */
        this.ui = {
            container: null,
            prompt: null,
            options: [],
            feedback: null,
            isVisible: false
        };

        /** @type {Function[]} */
        this.answerListeners = [];

        /** @type {Function[]} */
        this.feedbackCompleteListeners = [];

        /** @type {boolean} */
        this.isWaitingForAnswer = false;

        /** @type {QuestionTypeHandler} */
        this.questionTypeHandler = questionTypeHandler;

        /** @type {SubjectConfigManager} */
        this.subjectConfigManager = subjectConfigManager;

        /** @type {Object[]} */
        this.currentUIElements = [];

        /** @type {string} */
        this.currentInputText = '';

        this.initializeUI();
    }

    /**
     * Initialize the question UI elements
     * @private
     */
    initializeUI() {
        // Create main container
        this.ui.container = document.createElement('div');
        this.ui.container.id = 'question-container';
        this.ui.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.95);
            border: 3px solid #333;
            border-radius: 10px;
            padding: 20px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            display: none;
            font-family: Arial, sans-serif;
        `;

        // Add CSS animations to the document if not already present
        if (!document.getElementById('question-presenter-styles')) {
            const style = document.createElement('style');
            style.id = 'question-presenter-styles';
            style.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translate(-50%, -60%); }
                    to { opacity: 1; transform: translate(-50%, -50%); }
                }
                @keyframes successPulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); background-color: #c3e6cb; }
                    100% { transform: scale(1); }
                }
                @keyframes errorShake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
                    20%, 40%, 60%, 80% { transform: translateX(3px); }
                }
                @keyframes smoothContinue {
                    0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.02); }
                    100% { opacity: 0; transform: translate(-50%, -60%) scale(0.95); }
                }
                #question-container {
                    animation: fadeIn 0.3s ease-out;
                }
                .smooth-exit {
                    animation: smoothContinue 0.8s ease-out forwards;
                }
            `;
            document.head.appendChild(style);
        }

        // Create question prompt
        this.ui.prompt = document.createElement('h2');
        this.ui.prompt.style.cssText = `
            margin: 0 0 20px 0;
            color: #333;
            text-align: center;
            font-size: 24px;
        `;

        // Create options container
        const optionsContainer = document.createElement('div');
        optionsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 20px;
        `;

        // Create feedback element
        this.ui.feedback = document.createElement('div');
        this.ui.feedback.style.cssText = `
            padding: 15px;
            border-radius: 5px;
            text-align: center;
            font-weight: bold;
            display: none;
            margin-top: 15px;
        `;

        // Assemble UI
        this.ui.container.appendChild(this.ui.prompt);
        this.ui.container.appendChild(optionsContainer);
        this.ui.container.appendChild(this.ui.feedback);

        // Add to document body
        document.body.appendChild(this.ui.container);

        // Store reference to options container for dynamic option creation
        this.optionsContainer = optionsContainer;
    }

    /**
     * Display a question using the question type handler
     * @param {Question} question - The question to display
     */
    displayQuestionWithTypeHandler(question) {
        try {
            // Validate question using type handler
            const validationResult = this.questionTypeHandler.validateQuestion(question);
            if (!validationResult.isValid) {
                throw new Error(`Invalid question: ${validationResult.errors.join(', ')}`);
            }

            this.currentQuestion = question;
            this.isWaitingForAnswer = true;

            // Get current theme if available
            const theme = this.subjectConfigManager ? this.subjectConfigManager.getCurrentTheme() : null;

            // Clear existing UI elements
            this.clearQuestionUI();

            // Apply theme to container if available
            if (theme) {
                this.applyThemeToContainer(theme);
            }

            // Use Kaboom.js for rendering if available, otherwise fall back to DOM
            if (typeof add === 'function' && typeof width === 'function' && typeof height === 'function') {
                this.renderQuestionWithKaboom(question, theme);
            } else {
                this.renderQuestionWithDOM(question, theme);
            }

            this.ui.isVisible = true;

        } catch (error) {
            console.error('QuestionPresenter: Failed to display question with type handler:', error.message);
            this.showErrorMessage('Unable to display question. Please try again.');
            this.hideQuestion();
        }
    }

    /**
     * Render question using Kaboom.js
     * @param {Question} question - The question to render
     * @param {Object} theme - Current theme
     */
    renderQuestionWithKaboom(question, theme) {
        try {
            // Clear existing question UI elements
            destroyAll("question-ui");

            // Render question using type handler
            this.currentUIElements = this.questionTypeHandler.renderQuestion(
                question, 
                add, 
                width(), 
                height(), 
                theme
            );

            // Set up input handling based on question type
            this.setupQuestionTypeInput(question);

        } catch (error) {
            console.error('Error rendering question with Kaboom:', error.message);
            // Fall back to DOM rendering
            this.renderQuestionWithDOM(question, theme);
        }
    }

    /**
     * Render question using DOM (fallback)
     * @param {Question} question - The question to render
     * @param {Object} theme - Current theme
     */
    renderQuestionWithDOM(question, theme) {
        // Clear existing options
        this.optionsContainer.innerHTML = '';
        this.ui.options = [];

        // Update prompt
        this.ui.prompt.textContent = this.sanitizeText(question.prompt);

        // Handle different question types with DOM
        switch (question.type) {
            case 'true_false':
                this.renderTrueFalseDOM(question);
                break;
            case 'fill_blank':
                this.renderFillBlankDOM(question);
                break;
            case 'matching':
                this.renderMatchingDOM(question);
                break;
            default:
                // Fall back to multiple choice
                this.renderMultipleChoiceDOM(question);
                break;
        }

        // Show container
        this.ui.container.style.display = 'block';
    }

    /**
     * Set up input handling for different question types
     * @param {Question} question - Current question
     */
    setupQuestionTypeInput(question) {
        // Remove existing input handlers
        this.removeInputHandlers();

        switch (question.type) {
            case 'multiple_choice':
                this.setupMultipleChoiceInput();
                break;
            case 'true_false':
                this.setupTrueFalseInput();
                break;
            case 'fill_blank':
                this.setupFillBlankInput();
                break;
            case 'matching':
                this.setupMatchingInput();
                break;
        }
    }

    /**
     * Set up multiple choice input handling
     */
    setupMultipleChoiceInput() {
        // Handle number key presses
        this.keyHandler = (e) => {
            if (!this.isWaitingForAnswer) return;
            
            const keyNum = parseInt(e.key);
            if (keyNum >= 1 && keyNum <= this.currentQuestion.options.length) {
                const selectedAnswer = this.currentQuestion.options[keyNum - 1];
                this.processAnswer(selectedAnswer);
            }
        };

        // Handle clicks on option buttons
        this.currentUIElements.forEach(element => {
            if (element.is && element.is("option-button")) {
                element.onClick(() => {
                    if (this.isWaitingForAnswer) {
                        this.processAnswer(element.optionText);
                    }
                });
            }
        });

        document.addEventListener('keydown', this.keyHandler);
    }

    /**
     * Set up true/false input handling
     */
    setupTrueFalseInput() {
        this.keyHandler = (e) => {
            if (!this.isWaitingForAnswer) return;
            
            if (e.key === '1' || e.key.toLowerCase() === 't') {
                this.processAnswer('True');
            } else if (e.key === '2' || e.key.toLowerCase() === 'f') {
                this.processAnswer('False');
            }
        };

        document.addEventListener('keydown', this.keyHandler);
    }

    /**
     * Set up fill in the blank input handling
     */
    setupFillBlankInput() {
        this.currentInputText = '';
        
        this.keyHandler = (e) => {
            if (!this.isWaitingForAnswer) return;
            
            if (e.key === 'Enter') {
                if (this.currentInputText.trim()) {
                    this.processAnswer(this.currentInputText.trim());
                }
            } else if (e.key === 'Backspace') {
                this.currentInputText = this.currentInputText.slice(0, -1);
                this.updateInputDisplay();
            } else if (e.key.length === 1 && this.currentInputText.length < 50) {
                this.currentInputText += e.key;
                this.updateInputDisplay();
            }
        };

        document.addEventListener('keydown', this.keyHandler);
    }

    /**
     * Set up matching input handling (simplified)
     */
    setupMatchingInput() {
        this.keyHandler = (e) => {
            if (!this.isWaitingForAnswer) return;
            
            if (e.key === 'Enter') {
                // Simplified matching - just accept any enter press
                this.processAnswer('Matched');
            }
        };

        document.addEventListener('keydown', this.keyHandler);
    }

    /**
     * Update input display for fill-in-the-blank questions
     */
    updateInputDisplay() {
        const inputTextElement = this.currentUIElements.find(el => el.is && el.is("input-text"));
        if (inputTextElement) {
            inputTextElement.text = this.currentInputText || "Type your answer...";
            inputTextElement.color = this.currentInputText ? rgb(0, 0, 0) : rgb(150, 150, 150);
        }
    }

    /**
     * Process answer using question type handler
     * @param {string} answer - User's answer
     */
    processAnswer(answer) {
        if (!this.isWaitingForAnswer || !this.currentQuestion) return;

        this.isWaitingForAnswer = false;

        try {
            // Use question type handler to process the answer
            const result = this.questionTypeHandler.handleInput(
                this.currentQuestion, 
                answer, 
                { uiElements: this.currentUIElements }
            );

            // Show feedback
            this.showFeedback(result.isCorrect, result.feedback);

            // Notify listeners
            this.answerListeners.forEach(listener => {
                try {
                    if (typeof listener === 'function') {
                        listener(result);
                    }
                } catch (listenerError) {
                    console.error('Error in answer listener:', listenerError.message);
                }
            });

        } catch (error) {
            console.error('Error processing answer:', error.message);
            this.showErrorMessage('Error processing your answer. Please try again.');
        }
    }

    /**
     * Remove input handlers
     */
    removeInputHandlers() {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
            this.keyHandler = null;
        }
    }

    /**
     * Clear question UI elements
     */
    clearQuestionUI() {
        // Clear Kaboom.js elements
        if (typeof destroyAll === 'function') {
            destroyAll("question-ui");
        }
        
        // Clear DOM elements
        if (this.optionsContainer) {
            this.optionsContainer.innerHTML = '';
        }
        
        this.currentUIElements = [];
        this.ui.options = [];
    }

    /**
     * Apply theme to container
     * @param {Object} theme - Theme configuration
     */
    applyThemeToContainer(theme) {
        if (!theme || !this.ui.container) return;

        try {
            const bgColor = this.hexToRgb(theme.backgroundColor);
            const textColor = this.hexToRgb(theme.textColor);
            
            if (bgColor) {
                this.ui.container.style.backgroundColor = `rgba(${bgColor.r}, ${bgColor.g}, ${bgColor.b}, 0.95)`;
            }
            
            if (textColor) {
                this.ui.container.style.color = `rgb(${textColor.r}, ${textColor.g}, ${textColor.b})`;
            }
            
            if (theme.fontFamily) {
                this.ui.container.style.fontFamily = theme.fontFamily;
            }
        } catch (error) {
            console.warn('Error applying theme to container:', error.message);
        }
    }

    /**
     * Convert hex color to RGB
     * @param {string} hex - Hex color string
     * @returns {{r: number, g: number, b: number}|null} - RGB values
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Display a question to the user with support for different question types
     * @param {Question} question - The question to display
     */
    displayQuestion(question) {
        // If we have a question type handler, use it for rendering
        if (this.questionTypeHandler && question.type && question.type !== 'multiple_choice') {
            return this.displayQuestionWithTypeHandler(question);
        }
        
        // Fall back to original multiple choice implementation
        try {
            // Comprehensive question validation
            const validationResult = this.validateQuestion(question);
            if (!validationResult.isValid) {
                throw new Error(`Invalid question: ${validationResult.errors.join(', ')}`);
            }

            // Ensure UI is properly initialized
            if (!this.ui.container || !this.optionsContainer) {
                throw new Error('Question UI not properly initialized');
            }

            this.currentQuestion = question;
            this.answerOptions = [...question.options];
            this.isWaitingForAnswer = true;

            // Safely update prompt with sanitized content
            this.ui.prompt.textContent = this.sanitizeText(question.prompt);

            // Clear existing options safely
            try {
                this.optionsContainer.innerHTML = '';
                this.ui.options = [];
            } catch (clearError) {
                console.warn('QuestionPresenter: Error clearing options container:', clearError.message);
                // Continue with fresh options array
                this.ui.options = [];
            }

            // Create option buttons with error handling
            question.options.forEach((option, index) => {
                try {
                    const button = this.createOptionButton(option, index);
                    this.optionsContainer.appendChild(button);
                    this.ui.options.push(button);
                } catch (buttonError) {
                    console.error(`QuestionPresenter: Failed to create option button ${index}:`, buttonError.message);
                    // Create a fallback button
                    const fallbackButton = this.createFallbackButton(option, index);
                    if (fallbackButton) {
                        this.optionsContainer.appendChild(fallbackButton);
                        this.ui.options.push(fallbackButton);
                    }
                }
            });

            // Ensure at least one option was created
            if (this.ui.options.length === 0) {
                throw new Error('Failed to create any option buttons');
            }

            // Hide feedback and show container
            this.ui.feedback.style.display = 'none';
            this.ui.container.style.display = 'block';
            this.ui.isVisible = true;

            // Add keyboard support with error handling
            try {
                this.addKeyboardSupport();
            } catch (keyboardError) {
                console.warn('QuestionPresenter: Failed to add keyboard support:', keyboardError.message);
                // Continue without keyboard support
            }

        } catch (error) {
            console.error('QuestionPresenter: Failed to display question:', error.message);
            this.showErrorMessage('Unable to display question. Please try again.');
            
            // Attempt to recover by hiding the question UI
            this.hideQuestion();
        }
    }

    /**
     * Handle answer selection
     * @param {string} selectedOption - The selected answer option
     */
    handleAnswerSelection(selectedOption) {
        try {
            // Validate state and input
            if (!this.isWaitingForAnswer || !this.currentQuestion) {
                console.warn('QuestionPresenter: Answer selection ignored - not waiting for answer or no current question');
                return;
            }

            if (typeof selectedOption !== 'string' || selectedOption.trim() === '') {
                throw new Error('Invalid selected option: must be a non-empty string');
            }

            // Sanitize the selected option
            const sanitizedOption = this.sanitizeText(selectedOption);
            if (!sanitizedOption) {
                throw new Error('Selected option is empty after sanitization');
            }

            this.isWaitingForAnswer = false;

            // Determine if answer is correct
            const isCorrect = sanitizedOption === this.currentQuestion.answer;

            // Create answer result with validation
            const result = {
                isCorrect: isCorrect,
                selectedAnswer: sanitizedOption,
                correctAnswer: this.currentQuestion.answer,
                feedback: this.currentQuestion.feedback || 'No feedback available'
            };

            // Update button styles with error handling
            try {
                this.updateButtonStyles(sanitizedOption, isCorrect);
            } catch (styleError) {
                console.warn('QuestionPresenter: Error updating button styles:', styleError.message);
                // Continue without visual feedback
            }

            // Show feedback with error handling
            try {
                this.showFeedback(isCorrect, this.currentQuestion.feedback);
            } catch (feedbackError) {
                console.warn('QuestionPresenter: Error showing feedback:', feedbackError.message);
                // Continue without feedback display
            }

            // Safely notify listeners
            this.answerListeners.forEach((listener, index) => {
                try {
                    if (typeof listener === 'function') {
                        listener(result);
                    } else {
                        console.warn(`QuestionPresenter: Invalid answer listener at index ${index}`);
                    }
                } catch (listenerError) {
                    console.error(`QuestionPresenter: Error in answer listener ${index}:`, listenerError.message);
                    // Continue with other listeners
                }
            });

            // Auto-hide with error handling
            try {
                const hideDelay = isCorrect ? 2000 : 3500; // Shorter delay for correct answers
                
                setTimeout(() => {
                    try {
                        if (isCorrect) {
                            // Smooth continuation animation for correct answers
                            this.ui.container.classList.add('smooth-exit');
                            setTimeout(() => {
                                this.hideQuestion();
                            }, 800); // Wait for animation to complete
                        } else {
                            // Standard hide for incorrect answers
                            this.hideQuestion();
                        }
                    } catch (hideError) {
                        console.error('QuestionPresenter: Error during auto-hide:', hideError.message);
                        // Force hide as fallback
                        this.hideQuestion();
                    }
                }, hideDelay);
            } catch (timerError) {
                console.error('QuestionPresenter: Error setting up auto-hide timer:', timerError.message);
                // Immediate hide as fallback
                setTimeout(() => this.hideQuestion(), 3000);
            }

        } catch (error) {
            console.error('QuestionPresenter: Critical error in handleAnswerSelection:', error.message);
            
            // Emergency recovery
            this.isWaitingForAnswer = false;
            this.showErrorMessage('Error processing your answer. The question will be skipped.');
            
            // Force hide after short delay
            setTimeout(() => {
                this.hideQuestion();
            }, 2000);
        }
    }

    /**
     * Update button styles to show correct/incorrect answers
     * @param {string} selectedOption - The selected answer
     * @param {boolean} isCorrect - Whether the answer was correct
     * @private
     */
    updateButtonStyles(selectedOption, isCorrect) {
        if (!Array.isArray(this.ui.options)) {
            throw new Error('UI options array is not valid');
        }

        this.ui.options.forEach((button, index) => {
            try {
                if (!button || !button.style) {
                    console.warn(`QuestionPresenter: Invalid button at index ${index}`);
                    return;
                }

                button.style.cursor = 'default';
                button.style.transform = 'scale(1)';

                if (button.textContent === this.currentQuestion.answer) {
                    // Highlight correct answer with animation
                    button.style.backgroundColor = '#4CAF50';
                    button.style.color = 'white';
                    button.style.borderColor = '#45a049';
                    button.style.transform = 'scale(1.05)';
                    button.style.boxShadow = '0 4px 8px rgba(76, 175, 80, 0.3)';
                } else if (button.textContent === selectedOption && !isCorrect) {
                    // Highlight incorrect selection with shake animation
                    button.style.backgroundColor = '#f44336';
                    button.style.color = 'white';
                    button.style.borderColor = '#da190b';
                    button.style.boxShadow = '0 4px 8px rgba(244, 67, 54, 0.3)';
                    
                    // Add shake animation
                    button.style.animation = 'shake 0.5s ease-in-out';
                } else {
                    // Dim other options
                    button.style.backgroundColor = '#ccc';
                    button.style.opacity = '0.6';
                    button.style.borderColor = '#999';
                }
            } catch (buttonError) {
                console.warn(`QuestionPresenter: Error styling button ${index}:`, buttonError.message);
                // Continue with other buttons
            }
        });
    }

    /**
     * Show feedback for the answer
     * @param {boolean} isCorrect - Whether the answer was correct
     * @param {string} feedbackText - The feedback text to display
     */
    showFeedback(isCorrect, feedbackText) {
        this.ui.feedback.textContent = feedbackText;
        this.ui.feedback.style.display = 'block';

        if (isCorrect) {
            this.ui.feedback.style.backgroundColor = '#d4edda';
            this.ui.feedback.style.color = '#155724';
            this.ui.feedback.style.border = '1px solid #c3e6cb';
            
            // Add success animation
            this.ui.feedback.style.animation = 'successPulse 0.6s ease-out';
            
            // Add celebration effect to container
            this.ui.container.style.borderColor = '#28a745';
            this.ui.container.style.boxShadow = '0 4px 20px rgba(40, 167, 69, 0.3)';
        } else {
            this.ui.feedback.style.backgroundColor = '#f8d7da';
            this.ui.feedback.style.color = '#721c24';
            this.ui.feedback.style.border = '1px solid #f5c6cb';
            
            // Add error animation
            this.ui.feedback.style.animation = 'errorShake 0.6s ease-out';
            
            // Add error effect to container
            this.ui.container.style.borderColor = '#dc3545';
            this.ui.container.style.boxShadow = '0 4px 20px rgba(220, 53, 69, 0.3)';
        }
    }

    /**
     * Hide the question UI
     */
    hideQuestion() {
        this.ui.container.style.display = 'none';
        this.ui.isVisible = false;
        this.currentQuestion = null;
        this.isWaitingForAnswer = false;

        // Reset container styling
        this.ui.container.style.borderColor = '#333';
        this.ui.container.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
        this.ui.container.classList.remove('smooth-exit');

        // Remove keyboard listeners
        this.removeKeyboardSupport();

        // Notify feedback complete listeners
        this.feedbackCompleteListeners.forEach(listener => {
            listener();
        });
    }

    /**
     * Add keyboard support for answer selection
     * @private
     */
    addKeyboardSupport() {
        try {
            this.keyboardHandler = (event) => {
                try {
                    if (!this.isWaitingForAnswer || !event) return;

                    // Validate event object
                    if (!event.key || typeof event.key !== 'string') {
                        return;
                    }

                    const key = event.key;
                    let optionIndex = -1;

                    // Map number keys to options (1, 2, 3, etc.)
                    if (key >= '1' && key <= '9') {
                        const parsedIndex = parseInt(key, 10);
                        if (!isNaN(parsedIndex)) {
                            optionIndex = parsedIndex - 1;
                        }
                    }
                    // Map letter keys to options (A, B, C, etc.)
                    else if (key.length === 1 && key.toUpperCase() >= 'A' && key.toUpperCase() <= 'Z') {
                        optionIndex = key.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
                    }

                    // Validate option index and answer options
                    if (optionIndex >= 0 && 
                        Array.isArray(this.answerOptions) && 
                        optionIndex < this.answerOptions.length &&
                        this.answerOptions[optionIndex]) {
                        
                        // Prevent default behavior for handled keys
                        event.preventDefault();
                        this.handleAnswerSelection(this.answerOptions[optionIndex]);
                    }
                } catch (keyError) {
                    console.warn('QuestionPresenter: Error in keyboard handler:', keyError.message);
                    // Don't propagate keyboard errors
                }
            };

            if (document && document.addEventListener) {
                document.addEventListener('keydown', this.keyboardHandler);
            } else {
                throw new Error('Document or addEventListener not available');
            }
        } catch (error) {
            console.warn('QuestionPresenter: Failed to add keyboard support:', error.message);
            // Keyboard support is optional, so we don't throw
        }
    }

    /**
     * Remove keyboard support
     * @private
     */
    removeKeyboardSupport() {
        try {
            if (this.keyboardHandler && document && document.removeEventListener) {
                document.removeEventListener('keydown', this.keyboardHandler);
                this.keyboardHandler = null;
            }
        } catch (error) {
            console.warn('QuestionPresenter: Error removing keyboard support:', error.message);
            // Force clear the handler reference
            this.keyboardHandler = null;
        }
    }

    /**
     * Add a listener for answer selection events
     * @param {Function} listener - Function to call when answer is selected
     */
    addAnswerListener(listener) {
        this.answerListeners.push(listener);
    }

    /**
     * Add a listener for feedback complete events
     * @param {Function} listener - Function to call when feedback is complete
     */
    addFeedbackCompleteListener(listener) {
        this.feedbackCompleteListeners.push(listener);
    }

    /**
     * Check if a question is currently being displayed
     * @returns {boolean} - Whether a question is visible
     */
    isQuestionVisible() {
        return this.ui.isVisible;
    }

    /**
     * Get the currently displayed question
     * @returns {Question|null} - Current question or null
     */
    getCurrentQuestion() {
        return this.currentQuestion;
    }

    /**
     * Force hide the question (for emergency situations)
     */
    forceHide() {
        this.hideQuestion();
    }

    /**
     * Validate a question object for display
     * @param {Question} question - The question to validate
     * @returns {{isValid: boolean, errors: string[]}} - Validation result
     * @private
     */
    validateQuestion(question) {
        const errors = [];

        if (!question) {
            errors.push('Question is null or undefined');
            return { isValid: false, errors };
        }

        if (typeof question !== 'object') {
            errors.push('Question must be an object');
            return { isValid: false, errors };
        }

        // Check required fields
        if (!question.prompt || typeof question.prompt !== 'string' || question.prompt.trim() === '') {
            errors.push('Question prompt is missing or empty');
        }

        if (!Array.isArray(question.options)) {
            errors.push('Question options must be an array');
        } else if (question.options.length < 2) {
            errors.push('Question must have at least 2 options');
        } else {
            // Validate each option
            question.options.forEach((option, index) => {
                if (!option || typeof option !== 'string' || option.trim() === '') {
                    errors.push(`Option ${index + 1} is empty or invalid`);
                }
            });
        }

        if (!question.answer || typeof question.answer !== 'string' || question.answer.trim() === '') {
            errors.push('Question answer is missing or empty');
        } else if (Array.isArray(question.options) && !question.options.includes(question.answer)) {
            errors.push('Question answer is not in the options list');
        }

        if (!question.feedback || typeof question.feedback !== 'string' || question.feedback.trim() === '') {
            errors.push('Question feedback is missing or empty');
        }

        return { isValid: errors.length === 0, errors };
    }

    /**
     * Sanitize text content to prevent XSS and display issues
     * @param {string} text - Text to sanitize
     * @returns {string} - Sanitized text
     * @private
     */
    sanitizeText(text) {
        if (typeof text !== 'string') {
            return 'Invalid text content';
        }

        // Remove potentially dangerous characters and limit length
        return text
            .replace(/[<>]/g, '') // Remove angle brackets
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .trim()
            .substring(0, 500); // Limit length to prevent UI overflow
    }

    /**
     * Create an option button with error handling
     * @param {string} option - The option text
     * @param {number} index - The option index
     * @returns {HTMLElement} - The created button element
     * @private
     */
    createOptionButton(option, index) {
        const sanitizedOption = this.sanitizeText(option);
        
        if (!sanitizedOption) {
            throw new Error(`Option ${index + 1} is empty after sanitization`);
        }

        const button = document.createElement('button');
        button.textContent = sanitizedOption;
        button.setAttribute('data-option-index', index.toString());
        button.setAttribute('aria-label', `Option ${index + 1}: ${sanitizedOption}`);
        
        button.style.cssText = `
            padding: 12px 20px;
            font-size: 18px;
            border: 2px solid #333;
            border-radius: 5px;
            background: #f0f0f0;
            cursor: pointer;
            transition: all 0.2s ease;
            transform: scale(1);
            word-wrap: break-word;
            max-width: 100%;
        `;

        // Add hover effect with error handling
        button.addEventListener('mouseenter', () => {
            try {
                if (this.isWaitingForAnswer) {
                    button.style.backgroundColor = '#e0e0e0';
                    button.style.transform = 'scale(1.02)';
                }
            } catch (hoverError) {
                console.warn('QuestionPresenter: Error in button hover effect:', hoverError.message);
            }
        });

        button.addEventListener('mouseleave', () => {
            try {
                if (this.isWaitingForAnswer) {
                    button.style.backgroundColor = '#f0f0f0';
                    button.style.transform = 'scale(1)';
                }
            } catch (hoverError) {
                console.warn('QuestionPresenter: Error in button hover effect:', hoverError.message);
            }
        });

        // Add click handler with error handling
        button.addEventListener('click', () => {
            try {
                if (this.isWaitingForAnswer) {
                    this.handleAnswerSelection(sanitizedOption);
                }
            } catch (clickError) {
                console.error('QuestionPresenter: Error handling button click:', clickError.message);
                this.showErrorMessage('Error processing your answer. Please try again.');
            }
        });

        return button;
    }

    /**
     * Create a fallback button when normal creation fails
     * @param {string} option - The option text
     * @param {number} index - The option index
     * @returns {HTMLElement|null} - The created button element or null
     * @private
     */
    createFallbackButton(option, index) {
        try {
            const button = document.createElement('button');
            const safeText = typeof option === 'string' ? option.substring(0, 50) : `Option ${index + 1}`;
            button.textContent = safeText;
            
            button.style.cssText = `
                padding: 10px 15px;
                font-size: 16px;
                border: 1px solid #666;
                background: #ddd;
                cursor: pointer;
            `;

            button.addEventListener('click', () => {
                if (this.isWaitingForAnswer) {
                    this.handleAnswerSelection(option);
                }
            });

            return button;
        } catch (fallbackError) {
            console.error('QuestionPresenter: Failed to create fallback button:', fallbackError.message);
            return null;
        }
    }

    /**
     * Show an error message to the user
     * @param {string} message - Error message to display
     * @private
     */
    showErrorMessage(message) {
        try {
            if (!this.ui.container) {
                console.error('QuestionPresenter: Cannot show error message - UI not initialized');
                return;
            }

            // Clear existing content
            this.ui.container.innerHTML = '';
            
            // Create error display
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                padding: 20px;
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
                border-radius: 5px;
                text-align: center;
                font-weight: bold;
            `;
            errorDiv.textContent = this.sanitizeText(message);

            // Add retry button
            const retryButton = document.createElement('button');
            retryButton.textContent = 'Continue';
            retryButton.style.cssText = `
                margin-top: 15px;
                padding: 10px 20px;
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
            `;
            retryButton.addEventListener('click', () => {
                this.hideQuestion();
            });

            errorDiv.appendChild(retryButton);
            this.ui.container.appendChild(errorDiv);
            
            // Show the container
            this.ui.container.style.display = 'block';
            this.ui.isVisible = true;

            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.hideQuestion();
            }, 5000);

        } catch (errorDisplayError) {
            console.error('QuestionPresenter: Failed to show error message:', errorDisplayError.message);
            // Last resort: hide the question UI
            this.hideQuestion();
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestionPresenter;
}