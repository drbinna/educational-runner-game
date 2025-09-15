# Subject Customization Guide

This guide explains how to add new subjects and question formats to the Educational Runner Game.

## Table of Contents

1. [Adding New Subjects](#adding-new-subjects)
2. [Creating Question Data Files](#creating-question-data-files)
3. [Supported Question Types](#supported-question-types)
4. [Custom Question Types](#custom-question-types)
5. [Theming and Styling](#theming-and-styling)
6. [Testing Your Customizations](#testing-your-customizations)

## Adding New Subjects

### Step 1: Create a Question Data File

Create a new JSON file in the `data/` directory following this naming convention:
```
data/[subject-name]-[level].json
```

Example: `data/history-basic.json`

### Step 2: Register the Subject

Add your subject configuration to the `SubjectConfigManager` in `game/subject-config.js`:

```javascript
// Add this to the initializeDefaultSubjects() method
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
        allowHints: true,
        timeLimit: 35
    }
});
```

### Step 3: Update Subject Selection

The subject will automatically appear in the subject selection menu once registered.

## Creating Question Data Files

### Basic Structure

```json
{
  "questions": [
    {
      "id": "unique_question_id",
      "type": "question_type",
      "prompt": "Your question text here",
      "answer": "correct_answer",
      "feedback": "Explanation of the correct answer",
      "difficulty": 1,
      "subject": "subject_name",
      "topic": "specific_topic"
    }
  ],
  "metadata": {
    "title": "Question Set Title",
    "description": "Description of the question set",
    "version": "1.0",
    "author": "Your Name"
  }
}
```

### Required Fields

- `id`: Unique identifier for the question
- `type`: Question type (see supported types below)
- `prompt`: The question text
- `answer`: The correct answer
- `feedback`: Explanation shown after answering

### Optional Fields

- `difficulty`: Number from 1-5 (1 = easiest, 5 = hardest)
- `subject`: Subject category
- `topic`: Specific topic within the subject

## Supported Question Types

### 1. Multiple Choice (`multiple_choice`)

```json
{
  "id": "mc_001",
  "type": "multiple_choice",
  "prompt": "What is the capital of France?",
  "options": ["London", "Berlin", "Paris", "Madrid"],
  "answer": "Paris",
  "feedback": "Correct! Paris is the capital and largest city of France."
}
```

**Required fields:**
- `options`: Array of answer choices (2-10 options)
- `answer`: Must be one of the options

### 2. True/False (`true_false`)

```json
{
  "id": "tf_001",
  "type": "true_false",
  "prompt": "The Earth is flat.",
  "answer": "False",
  "feedback": "Correct! The Earth is approximately spherical in shape."
}
```

**Required fields:**
- `answer`: Must be "True" or "False" (case-insensitive)

### 3. Fill in the Blank (`fill_blank`)

```json
{
  "id": "fb_001",
  "type": "fill_blank",
  "prompt": "The largest ocean on Earth is the _____ Ocean.",
  "answer": "Pacific",
  "feedback": "Correct! The Pacific Ocean is the largest ocean on Earth."
}
```

**Required fields:**
- `prompt`: Must contain "\_\_\_\_\_" (5 underscores) as placeholder
- `answer`: The word or phrase that fills the blank

### 4. Matching (`matching`)

```json
{
  "id": "match_001",
  "type": "matching",
  "prompt": "Match the country to its capital:",
  "pairs": [
    {"left": "France", "right": "Paris"},
    {"left": "Germany", "right": "Berlin"},
    {"left": "Italy", "right": "Rome"}
  ],
  "feedback": "Great job! You correctly matched all countries with their capitals."
}
```

**Required fields:**
- `pairs`: Array of objects with `left` and `right` properties
- Minimum 2 pairs, maximum 10 pairs

## Custom Question Types

### Step 1: Define the Question Type

Add your custom question type to the `QuestionTypeHandler` in `game/question-type-handler.js`:

```javascript
// Add to initializeDefaultTypes() method
this.registerQuestionType({
    type: 'custom_type',
    displayName: 'Custom Question Type',
    validator: this.validateCustomType.bind(this),
    renderer: this.renderCustomType.bind(this),
    inputHandler: this.handleCustomTypeInput.bind(this)
});
```

### Step 2: Implement Validation

```javascript
validateCustomType(question) {
    const errors = [];
    
    // Add your validation logic here
    if (!question.customField) {
        errors.push('Custom field is required');
    }
    
    return { isValid: errors.length === 0, errors };
}
```

### Step 3: Implement Rendering

```javascript
renderCustomType(question, kaboomAdd, width, height, theme) {
    const elements = [];
    
    // Add your rendering logic here
    elements.push(kaboomAdd([
        text(question.prompt, { size: 20 }),
        pos(width / 2, height / 2 - 50),
        origin("center"),
        color(0, 0, 0),
        "question-ui"
    ]));
    
    return elements;
}
```

### Step 4: Implement Input Handling

```javascript
handleCustomTypeInput(question, input, context) {
    // Process the user's input
    const isCorrect = input === question.answer;
    
    return {
        isCorrect,
        selectedAnswer: input,
        feedback: isCorrect ? question.feedback : 'Try again!'
    };
}
```

## Theming and Styling

### Color Scheme

Choose colors that work well together and are accessible:

```javascript
theme: {
    primaryColor: '#2E86AB',      // Main accent color
    secondaryColor: '#A23B72',    // Secondary accent color
    backgroundColor: '#F18F01',   // Background color
    textColor: '#0F0F0F',        // Text color
    correctColor: '#06D6A0',     // Color for correct answers
    incorrectColor: '#EF476F',   // Color for incorrect answers
    fontFamily: 'Arial, sans-serif' // Font family
}
```

### Color Guidelines

- **Primary Color**: Used for buttons and highlights
- **Secondary Color**: Used for accents and borders
- **Background Color**: Main background color
- **Text Color**: Main text color (ensure good contrast)
- **Correct Color**: Green shade for correct feedback
- **Incorrect Color**: Red shade for incorrect feedback

### Accessibility

- Ensure sufficient contrast between text and background colors
- Use colors that are distinguishable for colorblind users
- Test with accessibility tools

## Testing Your Customizations

### 1. Validate JSON Files

Use a JSON validator to ensure your question files are properly formatted:

```bash
# Using Node.js
node -e "console.log(JSON.parse(require('fs').readFileSync('data/your-file.json')))"
```

### 2. Test Question Loading

Add console logging to verify your questions load correctly:

```javascript
// In your browser console
contentLoader.loadQuestionsForSubject('your-subject-id')
    .then(result => console.log('Load result:', result));
```

### 3. Test Question Types

Verify each question type renders and responds correctly:

```javascript
// Test question validation
questionTypeHandler.validateQuestion(yourQuestion);

// Test question rendering (in game context)
questionPresenter.displayQuestion(yourQuestion);
```

### 4. Test Themes

Verify your theme colors work well together and are readable:

```javascript
// Apply theme and check visual appearance
subjectConfigManager.setCurrentSubject('your-subject-id');
```

## Example: Adding a Geography Subject

### 1. Create `data/geography-basic.json`

```json
{
  "questions": [
    {
      "id": "geo_001",
      "type": "multiple_choice",
      "prompt": "Which continent is the largest by land area?",
      "options": ["Africa", "Asia", "North America", "Europe"],
      "answer": "Asia",
      "feedback": "Correct! Asia is the largest continent, covering about 30% of Earth's land area.",
      "difficulty": 2,
      "subject": "geography",
      "topic": "continents"
    },
    {
      "id": "geo_002",
      "type": "fill_blank",
      "prompt": "The longest river in the world is the _____ River.",
      "answer": "Nile",
      "feedback": "Correct! The Nile River in Africa is approximately 6,650 kilometers long.",
      "difficulty": 2,
      "subject": "geography",
      "topic": "rivers"
    }
  ],
  "metadata": {
    "title": "Basic Geography",
    "description": "Fundamental geography concepts including continents, countries, and physical features",
    "version": "1.0",
    "author": "Geography Team"
  }
}
```

### 2. Register in `game/subject-config.js`

```javascript
this.registerSubject({
    id: 'geography',
    name: 'Geography',
    description: 'World geography and physical features',
    dataFile: 'data/geography-basic.json',
    theme: {
        primaryColor: '#228B22',
        secondaryColor: '#32CD32',
        backgroundColor: '#98FB98',
        textColor: '#000000',
        correctColor: '#06D6A0',
        incorrectColor: '#EF476F',
        fontFamily: 'Arial, sans-serif'
    },
    supportedQuestionTypes: ['multiple_choice', 'true_false', 'fill_blank'],
    customSettings: {
        showMaps: true,
        allowAtlas: false,
        timeLimit: 30
    }
});
```

### 3. Test the Implementation

1. Load the game
2. Select "Geography" from the subject menu
3. Verify questions display correctly
4. Test different question types
5. Check theme application

## Troubleshooting

### Common Issues

1. **Questions not loading**: Check JSON syntax and file path
2. **Theme not applying**: Verify color format (hex codes with #)
3. **Question type not supported**: Ensure type is registered in QuestionTypeHandler
4. **Validation errors**: Check required fields for each question type

### Debug Tools

Use browser developer tools to check for errors:

```javascript
// Check loaded questions
console.log(contentLoader.questions);

// Check current subject
console.log(subjectConfigManager.getCurrentSubject());

// Check supported question types
console.log(questionTypeHandler.getSupportedTypes());
```

## Best Practices

1. **Question Quality**: Write clear, unambiguous questions
2. **Feedback**: Provide educational feedback that explains the correct answer
3. **Difficulty Progression**: Start with easier questions and gradually increase difficulty
4. **Accessibility**: Use high contrast colors and clear fonts
5. **Testing**: Test all question types thoroughly before deployment
6. **Documentation**: Document any custom features or requirements

## Contributing

When contributing new subjects or question types:

1. Follow the established patterns and conventions
2. Include comprehensive tests
3. Update documentation
4. Ensure accessibility compliance
5. Test across different browsers and devices

For more information or support, please refer to the main project documentation or open an issue on the project repository.