"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarIcon, Plus, Edit, Trash2 } from "lucide-react"
import { format } from "date-fns"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { JournalEntry } from "@/lib/types"

export default function JournalPage() {
  const { user } = useSupabaseAuth()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [moodType, setMoodType] = useState<"positive" | "negative" | "neutral">("neutral")
  const [moodScore, setMoodScore] = useState<number>(5)
  const [date, setDate] = useState<Date>(new Date())
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => {
    fetchEntries()
  }, [user])

  const fetchEntries = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })

      if (error) throw error

      setEntries(data as JournalEntry[])
    } catch (error: any) {
      console.error("Error fetching journal entries:", error.message)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setMoodType("neutral")
    setMoodScore(5)
    setDate(new Date())
    setEditingEntry(null)
  }

  const handleOpenDialog = (entry?: JournalEntry) => {
    if (entry) {
      setTitle(entry.title)
      setDescription(entry.description)
      setMoodType(entry.mood_type)
      setMoodScore(entry.mood_score)
      setDate(new Date(entry.date))
      setEditingEntry(entry)
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
      setError("You must be logged in to create a journal entry")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (editingEntry) {
        // Update existing entry
        const { error } = await supabase
          .from("journal_entries")
          .update({
            title,
            description,
            mood_type: moodType,
            mood_score: moodScore,
            date: format(date, "yyyy-MM-dd"),
          })
          .eq("id", editingEntry.id)

        if (error) throw error

        setSuccess("Journal entry updated successfully")
      } else {
        // Create new entry
        const { error } = await supabase.from("journal_entries").insert({
          user_id: user.id,
          title,
          description,
          mood_type: moodType,
          mood_score: moodScore,
          date: format(date, "yyyy-MM-dd"),
        })

        if (error) throw error

        setSuccess("Journal entry created successfully")
      }

      fetchEntries()
      handleCloseDialog()
    } catch (error: any) {
      setError(error.message || "Failed to save journal entry")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("journal_entries").delete().eq("id", id)

      if (error) throw error

      setEntries(entries.filter((entry) => entry.id !== id))
      setDeleteConfirmId(null)
    } catch (error: any) {
      console.error("Error deleting journal entry:", error.message)
    }
  }

  // Prepare data for mood chart
  const chartData = entries
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((entry) => ({
      date: format(new Date(entry.date), "MMM dd"),
      score: entry.mood_score,
      mood: entry.mood_type,
    }))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pregnancy Journal</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> New Entry
        </Button>
      </div>

      {/* Mood Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Mood Tracking</CardTitle>
          <CardDescription>Your mood over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip
                    formatter={(value, name) => [`Score: ${value}`, "Mood"]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={{
                      stroke: "#ec4899",
                      strokeWidth: 2,
                      r: 4,
                      fill: "white",
                    }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No journal entries yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Journal Entries */}
      <div className="space-y-4">
        {entries.length > 0 ? (
          entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>{entry.title}</CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(entry)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(entry.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>{format(new Date(entry.date), "MMMM d, yyyy")}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{entry.description}</p>
                <div className="mt-4 flex items-center space-x-2">
                  <span className="text-sm font-medium">Mood:</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-1 text-xs",
                      entry.mood_type === "positive" &&
                        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
                      entry.mood_type === "negative" && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
                      entry.mood_type === "neutral" && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
                    )}
                  >
                    {entry.mood_type.charAt(0).toUpperCase() + entry.mood_type.slice(1)} ({entry.mood_score}/10)
                  </span>
                </div>
              </CardContent>
              {deleteConfirmId === entry.id && (
                <CardFooter className="border-t bg-muted/50 px-6 py-4">
                  <div className="flex w-full items-center justify-between">
                    <p className="text-sm font-medium">Are you sure you want to delete this entry?</p>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(entry.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="mb-4 text-muted-foreground">No journal entries yet</p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Create Your First Entry
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Journal Entry Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Edit Journal Entry" : "New Journal Entry"}</DialogTitle>
            <DialogDescription>
              Record your thoughts, feelings, and experiences during your pregnancy journey.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Title
                </label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <label htmlFor="date" className="text-sm font-medium">
                  Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Journal Entry
                </label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="mood-type" className="text-sm font-medium">
                    Mood Type
                  </label>
                  <Select
                    value={moodType}
                    onValueChange={(value) => setMoodType(value as "positive" | "negative" | "neutral")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mood" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="mood-score" className="text-sm font-medium">
                    Mood Score (1-10)
                  </label>
                  <Select value={moodScore.toString()} onValueChange={(value) => setMoodScore(Number.parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select score" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                        <SelectItem key={score} value={score.toString()}>
                          {score}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : editingEntry ? "Update Entry" : "Save Entry"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
