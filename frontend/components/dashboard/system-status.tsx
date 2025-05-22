"use client"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Activity } from "lucide-react"

interface SystemStatusProps {
  totalSources: number
  activeSources: number
  errorSources: number
}

export function SystemStatus({ totalSources, activeSources, errorSources }: SystemStatusProps) {
  // Determine overall system status
  const getSystemStatus = () => {
    if (errorSources > 0) return "error"
    if (activeSources > 0) return "active"
    if (totalSources === 0) return "inactive"
    return "normal"
  }

  const status = getSystemStatus()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                status === "active" && "bg-green-500",
                status === "error" && "bg-red-500",
                status === "normal" && "bg-blue-500",
                status === "inactive" && "bg-gray-400",
              )}
            />
            <Activity className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">{totalSources} Sources</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium mb-1">System Status</p>
            <div className="space-y-1">
              <div className="flex justify-between gap-4">
                <span>Total Sources:</span>
                <span className="font-medium">{totalSources}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Active Sources:</span>
                <span className="font-medium text-green-600">{activeSources}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Error Sources:</span>
                <span className="font-medium text-red-600">{errorSources}</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
