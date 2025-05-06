"use client"

import { useState, useEffect } from "react"
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarIcon, Plus, Edit, Trash2, Clock, MapPin, Search, Phone, Globe } from "lucide-react"
import { format, compareAsc, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import type { Appointment } from "@/lib/types"


interface Clinic {
  fsq_id: string;
  name: string;
  location: {
    address: string;
    locality: string;
    region: string;
    postcode: string;
    country: string;
    formatted_address: string;
  };
  tel?: string;
  website?: string;
  categories: {
    id: number;
    name: string;
  }[];
  rating?: number;
}

const popularClinics = [
  {
    id: 1,
    name: 'Example Clinic',
    address: '123 Clinic St',
    phone: '123-456-7890',
    website: 'http://example.com',
    specialties: ['OBGYN'],
    rating: 4.5,
  },
  // More clinics...
];
export default function AppointmentsPage() {
  const { user } = useSupabaseAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [title, setTitle] = useState("")
  const [date, setDate] = useState<Date>(new Date())
  const [time, setTime] = useState("09:00")
  const [notes, setNotes] = useState("")
  const [reminder, setReminder] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [locationInput, setLocationInput] = useState("");
  const [suggestions, setSuggestions] = useState<{ place_name: string }[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "15039", // Default: OB-GYN
  ]);
  
  const categoryOptions = [
    { id: "15039", name: "Obstetrician Gynecologist (Ob-gyn)" },
    { id: "15056", name: "Women's Health Clinic" },
    { id: "15014", name: "Hospital" },
    { id: "15059", name: "Hospital Unit" },
    { id: "15008", name: "Emergency Service" },
    { id: "15015", name: "Maternity Clinic" },
    { id: "15019", name: "Mental Health Clinic" },
  ];

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (locationInput.trim().length >= 2) {
        setIsFetchingSuggestions(true);
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationInput)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&autocomplete=true&limit=5`)
          .then(res => res.json())
          .then(data => {
            const places = data.features.map((feature: any) => ({
              place_name: feature.place_name,
            }));
            setSuggestions(places);
          })
          .catch(() => setSuggestions([]))
          .finally(() => setIsFetchingSuggestions(false));
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [locationInput]);

  // Group appointments by date for calendar view
  const appointmentsByDate: Record<string, Appointment[]> = {}
  appointments.forEach((appointment) => {
    const dateStr = appointment.date
    if (!appointmentsByDate[dateStr]) {
      appointmentsByDate[dateStr] = []
    }
    appointmentsByDate[dateStr].push(appointment)
  })

  // Sort appointments by date (closest first)
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = parseISO(a.date)
    const dateB = parseISO(b.date)
    return compareAsc(dateA, dateB)
  })

  // Get upcoming appointments (today and future)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcomingAppointments = sortedAppointments.filter((appointment) => {
    const appointmentDate = parseISO(appointment.date)
    return appointmentDate >= today
  })

  // Get past appointments
  const pastAppointments = sortedAppointments.filter((appointment) => {
    const appointmentDate = parseISO(appointment.date)
    return appointmentDate < today
  })

  useEffect(() => {
    fetchAppointments()
  }, [user])

  const fetchAppointments = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true })

      if (error) throw error

      setAppointments(data as Appointment[])
    } catch (error: any) {
      console.error("Error fetching appointments:", error.message)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDate(new Date())
    setTime("09:00")
    setNotes("")
    setReminder(true)
    setEditingAppointment(null)
  }

  const handleOpenDialog = (appointment?: Appointment) => {
    if (appointment) {
      setTitle(appointment.title)
      setDate(new Date(appointment.date))
      setTime(appointment.time)
      setNotes(appointment.notes || "")
      setReminder(appointment.reminder)
      setEditingAppointment(appointment)
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError("You must be logged in to create an appointment")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (editingAppointment) {
        // Update existing appointment
        const { error } = await supabase
          .from("appointments")
          .update({
            title,
            date: format(date, "yyyy-MM-dd"),
            time,
            notes,
            reminder,
          })
          .eq("id", editingAppointment.id)

        if (error) throw error

        setSuccess("Appointment updated successfully")
      } else {
        // Create new appointment
        const { error } = await supabase.from("appointments").insert({
          user_id: user.id,
          title,
          date: format(date, "yyyy-MM-dd"),
          time,
          notes,
          reminder,
        })

        if (error) throw error

        setSuccess("Appointment created successfully")
      }

      fetchAppointments()
      handleCloseDialog()
    } catch (error: any) {
      setError(error.message || "Failed to save appointment")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("appointments").delete().eq("id", id)

      if (error) throw error

      setAppointments(appointments.filter((appointment) => appointment.id !== id))
      setDeleteConfirmId(null)
    } catch (error: any) {
      console.error("Error deleting appointment:", error.message)
    }
  }

  const searchOBGYNClinics = async () => {
    setIsSearching(true);
    setError(null);
    setClinics([]); 
    setSuggestions([]); // This hides the dropdown
  
    try {
      // Step 1: Geocode with Mapbox
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
      const geoResponse = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationInput)}.json?access_token=${mapboxToken}`
      );
  
      if (!geoResponse.ok) {
        throw new Error('Failed to geocode location');
      }
  
      const geoData = await geoResponse.json();
      const coordinates = geoData.features?.[0]?.center;
  
      if (!coordinates) {
        throw new Error('Location not found');
      }
  
      const [longitude, latitude] = coordinates;
      // Include both OBGYN and hospital category IDs
      const categories = selectedCategories.join(',');
      const radius = 5000; // 5km
      const limit = 10;
  
      // Step 2: Search with Foursquare using lat/lng
      const foursquareKey = process.env.NEXT_PUBLIC_FOURSQUARE_API_KEY || '';
      const searchResponse = await fetch(
        `https://api.foursquare.com/v3/places/search?ll=${latitude},${longitude}&categories=${categories}&radius=${radius}&limit=${limit}`,
        {
          headers: {
            'Authorization': foursquareKey,
            'Accept': 'application/json'
          }
        }
      );
  
      if (!searchResponse.ok) {
        throw new Error('Failed to search for clinics');
      }
  
      const searchData = await searchResponse.json();
  
      // Map through the search results to extract necessary data
      const mappedClinics = searchData.results.map((clinic: any) => ({
        fsq_id: clinic.fsq_id, // Ensure fsq_id is set
        name: clinic.name,
        location: {
          address: clinic.location.formatted_address,
          locality: clinic.location.locality || '',
          region: clinic.location.region || '',
          postcode: clinic.location.postcode || '',
          country: clinic.location.country || '',
          formatted_address: clinic.location.formatted_address,
          lat: clinic.geocodes?.main?.latitude, // Extract lat from geocodes.main
          lng: clinic.geocodes?.main?.longitude, // Extract lng from geocodes.main
        },
        categories: clinic.categories.map((category: any) => ({
          id: category.id, // Ensure categories have the correct structure
          name: category.name,
        })),
        tel: clinic.contact?.formatted_phone || '', // Add fallback for phone number
        website: clinic.url || '', // Add fallback for website
        rating: clinic.rating || 0, // Add fallback for rating
      }));
  
      setClinics(mappedClinics); // Update the state with the mapped clinics
    } catch (error: any) {
      setError(error.message);
      setClinics([]); // Clear the clinics on error
    } finally {
      setIsSearching(false);
    }
  };
  

  // Get appointments for the selected date
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd")
  const appointmentsForSelectedDate = appointmentsByDate[selectedDateStr] || []

  // Get dates with appointments for highlighting in the calendar
  const datesWithAppointments = Object.keys(appointmentsByDate).map((dateStr) => new Date(dateStr))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Appointments</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> New Appointment
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="find">Find Clinics</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>Your scheduled appointments</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-start justify-between rounded-md border p-4">
                        <div>
                          <div className="flex items-center">
                            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {format(parseISO(appointment.date), "MMMM d, yyyy")}
                            </span>
                            <Clock className="ml-4 mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{appointment.time}</span>
                          </div>
                          <h3 className="mt-1 font-medium">{appointment.title}</h3>
                          {appointment.notes && (
                            <p className="mt-1 text-sm text-muted-foreground">{appointment.notes}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(appointment)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteConfirmId(appointment.id)}
                            disabled={deleteConfirmId !== null}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-6 text-muted-foreground">No upcoming appointments scheduled.</p>
                )}
              </CardContent>
            </Card>

            {pastAppointments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Past Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pastAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-start justify-between rounded-md border p-4 opacity-70"
                      >
                        <div>
                          <div className="flex items-center">
                            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {format(parseISO(appointment.date), "MMMM d, yyyy")}
                            </span>
                            <Clock className="ml-4 mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{appointment.time}</span>
                          </div>
                          <h3 className="mt-1 font-medium">{appointment.title}</h3>
                          {appointment.notes && (
                            <p className="mt-1 text-sm text-muted-foreground">{appointment.notes}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(appointment)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteConfirmId(appointment.id)}
                            disabled={deleteConfirmId !== null}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Calendar View */}
            <Card>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>Select a date to view appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                  modifiers={{
                    appointment: datesWithAppointments,
                  }}
                  modifiersStyles={{
                    appointment: {
                      fontWeight: "bold",
                      backgroundColor: "rgba(236, 72, 153, 0.1)",
                      borderRadius: "0",
                    },
                  }}
                />
              </CardContent>
            </Card>

            {/* Appointments for Selected Date */}
            <Card>
              <CardHeader>
                <CardTitle>{format(selectedDate, "MMMM d, yyyy")}</CardTitle>
                <CardDescription>
                  {appointmentsForSelectedDate.length === 0
                    ? "No appointments scheduled"
                    : `${appointmentsForSelectedDate.length} appointment(s) scheduled`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointmentsForSelectedDate.length > 0 ? (
                  <div className="space-y-4">
                    {appointmentsForSelectedDate.map((appointment) => (
                      <div key={appointment.id} className="flex items-start justify-between rounded-md border p-4">
                        <div>
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{appointment.time}</span>
                          </div>
                          <h3 className="mt-1 font-medium">{appointment.title}</h3>
                          {appointment.notes && (
                            <p className="mt-1 text-sm text-muted-foreground">{appointment.notes}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(appointment)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteConfirmId(appointment.id)}
                            disabled={deleteConfirmId !== null}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No appointments for this date.</p>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={() => handleOpenDialog()} className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> Add Appointment
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="find">
  <Card className="mb-6">
    <CardHeader>
      <CardTitle>Find OBGYN Clinics</CardTitle>
      <CardDescription>Discover nearby OBGYN clinics and hospitals</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Enter a location (e.g. city, address)"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-50 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-60 overflow-auto">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="p-3 hover:bg-gray-200 cursor-pointer transition-colors"
                    onClick={() => {
                      setLocationInput(suggestion.place_name);
                      setSuggestions([]);
                    }}
                  >
                    {suggestion.place_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button
            onClick={searchOBGYNClinics}
            disabled={isSearching || !locationInput.trim()}
            className="w-auto p-3 bg-primary text-white rounded-lg"
          >
            {isSearching ? "Searching..." : "Search"}
            <Search className="ml-2 h-4 w-4" />
          </Button>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
      <div>
  <h4 className="font-medium mb-2">Include Categories:</h4>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
    {categoryOptions.map((category) => (
      <label key={category.id} className="flex items-center gap-2">
        <input
          type="checkbox"
          value={category.id}
          checked={selectedCategories.includes(category.id)}
          onChange={(e) => {
            const id = e.target.value;
            setSelectedCategories((prev) =>
              e.target.checked
                ? [...prev, id]
                : prev.filter((catId) => catId !== id)
            );
          }}
        />
        <span className="text-sm">{category.name}</span>
      </label>
    ))}
  </div>
</div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">
          {locationInput ? "Nearby OBGYN Clinics" : "Enter a location to find clinics"}
        </h3>

        {isSearching ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Searching for OBGYN clinics...</p>
          </div>
        ) : clinics.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {clinics.map((clinic) => (
              <Card key={clinic.fsq_id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{clinic.name}</CardTitle>
                  <CardDescription className="flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    {clinic.location.formatted_address || `${clinic.location.address}, ${clinic.location.locality}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex flex-wrap gap-1 mb-3">
                    {clinic.categories.map((category) => (
                      <Badge key={category.id} variant="secondary" className="text-xs">
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                  <div className="space-y-1 text-sm">
                    {clinic.tel && (
                      <div className="flex items-center">
                        <Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                        <a href={`tel:${clinic.tel}`} className="hover:underline">
                          {clinic.tel}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const { lat, lng } = clinic.location; // Assuming clinic has lat and lng fields
                  const locationUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                  window.open(locationUrl, '_blank');
                }}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Get Directions
              </Button>

                </CardFooter>
              </Card>
            ))}
          </div>
        ) : locationInput ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No OBGYN clinics found in this area.</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Please enter a location to search for OBGYN clinics.</p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
</TabsContent>


      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this appointment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmId) {
                  handleDelete(deleteConfirmId)
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingAppointment ? "Edit Appointment" : "New Appointment"}</DialogTitle>
            <DialogDescription>Create or edit an appointment.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Alert variant="destructive" className={cn("mb-4", error ? "block" : "hidden")}>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Alert className={cn("mb-4", success ? "block" : "hidden")}>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 flex justify-start text-left font-normal",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time
              </Label>
              <Input
                type="time"
                id="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right mt-2">
                Notes
              </Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reminder" className="text-right">
                Reminder
              </Label>
              <Switch id="reminder" checked={reminder} onCheckedChange={setReminder} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
              {editingAppointment ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

