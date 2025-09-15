/**
 * Test suite for Runner Engine mechanics
 * Verifies task 4 requirements: Basic runner game mechanics with Kaboom.js
 */

// Mock Kaboom.js functions for testing
global.add = jest.fn(() => ({ 
    pos: { x: 0, y: 0 }, 
    exists: () => true, 
    destroy: jest.fn(), 
    isGrounded: jest.fn(() => true),
    jump: jest.fn(),
    isColliding: jest.fn(() => false),
    color: rgb(0, 255, 0),
    hidden: false,
    onGround: jest.fn(),
    is: jest.fn(() => false)
}));
global.rect = jest.fn();
global.pos = jest.fn();
global.color = jest.fn();
global.rgb = jest.fn();
global.area = jest.fn();
global.body = jest.fn();
global.text = jest.fn();
global.origin = jest.fn();
global.opacity = jest.fn();
global.width = jest.fn(() => 800);
global.height = jest.fn(() => 600);
global.camPos = jest.fn();
global.vec2 = jest.fn((x, y) => ({ x, y }));

// Load the RunnerEngine
const RunnerEngine = require('../game/runner-engine.js');

// Mock GameStateManager
const mockGameStateManager = {
    gameState: {
        playerPosition: { x: 0, y: 0 }
    },
    shouldTriggerQuestion: jest.fn(() => false),
    resetQuestionTimer: jest.fn(),
    updateGameTime: jest.fn()
};

