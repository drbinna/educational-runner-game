/**
 * Subject Configuration System
 * Handles subject-specific settings, themes, and question type support
 */

/**
 * @typedef {Object} SubjectTheme
 * @property {string} primaryColor - Primary theme color
 * @property {string} secondaryColor - Secondary theme color
 * @property {string} backgroundColor - Background color
 * @property {string} textColor - Text color
 * @property {string} correctColor - Color for correct answers
 * @property {string} incorrectColor - Color for incorrect answers
 * @property {string} fontFamily - Font family for the subject
 */

/**
 * @typedef {Object} SubjectConfig
 * @property {string} id - Unique subject identifier
 * @property {string} name - Display name
 * @property {string} description - Subject description
 * @property {string} dataFile - Path to question data file
 * @property {SubjectTheme} theme - Visual theme configuration
 * @property {string[]} supportedQuestionTypes - Supported question types
 * @property {Object} customSettings - Subject-specific settings
 */

class SubjectConfigManager {
    constructor() {
        /** @type {Map<string, SubjectConfig>} */
        this.subjects = new Map();
        /** @type {string} */
        this.currentSubjectId = null;
        /** @type {SubjectConfig} */
        this.currentSubject = null;
        
        this.initializeDefaultSubjects();
    }

    /**
     * Initialize default subject configurations
     */
    initializeDefaultSubjects() {
        // Math subject configuration
        this.registerSubject({
            id: 'math',
            name: 'Mathematics',
            description: 'Basic arithmetic and mathematical concepts',
            dataFile: 'data/math-basic.json',
            theme: {
                primaryColor: '#2E86AB',
                secondaryColor: '#A23B72',
                backgroundColor: '#F18F01',
                textColor: '#0F0F0F',
                correctColor: '#06D6A0',
                incorrectColor: '#EF476F',
                fontFamily: 'Arial, sans-serif'
            },
            supportedQuestionTypes: ['multiple_choice', 'true_false', 'fill_blank'],
            customSettings: {
                showWorkingSteps: true,
                allowCalculator: false,
                timeLimit: 30
            }
        });

        // Science subject configuration
        this.registerSubject({
            id: 'science',
            name: 'Science',
            description: 'Basic science concepts and facts',
            dataFile: 'data/science-basic.json',
            theme: {
                primaryColor: '#118AB2',
                secondaryColor: '#073B4C',
                backgroundColor: '#06D6A0',
                textColor: '#0F0F0F',
                correctColor: '#06D6A0',
                incorrectColor: '#EF476F',
                fontFamily: 'Arial, sans-serif'
            },
            supportedQuestionTypes: ['multiple_choice', 'true_false', 'matching'],
            customSettings: {
                showDiagrams: true,
                allowHints: true,
                timeLimit: 45
            }
        });

        // Vocabulary subject configuration
        this.registerSubject({
            id: 'vocabulary',
            name: 'Vocabulary',
            description: 'Word definitions and language skills',
            dataFile: 'data/vocabulary-basic.json',
            theme: {
                primaryColor: '#7209B7',
                secondaryColor: '#560BAD',
                backgroundColor: '#F72585',
                textColor: '#FFFFFF',
                correctColor: '#06D6A0',
                incorrectColor: '#EF476F',
                fontFamily: 'Georgia, serif'
            },
            supportedQuestionTypes: ['multiple_choice', 'fill_blank', 'matching'],
            customSettings: {
                showPronunciation: true,
                allowDefinitionHints: true,
                timeLimit: 25
            }
        });

        // Set default subject
        this.setCurrentSubject('math');
    }

    /**
     * Register a new subject configuration
     * @param {SubjectConfig} config - Subject configuration
     */
    registerSubject(config) {
        if (!this.validateSubjectConfig(config)) {
            throw new Error(`Invalid subject configuration for ${config.id}`);
        }
        
        this.subjects.set(config.id, config);
        console.log(`Registered subject: ${config.name} (${config.id})`);
    }

