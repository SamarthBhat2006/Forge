import { genAI } from './gemini';

const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Analyzes the spreadsheet structure using Gemini.
 */
export const analyzeStructure = async (headers, sampleRows) => {
  const prompt = `
    You are an expert data engineer and AI assistant for ForgeTrack, an attendance tracking system.
    Analyze the following spreadsheet headers and sample data to identify the schema.
    
    HEADERS:
    ${JSON.stringify(headers)}
    
    SAMPLE DATA (First 5 rows):
    ${JSON.stringify(sampleRows)}
    
    TASK:
    1. Identify the column index for "USN" (Student ID).
    2. Identify the column index for "Student Name".
    3. Identify all column indices that represent "Attendance Sessions" (dates or session markers).
    4. For each Attendance Session column, extract the date if present in the header.
    5. Identify the "Attendance Markers" used (e.g., "P" for present, "A" for absent, or boolean values).
    
    RETURN A JSON OBJECT ONLY with the following structure:
    {
      "usnIndex": number,
      "nameIndex": number,
      "sessionColumns": [
        { "index": number, "header": "string", "detectedDate": "YYYY-MM-DD" | null }
      ],
      "markerMapping": {
        "present": ["list", "of", "values"],
        "absent": ["list", "of", "values"]
      },
      "confidence": number (0-1),
      "reasoning": "short explanation"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Clean JSON markdown if present
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error('AI Analysis failed:', err);
    throw new Error(`AI Analysis failed: ${err.message || 'Unknown error'}. Check console for details.`);
  }
};

/**
 * Suggests dates for header-less columns.
 */
export const suggestDates = async (sessionColumns, startDate, daysOfWeek) => {
  const prompt = `
    Given a list of ${sessionColumns.length} attendance sessions that are missing dates.
    Start Date: ${startDate}
    Classes are usually held on: ${daysOfWeek.join(', ')}
    
    Suggest a date for each session in chronological order.
    
    RETURN A JSON ARRAY ONLY of strings in YYYY-MM-DD format.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error('Date suggestion failed:', err);
    return [];
  }
};
