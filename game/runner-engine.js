/**
 * @typedef {Object} Obstacle
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {number} width - Width of obstacle
 * @property {number} height - Height of obstacle
 * @property {string} type - Type of obstacle
 */

/**
 * @typedef {Object} Player
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {number} width - Width of player
 * @property {number} height - Height of player
 * @property {number} velocityY - Vertical velocity for jumping
 * @property {boolean} isJumping - Whether player is currently jumping
 * @property {boolean} isStumbling - Whether player is currently stumbling
 */

/**
 * RunnerEngine class handles the core runner game mechanics with Kaboom.js integration
 */
class RunnerEngine {
    constructor(gameStateManager) {
        /** @type {GameStateManager} */
        this.gameStateManager = gameStateManager;
        
        /** @type {number} */
        this.playerSpeed = 200; // pixels per second
        
        /** @type {number} */
        this.obstacleSpeed = 150; // pixels per second
        
        /** @type {Player} */
        this.player = {
            x: 100,
            y: 300,
            width: 40,
            height: 40,
            velocityY: 0,
            isJumping: false,
            isStumbling: false
        };
        
        /** @type {Obstacle[]} */
        this.obstacles = [];
        
        /** @type {number} */
        this.backgroundOffset = 0;
        
        /** @type {number} */
        this.gravity = 800; // pixels per second squared
        
        /** @type {number} */
        this.jumpForce = -400; // negative for upward movement
        
        /** @type {number} */
        this.groundY = 400; // Adjusted for better positioning
        
        /** @type {Function[]} */
        this.questionTriggerListeners = [];
        
        /** @type {Function[]} */
        this.collisionListeners = [];
        
        // Kaboom.js game objects
        /** @type {any} */
        this.playerSprite = null;
        
        /** @type {any[]} */
        this.obstacleSprites = [];
        
        /** @type {any[]} */
        this.backgroundElements = [];
        
        /** @type {number} */
        this.lastObstacleSpawn = 0;
        
        /** @type {number} */
        this.obstacleSpawnInterval = 3000; // 3 seconds between obstacles
        
        /** @type {number} */
        this.cameraX = 0;
        
        // Memory optimization - track active particles for cleanup
        /** @type {any[]} */
        this.activeParticles = [];
        
        /** @type {number} */
        this.maxParticles = 50; // Limit total particles for performance
        
        // Performance tracking
        /** @type {number} */
        this.lastPerformanceCheck = Date.now();
        
        /** @type {number} */
        this.frameSkipCounter = 0;
        
        this.initializeKaboomElements();
    }

    /**
     * Initialize Kaboom.js sprites and visual elements
     */
    initializeKaboomElements() {
        // Create scrolling background elements
        this.createBackground();
        
        // Create player sprite
        this.createPlayerSprite();
    }

    /**
     * Create scrolling background elements
     */
    createBackground() {
        // Create ground
        for (let i = 0; i < 20; i++) {
            const ground = add([
                rect(100, 50),
                pos(i * 100, this.groundY + 40),
                color(101, 67, 33), // Brown ground
                "ground"
            ]);
            this.backgroundElements.push(ground);
        }
        
        // Create background clouds
        for (let i = 0; i < 10; i++) {
            const cloud = add([
                rect(60, 30),
                pos(i * 200 + Math.random() * 100, 50 + Math.random() * 100),
                color(255, 255, 255),
                opacity(0.7),
                "cloud"
            ]);
            this.backgroundElements.push(cloud);
        }
        
        // Create background trees
        for (let i = 0; i < 15; i++) {
            const tree = add([
                rect(20, 80),
                pos(i * 150 + Math.random() * 50, this.groundY - 40),
                color(34, 139, 34), // Forest green
                "tree"
            ]);
            this.backgroundElements.push(tree);
        }
    }

    /**
     * Create player sprite with animations
     */
    createPlayerSprite() {
        this.playerSprite = add([
            rect(this.player.width, this.player.height),
            pos(this.player.x, this.player.y),
            color(0, 255, 0), // Green player
            area(),
            body({ jumpForce: Math.abs(this.jumpForce) }),
            "player"
        ]);
        
        // Set up player physics (only if onGround method exists)
        if (this.playerSprite.onGround) {
            this.playerSprite.onGround(() => {
                this.player.isJumping = false;
            });
        }
    }

