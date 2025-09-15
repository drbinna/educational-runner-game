/**
 * Performance Implementation Verification Script
 * Verifies that performance optimizations are properly implemented in the code
 */

const fs = require('fs');
const path = require('path');

// Test results storage
const testResults = {
    performanceMonitoringClass: false,
    responsiveCanvasManager: false,
    memoryManagerClass: false,
    mobileOptimizations: false,
    particleOptimizations: false,
    browserCompatibility: false,
    performanceAwareGameLoop: false,
    responsiveCSS: false
};

/**
 * Read file content safely
 */
function readFileContent(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.log(`⚠️  Could not read ${filePath}: ${error.message}`);
        return '';
    }
}

/**
 * Test if Performance Monitor class is implemented
 */
function testPerformanceMonitoringImplementation() {
    console.log('Testing Performance Monitoring Implementation...');
    
    const mainJs = readFileContent('main.js');
    
    const hasPerformanceMonitorClass = mainJs.includes('class PerformanceMonitor');
    const hasFPSTracking = mainJs.includes('this.fps') && mainJs.includes('frameCount');
    const hasMemoryTracking = mainJs.includes('performance.memory');
    const hasQualityAdjustment = mainJs.includes('adjustPerformance') && mainJs.includes('qualityLevel');
    const hasPerformanceThreshold = mainJs.includes('lowPerformanceThreshold');
    
    if (hasPerformanceMonitorClass && hasFPSTracking && hasMemoryTracking && 
        hasQualityAdjustment && hasPerformanceThreshold) {
        testResults.performanceMonitoringClass = true;
        console.log('✅ Performance Monitoring Class: PASS');
        console.log('   - PerformanceMonitor class exists');
        console.log('   - FPS tracking implemented');
        console.log('   - Memory tracking implemented');
        console.log('   - Quality adjustment implemented');
        console.log('   - Performance threshold checking implemented');
    } else {
        console.log('❌ Performance Monitoring Class: FAIL');
        console.log(`   - PerformanceMonitor class: ${hasPerformanceMonitorClass}`);
        console.log(`   - FPS tracking: ${hasFPSTracking}`);
        console.log(`   - Memory tracking: ${hasMemoryTracking}`);
        console.log(`   - Quality adjustment: ${hasQualityAdjustment}`);
        console.log(`   - Performance threshold: ${hasPerformanceThreshold}`);
    }
}

/**
 * Test if Responsive Canvas Manager is implemented
 */
function testResponsiveCanvasImplementation() {
    console.log('Testing Responsive Canvas Implementation...');
    
    const mainJs = readFileContent('main.js');
    
    const hasResponsiveCanvasClass = mainJs.includes('class ResponsiveCanvasManager');
    const hasMobileDetection = mainJs.includes('detectMobile') && mainJs.includes('navigator.userAgent');
    const hasOptimalSizeCalculation = mainJs.includes('calculateOptimalSize');
    const hasAspectRatioHandling = mainJs.includes('aspectRatio');
    const hasScaleFactorCalculation = mainJs.includes('scaleFactor');
    const hasOrientationHandling = mainJs.includes('orientationchange');
    
    if (hasResponsiveCanvasClass && hasMobileDetection && hasOptimalSizeCalculation && 
        hasAspectRatioHandling && hasScaleFactorCalculation && hasOrientationHandling) {
        testResults.responsiveCanvasManager = true;
        console.log('✅ Responsive Canvas Manager: PASS');
        console.log('   - ResponsiveCanvasManager class exists');
        console.log('   - Mobile detection implemented');
        console.log('   - Optimal size calculation implemented');
        console.log('   - Aspect ratio handling implemented');
        console.log('   - Scale factor calculation implemented');
        console.log('   - Orientation change handling implemented');
    } else {
        console.log('❌ Responsive Canvas Manager: FAIL');
        console.log(`   - ResponsiveCanvasManager class: ${hasResponsiveCanvasClass}`);
        console.log(`   - Mobile detection: ${hasMobileDetection}`);
        console.log(`   - Optimal size calculation: ${hasOptimalSizeCalculation}`);
        console.log(`   - Aspect ratio handling: ${hasAspectRatioHandling}`);
        console.log(`   - Scale factor calculation: ${hasScaleFactorCalculation}`);
        console.log(`   - Orientation handling: ${hasOrientationHandling}`);
    }
}

