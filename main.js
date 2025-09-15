// Educational Runner Game - Main Entry Point

/**
 * Performance Monitor for tracking frame rate and memory usage
 */
class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
        this.memoryUsage = 0;
        this.performanceHistory = [];
        this.maxHistoryLength = 100;
        this.lowPerformanceThreshold = 30; // FPS threshold for performance adjustments
        this.isLowPerformance = false;
        
        // Performance adjustment flags
        this.particleEffectsEnabled = true;
        this.backgroundAnimationsEnabled = true;
        this.qualityLevel = 'high'; // 'high', 'medium', 'low'
    }
    
    update() {
        this.frameCount++;
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        
        if (deltaTime >= 1000) { // Update every second
            this.fps = Math.round((this.frameCount * 1000) / deltaTime);
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            // Track memory usage if available
            if (performance.memory) {
                this.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024); // MB
            }
            
            // Store performance history
            this.performanceHistory.push({
                fps: this.fps,
                memory: this.memoryUsage,
                timestamp: currentTime
            });
            
            // Limit history length
            if (this.performanceHistory.length > this.maxHistoryLength) {
                this.performanceHistory.shift();
            }
            
            // Check for performance issues
            this.checkPerformance();
        }
    }
    
    checkPerformance() {
        const recentFrames = this.performanceHistory.slice(-10);
        const avgFps = recentFrames.reduce((sum, frame) => sum + frame.fps, 0) / recentFrames.length;
        
        if (avgFps < this.lowPerformanceThreshold && !this.isLowPerformance) {
            this.isLowPerformance = true;
            this.adjustPerformance();
            console.warn(`Performance degradation detected (${avgFps.toFixed(1)} FPS). Adjusting quality settings.`);
        } else if (avgFps > this.lowPerformanceThreshold + 10 && this.isLowPerformance) {
            this.isLowPerformance = false;
            console.log(`Performance improved (${avgFps.toFixed(1)} FPS). Quality settings restored.`);
        }
    }
    
    adjustPerformance() {
        if (this.qualityLevel === 'high') {
            this.qualityLevel = 'medium';
            this.particleEffectsEnabled = false;
        } else if (this.qualityLevel === 'medium') {
            this.qualityLevel = 'low';
            this.backgroundAnimationsEnabled = false;
        }
    }
    
    getFPS() {
        return this.fps;
    }
    
    getMemoryUsage() {
        return this.memoryUsage;
    }
    
    getQualityLevel() {
        return this.qualityLevel;
    }
    
    shouldUseParticleEffects() {
        return this.particleEffectsEnabled;
    }
    
    shouldUseBackgroundAnimations() {
        return this.backgroundAnimationsEnabled;
    }
}

/**
 * Responsive Canvas Manager for handling different screen sizes
 */
