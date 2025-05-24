"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { formatDistanceToNow } from "date-fns"
import {
  MoreVertical,
  Edit,
  Trash2,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  AlertTriangle,
} from "lucide-react"
import type { WebSource } from "../web-source-management"
import { Badge } from "@/components/ui/badge"

interface WebSourceCardProps {
  source: WebSource
  onEdit: () => void
  onDelete: () => void
  onStartCrawl: () => void
}

export function WebSourceCard({ source, onEdit, onDelete, onStartCrawl }: WebSourceCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const getStatusIcon = () => {
    switch (source.status) {
      case "active":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "inactive":
        return <Clock className="h-5 w-5 text-amber-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "crawling":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (source.status) {
      case "active":
        return "Active"
      case "inactive":
        return "Inactive"
      case "error":
        return "Error"
      case "crawling":
        return "Crawling..."
      default:
        return "Unknown"
    }
  }

  const getLastCrawledText = () => {
    if (source.status === "crawling") {
      return "Crawling in progress..."
    }

    if (!source.lastCrawled) {
      return "Never crawled"
    }

    return `Last crawled ${formatDistanceToNow(new Date(source.lastCrawled))} ago`
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-0">
        {/* Status indicator bar at the top */}
        <div
          className={`h-1.5 w-full ${
            source.status === "active"
              ? "bg-green-500"
              : source.status === "inactive"
                ? "bg-amber-500"
                : source.status === "error"
                  ? "bg-red-500"
                  : "bg-blue-500"
          }`}
        />

        <div className="p-5">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-lg text-gray-900 truncate max-w-[80%]">{source.name}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(source.url, "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit URL
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={() => setDeleteDialogOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-sm text-gray-500 mt-1 truncate">{source.url}</p>

          <div className="flex items-center mt-4 text-sm">
            {getStatusIcon()}
            <span className="ml-2">{getStatusText()}</span>
          </div>

          <div className="mt-3">
            <p className="text-xs text-gray-600 mb-2 font-medium">Collecting Fields:</p>
            <div className="flex flex-wrap gap-1">
              {source.fields.slice(0, 3).map((field, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                  {field}
                </Badge>
              ))}
              {source.fields.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  +{source.fields.length - 3} more
                </Badge>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-3">{getLastCrawledText()}</p>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-end">
        <Button
          onClick={onStartCrawl}
          disabled={source.status === "crawling"}
          className="w-full"
          variant={source.status === "error" ? "destructive" : "default"}
        >
          {source.status === "crawling" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Crawling...
            </>
          ) : source.status === "error" ? (
            <>
              <Play className="mr-2 h-4 w-4" />
              Retry Crawling
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Start Crawling
            </>
          )}
        </Button>
      </CardFooter>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the web source "{source.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