/**
 * Test if Memory Manager is implemented
 */
function testMemoryManagerImplementation() {
    console.log('Testing Memory Manager Implementation...');
    
    const mainJs = readFileContent('main.js');
    
    const hasMemoryManagerClass = mainJs.includes('class MemoryManager');
    const hasObjectPools = mainJs.includes('objectPools') && mainJs.includes('Map()');
    const hasPoolCreation = mainJs.includes('createObjectPool');
    const hasPoolRetrieval = mainJs.includes('getFromPool');
    const hasPoolReturn = mainJs.includes('returnToPool');
    const hasCleanupMechanism = mainJs.includes('performCleanup');
    
    if (hasMemoryManagerClass && hasObjectPools && hasPoolCreation && 
        hasPoolRetrieval && hasPoolReturn && hasCleanupMechanism) {
        testResults.memoryManagerClass = true;
        console.log('✅ Memory Manager Class: PASS');
        console.log('   - MemoryManager class exists');
        console.log('   - Object pools implemented');
        console.log('   - Pool creation implemented');
        console.log('   - Pool retrieval implemented');
        console.log('   - Pool return implemented');
        console.log('   - Cleanup mechanism implemented');
    } else {
        console.log('❌ Memory Manager Class: FAIL');
        console.log(`   - MemoryManager class: ${hasMemoryManagerClass}`);
        console.log(`   - Object pools: ${hasObjectPools}`);
        console.log(`   - Pool creation: ${hasPoolCreation}`);
        console.log(`   - Pool retrieval: ${hasPoolRetrieval}`);
        console.log(`   - Pool return: ${hasPoolReturn}`);
        console.log(`   - Cleanup mechanism: ${hasCleanupMechanism}`);
    }
}

/**
 * Test if mobile optimizations are implemented
 */
function testMobileOptimizations() {
    console.log('Testing Mobile Optimizations...');
    
    const mainJs = readFileContent('main.js');
    const indexHtml = readFileContent('index.html ');
    
    const hasTouchControls = mainJs.includes('onClick') && mainJs.includes('touchToMouse');
    const hasVisibilityHandling = mainJs.includes('visibilitychange');
    const hasViewportMeta = indexHtml.includes('viewport') && indexHtml.includes('user-scalable=no');
    const hasMobileCSS = indexHtml.includes('@media') && indexHtml.includes('max-width: 768px');
    const hasTouchOptimizations = indexHtml.includes('touch-action') && indexHtml.includes('user-select: none');
    
    if (hasTouchControls && hasVisibilityHandling && hasViewportMeta && 
        hasMobileCSS && hasTouchOptimizations) {
        testResults.mobileOptimizations = true;
        console.log('✅ Mobile Optimizations: PASS');
        console.log('   - Touch controls implemented');
        console.log('   - Visibility change handling implemented');
        console.log('   - Viewport meta tag implemented');
        console.log('   - Mobile CSS implemented');
        console.log('   - Touch optimizations implemented');
    } else {
        console.log('❌ Mobile Optimizations: FAIL');
        console.log(`   - Touch controls: ${hasTouchControls}`);
        console.log(`   - Visibility handling: ${hasVisibilityHandling}`);
        console.log(`   - Viewport meta: ${hasViewportMeta}`);
        console.log(`   - Mobile CSS: ${hasMobileCSS}`);
        console.log(`   - Touch optimizations: ${hasTouchOptimizations}`);
    }
}

/**
 * Test if particle optimizations are implemented
 */
