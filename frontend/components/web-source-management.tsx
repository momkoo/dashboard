"use client"
//웹소스매니지먼트 페이지 웹소스카드보이는
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

// WebSource 인터페이스를 WebSourceWithData와 호환되도록 수정
export interface WebSource {
  id: string
  name: string
  url: string
  status: "active" | "inactive" | "error" | "crawling"
  lastCrawled: string | null
  fields: string[]        // dataFields 대신 fields 사용
  collectedData: any[]    // 수집된 데이터
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
        const res = await fetch("http://localhost:8082/api/web-source/list")
        if (!res.ok) throw new Error("Failed to fetch web sources")
        const data = await res.json()
        // Map backend data to WebSource type with proper field mapping
        const sources: WebSource[] = (data || []).map((src: any) => {
          // Debug the structure of data_fields
          console.log('Raw data_fields type:', typeof src.data_fields)
          console.log('Raw data_fields:', src.data_fields)
          
          let fields: string[] = []
          
          try {
            if (src.data_fields) {
              // Handle different data_fields formats
              if (Array.isArray(src.data_fields)) {
                // It's already an array
                const dataFields = src.data_fields
                console.log('Array data_fields:', dataFields)
                
                fields = dataFields.map((field: any) => {
                  if (typeof field === 'string') return field
                  if (field && typeof field === 'object') {
                    return field.name || field.field_name || `아이템 ${fields.length + 1}`
                  }
                  return `아이템 ${fields.length + 1}`
                })
              } else if (typeof src.data_fields === 'string') {
                // Try to parse it as JSON
                try {
                  // Check if it's already a stringified array of objects
                  const dataFields = JSON.parse(src.data_fields)
                  console.log('Parsed string data_fields:', dataFields)
                  
                  if (Array.isArray(dataFields)) {
                    fields = dataFields.map((field: any) => {
                      if (typeof field === 'string') return field
                      if (field && typeof field === 'object') {
                        return field.name || field.field_name || `아이템 ${fields.length + 1}`
                      }
                      return `아이템 ${fields.length + 1}`
                    })
                  }
                } catch (parseError) {
                  console.error('Failed to parse data_fields as JSON:', parseError)
                  // If it's not valid JSON, just use it as a single field
                  fields = [src.data_fields]
                }
              } else if (src.data_fields && typeof src.data_fields === 'object') {
                // It's an object but not an array
                console.log('Object data_fields:', src.data_fields)
                
                // Convert object to array of field names if possible
                if (Object.keys(src.data_fields).length > 0) {
                  fields = Object.keys(src.data_fields).map(key => {
                    const field = src.data_fields[key]
                    if (typeof field === 'string') return field
                    if (field && typeof field === 'object') {
                      return field.name || field.field_name || key
                    }
                    return key
                  })
                }
              }
              
              console.log('Final processed fields:', fields)
            }
          } catch (e) {
            console.error('Error processing data_fields:', e)
            // Fallback to empty fields array
            fields = []
          }
          
          return {
            id: src.id,
            name: src.name || `웹소스 ${src.id.substring(0, 8)}`,
            url: src.url,
            // Map crawling_status to our status types
            status: src.crawling_status === 'crawling' ? 'crawling' : 
                   src.enabled ? 'active' : 'inactive',
            lastCrawled: src.last_crawled_at || null,
            fields: fields,
            collectedData: src.latest_crawled_data_summary ? 
              [{id: 'sample', ...JSON.parse(src.latest_crawled_data_summary)}] : [],
          }
        })
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
  const handleSaveWebSource = async (webSourceData: Omit<WebSource, 'id' | 'status' | 'lastCrawled' | 'collectedData'>) => {
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
          fields: data.fields || webSourceData.fields || [],
          collectedData: [],
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
              key={source.id} /* Use unique ID instead of name to avoid duplicate key errors */
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
