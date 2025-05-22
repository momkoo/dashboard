"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { ArrowUpDown, ChevronDown, RefreshCw, Download, Filter, ExternalLink, Play } from "lucide-react"
import type { WebSource, CollectedData } from "@/types/dashboard"

interface DataTableProps {
  data: CollectedData[]
  source: WebSource | undefined
  onRunSource?: (sourceId: string) => void
}

export function DataTable({ data, source, onRunSource }: DataTableProps) {
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const itemsPerPage = 10
  const totalPages = Math.ceil(data.length / itemsPerPage)

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if already sorting by this field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new sort field and default to ascending
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Get sorted and paginated data
  const getSortedData = () => {
    const sortedData = [...data]

    if (sortField) {
      sortedData.sort((a, b) => {
        const aValue = a[sortField]
        const bValue = b[sortField]

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
        return 0
      })
    }

    // Get current page data
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedData.slice(startIndex, startIndex + itemsPerPage)
  }

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)

    // In a real implementation, this would fetch fresh data
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsRefreshing(false)
  }

  // Get column headers from the first data item or source fields
  const getColumnHeaders = () => {
    if (data.length > 0) {
      // Exclude the 'id' field
      return Object.keys(data[0]).filter((key) => key !== "id")
    }

    if (source?.fields) {
      return source.fields
    }

    return []
  }

  // Format cell value based on content
  const formatCellValue = (value: any) => {
    if (!value) return "-"

    // Check if it's a URL
    if (typeof value === "string" && (value.startsWith("http://") || value.startsWith("https://"))) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline flex items-center"
        >
          {value.length > 30 ? value.substring(0, 30) + "..." : value}
          <ExternalLink className="h-3 w-3 ml-1" />
        </a>
      )
    }

    // Check if it's an image URL (simplified check)
    if (
      typeof value === "string" &&
      (value.endsWith(".jpg") ||
        value.endsWith(".png") ||
        value.endsWith(".gif") ||
        value.endsWith(".jpeg") ||
        value.endsWith(".webp"))
    ) {
      return (
        <div className="flex items-center">
          <img
            src={value || "/placeholder.svg"}
            alt="Thumbnail"
            className="h-8 w-8 object-cover rounded mr-2"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=32&width=32"
            }}
          />
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
            View
          </a>
        </div>
      )
    }

    // Default case
    return value
  }

  const columnHeaders = getColumnHeaders()
  const sortedData = getSortedData()

  return (
    <div className="space-y-4">
      {/* Source info and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          {source ? (
            <>
              <h2 className="text-lg font-medium">{source.name}</h2>
              <p className="text-sm text-gray-500">{source.url}</p>
            </>
          ) : (
            <h2 className="text-lg font-medium">No source selected</h2>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing || !source}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={!source || data.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem>Export as JSON</DropdownMenuItem>
              <DropdownMenuItem>Export as Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search and filter */}
      {data.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Input placeholder="Search in data..." className="pl-10" />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      )}

      {/* Data table */}
      {data.length > 0 ? (
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columnHeaders.map((header) => (
                    <TableHead key={header} className="whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 -ml-2 font-medium"
                        onClick={() => handleSort(header)}
                      >
                        {header}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((row) => (
                  <TableRow key={row.id}>
                    {columnHeaders.map((header) => (
                      <TableCell key={`${row.id}-${header}`} className="whitespace-nowrap">
                        {formatCellValue(row[header])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : source ? (
        <div className="text-center py-12 border rounded-md bg-gray-50">
          <p className="text-gray-500">No data collected yet for this source</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => onRunSource && onRunSource(source.id)}>
            <Play className="h-4 w-4 mr-2" />
            Run Collection Now
          </Button>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-md bg-gray-50">
          <p className="text-gray-500">Please select a web source to view collected data</p>
        </div>
      )}

      {/* Pagination */}
      {data.length > itemsPerPage && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink isActive={page === currentPage} onClick={() => setCurrentPage(page)}>
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