class ResponsiveCanvasManager {
    constructor() {
        this.baseWidth = 800;
        this.baseHeight = 600;
        this.aspectRatio = this.baseWidth / this.baseHeight;
        this.scaleFactor = 1;
        this.isMobile = this.detectMobile();
        this.isLandscape = window.innerWidth > window.innerHeight;
        
        // Set up resize listener
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 100); // Delay for orientation change
        });
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
    }
    
    calculateOptimalSize() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const windowAspectRatio = windowWidth / windowHeight;
        
        let canvasWidth, canvasHeight;
        
        if (this.isMobile) {
            // Mobile optimization
            const maxMobileWidth = Math.min(windowWidth * 0.95, 600);
            const maxMobileHeight = Math.min(windowHeight * 0.85, 450);
            
            if (windowAspectRatio > this.aspectRatio) {
                // Window is wider than game aspect ratio
                canvasHeight = maxMobileHeight;
                canvasWidth = canvasHeight * this.aspectRatio;
            } else {
                // Window is taller than game aspect ratio
                canvasWidth = maxMobileWidth;
                canvasHeight = canvasWidth / this.aspectRatio;
            }
        } else {
            // Desktop optimization
            const maxDesktopWidth = Math.min(windowWidth * 0.9, 1200);
            const maxDesktopHeight = Math.min(windowHeight * 0.9, 900);
            
            if (windowAspectRatio > this.aspectRatio) {
                canvasHeight = Math.min(maxDesktopHeight, this.baseHeight * 1.5);
                canvasWidth = canvasHeight * this.aspectRatio;
            } else {
                canvasWidth = Math.min(maxDesktopWidth, this.baseWidth * 1.5);
                canvasHeight = canvasWidth / this.aspectRatio;
            }
        }
        
        this.scaleFactor = canvasWidth / this.baseWidth;
        
        return {
            width: Math.round(canvasWidth),
            height: Math.round(canvasHeight),
            scaleFactor: this.scaleFactor
        };
    }
    
    handleResize() {
        const newSize = this.calculateOptimalSize();
        this.isLandscape = window.innerWidth > window.innerHeight;
        
        // Trigger resize event for game components
        window.dispatchEvent(new CustomEvent('gameResize', {
            detail: newSize
        }));
    }
    
    getOptimalSize() {
        return this.calculateOptimalSize();
    }
    
    isMobileDevice() {
        return this.isMobile;
    }
    
    isLandscapeMode() {
        return this.isLandscape;
    }
}

/**
 * Memory Manager for optimizing memory usage during extended gameplay
 */
class MemoryManager {
    constructor() {
        this.objectPools = new Map();
        this.cleanupInterval = 30000; // 30 seconds
        this.maxPoolSize = 100;
        this.lastCleanup = Date.now();
        
        // Set up periodic cleanup
        setInterval(() => this.performCleanup(), this.cleanupInterval);
    }
    
    createObjectPool(type, createFn, resetFn) {
        this.objectPools.set(type, {
            available: [],
            inUse: new Set(),
            createFn,
            resetFn,
            totalCreated: 0
        });
    }
    
    getFromPool(type) {
        const pool = this.objectPools.get(type);
        if (!pool) return null;
        
        let obj;
        if (pool.available.length > 0) {
            obj = pool.available.pop();
        } else {
            obj = pool.createFn();
            pool.totalCreated++;
        }
        
        pool.inUse.add(obj);
        return obj;
    }
    
    returnToPool(type, obj) {
        const pool = this.objectPools.get(type);
        if (!pool || !pool.inUse.has(obj)) return;
        
        pool.inUse.delete(obj);
        
        if (pool.available.length < this.maxPoolSize) {
            pool.resetFn(obj);
            pool.available.push(obj);
        }
    }
    
    performCleanup() {
        // Clean up object pools
        for (const [type, pool] of this.objectPools) {
            // Limit pool size
            if (pool.available.length > this.maxPoolSize / 2) {
                pool.available.splice(this.maxPoolSize / 2);
            }
        }
        
        // Force garbage collection if available (development only)
        if (window.gc && typeof window.gc === 'function') {
            window.gc();
        }
        
        this.lastCleanup = Date.now();
        console.log('Memory cleanup performed');
    }
    
    getMemoryStats() {
        const stats = {};
        for (const [type, pool] of this.objectPools) {
            stats[type] = {
                available: pool.available.length,
                inUse: pool.inUse.size,
                totalCreated: pool.totalCreated
            };
        }
        return stats;
    }
}

// Global instances
let performanceMonitor;
let canvasManager;
let memoryManager;

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    // Don't let errors crash the game completely
    event.preventDefault();
});

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Don't let promise rejections crash the game
    event.preventDefault();
});

