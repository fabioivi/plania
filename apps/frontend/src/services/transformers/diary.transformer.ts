/**
 * Diary Transformer
 * Business logic for transforming and organizing diary data
 * Extracted from components for better testability and reusability
 */

import { parseISO } from 'date-fns'
import type { DiaryContent } from '@/types'

/**
 * Organize diary contents with anticipations
 * Filters out anticipation entries and sorts content by date and time
 *
 * This function performs complex business logic:
 * 1. Separates anticipation entries from regular content
 * 2. Creates a map of cancelled classes (by contentId)
 * 3. Filters out cancelled entries
 * 4. Sorts remaining entries by date and time
 *
 * @param contents - Raw diary contents from API
 * @returns Organized and sorted diary contents
 */
export function organizeDiaryContentsWithAntecipations(
  contents: DiaryContent[]
): DiaryContent[] {
  if (!contents || contents.length === 0) {
    return []
  }

  // Separate anticipations from regular content
  const anticipations = contents.filter((item) => item.isAntecipation)
  const regularContent = contents.filter((item) => !item.isAntecipation)

  // Create a map of cancelled classes (classes that have been anticipated)
  const cancelledClassesMap = new Map<string, boolean>()

  anticipations.forEach((anticipation) => {
    if (anticipation.originalContentId) {
      cancelledClassesMap.set(anticipation.originalContentId, true)
    }
  })

  // Filter out cancelled classes
  const activeContent = regularContent.filter(
    (item) => !cancelledClassesMap.has(item.contentId)
  )

  // Sort by date and then by time
  const sortedContent = [...activeContent].sort((a, b) => {
    // Parse dates
    const dateA = parseISO(a.date)
    const dateB = parseISO(b.date)

    // Compare dates first
    if (dateA < dateB) return -1
    if (dateA > dateB) return 1

    // If same date, compare time ranges
    const timeA = a.timeRange.split('-')[0] || ''
    const timeB = b.timeRange.split('-')[0] || ''

    return timeA.localeCompare(timeB)
  })

  return sortedContent
}

/**
 * Calculate diary content statistics
 * @param contents - Diary contents
 * @returns Statistics about diary contents
 */
export function calculateDiaryStats(contents: DiaryContent[]) {
  const total = contents.length
  const realClasses = contents.filter((item) => !item.isAntecipation).length
  const anticipations = contents.filter((item) => item.isAntecipation).length

  const totalHours = contents.reduce((sum, item) => {
    // Extract hours from timeRange (e.g., "13:00-15:00" = 2 hours)
    const [start, end] = item.timeRange.split('-')
    if (!start || !end) return sum

    const [startHour] = start.split(':').map(Number)
    const [endHour] = end.split(':').map(Number)

    if (isNaN(startHour) || isNaN(endHour)) return sum

    return sum + (endHour - startHour)
  }, 0)

  return {
    total,
    realClasses,
    anticipations,
    totalHours,
  }
}

/**
 * Group diary contents by date
 * @param contents - Diary contents
 * @returns Map of date to contents for that date
 */
export function groupContentsByDate(
  contents: DiaryContent[]
): Map<string, DiaryContent[]> {
  const grouped = new Map<string, DiaryContent[]>()

  contents.forEach((content) => {
    const existing = grouped.get(content.date) || []
    grouped.set(content.date, [...existing, content])
  })

  return grouped
}

/**
 * Check if diary content is cancelled (has an anticipation for it)
 * @param content - Diary content to check
 * @param allContents - All diary contents
 * @returns True if content is cancelled
 */
export function isContentCancelled(
  content: DiaryContent,
  allContents: DiaryContent[]
): boolean {
  return allContents.some(
    (item) =>
      item.isAntecipation &&
      item.originalContentId === content.contentId
  )
}

/**
 * Find anticipation for a specific content
 * @param content - Original content
 * @param allContents - All diary contents
 * @returns Anticipation content if found, null otherwise
 */
export function findAnticipationForContent(
  content: DiaryContent,
  allContents: DiaryContent[]
): DiaryContent | null {
  return (
    allContents.find(
      (item) =>
        item.isAntecipation &&
        item.originalContentId === content.contentId
    ) || null
  )
}

/**
 * Validate diary content data
 * @param content - Diary content to validate
 * @returns Validation result with errors if any
 */
export function validateDiaryContent(content: Partial<DiaryContent>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!content.date) {
    errors.push('Data é obrigatória')
  }

  if (!content.timeRange) {
    errors.push('Horário é obrigatório')
  }

  if (!content.content || content.content.trim() === '') {
    errors.push('Conteúdo é obrigatório')
  }

  if (!content.type || !['N', 'A', 'R'].includes(content.type)) {
    errors.push('Tipo deve ser Normal (N), Antecipação (A) ou Reposição (R)')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
