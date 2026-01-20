/**
 * Resume Parser Utility
 * Handles parsing of PDF and DOCX files and extracts structured data
 */

// Import pdf-parse using require for CommonJS compatibility
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse')
import mammoth from 'mammoth'

export interface ParsedResume {
  jobs: Array<{
    title: string
    company: string
    startDate?: string
    endDate?: string
    isCurrent?: boolean
    location?: string
    responsibilities?: string
  }>
  education: Array<{
    school: string
    degree?: string
    fieldOfStudy?: string
    startYear?: number
    endYear?: number
    isCurrent?: boolean
    gpa?: number
    description?: string
  }>
  skills: string[]
  certifications: string[]
  contactInfo: {
    email?: string
    phone?: string
  }
  summary?: string
}

/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer)
    return data.text
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract text from DOCX buffer
 */
export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  } catch (error) {
    throw new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Parse resume text using AI/NLP (OpenAI GPT-4)
 * Falls back to regex-based parsing if OpenAI is not configured
 */
export async function parseResumeText(text: string): Promise<ParsedResume> {
  // Check if OpenAI is configured
  const openaiApiKey = process.env.OPENAI_API_KEY

  if (openaiApiKey) {
    try {
      return await parseWithOpenAI(text, openaiApiKey)
    } catch (error) {
      console.error('OpenAI parsing failed, falling back to regex:', error)
      return parseWithRegex(text)
    }
  }

  // Fallback to regex-based parsing
  return parseWithRegex(text)
}

/**
 * Parse resume using OpenAI GPT-4
 */
async function parseWithOpenAI(text: string, apiKey: string): Promise<ParsedResume> {
  const { OpenAI } = await import('openai')
  const openai = new OpenAI({ apiKey })

  const prompt = `Extract structured information from this resume text. Return ONLY valid JSON in this exact format:
{
  "jobs": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "startDate": "YYYY-MM-DD or YYYY-MM",
      "endDate": "YYYY-MM-DD or YYYY-MM or null if current",
      "isCurrent": true/false,
      "location": "City, State",
      "responsibilities": "Bullet points or description"
    }
  ],
  "education": [
    {
      "school": "School Name",
      "degree": "Degree Type",
      "fieldOfStudy": "Field of Study",
      "startYear": YYYY,
      "endYear": YYYY or null,
      "isCurrent": true/false,
      "gpa": X.XX or null,
      "description": "Additional details"
    }
  ],
  "skills": ["skill1", "skill2"],
  "certifications": ["cert1", "cert2"],
  "contactInfo": {
    "email": "email@example.com",
    "phone": "+1234567890"
  },
  "summary": "Professional summary if present"
}

Resume text:
${text.substring(0, 15000)}` // Limit to avoid token limits

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a resume parsing expert. Extract structured data from resumes and return ONLY valid JSON, no other text.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  try {
    const parsed = JSON.parse(content) as ParsedResume
    return parsed
  } catch (error) {
    throw new Error(`Failed to parse OpenAI response: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Fallback regex-based parsing
 */
function parseWithRegex(text: string): ParsedResume {
  const result: ParsedResume = {
    jobs: [],
    education: [],
    skills: [],
    certifications: [],
    contactInfo: {},
  }

  // Extract email
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)
  if (emailMatch) {
    result.contactInfo.email = emailMatch[0]
  }

  // Extract phone
  const phoneMatch = text.match(/(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/)
  if (phoneMatch) {
    result.contactInfo.phone = phoneMatch[0]
  }

  // Extract jobs (basic pattern matching)
  const jobSections = text.split(/(?:experience|work history|employment|career)/i)
  if (jobSections.length > 1) {
    const jobText = jobSections[1]
    // Look for patterns like "Job Title at Company (Date - Date)"
    const jobPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:at|@|,)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\(?(\d{4}|\w+\s+\d{4})\s*[-–]\s*(\d{4}|\w+\s+\d{4}|present|current)\)?/gi
    let match
    while ((match = jobPattern.exec(jobText)) !== null) {
      result.jobs.push({
        title: match[1].trim(),
        company: match[2].trim(),
        startDate: match[3]?.trim(),
        endDate: match[4]?.toLowerCase().includes('present') || match[4]?.toLowerCase().includes('current') ? undefined : match[4]?.trim(),
        isCurrent: match[4]?.toLowerCase().includes('present') || match[4]?.toLowerCase().includes('current'),
      })
    }
  }

  // Extract education
  const educationSections = text.split(/(?:education|academic)/i)
  if (educationSections.length > 1) {
    const eduText = educationSections[1]
    // Look for patterns like "Degree in Field, School, Year"
    const eduPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:in\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)?,?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+(\d{4})/gi
    let match
    while ((match = eduPattern.exec(eduText)) !== null) {
      result.education.push({
        degree: match[1].trim(),
        fieldOfStudy: match[2]?.trim(),
        school: match[3].trim(),
        endYear: parseInt(match[4]),
      })
    }
  }

  // Extract skills (look for common skill keywords)
  const skillKeywords = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'SQL', 'MongoDB',
    'AWS', 'Docker', 'Kubernetes', 'Git', 'Agile', 'Scrum', 'Leadership', 'Communication',
    'Project Management', 'Data Analysis', 'Machine Learning', 'AI', 'Cloud Computing',
  ]
  skillKeywords.forEach((skill) => {
    if (text.toLowerCase().includes(skill.toLowerCase())) {
      result.skills.push(skill)
    }
  })

  return result
}
