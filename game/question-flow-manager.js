/**
 * @typedef {Object} QuestionFlowConfig
 * @property {number} minInterval - Minimum time between questions (ms)
 * @property {number} maxInterval - Maximum time between questions (ms)
 * @property {boolean} randomizeOrder - Whether to randomize question order
 * @property {boolean} allowRepeat - Whether to allow repeating questions
 */

/**
 * Game state constants (matching GameStateManager)
 */
const GameStates = {
    MENU: 'menu',
    PLAYING: 'playing',
    QUESTION: 'question',
    FEEDBACK: 'feedback',
    GAMEOVER: 'gameover',
    PAUSED: 'paused'
};

/**
 * QuestionFlowManager handles the integration between ContentLoader and QuestionPresenter
 * to create seamless question timing and game flow
 */
class QuestionFlowManager {
    constructor(contentLoader, questionPresenter, gameStateManager) {
        /** @type {ContentLoader} */
        this.contentLoader = contentLoader;
        
        /** @type {QuestionPresenter} */
        this.questionPresenter = questionPresenter;
        
        /** @type {GameStateManager} */
        this.gameStateManager = gameStateManager;
        
        /** @type {QuestionFlowConfig} */
        this.config = {
            minInterval: 5000, // 5 seconds
            maxInterval: 10000, // 10 seconds
            randomizeOrder: false,
            allowRepeat: true
        };
        
        /** @type {number[]} */
        this.questionHistory = [];
        
        /** @type {number} */
        this.maxHistorySize = 5; // Remember last 5 questions to avoid immediate repeats
        
        /** @type {Function[]} */
        this.questionStartListeners = [];
        
        /** @type {Function[]} */
        this.questionCompleteListeners = [];
        
        /** @type {boolean} */
        this.isActive = false;
        
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for question flow
     * @private
     */
    setupEventListeners() {
        // Listen for answer events from question presenter
        this.questionPresenter.addAnswerListener((result) => {
            this.handleAnswerResult(result);
        });

        // Listen for feedback complete events
        this.questionPresenter.addFeedbackCompleteListener(() => {
            this.handleFeedbackComplete();
        });

        // Listen for game state changes
        this.gameStateManager.addStateChangeListener((newState, previousState) => {
            this.handleStateChange(newState, previousState);
        });
    }

    /**
     * Start the question flow system
     */
    start() {
        if (!this.contentLoader.hasQuestions()) {
            console.warn('QuestionFlowManager: No questions loaded, cannot start');
            return false;
        }
        
        this.isActive = true;
        this.gameStateManager.resetQuestionTimer();
        console.log('QuestionFlowManager: Started question flow');
        return true;
    }

    /**
     * Stop the question flow system
     */
    stop() {
        this.isActive = false;
        console.log('QuestionFlowManager: Stopped question flow');
    }

    /**
     * Update the question flow timing
     * @param {number} deltaTime - Time elapsed since last update (in milliseconds)
     */
    update(deltaTime) {
        try {
            if (!this.isActive) return;

            // Validate deltaTime
            if (typeof deltaTime !== 'number' || isNaN(deltaTime) || deltaTime < 0) {
                console.warn(`QuestionFlowManager: Invalid deltaTime: ${deltaTime}`);
                return;
            }

            // Validate game state manager
            if (!this.gameStateManager || typeof this.gameStateManager.getCurrentState !== 'function') {
                throw new Error('GameStateManager is not properly initialized');
            }
            
            const currentState = this.gameStateManager.getCurrentState();
            
            // Only update timing during PLAYING state
            if (currentState === GameStates.PLAYING) {
                // Safely update game time
                try {
                    this.gameStateManager.updateGameTime(deltaTime);
                } catch (timeError) {
                    console.error('QuestionFlowManager: Error updating game time:', timeError.message);
                    return; // Don't continue if time update fails
                }
                
                // Check if it's time to trigger a question
                try {
                    if (this.gameStateManager.shouldTriggerQuestion && 
                        this.gameStateManager.isQuestionPending &&
                        this.gameStateManager.shouldTriggerQuestion() && 
                        !this.gameStateManager.isQuestionPending()) {
                        this.triggerQuestion();
                    }
                } catch (triggerError) {
                    console.error('QuestionFlowManager: Error checking question trigger:', triggerError.message);
                    // Continue operation even if trigger check fails
                }
            }
        } catch (error) {
            console.error('QuestionFlowManager: Critical error in update:', error.message);
            // Don't crash the game loop, but log the error
        }
    }

    /**
     * Trigger a new question
     */
    triggerQuestion() {
        try {
            // Validate preconditions
            if (!this.isActive) {
                console.warn('QuestionFlowManager: Cannot trigger question - flow manager is not active');
                return;
            }

            if (!this.contentLoader || typeof this.contentLoader.hasQuestions !== 'function') {
                throw new Error('ContentLoader is not properly initialized');
            }

            if (!this.contentLoader.hasQuestions()) {
                console.warn('QuestionFlowManager: Cannot trigger question - no questions available');
                this.handleNoQuestionsAvailable();
                return;
            }

            const question = this.getNextQuestion();
            if (!question) {
                console.warn('QuestionFlowManager: No question available from getNextQuestion');
                this.handleNoQuestionsAvailable();
                return;
            }

            // Validate question object
            if (!this.isValidQuestion(question)) {
                console.error('QuestionFlowManager: Invalid question object received');
                this.handleInvalidQuestion(question);
                return;
            }

            // Safely mark question as pending
            try {
                if (this.gameStateManager && typeof this.gameStateManager.setQuestionPending === 'function') {
                    this.gameStateManager.setQuestionPending();
                }
            } catch (pendingError) {
                console.warn('QuestionFlowManager: Error setting question pending:', pendingError.message);
                // Continue anyway
            }
            
            // Safely transition to question state
            try {
                if (this.gameStateManager && typeof this.gameStateManager.setState === 'function') {
                    this.gameStateManager.setState(GameStates.QUESTION);
                }
            } catch (stateError) {
                console.error('QuestionFlowManager: Error setting question state:', stateError.message);
                // This is more critical, but we'll try to continue
            }
            
            // Display the question with error handling
            try {
                if (this.questionPresenter && typeof this.questionPresenter.displayQuestion === 'function') {
                    this.questionPresenter.displayQuestion(question);
                } else {
                    throw new Error('QuestionPresenter is not properly initialized');
                }
            } catch (displayError) {
                console.error('QuestionFlowManager: Error displaying question:', displayError.message);
                this.handleQuestionDisplayError(displayError);
                return;
            }
            
            // Record question in history with error handling
            try {
                if (question.id) {
                    this.addToHistory(question.id);
                }
            } catch (historyError) {
                console.warn('QuestionFlowManager: Error adding question to history:', historyError.message);
                // History is not critical, continue
            }
            
            // Safely notify listeners
            this.questionStartListeners.forEach((listener, index) => {
                try {
                    if (typeof listener === 'function') {
                        listener(question);
                    } else {
                        console.warn(`QuestionFlowManager: Invalid question start listener at index ${index}`);
                    }
                } catch (listenerError) {
                    console.error(`QuestionFlowManager: Error in question start listener ${index}:`, listenerError.message);
                    // Continue with other listeners
                }
            });
            
            console.log(`QuestionFlowManager: Successfully triggered question "${question.prompt}"`);
            
        } catch (error) {
            console.error('QuestionFlowManager: Critical error triggering question:', error.message);
            this.handleCriticalQuestionError(error);
        }
    }

    /**
     * Get the next question based on configuration
     * @returns {Question|null} - Next question or null if none available
     */
    getNextQuestion() {
        if (!this.contentLoader.hasQuestions()) {
            return null;
        }

        let question = null;
        let attempts = 0;
        const maxAttempts = this.contentLoader.getQuestionCount() * 2;

        // Try to get a question that hasn't been asked recently
        while (attempts < maxAttempts) {
            question = this.contentLoader.getNextQuestion();
            
            if (!question) {
                break;
            }

            // If we allow repeats or this question wasn't asked recently, use it
            if (this.config.allowRepeat || !this.wasRecentlyAsked(question.id)) {
                break;
            }

            attempts++;
        }

        return question;
    }

    /**
     * Check if a question was asked recently
     * @param {string} questionId - Question ID to check
     * @returns {boolean} - Whether the question was asked recently
     * @private
     */
    wasRecentlyAsked(questionId) {
        return this.questionHistory.includes(questionId);
    }

    /**
     * Add a question to the history
     * @param {string} questionId - Question ID to add
     * @private
     */
    addToHistory(questionId) {
        this.questionHistory.push(questionId);
        
        // Keep history size limited
        if (this.questionHistory.length > this.maxHistorySize) {
            this.questionHistory.shift();
        }
    }

    /**
     * Handle answer result from question presenter
     * @param {AnswerResult} result - The answer result
     * @private
     */
    handleAnswerResult(result) {
        // Record the answer in game state
        this.gameStateManager.recordAnswer(result.isCorrect);
        
        console.log(`QuestionFlowManager: Answer ${result.isCorrect ? 'correct' : 'incorrect'} - "${result.selectedAnswer}"`);
    }

    /**
     * Handle feedback completion
     * @private
     */
    handleFeedbackComplete() {
        // Reset question timer for next question
        this.gameStateManager.resetQuestionTimer();
        
        // Transition back to playing state
        if (this.gameStateManager.getCurrentState() === GameStates.QUESTION) {
            this.gameStateManager.setState(GameStates.PLAYING);
        }
        
        // Notify listeners
        this.questionCompleteListeners.forEach(listener => {
            listener();
        });
        
        console.log('QuestionFlowManager: Question cycle complete, returning to gameplay');
    }

    /**
     * Handle game state changes
     * @param {string} newState - New game state
     * @param {string} previousState - Previous game state
     * @private
     */
    handleStateChange(newState, previousState) {
        if (newState === GameStates.PLAYING && previousState === GameStates.MENU) {
            // Game started, begin question flow
            this.start();
        } else if (newState === GameStates.MENU || newState === GameStates.GAMEOVER) {
            // Game ended, stop question flow
            this.stop();
        }
    }

    /**
     * Configure question flow parameters
     * @param {Partial<QuestionFlowConfig>} config - Configuration options
     */
    configure(config) {
        this.config = { ...this.config, ...config };
        console.log('QuestionFlowManager: Configuration updated', this.config);
    }

    /**
     * Add a listener for question start events
     * @param {Function} listener - Function to call when question starts
     */
    addQuestionStartListener(listener) {
        this.questionStartListeners.push(listener);
    }

    /**
     * Add a listener for question complete events
     * @param {Function} listener - Function to call when question completes
     */
    addQuestionCompleteListener(listener) {
        this.questionCompleteListeners.push(listener);
    }

    /**
     * Get current question flow statistics
     * @returns {Object} - Flow statistics
     */
    getFlowStats() {
        return {
            isActive: this.isActive,
            questionsInHistory: this.questionHistory.length,
            totalQuestions: this.contentLoader.getQuestionCount(),
            currentQuestionIndex: this.contentLoader.getCurrentQuestionIndex(),
            nextQuestionIn: Math.max(0, this.gameStateManager.questionInterval - this.gameStateManager.questionTimer),
            config: { ...this.config }
        };
    }

    /**
     * Reset question flow state
     */
    reset() {
        this.questionHistory = [];
        this.isActive = false;
        this.gameStateManager.resetQuestionTimer();
        this.contentLoader.resetQuestionQueue();
        console.log('QuestionFlowManager: Reset complete');
    }

    /**
     * Force trigger a question (for testing or special events)
     */
    forceTriggerQuestion() {
        try {
            if (this.gameStateManager && 
                typeof this.gameStateManager.getCurrentState === 'function' &&
                this.gameStateManager.getCurrentState() === GameStates.PLAYING) {
                this.triggerQuestion();
            } else {
                console.warn('QuestionFlowManager: Cannot force trigger question - not in PLAYING state');
            }
        } catch (error) {
            console.error('QuestionFlowManager: Error force triggering question:', error.message);
        }
    }

    /**
     * Validate a question object
     * @param {Question} question - Question to validate
     * @returns {boolean} - Whether the question is valid
     * @private
     */
    isValidQuestion(question) {
        if (!question || typeof question !== 'object') {
            return false;
        }

        // Check required fields
        if (!question.prompt || typeof question.prompt !== 'string' || question.prompt.trim() === '') {
            return false;
        }

        if (!Array.isArray(question.options) || question.options.length < 2) {
            return false;
        }

        if (!question.answer || typeof question.answer !== 'string' || question.answer.trim() === '') {
            return false;
        }

        if (!question.options.includes(question.answer)) {
            return false;
        }

        return true;
    }

    /**
     * Handle the case when no questions are available
     * @private
     */
    handleNoQuestionsAvailable() {
        try {
            console.warn('QuestionFlowManager: No questions available, attempting to reload');
            
            // Try to reset the question queue
            if (this.contentLoader && typeof this.contentLoader.resetQuestionQueue === 'function') {
                this.contentLoader.resetQuestionQueue();
            }

            // If still no questions, stop the flow
            if (!this.contentLoader.hasQuestions()) {
                console.error('QuestionFlowManager: No questions available after reset, stopping flow');
                this.stop();
                
                // Notify game that we're out of questions
                if (this.gameStateManager && typeof this.gameStateManager.setState === 'function') {
                    this.gameStateManager.setState(GameStates.PLAYING);
                }
            }
        } catch (error) {
            console.error('QuestionFlowManager: Error handling no questions available:', error.message);
            this.stop();
        }
    }

    /**
     * Handle invalid question objects
     * @param {any} question - The invalid question object
     * @private
     */
    handleInvalidQuestion(question) {
        try {
            console.error('QuestionFlowManager: Invalid question received:', question);
            
            // Try to get another question
            const fallbackQuestion = this.getFallbackQuestion();
            if (fallbackQuestion && this.isValidQuestion(fallbackQuestion)) {
                console.log('QuestionFlowManager: Using fallback question');
                this.questionPresenter.displayQuestion(fallbackQuestion);
                return;
            }

            // If no fallback available, continue gameplay
            console.warn('QuestionFlowManager: No fallback question available, continuing gameplay');
            if (this.gameStateManager && typeof this.gameStateManager.setState === 'function') {
                this.gameStateManager.setState(GameStates.PLAYING);
                this.gameStateManager.resetQuestionTimer();
            }
        } catch (error) {
            console.error('QuestionFlowManager: Error handling invalid question:', error.message);
        }
    }

    /**
     * Handle question display errors
     * @param {Error} error - The display error
     * @private
     */
    handleQuestionDisplayError(error) {
        try {
            console.error('QuestionFlowManager: Question display failed, returning to gameplay');
            
            // Reset question state
            if (this.gameStateManager) {
                if (typeof this.gameStateManager.setState === 'function') {
                    this.gameStateManager.setState(GameStates.PLAYING);
                }
                if (typeof this.gameStateManager.resetQuestionTimer === 'function') {
                    this.gameStateManager.resetQuestionTimer();
                }
            }

            // Hide any partially displayed question
            if (this.questionPresenter && typeof this.questionPresenter.forceHide === 'function') {
                this.questionPresenter.forceHide();
            }
        } catch (recoveryError) {
            console.error('QuestionFlowManager: Error during question display error recovery:', recoveryError.message);
        }
    }

    /**
     * Handle critical question errors
     * @param {Error} error - The critical error
     * @private
     */
    handleCriticalQuestionError(error) {
        try {
            console.error('QuestionFlowManager: Critical question error, attempting recovery');
            
            // Stop the question flow
            this.stop();
            
            // Reset to playing state
            if (this.gameStateManager && typeof this.gameStateManager.setState === 'function') {
                this.gameStateManager.setState(GameStates.PLAYING);
            }

            // Hide any question UI
            if (this.questionPresenter && typeof this.questionPresenter.forceHide === 'function') {
                this.questionPresenter.forceHide();
            }

            // Try to restart after a delay
            setTimeout(() => {
                try {
                    console.log('QuestionFlowManager: Attempting to restart question flow');
                    this.start();
                } catch (restartError) {
                    console.error('QuestionFlowManager: Failed to restart question flow:', restartError.message);
                }
            }, 5000);
            
        } catch (criticalRecoveryError) {
            console.error('QuestionFlowManager: Failed to recover from critical error:', criticalRecoveryError.message);
            // At this point, we can only hope the game continues without questions
        }
    }

    /**
     * Get a fallback question when the normal flow fails
     * @returns {Question|null} - A fallback question or null
     * @private
     */
    getFallbackQuestion() {
        try {
            // Try to get the first question from the content loader
            if (this.contentLoader && typeof this.contentLoader.getQuestionByIndex === 'function') {
                return this.contentLoader.getQuestionByIndex(0);
            }
            return null;
        } catch (error) {
            console.warn('QuestionFlowManager: Error getting fallback question:', error.message);
            return null;
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestionFlowManager;
}