"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WebSourceList } from "@/components/dashboard/web-source-list"
import { DataTable } from "@/components/dashboard/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import { SystemStatus } from "@/components/dashboard/system-status"
import { useMobile } from "@/hooks/use-mobile"
import { Plus, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import type { WebSource, CollectedData } from "@/types/dashboard"

export function MainDashboard() {
  const { toast } = useToast()
  const router = useRouter()
  const isMobile = useMobile()
  const [isLoading, setIsLoading] = useState(true)
  const [webSources, setWebSources] = useState<WebSource[]>([])
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)
  const [collectedData, setCollectedData] = useState<CollectedData[]>([])
  const [activeTab, setActiveTab] = useState<string>("sources")

  // Fetch web sources on component mount
  useEffect(() => {
    const fetchWebSources = async () => {
      try {
        setIsLoading(true)
        // In a real implementation, this would be an API call
        // For now, we'll simulate a response with a delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Sample data
        const sources: WebSource[] = [
          {
            id: "ws1",
            name: "Product Listings",
            url: "https://example.com/products",
            status: "active",
            lastCollected: "2025-05-19T08:30:00Z",
            fields: ["Product Name", "Price", "Rating", "Stock"],
          },
          {
            id: "ws2",
            name: "News Headlines",
            url: "https://example.com/news",
            status: "error",
            lastCollected: "2025-05-18T22:15:00Z",
            fields: ["Title", "Date", "Author", "Category"],
          },
          {
            id: "ws3",
            name: "Stock Prices",
            url: "https://example.com/stocks",
            status: "processing",
            lastCollected: "2025-05-19T09:00:00Z",
            fields: ["Symbol", "Price", "Change", "Volume"],
          },
        ]

        setWebSources(sources)

        // Select the first source by default if available
        if (sources.length > 0) {
          setSelectedSourceId(sources[0].id)
          fetchSourceData(sources[0].id)
        }
      } catch (error) {
        console.error("Error fetching web sources:", error)
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

  // Fetch data for a selected source
  const fetchSourceData = async (sourceId: string) => {
    try {
      // In a real implementation, this would be an API call
      // For now, we'll simulate a response with a delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Sample data based on the selected source
      let data: CollectedData[] = []

      const selectedSource = webSources.find((source) => source.id === sourceId)

      if (selectedSource) {
        if (selectedSource.id === "ws1") {
          // Product data
          data = [
            { id: "d1", "Product Name": "Laptop Pro", Price: "$1299.99", Rating: "4.5", Stock: "In Stock" },
            { id: "d2", "Product Name": "Wireless Headphones", Price: "$199.99", Rating: "4.2", Stock: "Low Stock" },
            { id: "d3", "Product Name": "Smart Watch", Price: "$249.99", Rating: "4.0", Stock: "In Stock" },
            { id: "d4", "Product Name": "Tablet Mini", Price: "$399.99", Rating: "4.7", Stock: "Out of Stock" },
            { id: "d5", "Product Name": "Bluetooth Speaker", Price: "$89.99", Rating: "4.3", Stock: "In Stock" },
          ]
        } else if (selectedSource.id === "ws2") {
          // News data
          data = [
            {
              id: "d6",
              Title: "New Technology Breakthrough",
              Date: "2025-05-19",
              Author: "John Smith",
              Category: "Technology",
            },
            { id: "d7", Title: "Global Market Update", Date: "2025-05-19", Author: "Jane Doe", Category: "Business" },
            {
              id: "d8",
              Title: "Sports Championship Results",
              Date: "2025-05-18",
              Author: "Mike Johnson",
              Category: "Sports",
            },
            {
              id: "d9",
              Title: "Health Research Findings",
              Date: "2025-05-18",
              Author: "Sarah Williams",
              Category: "Health",
            },
            {
              id: "d10",
              Title: "Entertainment Industry News",
              Date: "2025-05-17",
              Author: "David Brown",
              Category: "Entertainment",
            },
          ]
        } else if (selectedSource.id === "ws3") {
          // Stock data
          data = [
            { id: "d11", Symbol: "AAPL", Price: "$182.63", Change: "+1.2%", Volume: "32.5M" },
            { id: "d12", Symbol: "MSFT", Price: "$412.41", Change: "+0.8%", Volume: "28.1M" },
            { id: "d13", Symbol: "GOOGL", Price: "$175.22", Change: "-0.3%", Volume: "18.7M" },
            { id: "d14", Symbol: "AMZN", Price: "$182.63", Change: "+2.1%", Volume: "22.3M" },
            { id: "d15", Symbol: "META", Price: "$478.22", Change: "+1.5%", Volume: "15.9M" },
          ]
        }
      }

      setCollectedData(data)
    } catch (error) {
      console.error("Error fetching source data:", error)
      toast({
        title: "Error",
        description: "Failed to load data for the selected source",
        variant: "destructive",
      })
    }
  }

  // Handle source selection
  const handleSourceSelect = (sourceId: string) => {
    setSelectedSourceId(sourceId)
    fetchSourceData(sourceId)

    // On mobile, switch to the data tab after selecting a source
    if (isMobile) {
      setActiveTab("data")
    }
  }

  // Handle adding a new web source
  const handleAddWebSource = () => {
    router.push("/web-source/add")
  }

  // Handle editing a web source
  const handleEditWebSource = (sourceId: string) => {
    router.push(`/web-source/edit/${sourceId}`)
  }

  // Handle deleting a web source
  const handleDeleteWebSource = async (sourceId: string) => {
    try {
      // In a real implementation, this would be an API call
      // For now, we'll simulate a response with a delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Remove the source from the list
      setWebSources(webSources.filter((source) => source.id !== sourceId))

      // If the deleted source was selected, select another one
      if (selectedSourceId === sourceId) {
        const remainingSources = webSources.filter((source) => source.id !== sourceId)
        if (remainingSources.length > 0) {
          setSelectedSourceId(remainingSources[0].id)
          fetchSourceData(remainingSources[0].id)
        } else {
          setSelectedSourceId(null)
          setCollectedData([])
        }
      }

      toast({
        title: "Web Source Deleted",
        description: "The web source has been successfully deleted",
      })
    } catch (error) {
      console.error("Error deleting web source:", error)
      toast({
        title: "Error",
        description: "Failed to delete the web source",
        variant: "destructive",
      })
    }
  }

  // Handle manual execution of a web source
  const handleRunWebSource = async (sourceId: string) => {
    try {
      // In a real implementation, this would be an API call
      // For now, we'll simulate a response with a delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update the source status to processing
      setWebSources(webSources.map((source) => (source.id === sourceId ? { ...source, status: "processing" } : source)))

      toast({
        title: "Collection Started",
        description: "Manual data collection has been initiated",
      })

      // Simulate completion after a delay
      setTimeout(() => {
        setWebSources(
          webSources.map((source) =>
            source.id === sourceId
              ? {
                  ...source,
                  status: "active",
                  lastCollected: new Date().toISOString(),
                }
              : source,
          ),
        )

        // Refresh data if this is the selected source
        if (selectedSourceId === sourceId) {
          fetchSourceData(sourceId)
        }

        toast({
          title: "Collection Complete",
          description: "Data has been successfully collected",
        })
      }, 3000)
    } catch (error) {
      console.error("Error running web source:", error)
      toast({
        title: "Error",
        description: "Failed to start data collection",
        variant: "destructive",
      })
    }
  }

  // Determine if we should show the empty state
  const showEmptyState = !isLoading && webSources.length === 0

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Top header/navigation area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Web Data Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor and manage your web data collection</p>
        </div>

        <div className="flex items-center gap-4">
          <SystemStatus
            totalSources={webSources.length}
            activeSources={webSources.filter((s) => s.status === "active").length}
            errorSources={webSources.filter((s) => s.status === "error").length}
          />

          <Button onClick={handleAddWebSource}>
            <Plus className="mr-2 h-4 w-4" />
            Add Web Source
          </Button>
        </div>
      </div>

      {/* Main content area */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : showEmptyState ? (
        <EmptyState onAddWebSource={handleAddWebSource} />
      ) : isMobile ? (
        // Mobile layout with tabs
        <Tabs defaultValue="sources" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="sources">Web Sources</TabsTrigger>
            <TabsTrigger value="data">Collected Data</TabsTrigger>
          </TabsList>

          <TabsContent value="sources" className="mt-0">
            <Card className="p-4">
              <WebSourceList
                sources={webSources}
                selectedSourceId={selectedSourceId}
                onSelectSource={handleSourceSelect}
                onEditSource={handleEditWebSource}
                onDeleteSource={handleDeleteWebSource}
                onRunSource={handleRunWebSource}
              />
            </Card>
          </TabsContent>

          <TabsContent value="data" className="mt-0">
            <Card className="p-4">
              {selectedSourceId ? (
                <DataTable data={collectedData} source={webSources.find((s) => s.id === selectedSourceId)} />
              ) : (
                <div className="text-center py-8 text-gray-500">Please select a web source to view collected data</div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        // Desktop layout with side-by-side panels
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Left panel - Web Source List (30%) */}
          <div className="lg:col-span-3">
            <Card className="p-4">
              <h2 className="text-lg font-medium mb-4">Web Sources</h2>
              <WebSourceList
                sources={webSources}
                selectedSourceId={selectedSourceId}
                onSelectSource={handleSourceSelect}
                onEditSource={handleEditWebSource}
                onDeleteSource={handleDeleteWebSource}
                onRunSource={handleRunWebSource}
              />
            </Card>
          </div>

          {/* Right panel - Data Table (70%) */}
          <div className="lg:col-span-7">
            <Card className="p-4">
              {selectedSourceId ? (
                <DataTable data={collectedData} source={webSources.find((s) => s.id === selectedSourceId)} />
              ) : (
                <div className="text-center py-8 text-gray-500">Please select a web source to view collected data</div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
