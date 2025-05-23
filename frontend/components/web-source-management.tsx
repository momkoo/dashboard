"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { WebSourceCard } from "./dashboard/web-source-card"
import { EmptyState } from "./dashboard/empty-state"
import { Plus, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

// Types for our web sources
export interface DataField {
  name: string
  extractionRule: string
  dataType?: string
  extractionMethod?: string
}

export interface WebSource {
  id: string
  name: string
  url: string
  status: "active" | "inactive" | "error" | "crawling"
  lastCrawled: string | null
  dataFields: DataField[]
}

export function WebSourceManagement() {
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [webSources, setWebSources] = useState<WebSource[]>([])

  // Fetch web sources from backend on component mount
  useEffect(() => {
    const fetchWebSources = async () => {
      setIsLoading(true)
      try {
        const res = await fetch("/api/web-source/list")
        if (!res.ok) throw new Error("Failed to fetch web sources")
        const data = await res.json()
        // Map backend data to WebSource type (including id and dataFields)
        const sources: WebSource[] = (data || []).map((src: any) => ({
          id: src.id,
          name: src.name,
          url: src.url,
          status: src.status || "inactive",
          lastCrawled: src.lastCrawled || null,
          dataFields: src.dataFields || [],
        }))
        setWebSources(sources)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load web sources",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchWebSources()
  }, [toast])

  // Save a new web source and add its card immediately
  const handleSaveWebSource = async (webSourceData: Omit<WebSource, 'id' | 'status' | 'lastCrawled'>) => {
    try {
      const res = await fetch('/api/web-source/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webSourceData),
      });
      if (!res.ok) throw new Error('Failed to save web source');
      const data = await res.json();
      // Add the new card to the state
      setWebSources(prev => [
        {
          id: data.id,
          name: data.name,
          url: data.url,
          status: data.status || 'inactive',
          lastCrawled: data.lastCrawled || null,
          dataFields: data.dataFields || [],
        },
        ...prev
      ]);
      toast({ title: 'Web source saved', description: 'A new web source card has been created.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save web source', variant: 'destructive' });
    }
  }

  // Handle adding a new web source
  const handleAddWebSource = () => {
    router.push("/web-source/add")
  }

  // Handle editing a web source
  const handleEditWebSource = (name: string) => {
    router.push(`/web-source/edit/${encodeURIComponent(name)}`)
  }

  // Handle deleting a web source (TODO: implement backend API)
  const handleDeleteWebSource = async (name: string) => {
    setWebSources(webSources.filter((source) => source.name !== name))
    toast({
      title: "Web Source Deleted",
      description: "The web source has been successfully deleted",
    })
  }

  // Handle starting a crawl for a web source
  const handleStartCrawl = async (name: string) => {
    setWebSources(webSources.map((s) =>
      s.name === name ? { ...s, status: "crawling" } : s
    ))
    try {
      const res = await fetch("/api/web-source/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error("Crawling failed")
      // On success, update status and lastCrawled
      setWebSources(webSources.map((s) =>
        s.name === name
          ? { ...s, status: "active", lastCrawled: new Date().toISOString() }
          : s
      ))
      toast({
        title: "Crawling Complete",
        description: "The web source has been successfully crawled",
      })
    } catch (error) {
      setWebSources(webSources.map((s) =>
        s.name === name ? { ...s, status: "error" } : s
      ))
      toast({
        title: "Crawling Failed",
        description: "Failed to crawl the web source",
        variant: "destructive",
      })
    }
  }

  // Determine if we should show the empty state
  const showEmptyState = !isLoading && webSources.length === 0

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Top header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Web Source Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and control your web crawling sources</p>
        </div>

        <Button onClick={handleAddWebSource} size="default">
          <Plus className="mr-2 h-4 w-4" />
          Add Source
        </Button>
      </div>

      {/* Main content area */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : showEmptyState ? (
        <EmptyState onAddWebSource={() => router.push('/')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {webSources.map((source) => (
            <WebSourceCard
              key={source.name}
              source={source}
              onEdit={() => handleEditWebSource(source.name)}
              onDelete={() => handleDeleteWebSource(source.name)}
              onStartCrawl={() => handleStartCrawl(source.name)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
