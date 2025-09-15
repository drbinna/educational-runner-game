# Modular Subject System

The Educational Runner Game now supports a modular subject system that allows easy customization and expansion of educational content.

## Features

### ✅ Implemented Features

1. **Subject Configuration System**
   - Easy subject registration and management
   - Subject-specific themes and styling
   - Custom settings per subject
   - Dynamic subject switching

2. **Multiple Question Types**
   - Multiple Choice questions
   - True/False questions
   - Fill in the Blank questions
   - Matching questions (basic implementation)

3. **Theme System**
   - Subject-specific color schemes
   - Font customization
   - Visual consistency across subjects

4. **Content Management**
   - JSON-based question data
   - Automatic validation
   - Error handling and fallbacks

5. **Documentation**
   - Comprehensive customization guide
   - API documentation
   - Testing utilities

## Quick Start

### Adding a New Subject

1. **Create question data file**: `data/your-subject.json`
2. **Register the subject** in `game/subject-config.js`
3. **Test your implementation** using `test-subject-system.html`

### Example: Adding History Subject

```javascript
// In game/subject-config.js
this.registerSubject({
    id: 'history',
    name: 'History',
    description: 'Historical events and figures',
    dataFile: 'data/history-basic.json',
    theme: {
        primaryColor: '#8B4513',
        secondaryColor: '#D2691E',
        backgroundColor: '#F4A460',
        textColor: '#000000',
        correctColor: '#06D6A0',
        incorrectColor: '#EF476F',
        fontFamily: 'Times New Roman, serif'
    },
    supportedQuestionTypes: ['multiple_choice', 'true_false', 'fill_blank'],
    customSettings: {
        showTimeline: true,
        timeLimit: 35
    }
});
```

## Architecture

### Core Components

1. **SubjectConfigManager** (`game/subject-config.js`)
   - Manages subject configurations
   - Handles theme application
   - Provides subject selection UI

2. **QuestionTypeHandler** (`game/question-type-handler.js`)
   - Validates different question types
   - Renders question-specific UI
   - Handles type-specific input

3. **Enhanced ContentLoader** (`game/content-loader.js`)
   - Loads questions for specific subjects
   - Integrates with question type validation
   - Provides filtering and management

4. **Enhanced QuestionPresenter** (`game/question-presenter.js`)
   - Renders different question types
   - Applies subject themes
   - Handles various input methods

### Data Flow

```
Subject Selection → Load Questions → Validate Types → Render UI → Handle Input → Provide Feedback
```

## Available Subjects

### Mathematics
- **File**: `data/math-basic.json`
- **Types**: Multiple choice, True/false, Fill blank
- **Theme**: Blue color scheme
- **Topics**: Addition, subtraction, multiplication, division

### Science
- **File**: `data/science-basic.json`
- **Types**: Multiple choice, True/false, Fill blank, Matching
- **Theme**: Green/blue color scheme
- **Topics**: Astronomy, chemistry, biology, physics

### Vocabulary
- **File**: `data/vocabulary-basic.json`
- **Types**: Multiple choice, Fill blank, Matching
- **Theme**: Purple color scheme
- **Topics**: Definitions, synonyms, antonyms

## Question Types

### Multiple Choice
```json
{
  "type": "multiple_choice",
  "prompt": "Question text?",
  "options": ["Option A", "Option B", "Option C"],
  "answer": "Option A",
  "feedback": "Explanation"
}
```

### True/False
```json
{
  "type": "true_false",
  "prompt": "Statement to evaluate.",
  "answer": "True",
  "feedback": "Explanation"
}
```

### Fill in the Blank
```json
{
  "type": "fill_blank",
  "prompt": "Complete this _____.",
  "answer": "sentence",
  "feedback": "Explanation"
}
```

### Matching
```json
{
  "type": "matching",
  "prompt": "Match the items:",
  "pairs": [
    {"left": "Item 1", "right": "Match 1"},
    {"left": "Item 2", "right": "Match 2"}
  ],
  "feedback": "Explanation"
}
```

## Testing

### Manual Testing
1. Open `test-subject-system.html` in your browser
2. Run each test section
3. Verify all components work correctly

### Integration Testing
1. Load the main game (`index.html`)
2. Press 'S' to open subject selection
3. Switch between subjects
4. Test different question types

## Configuration

### Game Configuration
Edit `config/game-config.json` to customize:
- Default subject
- Question intervals
- Performance settings
- Accessibility options

### Subject Themes
Customize colors and fonts in subject configurations:
```javascript
theme: {
    primaryColor: '#2E86AB',
    secondaryColor: '#A23B72',
    backgroundColor: '#F18F01',
    textColor: '#0F0F0F',
    correctColor: '#06D6A0',
    incorrectColor: '#EF476F',
    fontFamily: 'Arial, sans-serif'
}
```

## Extensibility

### Adding Custom Question Types
1. Register the type in `QuestionTypeHandler`
2. Implement validation, rendering, and input handling
3. Add to subject configurations
4. Test thoroughly

### Custom Subject Settings
Add subject-specific settings:
```javascript
customSettings: {
    showDiagrams: true,
    allowCalculator: false,
    timeLimit: 30,
    customFeature: 'value'
}
```

## Best Practices

1. **Question Quality**: Write clear, educational questions
2. **Validation**: Always validate question data
3. **Accessibility**: Use high contrast colors
4. **Performance**: Test with large question sets
5. **Documentation**: Document custom features

## Troubleshooting

### Common Issues
- **Questions not loading**: Check JSON syntax and file paths
- **Theme not applying**: Verify color format (hex with #)
- **Type not supported**: Ensure type is registered in handler
- **Validation errors**: Check required fields for question type

### Debug Tools
```javascript
// Check loaded questions
console.log(contentLoader.questions);

// Check current subject
console.log(subjectConfigManager.getCurrentSubject());

// Check supported types
console.log(questionTypeHandler.getSupportedTypes());
```

## Future Enhancements

### Planned Features
- Drag-and-drop matching questions
- Image-based questions
- Audio pronunciation support
- Progress tracking per subject
- Adaptive difficulty
- Multiplayer support

### Contributing
1. Follow established patterns
2. Add comprehensive tests
3. Update documentation
4. Ensure accessibility
5. Test across browsers

## API Reference

### SubjectConfigManager
- `registerSubject(config)` - Register new subject
- `setCurrentSubject(id)` - Switch active subject
- `getCurrentSubject()` - Get current subject
- `getAllSubjects()` - Get all subjects
- `getCurrentTheme()` - Get current theme

### QuestionTypeHandler
- `registerQuestionType(config)` - Register new type
- `validateQuestion(question)` - Validate question
- `renderQuestion(question, ...)` - Render question UI
- `handleInput(question, input, context)` - Process input

### ContentLoader
- `loadQuestionsForSubject(id)` - Load subject questions
- `getQuestionsByType(type)` - Filter by type
- `getAvailableQuestionTypes()` - Get available types

For detailed API documentation, see the inline JSDoc comments in each module.