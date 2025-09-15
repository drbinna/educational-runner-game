/**
 * Question Type Handler
 * Manages different types of questions and their presentation logic
 */

/**
 * @typedef {Object} QuestionTypeConfig
 * @property {string} type - Question type identifier
 * @property {string} displayName - Human-readable name
 * @property {Function} validator - Function to validate question data
 * @property {Function} renderer - Function to render question UI
 * @property {Function} inputHandler - Function to handle user input
 */

class QuestionTypeHandler {
    constructor() {
        /** @type {Map<string, QuestionTypeConfig>} */
        this.questionTypes = new Map();
        
        this.initializeDefaultTypes();
    }

    /**
     * Initialize default question types
     */
    initializeDefaultTypes() {
        // Multiple Choice Questions
        this.registerQuestionType({
            type: 'multiple_choice',
            displayName: 'Multiple Choice',
            validator: this.validateMultipleChoice.bind(this),
            renderer: this.renderMultipleChoice.bind(this),
            inputHandler: this.handleMultipleChoiceInput.bind(this)
        });

        // True/False Questions
        this.registerQuestionType({
            type: 'true_false',
            displayName: 'True or False',
            validator: this.validateTrueFalse.bind(this),
            renderer: this.renderTrueFalse.bind(this),
            inputHandler: this.handleTrueFalseInput.bind(this)
        });

        // Fill in the Blank Questions
        this.registerQuestionType({
            type: 'fill_blank',
            displayName: 'Fill in the Blank',
            validator: this.validateFillBlank.bind(this),
            renderer: this.renderFillBlank.bind(this),
            inputHandler: this.handleFillBlankInput.bind(this)
        });

        // Matching Questions
        this.registerQuestionType({
            type: 'matching',
            displayName: 'Matching',
            validator: this.validateMatching.bind(this),
            renderer: this.renderMatching.bind(this),
            inputHandler: this.handleMatchingInput.bind(this)
        });
    }

    /**
     * Register a new question type
     * @param {QuestionTypeConfig} config - Question type configuration
     */
    registerQuestionType(config) {
        if (!this.validateQuestionTypeConfig(config)) {
            throw new Error(`Invalid question type configuration: ${config.type}`);
        }
        
        this.questionTypes.set(config.type, config);
        console.log(`Registered question type: ${config.displayName} (${config.type})`);
    }

    /**
     * Validate question type configuration
     * @param {QuestionTypeConfig} config - Configuration to validate
     * @returns {boolean} - Whether configuration is valid
     */
    validateQuestionTypeConfig(config) {
        if (!config || typeof config !== 'object') return false;
        if (!config.type || typeof config.type !== 'string') return false;
        if (!config.displayName || typeof config.displayName !== 'string') return false;
        if (typeof config.validator !== 'function') return false;
        if (typeof config.renderer !== 'function') return false;
        if (typeof config.inputHandler !== 'function') return false;
        
        return true;
    }

    /**
     * Get question type configuration
     * @param {string} type - Question type
     * @returns {QuestionTypeConfig|null} - Configuration or null
     */
    getQuestionType(type) {
        return this.questionTypes.get(type) || null;
    }

    /**
     * Get all supported question types
     * @returns {string[]} - Array of question type identifiers
     */
    getSupportedTypes() {
        return Array.from(this.questionTypes.keys());
    }

    /**
     * Validate a question based on its type
     * @param {Object} question - Question object to validate
     * @returns {{isValid: boolean, errors: string[]}} - Validation result
     */
    validateQuestion(question) {
        if (!question || !question.type) {
            return { isValid: false, errors: ['Question type is required'] };
        }

        const typeConfig = this.getQuestionType(question.type);
        if (!typeConfig) {
            return { isValid: false, errors: [`Unsupported question type: ${question.type}`] };
        }

        return typeConfig.validator(question);
    }

    /**
     * Render a question based on its type
     * @param {Object} question - Question to render
     * @param {Function} kaboomAdd - Kaboom.js add function
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {Object} theme - Current theme
     * @returns {Object[]} - Array of rendered UI elements
     */
    renderQuestion(question, kaboomAdd, width, height, theme) {
        const typeConfig = this.getQuestionType(question.type);
        if (!typeConfig) {
            console.error(`Cannot render unsupported question type: ${question.type}`);
            return [];
        }

        return typeConfig.renderer(question, kaboomAdd, width, height, theme);
    }

    /**
     * Handle input for a question based on its type
     * @param {Object} question - Current question
     * @param {string} input - User input
     * @param {Object} context - Additional context (UI elements, etc.)
     * @returns {{isCorrect: boolean, selectedAnswer: string, feedback: string}} - Input result
     */
    handleInput(question, input, context) {
        const typeConfig = this.getQuestionType(question.type);
        if (!typeConfig) {
            console.error(`Cannot handle input for unsupported question type: ${question.type}`);
            return { isCorrect: false, selectedAnswer: input, feedback: 'Unsupported question type' };
        }

        return typeConfig.inputHandler(question, input, context);
    }

