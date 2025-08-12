"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { useTripStore } from "@/lib/store";
import {
  Upload,
  Calendar,
  MapPin,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  DollarSign,
  Clock,
  Search,
  CloudSun,
  FileText,
  Paperclip,
  GripVertical,
  Edit,
  Copy,
  CheckCircle,
  Sparkles,
  Rocket,
  PartyPopper,
  Target,
  Heart,
  Star,
  Zap,
  Trophy,
} from "lucide-react";
import Image from "next/image";
import { formatDateForInput } from "@/lib/date-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  DndContext, 
  DragOverlay, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// Enhanced schema with more flexible validation
const tripSchema = z
  .object({
    name: z
      .string()
      .min(1, "Trip name is required")
      .max(255, "Trip name too long"),
    description: z
      .string()
      .max(1000, "Description too long")
      .optional()
      .default(""),
    destinations: z
      .array(z.string())
      .min(1, "At least one destination is required"),
    startDate: z
      .string()
      .min(1, "Start date is required")
      .refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
    endDate: z
      .string()
      .min(1, "End date is required")
      .refine((date) => !isNaN(Date.parse(date)), "Invalid end date"),
    totalBudget: z
      .number()
      .min(0, "Budget must be positive")
      .optional()
      .default(0),
  currency: z.string().default("USD"),
    status: z
      .enum(["planning", "active", "completed"])
      .optional()
      .default("planning"),
    isPublic: z.boolean().default(false),
    itinerary: z.array(z.any()).optional().default([]),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start <= end;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

type TripFormData = z.infer<typeof tripSchema>;

interface ItineraryDay {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location: {
    name: string;
    coordinates?: { lat: number; lng: number };
    address?: string;
  };
  activityType:
    | "travel"
    | "accommodation"
    | "sightseeing"
    | "adventure"
    | "dining"
    | "shopping"
    | "entertainment"
    | "other";
  budget: {
    estimated: number;
    actual?: number;
    breakdown: Array<{
      category: string;
      amount: number;
      description?: string;
    }>;
  };
  notes?: string;
  completed: boolean;
  activities: Array<{
    id: number;
    name: string;
    description?: string;
    category?: string;
    price_range?: string;
    rating?: number;
    duration_hours?: number;
    city_id: number;
    image_url?: string;
    startTime?: string;
    endTime?: string;
    orderIndex?: number;
    notes?: string;
    estimatedCost?: number;
  }>;
  timeSlots: Array<{
    id: string;
    startTime: string;
    endTime: string;
    activity?: {
      id: number;
      name: string;
      description?: string;
      category?: string;
      price_range?: string;
      rating?: number;
      duration_hours?: number;
      city_id: number;
      image_url?: string;
      notes?: string;
      estimatedCost?: number;
    };
    isOccupied: boolean;
  }>;
}

const ACTIVITY_TYPES = [
  { value: "travel", label: "Travel", icon: "  ", color: "bg-blue-500" },
  {
    value: "accommodation",
    label: "Accommodation",
    icon: "🏨",
    color: "bg-purple-500",
  },
  {
    value: "sightseeing",
    label: "Sightseeing",
    icon: "  ",
    color: "bg-green-500",
  },
  { value: "adventure", label: "Adventure", icon: "  ️", color: "bg-red-500" },
  { value: "dining", label: "Dining", icon: "🍽️", color: "bg-orange-500" },
  { value: "shopping", label: "Shopping", icon: "  ️", color: "bg-pink-500" },
  {
    value: "entertainment",
    label: "Entertainment",
    icon: "🎭",
    color: "bg-indigo-500",
  },
  { value: "other", label: "Other", icon: "  ", color: "bg-gray-500" },
];

interface Trip {
  id: number;
  display_id: number;
  user_id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: "planning" | "active" | "completed";
  cover_image?: string;
  is_public: boolean;
  share_token?: string;
  allow_copy: boolean;
  created_at: string;
  updated_at: string;
}

interface ComprehensiveTripBuilderProps {
  existingTrip?: Trip;
  existingCities?: any[];
  existingActivities?: any[];
  existingBudgets?: any[];
  existingDestinations?: string[];
  existingItinerary?: any[];
}

// AI Suggestion Card Component with Drag functionality
const SuggestionCard = React.memo(
  ({ suggestion, index }: { suggestion: any; index: number }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
      useDraggable({
        id: `suggestion-${index}`,
      });

    const style = {
      transform: CSS.Transform.toString(transform),
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={`p-3 bg-gray-800 rounded border cursor-grab active:cursor-grabbing transition-all duration-200 ${
          suggestion.enriched
            ? "border-emerald-500 shadow-emerald-500/20 shadow-lg"
            : "border-gray-700 hover:border-gray-600"
        } ${isDragging ? "scale-105 shadow-xl" : "hover:shadow-lg"}`}
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-white font-medium text-sm leading-tight">
            {suggestion.name}
          </h4>
          <div className="flex items-center gap-1 ml-2">
            {suggestion.rating && (
              <div className="flex items-center">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span className="text-xs text-gray-300 ml-1">
                  {suggestion.rating.toFixed(1)}
                </span>
              </div>
            )}
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        {suggestion.description && (
          <p className="text-gray-300 text-xs mb-2 line-clamp-2">
            {suggestion.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {suggestion.category && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                {suggestion.category}
              </Badge>
            )}
            {suggestion.price_range && (
              <span className="text-xs text-emerald-400 font-medium">
                {suggestion.price_range}
              </span>
            )}
          </div>

          {suggestion.duration_hours && (
            <div className="flex items-center text-xs text-gray-400">
              <Clock className="h-3 w-3 mr-1" />
              {suggestion.duration_hours}h
            </div>
          )}
        </div>

        <div className="mt-2 text-xs text-gray-500">
          💡 Drag to add to time slot
        </div>
      </div>
    );
  }
);

// Draggable Activity Component
const DraggableActivity = React.memo(
  ({
    activity,
    slotId,
    dayId,
  }: {
    activity: any;
    slotId: string;
    dayId: string;
  }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
      useDraggable({
        id: `activity-${dayId}-${slotId}`,
        data: {
          activity,
          sourceSlotId: slotId,
          sourceDayId: dayId,
        },
      });

    const style = transform
      ? {
          transform: CSS.Transform.toString(transform),
        }
      : undefined;

    return (
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        style={style}
        className={`space-y-1 cursor-grab active:cursor-grabbing p-2 rounded border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200 ${
          isDragging ? "opacity-50 scale-105" : "hover:scale-102"
        }`}
      >
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900 leading-tight">
            {activity.name}
          </h4>
          <GripVertical className="h-3 w-3 text-gray-400" />
        </div>
        {activity.description && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {activity.description}
          </p>
        )}
        {activity.category && (
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            {activity.category}
          </Badge>
        )}
        {activity.price_range && (
          <span className="text-xs text-emerald-600 font-medium">
            {activity.price_range}
          </span>
        )}
      </div>
    );
  }
);

// Time Slot Droppable Component
const TimeSlotDroppable = React.memo(
  ({
    slot,
    dayId,
    onRemoveActivity,
  }: {
    slot: any;
    dayId: string;
    onRemoveActivity: (slotId: string) => void;
  }) => {
    const { setNodeRef } = useDroppable({
      id: `slot-${dayId}-${slot.id}`,
    });

    return (
      <div
        ref={setNodeRef}
        className={`p-3 rounded-lg border-2 border-dashed transition-all duration-200 min-h-[80px] ${
          slot.isOccupied
            ? "bg-emerald-50 border-emerald-200 shadow-sm"
            : "bg-gray-50 border-gray-300 hover:border-emerald-300 hover:bg-emerald-50/50"
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-medium text-gray-600">
            {slot.startTime} - {slot.endTime}
          </span>
          {slot.isOccupied && slot.activity && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveActivity(slot.id)}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>

        {slot.isOccupied && slot.activity ? (
          <DraggableActivity
            activity={slot.activity}
            slotId={slot.id}
            dayId={dayId}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Clock className="h-4 w-4 mx-auto mb-1" />
              <span className="text-xs">Drop activity here</span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default function ComprehensiveTripBuilder({ 
  existingTrip, 
  existingCities = [], 
  existingActivities = [], 
  existingBudgets = [], 
  existingDestinations = [], 
  existingItinerary = [],
}: ComprehensiveTripBuilderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [coverImage, setCoverImage] = useState<string>(
    existingTrip?.cover_image || ""
  );
  const [currentTab, setCurrentTab] = useState("basic");
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>(
    existingItinerary.length > 0 ? existingItinerary : []
  );
  const [showActivitySearch, setShowActivitySearch] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<Array<any>>([]);
  const [aiSchedule, setAISchedule] = useState<Array<any>>([]);
  const [dragSuggestion, setDragSuggestion] = useState<any | null>(null);
  const [timeDialog, setTimeDialog] = useState<{
    open: boolean;
    dayId: string;
    suggestion: any | null;
    slots: string[];
  }>({ open: false, dayId: "", suggestion: null, slots: [] });
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(
    existingDestinations.length > 0 ? existingDestinations : []
  );
  const [destinationQuery, setDestinationQuery] = useState("");
  const [destinationSuggestions, setDestinationSuggestions] = useState<
    Array<{
      display_name?: string;
      name?: string;
      displayName?: string;
      lat: string;
      lon: string;
      isLocal?: boolean;
      address?: { country?: string };
      country?: string;
      type?: string;
      source?: 'database' | 'geocoding';
      popularity_score?: number;
      cost_index?: number;
      importance?: number;
    }>
  >([]);
  const [totalEstimatedBudget, setTotalEstimatedBudget] = useState(0);
  const [formProgress, setFormProgress] = useState(0);
  const { addTrip } = useTripStore();

  // Fun emojis for different sections
  const stepEmojis = {
    basic: "  ",
    itinerary: "🗓️", 
    budget: "💰",
    review: "🚀",
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: existingTrip
      ? {
      name: existingTrip.name,
      description: existingTrip.description,
      destinations: [],
      startDate: formatDateForInput(existingTrip.start_date),
      endDate: formatDateForInput(existingTrip.end_date),
      totalBudget: 0,
      currency: "USD",
      isPublic: existingTrip.is_public,
          itinerary: [],
        }
      : {
      name: "",
      description: "",
      destinations: [],
      startDate: "",
      endDate: "",
      totalBudget: 0,
      currency: "USD",
      isPublic: false,
          itinerary: [],
        },
  });

  const watchedStartDate = watch("startDate");
  const watchedEndDate = watch("endDate");
  const watchedName = watch("name");

  // Load existing trip data when editing
  useEffect(() => {
    if (existingTrip && existingBudgets.length > 0) {
      // Calculate total budget from existing budgets
      const totalBudget = existingBudgets.reduce(
        (sum, budget) => sum + (budget.planned_amount || 0),
        0
      );
      setTotalEstimatedBudget(totalBudget);
      setValue("totalBudget", totalBudget);
    }
  }, [
    existingTrip,
    existingBudgets,
    existingDestinations,
    existingCities,
    existingActivities,
    setValue,
  ]);

  // Calculate form completion percentage
  useEffect(() => {
    let progress = 0;
    
    // Basic details (40%)
    if (watchedName) progress += 10;
    if (selectedDestinations.length > 0) progress += 10;
    if (watchedStartDate && watchedEndDate) progress += 20;
    
    // Itinerary (30%)
    if (itineraryDays.length > 0) progress += 15;
    if (itineraryDays.some((day) => day.description)) progress += 15;
    
    // Budget (20%)
    if (totalEstimatedBudget > 0) progress += 20;
    
    // Review (10%)
    if (currentTab === "review") progress += 10;

    setFormProgress(Math.min(progress, 100));
  }, [
    watchedName,
    selectedDestinations,
    watchedStartDate,
    watchedEndDate,
    itineraryDays,
    totalEstimatedBudget,
    currentTab,
  ]);

  // Hybrid destination search: Database first (instant), then geocoding (background)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!destinationQuery.trim()) {
        setDestinationSuggestions([]);
        return;
      }

      try {
        // Use our new hybrid search API that combines database + geocoding
        const response = await fetch(
          `/api/destinations/search?q=${encodeURIComponent(destinationQuery)}&limit=15`
        );
        if (response.ok) {
          const data = await response.json();
          setDestinationSuggestions(data);
        } else {
          setDestinationSuggestions([]);
        }
      } catch (error) {
        console.error("Error fetching destination suggestions:", error);
        setDestinationSuggestions([]);
      }
    };

    // Reduced delay for faster response
    const timeoutId = setTimeout(fetchSuggestions, 200);

    return () => clearTimeout(timeoutId);
  }, [destinationQuery]);

  // Fetch weather when destinations change
  useEffect(() => {
    if (selectedDestinations.length > 0) {
      fetchWeatherData(selectedDestinations);
    }
  }, [selectedDestinations]);

  // Initialize time slots for existing itinerary days
  useEffect(() => {
    if (itineraryDays.length > 0) {
      const updatedDays = itineraryDays.map((day) => {
        if (!day.timeSlots || day.timeSlots.length === 0) {
          return { ...day, timeSlots: generateTimeSlots() };
        }
        return day;
      });

      // Only update if there were changes
      const hasChanges = updatedDays.some(
        (day, index) =>
          !itineraryDays[index].timeSlots ||
          itineraryDays[index].timeSlots.length === 0
      );

      if (hasChanges) {
        setItineraryDays(updatedDays);
        setValue("itinerary", updatedDays);
      }
    }
  }, [itineraryDays.length]); // Only run when the number of days changes

  const handleSelectDestinationSuggestion = (s: any) => {
    // Handle both database and geocoding results
    const displayName = s.display_name || s.name || s.displayName || '';
    const country = s.country || s.address?.country || 'Unknown';
    const source = s.source || 'database';
    
    if (!displayName) return;
    
    if (selectedDestinations.includes(displayName)) {
      setDestinationQuery("");
      setDestinationSuggestions([]);
      return;
    }
    
    const updated = [...selectedDestinations, displayName];
    setSelectedDestinations(updated);
    setValue("destinations", updated);
    setDestinationQuery("");
    setDestinationSuggestions([]);
    
    toast({ 
      title: `📍 ${displayName} added!`,
      description: `Added from ${source === 'geocoding' ? 'OpenStreetMap' : 'our database'}`
    });
  };

  // Generate time slots for a day (8 AM to 10 PM in 2-hour intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 22; hour += 2) {
      const startTime = `${hour.toString().padStart(2, "0")}:00`;
      const endTime = `${(hour + 2).toString().padStart(2, "0")}:00`;
      slots.push({
        id: `slot-${hour}`,
        startTime,
        endTime,
        activity: undefined,
        isOccupied: false,
      });
    }
    return slots;
  };

  // Calculate trip duration and generate initial days
  const generateItineraryDays = () => {
    if (!watchedStartDate || !watchedEndDate) return;

    const start = new Date(watchedStartDate);
    const end = new Date(watchedEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newDays: ItineraryDay[] = [];
    for (let i = 0; i < diffDays; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      
      newDays.push({
        id: `day-${i + 1}-${Date.now()}`,
        dayNumber: i + 1,
        title:
          i === 0
            ? "Arrival Day"
            : i === diffDays - 1
            ? "Departure Day"
            : `Day ${i + 1}`,
        description: "",
        date: currentDate.toISOString().split("T")[0],
        location: {
          name: selectedDestinations[0] || "",
        },
        activityType: i === 0 ? "travel" : "sightseeing",
        budget: {
          estimated: 0,
          breakdown: [],
        },
        notes: "",
        completed: false,
        activities: [],
        timeSlots: generateTimeSlots(),
      });
    }

    setItineraryDays(newDays);
    setValue("itinerary", newDays);
  };

  // Add new itinerary day
  const addItineraryDay = () => {
    const newDay: ItineraryDay = {
      id: `day-${itineraryDays.length + 1}-${Date.now()}`,
      dayNumber: itineraryDays.length + 1,
      title: `Day ${itineraryDays.length + 1}`,
      description: "",
      date: watchedStartDate || new Date().toISOString().split("T")[0],
      location: {
        name: selectedDestinations[0] || "",
      },
      activityType: "sightseeing",
      budget: {
        estimated: 0,
        breakdown: [],
      },
      notes: "",
      completed: false,
      activities: [],
      timeSlots: generateTimeSlots(),
    };

    const updatedDays = [...itineraryDays, newDay];
    setItineraryDays(updatedDays);
    setValue("itinerary", updatedDays);
    
    // Recalculate total budget
    const total = updatedDays.reduce(
      (sum, day) => sum + day.budget.estimated,
      0
    );
    setTotalEstimatedBudget(total);
    setValue("totalBudget", total);
  };

  // Update itinerary day
  // Relax the update type to accept activities coming from child components with optional ids
  const updateItineraryDay = (
    dayId: string,
    updates: Partial<Omit<ItineraryDay, "activities">> & {
      activities?: Array<any>;
    }
  ) => {
    const updatedDays = itineraryDays.map((day) =>
      day.id === dayId ? { ...day, ...updates } : day
    );
    setItineraryDays(updatedDays);
    setValue("itinerary", updatedDays);
    
    // Recalculate total budget
    const total = updatedDays.reduce(
      (sum, day) => sum + day.budget.estimated,
      0
    );
    setTotalEstimatedBudget(total);
    setValue("totalBudget", total);
  };

  // Remove itinerary day
  const removeItineraryDay = (dayId: string) => {
    const updatedDays = itineraryDays
      .filter((day) => day.id !== dayId)
      .map((day, index) => ({ ...day, dayNumber: index + 1 }));
    
    setItineraryDays(updatedDays);
    setValue("itinerary", updatedDays);
    
    // Recalculate total budget
    const total = updatedDays.reduce(
      (sum, day) => sum + day.budget.estimated,
      0
    );
    setTotalEstimatedBudget(total);
    setValue("totalBudget", total);
  };

  // Add activity to a specific day
  const addActivityToDay = (
    dayId: string,
    activity: any,
    selectedTime?: string
  ) => {
    const updatedDays = itineraryDays.map((day) => {
      if (day.id === dayId) {
        // Calculate estimated cost from price_range if available
        let estimatedCost = 0;
        if (
          activity.estimatedCost &&
          typeof activity.estimatedCost === "number"
        ) {
          estimatedCost = activity.estimatedCost;
        } else if (activity.price_range) {
          // Convert price_range string to estimated cost
          // Assuming price_range is like "$", "$$", "$$$", "$$$$"
          const priceLevel = activity.price_range.length;
          estimatedCost = priceLevel * 25; // $25 per level as a reasonable estimate
        }
        
        // Calculate end time based on duration
        const startTime = selectedTime || activity.startTime || "09:00:00";
        const duration = activity.duration_hours || 2;
        const startMinutes =
          parseInt(startTime.split(":")[0]) * 60 +
          parseInt(startTime.split(":")[1]);
        const endMinutes = startMinutes + duration * 60;
        const endTime = `${String(Math.floor(endMinutes / 60)).padStart(
          2,
          "0"
        )}:${String(endMinutes % 60).padStart(2, "0")}:00`;
        
        const newActivity = {
          id: activity.id || null, // Keep original ID if from database
          name: activity.name || "Untitled Activity",
          description: activity.description || activity.notes || "",
          category: activity.category || "general",
          price_range: activity.price_range || "$",
          rating: activity.rating || null,
          duration_hours: activity.duration_hours || 2,
          city_id: activity.city_id || null,
          image_url: activity.image_url || null,
          startTime: startTime,
          endTime: endTime,
          orderIndex: day.activities.length + 1,
          notes: activity.notes || "",
          estimatedCost: estimatedCost,
          // Enhanced fields from web scraping
          coordinates: activity.coordinates || null,
          openingHours: activity.openingHours || null,
          wikipediaUrl: activity.wikipediaUrl || null,
          enriched: activity.enriched || false,
          enrichedAt: activity.enrichedAt || null,
        };

        // Append activity to day description
        const activityText = `${newActivity.name}${
          newActivity.description ? ` - ${newActivity.description}` : ""
        }`;
        const currentDescription = day.description || "";
        const newDescription = currentDescription
          ? `${currentDescription}\n• ${activityText}`
          : `• ${activityText}`;
        
        return {
          ...day,
          activities: [...day.activities, newActivity],
          budget: {
            ...day.budget,
            estimated: day.budget.estimated + estimatedCost,
          },
          description: newDescription,
        };
      }
      return day;
    });

    setItineraryDays(updatedDays);
    setValue("itinerary", updatedDays);
    
    // Recalculate total budget
    const total = updatedDays.reduce(
      (sum, day) => sum + day.budget.estimated,
      0
    );
    setTotalEstimatedBudget(total);
    setValue("totalBudget", total);
  };

  // Fetch weather data for the first destination
  const fetchWeatherData = async (destinations: string[]) => {
    if (destinations.length === 0) return;

    try {
      setIsLoadingWeather(true);
      const response = await fetch(
        `/api/weather?city=${encodeURIComponent(destinations[0])}`
      );

      if (response.ok) {
        const data = await response.json();
        setWeatherData(data);
      } else {
        const errorData = await response.json();
        setWeatherData({
          available: false,
          error: errorData.error || "Failed to fetch weather data",
        });
      }
    } catch (error) {
      console.error("Error fetching weather:", error);
      setWeatherData({
        available: false,
        error: "Network error while fetching weather data",
      });
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // Fetch AI suggestions for the first destination
  const fetchAISuggestions = async () => {
    if (selectedDestinations.length === 0) {
      toast({ title: "Add a destination first", variant: "destructive" });
      return;
    }
    setIsLoadingAI(true);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: selectedDestinations[0],
          days: itineraryDays.length || 2,
          interests: [],
        }),
      });
      const data = await res.json();
      setAISuggestions(
        Array.isArray(data?.suggestions) ? data.suggestions : []
      );
      setAISchedule(Array.isArray(data?.scheduled) ? data.scheduled : []);
      toast({
        title: "AI suggestions ready",
        description: `Planned ${(data?.scheduled || []).length} timed items`,
      });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to get suggestions", variant: "destructive" });
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Helpers: compute available slots for a day
  const timeToMinutes = useCallback((t: string) => {
    const [hh, mm] = t.split(":");
    return parseInt(hh) * 60 + parseInt(mm);
  }, []);

  const minutesToTime = useCallback(
    (m: number) =>
      `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(
        2,
        "0"
      )}:00`,
    []
  );

  const computeAvailableSlots = useCallback(
    (day: ItineraryDay, durationHours: number) => {
      const startHour = 9;
      const endHour = 18;
      const step = 30; // minutes
      const durationMin = Math.round((durationHours || 2) * 60);
      const occupied: Array<[number, number]> = [];
    for (const a of day.activities) {
        if (!a.startTime) continue;
        const s = timeToMinutes(a.startTime);
        const d = Math.round(((a as any).duration_hours || 1) * 60);
        occupied.push([s, s + d]);
      }
      occupied.sort((x, y) => x[0] - y[0]);
      const free: string[] = [];
    for (let t = startHour * 60; t + durationMin <= endHour * 60; t += step) {
        const slot: [number, number] = [t, t + durationMin];
        const overlaps = occupied.some(
          ([s, e]) => Math.max(s, slot[0]) < Math.min(e, slot[1])
        );
        if (!overlaps) free.push(minutesToTime(t));
      }
      return free;
    },
    [timeToMinutes, minutesToTime]
  );

  // Drag handlers with useCallback to prevent re-creation
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveDragId(event.active.id as string);
      const suggestionId = event.active.id as string;
      if (suggestionId.startsWith("suggestion-")) {
        const index = parseInt(suggestionId.split("-")[1]);
        setDragSuggestion(aiSuggestions[index]);
      }
    },
    [aiSuggestions]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDragId(null);
      setDragSuggestion(null);

      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Handle moving activities between time slots
      if (activeId.startsWith("activity-")) {
        const [, sourceDayId, sourceSlotId] = activeId.split("-");
        const sourceDay = itineraryDays.find((d) => d.id.includes(sourceDayId));
        if (!sourceDay) return;

        const sourceSlotIndex = sourceDay.timeSlots.findIndex(
          (slot) => slot.id === sourceSlotId
        );
        if (
          sourceSlotIndex === -1 ||
          !sourceDay.timeSlots[sourceSlotIndex].isOccupied
        )
          return;

        const activity = sourceDay.timeSlots[sourceSlotIndex].activity;
        if (!activity) return;

        // Check if dropped on a time slot
        if (overId.startsWith("slot-")) {
          const [, targetDayId, targetSlotId] = overId.split("-");
          const targetDay = itineraryDays.find((d) =>
            d.id.includes(targetDayId)
          );
          if (!targetDay) return;

          const targetSlotIndex = targetDay.timeSlots.findIndex(
            (slot) => slot.id === targetSlotId
          );
          if (
            targetSlotIndex === -1 ||
            targetDay.timeSlots[targetSlotIndex].isOccupied
          )
            return;

          // Move activity from source to target
          const updatedDays = itineraryDays.map((day) => {
            if (day.id === sourceDay.id) {
              // Clear source slot
              const updatedTimeSlots = [...day.timeSlots];
              updatedTimeSlots[sourceSlotIndex] = {
                ...updatedTimeSlots[sourceSlotIndex],
                activity: undefined,
                isOccupied: false,
              };
              return { ...day, timeSlots: updatedTimeSlots };
            }
            if (day.id === targetDay.id) {
              // Add activity to target slot
              const updatedTimeSlots = [...day.timeSlots];
              updatedTimeSlots[targetSlotIndex] = {
                ...updatedTimeSlots[targetSlotIndex],
                activity: activity,
                isOccupied: true,
              };
              return { ...day, timeSlots: updatedTimeSlots };
            }
            return day;
          });

          setItineraryDays(updatedDays);
          setValue("itinerary", updatedDays);

          toast({
            title: "🔄 Activity Moved!",
            description: `${activity.name} moved to ${targetDay.timeSlots[targetSlotIndex].startTime}-${targetDay.timeSlots[targetSlotIndex].endTime}`,
          });
        }
        return;
      }

      // Handle AI suggestions (existing logic)
      if (activeId.startsWith("suggestion-")) {
        const suggestionIndex = parseInt(activeId.split("-")[1]);
        const suggestion = aiSuggestions[suggestionIndex];
        if (!suggestion) return;

        // Check if dropped on a time slot
        if (overId.startsWith("slot-")) {
          const [, dayId, slotId] = overId.split("-");
          const targetDay = itineraryDays.find((d) => d.id.includes(dayId));
          if (!targetDay) return;

          const slotIndex = targetDay.timeSlots.findIndex(
            (slot) => slot.id === slotId
          );
          if (slotIndex === -1 || targetDay.timeSlots[slotIndex].isOccupied)
            return;

          // Add activity to the time slot and update day description
          const updatedDays = itineraryDays.map((day) => {
            if (day.id === targetDay.id) {
              const updatedTimeSlots = [...day.timeSlots];
              updatedTimeSlots[slotIndex] = {
                ...updatedTimeSlots[slotIndex],
                activity: {
                  id: Date.now(),
                  name: suggestion.name,
                  description: suggestion.description,
                  category: suggestion.category,
                  price_range: suggestion.price_range,
                  rating: suggestion.rating,
                  duration_hours: suggestion.duration_hours || 2,
                  city_id: suggestion.city_id || 0,
                  image_url: suggestion.image_url,
                  notes: "",
                  estimatedCost: 0,
                },
                isOccupied: true,
              };

              // Append activity to day description
              const activityText = `${suggestion.name}${
                suggestion.description ? ` - ${suggestion.description}` : ""
              }`;
              const currentDescription = day.description || "";
              const newDescription = currentDescription
                ? `${currentDescription}\n• ${activityText}`
                : `• ${activityText}`;

              return {
                ...day,
                timeSlots: updatedTimeSlots,
                description: newDescription,
              };
            }
            return day;
          });

          setItineraryDays(updatedDays);
          setValue("itinerary", updatedDays);

          toast({
            title: "🎯 Activity Added!",
            description: `${suggestion.name} added to ${targetDay.timeSlots[slotIndex].startTime}-${targetDay.timeSlots[slotIndex].endTime}`,
          });
        }
        // Check if dropped on a day (show time slot selection dialog)
        else if (overId.startsWith("day-")) {
          const targetDayId = overId.replace("day-", "");
          const targetDay = itineraryDays.find((d) => d.id === targetDayId);
          if (!targetDay) return;

      // Show time slot selection dialog
          const slots = computeAvailableSlots(
            targetDay,
            suggestion.duration_hours || 2
          );
      setTimeDialog({ 
        open: true, 
        dayId: targetDayId, 
        suggestion: suggestion, 
            slots,
          });
    }
      }
    },
    [aiSuggestions, itineraryDays, computeAvailableSlots]
  );

  // Enrich place information using web scraping
  const handleEnrichPlace = async (suggestion: any) => {
    try {
      const response = await fetch("/api/enrich-place", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: suggestion.name,
          city: selectedDestinations[0], // Use first destination as context
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to enrich place information");
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Update the suggestion with enriched information
        const enrichedSuggestion = {
          ...suggestion,
          description: result.data.description,
          duration_hours: result.data.estimatedDuration,
          openingHours: result.data.openingHours,
          coordinates: result.data.coordinates,
          enriched: true,
          enrichedAt: new Date().toISOString(),
        };

        // Update the suggestions array
        setAISuggestions((prev) =>
          prev.map((s) => (s.name === suggestion.name ? enrichedSuggestion : s))
        );

        toast({
          title: "Place enriched!",
          description: `Updated information for ${suggestion.name}`,
        });
      }
    } catch (error) {
      console.error("Error enriching place:", error);
      toast({
        title: "Enrichment failed",
        description: "Could not fetch additional information for this place.",
        variant: "destructive",
      });
    }
  };

  // Simple suggestion component with click-to-add
  const SuggestionCard = React.memo(
    ({ suggestion, index }: { suggestion: any; index: number }) => {
    return (
      <div
        className={`p-3 bg-gray-800 rounded border ${
            suggestion.enriched
              ? "border-green-500 bg-gray-800/80"
              : "border-gray-700"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
              <p className="text-white font-medium text-sm">
                {suggestion.name}
              </p>
            <p className="text-xs text-gray-400">
                {suggestion.category || "general"}
                {suggestion.price_range ? ` • ${suggestion.price_range}` : ""}
                {suggestion.duration_hours
                  ? ` • ${suggestion.duration_hours}h`
                  : ""}
                {suggestion.enriched && (
                  <span className="text-green-400"> • Enriched</span>
                )}
            </p>
            {suggestion.description && suggestion.enriched && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {suggestion.description.slice(0, 100)}...
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1 ml-2">
            <div className="flex gap-1">
                {itineraryDays.slice(0, 3).map((d) => (
                <Button 
                  key={d.id} 
                  type="button" 
                  size="sm" 
                  className="text-xs bg-blue-600 hover:bg-blue-700" 
                  onClick={() => {
                      const slots = computeAvailableSlots(
                        d,
                        suggestion.duration_hours || 2
                      );
                      setTimeDialog({
                        open: true,
                        dayId: d.id,
                        suggestion,
                        slots,
                      });
                  }}
                >
                  Day {d.dayNumber}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
      );
    }
  );

  // Simple droppable wrapper component
  const DroppableWrapper = React.memo(
    ({ day, children }: { day: ItineraryDay; children: React.ReactNode }) => {
    const { setNodeRef, isOver } = useDroppable({ 
      id: `day-${day.id}`,
        data: { day },
      });

    return (
      <div ref={setNodeRef} className="relative">
        {/* Drop indicator overlay */}
        {isOver && (
          <div className="absolute -inset-2 bg-blue-500/10 border-2 border-blue-500 border-dashed rounded-lg pointer-events-none z-10" />
        )}
        {children}
      </div>
      );
    }
  );

  // Handle file upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      const result = await response.json();
      setCoverImage(result.url);
      
      toast({
        title: "Image uploaded successfully",
        description: "Your trip cover image has been uploaded.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description:
          error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle form submission
  const onSubmit = async (data: TripFormData) => {
    console.log("🚀 === FORM SUBMISSION STARTED ===");
    console.log("📝 Form data:", data);
    console.log("📍 Selected destinations:", selectedDestinations);
    console.log("️ Itinerary days:", itineraryDays);
    console.log("💰 Total budget:", totalEstimatedBudget);
    console.log("🖼️ Cover image:", coverImage);

    // Validate required fields
    if (
      !data.name ||
      !data.startDate ||
      !data.endDate ||
      selectedDestinations.length === 0
    ) {
      console.error("❌ Missing required fields:");
      console.error("- Name:", data.name);
      console.error("- Start date:", data.startDate);
      console.error("- End date:", data.endDate);
      console.error("- Destinations:", selectedDestinations);
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const tripData = {
        name: data.name,
        description: data.description || "",
        startDate: data.startDate,
        endDate: data.endDate,
        isPublic: data.isPublic || false,
        destinations: selectedDestinations,
        totalBudget: totalEstimatedBudget || 0,
        itinerary: itineraryDays || [],
        ...(coverImage && coverImage.trim() !== "" && { coverImage }),
      };

      console.log(
        "📤 Sending trip data to API:",
        JSON.stringify(tripData, null, 2)
      );

      const isEditing = !!existingTrip;
      const url = isEditing ? `/api/trips/${existingTrip.id}` : "/api/trips";
      const method = isEditing ? "PUT" : "POST";

      console.log(" Making API call to:", url, "with method:", method);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tripData),
      });

      console.log("📥 API response status:", response.status);
      console.log(
        "📥 API response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ API error response:", error);
        throw new Error(
          error.message || `Failed to ${isEditing ? "update" : "create"} trip`
        );
      }

      const result = await response.json();
      console.log("✅ API success result:", result);
      
      // Add to store (result is the trip directly, not wrapped)
      if (!isEditing) {
        addTrip({
          id:
            result.display_id?.toString() || result.id?.toString() || "unknown",
          name: result.name,
          description: result.description,
          start_date: result.start_date,
          end_date: result.end_date,
          status: result.status,
          cover_image: result.cover_image,
          is_public: result.is_public,
          user_id: result.user_id,
          created_at: result.created_at,
          updated_at: result.updated_at,
        });
      }

      // Calculate and show the auto-detected status
      const now = new Date();
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      let autoStatus = "planning";
      let statusIcon = "📋";
      let statusMessage = "Trip is in planning phase";
      
      if (now >= startDate && now <= endDate) {
        autoStatus = "active";
        statusIcon = "🌍";
        statusMessage = "Your adventure is active!";
      } else if (now > endDate) {
        autoStatus = "completed";
        statusIcon = "🏆";
        statusMessage = "Trip completed";
      }

      toast({
        title: `   Trip ${isEditing ? "updated" : "created"} successfully!`,
        description: "Your adventure is ready to begin!",
        duration: 5000,
      });

      console.log("🔄 Redirecting to trip details...");

      // Redirect to trip details
      const redirectId = result.display_id || result.id || existingTrip?.id;
      console.log("🎯 Redirect ID:", redirectId);

      if (redirectId) {
        router.push(`/trips/${redirectId}`);
      } else {
        console.error("❌ No valid ID for redirect");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("💥 Error in onSubmit:", error);
      const isEditing = !!existingTrip;
      toast({
        title: `Failed to ${isEditing ? "update" : "create"} trip`,
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      console.log("🏁 === FORM SUBMISSION ENDED ===");
    }
  };

  // Add this debug section before the form
  {
    process.env.NODE_ENV === "development" && (
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">
          🔍 Debug Info (Development Only)
        </h3>
        <div className="text-xs text-yellow-700 space-y-1">
          <p>Form Progress: {formProgress}%</p>
          <p>
            Destinations: {selectedDestinations.length} -{" "}
            {selectedDestinations.join(", ") || "None"}
          </p>
          <p>Itinerary Days: {itineraryDays.length}</p>
          <p>Total Budget: ${totalEstimatedBudget}</p>
          <p>Form Valid: {Object.keys(errors).length === 0 ? "✅" : "❌"}</p>
          <p>Current Tab: {currentTab}</p>
          <p>Is Submitting: {isSubmitting ? "Yes" : "No"}</p>
          <p>Cover Image: {coverImage ? "Set" : "Not set"}</p>

          {Object.keys(errors).length > 0 && (
            <div>
              <p className="font-medium">Validation Errors:</p>
              <ul className="list-disc list-inside ml-2">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>
                    {field}: {error?.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-2 p-2 bg-yellow-100 rounded">
            <p className="font-medium">Required Fields Status:</p>
            <ul className="list-disc list-inside ml-2">
              <li>Name: {watch("name") ? "✅" : "❌"}</li>
              <li>Start Date: {watch("startDate") ? "✅" : "❌"}</li>
              <li>End Date: {watch("endDate") ? "✅" : "❌"}</li>
              <li>
                Destinations: {selectedDestinations.length > 0 ? "✅" : "❌"}
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  {
    /* Test Form Submission Button */
  }
  {
    process.env.NODE_ENV === "development" && (
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          🧪 Test Form Submission
        </h3>
        <Button
          type="button"
          onClick={() => {
            console.log("🧪 Testing form submission...");
            console.log("Form data:", watch());
            console.log("Errors:", errors);
            console.log("Selected destinations:", selectedDestinations);
            console.log("Itinerary days:", itineraryDays);

            // Test the form validation
            const formData = {
              name: watch("name") || "Test Trip",
              description: watch("description") || "Test Description",
              destinations:
                selectedDestinations.length > 0
                  ? selectedDestinations
                  : ["Test City"],
              startDate:
                watch("startDate") || new Date().toISOString().split("T")[0],
              endDate:
                watch("endDate") ||
                new Date(Date.now() + 86400000).toISOString().split("T")[0],
              totalBudget: totalEstimatedBudget || 100,
              currency: "USD",
              status: "planning",
              isPublic: false,
              itinerary: itineraryDays || [],
            };

            console.log("Test form data:", formData);

            // Test API call
            fetch("/api/trips", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formData),
            })
              .then((response) => {
                console.log("Test API response status:", response.status);
                return response.json();
              })
              .then((data) => {
                console.log("Test API response data:", data);
              })
              .catch((error) => {
                console.error("Test API error:", error);
              });
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
        >
          Test API Call
        </Button>
      </div>
    );
  }

  <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
    {/* ... existing form content ... */}
  </form>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-10">
      <div className="max-w-6xl mx-auto relative">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Sparkles className="w-8 h-8 text-emerald-500 animate-pulse" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Trip Builder
                </h2>
                <p className="text-slate-600">
                  {formProgress < 25
                    ? "Let's start your adventure! 🌟"
                    : formProgress < 50
                    ? "Looking good! Keep going! 🚀"
                    : formProgress < 75
                    ? "Almost there! You're doing great! ⭐"
                    : formProgress < 100
                    ? "Final stretch! So close! 🎯"
                    : "Perfect! Ready to launch! 🎉"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text">
                {formProgress}%
              </div>
              <p className="text-slate-600 text-sm">Complete</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <Progress 
              value={formProgress} 
              className="h-3 bg-gray-200 border border-gray-300"
            />
            <div
              className="absolute top-0 left-0 h-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${formProgress}%` }}
            >
              <div className="absolute right-0 top-0 h-3 w-6 bg-gradient-to-r from-transparent to-white/30 animate-pulse"></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs
            value={currentTab}
            onValueChange={setCurrentTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 mb-8 bg-white border-gray-200 shadow-sm rounded-lg p-0 gap-0">
              <TabsTrigger 
                value="basic" 
                className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:font-semibold data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-white relative rounded-none border-r border-gray-200 transition-all duration-200 first:rounded-l-lg last:rounded-r-lg"
              >
                <span className="text-2xl mr-2">{stepEmojis.basic}</span>
                Basic Details
                {formProgress >= 25 && (
                  <CheckCircle className="w-4 h-4 ml-2 text-emerald-500" />
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="itinerary" 
                className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:font-semibold data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-white relative rounded-none border-r border-gray-200 transition-all duration-200 first:rounded-l-lg last:rounded-r-lg"
              >
                <span className="text-2xl mr-2">{stepEmojis.itinerary}</span>
                Itinerary
                {formProgress >= 55 && (
                  <CheckCircle className="w-4 h-4 ml-2 text-emerald-500" />
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="budget" 
                className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:font-semibold data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-white relative rounded-none border-r border-gray-200 transition-all duration-200 first:rounded-l-lg last:rounded-r-lg"
              >
                <span className="text-2xl mr-2">{stepEmojis.budget}</span>
                Budget
                {formProgress >= 75 && (
                  <CheckCircle className="w-4 h-4 ml-2 text-emerald-500" />
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="review" 
                className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:font-semibold data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-white relative rounded-none border-r border-gray-200 transition-all duration-200 first:rounded-l-lg last:rounded-r-lg"
              >
                <span className="text-2xl mr-2">{stepEmojis.review}</span>
                Review
                {formProgress === 100 && (
                  <div className="flex items-center ml-2">
                    <Trophy className="w-4 h-4 text-emerald-500 animate-bounce" />
                    <Sparkles className="w-3 h-3 text-emerald-500 animate-pulse ml-1" />
                  </div>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Basic Trip Details */}
            <TabsContent value="basic" className="space-y-6">
              <Card className="bg-white border-gray-200 shadow-md">
                <CardHeader>
                  <CardTitle className="text-slate-900 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
                    Basic Trip Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Trip Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-800">
                      Trip Name *
                    </Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="e.g., Goa Beach Trip, Manali Trek"
                      className="bg-white border-gray-300 text-slate-900"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-slate-800">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      {...register("description")}
                      placeholder="Describe your trip..."
                      rows={3}
                      className="bg-white border-gray-300 text-slate-900"
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm">
                        {errors.description.message}
                      </p>
                    )}
                  </div>

                  {/* Destinations (with Leaflet/Nominatim autocomplete) */}
                  <div className="space-y-2">
                    <Label className="text-slate-800">Destinations *</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedDestinations.map((dest, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-emerald-600 text-white"
                        >
                          {dest}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = selectedDestinations.filter(
                                (_, i) => i !== index
                              );
                              setSelectedDestinations(updated);
                              setValue("destinations", updated);
                            }}
                            className="ml-2 text-white hover:text-red-300"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="relative">
                    <Input
                        placeholder="Search for cities, places, landmarks... (powered by OpenStreetMap)"
                        value={destinationQuery}
                        onChange={(e) => setDestinationQuery(e.target.value)}
                      onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (destinationSuggestions.length > 0) {
                              handleSelectDestinationSuggestion(destinationSuggestions[0]);
                          }
                        }
                      }}
                      className="bg-white border-gray-300 text-slate-900"
                    />

                      {/* Hybrid suggestions: Database + Geocoding */}
                      {destinationSuggestions.length > 0 && (
                        <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-60 overflow-auto">
                          {destinationSuggestions.map((suggestion, index) => {
                            const displayName =
                              suggestion.display_name ||
                              suggestion.name ||
                              suggestion.displayName ||
                              "Unknown Location";
                            const country =
                              suggestion.address?.country ||
                              suggestion.country ||
                              "Unknown Country";
                            const type = suggestion.type || "place";
                            const source = suggestion.source || "database";
                            const popularity = suggestion.popularity_score || 0;
                            const costIndex = suggestion.cost_index || 50;

                            return (
                              <button
                                key={index}
                                type="button"
                                onClick={() => handleSelectDestinationSuggestion(suggestion)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-gray-50 focus:outline-none"
                              >
                                <div className="flex items-start space-x-3">
                                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {displayName}
                                      </p>
                                      <div className="flex items-center space-x-1 ml-2">
                                        {source === 'geocoding' && (
                                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                            🌍 Live
                                          </span>
                                        )}
                                        {source === 'database' && popularity > 0 && (
                                          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                            ⭐ {popularity}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2 mt-1">
                                      {country && (
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                          {country}
                                        </span>
                                      )}
                                      <span className="text-xs text-gray-400 capitalize">
                                        {type}
                                      </span>
                                      {source === 'database' && costIndex && (
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                          costIndex <= 30 ? 'text-green-600 bg-green-50' :
                                          costIndex <= 60 ? 'text-yellow-600 bg-yellow-50' :
                                          'text-red-600 bg-red-50'
                                        }`}>
                                          ${costIndex <= 30 ? 'Budget' : costIndex <= 60 ? 'Mid' : 'Premium'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2 text-xs text-slate-500">
                      💡 Tip: Type to search real places from OpenStreetMap
                      database
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="text-slate-800">
                        Start Date *
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        {...register("startDate")}
                        className="bg-white border-gray-300 text-slate-900"
                      />
                      {errors.startDate && (
                        <p className="text-red-500 text-sm">
                          {errors.startDate.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="text-slate-800">
                        End Date *
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        {...register("endDate")}
                        className="bg-white border-gray-300 text-slate-900"
                      />
                      {errors.endDate && (
                        <p className="text-red-500 text-sm">
                          {errors.endDate.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Cover Image Upload */}
                  <div className="space-y-2">
                    <Label className="text-slate-800">Cover Image</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      {coverImage ? (
                        <div className="relative">
                          <Image
                            src={coverImage}
                            alt="Trip cover"
                            width={200}
                            height={120}
                            className="rounded-lg object-cover mx-auto"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setCoverImage("")}
                            className="absolute top-2 right-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="mt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading}
                              className="border-gray-300 text-slate-700 hover:bg-gray-50"
                            >
                              {isUploading
                                ? "Uploading..."
                                : "Upload Cover Image"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Privacy Settings */}
                  <div className="space-y-2">
                    <Label className="text-slate-800">Privacy Settings</Label>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg ring-1 ring-gray-200">
                      <Switch
                        id="isPublic"
                        onCheckedChange={(checked) =>
                          setValue("isPublic", checked)
                        }
                      />
                      <Label htmlFor="isPublic" className="text-slate-700">
                        Make trip public (others can view your itinerary)
                      </Label>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => {
                        generateItineraryDays();
                        setCurrentTab("itinerary");
                        toast({
                          title: "🎉 Great start!",
                          description:
                            "Your trip foundation is set! Let's build that itinerary!",
                        });
                      }}
                      className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold px-6 py-3 rounded-lg transform transition-all duration-200 hover:scale-105 shadow-lg"
                      disabled={
                        !watchedStartDate ||
                        !watchedEndDate ||
                        selectedDestinations.length === 0
                      }
                    >
                      <Rocket className="w-4 h-4 mr-2" />
                      Continue to Itinerary
                      <Sparkles className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Itinerary Builder */}
            <TabsContent value="itinerary" className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Target className="w-8 h-8 text-emerald-500 animate-pulse" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      Day-by-Day Itinerary
                    </h3>
                    <p className="text-slate-600">
                      {itineraryDays.length === 0 
                        ? "Let's plan your perfect days! ✨"
                        : `${itineraryDays.length} amazing ${
                            itineraryDays.length === 1 ? "day" : "days"
                          } planned! 🗓️`}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    addItineraryDay();
                    toast({
                      title: "🎯 New day added!",
                      description: "Another day of adventure awaits planning!",
                    });
                  }}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold px-4 py-2 rounded-lg transform transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Day
                  <Zap className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* AI Suggestions Drawer */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white">AI Suggestions</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      onClick={fetchAISuggestions}
                      disabled={isLoadingAI}
                    >
                      {isLoadingAI ? "Loading…" : "Get Suggestions"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-white font-medium mb-2">
                          Untimed suggestions
                        </h4>
                        {aiSuggestions.length === 0 ? (
                          <p className="text-gray-400 text-sm">
                            Click Get Suggestions.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {aiSuggestions.map((s, i) => (
                              <SuggestionCard
                                key={`sugg-${i}`}
                                suggestion={s}
                                index={i}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-white font-medium mb-2">
                          Timed day plan
                        </h4>
                        {aiSchedule.length === 0 ? (
                          <p className="text-gray-400 text-sm">
                            Will appear if the model returns schedule.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {aiSchedule.map((s, i) => (
                              <div
                                key={`sched-${i}`}
                                className="p-3 bg-gray-800 rounded border border-gray-700 flex items-center justify-between"
                              >
                                <div>
                                  <p className="text-white text-sm">
                                    Day {s.dayNumber} •{" "}
                                    {s.startTime?.slice(0, 5) || "09:00"} •{" "}
                                    {s.name}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {s.category || "general"}{" "}
                                    {s.price_range ? `• ${s.price_range}` : ""}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                      const day =
                                        itineraryDays.find(
                                          (d) => d.dayNumber === s.dayNumber
                                        ) || itineraryDays[0];
                                      if (!day) return;
                                      const slots = computeAvailableSlots(
                                        day,
                                        s.duration_hours || 2
                                      );
                                      // preselect the suggested time if available, otherwise show slots
                                      setTimeDialog({
                                        open: true,
                                        dayId: day.id,
                                        suggestion: { ...s },
                                        slots,
                                      });
                                    }}
                                  >
                                    Add
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <DragOverlay>
                      {activeDragId && dragSuggestion ? (
                        <div className="p-3 bg-gray-800 rounded border border-gray-700 opacity-80">
                          <p className="text-white font-medium text-sm">
                            {dragSuggestion.name}
                          </p>
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </CardContent>
              </Card>

              {itineraryDays.map((day, index) => (
                <Card
                  key={day.id}
                  className="bg-white border-gray-200 shadow-md"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-slate-900 flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
                        {day.title}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="secondary"
                          className="bg-emerald-100 text-emerald-700"
                        >
                          {
                            ACTIVITY_TYPES.find(
                              (type) => type.value === day.activityType
                            )?.icon
                          }{" "}
                          {day.activityType}
                        </Badge>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItineraryDay(day.id)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-800">Date</Label>
                        <Input
                          type="date"
                          value={day.date}
                          onChange={(e) =>
                            updateItineraryDay(day.id, { date: e.target.value })
                          }
                          className="bg-white border-gray-300 text-slate-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-800">Activity Type</Label>
                        <Select
                          value={day.activityType}
                          onValueChange={(value: any) =>
                            updateItineraryDay(day.id, { activityType: value })
                          }
                        >
                          <SelectTrigger className="bg-white border-gray-300 text-slate-900">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-200">
                            {ACTIVITY_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.icon} {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-slate-800">Location</Label>
                      <Input
                        value={day.location.name}
                        onChange={(e) =>
                          updateItineraryDay(day.id, {
                            location: { ...day.location, name: e.target.value },
                          })
                        }
                        placeholder="Where will you be?"
                        className="bg-white border-gray-300 text-slate-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-800">Description</Label>
                      <Textarea
                        value={day.description}
                        onChange={(e) =>
                          updateItineraryDay(day.id, {
                            description: e.target.value,
                          })
                        }
                        placeholder="What will you do on this day?"
                        rows={3}
                        className="bg-white border-gray-300 text-slate-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-800">Estimated Budget</Label>
                      <Input
                        type="number"
                        value={day.budget.estimated}
                        onChange={(e) =>
                          updateItineraryDay(day.id, {
                            budget: {
                              ...day.budget,
                              estimated: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        placeholder="0"
                        className="bg-white border-gray-300 text-slate-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-800">Notes</Label>
                      <Textarea
                        value={day.notes || ""}
                        onChange={(e) =>
                          updateItineraryDay(day.id, { notes: e.target.value })
                        }
                        placeholder="Any additional notes..."
                        rows={2}
                        className="bg-white border-gray-300 text-slate-900"
                      />
                    </div>

                    {/* Time Slots Section */}
                    {/* <div className="space-y-3">
                      <Label className="text-slate-800 font-semibold">Daily Schedule</Label>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {day.timeSlots?.map((slot, slotIndex) => (
                            <TimeSlotDroppable
                              key={slot.id}
                              slot={slot}
                              dayId={day.id}
                              onRemoveActivity={(slotId) => {
                                const updatedDays = itineraryDays.map((d) => {
                                  if (d.id === day.id) {
                                    const updatedTimeSlots = d.timeSlots.map((s) => 
                                      s.id === slotId 
                                        ? { ...s, activity: undefined, isOccupied: false }
                                        : s
                                    );
                                    return { ...d, timeSlots: updatedTimeSlots };
                                  }
                                  return d;
                                });
                                setItineraryDays(updatedDays);
                                setValue("itinerary", updatedDays);
                              }}
                            />
                          ))}
                        </div>
                        <DragOverlay>
                          {activeDragId && dragSuggestion ? (
                            <div className="p-3 bg-gray-800 rounded border border-gray-700 opacity-80">
                              <p className="text-white font-medium text-sm">
                                {dragSuggestion.name}
                              </p>
                            </div>
                          ) : null}
                        </DragOverlay>
                      </DndContext>
                    </div> */}
                  </CardContent>
                </Card>
              ))}

              {itineraryDays.length === 0 && (
                <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 border-2 border-dashed">
                  <CardContent className="py-12 text-center">
                    <div className="relative">
                      <MapPin className="mx-auto h-16 w-16 text-gray-400 mb-4 animate-bounce" />
                      <div className="absolute -top-2 -right-2">
                        <Star className="w-6 h-6 text-emerald-500 animate-spin" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      Ready to Plan Your Adventure! 🗺️
                    </h3>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                      Your dates are set! Now let's create an amazing day-by-day
                      itinerary that'll make this trip unforgettable! ✨
                    </p>
                    <div className="space-y-3">
                      <Button
                        type="button"
                        onClick={() => {
                          generateItineraryDays();
                          toast({
                            title: "   Days generated!",
                            description:
                              "Your itinerary framework is ready for customization!",
                          });
                        }}
                        className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold px-6 py-3 rounded-lg transform transition-all duration-200 hover:scale-105 shadow-lg"
                        disabled={!watchedStartDate || !watchedEndDate}
                      >
                        <Rocket className="w-5 h-5 mr-2" />
                        Generate My Days!
                        <Sparkles className="w-5 h-5 ml-2" />
                      </Button>
                      <p className="text-slate-500 text-sm">
                        Or go back to set your travel dates first
                      </p>
                      <Button
                        type="button"
                        onClick={() => setCurrentTab("basic")}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-slate-700 hover:bg-gray-50"
                      >
                        ← Back to Dates
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between">
                <Button
                  type="button"
                  onClick={() => setCurrentTab("basic")}
                  variant="outline"
                  className="border-gray-300 text-slate-700 hover:bg-gray-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Basic Details
                </Button>
                <Button
                  type="button"
                  onClick={() => setCurrentTab("budget")}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={itineraryDays.length === 0}
                >
                  Continue to Budget
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              </div>
            </TabsContent>

            {/* Budget Overview */}
            <TabsContent value="budget" className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative">
                  <DollarSign className="w-8 h-8 text-emerald-500 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    Budget Overview
                  </h3>
                  <p className="text-slate-600">
                    Plan and track your trip expenses! 💰
                  </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-900">
                  Budget Breakdown by Day
                </h4>
                    <div className="space-y-2">
                      {itineraryDays.map((day) => (
                    <div
                      key={day.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-emerald-700">
                            {day.dayNumber}
                          </span>
                            </div>
                            <div>
                          <p className="font-medium text-slate-900">
                            {day.title}
                          </p>
                          <p className="text-sm text-slate-600">
                            {day.location.name}
                          </p>
                            </div>
                          </div>
                          <div className="text-right">
                        <p className="font-semibold text-slate-900">
                          ${day.budget.estimated}
                        </p>
                        <p className="text-xs text-slate-500">
                          {day.activityType}
                        </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-900">
                  Budget Categories
                </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {ACTIVITY_TYPES.map((type) => {
                        const categoryTotal = itineraryDays
                      .filter((day) => day.activityType === type.value)
                      .reduce((sum, day) => sum + day.budget.estimated, 0);
                        
                        return (
                      <div
                        key={type.value}
                        className="p-3 bg-gray-50 rounded-lg text-center"
                      >
                            <div className="text-2xl mb-1">{type.icon}</div>
                        <p className="text-sm font-medium text-slate-900">
                          {type.label}
                        </p>
                        <p className="text-lg font-bold text-emerald-600">
                          ${categoryTotal}
                        </p>
                          </div>
                    );
                      })}
                    </div>
                  </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  onClick={() => setCurrentTab("itinerary")}
                  variant="outline"
                  className="border-gray-300 text-slate-700 hover:bg-gray-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Itinerary
                </Button>
                <Button
                  type="button"
                  onClick={() => setCurrentTab("review")}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Review Trip
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              </div>
            </TabsContent>

            {/* Review & Submit */}
            <TabsContent value="review" className="space-y-6">
              <Card className="bg-white border-gray-200 shadow-md">
                <CardHeader>
                  <CardTitle className="text-slate-900">
                    Review Your Trip
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-600">Trip Name</Label>
                      <p className="text-slate-900 font-medium">
                        {watchedName || "Untitled Trip"}
                      </p>
                  </div>
                  <div>
                    <Label className="text-slate-600">Duration</Label>
                    <p className="text-slate-900 font-medium">
                        {itineraryDays.length}{" "}
                        {itineraryDays.length === 1 ? "day" : "days"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-600">Destinations</Label>
                    <p className="text-slate-900 font-medium">
                      {selectedDestinations.join(", ") || "No destinations"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-600">Total Budget</Label>
                    <p className="text-slate-900 font-medium">
                        ${totalEstimatedBudget.toLocaleString()}{" "}
                        {watch("currency")}
                    </p>
                  </div>
                </div>

                <Separator className="bg-gray-200" />

                <div>
                  <Label className="text-slate-600">Description</Label>
                    <p className="text-slate-900 font-medium">
                      {watch("description") || "No description"}
                    </p>
                </div>

                <div>
                  <Label className="text-slate-600">Itinerary Summary</Label>
                  <div className="mt-2 space-y-2">
                    {itineraryDays.map((day) => (
                        <div
                          key={day.id}
                          className="flex justify-between items-center p-2 bg-gray-50 rounded"
                        >
                        <span className="text-slate-900">{day.title}</span>
                          <Badge
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-700"
                          >
                          ${day.budget.estimated}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                </CardContent>
              </Card>

            <div className="flex justify-between">
              <Button
                type="button"
                onClick={() => setCurrentTab("budget")}
                variant="outline"
                  className="border-gray-300 text-slate-700 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Budget
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:shadow-lg text-base"
              >
                {isSubmitting ? (
                  <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      {existingTrip
                        ? "Updating Your Adventure..."
                        : "Creating Your Adventure..."}
                  </>
                ) : (
                  <>
                      <Trophy className="w-4 h-4 mr-2" />
                      {existingTrip ? "Update My Trip!" : "Launch My Trip!"}
                      <Rocket className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </form>

      {/* Time selection dialog for dropped/added suggestion */}
        <Dialog
          open={timeDialog.open}
          onOpenChange={(open) => setTimeDialog((prev) => ({ ...prev, open }))}
        >
          <DialogContent
            className="bg-gray-900 border-gray-700"
            aria-describedby="dialog-description"
          >
          <DialogHeader>
              <DialogTitle className="text-white">
                Select a start time
              </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
              <p id="dialog-description" className="text-gray-300 text-sm">
                Choose when you'd like to schedule "
                {timeDialog.suggestion?.name}" on your itinerary.
                {timeDialog.suggestion?.duration_hours && (
                  <span className="text-gray-400 ml-2">
                    Duration: {timeDialog.suggestion.duration_hours} hours
                  </span>
                )}
              </p>
            <div className="flex flex-wrap gap-2">
              {(timeDialog.slots || []).slice(0, 20).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      const s = timeDialog.suggestion || {};
                      addActivityToDay(timeDialog.dayId, s, t);
                      setTimeDialog({
                        open: false,
                        dayId: "",
                        suggestion: null,
                        slots: [],
                      });
                      toast({
                        title: " Activity Added!",
                        description: `${s.name} scheduled for ${t.slice(0, 5)}`,
                      });
                    }}
                  >
                    {t.slice(0, 5)}
                  </Button>
              ))}
            </div>
            {timeDialog.slots.length === 0 && (
                <p className="text-gray-400 text-sm">
                  No free slots available. Adjust existing items or day times.
                </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
