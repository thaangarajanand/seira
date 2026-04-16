const { translateMessage, refineRequirements } = require('../services/groqService');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

async function runTests() {
  console.log('🚀 Starting AI Integration Tests...\n');

  // Test 1: Translation (Hindi to English)
  console.log('Test 1: Translation (Hindi -> English)');
  try {
    const hindiText = 'नमस्ते, मुझे आपकी मदद चाहिए।';
    const translated = await translateMessage(hindiText, 'hi', 'en');
    console.log(`Original: ${hindiText}`);
    console.log(`Translated: ${translated}\n`);
  } catch (error) {
    console.error('❌ Translation Test Failed:', error.message);
  }

  // Test 2: AI Requirement Refinement
  console.log('Test 2: Requirement Refinement');
  try {
    const roughNotes = 'Need 100 steel bolts, size around 10mm, strong material, shiny finish.';
    const refined = await refineRequirements(roughNotes, '10mm diameter');
    console.log(`Rough Notes: ${roughNotes}`);
    console.log(`Refined Specs:\n${refined}\n`);
  } catch (error) {
    console.error('❌ Refinement Test Failed:', error.message);
  }

  console.log('✅ AI Tests Completed.');
}

runTests();
