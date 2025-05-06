"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarIcon, Plus, Edit, Trash2, Clock, MapPin, Search } from "lucide-react"
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
import type { Appointment } from "@/lib/types"

// Declare mapboxgl as a global variable
declare global {
  interface Window {
    mapboxgl: any
  }
}

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
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const [mapError, setMapError] = useState(false)

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
    getUserLocation()
  }, [user])

  useEffect(() => {
    if (mapRef.current && userLocation && typeof window !== "undefined") {
      // Check if mapboxgl is already available
      if (window.mapboxgl) {
        initializeMap()
      } else {
        // If not available, set up a listener for when the script loads
        const checkMapboxLoaded = setInterval(() => {
          if (window.mapboxgl) {
            clearInterval(checkMapboxLoaded)
            initializeMap()
          }
        }, 100)

        // Clear interval after 10 seconds to prevent infinite checking
        setTimeout(() => clearInterval(checkMapboxLoaded), 10000)
      }
    }
  }, [userLocation, mapRef.current])

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Error getting location:", error)
          // Default to a central location if geolocation fails
          setUserLocation({
            latitude: 40.7128,
            longitude: -74.006,
          })
        },
      )
    }
  }

  const initializeMap = async () => {
    if (!mapRef.current || !userLocation || mapInstance.current) return

    // Wait for mapboxgl to be available
    if (typeof window === "undefined" || !window.mapboxgl) {
      console.log("Mapbox GL JS is not loaded yet, will retry")
      // Retry after a short delay
      setTimeout(initializeMap, 500)
      return
    }

    try {
      // @ts-ignore
      window.mapboxgl.accessToken =
        "pk.eyJ1IjoiYmlhaWEiLCJhIjoiY2xzMnRxZXJsMDFvMzJrcGR5ZWVxdWVrZSJ9.Wy_XCBMEGvktbfLVW0KXHA"

      // @ts-ignore
      mapInstance.current = new window.mapboxgl.Map({
        container: mapRef.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 12,
      })

      // Add user marker
      // @ts-ignore
      new window.mapboxgl.Marker({ color: "#ec4899" })
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(mapInstance.current)

      // Add navigation controls
      // @ts-ignore
      mapInstance.current.addControl(new window.mapboxgl.NavigationControl())
    } catch (error) {
      console.error("Error initializing map:", error)
      setMapError(true)
    }
  }

  const searchClinics = async () => {
    if (!userLocation) return

    setIsSearching(true)
    setSearchResults([])

    try {
      const query = searchQuery || "OBGYN clinic"
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?proximity=${userLocation.longitude},${userLocation.latitude}&types=poi&access_token=pk.eyJ1IjoiYmlhaWEiLCJhIjoiY2xzMnRxZXJsMDFvMzJrcGR5ZWVxdWVrZSJ9.Wy_XCBMEGvktbfLVW0KXHA`,
      )
      const data = await response.json()

      setSearchResults(data.features || [])

      // Update map with markers
      if (mapInstance.current) {
        // Remove existing markers except user location
        const markers = document.querySelectorAll(".mapboxgl-marker:not(:first-child)")
        markers.forEach((marker) => marker.remove())

        // Add markers for search results
        data.features.forEach((location: any) => {
          const popup = new window.mapboxgl.Popup({ offset: 25 }).setHTML(
            `<h3>${location.text}</h3><p>${location.place_name}</p>`,
          )

          // @ts-ignore
          new window.mapboxgl.Marker().setLngLat(location.center).setPopup(popup).addTo(mapInstance.current)
        })

        // Fit bounds to include all markers if there are results
        if (data.features.length > 0) {
          const bounds = new window.mapboxgl.LngLatBounds()
          bounds.extend([userLocation.longitude, userLocation.latitude])

          data.features.forEach((location: any) => {
            bounds.extend(location.center)
          })

          mapInstance.current.fitBounds(bounds, {
            padding: 50,
            maxZoom: 15,
          })
        }
      }
    } catch (error) {
      console.error("Error searching for clinics:", error)
    } finally {
      setIsSearching(false)
    }
  }

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
              <CardTitle>Find OBGYN Clinics & Hospitals</CardTitle>
              <CardDescription>Locate healthcare facilities near you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Search for OBGYN clinics, hospitals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={searchClinics} disabled={isSearching}>
                  {isSearching ? "Searching..." : "Search"}
                  <Search className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {/* Map container */}
              {mapError ? (
                <div className="w-full h-[400px] rounded-md bg-muted mb-4 flex items-center justify-center flex-col p-4">
                  <p className="text-center mb-2">
                    Unable to load the map. Please check your internet connection and try again.
                  </p>
                  <Button
                    onClick={() => {
                      setMapError(false)
                      initializeMap()
                    }}
                  >
                    Retry Loading Map
                  </Button>
                </div>
              ) : (
                <div ref={mapRef} className="w-full h-[400px] rounded-md bg-muted mb-4"></div>
              )}

              {/* Search results */}
              <div className="space-y-3 mt-4">
                <h3 className="font-medium">Search Results</h3>
                {searchResults.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <div key={index} className="border rounded-md p-3">
                        <h4 className="font-medium">{result.text}</h4>
                        <p className="text-sm text-muted-foreground">{result.place_name}</p>
                        <div className="flex items-center mt-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mr-1" />
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${result.center[1]},${result.center[0]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            Get Directions
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    {isSearching ? "Searching..." : "Search for clinics or hospitals to see results"}
                  </p>
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