    /**
     * Update the player's position and state
     * @param {number} deltaTime - Time elapsed since last update (in seconds)
     */
    updatePlayer(deltaTime) {
        if (!this.playerSprite) return;
        
        // Update camera to follow player
        this.cameraX += this.playerSpeed * deltaTime;
        
        // Handle stumbling animation
        if (this.player.isStumbling) {
            // Stumbling reduces forward movement temporarily
            this.player.x += (this.playerSpeed * 0.3) * deltaTime;
            this.playerSprite.color = rgb(255, 100, 100); // Red when stumbling
            
            // Enhanced stumble animation with bobbing and shaking
            const stumbleTime = Date.now() * 0.01;
            const bobOffset = Math.sin(stumbleTime * 2) * 3;
            const shakeOffset = (Math.random() - 0.5) * 8;
            
            this.playerSprite.pos.x = this.player.x + shakeOffset;
            this.playerSprite.pos.y = this.player.y + bobOffset;
            
            // Add stumble rotation effect
            this.playerSprite.angle = Math.sin(stumbleTime * 3) * 0.2;
        } else {
            // Normal forward movement
            this.player.x += this.playerSpeed * deltaTime;
            this.playerSprite.color = rgb(0, 255, 0); // Green normally
            this.playerSprite.pos.x = this.player.x;
            this.playerSprite.pos.y = this.player.y;
            this.playerSprite.angle = 0; // Reset rotation
        }

        // Update player sprite position
        this.player.y = this.playerSprite.pos.y;
        
        // Update game state position
        this.gameStateManager.gameState.playerPosition.x = this.player.x;
        this.gameStateManager.gameState.playerPosition.y = this.player.y;
        
        // Update camera position for scrolling effect
        this.updateCamera();
    }

    /**
     * Update camera position for smooth scrolling
     */
    updateCamera() {
        // Keep player centered horizontally
        const targetCameraX = this.player.x - width() / 4;
        camPos(targetCameraX, 0);
    }

    /**
     * Make the player jump
     */
    jump() {
        if (this.playerSprite && this.playerSprite.isGrounded()) {
            this.playerSprite.jump();
            this.player.isJumping = true;
        }
    }

    /**
     * Make the player stumble (penalty for wrong answers)
     * @param {number} duration - Duration of stumble in milliseconds
     */
    stumble(duration = 1000) {
        if (this.player.isStumbling) return; // Prevent multiple stumbles
        
        this.player.isStumbling = true;
        
        // Create stumble effect with screen shake
        this.createStumbleEffect();
        
        // Reduce player speed during stumble
        const originalSpeed = this.playerSpeed;
        this.playerSpeed *= 0.2; // Slow down to 20% speed
        
        setTimeout(() => {
            this.player.isStumbling = false;
            this.playerSpeed = originalSpeed; // Restore original speed
        }, duration);
    }

    /**
     * Create visual stumble effect with screen shake and particle effects
     * @private
     */
    createStumbleEffect() {
        // Screen shake effect
        let shakeIntensity = 10;
        const shakeDecay = 0.9;
        const shakeInterval = setInterval(() => {
            if (shakeIntensity < 0.5) {
                clearInterval(shakeInterval);
                camPos(this.player.x - width() / 4, 0); // Reset camera
                return;
            }
            
            const shakeX = (Math.random() - 0.5) * shakeIntensity;
            const shakeY = (Math.random() - 0.5) * shakeIntensity;
            camPos(this.player.x - width() / 4 + shakeX, shakeY);
            shakeIntensity *= shakeDecay;
        }, 50);
        
        // Create dust particles for stumble effect
        this.createStumbleParticles();
    }

    /**
     * Clean up excess particles to maintain performance
     * @private
     */
    cleanupParticles() {
        if (this.activeParticles.length > this.maxParticles) {
            // Remove oldest particles first
            const particlesToRemove = this.activeParticles.length - this.maxParticles;
            for (let i = 0; i < particlesToRemove; i++) {
                const particle = this.activeParticles.shift();
                if (particle && particle.destroy) {
                    particle.destroy();
                }
            }
        }
        
        // Clean up destroyed particles from the array
        this.activeParticles = this.activeParticles.filter(particle => 
            particle && particle.exists && particle.exists()
        );
    }