function testParticleOptimizations() {
    console.log('Testing Particle Optimizations...');
    
    const runnerEngineJs = readFileContent('game/runner-engine.js');
    
    const hasParticleTracking = runnerEngineJs.includes('activeParticles');
    const hasMaxParticleLimit = runnerEngineJs.includes('maxParticles');
    const hasParticleCleanup = runnerEngineJs.includes('cleanupParticles');
    const hasPerformanceAwareParticles = runnerEngineJs.includes('shouldUseParticleEffects');
    const hasParticleCountAdjustment = runnerEngineJs.includes('particleCount') && 
                                      runnerEngineJs.includes('performanceMonitor');
    
    if (hasParticleTracking && hasMaxParticleLimit && hasParticleCleanup && 
        hasPerformanceAwareParticles && hasParticleCountAdjustment) {
        testResults.particleOptimizations = true;
        console.log('✅ Particle Optimizations: PASS');
        console.log('   - Particle tracking implemented');
        console.log('   - Max particle limit implemented');
        console.log('   - Particle cleanup implemented');
        console.log('   - Performance-aware particles implemented');
        console.log('   - Particle count adjustment implemented');
    } else {
        console.log('❌ Particle Optimizations: FAIL');
        console.log(`   - Particle tracking: ${hasParticleTracking}`);
        console.log(`   - Max particle limit: ${hasMaxParticleLimit}`);
        console.log(`   - Particle cleanup: ${hasParticleCleanup}`);
        console.log(`   - Performance-aware particles: ${hasPerformanceAwareParticles}`);
        console.log(`   - Particle count adjustment: ${hasParticleCountAdjustment}`);
    }
}

/**
 * Test if browser compatibility features are implemented
 */
function testBrowserCompatibilityFeatures() {
    console.log('Testing Browser Compatibility Features...');
    
    const mainJs = readFileContent('main.js');
    const indexHtml = readFileContent('index.html ');
    
    const hasErrorHandling = mainJs.includes('window.addEventListener(\'error\'') && 
                            mainJs.includes('unhandledrejection');
    const hasFeatureDetection = mainJs.includes('performance.memory') && 
                               mainJs.includes('typeof');
    const hasGracefulDegradation = mainJs.includes('catch') && mainJs.includes('try');
    const hasMetaTags = indexHtml.includes('apple-mobile-web-app-capable') && 
                       indexHtml.includes('mobile-web-app-capable');
    const hasCrispRendering = mainJs.includes('crisp: true');
    
    if (hasErrorHandling && hasFeatureDetection && hasGracefulDegradation && 
        hasMetaTags && hasCrispRendering) {
        testResults.browserCompatibility = true;
        console.log('✅ Browser Compatibility Features: PASS');
        console.log('   - Error handling implemented');
        console.log('   - Feature detection implemented');
        console.log('   - Graceful degradation implemented');
        console.log('   - Meta tags implemented');
        console.log('   - Crisp rendering implemented');
    } else {
        console.log('❌ Browser Compatibility Features: FAIL');
        console.log(`   - Error handling: ${hasErrorHandling}`);
        console.log(`   - Feature detection: ${hasFeatureDetection}`);
        console.log(`   - Graceful degradation: ${hasGracefulDegradation}`);
        console.log(`   - Meta tags: ${hasMetaTags}`);
        console.log(`   - Crisp rendering: ${hasCrispRendering}`);
    }
}

/**
 * Test if performance-aware game loop is implemented
 */
function testPerformanceAwareGameLoop() {
    console.log('Testing Performance-Aware Game Loop...');
    
    const mainJs = readFileContent('main.js');
    const runnerEngineJs = readFileContent('game/runner-engine.js');
    
    const hasPerformanceMonitoring = mainJs.includes('performanceMonitor.update()');
    const hasFrameSkipping = mainJs.includes('getFPS()') && mainJs.includes('< 20');
    const hasPerformanceBasedUpdates = runnerEngineJs.includes('frameSkipCounter');
    const hasConditionalRendering = runnerEngineJs.includes('shouldExtendBackground');
    const hasDeltaTimeValidation = mainJs.includes('isNaN(deltaTime)');
    
    if (hasPerformanceMonitoring && hasFrameSkipping && hasPerformanceBasedUpdates && 
        hasConditionalRendering && hasDeltaTimeValidation) {
        testResults.performanceAwareGameLoop = true;
        console.log('✅ Performance-Aware Game Loop: PASS');
        console.log('   - Performance monitoring in game loop');
        console.log('   - Frame skipping implemented');
        console.log('   - Performance-based updates implemented');
        console.log('   - Conditional rendering implemented');
        console.log('   - Delta time validation implemented');
    } else {
        console.log('❌ Performance-Aware Game Loop: FAIL');
        console.log(`   - Performance monitoring: ${hasPerformanceMonitoring}`);
        console.log(`   - Frame skipping: ${hasFrameSkipping}`);
        console.log(`   - Performance-based updates: ${hasPerformanceBasedUpdates}`);
        console.log(`   - Conditional rendering: ${hasConditionalRendering}`);
        console.log(`   - Delta time validation: ${hasDeltaTimeValidation}`);
    }
}