describe('RunnerEngine - Task 4: Basic runner game mechanics', () => {
    let runnerEngine;

    beforeEach(() => {
        jest.clearAllMocks();
        runnerEngine = new RunnerEngine(mockGameStateManager);
    });

    describe('Player character with automatic forward movement', () => {
        test('should create player character that moves forward automatically', () => {
            expect(runnerEngine.player.x).toBe(100);
            expect(runnerEngine.playerSpeed).toBe(200);
            
            // Test automatic movement
            const initialX = runnerEngine.player.x;
            runnerEngine.updatePlayer(1); // 1 second
            
            expect(runnerEngine.player.x).toBe(initialX + 200); // moved 200 pixels in 1 second
        });

        test('should use Kaboom.js sprites for player character', () => {
            expect(add).toHaveBeenCalled();
            expect(runnerEngine.playerSprite).toBeDefined();
        });

        test('should handle stumbling animation affecting movement', () => {
            runnerEngine.stumble(1000);
            expect(runnerEngine.player.isStumbling).toBe(true);
            
            const initialX = runnerEngine.player.x;
            runnerEngine.updatePlayer(1); // 1 second
            
            // Should move slower when stumbling (30% speed)
            expect(runnerEngine.player.x).toBe(initialX + 60); // 200 * 0.3 = 60
        });
    });

    describe('Scrolling background system', () => {
        test('should create background elements', () => {
            expect(add).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.anything(), // rect
                    expect.anything(), // pos
                    expect.anything(), // color
                    "ground"
                ])
            );
        });

        test('should update background offset', () => {
            const initialOffset = runnerEngine.backgroundOffset;
            runnerEngine.updateBackground(1);
            
            expect(runnerEngine.backgroundOffset).toBe(initialOffset + 200);
        });

        test('should extend background as player moves', () => {
            const initialCallCount = add.mock.calls.length;
            
            // Move player far enough to trigger background extension
            runnerEngine.player.x = 1000;
            runnerEngine.updateObstacles(0.1);
            
            expect(add.mock.calls.length).toBeGreaterThan(initialCallCount);
        });

        test('should implement camera following for scrolling effect', () => {
            runnerEngine.player.x = 500;
            runnerEngine.updateCamera();
            
            expect(camPos).toHaveBeenCalledWith(300, 0); // player.x - width()/4
        });
    });

    describe('Obstacle and gate spawning system', () => {
        test('should spawn regular obstacles', () => {
            runnerEngine.spawnObstacle();
            
            expect(runnerEngine.obstacles.length).toBe(1);
            expect(runnerEngine.obstacles[0].type).toBe('obstacle');
            expect(runnerEngine.obstacles[0].x).toBe(runnerEngine.player.x + 600);
        });

        test('should spawn question gates', () => {
            runnerEngine.spawnQuestionGate();
            
            expect(runnerEngine.obstacles.length).toBe(1);
            expect(runnerEngine.obstacles[0].type).toBe('question_gate');
            expect(runnerEngine.obstacles[0].x).toBe(runnerEngine.player.x + 400);
        });

        test('should spawn obstacles at intervals', () => {
            // Mock Date.now to control timing
            const originalNow = Date.now;
            Date.now = jest.fn(() => 5000); // 5 seconds
            
            runnerEngine.lastObstacleSpawn = 0; // Reset spawn timer
            runnerEngine.spawnObstacles(0.1);
            
            expect(runnerEngine.obstacles.length).toBeGreaterThan(0);
            
            Date.now = originalNow;
        });

        test('should remove off-screen obstacles', () => {
            // Add obstacle behind player
            runnerEngine.obstacles.push({
                x: -500,
                y: 300,
                width: 30,
                height: 40,
                type: 'obstacle',
                sprite: { exists: () => true, destroy: jest.fn() }
            });
            
            runnerEngine.updateObstacles(0.1);
            
            expect(runnerEngine.obstacles.length).toBe(0);
        });
    });

    describe('Collision detection system', () => {
        test('should detect collisions between player and obstacles', () => {
            // Mock collision
            const mockObstacle = {
                x: 100,
                y: 300,
                width: 30,
                height: 40,
                type: 'obstacle',
                sprite: { 
                    exists: () => true, 
                    destroy: jest.fn() 
                }
            };
            
            runnerEngine.obstacles.push(mockObstacle);
            runnerEngine.playerSprite.isColliding = jest.fn(() => true);
            
            const collision = runnerEngine.checkCollisions();
            
            expect(collision).toBe(mockObstacle);
            expect(runnerEngine.obstacles.length).toBe(0); // Obstacle should be removed
        });

        test('should handle different collision types', () => {
            const questionGate = {
                x: 100,
                y: 300,
                width: 65,
                height: 80,
                type: 'question_gate',
                sprite: { 
                    exists: () => true, 
                    destroy: jest.fn() 
                }
            };
            
            runnerEngine.obstacles.push(questionGate);
            runnerEngine.playerSprite.isColliding = jest.fn(() => true);
            
            const collision = runnerEngine.checkCollisions();
            
            expect(collision.type).toBe('question_gate');
        });
    });

    describe('Smooth movement animations and physics', () => {
        test('should implement jumping mechanics', () => {
            runnerEngine.playerSprite.isGrounded = jest.fn(() => true);
            runnerEngine.jump();
            
            expect(runnerEngine.playerSprite.jump).toHaveBeenCalled();
            expect(runnerEngine.player.isJumping).toBe(true);
        });

        test('should prevent double jumping', () => {
            runnerEngine.playerSprite.isGrounded = jest.fn(() => false);
            runnerEngine.jump();
            
            expect(runnerEngine.playerSprite.jump).not.toHaveBeenCalled();
        });

        test('should implement smooth stumbling animation', () => {
            runnerEngine.stumble(500);
            
            expect(runnerEngine.player.isStumbling).toBe(true);
            
            // Test that stumbling affects movement
            const initialX = runnerEngine.player.x;
            runnerEngine.updatePlayer(0.1);
            
            // Should move slower when stumbling
            expect(runnerEngine.player.x).toBeLessThan(initialX + 20); // Normal would be 20, stumbling is 6
        });
    });

    describe('Game state integration', () => {
        test('should update game state with player position', () => {
            runnerEngine.player.x = 300;
            runnerEngine.player.y = 250;
            runnerEngine.playerSprite.pos.y = 250; // Set sprite position
            runnerEngine.updatePlayer(0.1);
            
            // Account for automatic movement during update
            expect(mockGameStateManager.gameState.playerPosition.x).toBeGreaterThan(300);
            expect(mockGameStateManager.gameState.playerPosition.y).toBe(250);
        });

        test('should reset to initial state', () => {
            runnerEngine.player.x = 500;
            runnerEngine.obstacles.push({ type: 'test', sprite: { exists: () => true, destroy: jest.fn() } });
            
            runnerEngine.reset();
            
            expect(runnerEngine.player.x).toBe(100);
            expect(runnerEngine.obstacles.length).toBe(0);
            expect(runnerEngine.backgroundOffset).toBe(0);
        });
    });
});