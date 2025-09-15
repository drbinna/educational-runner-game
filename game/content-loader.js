/**
 * @typedef {Object} Question
 * @property {string} id - Unique identifier for the question
 * @property {string} type - Type of question (e.g., "multiple_choice")
 * @property {string} prompt - The question text
 * @property {string[]} options - Array of answer options
 * @property {string} answer - The correct answer
 * @property {string} feedback - Explanation for the correct answer
 * @property {number} [difficulty] - Difficulty level (1-5)
 * @property {string} [subject] - Subject area (e.g., "math", "science")
 * @property {string} [topic] - Specific topic within subject
 */

/**
 * @typedef {Object} QuestionSet
 * @property {Question[]} questions - Array of questions
 * @property {Object} metadata - Metadata about the question set
 * @property {string} metadata.title - Title of the question set
 * @property {string} metadata.description - Description of the question set
 * @property {string} metadata.version - Version of the question set
 * @property {string} metadata.author - Author of the question set
 */

/**
 * ContentLoader class handles loading and managing educational content from JSON files
 */
class ContentLoader {
    constructor(subjectConfigManager = null, questionTypeHandler = null) {
        /** @type {Question[]} */
        this.questions = [];
        /** @type {Object} */
        this.metadata = {};
        /** @type {number} */
        this.currentQuestionIndex = 0;
        /** @type {SubjectConfigManager} */
        this.subjectConfigManager = subjectConfigManager;
        /** @type {QuestionTypeHandler} */
        this.questionTypeHandler = questionTypeHandler;
    }

