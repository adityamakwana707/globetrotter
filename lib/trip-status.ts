/**
 * Trip Status Auto-Detection Utility
 * Automatically determines trip status based on dates
 */

export type TripStatus = 'planning' | 'active' | 'completed'

export interface TripStatusInfo {
  status: TripStatus
  daysUntilStart?: number
  daysRemaining?: number
  daysSinceEnd?: number
  progressPercentage: number
  statusMessage: string
  statusColor: string
  statusIcon: string
}

export function calculateTripStatus(startDate: string | Date, endDate: string | Date): TripStatusInfo {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Set time to beginning/end of day for accurate comparison
  now.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)

  const totalDuration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  
  if (now < start) {
    // Trip hasn't started yet - PLANNING
    const daysUntilStart = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      status: 'planning',
      daysUntilStart,
      progressPercentage: 0,
      statusMessage: daysUntilStart === 1 
        ? "Your adventure starts tomorrow! 🚀" 
        : daysUntilStart <= 7
        ? `Only ${daysUntilStart} days until your adventure begins! 🎒`
        : `${daysUntilStart} days to plan your perfect trip 📋`,
      statusColor: 'text-yellow-400',
      statusIcon: '📋'
    }
  } else if (now >= start && now <= end) {
    // Trip is currently happening - ACTIVE
    const daysSinceStart = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const progressPercentage = Math.round((daysSinceStart / totalDuration) * 100)
    
    return {
      status: 'active',
      daysRemaining,
      progressPercentage,
      statusMessage: daysRemaining === 0
        ? "Last day of your adventure! Make it count! 🌟"
        : daysRemaining === 1
        ? "One more day left! Enjoy every moment! ⏰"
        : `${daysRemaining} amazing days remaining! 🌍`,
      statusColor: 'text-green-400',
      statusIcon: '🌍'
    }
  } else {
    // Trip has ended - COMPLETED
    const daysSinceEnd = Math.ceil((now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      status: 'completed',
      daysSinceEnd,
      progressPercentage: 100,
      statusMessage: daysSinceEnd === 1
        ? "Your adventure just ended! Time to share those memories! 📸"
        : daysSinceEnd <= 7
        ? `What an adventure! ${daysSinceEnd} days of amazing memories 💫`
        : `Trip completed ${daysSinceEnd} days ago. Time for the next adventure? 🗺️`,
      statusColor: 'text-blue-400',
      statusIcon: '🏆'
    }
  }
}

export function getStatusBadgeStyle(status: TripStatus) {
  switch (status) {
    case 'planning':
      return {
        className: 'bg-yellow-600 text-white',
        label: 'Planning',
        icon: '📋'
      }
    case 'active':
      return {
        className: 'bg-green-600 text-white animate-pulse',
        label: 'Active',
        icon: '🌍'
      }
    case 'completed':
      return {
        className: 'bg-blue-600 text-white',
        label: 'Completed',
        icon: '🏆'
      }
    default:
      return {
        className: 'bg-gray-600 text-white',
        label: 'Unknown',
        icon: '❓'
      }
  }
}

export function getMotivationalMessage(status: TripStatus, daysCount?: number): string {
  switch (status) {
    case 'planning':
      if (!daysCount) return "Every great journey begins with a single step! 🚶‍♂️"
      if (daysCount <= 3) return "The countdown begins! Pack your excitement! 🎒✨"
      if (daysCount <= 7) return "Adventure is calling! Can you hear it? 📞🏔️"
      if (daysCount <= 30) return "Great adventures take time to plan. You're on the right track! 🛤️"
      return "Dream big, plan bigger! Your adventure awaits! 🌟"
    
    case 'active':
      if (!daysCount) return "You're living the dream right now! 🌈"
      if (daysCount === 1) return "Make this last day legendary! 🔥"
      if (daysCount <= 3) return "Savor every moment - they're flying by! ⏰"
      return "You're in the middle of an amazing adventure! 🎊"
    
    case 'completed':
      if (!daysCount) return "What a journey it's been! 🎭"
      if (daysCount <= 7) return "Fresh memories, incredible experiences! 📷✨"
      return "Time to start planning your next adventure! 🗺️➡️"
    
    default:
      return "Every trip is a story waiting to be written! 📖"
  }
}

// Auto-update trip status in database
export async function updateTripStatusInDB(tripId: number): Promise<TripStatusInfo | null> {
  try {
    // First get the trip dates
    const response = await fetch(`/api/trips/${tripId}`)
    if (!response.ok) return null
    
    const trip = await response.json()
    const statusInfo = calculateTripStatus(trip.start_date, trip.end_date)
    
    // Update status if it's different
    if (trip.status !== statusInfo.status) {
      await fetch(`/api/trips/${tripId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusInfo.status })
      })
    }
    
    return statusInfo
  } catch (error) {
    console.error('Error updating trip status:', error)
    return null
  }
}
