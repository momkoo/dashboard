"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Component for analyzing a web source URL
export default function AddWebSourcePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [url, setUrl] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [domInfo, setDomInfo] = useState<any[]>([])
  const [isPuppeteerFallback, setIsPuppeteerFallback] = useState(false)
  const [targetUrl, setTargetUrl] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Function to handle URL analysis
  const handleAnalyzeUrl = async () => {
    if (!url) {
      toast({
        title: "URL Required",
        description: "Please enter a URL to analyze",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    setScreenshot(null)
    setDomInfo([])
    setIsPuppeteerFallback(false)
    setTargetUrl(null)

    try {
      // Call the API route that forwards to the backend
      const response = await fetch("/api/web-source/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to analyze URL")
      }

      const data = await response.json()
      
      // Check if this is a Puppeteer fallback response
      if (data.puppeteerFallback) {
        console.log("Puppeteer fallback detected")
        setIsPuppeteerFallback(true)
        setTargetUrl(data.targetUrl)
        // The actual screenshot and DOM processing will happen in the iframe
      } else {
        // Normal response with screenshot and DOM info
        setScreenshot(data.screenshot)
        setDomInfo(data.dom_info || [])
      }
    } catch (error: any) {
      console.error("Error analyzing URL:", error)
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze the URL",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Function to handle continuing to the next step
  const handleContinue = () => {
    // Store the analysis results in localStorage or state management
    // and navigate to the next step
    if (screenshot) {
      localStorage.setItem("webSourceScreenshot", screenshot)
    }
    if (domInfo.length > 0) {
      localStorage.setItem("webSourceDomInfo", JSON.stringify(domInfo))
    }
    router.push("/web-source/add/configure")
  }

  // Function to handle going back to the dashboard
  const handleBack = () => {
    router.push("/dashboard")
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <Button variant="ghost" onClick={handleBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Add Web Source</CardTitle>
          <CardDescription>
            Enter a URL to analyze and extract data fields
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL to Analyze</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isAnalyzing}
                />
                <Button onClick={handleAnalyzeUrl} disabled={isAnalyzing || !url}>
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze"
                  )}
                </Button>
              </div>
            </div>

            {isPuppeteerFallback && targetUrl && (
              <div className="mt-4">
                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mb-4">
                  <h3 className="text-yellow-800 font-medium">Browser Preview Mode</h3>
                  <p className="text-yellow-700 text-sm">
                    We're using an alternative method to analyze this URL. The page will be displayed below.
                  </p>
                </div>
                <div className="border rounded-md overflow-hidden" style={{ height: '500px' }}>
                  <iframe 
                    ref={iframeRef}
                    src={targetUrl}
                    className="w-full h-full"
                    title="Web page preview"
                  />
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleContinue} disabled={isAnalyzing}>
                    Continue to Configuration
                  </Button>
                </div>
              </div>
            )}

            {screenshot && !isPuppeteerFallback && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Screenshot Preview</h3>
                <div className="border rounded-md overflow-hidden">
                  <img 
                    src={`data:image/png;base64,${screenshot}`} 
                    alt="Website screenshot" 
                    className="w-full"
                  />
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">DOM Elements</h3>
                  <div className="border rounded-md p-4 bg-gray-50 max-h-60 overflow-y-auto">
                    {domInfo.length > 0 ? (
                      <pre className="text-xs">{JSON.stringify(domInfo.slice(0, 10), null, 2)}</pre>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No DOM elements extracted</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleContinue} disabled={isAnalyzing}>
                    Continue to Configuration
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t bg-gray-50 flex justify-between">
          <p className="text-xs text-gray-500">
            The analysis will extract the page structure and take a screenshot
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
