"use client"

import { Button } from "@/components/ui/button"
import { Plus, Globe } from "lucide-react"

interface EmptyStateProps {
  onAddWebSource: () => void
}

export function EmptyState({ onAddWebSource }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Globe className="h-10 w-10 text-gray-400" />
      </div>

      <h2 className="text-xl font-medium text-gray-900 mb-2">No Web Sources Added</h2>

      <p className="text-gray-500 text-center max-w-md mb-8">
        You haven't added any web sources for data collection yet. Add your first web source to start collecting data.
      </p>

      <Button size="lg" onClick={onAddWebSource}>
        <Plus className="mr-2 h-5 w-5" />
        Add Your First Web Source
      </Button>
    </div>
  )
}
