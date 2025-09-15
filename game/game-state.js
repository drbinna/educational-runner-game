/**
 * @typedef {Object} PlayerPosition
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */

/**
 * @typedef {Object} GameState
 * @property {number} score - Current player score
 * @property {number} lives - Remaining lives
 * @property {number} currentQuestionIndex - Index of current question
 * @property {number} questionsAnswered - Total questions answered
 * @property {number} correctAnswers - Number of correct answers
 * @property {number} gameTime - Total game time in seconds
 * @property {PlayerPosition} playerPosition - Player's current position
 * @property {number} gameSpeed - Current game speed multiplier
 */

/**
 * Game state enumeration
 * @readonly
 * @enum {string}
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
 * GameStateManager class handles all game state management and coordination
 */
class GameStateManager {
    constructor() {
        /** @type {string} */
        this.currentState = GameStates.MENU;
        
        /** @type {GameState} */
        this.gameState = {
            score: 0,
            lives: 3,
            currentQuestionIndex: 0,
            questionsAnswered: 0,
            correctAnswers: 0,
            gameTime: 0,
            playerPosition: { x: 100, y: 300 },
            gameSpeed: 1.0
        };

        /** @type {number} */
        this.questionTimer = 0;
        
        /** @type {number} */
        this.questionInterval = this.getRandomQuestionInterval(); // Random 5-10 seconds between questions
        
        /** @type {boolean} */
        this.questionPending = false;
        
        /** @type {Function[]} */
        this.stateChangeListeners = [];
    }

    /**
     * Set the current game state
     * @param {string} newState - The new state to transition to
     */
    setState(newState) {
        try {
            // Validate input
            if (!newState || typeof newState !== 'string') {
                throw new Error(`Invalid state type: expected string, got ${typeof newState}`);
            }

            if (!Object.values(GameStates).includes(newState)) {
                throw new Error(`Invalid game state: ${newState}. Valid states: ${Object.values(GameStates).join(', ')}`);
            }

            const previousState = this.currentState;
            this.currentState = newState;
            
            // Safely notify listeners of state change
            this.stateChangeListeners.forEach((listener, index) => {
                try {
                    if (typeof listener === 'function') {
                        listener(newState, previousState);
                    } else {
                        console.warn(`GameStateManager: Invalid listener at index ${index}, expected function`);
                    }
                } catch (listenerError) {
                    console.error(`GameStateManager: Error in state change listener ${index}:`, listenerError.message);
                    // Continue with other listeners even if one fails
                }
            });
        } catch (error) {
            console.error(`GameStateManager: Failed to set state to "${newState}":`, error.message);
            // Don't change state if there's an error
        }
    }

    /**
     * Get the current game state
     * @returns {string} - Current state
     */
    getCurrentState() {
        return this.currentState;
    }

    /**
     * Update the player's score
     * @param {number} points - Points to add (can be negative)
     */
    updateScore(points) {
        try {
            // Validate input
            if (typeof points !== 'number' || isNaN(points)) {
                throw new Error(`Invalid points value: expected number, got ${typeof points}`);
            }

            if (!isFinite(points)) {
                throw new Error('Points value must be finite');
            }

            const newScore = this.gameState.score + points;
            
            // Ensure score doesn't go below 0 or exceed reasonable limits
            this.gameState.score = Math.max(0, Math.min(newScore, 999999));
            
        } catch (error) {
            console.error(`GameStateManager: Failed to update score with ${points} points:`, error.message);
            // Score remains unchanged on error
        }
    }

    /**
     * Decrement player lives
     * @returns {boolean} - Whether the player still has lives remaining
     */
    decrementLives() {
        this.gameState.lives = Math.max(0, this.gameState.lives - 1);
        return this.gameState.lives > 0;
    }

    /**
     * Update game time
     * @param {number} deltaTime - Time elapsed since last update (in milliseconds)
     */
    updateGameTime(deltaTime) {
        try {
            // Validate input
            if (typeof deltaTime !== 'number' || isNaN(deltaTime)) {
                throw new Error(`Invalid deltaTime: expected number, got ${typeof deltaTime}`);
            }

            if (deltaTime < 0) {
                throw new Error('deltaTime cannot be negative');
            }

            if (!isFinite(deltaTime)) {
                throw new Error('deltaTime must be finite');
            }

            // Prevent extremely large time jumps that could break the game
            const maxDeltaTime = 1000; // 1 second max
            const safeDeltaTime = Math.min(deltaTime, maxDeltaTime);

            this.gameState.gameTime += safeDeltaTime;
            
            // Update question timer if in playing state
            if (this.currentState === GameStates.PLAYING) {
                this.questionTimer += safeDeltaTime;
            }
            
        } catch (error) {
            console.error(`GameStateManager: Failed to update game time with deltaTime ${deltaTime}:`, error.message);
            // Time remains unchanged on error
        }
    }