    // Multiple Choice Question Handlers
    validateMultipleChoice(question) {
        const errors = [];
        
        if (!Array.isArray(question.options) || question.options.length < 2) {
            errors.push('Multiple choice questions must have at least 2 options');
        }
        
        if (!question.answer || !question.options.includes(question.answer)) {
            errors.push('Answer must be one of the provided options');
        }
        
        return { isValid: errors.length === 0, errors };
    }

    renderMultipleChoice(question, kaboomAdd, width, height, theme) {
        const elements = [];
        const startY = height / 2 - 50;
        
        // Question prompt
        elements.push(kaboomAdd([
            text(question.prompt, { size: 20, width: width - 100 }),
            pos(width / 2, startY - 80),
            origin("center"),
            color(0, 0, 0),
            "question-ui"
        ]));
        
        // Options
        question.options.forEach((option, index) => {
            const yPos = startY + (index * 50);
            const optionKey = (index + 1).toString();
            
            // Option background
            const optionBg = kaboomAdd([
                rect(400, 40),
                pos(width / 2, yPos),
                origin("center"),
                color(220, 220, 220),
                "question-ui",
                "option-button",
                {
                    optionIndex: index,
                    optionText: option,
                    isSelected: false
                }
            ]);
            
            // Option text
            const optionText = kaboomAdd([
                text(`${optionKey}. ${option}`, { size: 16 }),
                pos(width / 2, yPos),
                origin("center"),
                color(0, 0, 0),
                "question-ui"
            ]);
            
            elements.push(optionBg, optionText);
        });
        
        return elements;
    }

    handleMultipleChoiceInput(question, input, context) {
        const selectedIndex = parseInt(input) - 1;
        
        if (selectedIndex < 0 || selectedIndex >= question.options.length) {
            return { isCorrect: false, selectedAnswer: input, feedback: 'Invalid selection' };
        }
        
        const selectedAnswer = question.options[selectedIndex];
        const isCorrect = selectedAnswer === question.answer;
        
        return {
            isCorrect,
            selectedAnswer,
            feedback: isCorrect ? question.feedback : `Incorrect. The correct answer is: ${question.answer}`
        };
    }

    // True/False Question Handlers
    validateTrueFalse(question) {
        const errors = [];
        
        if (!question.answer || !['true', 'false', 'True', 'False'].includes(question.answer)) {
            errors.push('True/False questions must have answer as "true" or "false"');
        }
        
        return { isValid: errors.length === 0, errors };
    }

    renderTrueFalse(question, kaboomAdd, width, height, theme) {
        const elements = [];
        const startY = height / 2;
        
        // Question prompt
        elements.push(kaboomAdd([
            text(question.prompt, { size: 20, width: width - 100 }),
            pos(width / 2, startY - 80),
            origin("center"),
            color(0, 0, 0),
            "question-ui"
        ]));
        
        // True button
        const trueButton = kaboomAdd([
            rect(150, 50),
            pos(width / 2 - 100, startY),
            origin("center"),
            color(100, 200, 100),
            "question-ui",
            "option-button",
            {
                optionIndex: 0,
                optionText: 'True',
                isSelected: false
            }
        ]);
        
        const trueText = kaboomAdd([
            text("1. True", { size: 18 }),
            pos(width / 2 - 100, startY),
            origin("center"),
            color(0, 0, 0),
            "question-ui"
        ]);
        
        // False button
        const falseButton = kaboomAdd([
            rect(150, 50),
            pos(width / 2 + 100, startY),
            origin("center"),
            color(200, 100, 100),
            "question-ui",
            "option-button",
            {
                optionIndex: 1,
                optionText: 'False',
                isSelected: false
            }
        ]);
        
        const falseText = kaboomAdd([
            text("2. False", { size: 18 }),
            pos(width / 2 + 100, startY),
            origin("center"),
            color(0, 0, 0),
            "question-ui"
        ]);
        
        elements.push(trueButton, trueText, falseButton, falseText);
        return elements;
    }

    handleTrueFalseInput(question, input, context) {
        let selectedAnswer;
        
        if (input === '1' || input.toLowerCase() === 'true') {
            selectedAnswer = 'True';
        } else if (input === '2' || input.toLowerCase() === 'false') {
            selectedAnswer = 'False';
        } else {
            return { isCorrect: false, selectedAnswer: input, feedback: 'Invalid selection. Choose 1 for True or 2 for False.' };
        }
        
        const isCorrect = selectedAnswer.toLowerCase() === question.answer.toLowerCase();
        
        return {
            isCorrect,
            selectedAnswer,
            feedback: isCorrect ? question.feedback : `Incorrect. The correct answer is: ${question.answer}`
        };
    }

    // Fill in the Blank Question Handlers
    validateFillBlank(question) {
        const errors = [];
        
        if (!question.prompt || !question.prompt.includes('_____')) {
            errors.push('Fill in the blank questions must contain "_____" placeholder in the prompt');
        }
        
        if (!question.answer || typeof question.answer !== 'string') {
            errors.push('Fill in the blank questions must have a string answer');
        }
        
        return { isValid: errors.length === 0, errors };
    }

