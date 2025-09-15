# Educational Runner Game 🏃‍♂️📚

A lightweight, open-source educational mini-game that combines simple runner mechanics with JSON-driven educational content. Built with Kaboom.js for maximum compatibility and ease of deployment.

## 🎯 Overview

The Educational Runner Game follows an "academic first" approach where every interaction serves as a learning opportunity. Students play a simple runner game that presents educational challenges every 5-10 seconds, providing frequent, low-stakes practice opportunities across various subjects.

### Key Features

- **JSON-Driven Content**: Easy customization with simple JSON files
- **Multiple Question Types**: Multiple choice, true/false, fill-in-the-blank, and matching
- **Offline Support**: Service worker enables offline gameplay
- **Mobile Friendly**: Responsive design works on all devices
- **Performance Optimized**: Lightweight with proper caching
- **Open Source**: MIT licensed with open-source compatible assets
- **Static Hosting**: No server required - works with GitHub Pages, Netlify, etc.

## 🚀 Quick Start

### Option 1: Download and Run Locally

1. **Download the game files**:
   ```bash
   git clone https://github.com/your-username/educational-runner-game.git
   cd educational-runner-game
   ```

2. **Serve the files** (required due to CORS restrictions):
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**:
   Navigate to `http://localhost:8000`

### Option 2: Deploy to Static Hosting

#### GitHub Pages
1. Fork this repository
2. Go to Settings → Pages
3. Select "Deploy from a branch" and choose `main`
4. Your game will be available at `https://yourusername.github.io/educational-runner-game`

#### Netlify
1. Connect your GitHub repository to Netlify
2. Deploy settings are automatically configured via `netlify.toml`
3. Your game will be live instantly

#### Vercel
1. Import your GitHub repository to Vercel
2. Deploy settings are automatically configured via `vercel.json`
3. Your game will be live instantly

## 📚 Available Question Sets

The game comes with several pre-built question sets:

| Subject | File | Grade Level | Topics Covered |
|---------|------|-------------|----------------|
| **Basic Math** | `data/math-basic.json` | K-2 | Addition, subtraction, multiplication, division |
| **Fractions** | `data/math-fractions.json` | 3-5 | Fraction equivalents, operations, comparisons |
| **Basic Vocabulary** | `data/vocabulary-basic.json` | K-3 | Common words, synonyms, antonyms |
| **Advanced Vocabulary** | `data/vocabulary-advanced.json` | 6-8 | Complex words, context clues |
| **Basic Science** | `data/science-basic.json` | 2-4 | Astronomy, chemistry, biology, physics |
| **Animals** | `data/science-animals.json` | 2-4 | Animal classifications, habitats, characteristics |
| **History** | `data/history-basic.json` | 4-6 | American and world history highlights |
| **Geography** | `data/geography-basic.json` | 3-5 | Countries, capitals, continents, physical features |

## 🎮 How to Play

1. **Start the Game**: Click "Start Game" on the main menu
2. **Choose Subject**: Select from available question sets
3. **Run and Learn**: Your character runs automatically
4. **Answer Questions**: Every 5-10 seconds, answer educational questions
5. **Get Feedback**: Receive immediate feedback and explanations
6. **Keep Learning**: Continue running and answering questions to improve your score

### Controls
- **Mouse/Touch**: Click on answer options
- **Keyboard**: Use number keys (1-4) to select answers
- **Space**: Pause/unpause the game
- **R**: Restart the game

## 🛠️ Customization Guide

### Creating Custom Question Sets

1. **Create a new JSON file** in the `data/` directory:
   ```json
   {
     "questions": [
       {
         "id": "unique_id",
         "type": "multiple_choice",
         "prompt": "Your question here?",
         "options": ["Option A", "Option B", "Option C", "Option D"],
         "answer": "Option A",
         "feedback": "Explanation of the correct answer",
         "difficulty": 1,
         "subject": "your_subject",
         "topic": "specific_topic"
       }
     ],
     "metadata": {
       "title": "Your Question Set Title",
       "description": "Description of the content",
       "version": "1.0",
       "author": "Your Name",
       "grade_level": "K-2",
       "estimated_time": "10-15 minutes"
     }
   }
   ```

2. **Supported Question Types**:

   **Multiple Choice**:
   ```json
   {
     "type": "multiple_choice",
     "prompt": "What is 2 + 2?",
     "options": ["3", "4", "5", "6"],
     "answer": "4"
   }
   ```

   **True/False**:
   ```json
   {
     "type": "true_false",
     "prompt": "The Earth is round.",
     "answer": "True"
   }
   ```

   **Fill in the Blank**:
   ```json
   {
     "type": "fill_blank",
     "prompt": "The capital of France is _____.",
     "answer": "Paris"
   }
   ```

   **Matching**:
   ```json
   {
     "type": "matching",
     "prompt": "Match the animal to its habitat:",
     "pairs": [
       {"left": "Fish", "right": "Water"},
       {"left": "Bird", "right": "Sky"}
     ]
   }
   ```