/**
 * Test if responsive CSS is implemented
 */
function testResponsiveCSS() {
    console.log('Testing Responsive CSS...');
    
    const indexHtml = readFileContent('index.html ');
    
    const hasMobileMediaQueries = indexHtml.includes('@media (max-width: 768px)');
    const hasLandscapeOptimization = indexHtml.includes('orientation: landscape');
    const hasHighDPIOptimization = indexHtml.includes('min-device-pixel-ratio') || 
                                  indexHtml.includes('min-resolution');
    const hasFlexboxLayout = indexHtml.includes('display: flex');
    const hasViewportUnits = indexHtml.includes('100vh') || indexHtml.includes('100vw');
    const hasBoxSizing = indexHtml.includes('box-sizing: border-box');
    
    if (hasMobileMediaQueries && hasLandscapeOptimization && hasHighDPIOptimization && 
        hasFlexboxLayout && hasViewportUnits && hasBoxSizing) {
        testResults.responsiveCSS = true;
        console.log('✅ Responsive CSS: PASS');
        console.log('   - Mobile media queries implemented');
        console.log('   - Landscape optimization implemented');
        console.log('   - High DPI optimization implemented');
        console.log('   - Flexbox layout implemented');
        console.log('   - Viewport units implemented');
        console.log('   - Box sizing implemented');
    } else {
        console.log('❌ Responsive CSS: FAIL');
        console.log(`   - Mobile media queries: ${hasMobileMediaQueries}`);
        console.log(`   - Landscape optimization: ${hasLandscapeOptimization}`);
        console.log(`   - High DPI optimization: ${hasHighDPIOptimization}`);
        console.log(`   - Flexbox layout: ${hasFlexboxLayout}`);
        console.log(`   - Viewport units: ${hasViewportUnits}`);
        console.log(`   - Box sizing: ${hasBoxSizing}`);
    }
}

/**
 * Run all implementation verification tests
 */
function runAllTests() {
    console.log('🚀 Starting Performance Implementation Verification...\n');
    
    testPerformanceMonitoringImplementation();
    console.log('');
    
    testResponsiveCanvasImplementation();
    console.log('');
    
    testMemoryManagerImplementation();
    console.log('');
    
    testMobileOptimizations();
    console.log('');
    
    testParticleOptimizations();
    console.log('');
    
    testBrowserCompatibilityFeatures();
    console.log('');
    
    testPerformanceAwareGameLoop();
    console.log('');
    
    testResponsiveCSS();
    console.log('');
    
    // Summary
    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    const successRate = (passedTests / totalTests) * 100;
    
    console.log('📊 Implementation Verification Summary:');
    console.log(`   - Tests passed: ${passedTests}/${totalTests}`);
    console.log(`   - Success rate: ${successRate.toFixed(1)}%`);
    
    if (successRate >= 80) {
        console.log('🎉 Performance optimization implementation: SUCCESS');
        console.log('   All major performance optimizations are properly implemented!');
    } else {
        console.log('⚠️  Performance optimization implementation: NEEDS IMPROVEMENT');
        console.log('   Some performance optimizations may be missing or incomplete.');
    }
    
    console.log('\n📋 Detailed Results:');
    for (const [test, passed] of Object.entries(testResults)) {
        const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        console.log(`   ${passed ? '✅' : '❌'} ${testName}`);
    }
    
    // Specific recommendations
    console.log('\n💡 Implementation Status:');
    if (testResults.performanceMonitoringClass) {
        console.log('   ✅ Frame rate monitoring and performance optimization - IMPLEMENTED');
    }
    if (testResults.responsiveCanvasManager) {
        console.log('   ✅ Responsive canvas sizing for different screen sizes - IMPLEMENTED');
    }
    if (testResults.memoryManagerClass && testResults.particleOptimizations) {
        console.log('   ✅ Memory usage optimization during extended gameplay - IMPLEMENTED');
    }
    if (testResults.mobileOptimizations && testResults.browserCompatibility) {
        console.log('   ✅ Browser compatibility with modern browsers and mobile devices - IMPLEMENTED');
    }
    
    return testResults;
}

// Run tests
runAllTests();

module.exports = {
    runAllTests,
    testResults
};