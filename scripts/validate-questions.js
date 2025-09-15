#!/usr/bin/env node

/**
 * Question Set Validation Script
 * Validates all JSON question files for proper structure and content
 */

const fs = require('fs');
const path = require('path');

// Required fields for each question type
const REQUIRED_FIELDS = {
  base: ['id', 'type', 'prompt', 'answer', 'feedback', 'difficulty', 'subject', 'topic'],
  multiple_choice: ['options'],
  matching: ['pairs'],
  fill_blank: [],
  true_false: []
};

// Valid question types
const VALID_TYPES = ['multiple_choice', 'true_false', 'fill_blank', 'matching'];

// Valid difficulty levels
const VALID_DIFFICULTIES = [1, 2, 3, 4, 5];

/**
 * Validate a single question object
 */
function validateQuestion(question, filename, index) {
  const errors = [];
  
  // Check required base fields
  for (const field of REQUIRED_FIELDS.base) {
    if (!question.hasOwnProperty(field)) {
      errors.push(`Question ${index + 1}: Missing required field '${field}'`);
    }
  }
  
  // Validate question type
  if (question.type && !VALID_TYPES.includes(question.type)) {
    errors.push(`Question ${index + 1}: Invalid question type '${question.type}'. Must be one of: ${VALID_TYPES.join(', ')}`);
  }
  
  // Check type-specific required fields
  if (question.type && REQUIRED_FIELDS[question.type]) {
    for (const field of REQUIRED_FIELDS[question.type]) {
      if (!question.hasOwnProperty(field)) {
        errors.push(`Question ${index + 1}: Missing required field '${field}' for type '${question.type}'`);
      }
    }
  }
  
  // Validate difficulty
  if (question.difficulty && !VALID_DIFFICULTIES.includes(question.difficulty)) {
    errors.push(`Question ${index + 1}: Invalid difficulty '${question.difficulty}'. Must be 1-5`);
  }
  
  // Type-specific validations
  if (question.type === 'multiple_choice') {
    if (question.options && Array.isArray(question.options)) {
      if (question.options.length < 2) {
        errors.push(`Question ${index + 1}: Multiple choice questions must have at least 2 options`);
      }
      if (question.answer && !question.options.includes(question.answer)) {
        errors.push(`Question ${index + 1}: Answer '${question.answer}' not found in options`);
      }
    }
  }
  
  if (question.type === 'true_false') {
    if (question.answer && !['True', 'False', 'true', 'false'].includes(question.answer)) {
      errors.push(`Question ${index + 1}: True/false answer must be 'True' or 'False'`);
    }
  }
  
  if (question.type === 'matching') {
    if (question.pairs && Array.isArray(question.pairs)) {
      if (question.pairs.length < 2) {
        errors.push(`Question ${index + 1}: Matching questions must have at least 2 pairs`);
      }
      for (let i = 0; i < question.pairs.length; i++) {
        const pair = question.pairs[i];
        if (!pair.left || !pair.right) {
          errors.push(`Question ${index + 1}: Matching pair ${i + 1} missing 'left' or 'right' property`);
        }
      }
    }
  }
  
  // Validate string fields are not empty
  const stringFields = ['id', 'prompt', 'answer', 'feedback', 'subject', 'topic'];
  for (const field of stringFields) {
    if (question[field] && typeof question[field] === 'string' && question[field].trim() === '') {
      errors.push(`Question ${index + 1}: Field '${field}' cannot be empty`);
    }
  }
  
  return errors;
}

/**
 * Validate question set metadata
 */
function validateMetadata(metadata, filename) {
  const errors = [];
  const requiredFields = ['title', 'description', 'version', 'author'];
  
  if (!metadata) {
    errors.push('Missing metadata object');
    return errors;
  }
  
  for (const field of requiredFields) {
    if (!metadata.hasOwnProperty(field)) {
      errors.push(`Metadata missing required field '${field}'`);
    }
  }
  
  return errors;
}

/**
 * Validate a single JSON file
 */
function validateFile(filepath) {
  const filename = path.basename(filepath);
  const errors = [];
  
  try {
    // Read and parse JSON
    const content = fs.readFileSync(filepath, 'utf8');
    let data;
    
    try {
      data = JSON.parse(content);
    } catch (parseError) {
      errors.push(`Invalid JSON syntax: ${parseError.message}`);
      return { filename, errors, valid: false };
    }
    
    // Validate structure
    if (!data.questions || !Array.isArray(data.questions)) {
      errors.push('Missing or invalid "questions" array');
      return { filename, errors, valid: false };
    }
    
    // Validate metadata
    const metadataErrors = validateMetadata(data.metadata, filename);
    errors.push(...metadataErrors);
    
    // Validate each question
    const questionIds = new Set();
    for (let i = 0; i < data.questions.length; i++) {
      const question = data.questions[i];
      
      // Check for duplicate IDs
      if (question.id) {
        if (questionIds.has(question.id)) {
          errors.push(`Question ${i + 1}: Duplicate question ID '${question.id}'`);
        }
        questionIds.add(question.id);
      }
      
      // Validate question
      const questionErrors = validateQuestion(question, filename, i);
      errors.push(...questionErrors);
    }
    
    // Check for empty question set
    if (data.questions.length === 0) {
      errors.push('Question set is empty');
    }
    
  } catch (error) {
    errors.push(`Error reading file: ${error.message}`);
  }
  
  return {
    filename,
    errors,
    valid: errors.length === 0,
    questionCount: errors.length === 0 ? JSON.parse(fs.readFileSync(filepath, 'utf8')).questions.length : 0
  };
}

/**
 * Main validation function
 */
function validateAllQuestions() {
  const dataDir = path.join(__dirname, '..', 'data');
  
  if (!fs.existsSync(dataDir)) {
    console.error('❌ Data directory not found:', dataDir);
    process.exit(1);
  }
  
  const files = fs.readdirSync(dataDir)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(dataDir, file));
  
  if (files.length === 0) {
    console.error('❌ No JSON files found in data directory');
    process.exit(1);
  }
  
  console.log(`🔍 Validating ${files.length} question set(s)...\n`);
  
  let totalErrors = 0;
  let totalQuestions = 0;
  const results = [];
  
  for (const file of files) {
    const result = validateFile(file);
    results.push(result);
    totalErrors += result.errors.length;
    totalQuestions += result.questionCount;
    
    if (result.valid) {
      console.log(`✅ ${result.filename} (${result.questionCount} questions)`);
    } else {
      console.log(`❌ ${result.filename} (${result.errors.length} errors)`);
      for (const error of result.errors) {
        console.log(`   • ${error}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Validation Summary:`);
  console.log(`   Files processed: ${files.length}`);
  console.log(`   Total questions: ${totalQuestions}`);
  console.log(`   Valid files: ${results.filter(r => r.valid).length}`);
  console.log(`   Files with errors: ${results.filter(r => !r.valid).length}`);
  console.log(`   Total errors: ${totalErrors}`);
  
  if (totalErrors === 0) {
    console.log('\n🎉 All question sets are valid!');
    process.exit(0);
  } else {
    console.log('\n💥 Validation failed. Please fix the errors above.');
    process.exit(1);
  }
}

// Run validation if called directly
if (require.main === module) {
  validateAllQuestions();
}

module.exports = { validateFile, validateQuestion, validateMetadata };