/**
 * Date Transformer
 * Centralized date formatting and manipulation utilities
 * Consolidates date logic from multiple components
 */

import { format, parseISO, isSameDay as dateFnsIsSameDay, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { DateString } from '@/types'

/**
 * Format date to Brazilian format (DD/MM/YYYY)
 * @param dateStr - ISO date string or Date object
 * @returns Formatted date string or original if invalid
 */
export function formatDate(dateStr: DateString | Date | null | undefined): string {
  if (!dateStr) return ''

  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr

    if (!isValid(date)) {
      return typeof dateStr === 'string' ? dateStr : ''
    }

    return format(date, 'dd/MM/yyyy', { locale: ptBR })
  } catch (error) {
    console.error('Error formatting date:', error)
    return typeof dateStr === 'string' ? dateStr : ''
  }
}

/**
 * Format date with weekday (e.g., "Seg, 15/08/2023")
 * @param dateStr - ISO date string or Date object
 * @returns Formatted date string with weekday
 */
export function formatDateWithWeekday(dateStr: DateString | Date): string {
  if (!dateStr) return ''

  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr

    if (!isValid(date)) {
      return typeof dateStr === 'string' ? dateStr : ''
    }

    return format(date, "EEE, dd/MM/yyyy", { locale: ptBR })
  } catch (error) {
    console.error('Error formatting date with weekday:', error)
    return typeof dateStr === 'string' ? dateStr : ''
  }
}

/**
 * Format date to full format (e.g., "15 de agosto de 2023")
 * @param dateStr - ISO date string or Date object
 * @returns Formatted date string
 */
export function formatDateFull(dateStr: DateString | Date): string {
  if (!dateStr) return ''

  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr

    if (!isValid(date)) {
      return typeof dateStr === 'string' ? dateStr : ''
    }

    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  } catch (error) {
    console.error('Error formatting full date:', error)
    return typeof dateStr === 'string' ? dateStr : ''
  }
}

/**
 * Format time range (already formatted, just return as is)
 * @param timeRange - Time range string (e.g., "13:00-15:00")
 * @returns Time range string
 */
export function formatTimeRange(timeRange: string): string {
  return timeRange || ''
}

/**
 * Check if two dates are the same day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if dates are the same day
 */
export function isSameDay(
  date1: DateString | Date | null | undefined,
  date2: DateString | Date | null | undefined
): boolean {
  if (!date1 || !date2) return false

  try {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2

    if (!isValid(d1) || !isValid(d2)) return false

    return dateFnsIsSameDay(d1, d2)
  } catch (error) {
    console.error('Error comparing dates:', error)
    return false
  }
}

/**
 * Parse Brazilian date format (DD/MM/YYYY) to ISO string
 * @param brDate - Brazilian format date string
 * @returns ISO date string
 */
export function parseBrazilianDate(brDate: string): DateString {
  if (!brDate) return ''

  try {
    const [day, month, year] = brDate.split('/')
    if (!day || !month || !year) return brDate

    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))

    if (!isValid(date)) return brDate

    return date.toISOString()
  } catch (error) {
    console.error('Error parsing Brazilian date:', error)
    return brDate
  }
}

/**
 * Get weekday name from date
 * @param dateStr - ISO date string or Date object
 * @returns Weekday name in Portuguese
 */
export function getWeekdayName(dateStr: DateString | Date): string {
  if (!dateStr) return ''

  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr

    if (!isValid(date)) return ''

    return format(date, 'EEEE', { locale: ptBR })
  } catch (error) {
    console.error('Error getting weekday name:', error)
    return ''
  }
}

/**
 * Get short weekday name from date (e.g., "Seg")
 * @param dateStr - ISO date string or Date object
 * @returns Short weekday name in Portuguese
 */
export function getShortWeekdayName(dateStr: DateString | Date): string {
  if (!dateStr) return ''

  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr

    if (!isValid(date)) return ''

    return format(date, 'EEE', { locale: ptBR })
  } catch (error) {
    console.error('Error getting short weekday name:', error)
    return ''
  }
}
