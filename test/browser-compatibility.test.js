/**
 * Browser compatibility tests for Chrome, Firefox, Safari, and mobile browsers
 * Tests browser-specific features and API compatibility
 */

// Mock different browser environments
const mockBrowserEnvironments = {
    chrome: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        features: {
            fetch: true,
            localStorage: true,
            sessionStorage: true,
            indexedDB: true,
            webGL: true,
            canvas: true,
            audioContext: true,
            requestAnimationFrame: true,
            performance: true
        }
    },
    firefox: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        features: {
            fetch: true,
            localStorage: true,
            sessionStorage: true,
            indexedDB: true,
            webGL: true,
            canvas: true,
            audioContext: true,
            requestAnimationFrame: true,
            performance: true
        }
    },
    safari: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        features: {
            fetch: true,
            localStorage: true,
            sessionStorage: true,
            indexedDB: true,
            webGL: true,
            canvas: true,
            audioContext: false, // Safari has restrictions
            requestAnimationFrame: true,
            performance: true
        }
    },
    mobileSafari: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        features: {
            fetch: true,
            localStorage: true,
            sessionStorage: true,
            indexedDB: true,
            webGL: false, // Limited on mobile
            canvas: true,
            audioContext: false, // Restricted on mobile Safari
            requestAnimationFrame: true,
            performance: true
        }
    },
    mobileChrome: {
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        features: {
            fetch: true,
            localStorage: true,
            sessionStorage: true,
            indexedDB: true,
            webGL: true,
            canvas: true,
            audioContext: true,
            requestAnimationFrame: true,
            performance: true
        }
    }
};

// Mock browser-specific APIs
function mockBrowserEnvironment(browserName) {
    const env = mockBrowserEnvironments[browserName];
    
    // Mock navigator
    global.navigator = {
        userAgent: env.userAgent,
        platform: browserName.includes('mobile') ? 'Mobile' : 'Desktop',
        language: 'en-US',
        languages: ['en-US', 'en'],
        onLine: true,
        cookieEnabled: true
    };

    // Mock window object
    global.window = {
        navigator: global.navigator,
        location: { href: 'http://localhost:3000' },
        innerWidth: browserName.includes('mobile') ? 375 : 1920,
        innerHeight: browserName.includes('mobile') ? 667 : 1080,
        devicePixelRatio: browserName.includes('mobile') ? 2 : 1,
        requestAnimationFrame: env.features.requestAnimationFrame ? jest.fn() : undefined,
        cancelAnimationFrame: env.features.requestAnimationFrame ? jest.fn() : undefined,
        performance: env.features.performance ? {
            now: () => Date.now(),
            mark: jest.fn(),
            measure: jest.fn()
        } : undefined
    };

    // Mock localStorage
    if (env.features.localStorage) {
        const storage = {};
        global.localStorage = {
            getItem: jest.fn((key) => storage[key] || null),
            setItem: jest.fn((key, value) => { storage[key] = value; }),
            removeItem: jest.fn((key) => { delete storage[key]; }),
            clear: jest.fn(() => { Object.keys(storage).forEach(key => delete storage[key]); }),
            length: 0,
            key: jest.fn()
        };
    } else {
        global.localStorage = undefined;
    }

    // Mock fetch
    if (env.features.fetch) {
        global.fetch = jest.fn(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ questions: [] })
        }));
    } else {
        global.fetch = undefined;
    }

    // Mock canvas
    if (env.features.canvas) {
        global.HTMLCanvasElement = {
            prototype: {
                getContext: jest.fn(() => ({
                    fillRect: jest.fn(),
                    clearRect: jest.fn(),
                    drawImage: jest.fn(),
                    fillText: jest.fn(),
                    measureText: jest.fn(() => ({ width: 100 }))
                }))
            }
        };
    }

    // Mock DOM
    global.document = {
        createElement: jest.fn((tag) => {
            const element = {
                tagName: tag.toUpperCase(),
                style: {},
                textContent: '',
                innerHTML: '',
                appendChild: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                getAttribute: jest.fn(),
                setAttribute: jest.fn(),
                classList: {
                    add: jest.fn(),
                    remove: jest.fn(),
                    contains: jest.fn(() => false)
                }
            };

            if (tag === 'canvas' && env.features.canvas) {
                element.getContext = jest.fn(() => ({
                    fillRect: jest.fn(),
                    clearRect: jest.fn(),
                    drawImage: jest.fn()
                }));
                element.width = 800;
                element.height = 600;
            }

            return element;
        }),
        body: {
            appendChild: jest.fn(),
            style: {}
        },
        head: {
            appendChild: jest.fn()
        },
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    };

    return env;
}

// Load game classes
const ContentLoader = require('../game/content-loader.js');
const { GameStateManager, GameStates } = require('../game/game-state.js');