// Wait for all modules to load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize performance monitoring and responsive canvas
        performanceMonitor = new PerformanceMonitor();
        canvasManager = new ResponsiveCanvasManager();
        memoryManager = new MemoryManager();
        
        // Make performance monitor globally accessible for other modules
        window.performanceMonitor = performanceMonitor;
        
        // Get optimal canvas size
        const optimalSize = canvasManager.getOptimalSize();
        
        // Initialize Kaboom.js with responsive sizing and performance optimizations
        let kaboomInitialized = false;
        try {
            kaboom({
                background: [135, 206, 235], // sky blue
                width: optimalSize.width,
                height: optimalSize.height,
                canvas: document.querySelector('#game-container canvas') || undefined,
                crisp: true, // Pixel-perfect rendering
                touchToMouse: canvasManager.isMobileDevice(), // Enable touch controls on mobile
                logMax: 10, // Limit console logs for performance
                root: document.querySelector('#game-container'),
            });
            kaboomInitialized = true;
            
            // Set up canvas resize handling
            window.addEventListener('gameResize', (event) => {
                const newSize = event.detail;
                // Kaboom.js doesn't support runtime resize, so we'll handle this differently
                console.log(`Canvas resize requested: ${newSize.width}x${newSize.height}`);
            });
            
        } catch (kaboomError) {
            console.error('Failed to initialize Kaboom.js:', kaboomError.message);
            showCriticalError('Failed to initialize game engine. Please refresh the page.');
            return;
        }

        // Initialize game components with error handling
        let gameStateManager, contentLoader, runnerEngine, questionPresenter, questionFlowManager;
        
        try {
            gameStateManager = new GameStateManager();
        } catch (error) {
            console.error('Failed to initialize GameStateManager:', error.message);
            showCriticalError('Failed to initialize game state. Please refresh the page.');
            return;
        }

        // Initialize subject configuration and question type handlers
        let subjectConfigManager, questionTypeHandler;
        
        try {
            // Check if SubjectConfigManager class exists
            if (typeof SubjectConfigManager === 'undefined') {
                throw new Error('SubjectConfigManager class not found. Please ensure all scripts are loaded.');
            }
            subjectConfigManager = new SubjectConfigManager();
            console.log('✅ SubjectConfigManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize SubjectConfigManager:', error.message);
            showCriticalError('Failed to initialize subject configuration. Please refresh the page and ensure all scripts load properly.');
            return;
        }

        try {
            // Check if QuestionTypeHandler class exists
            if (typeof QuestionTypeHandler === 'undefined') {
                throw new Error('QuestionTypeHandler class not found. Please ensure all scripts are loaded.');
            }
            questionTypeHandler = new QuestionTypeHandler();
            console.log('✅ QuestionTypeHandler initialized successfully');
        } catch (error) {
            console.error('Failed to initialize QuestionTypeHandler:', error.message);
            showCriticalError('Failed to initialize question type handler. Please refresh the page and ensure all scripts load properly.');
            return;
        }

        try {
            contentLoader = new ContentLoader(subjectConfigManager, questionTypeHandler);
        } catch (error) {
            console.error('Failed to initialize ContentLoader:', error.message);
            showCriticalError('Failed to initialize content loader. Please refresh the page.');
            return;
        }

        try {
            runnerEngine = new RunnerEngine(gameStateManager);
        } catch (error) {
            console.error('Failed to initialize RunnerEngine:', error.message);
            showCriticalError('Failed to initialize game engine. Please refresh the page.');
            return;
        }

        try {
            questionPresenter = new QuestionPresenter(questionTypeHandler, subjectConfigManager);
        } catch (error) {
            console.error('Failed to initialize QuestionPresenter:', error.message);
            showCriticalError('Failed to initialize question system. Please refresh the page.');
            return;
        }

        try {
            questionFlowManager = new QuestionFlowManager(contentLoader, questionPresenter, gameStateManager);
        } catch (error) {
            console.error('Failed to initialize QuestionFlowManager:', error.message);
            showCriticalError('Failed to initialize question flow. Please refresh the page.');
            return;
        }

        // Load initial question set with comprehensive error handling
        let loadResult;
        try {
            // Load questions for the default subject (math)
            loadResult = await contentLoader.loadQuestionsForSubject('math');
        } catch (loadError) {
            console.error('Exception during question loading:', loadError.message);
            loadResult = { success: false, error: loadError.message };
        }
        
        if (!loadResult || !loadResult.success) {
            const errorMessage = loadResult?.error || "Unknown error occurred while loading questions";
            console.error('Failed to load questions:', errorMessage);
            
            // Show user-friendly error message
            try {
                add([
                    text("Failed to load questions!", { size: 32 }),
                    pos(width() / 2, height() / 2 - 20),
                    origin("center"),
                    color(255, 0, 0),
                ]);
                
                add([
                    text(errorMessage, { size: 16 }),
                    pos(width() / 2, height() / 2 + 20),
                    origin("center"),
                    color(100, 0, 0),
                ]);

                add([
                    text("Please check your internet connection and refresh the page.", { size: 14 }),
                    pos(width() / 2, height() / 2 + 60),
                    origin("center"),
                    color(100, 0, 0),
                ]);
            } catch (displayError) {
                console.error('Failed to display error message:', displayError.message);
                showCriticalError('Critical error: Unable to load questions or display error message.');
            }
            return;
        }

    // Display initial menu
    const menuText = add([
        text("Educational Runner Game", { size: 36 }),
        pos(width() / 2, 80),
        origin("center"),
        color(0, 0, 0),
    ]);

    const subjectText = add([
        text(`Subject: ${subjectConfigManager.getCurrentSubject().name}`, { size: 20 }),
        pos(width() / 2, 140),
        origin("center"),
        color(0, 0, 0),
    ]);

    const changeSubjectText = add([
        text("Press S to Change Subject", { size: 16 }),
        pos(width() / 2, 170),
        origin("center"),
        color(100, 100, 100),
    ]);

    const startText = add([
        text("Press SPACE to Start", { size: 24 }),
        pos(width() / 2, 220),
        origin("center"),
        color(0, 0, 0),
    ]);

    const instructionsText = add([
        text("Answer questions correctly to keep running!\nUse number keys or click to answer.", { size: 16 }),
        pos(width() / 2, 280),
        origin("center"),
        color(0, 0, 0),
    ]);

    // Game state display
    const scoreText = add([
        text("Score: 0", { size: 18 }),
        pos(20, 20),
        color(0, 0, 0),
    ]);

    const livesText = add([
        text("Lives: 3", { size: 18 }),
        pos(20, 50),
        color(0, 0, 0),
    ]);
    
    // Performance display (only show in development or when performance is low)
    const performanceText = add([
        text("", { size: 12 }),
        pos(20, height() - 60),
        color(100, 100, 100),
    ]);
    
    // Device info display for mobile optimization
    const deviceInfoText = add([
        text("", { size: 10 }),
        pos(20, height() - 40),
        color(150, 150, 150),
    ]);
    
    // Initialize device info
    if (canvasManager.isMobileDevice()) {
        deviceInfoText.text = `Mobile ${canvasManager.isLandscapeMode() ? 'Landscape' : 'Portrait'} | Touch Controls`;
    } else {
        deviceInfoText.text = `Desktop | Keyboard Controls`;
    }

    // Set up event listeners
    gameStateManager.addStateChangeListener((newState, previousState) => {
        console.log(`Game state changed from ${previousState} to ${newState}`);
        
        if (newState === GameStates.PLAYING) {
            // Hide menu elements
            menuText.hidden = true;
            startText.hidden = true;
            instructionsText.hidden = true;
            
            // Show player sprite (managed by runner engine)
            if (runnerEngine.playerSprite) {
                runnerEngine.playerSprite.hidden = false;
            }
            
        } else if (newState === GameStates.MENU) {
            // Show menu elements
            menuText.hidden = false;
            subjectText.hidden = false;
            changeSubjectText.hidden = false;
            startText.hidden = false;
            instructionsText.hidden = false;
            
            // Update subject display
            subjectText.text = `Subject: ${subjectConfigManager.getCurrentSubject().name}`;
            
            // Hide player sprite
            if (runnerEngine.playerSprite) {
                runnerEngine.playerSprite.hidden = true;
            }
        }
    });

    // Set up question flow manager listeners
    questionFlowManager.addQuestionStartListener((question) => {
        console.log(`Starting question: ${question.prompt}`);
    });

    questionFlowManager.addQuestionCompleteListener(() => {
        console.log('Question completed, resuming gameplay');
    });

    // Set up question presenter listeners for visual effects
    questionPresenter.addAnswerListener((result) => {
        if (result.isCorrect) {
            // Create success effect for correct answers
            runnerEngine.createSuccessEffect();
        } else {
            // Create stumble effect for incorrect answers
            runnerEngine.stumble();
            if (!gameStateManager.decrementLives()) {
                gameStateManager.setState(GameStates.GAMEOVER);
            }
        }
        
        // Update UI
        const stats = gameStateManager.getGameStats();
        scoreText.text = `Score: ${stats.score}`;
        livesText.text = `Lives: ${stats.lives}`;
    });

    // Input handling - Keyboard
    onKeyPress("space", () => {
        if (gameStateManager.getCurrentState() === GameStates.MENU) {
            gameStateManager.setState(GameStates.PLAYING);
            gameStateManager.resetGame();
            runnerEngine.reset();
            questionFlowManager.reset();
        }
    });

    // Subject selection
    onKeyPress("s", () => {
        if (gameStateManager.getCurrentState() === GameStates.MENU) {
            showSubjectSelectionMenu();
        }
    });

    onKeyPress("up", () => {
        if (gameStateManager.getCurrentState() === GameStates.PLAYING) {
            runnerEngine.jump();
        }
    });
    
    // Mobile touch controls
    if (canvasManager.isMobileDevice()) {
        // Touch to start game
        onClick(() => {
            if (gameStateManager.getCurrentState() === GameStates.MENU) {
                gameStateManager.setState(GameStates.PLAYING);
                gameStateManager.resetGame();
                runnerEngine.reset();
                questionFlowManager.reset();
            } else if (gameStateManager.getCurrentState() === GameStates.PLAYING) {
                runnerEngine.jump();
            }
        });
        
        // Add visual touch indicator for mobile
        const touchIndicator = add([
            text("Tap to Jump", { size: 16 }),
            pos(width() / 2, height() - 40),
            origin("center"),
            color(0, 0, 0),
            opacity(0.7),
        ]);
        
        // Hide touch indicator on desktop
        if (!canvasManager.isMobileDevice()) {
            touchIndicator.hidden = true;
        }
    }
    
    // Browser compatibility - Handle visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Pause game when tab is not visible
            if (gameStateManager.getCurrentState() === GameStates.PLAYING) {
                gameStateManager.setState(GameStates.PAUSED);
            }
        } else {
            // Resume game when tab becomes visible
            if (gameStateManager.getCurrentState() === GameStates.PAUSED) {
                gameStateManager.setState(GameStates.PLAYING);
            }
        }
    });

    // Game loop with comprehensive error handling and performance monitoring
    onUpdate(() => {
        try {
            // Update performance monitoring
            performanceMonitor.update();
            
            const deltaTime = dt(); // Kaboom.js delta time in seconds
            
            // Validate delta time
            if (typeof deltaTime !== 'number' || isNaN(deltaTime) || deltaTime < 0) {
                console.warn('Invalid delta time:', deltaTime);
                return;
            }

            const deltaTimeMs = deltaTime * 1000; // Convert to milliseconds
            
            // Performance-based frame skipping for low-end devices
            if (performanceMonitor.getFPS() < 20 && Math.random() > 0.5) {
                return; // Skip this frame to maintain performance
            }
            
            // Update question flow manager with error handling
            try {
                if (questionFlowManager && typeof questionFlowManager.update === 'function') {
                    questionFlowManager.update(deltaTimeMs);
                }
            } catch (flowError) {
                console.error('Error updating question flow manager:', flowError.message);
                // Continue game loop even if question flow fails
            }
            
            // Update game systems only during PLAYING state
            try {
                if (gameStateManager && 
                    typeof gameStateManager.getCurrentState === 'function' &&
                    gameStateManager.getCurrentState() === GameStates.PLAYING) {
                    
                    // Update player with error handling
                    try {
                        if (runnerEngine && typeof runnerEngine.updatePlayer === 'function') {
                            runnerEngine.updatePlayer(deltaTime);
                        }
                    } catch (playerError) {
                        console.error('Error updating player:', playerError.message);
                    }

                    // Spawn obstacles with error handling
                    try {
                        if (runnerEngine && typeof runnerEngine.spawnObstacles === 'function') {
                            runnerEngine.spawnObstacles(deltaTime);
                        }
                    } catch (spawnError) {
                        console.error('Error spawning obstacles:', spawnError.message);
                    }

                    // Update obstacles with error handling
                    try {
                        if (runnerEngine && typeof runnerEngine.updateObstacles === 'function') {
                            runnerEngine.updateObstacles(deltaTime);
                        }
                    } catch (obstacleError) {
                        console.error('Error updating obstacles:', obstacleError.message);
                    }

                    // Update background with error handling
                    try {
                        if (runnerEngine && typeof runnerEngine.updateBackground === 'function') {
                            runnerEngine.updateBackground(deltaTime);
                        }
                    } catch (backgroundError) {
                        console.error('Error updating background:', backgroundError.message);
                    }
                    
                    // Check collisions with error handling
                    try {
                        if (runnerEngine && typeof runnerEngine.checkCollisions === 'function') {
                            const collision = runnerEngine.checkCollisions();
                            if (collision) {
                                handleCollision(collision, runnerEngine, questionFlowManager, gameStateManager);
                            }
                        }
                    } catch (collisionError) {
                        console.error('Error checking collisions:', collisionError.message);
                    }
                }
            } catch (gameStateError) {
                console.error('Error in game state check:', gameStateError.message);
            }
            
            // Update UI elements with error handling
            try {
                updateUI(gameStateManager, scoreText, livesText, performanceText, deviceInfoText);
            } catch (uiError) {
                console.error('Error updating UI:', uiError.message);
                // UI errors shouldn't stop the game
            }
            
        } catch (gameLoopError) {
            console.error('Critical error in game loop:', gameLoopError.message);
            // Don't crash the entire game loop, but log the error
        }
    });

    // Game over handling
    gameStateManager.addStateChangeListener((newState) => {
        if (newState === GameStates.GAMEOVER) {
            const stats = gameStateManager.getGameStats();
            
            add([
                text("Game Over!", { size: 48 }),
                pos(width() / 2, height() / 2 - 50),
                origin("center"),
                color(255, 0, 0),
            ]);
            
            add([
                text(`Final Score: ${stats.score}`, { size: 24 }),
                pos(width() / 2, height() / 2),
                origin("center"),
                color(0, 0, 0),
            ]);
            
            add([
                text(`Questions Answered: ${stats.questionsAnswered} (${stats.accuracy}% correct)`, { size: 18 }),
                pos(width() / 2, height() / 2 + 30),
                origin("center"),
                color(0, 0, 0),
            ]);
            
            add([
                text("Press R to Restart", { size: 20 }),
                pos(width() / 2, height() / 2 + 80),
                origin("center"),
                color(0, 0, 0),
            ]);
        }
    });

    // Restart handling
    onKeyPress("r", () => {
        if (gameStateManager.getCurrentState() === GameStates.GAMEOVER) {
            // Reload the page for a fresh start
            location.reload();
        }
    });

        console.log("Educational Runner Game initialized successfully!");
        console.log(`Loaded ${contentLoader.getQuestionCount()} questions`);
        
    } catch (initError) {
        console.error('Critical error during game initialization:', initError.message);
        showCriticalError('Failed to initialize the game. Please refresh the page and try again.');
    }
});