    renderFillBlank(question, kaboomAdd, width, height, theme) {
        const elements = [];
        const startY = height / 2;
        
        // Question prompt
        elements.push(kaboomAdd([
            text(question.prompt, { size: 20, width: width - 100 }),
            pos(width / 2, startY - 80),
            origin("center"),
            color(0, 0, 0),
            "question-ui"
        ]));
        
        // Input field representation
        const inputField = kaboomAdd([
            rect(300, 40),
            pos(width / 2, startY),
            origin("center"),
            color(255, 255, 255),
            outline(2, rgb(0, 0, 0)),
            "question-ui",
            "input-field",
            {
                currentText: '',
                isActive: true
            }
        ]);
        
        const inputText = kaboomAdd([
            text("Type your answer...", { size: 16 }),
            pos(width / 2, startY),
            origin("center"),
            color(150, 150, 150),
            "question-ui",
            "input-text"
        ]);
        
        // Instructions
        const instructions = kaboomAdd([
            text("Type your answer and press ENTER", { size: 14 }),
            pos(width / 2, startY + 60),
            origin("center"),
            color(100, 100, 100),
            "question-ui"
        ]);
        
        elements.push(inputField, inputText, instructions);
        return elements;
    }

    handleFillBlankInput(question, input, context) {
        if (!input || input.trim() === '') {
            return { isCorrect: false, selectedAnswer: input, feedback: 'Please provide an answer' };
        }
        
        const userAnswer = input.trim().toLowerCase();
        const correctAnswer = question.answer.trim().toLowerCase();
        
        // Allow for some flexibility in answers
        const isCorrect = userAnswer === correctAnswer || 
                         this.isAnswerSimilar(userAnswer, correctAnswer);
        
        return {
            isCorrect,
            selectedAnswer: input.trim(),
            feedback: isCorrect ? question.feedback : `Incorrect. The correct answer is: ${question.answer}`
        };
    }

    // Matching Question Handlers
    validateMatching(question) {
        const errors = [];
        
        if (!question.pairs || !Array.isArray(question.pairs)) {
            errors.push('Matching questions must have a "pairs" array');
        } else if (question.pairs.length < 2) {
            errors.push('Matching questions must have at least 2 pairs');
        } else {
            // Validate each pair
            question.pairs.forEach((pair, index) => {
                if (!pair.left || !pair.right) {
                    errors.push(`Pair ${index + 1} must have both "left" and "right" values`);
                }
            });
        }
        
        return { isValid: errors.length === 0, errors };
    }

    renderMatching(question, kaboomAdd, width, height, theme) {
        const elements = [];
        const startY = height / 2 - 100;
        
        // Question prompt
        elements.push(kaboomAdd([
            text(question.prompt || "Match the items:", { size: 20 }),
            pos(width / 2, startY - 40),
            origin("center"),
            color(0, 0, 0),
            "question-ui"
        ]));
        
        // Render pairs (simplified for this implementation)
        question.pairs.forEach((pair, index) => {
            const yPos = startY + (index * 40);
            
            // Left item
            elements.push(kaboomAdd([
                text(`${index + 1}. ${pair.left}`, { size: 16 }),
                pos(width / 2 - 150, yPos),
                origin("left"),
                color(0, 0, 0),
                "question-ui"
            ]));
            
            // Right item (shuffled in real implementation)
            elements.push(kaboomAdd([
                text(`${pair.right}`, { size: 16 }),
                pos(width / 2 + 50, yPos),
                origin("left"),
                color(0, 0, 0),
                "question-ui"
            ]));
        });
        
        // Instructions
        elements.push(kaboomAdd([
            text("Press ENTER when ready (simplified matching)", { size: 14 }),
            pos(width / 2, startY + (question.pairs.length * 40) + 20),
            origin("center"),
            color(100, 100, 100),
            "question-ui"
        ]));
        
        return elements;
    }

    handleMatchingInput(question, input, context) {
        // Simplified matching - in a real implementation, this would handle
        // complex matching logic with drag-and-drop or selection
        return {
            isCorrect: true, // Simplified for demo
            selectedAnswer: 'Matched',
            feedback: question.feedback || 'Great job matching!'
        };
    }

    /**
     * Check if two answers are similar (for fill-in-the-blank flexibility)
     * @param {string} userAnswer - User's answer
     * @param {string} correctAnswer - Correct answer
     * @returns {boolean} - Whether answers are similar enough
     */
    isAnswerSimilar(userAnswer, correctAnswer) {
        // Simple similarity check - can be enhanced with more sophisticated algorithms
        const similarity = this.calculateSimilarity(userAnswer, correctAnswer);
        return similarity > 0.8; // 80% similarity threshold
    }

    /**
     * Calculate similarity between two strings
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} - Similarity score (0-1)
     */
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    /**
     * Calculate Levenshtein distance between two strings
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} - Edit distance
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestionTypeHandler;
}