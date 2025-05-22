"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { MoreVertical, Edit, Trash2, Play, CheckCircle, XCircle, RefreshCcw, PauseCircle, Globe } from "lucide-react"
// Import WebSource type from management to ensure lastCrawled and dataFields are present
import type { WebSource } from "./web-source-management"

interface WebSourceListProps {
  sources: WebSource[]
  selectedSourceId: string | null
  onSelectSource: (sourceId: string) => void
  onEditSource: (sourceId: string) => void
  onDeleteSource: (sourceId: string) => void
  onRunSource: (sourceId: string) => void
}

import { WebSourceDetailModal } from "./web-source-detail-modal"

export function WebSourceList({
  sources,
  selectedSourceId,
  onSelectSource,
  onEditSource,
  onDeleteSource,
  onRunSource,
}: WebSourceListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sourceToDelete, setSourceToDelete] = useState<string | null>(null)

  const handleDeleteClick = (sourceId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSourceToDelete(sourceId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (sourceToDelete) {
      onDeleteSource(sourceToDelete)
      setSourceToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "processing":
        return <RefreshCcw className="h-4 w-4 text-blue-500 animate-spin" />
      case "paused":
        return <PauseCircle className="h-4 w-4 text-amber-500" />
      default:
        return <Globe className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Active"
      case "error":
        return "Error"
      case "processing":
        return "Processing"
      case "paused":
        return "Paused"
      default:
        return "Unknown"
    }
  }

  // State for detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailSource, setDetailSource] = useState<WebSource | null>(null)

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
      {sources.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No web sources added yet</div>
      ) : (
        sources.map((source) => (
          <div
            key={source.id}
            className={cn(
              "p-3 rounded-md border cursor-pointer transition-colors",
              selectedSourceId === source.id
                ? "bg-blue-50 border-blue-200"
                : "bg-white border-gray-200 hover:border-gray-300",
            )}
            onClick={() => onSelectSource(source.id)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{source.name}</h3>
                <p className="text-sm text-gray-500 truncate mt-1">{source.url}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <div className="flex items-center mr-3">
                    {getStatusIcon(source.status)}
                    <span className="ml-1">{getStatusText(source.status)}</span>
                  </div>
                  // Use lastCrawled to match WebSource interface
<div>Last updated: {source.lastCrawled ? formatDistanceToNow(new Date(source.lastCrawled)) + ' ago' : 'N/A'}</div>
                </div>
                {/* 상세보기 버튼 추가 */}
                // Use allowed Button size 'sm' instead of invalid 'xs'
<Button
  variant="outline"
  size="sm"
  className="mt-2"
  onClick={e => {
    e.stopPropagation();
    setDetailSource(source);
    setDetailModalOpen(true);
  }}
>
  상세보기
</Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditSource(source.id)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onRunSource(source.id)
                    }}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run Now
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={(e) => handleDeleteClick(source.id, e)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))
      )}

      <WebSourceDetailModal open={detailModalOpen} source={detailSource} onClose={() => setDetailModalOpen(false)} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this web source and all its collected data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
