import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// Types
export interface Trip {
  id: string
  user_id: string
  name: string
  description: string
  start_date: string
  end_date: string
  status: 'planning' | 'active' | 'completed'
  cover_image?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface City {
  id: string
  name: string
  country: string
  latitude?: number
  longitude?: number
  timezone?: string
  description?: string
  image_url?: string
}

export interface Activity {
  id: string
  name: string
  description?: string
  category?: string
  price_range?: string
  rating?: number
  duration_hours?: number
  city_id?: string
  latitude?: number
  longitude?: number
  image_url?: string
  website_url?: string
}

export interface TripCity {
  id: string
  trip_id: string
  city_id: string
  city?: City
  order_index: number
  arrival_date?: string
  departure_date?: string
}

export interface TripActivity {
  id: string
  trip_id: string
  activity_id: string
  activity?: Activity
  trip_city_id?: string
  scheduled_date?: string
  scheduled_time?: string
  order_index?: number
  notes?: string
  estimated_cost?: number
  actual_cost?: number
}

export interface Budget {
  id: string
  trip_id: string
  category: string
  planned_amount: number
  spent_amount: number
  currency: string
}

// Store interfaces
interface TripStore {
  // State
  trips: Trip[]
  currentTrip: Trip | null
  tripCities: TripCity[]
  tripActivities: TripActivity[]
  budgets: Budget[]
  isLoading: boolean
  error: string | null

  // Actions
  setTrips: (trips: Trip[]) => void
  setCurrentTrip: (trip: Trip | null) => void
  addTrip: (trip: Trip) => void
  updateTrip: (id: string, trip: Partial<Trip>) => void
  deleteTrip: (id: string) => void
  setTripCities: (cities: TripCity[]) => void
  addTripCity: (city: TripCity) => void
  updateTripCity: (id: string, city: Partial<TripCity>) => void
  deleteTripCity: (id: string) => void
  setTripActivities: (activities: TripActivity[]) => void
  addTripActivity: (activity: TripActivity) => void
  updateTripActivity: (id: string, activity: Partial<TripActivity>) => void
  deleteTripActivity: (id: string) => void
  setBudgets: (budgets: Budget[]) => void
  addBudget: (budget: Budget) => void
  updateBudget: (id: string, budget: Partial<Budget>) => void
  deleteBudget: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearStore: () => void
}

interface UserStore {
  // State
  user: any | null
  isAuthenticated: boolean
  
  // Actions
  setUser: (user: any) => void
  clearUser: () => void
}

// Trip Store
export const useTripStore = create<TripStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        trips: [],
        currentTrip: null,
        tripCities: [],
        tripActivities: [],
        budgets: [],
        isLoading: false,
        error: null,

        // Actions
        setTrips: (trips) => set({ trips }),
        setCurrentTrip: (trip) => set({ currentTrip: trip }),
        addTrip: (trip) => set((state) => ({ trips: [trip, ...state.trips] })),
        updateTrip: (id, tripUpdate) =>
          set((state) => ({
            trips: state.trips.map((trip) =>
              trip.id === id ? { ...trip, ...tripUpdate } : trip
            ),
            currentTrip: state.currentTrip?.id === id 
              ? { ...state.currentTrip, ...tripUpdate } 
              : state.currentTrip
          })),
        deleteTrip: (id) =>
          set((state) => ({
            trips: state.trips.filter((trip) => trip.id !== id),
            currentTrip: state.currentTrip?.id === id ? null : state.currentTrip
          })),
        
        setTripCities: (cities) => set({ tripCities: cities }),
        addTripCity: (city) => set((state) => ({ tripCities: [...state.tripCities, city] })),
        updateTripCity: (id, cityUpdate) =>
          set((state) => ({
            tripCities: state.tripCities.map((city) =>
              city.id === id ? { ...city, ...cityUpdate } : city
            )
          })),
        deleteTripCity: (id) =>
          set((state) => ({
            tripCities: state.tripCities.filter((city) => city.id !== id)
          })),

        setTripActivities: (activities) => set({ tripActivities: activities }),
        addTripActivity: (activity) => set((state) => ({ tripActivities: [...state.tripActivities, activity] })),
        updateTripActivity: (id, activityUpdate) =>
          set((state) => ({
            tripActivities: state.tripActivities.map((activity) =>
              activity.id === id ? { ...activity, ...activityUpdate } : activity
            )
          })),
        deleteTripActivity: (id) =>
          set((state) => ({
            tripActivities: state.tripActivities.filter((activity) => activity.id !== id)
          })),

        setBudgets: (budgets) => set({ budgets }),
        addBudget: (budget) => set((state) => ({ budgets: [...state.budgets, budget] })),
        updateBudget: (id, budgetUpdate) =>
          set((state) => ({
            budgets: state.budgets.map((budget) =>
              budget.id === id ? { ...budget, ...budgetUpdate } : budget
            )
          })),
        deleteBudget: (id) =>
          set((state) => ({
            budgets: state.budgets.filter((budget) => budget.id !== id)
          })),

        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        clearStore: () => set({
          trips: [],
          currentTrip: null,
          tripCities: [],
          tripActivities: [],
          budgets: [],
          isLoading: false,
          error: null
        })
      }),
      {
        name: 'trip-store',
        partialize: (state) => ({
          trips: state.trips,
          currentTrip: state.currentTrip,
        })
      }
    ),
    { name: 'trip-store' }
  )
)

// User Store
export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        
        setUser: (user) => set({ user, isAuthenticated: !!user }),
        clearUser: () => set({ user: null, isAuthenticated: false })
      }),
      {
        name: 'user-store'
      }
    ),
    { name: 'user-store' }
  )
)