    /**
     * Load questions from current subject or specified JSON file
     * @param {string} jsonPath - Path to the JSON file (optional, uses current subject if not provided)
     * @returns {Promise<{success: boolean, error?: string}>} - Result with success status and optional error message
     */
    async loadQuestions(jsonPath = null) {
        // Use current subject's data file if no path specified
        if (!jsonPath && this.subjectConfigManager) {
            jsonPath = this.subjectConfigManager.getCurrentDataFile();
        }
        
        if (!jsonPath) {
            return { success: false, error: 'No question file specified and no current subject set' };
        }
        try {
            // Validate input
            if (!jsonPath || typeof jsonPath !== 'string') {
                throw new Error('Invalid JSON path provided');
            }

            const response = await fetch(jsonPath);
            
            // Handle network errors
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Question file not found: ${jsonPath}`);
                } else if (response.status >= 500) {
                    throw new Error(`Server error loading questions: ${response.status}`);
                } else {
                    throw new Error(`Failed to load questions: ${response.status} ${response.statusText}`);
                }
            }
            
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                throw new Error(`Invalid JSON format in file: ${jsonPath}. ${parseError.message}`);
            }
            
            const validationResult = this.validateQuestionFormat(data);
            if (!validationResult.isValid) {
                throw new Error(`Invalid question format: ${validationResult.errors.join(', ')}`);
            }
            
            // Additional validation using question type handler if available
            if (this.questionTypeHandler) {
                const typeValidationErrors = [];
                data.questions.forEach((question, index) => {
                    const typeValidation = this.questionTypeHandler.validateQuestion(question);
                    if (!typeValidation.isValid) {
                        typeValidationErrors.push(`Question ${index + 1}: ${typeValidation.errors.join(', ')}`);
                    }
                });
                
                if (typeValidationErrors.length > 0) {
                    throw new Error(`Question type validation failed: ${typeValidationErrors.join('; ')}`);
                }
            }
            
            this.questions = data.questions || [];
            this.metadata = data.metadata || {};
            this.currentQuestionIndex = 0;
            
            console.log(`Successfully loaded ${this.questions.length} questions from ${jsonPath}`);
            return { success: true };
            
        } catch (error) {
            const errorMessage = error.message || 'Unknown error occurred while loading questions';
            console.error('Error loading questions:', errorMessage);
            
            // Reset state on error
            this.questions = [];
            this.metadata = {};
            this.currentQuestionIndex = 0;
            
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Validate the format of loaded questions
     * @param {Object} data - The loaded JSON data
     * @returns {{isValid: boolean, errors: string[]}} - Validation result with detailed errors
     */
    validateQuestionFormat(data) {
        const errors = [];

        // Check if data exists
        if (!data) {
            errors.push('No data provided');
            return { isValid: false, errors };
        }

        // Check if questions array exists
        if (!data.questions) {
            errors.push('Missing "questions" property');
            return { isValid: false, errors };
        }

        if (!Array.isArray(data.questions)) {
            errors.push('"questions" must be an array');
            return { isValid: false, errors };
        }

        // Check if there are any questions
        if (data.questions.length === 0) {
            errors.push('Questions array is empty');
            return { isValid: false, errors };
        }

        // Validate each question
        data.questions.forEach((question, index) => {
            const questionErrors = this._validateSingleQuestion(question, index);
            errors.push(...questionErrors);
        });

        return { isValid: errors.length === 0, errors };
    }

    /**
     * Validate a single question object
     * @param {Object} question - The question to validate
     * @param {number} index - The index of the question in the array
     * @returns {string[]} - Array of validation errors
     * @private
     */
    _validateSingleQuestion(question, index) {
        const errors = [];
        const questionPrefix = `Question ${index + 1}`;

        try {
            // Validate question object structure
            if (!question || typeof question !== 'object') {
                errors.push(`${questionPrefix}: Invalid question object`);
                return errors;
            }

            // Check and sanitize required fields
            if (!question.prompt || typeof question.prompt !== 'string' || question.prompt.trim() === '') {
                errors.push(`${questionPrefix}: Missing or empty "prompt" field`);
            } else {
                // Sanitize prompt
                const sanitizedPrompt = this._sanitizeText(question.prompt);
                if (!sanitizedPrompt) {
                    errors.push(`${questionPrefix}: Prompt contains invalid content`);
                } else if (sanitizedPrompt.length > 500) {
                    errors.push(`${questionPrefix}: Prompt is too long (max 500 characters)`);
                }
            }

            if (!Array.isArray(question.options)) {
                errors.push(`${questionPrefix}: "options" must be an array`);
            } else if (question.options.length < 2) {
                errors.push(`${questionPrefix}: Must have at least 2 options`);
            } else if (question.options.length > 10) {
                errors.push(`${questionPrefix}: Too many options (max 10)`);
            } else {
                // Check that all options are non-empty strings and sanitize them
                const sanitizedOptions = [];
                question.options.forEach((option, optionIndex) => {
                    if (!option || typeof option !== 'string' || option.trim() === '') {
                        errors.push(`${questionPrefix}: Option ${optionIndex + 1} is empty or invalid`);
                    } else {
                        const sanitizedOption = this._sanitizeText(option);
                        if (!sanitizedOption) {
                            errors.push(`${questionPrefix}: Option ${optionIndex + 1} contains invalid content`);
                        } else if (sanitizedOption.length > 200) {
                            errors.push(`${questionPrefix}: Option ${optionIndex + 1} is too long (max 200 characters)`);
                        } else {
                            sanitizedOptions.push(sanitizedOption);
                        }
                    }
                });

                // Check for duplicate options
                const uniqueOptions = new Set(sanitizedOptions);
                if (uniqueOptions.size !== sanitizedOptions.length) {
                    errors.push(`${questionPrefix}: Contains duplicate options`);
                }
            }

            if (!question.answer || typeof question.answer !== 'string' || question.answer.trim() === '') {
                errors.push(`${questionPrefix}: Missing or empty "answer" field`);
            } else {
                const sanitizedAnswer = this._sanitizeText(question.answer);
                if (!sanitizedAnswer) {
                    errors.push(`${questionPrefix}: Answer contains invalid content`);
                } else if (Array.isArray(question.options) && !question.options.includes(question.answer)) {
                    errors.push(`${questionPrefix}: Answer "${question.answer}" is not in the options list`);
                }
            }

            if (!question.feedback || typeof question.feedback !== 'string' || question.feedback.trim() === '') {
                errors.push(`${questionPrefix}: Missing or empty "feedback" field`);
            } else {
                const sanitizedFeedback = this._sanitizeText(question.feedback);
                if (!sanitizedFeedback) {
                    errors.push(`${questionPrefix}: Feedback contains invalid content`);
                } else if (sanitizedFeedback.length > 1000) {
                    errors.push(`${questionPrefix}: Feedback is too long (max 1000 characters)`);
                }
            }

            // Optional field validation with sanitization
            if (question.type !== undefined) {
                if (typeof question.type !== 'string') {
                    errors.push(`${questionPrefix}: "type" must be a string`);
                } else {
                    const sanitizedType = this._sanitizeText(question.type);
                    if (!sanitizedType || sanitizedType.length > 50) {
                        errors.push(`${questionPrefix}: Invalid or too long "type" field`);
                    }
                }
            }

            if (question.difficulty !== undefined) {
                if (!Number.isInteger(question.difficulty) || question.difficulty < 1 || question.difficulty > 5) {
                    errors.push(`${questionPrefix}: "difficulty" must be an integer between 1 and 5`);
                }
            }

            if (question.subject !== undefined) {
                if (typeof question.subject !== 'string') {
                    errors.push(`${questionPrefix}: "subject" must be a string`);
                } else {
                    const sanitizedSubject = this._sanitizeText(question.subject);
                    if (!sanitizedSubject || sanitizedSubject.length > 50) {
                        errors.push(`${questionPrefix}: Invalid or too long "subject" field`);
                    }
                }
            }

            if (question.topic !== undefined) {
                if (typeof question.topic !== 'string') {
                    errors.push(`${questionPrefix}: "topic" must be a string`);
                } else {
                    const sanitizedTopic = this._sanitizeText(question.topic);
                    if (!sanitizedTopic || sanitizedTopic.length > 50) {
                        errors.push(`${questionPrefix}: Invalid or too long "topic" field`);
                    }
                }
            }

            // Check for required ID field
            if (question.id !== undefined) {
                if (typeof question.id !== 'string' || question.id.trim() === '') {
                    errors.push(`${questionPrefix}: "id" must be a non-empty string`);
                } else if (question.id.length > 100) {
                    errors.push(`${questionPrefix}: "id" is too long (max 100 characters)`);
                }
            }

        } catch (validationError) {
            errors.push(`${questionPrefix}: Error during validation - ${validationError.message}`);
        }

        return errors;
    }

    /**
     * Sanitize text content to prevent XSS and ensure safe display
     * @param {string} text - Text to sanitize
     * @returns {string} - Sanitized text or empty string if invalid
     * @private
     */
    _sanitizeText(text) {
        try {
            if (typeof text !== 'string') {
                return '';
            }

            // Remove potentially dangerous content
            let sanitized = text
                .replace(/[<>]/g, '') // Remove angle brackets
                .replace(/javascript:/gi, '') // Remove javascript: protocol
                .replace(/on\w+=/gi, '') // Remove event handlers
                .replace(/data:/gi, '') // Remove data: protocol
                .replace(/vbscript:/gi, '') // Remove vbscript: protocol
                .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
                .trim();

            // Ensure reasonable length
            if (sanitized.length === 0) {
                return '';
            }

            return sanitized;
        } catch (sanitizeError) {
            console.warn('ContentLoader: Error sanitizing text:', sanitizeError.message);
            return '';
        }
    }

    /**
     * Get the next question in the queue
     * @returns {Question|null} - The next question or null if none available
     */
    getNextQuestion() {
        try {
            if (!Array.isArray(this.questions) || this.questions.length === 0) {
                console.warn('ContentLoader: No questions available');
                return this._getFallbackQuestion();
            }

            // Validate current question index
            if (typeof this.currentQuestionIndex !== 'number' || 
                this.currentQuestionIndex < 0 || 
                this.currentQuestionIndex >= this.questions.length) {
                console.warn('ContentLoader: Invalid question index, resetting to 0');
                this.currentQuestionIndex = 0;
            }

            const question = this.questions[this.currentQuestionIndex];
            
            // Validate the question before returning it
            if (!this._isValidQuestionObject(question)) {
                console.warn(`ContentLoader: Invalid question at index ${this.currentQuestionIndex}, trying next`);
                
                // Try to find a valid question
                const validQuestion = this._findNextValidQuestion();
                if (validQuestion) {
                    return validQuestion;
                }
                
                // If no valid questions found, return fallback
                return this._getFallbackQuestion();
            }

            // Advance to next question
            this.currentQuestionIndex = (this.currentQuestionIndex + 1) % this.questions.length;
            
            return question;
            
        } catch (error) {
            console.error('ContentLoader: Error getting next question:', error.message);
            return this._getFallbackQuestion();
        }
    }

    /**
     * Find the next valid question in the array
     * @returns {Question|null} - Next valid question or null
     * @private
     */
    _findNextValidQuestion() {
        try {
            const startIndex = this.currentQuestionIndex;
            let attempts = 0;
            const maxAttempts = this.questions.length;

            while (attempts < maxAttempts) {
                const question = this.questions[this.currentQuestionIndex];
                
                if (this._isValidQuestionObject(question)) {
                    return question;
                }

                this.currentQuestionIndex = (this.currentQuestionIndex + 1) % this.questions.length;
                attempts++;

                // Prevent infinite loop
                if (this.currentQuestionIndex === startIndex && attempts > 0) {
                    break;
                }
            }

            return null;
        } catch (error) {
            console.error('ContentLoader: Error finding valid question:', error.message);
            return null;
        }
    }

    /**
     * Validate a question object for runtime use
     * @param {Question} question - Question to validate
     * @returns {boolean} - Whether the question is valid
     * @private
     */
    _isValidQuestionObject(question) {
        try {
            if (!question || typeof question !== 'object') {
                return false;
            }

            // Check essential fields
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

            if (!question.feedback || typeof question.feedback !== 'string') {
                return false;
            }

            return true;
        } catch (error) {
            console.warn('ContentLoader: Error validating question object:', error.message);
            return false;
        }
    }

    /**
     * Get a fallback question when normal questions are not available
     * @returns {Question} - A basic fallback question
     * @private
     */
    _getFallbackQuestion() {
        try {
            console.log('ContentLoader: Using fallback question');
            
            return {
                id: 'fallback-001',
                type: 'multiple_choice',
                prompt: 'What is 2 + 2?',
                options: ['3', '4', '5', '6'],
                answer: '4',
                feedback: 'Correct! 2 + 2 = 4. This is a basic addition problem.',
                difficulty: 1,
                subject: 'math',
                topic: 'addition'
            };
        } catch (error) {
            console.error('ContentLoader: Error creating fallback question:', error.message);
            
            // Last resort fallback
            return {
                id: 'emergency-fallback',
                prompt: 'Continue playing?',
                options: ['Yes', 'No'],
                answer: 'Yes',
                feedback: 'Great! Keep learning!'
            };
        }
    }

    /**
     * Reset the question queue to the beginning
     */
    resetQuestionQueue() {
        this.currentQuestionIndex = 0;
    }

    /**
     * Get the total number of questions
     * @returns {number} - Total question count
     */
    getQuestionCount() {
        return this.questions.length;
    }

    /**
     * Check if questions are loaded
     * @returns {boolean} - Whether questions are available
     */
    hasQuestions() {
        return this.questions.length > 0;
    }

    /**
     * Get a specific question by index
     * @param {number} index - The question index
     * @returns {Question|null} - The question or null if index is invalid
     */
    getQuestionByIndex(index) {
        if (index < 0 || index >= this.questions.length) {
            return null;
        }
        return this.questions[index];
    }

    /**
     * Get current question index
     * @returns {number} - Current question index
     */
    getCurrentQuestionIndex() {
        return this.currentQuestionIndex;
    }

    /**
     * Get metadata about the loaded question set
     * @returns {Object} - Metadata object
     */
    getMetadata() {
        return { ...this.metadata };
    }

    /**
     * Load questions for a specific subject
     * @param {string} subjectId - Subject identifier
     * @returns {Promise<{success: boolean, error?: string}>} - Result with success status and optional error message
     */
    async loadQuestionsForSubject(subjectId) {
        if (!this.subjectConfigManager) {
            return { success: false, error: 'Subject configuration manager not available' };
        }
        
        const subject = this.subjectConfigManager.getSubject(subjectId);
        if (!subject) {
            return { success: false, error: `Subject not found: ${subjectId}` };
        }
        
        // Set the current subject
        this.subjectConfigManager.setCurrentSubject(subjectId);
        
        // Load questions from the subject's data file
        return await this.loadQuestions(subject.dataFile);
    }

    /**
     * Get questions filtered by type (if question type handler is available)
     * @param {string} questionType - Type of questions to filter
     * @returns {Question[]} - Filtered questions
     */
    getQuestionsByType(questionType) {
        if (!this.questionTypeHandler) {
            console.warn('Question type handler not available for filtering');
            return this.questions;
        }
        
        return this.questions.filter(question => question.type === questionType);
    }

    /**
     * Get supported question types for current questions
     * @returns {string[]} - Array of question types found in current questions
     */
    getAvailableQuestionTypes() {
        const types = new Set();
        this.questions.forEach(question => {
            if (question.type) {
                types.add(question.type);
            }
        });
        return Array.from(types);
    }

    /**
     * Clear all loaded questions and reset state
     */
    clear() {
        this.questions = [];
        this.metadata = {};
        this.currentQuestionIndex = 0;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentLoader;
}