/**
 * Show subject selection menu
 */
function showSubjectSelectionMenu() {
    try {
        // Hide main menu elements
        menuText.hidden = true;
        subjectText.hidden = true;
        changeSubjectText.hidden = true;
        startText.hidden = true;
        instructionsText.hidden = true;

        // Create subject selection menu
        const subjectMenuItems = subjectConfigManager.createSubjectSelectionMenu(
            add, 
            width(), 
            height(), 
            async (selectedSubjectId) => {
                try {
                    // Load questions for selected subject
                    const loadResult = await contentLoader.loadQuestionsForSubject(selectedSubjectId);
                    
                    if (loadResult.success) {
                        console.log(`Switched to subject: ${selectedSubjectId}`);
                        
                        // Clear subject menu
                        subjectConfigManager.clearSubjectSelectionMenu(destroyAll);
                        
                        // Show main menu again
                        menuText.hidden = false;
                        subjectText.hidden = false;
                        changeSubjectText.hidden = false;
                        startText.hidden = false;
                        instructionsText.hidden = false;
                        
                        // Update subject display
                        subjectText.text = `Subject: ${subjectConfigManager.getCurrentSubject().name}`;
                        
                    } else {
                        console.error('Failed to load subject questions:', loadResult.error);
                        // Show error and return to menu
                        add([
                            text(`Error: ${loadResult.error}`, { size: 16 }),
                            pos(width() / 2, height() / 2 + 100),
                            origin("center"),
                            color(255, 0, 0),
                            "subject-menu"
                        ]);
                    }
                } catch (error) {
                    console.error('Error switching subjects:', error.message);
                }
            }
        );

        // Add back button
        const backButton = add([
            rect(100, 40),
            pos(50, height() - 50),
            origin("left"),
            color(200, 200, 200),
            "subject-menu",
            "back-button"
        ]);

        const backText = add([
            text("Back", { size: 16 }),
            pos(100, height() - 30),
            origin("center"),
            color(0, 0, 0),
            "subject-menu"
        ]);

        backButton.onClick(() => {
            // Clear subject menu
            subjectConfigManager.clearSubjectSelectionMenu(destroyAll);
            
            // Show main menu again
            menuText.hidden = false;
            subjectText.hidden = false;
            changeSubjectText.hidden = false;
            startText.hidden = false;
            instructionsText.hidden = false;
        });

    } catch (error) {
        console.error('Error showing subject selection menu:', error.message);
    }
}