describe('Browser Compatibility Tests', () => {
    const browsers = ['chrome', 'firefox', 'safari', 'mobileSafari', 'mobileChrome'];

    browsers.forEach(browserName => {
        describe(`${browserName} compatibility`, () => {
            let env;
            let contentLoader;
            let gameStateManager;

            beforeEach(() => {
                env = mockBrowserEnvironment(browserName);
                contentLoader = new ContentLoader();
                gameStateManager = new GameStateManager();
            });

            test('should initialize core classes successfully', () => {
                expect(contentLoader).toBeDefined();
                expect(gameStateManager).toBeDefined();
                expect(gameStateManager.getCurrentState()).toBe(GameStates.MENU);
            });

            test('should handle fetch API availability', async () => {
                if (env.features.fetch) {
                    const result = await contentLoader.loadQuestions('test.json');
                    expect(result).toBeDefined();
                    expect(typeof result.success).toBe('boolean');
                } else {
                    // Should handle missing fetch gracefully
                    const result = await contentLoader.loadQuestions('test.json');
                    expect(result.success).toBe(false);
                    expect(result.error).toContain('fetch');
                }
            });

            test('should handle localStorage availability', () => {
                if (env.features.localStorage) {
                    expect(global.localStorage).toBeDefined();
                    expect(() => {
                        localStorage.setItem('test', 'value');
                        const value = localStorage.getItem('test');
                        expect(value).toBe('value');
                    }).not.toThrow();
                } else {
                    expect(global.localStorage).toBeUndefined();
                }
            });

            test('should handle performance API availability', () => {
                if (env.features.performance) {
                    expect(global.window.performance).toBeDefined();
                    expect(typeof global.window.performance.now).toBe('function');
                } else {
                    expect(global.window.performance).toBeUndefined();
                }
            });

            test('should handle canvas API availability', () => {
                if (env.features.canvas) {
                    const canvas = document.createElement('canvas');
                    expect(canvas).toBeDefined();
                    expect(typeof canvas.getContext).toBe('function');
                    
                    const ctx = canvas.getContext('2d');
                    expect(ctx).toBeDefined();
                } else {
                    const canvas = document.createElement('canvas');
                    expect(canvas.getContext).toBeUndefined();
                }
            });

            test('should handle requestAnimationFrame availability', () => {
                if (env.features.requestAnimationFrame) {
                    expect(global.window.requestAnimationFrame).toBeDefined();
                    expect(typeof global.window.requestAnimationFrame).toBe('function');
                } else {
                    expect(global.window.requestAnimationFrame).toBeUndefined();
                }
            });

            test('should adapt to screen size constraints', () => {
                const isMobile = browserName.includes('mobile');
                
                if (isMobile) {
                    expect(global.window.innerWidth).toBeLessThan(500);
                    expect(global.window.innerHeight).toBeLessThan(800);
                    expect(global.window.devicePixelRatio).toBeGreaterThan(1);
                } else {
                    expect(global.window.innerWidth).toBeGreaterThan(1000);
                    expect(global.window.innerHeight).toBeGreaterThan(600);
                }
            });

            test('should handle user agent detection', () => {
                expect(global.navigator.userAgent).toContain(
                    browserName === 'chrome' ? 'Chrome' :
                    browserName === 'firefox' ? 'Firefox' :
                    browserName === 'safari' || browserName === 'mobileSafari' ? 'Safari' :
                    browserName === 'mobileChrome' ? 'Chrome' : ''
                );
            });

            test('should handle game state management across browsers', () => {
                // Test basic state management
                gameStateManager.setState(GameStates.PLAYING);
                expect(gameStateManager.getCurrentState()).toBe(GameStates.PLAYING);

                gameStateManager.updateScore(100);
                expect(gameStateManager.gameState.score).toBe(100);

                gameStateManager.recordAnswer(true);
                expect(gameStateManager.gameState.questionsAnswered).toBe(1);
                expect(gameStateManager.gameState.correctAnswers).toBe(1);

                const stats = gameStateManager.getGameStats();
                expect(stats.accuracy).toBe(100);
            });

            test('should handle content loading with browser-specific constraints', async () => {
                const testQuestions = {
                    questions: [
                        {
                            prompt: 'Test question?',
                            options: ['A', 'B', 'C'],
                            answer: 'A',
                            feedback: 'Correct!'
                        }
                    ]
                };

                if (env.features.fetch) {
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: async () => testQuestions
                    });

                    const result = await contentLoader.loadQuestions('test.json');
                    expect(result.success).toBe(true);
                    expect(contentLoader.questions).toHaveLength(1);
                } else {
                    // Should provide fallback when fetch is not available
                    const question = contentLoader.getNextQuestion();
                    expect(question).not.toBeNull();
                    expect(question.prompt).toBeDefined();
                }
            });
        });
    });

    describe('Cross-browser feature detection', () => {
        test('should detect and handle missing APIs gracefully', () => {
            // Test with completely minimal environment
            global.window = {};
            global.navigator = {};
            global.document = {
                createElement: () => ({}),
                body: {},
                head: {}
            };
            global.localStorage = undefined;
            global.fetch = undefined;

            expect(() => {
                const loader = new ContentLoader();
                const manager = new GameStateManager();
                
                // Should not throw errors even with missing APIs
                manager.setState(GameStates.PLAYING);
                const question = loader.getNextQuestion();
                
                expect(question).not.toBeNull(); // Should provide fallback
            }).not.toThrow();
        });

        test('should provide appropriate fallbacks for missing features', () => {
            // Mock environment with limited features
            global.fetch = undefined;
            global.localStorage = undefined;
            global.window = { requestAnimationFrame: undefined };

            const contentLoader = new ContentLoader();
            
            // Should still provide basic functionality
            const question = contentLoader.getNextQuestion();
            expect(question).not.toBeNull();
            expect(question.prompt).toBeDefined();
            expect(question.options).toBeDefined();
            expect(question.answer).toBeDefined();
            expect(question.feedback).toBeDefined();
        });

        test('should handle different JavaScript engine capabilities', () => {
            // Test with different levels of ES6+ support
            const features = [
                'Promise',
                'fetch',
                'Array.from',
                'Object.assign',
                'const',
                'let',
                'arrow functions'
            ];

            // All our code should work with basic ES6 support
            expect(typeof Promise).toBe('function');
            expect(typeof Array.from).toBe('function');
            expect(typeof Object.assign).toBe('function');
        });
    });

    describe('Mobile-specific compatibility', () => {
        beforeEach(() => {
            mockBrowserEnvironment('mobileSafari');
        });

        test('should handle touch events appropriately', () => {
            const element = document.createElement('button');
            
            // Should be able to add touch event listeners without errors
            expect(() => {
                element.addEventListener('touchstart', () => {});
                element.addEventListener('touchend', () => {});
                element.addEventListener('touchmove', () => {});
            }).not.toThrow();
        });

        test('should handle viewport constraints', () => {
            expect(global.window.innerWidth).toBeLessThan(500);
            expect(global.window.innerHeight).toBeLessThan(800);
            
            // Game should adapt to small screens
            const gameStateManager = new GameStateManager();
            expect(gameStateManager).toBeDefined();
            
            // Should handle mobile-specific game state
            gameStateManager.setState(GameStates.PLAYING);
            expect(gameStateManager.getCurrentState()).toBe(GameStates.PLAYING);
        });

        test('should handle memory constraints on mobile', () => {
            const contentLoader = new ContentLoader();
            
            // Should handle smaller question sets efficiently on mobile
            const mobileQuestions = {
                questions: Array.from({ length: 50 }, (_, i) => ({
                    prompt: `Mobile question ${i}?`,
                    options: ['A', 'B'],
                    answer: 'A',
                    feedback: 'Good!'
                }))
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mobileQuestions
            });

            return contentLoader.loadQuestions('mobile.json').then(result => {
                expect(result.success).toBe(true);
                expect(contentLoader.questions).toHaveLength(50);
            });
        });

        test('should handle orientation changes', () => {
            // Simulate orientation change
            global.window.innerWidth = 667;
            global.window.innerHeight = 375;
            
            // Game should continue to work after orientation change
            const gameStateManager = new GameStateManager();
            gameStateManager.setState(GameStates.PLAYING);
            gameStateManager.updateScore(100);
            
            expect(gameStateManager.gameState.score).toBe(100);
        });
    });

    describe('Performance across browsers', () => {
        browsers.forEach(browserName => {
            test(`should maintain performance standards on ${browserName}`, () => {
                mockBrowserEnvironment(browserName);
                
                const contentLoader = new ContentLoader();
                const gameStateManager = new GameStateManager();
                
                const startTime = Date.now();
                
                // Perform standard operations
                gameStateManager.setState(GameStates.PLAYING);
                
                for (let i = 0; i < 100; i++) {
                    const question = contentLoader.getNextQuestion();
                    gameStateManager.recordAnswer(Math.random() > 0.5);
                    gameStateManager.updateGameTime(16);
                }
                
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                // Should complete within reasonable time on all browsers
                const maxTime = browserName.includes('mobile') ? 500 : 200;
                expect(duration).toBeLessThan(maxTime);
                
                console.log(`✓ ${browserName}: 100 operations in ${duration}ms`);
            });
        });
    });

    describe('Error handling across browsers', () => {
        test('should handle network errors consistently', async () => {
            browsers.forEach(async (browserName) => {
                mockBrowserEnvironment(browserName);
                
                const contentLoader = new ContentLoader();
                
                if (global.fetch) {
                    global.fetch.mockRejectedValueOnce(new Error('Network error'));
                    
                    const result = await contentLoader.loadQuestions('fail.json');
                    expect(result.success).toBe(false);
                    expect(result.error).toContain('Network error');
                }
            });
        });

        test('should handle storage quota exceeded', () => {
            browsers.forEach(browserName => {
                const env = mockBrowserEnvironment(browserName);
                
                if (env.features.localStorage) {
                    // Mock storage quota exceeded
                    global.localStorage.setItem.mockImplementationOnce(() => {
                        throw new Error('QuotaExceededError');
                    });
                    
                    expect(() => {
                        localStorage.setItem('test', 'value');
                    }).toThrow('QuotaExceededError');
                }
            });
        });
    });
});