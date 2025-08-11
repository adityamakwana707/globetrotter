// Consistent date formatting utilities to avoid hydration errors

export const formatDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid Date'
  }
}

export const formatDateShort = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid Date'
  }
}

export const formatDateForInput = (date: string | Date): string => {
  try {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0]
    }
    if (typeof date === 'string') {
      // Handle both ISO string and already formatted date strings
      if (date.includes('T')) {
        return date.split('T')[0]
      }
      // If it's already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date
      }
      // Try to parse as date
      return new Date(date).toISOString().split('T')[0]
    }
    return new Date().toISOString().split('T')[0] // fallback to today
  } catch (error) {
    console.error('Error formatting date:', error)
    return new Date().toISOString().split('T')[0] // fallback to today
  }
}

export const formatDateRange = (startDate: string | Date, endDate: string | Date): string => {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

export const calculateDaysBetween = (startDate: string | Date, endDate: string | Date): number => {
  try {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end days
  } catch (error) {
    console.error('Error calculating days between dates:', error)
    return 0
  }
}