    /**
     * Check if it's time to show a question
     * @returns {boolean} - Whether a question should be triggered
     */
    shouldTriggerQuestion() {
        return this.questionTimer >= this.questionInterval;
    }

    /**
     * Reset the question timer with a new random interval
     */
    resetQuestionTimer() {
        this.questionTimer = 0;
        this.questionInterval = this.getRandomQuestionInterval();
        this.questionPending = false;
    }

    /**
     * Get a random question interval between 5-10 seconds
     * @returns {number} - Random interval in milliseconds
     */
    getRandomQuestionInterval() {
        // Random interval between 5000ms (5s) and 10000ms (10s)
        return Math.floor(Math.random() * 5000) + 5000;
    }

    /**
     * Mark that a question is pending to be shown
     */
    setQuestionPending() {
        this.questionPending = true;
    }

    /**
     * Check if a question is pending
     * @returns {boolean} - Whether a question is pending
     */
    isQuestionPending() {
        return this.questionPending;
    }

    /**
     * Record a question answer
     * @param {boolean} isCorrect - Whether the answer was correct
     */
    recordAnswer(isCorrect) {
        try {
            // Validate input
            if (typeof isCorrect !== 'boolean') {
                throw new Error(`Invalid isCorrect value: expected boolean, got ${typeof isCorrect}`);
            }

            // Safely increment questions answered
            this.gameState.questionsAnswered = Math.max(0, this.gameState.questionsAnswered + 1);
            
            if (isCorrect) {
                this.gameState.correctAnswers = Math.max(0, this.gameState.correctAnswers + 1);
                
                // Award more points for consecutive correct answers
                const consecutiveBonus = Math.min(this.getConsecutiveCorrect() * 10, 50);
                this.updateScore(100 + consecutiveBonus);
            } else {
                // Penalty for incorrect answers, but don't go below 0
                this.updateScore(-50);
                // Reset consecutive correct streak
                this.consecutiveCorrect = 0;
            }
            
        } catch (error) {
            console.error(`GameStateManager: Failed to record answer (isCorrect: ${isCorrect}):`, error.message);
            // Answer recording fails silently to prevent game disruption
        }
    }

    /**
     * Get the number of consecutive correct answers
     * @returns {number} - Number of consecutive correct answers
     */
    getConsecutiveCorrect() {
        if (!this.consecutiveCorrect) {
            this.consecutiveCorrect = 0;
        }
        
        if (this.gameState.questionsAnswered > 0) {
            // Calculate consecutive correct from recent answers
            this.consecutiveCorrect++;
        }
        
        return this.consecutiveCorrect;
    }

    /**
     * Reset the game to initial state
     */
    resetGame() {
        this.gameState = {
            score: 0,
            lives: 3,
            currentQuestionIndex: 0,
            questionsAnswered: 0,
            correctAnswers: 0,
            gameTime: 0,
            playerPosition: { x: 100, y: 300 },
            gameSpeed: 1.0
        };
        
        this.questionTimer = 0;
        this.currentState = GameStates.MENU;
    }

    /**
     * Add a listener for state changes
     * @param {Function} listener - Function to call when state changes
     */
    addStateChangeListener(listener) {
        this.stateChangeListeners.push(listener);
    }

    /**
     * Remove a state change listener
     * @param {Function} listener - Function to remove
     */
    removeStateChangeListener(listener) {
        const index = this.stateChangeListeners.indexOf(listener);
        if (index > -1) {
            this.stateChangeListeners.splice(index, 1);
        }
    }

    /**
     * Get current game statistics
     * @returns {Object} - Game statistics
     */
    getGameStats() {
        const accuracy = this.gameState.questionsAnswered > 0 
            ? (this.gameState.correctAnswers / this.gameState.questionsAnswered) * 100 
            : 0;
            
        return {
            score: this.gameState.score,
            lives: this.gameState.lives,
            questionsAnswered: this.gameState.questionsAnswered,
            correctAnswers: this.gameState.correctAnswers,
            accuracy: Math.round(accuracy),
            gameTime: Math.round(this.gameState.gameTime / 1000), // Convert to seconds
            consecutiveCorrect: this.getConsecutiveCorrect()
        };
    }

    /**
     * Get feedback message based on current performance
     * @returns {string} - Encouraging feedback message
     */
    getPerformanceFeedback() {
        const stats = this.getGameStats();
        
        if (stats.accuracy >= 90) {
            return "Excellent work! You're mastering these concepts!";
        } else if (stats.accuracy >= 75) {
            return "Great job! Keep up the good work!";
        } else if (stats.accuracy >= 60) {
            return "Good effort! You're improving!";
        } else if (stats.questionsAnswered > 0) {
            return "Keep trying! Practice makes perfect!";
        } else {
            return "Let's start learning!";
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameStateManager, GameStates };
}