    /**
     * Validate subject configuration
     * @param {SubjectConfig} config - Configuration to validate
     * @returns {boolean} - Whether configuration is valid
     */
    validateSubjectConfig(config) {
        if (!config || typeof config !== 'object') return false;
        if (!config.id || typeof config.id !== 'string') return false;
        if (!config.name || typeof config.name !== 'string') return false;
        if (!config.dataFile || typeof config.dataFile !== 'string') return false;
        if (!config.theme || typeof config.theme !== 'object') return false;
        if (!Array.isArray(config.supportedQuestionTypes)) return false;
        
        // Validate theme properties
        const requiredThemeProps = ['primaryColor', 'secondaryColor', 'backgroundColor', 'textColor'];
        for (const prop of requiredThemeProps) {
            if (!config.theme[prop] || typeof config.theme[prop] !== 'string') {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Set the current active subject
     * @param {string} subjectId - Subject ID to activate
     * @returns {boolean} - Whether subject was successfully set
     */
    setCurrentSubject(subjectId) {
        const subject = this.subjects.get(subjectId);
        if (!subject) {
            console.error(`Subject not found: ${subjectId}`);
            return false;
        }
        
        this.currentSubjectId = subjectId;
        this.currentSubject = subject;
        
        console.log(`Switched to subject: ${subject.name}`);
        return true;
    }

    /**
     * Get current subject configuration
     * @returns {SubjectConfig|null} - Current subject config
     */
    getCurrentSubject() {
        return this.currentSubject;
    }

    /**
     * Get all available subjects
     * @returns {SubjectConfig[]} - Array of all subject configurations
     */
    getAllSubjects() {
        return Array.from(this.subjects.values());
    }

    /**
     * Get subject by ID
     * @param {string} subjectId - Subject ID
     * @returns {SubjectConfig|null} - Subject configuration or null
     */
    getSubject(subjectId) {
        return this.subjects.get(subjectId) || null;
    }

    /**
     * Get current subject theme
     * @returns {SubjectTheme|null} - Current theme configuration
     */
    getCurrentTheme() {
        return this.currentSubject ? this.currentSubject.theme : null;
    }

    /**
     * Get current subject's data file path
     * @returns {string|null} - Data file path
     */
    getCurrentDataFile() {
        return this.currentSubject ? this.currentSubject.dataFile : null;
    }

    /**
     * Check if current subject supports a question type
     * @param {string} questionType - Question type to check
     * @returns {boolean} - Whether type is supported
     */
    supportsQuestionType(questionType) {
        if (!this.currentSubject) return false;
        return this.currentSubject.supportedQuestionTypes.includes(questionType);
    }

    /**
     * Get custom settings for current subject
     * @returns {Object} - Custom settings object
     */
    getCurrentCustomSettings() {
        return this.currentSubject ? { ...this.currentSubject.customSettings } : {};
    }

    /**
     * Apply current theme to the game canvas
     * @param {Function} kaboomAdd - Kaboom.js add function
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    applyCurrentTheme(kaboomAdd, width, height) {
        if (!this.currentSubject || !kaboomAdd) return;
        
        const theme = this.currentSubject.theme;
        
        try {
            // Apply background color
            const bgColor = this.hexToRgb(theme.backgroundColor);
            if (bgColor) {
                // Note: Kaboom.js background is set during initialization
                // This method can be used to add themed background elements
                kaboomAdd([
                    rect(width, height),
                    pos(0, 0),
                    color(bgColor.r, bgColor.g, bgColor.b),
                    z(-100), // Behind everything
                    "theme-background"
                ]);
            }
        } catch (error) {
            console.error('Error applying theme:', error.message);
        }
    }

    /**
     * Convert hex color to RGB values
     * @param {string} hex - Hex color string
     * @returns {{r: number, g: number, b: number}|null} - RGB values or null
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
     * Create a subject selection menu
     * @param {Function} kaboomAdd - Kaboom.js add function
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {Function} onSubjectSelect - Callback when subject is selected
     */
    createSubjectSelectionMenu(kaboomAdd, width, height, onSubjectSelect) {
        const subjects = this.getAllSubjects();
        const menuItems = [];
        
        // Title
        const title = kaboomAdd([
            text("Select Subject", { size: 32 }),
            pos(width / 2, 100),
            origin("center"),
            color(0, 0, 0),
            "subject-menu"
        ]);
        menuItems.push(title);
        
        // Subject options
        subjects.forEach((subject, index) => {
            const yPos = 200 + (index * 80);
            
            // Subject button background
            const buttonBg = kaboomAdd([
                rect(300, 60),
                pos(width / 2, yPos),
                origin("center"),
                color(200, 200, 200),
                "subject-menu",
                "subject-button",
                {
                    subjectId: subject.id,
                    isHovered: false
                }
            ]);
            
            // Subject name
            const subjectName = kaboomAdd([
                text(subject.name, { size: 20 }),
                pos(width / 2, yPos - 10),
                origin("center"),
                color(0, 0, 0),
                "subject-menu"
            ]);
            
            // Subject description
            const subjectDesc = kaboomAdd([
                text(subject.description, { size: 12 }),
                pos(width / 2, yPos + 10),
                origin("center"),
                color(100, 100, 100),
                "subject-menu"
            ]);
            
            menuItems.push(buttonBg, subjectName, subjectDesc);
            
            // Add click handler
            buttonBg.onClick(() => {
                if (onSubjectSelect) {
                    onSubjectSelect(subject.id);
                }
            });
            
            // Add hover effects
            buttonBg.onHover(() => {
                buttonBg.color = rgb(180, 180, 180);
                buttonBg.isHovered = true;
            });
            
            buttonBg.onHoverEnd(() => {
                buttonBg.color = rgb(200, 200, 200);
                buttonBg.isHovered = false;
            });
        });
        
        return menuItems;
    }

    /**
     * Clear subject selection menu
     * @param {Function} kaboomDestroy - Kaboom.js destroy function
     */
    clearSubjectSelectionMenu(kaboomDestroy) {
        try {
            kaboomDestroy("subject-menu");
        } catch (error) {
            console.error('Error clearing subject menu:', error.message);
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SubjectConfigManager;
}