/**
 * Show a critical error message to the user
 * @param {string} message - Error message to display
 */
function showCriticalError(message) {
    try {
        // Create error display in the document body
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f8d7da;
            color: #721c24;
            border: 2px solid #f5c6cb;
            border-radius: 10px;
            padding: 30px;
            text-align: center;
            font-family: Arial, sans-serif;
            font-size: 18px;
            font-weight: bold;
            z-index: 10000;
            max-width: 500px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        `;
        
        errorDiv.innerHTML = `
            <h2 style="margin-top: 0; color: #721c24;">Game Error</h2>
            <p>${message}</p>
            <button onclick="location.reload()" style="
                margin-top: 15px;
                padding: 10px 20px;
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            ">Refresh Page</button>
        `;
        
        document.body.appendChild(errorDiv);
    } catch (displayError) {
        console.error('Failed to display critical error:', displayError.message);
        // Last resort: use alert
        alert(`Critical Error: ${message}\n\nPlease refresh the page.`);
    }
}

/**
 * Handle collision events with error handling
 * @param {Obstacle} collision - The collision object
 * @param {RunnerEngine} runnerEngine - Runner engine instance
 * @param {QuestionFlowManager} questionFlowManager - Question flow manager instance
 * @param {GameStateManager} gameStateManager - Game state manager instance
 */
function handleCollision(collision, runnerEngine, questionFlowManager, gameStateManager) {
    try {
        if (!collision || typeof collision !== 'object') {
            console.warn('Invalid collision object');
            return;
        }

        if (collision.type === 'question_gate') {
            // Question gate hit - force trigger question immediately
            try {
                if (questionFlowManager && typeof questionFlowManager.forceTriggerQuestion === 'function') {
                    questionFlowManager.forceTriggerQuestion();
                }
            } catch (questionError) {
                console.error('Error triggering question from collision:', questionError.message);
            }
        } else {
            // Regular obstacle hit
            try {
                if (runnerEngine && typeof runnerEngine.stumble === 'function') {
                    runnerEngine.stumble(1500); // Stumble for 1.5 seconds
                }
            } catch (stumbleError) {
                console.error('Error making player stumble:', stumbleError.message);
            }

            try {
                if (gameStateManager && typeof gameStateManager.decrementLives === 'function') {
                    if (!gameStateManager.decrementLives()) {
                        if (typeof gameStateManager.setState === 'function') {
                            gameStateManager.setState(GameStates.GAMEOVER);
                        }
                    }
                }
            } catch (livesError) {
                console.error('Error handling lives decrement:', livesError.message);
            }
        }
    } catch (collisionHandleError) {
        console.error('Error handling collision:', collisionHandleError.message);
    }
}

/**
 * Update UI elements with error handling and performance monitoring
 * @param {GameStateManager} gameStateManager - Game state manager instance
 * @param {any} scoreText - Score text element
 * @param {any} livesText - Lives text element
 * @param {any} performanceText - Performance text element
 * @param {any} deviceInfoText - Device info text element
 */
function updateUI(gameStateManager, scoreText, livesText, performanceText, deviceInfoText) {
    try {
        if (!gameStateManager || typeof gameStateManager.getGameStats !== 'function') {
            return;
        }

        const stats = gameStateManager.getGameStats();
        
        if (!stats || typeof stats !== 'object') {
            console.warn('Invalid game stats received');
            return;
        }

        // Safely update score text
        try {
            if (scoreText && typeof stats.score === 'number') {
                scoreText.text = `Score: ${stats.score}`;
            }
        } catch (scoreError) {
            console.warn('Error updating score text:', scoreError.message);
        }

        // Safely update lives text
        try {
            if (livesText && typeof stats.lives === 'number') {
                livesText.text = `Lives: ${stats.lives}`;
            }
        } catch (livesError) {
            console.warn('Error updating lives text:', livesError.message);
        }
        
        // Update performance display (show only when performance is low or in debug mode)
        try {
            if (performanceText && performanceMonitor) {
                const fps = performanceMonitor.getFPS();
                const memory = performanceMonitor.getMemoryUsage();
                const quality = performanceMonitor.getQualityLevel();
                
                if (fps < 45 || window.location.search.includes('debug')) {
                    performanceText.text = `FPS: ${fps} | Memory: ${memory}MB | Quality: ${quality}`;
                    performanceText.hidden = false;
                } else {
                    performanceText.hidden = true;
                }
            }
        } catch (perfError) {
            console.warn('Error updating performance text:', perfError.message);
        }
        
        // Update device info on orientation change
        try {
            if (deviceInfoText && canvasManager) {
                const isLandscape = canvasManager.isLandscapeMode();
                const isMobile = canvasManager.isMobileDevice();
                
                if (isMobile) {
                    deviceInfoText.text = `Mobile ${isLandscape ? 'Landscape' : 'Portrait'} | Touch Controls`;
                } else {
                    deviceInfoText.text = `Desktop | Keyboard Controls`;
                }
            }
        } catch (deviceError) {
            console.warn('Error updating device info text:', deviceError.message);
        }
        
    } catch (uiUpdateError) {
        console.error('Error in updateUI function:', uiUpdateError.message);
    }
}