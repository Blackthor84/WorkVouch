/**
 * AI Embeddings for Semantic Job Matching
 * Uses OpenAI embeddings API to create vector representations
 * of job descriptions and candidate profiles for semantic search
 */

import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generate embedding for a text string
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // Cost-effective, good quality
      input: text.trim(),
    })

    return response.data[0].embedding
  } catch (error: any) {
    console.error('Error generating embedding:', error)
    throw new Error(`Failed to generate embedding: ${error.message}`)
  }
}

/**
 * Generate embedding for a job description
 * Combines title, description, requirements, and industry
 */
export async function generateJobEmbedding(job: {
  title: string
  description: string
  requirements?: string
  industry?: string
  location?: string
}): Promise<number[]> {
  const text = [
    `Job Title: ${job.title}`,
    `Description: ${job.description}`,
    job.requirements ? `Requirements: ${job.requirements}` : '',
    job.industry ? `Industry: ${job.industry}` : '',
    job.location ? `Location: ${job.location}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  return generateEmbedding(text)
}

/**
 * Generate embedding for a candidate profile
 * Combines job history, skills, industry, and experience
 */
export async function generateCandidateEmbedding(candidate: {
  jobs: Array<{
    job_title: string
    company_name: string
    description?: string
  }>
  industry?: string
  skills?: string[]
  location?: string
}): Promise<number[]> {
  const jobHistory = candidate.jobs
    .map(
      (job) =>
        `${job.job_title} at ${job.company_name}${job.description ? `: ${job.description}` : ''}`
    )
    .join('; ')

  const text = [
    `Industry: ${candidate.industry || 'Not specified'}`,
    `Job History: ${jobHistory}`,
    candidate.skills && candidate.skills.length > 0
      ? `Skills: ${candidate.skills.join(', ')}`
      : '',
    candidate.location ? `Location: ${candidate.location}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  return generateEmbedding(text)
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same length')
  }

  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i]
    norm1 += embedding1[i] * embedding1[i]
    norm2 += embedding2[i] * embedding2[i]
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2)
  if (denominator === 0) return 0

  return dotProduct / denominator
}
