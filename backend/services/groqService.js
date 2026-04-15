const Groq = require('groq-sdk');
const dotenv = require('dotenv');

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Translates text between languages using Groq AI.
 */
async function translateMessage(text, sourceLang, targetLang) {
  if (!text || sourceLang === targetLang) return text;
  
  const langMap = {
    'en': 'English',
    'hi': 'Hindi',
    'ta': 'Tamil'
  };

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text from ${langMap[sourceLang] || sourceLang} to ${langMap[targetLang] || targetLang}. 
          Return ONLY the translated text, no explanations, no quotes.`
        },
        {
          role: 'user',
          content: text,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
    });

    return chatCompletion.choices[0]?.message?.content?.trim() || text;
  } catch (error) {
    console.error('Groq Translation Error:', error);
    return text; // Fallback to original text
  }
}

/**
 * Refines industrial customization requirements.
 */
async function refineRequirements(initialNotes, dimensions) {
  try {
    const prompt = `
      As an industrial manufacturing expert, refine the following customization requirements for a product.
      Initial Notes: ${initialNotes}
      Dimensions: ${dimensions || 'Not specified'}

      Provide a professional summary with technical specifications including:
      - Recommended Material Grade (e.g. SS304, Aluminum 6061)
      - Standard Tolerances
      - Surface Finish requirements
      - Quality checks

      Keep it concise and professional. Use bullet points.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a senior manufacturing engineer and industrial design consultant. Your goal is to take rough customer requirements and transform them into precise, professional technical specifications suitable for a quotation.'
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
    });

    return chatCompletion.choices[0]?.message?.content?.trim() || initialNotes;
  } catch (error) {
    console.error('Groq Refinement Error:', error);
    return initialNotes;
  }
}

module.exports = {
  translateMessage,
  refineRequirements,
};