    /**
     * Create dust particle effects when stumbling
     * @private
     */
    createStumbleParticles() {
        // Clean up particles first to maintain performance
        this.cleanupParticles();
        
        // Check if particle effects should be enabled based on performance
        const particleCount = (window.performanceMonitor && !window.performanceMonitor.shouldUseParticleEffects()) ? 3 : 8;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = add([
                rect(4, 4),
                pos(
                    this.player.x + Math.random() * 40 - 20,
                    this.player.y + this.player.height + Math.random() * 10
                ),
                color(139, 69, 19), // Brown dust color
                opacity(0.8),
                "stumble_particle"
            ]);
            
            // Animate particle
            const velocityX = (Math.random() - 0.5) * 100;
            const velocityY = -Math.random() * 50 - 20;
            let particleLife = 1.0;
            
            // Track particle for cleanup
            this.activeParticles.push(particle);
            
            particle.onUpdate(() => {
                particle.pos.x += velocityX * dt();
                particle.pos.y += velocityY * dt();
                particleLife -= dt() * 2;
                particle.opacity = Math.max(0, particleLife);
                
                if (particleLife <= 0) {
                    particle.destroy();
                    // Remove from active particles array
                    const index = this.activeParticles.indexOf(particle);
                    if (index > -1) {
                        this.activeParticles.splice(index, 1);
                    }
                }
            });
        }
    }

    /**
     * Create positive feedback effect for correct answers
     */
    createSuccessEffect() {
        // Clean up particles first to maintain performance
        this.cleanupParticles();
        
        // Check if particle effects should be enabled based on performance
        const particleCount = (window.performanceMonitor && !window.performanceMonitor.shouldUseParticleEffects()) ? 5 : 12;
        
        // Create sparkle particles for success
        for (let i = 0; i < particleCount; i++) {
            const particle = add([
                rect(3, 3),
                pos(
                    this.player.x + Math.random() * 60 - 30,
                    this.player.y + Math.random() * 40 - 20
                ),
                color(255, 215, 0), // Gold sparkle color
                opacity(1.0),
                "success_particle"
            ]);
            
            // Animate sparkle
            const velocityX = (Math.random() - 0.5) * 80;
            const velocityY = -Math.random() * 60 - 30;
            let particleLife = 1.5;
            
            // Track particle for cleanup
            this.activeParticles.push(particle);
            
            particle.onUpdate(() => {
                particle.pos.x += velocityX * dt();
                particle.pos.y += velocityY * dt();
                particleLife -= dt();
                particle.opacity = Math.max(0, particleLife / 1.5);
                
                // Sparkle effect (only if performance allows)
                if (!window.performanceMonitor || window.performanceMonitor.getFPS() > 30) {
                    particle.color = rgb(
                        255,
                        215 + Math.sin(particleLife * 10) * 40,
                        Math.sin(particleLife * 8) * 100
                    );
                }
                
                if (particleLife <= 0) {
                    particle.destroy();
                    // Remove from active particles array
                    const index = this.activeParticles.indexOf(particle);
                    if (index > -1) {
                        this.activeParticles.splice(index, 1);
                    }
                }
            });
        }
        
        // Temporary speed boost for correct answers
        const originalSpeed = this.playerSpeed;
        this.playerSpeed *= 1.3; // 30% speed boost
        
        // Player glow effect
        if (this.playerSprite) {
            this.playerSprite.color = rgb(100, 255, 100); // Bright green
            setTimeout(() => {
                if (this.playerSprite && !this.player.isStumbling) {
                    this.playerSprite.color = rgb(0, 255, 0); // Back to normal green
                }
            }, 1000);
        }
        
        setTimeout(() => {
            this.playerSpeed = originalSpeed; // Restore normal speed
        }, 2000);
    }

    /**
     * Spawn obstacles and question gates
     * @param {number} deltaTime - Time elapsed since last update (in seconds)
     */
    spawnObstacles(deltaTime) {
        const currentTime = Date.now();
        
        // Spawn regular obstacles at intervals
        if (currentTime - this.lastObstacleSpawn > this.obstacleSpawnInterval) {
            this.spawnObstacle();
            this.lastObstacleSpawn = currentTime;
        }

        // Question gates are now spawned randomly as visual elements
        // The actual question timing is handled by QuestionFlowManager
        if (Math.random() < 0.001) { // Very low chance to spawn visual question gates
            this.spawnQuestionGate();
        }
    }

    /**
     * Spawn a regular obstacle
     */
    spawnObstacle() {
        const spawnX = this.player.x + 600; // Spawn ahead of player
        
        // Create obstacle sprite
        const obstacle = add([
            rect(30, 40),
            pos(spawnX, this.groundY - 40),
            color(139, 69, 19), // Brown obstacle
            area(),
            "obstacle"
        ]);
        
        this.obstacleSprites.push(obstacle);
        
        // Add to obstacles array for collision detection
        this.obstacles.push({
            x: spawnX,
            y: this.groundY - 40,
            width: 30,
            height: 40,
            type: 'obstacle',
            sprite: obstacle
        });
    }

    /**
     * Spawn a question gate
     */
    spawnQuestionGate() {
        const spawnX = this.player.x + 400; // Spawn closer for questions
        
        // Create question gate sprite (two pillars)
        const leftPillar = add([
            rect(15, 80),
            pos(spawnX, this.groundY - 80),
            color(255, 215, 0), // Gold color
            area(),
            "question_gate"
        ]);
        
        const rightPillar = add([
            rect(15, 80),
            pos(spawnX + 50, this.groundY - 80),
            color(255, 215, 0), // Gold color
            area(),
            "question_gate"
        ]);
        
        // Add question symbol
        const questionMark = add([
            text("?", { size: 32 }),
            pos(spawnX + 25, this.groundY - 120),
            color(255, 215, 0),
            origin("center"),
            "question_symbol"
        ]);
        
        this.obstacleSprites.push(leftPillar, rightPillar, questionMark);
        
        // Add to obstacles array for collision detection
        this.obstacles.push({
            x: spawnX,
            y: this.groundY - 80,
            width: 65,
            height: 80,
            type: 'question_gate',
            sprite: leftPillar
        });
    }

    /**
     * Update obstacles and remove off-screen ones
     * @param {number} deltaTime - Time elapsed since last update (in seconds)
     */
    updateObstacles(deltaTime) {
        // Performance optimization - skip some updates on low-end devices
        if (window.performanceMonitor && window.performanceMonitor.getFPS() < 20) {
            this.frameSkipCounter++;
            if (this.frameSkipCounter % 3 !== 0) {
                return; // Skip this update cycle
            }
        }
        
        // Remove obstacles that are far behind the player
        this.obstacles = this.obstacles.filter((obstacle, index) => {
            if (obstacle.x < this.player.x - 300) {
                // Remove sprite from game
                if (obstacle.sprite && obstacle.sprite.exists()) {
                    obstacle.sprite.destroy();
                }
                return false;
            }
            return true;
        });
        
        // Clean up obstacle sprites array
        this.obstacleSprites = this.obstacleSprites.filter(sprite => {
            if (!sprite.exists()) {
                return false;
            }
            return sprite.pos.x > this.player.x - 300;
        });
        
        // Periodic particle cleanup
        const now = Date.now();
        if (now - this.lastPerformanceCheck > 5000) { // Every 5 seconds
            this.cleanupParticles();
            this.lastPerformanceCheck = now;
        }
        
        // Extend background elements as needed (less frequently on low performance)
        const shouldExtendBackground = !window.performanceMonitor || 
                                     window.performanceMonitor.getFPS() > 30 || 
                                     this.frameSkipCounter % 5 === 0;
        
        if (shouldExtendBackground) {
            this.extendBackground();
        }
    }

    /**
     * Extend background elements as the player moves forward
     */
    extendBackground() {
        const rightmostElement = Math.max(...this.backgroundElements.map(el => el.pos.x + 100));
        
        if (rightmostElement < this.player.x + 800) {
            // Add more ground
            for (let i = 0; i < 5; i++) {
                const ground = add([
                    rect(100, 50),
                    pos(rightmostElement + i * 100, this.groundY + 40),
                    color(101, 67, 33),
                    "ground"
                ]);
                this.backgroundElements.push(ground);
            }
            
            // Add more trees
            for (let i = 0; i < 3; i++) {
                const tree = add([
                    rect(20, 80),
                    pos(rightmostElement + i * 150 + Math.random() * 50, this.groundY - 40),
                    color(34, 139, 34),
                    "tree"
                ]);
                this.backgroundElements.push(tree);
            }
            
            // Add more clouds
            const cloud = add([
                rect(60, 30),
                pos(rightmostElement + Math.random() * 200, 50 + Math.random() * 100),
                color(255, 255, 255),
                opacity(0.7),
                "cloud"
            ]);
            this.backgroundElements.push(cloud);
        }
        
        // Remove background elements that are far behind
        this.backgroundElements = this.backgroundElements.filter(element => {
            if (element.pos.x < this.player.x - 400) {
                if (element.exists()) {
                    element.destroy();
                }
                return false;
            }
            return true;
        });
    }

    /**
     * Check for collisions between player and obstacles
     * @returns {Obstacle|null} - The obstacle that was hit, or null
     */
    checkCollisions() {
        try {
            if (!this.playerSprite || !Array.isArray(this.obstacles)) {
                return null;
            }
            
            for (let i = this.obstacles.length - 1; i >= 0; i--) {
                try {
                    const obstacle = this.obstacles[i];
                    
                    if (!obstacle) {
                        // Remove invalid obstacle
                        this.obstacles.splice(i, 1);
                        continue;
                    }
                    
                    let collisionDetected = false;
                    
                    // Use Kaboom.js collision detection if sprite exists
                    if (obstacle.sprite && obstacle.sprite.exists && obstacle.sprite.exists()) {
                        try {
                            if (this.playerSprite.isColliding && this.playerSprite.isColliding(obstacle.sprite)) {
                                collisionDetected = true;
                            }
                        } catch (kaboomCollisionError) {
                            console.warn('RunnerEngine: Kaboom collision detection failed, using fallback:', kaboomCollisionError.message);
                            // Fall through to manual collision detection
                        }
                    }
                    
                    // Fallback to manual collision detection if Kaboom failed or sprite doesn't exist
                    if (!collisionDetected && this.isValidObstacle(obstacle)) {
                        try {
                            const playerBounds = {
                                left: this.player.x,
                                right: this.player.x + this.player.width,
                                top: this.player.y,
                                bottom: this.player.y + this.player.height
                            };

                            const obstacleBounds = {
                                left: obstacle.x,
                                right: obstacle.x + obstacle.width,
                                top: obstacle.y,
                                bottom: obstacle.y + obstacle.height
                            };

                            // Simple AABB collision detection with validation
                            if (this.isValidBounds(playerBounds) && this.isValidBounds(obstacleBounds)) {
                                collisionDetected = (
                                    playerBounds.right > obstacleBounds.left &&
                                    playerBounds.left < obstacleBounds.right &&
                                    playerBounds.bottom > obstacleBounds.top &&
                                    playerBounds.top < obstacleBounds.bottom
                                );
                            }
                        } catch (manualCollisionError) {
                            console.warn('RunnerEngine: Manual collision detection failed:', manualCollisionError.message);
                            // Skip this obstacle
                            continue;
                        }
                    }
                    
                    if (collisionDetected) {
                        // Safely remove the obstacle that was hit
                        try {
                            if (obstacle.sprite && obstacle.sprite.destroy) {
                                obstacle.sprite.destroy();
                            }
                        } catch (destroyError) {
                            console.warn('RunnerEngine: Error destroying obstacle sprite:', destroyError.message);
                        }
                        
                        this.obstacles.splice(i, 1);
                        return obstacle;
                    }
                    
                } catch (obstacleError) {
                    console.warn(`RunnerEngine: Error checking collision for obstacle ${i}:`, obstacleError.message);
                    // Remove problematic obstacle
                    this.obstacles.splice(i, 1);
                    continue;
                }
            }

            return null;
            
        } catch (error) {
            console.error('RunnerEngine: Critical error in collision detection:', error.message);
            return null;
        }
    }

    /**
     * Validate obstacle object
     * @param {Obstacle} obstacle - Obstacle to validate
     * @returns {boolean} - Whether obstacle is valid
     * @private
     */
    isValidObstacle(obstacle) {
        return obstacle &&
               typeof obstacle.x === 'number' && isFinite(obstacle.x) &&
               typeof obstacle.y === 'number' && isFinite(obstacle.y) &&
               typeof obstacle.width === 'number' && isFinite(obstacle.width) && obstacle.width > 0 &&
               typeof obstacle.height === 'number' && isFinite(obstacle.height) && obstacle.height > 0;
    }

    /**
     * Validate bounds object
     * @param {Object} bounds - Bounds to validate
     * @returns {boolean} - Whether bounds are valid
     * @private
     */
    isValidBounds(bounds) {
        return bounds &&
               typeof bounds.left === 'number' && isFinite(bounds.left) &&
               typeof bounds.right === 'number' && isFinite(bounds.right) &&
               typeof bounds.top === 'number' && isFinite(bounds.top) &&
               typeof bounds.bottom === 'number' && isFinite(bounds.bottom) &&
               bounds.right >= bounds.left &&
               bounds.bottom >= bounds.top;
    }

    /**
     * Trigger a question event
     */
    triggerQuestion() {
        this.questionTriggerListeners.forEach(listener => {
            listener();
        });
    }

    /**
     * Update the scrolling background
     * @param {number} deltaTime - Time elapsed since last update (in seconds)
     */
    updateBackground(deltaTime) {
        this.backgroundOffset += this.playerSpeed * deltaTime;
        
        // Create parallax effect for clouds (move slower than ground)
        this.backgroundElements.forEach(element => {
            if (element.is && element.is("cloud")) {
                // Clouds move slower for parallax effect
                element.pos.x -= this.playerSpeed * deltaTime * 0.3;
            }
        });
    }

    /**
     * Get the current background offset for rendering
     * @returns {number} - Background offset
     */
    getBackgroundOffset() {
        return this.backgroundOffset;
    }

    /**
     * Add a listener for question trigger events
     * @param {Function} listener - Function to call when question should be triggered
     */
    addQuestionTriggerListener(listener) {
        this.questionTriggerListeners.push(listener);
    }

    /**
     * Add a listener for collision events
     * @param {Function} listener - Function to call when collision occurs
     */
    addCollisionListener(listener) {
        this.collisionListeners.push(listener);
    }

    /**
     * Reset the runner engine to initial state
     */
    reset() {
        // Reset player state
        this.player = {
            x: 100,
            y: this.groundY,
            width: 40,
            height: 40,
            velocityY: 0,
            isJumping: false,
            isStumbling: false
        };
        
        // Clear obstacles
        this.obstacles.forEach(obstacle => {
            if (obstacle.sprite && obstacle.sprite.exists()) {
                obstacle.sprite.destroy();
            }
        });
        this.obstacles = [];
        
        // Clear obstacle sprites
        this.obstacleSprites.forEach(sprite => {
            if (sprite.exists()) {
                sprite.destroy();
            }
        });
        this.obstacleSprites = [];
        
        // Clear background elements
        this.backgroundElements.forEach(element => {
            if (element.exists()) {
                element.destroy();
            }
        });
        this.backgroundElements = [];
        
        // Reset other state
        this.backgroundOffset = 0;
        this.lastObstacleSpawn = 0;
        this.cameraX = 0;
        
        // Recreate initial elements
        this.createBackground();
        if (this.playerSprite && this.playerSprite.exists()) {
            this.playerSprite.pos = vec2(this.player.x, this.player.y);
        } else {
            this.createPlayerSprite();
        }
        
        // Reset camera
        camPos(0, 0);
    }

    /**
     * Get current player state for rendering
     * @returns {Player} - Current player state
     */
    getPlayerState() {
        return { ...this.player };
    }

    /**
     * Get current obstacles for rendering
     * @returns {Obstacle[]} - Current obstacles
     */
    getObstacles() {
        return [...this.obstacles];
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RunnerEngine;
}