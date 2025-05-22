"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Component for configuring a web source after analysis
export default function ConfigureWebSourcePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [domInfo, setDomInfo] = useState<any[]>([])
  const [dataFields, setDataFields] = useState<Array<{name: string, type: string, method: string, rule: string}>>([]);
  const [isSaving, setIsSaving] = useState(false)

  // Load analysis results from localStorage on component mount
  useEffect(() => {
    const storedScreenshot = localStorage.getItem("webSourceScreenshot")
    const storedDomInfo = localStorage.getItem("webSourceDomInfo")
    const storedUrl = localStorage.getItem("webSourceUrl")

    if (storedScreenshot) {
      setScreenshot(storedScreenshot)
    }

    if (storedDomInfo) {
      try {
        setDomInfo(JSON.parse(storedDomInfo))
      } catch (error) {
        console.error("Error parsing stored DOM info:", error)
      }
    }

    if (storedUrl) {
      setUrl(storedUrl)
      // Generate a default name from the URL
      const urlObj = new URL(storedUrl)
      setName(urlObj.hostname.replace(/^www\./, ""))
    }
  }, [])

  // Function to add a new data field
  const addDataField = () => {
    setDataFields([...dataFields, { name: "", type: "text", method: "css", rule: "" }])
  }

  // Function to remove a data field
  const removeDataField = (index: number) => {
    setDataFields(dataFields.filter((_, i) => i !== index))
  }

  // Function to update a data field
  const updateDataField = (index: number, field: string, value: string) => {
    const updatedFields = [...dataFields]
    updatedFields[index] = { ...updatedFields[index], [field]: value }
    setDataFields(updatedFields)
  }

  // Function to save the web source configuration
  const handleSave = async () => {
    if (!name || !url) {
      toast({
        title: "Missing Information",
        description: "Please provide a name and URL for the web source",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      // Call the API route to save the web source
      const response = await fetch("/api/web-source/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          url,
          dataFields,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save web source")
      }

      // Clear stored data
      localStorage.removeItem("webSourceScreenshot")
      localStorage.removeItem("webSourceDomInfo")
      localStorage.removeItem("webSourceUrl")

      toast({
        title: "Web Source Saved",
        description: "The web source has been successfully saved",
      })

      // Navigate back to the dashboard
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Error saving web source:", error)
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save the web source",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Function to handle going back to the analysis step
  const handleBack = () => {
    router.push("/web-source/add")
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <Button variant="ghost" onClick={handleBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Analysis
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Configure Web Source</CardTitle>
          <CardDescription>
            Configure the web source and define data fields to extract
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Web Source Name</Label>
                <Input
                  id="name"
                  placeholder="My Web Source"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>

            {screenshot && (
              <div>
                <h3 className="text-lg font-medium mb-2">Screenshot Preview</h3>
                <div className="border rounded-md overflow-hidden">
                  <img 
                    src={`data:image/png;base64,${screenshot}`} 
                    alt="Website screenshot" 
                    className="w-full max-h-60 object-contain"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Data Fields</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addDataField}
                  disabled={isSaving}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Field
                </Button>
              </div>

              {dataFields.length === 0 ? (
                <div className="border rounded-md p-8 text-center text-gray-500">
                  <p>No data fields defined. Click "Add Field" to define data to extract.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dataFields.map((field, index) => (
                    <div key={index} className="border rounded-md p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Field {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDataField(index)}
                          disabled={isSaving}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`field-name-${index}`}>Field Name</Label>
                          <Input
                            id={`field-name-${index}`}
                            placeholder="title"
                            value={field.name}
                            onChange={(e) => updateDataField(index, "name", e.target.value)}
                            disabled={isSaving}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`field-type-${index}`}>Data Type</Label>
                          <Select
                            value={field.type}
                            onValueChange={(value) => updateDataField(index, "type", value)}
                            disabled={isSaving}
                          >
                            <SelectTrigger id={`field-type-${index}`}>
                              <SelectValue placeholder="Select data type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="url">URL</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`field-method-${index}`}>Extraction Method</Label>
                          <Select
                            value={field.method}
                            onValueChange={(value) => updateDataField(index, "method", value)}
                            disabled={isSaving}
                          >
                            <SelectTrigger id={`field-method-${index}`}>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="css">CSS Selector</SelectItem>
                              <SelectItem value="xpath">XPath</SelectItem>
                              <SelectItem value="regex">Regex</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`field-rule-${index}`}>Extraction Rule</Label>
                          <Input
                            id={`field-rule-${index}`}
                            placeholder={field.method === "css" ? ".title" : field.method === "xpath" ? "//h1" : ".*"}
                            value={field.rule}
                            onChange={(e) => updateDataField(index, "rule", e.target.value)}
                            disabled={isSaving}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-gray-50 flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !name || !url}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Web Source"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