3. **Add your question set** to the game by updating `game/subject-config.js`:
   ```javascript
   const AVAILABLE_SUBJECTS = {
     // ... existing subjects
     'your_subject': {
       name: 'Your Subject Name',
       file: 'data/your-questions.json',
       description: 'Description for players',
       difficulty: 'Easy', // Easy, Medium, Hard
       estimatedTime: '10-15 min'
     }
   };
   ```

### Customizing Game Appearance

1. **Colors and Styling**: Edit the CSS in `index.html`
2. **Game Speed**: Modify `GAME_CONFIG` in `main.js`
3. **Question Timing**: Adjust `questionInterval` in `game/runner-engine.js`
4. **Difficulty Settings**: Update difficulty multipliers in `game/game-state.js`

### Adding New Question Types

1. **Update the question type handler** in `game/question-type-handler.js`
2. **Add rendering logic** in `game/question-presenter.js`
3. **Update validation** in `game/content-loader.js`

## 🧪 Testing

The game includes a comprehensive testing suite:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:performance   # Performance tests
npm run test:browser       # Browser compatibility

# Run tests with coverage
npm run test:coverage

# Run comprehensive test suite
npm run test:comprehensive
```

### Test Categories

- **Unit Tests**: Individual component functionality
- **Integration Tests**: Complete game flow testing
- **Performance Tests**: Memory usage and frame rate
- **Browser Compatibility**: Cross-browser testing

## 📱 Browser Support

- **Desktop**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Mobile**: iOS Safari 13+, Chrome Mobile 80+, Samsung Internet 12+
- **Features**: HTML5 Canvas, ES6+, Service Workers, Fetch API

## 🔧 Development

### Project Structure
```
educational-runner-game/
├── index.html              # Main game page
├── main.js                 # Game initialization
├── sw.js                   # Service worker for offline support
├── game/                   # Core game modules
│   ├── content-loader.js   # JSON question loading
│   ├── game-state.js       # Game state management
│   ├── runner-engine.js    # Runner game mechanics
│   ├── question-presenter.js # Question UI
│   ├── question-flow-manager.js # Question timing
│   ├── subject-config.js   # Subject configuration
│   └── question-type-handler.js # Question type logic
├── data/                   # Question JSON files
├── test/                   # Test suite
├── docs/                   # Documentation
└── config/                 # Configuration files
```

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/educational-runner-game.git
   cd educational-runner-game
   ```

2. **Install development dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Run tests during development**:
   ```bash
   npm run test:watch
   ```

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Asset Licenses

All assets used in this project are compatible with open-source distribution:
- **Code**: MIT License
- **Graphics**: Geometric shapes and open-source compatible assets
- **Sounds**: Open-source compatible (CC0, CC BY, or similar)
- **Fonts**: System fonts and open-source web fonts

## 🤝 Support

- **Documentation**: Check the `docs/` directory for detailed guides
- **Issues**: Report bugs and request features on GitHub Issues
- **Discussions**: Join community discussions on GitHub Discussions
- **Email**: Contact the maintainers at [your-email@example.com]

## 🎓 Educational Use

This game is designed for:
- **Classroom Use**: Teachers can create custom question sets for their curriculum
- **Homework Practice**: Students can practice concepts at home
- **Tutoring**: Tutors can use subject-specific question sets
- **Homeschooling**: Parents can customize content for their children's level
- **Test Prep**: Create practice questions for upcoming assessments

### For Educators

- **Easy Content Creation**: No coding required to add new questions
- **Progress Tracking**: Built-in score tracking and feedback
- **Curriculum Alignment**: Customize questions to match your curriculum
- **Engagement**: Game mechanics keep students motivated
- **Accessibility**: Works on all devices students have access to

## 🔮 Roadmap

- [ ] **Multiplayer Mode**: Compete with classmates
- [ ] **Progress Tracking**: Save student progress across sessions
- [ ] **Teacher Dashboard**: View student performance analytics
- [ ] **More Question Types**: Drag-and-drop, ordering, drawing
- [ ] **Adaptive Difficulty**: Adjust difficulty based on performance
- [ ] **Achievement System**: Badges and rewards for milestones
- [ ] **Audio Support**: Text-to-speech and sound effects
- [ ] **Themes**: Different visual themes for various subjects

---

**Made with ❤️ for educators and students everywhere**