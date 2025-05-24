//**data-fields-table**: 어떤 데이터를 어떻게 수집할지 설정 (설정 도구
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DataField } from "@/types/web-source"

// Define valid data types and extraction methods
const DATA_TYPES = ['text', 'number', 'url', 'date', 'image_url', 'boolean'] as const
const EXTRACTION_METHODS = ['css_selector', 'xpath', 'llm', 'attribute'] as const

type DataType = typeof DATA_TYPES[number]
type ExtractionMethod = typeof EXTRACTION_METHODS[number]

import { cn } from "@/lib/utils"
import { Plus, Trash2 } from "lucide-react"

interface DataFieldsTableProps {
  fields: DataField[]
  selectedFieldId: string | null
  onSelectField: (fieldId: string | null) => void
  onUpdateField: (field: DataField) => void
  onDeleteField: (fieldId: string) => void
  onAddField: () => void
}

export function DataFieldsTable({
  fields,
  selectedFieldId,
  onSelectField,
  onUpdateField,
  onDeleteField,
  onAddField,
}: DataFieldsTableProps) {
  const [highlightedFieldId, setHighlightedFieldId] = useState<string | null>(null)

  // When a field is updated, highlight it briefly
  const handleFieldUpdate = (updatedField: DataField) => {
    onUpdateField(updatedField)
    setHighlightedFieldId(updatedField.id)
    setTimeout(() => {
      setHighlightedFieldId(null)
    }, 1000)
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                Field Name
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                Data Type
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                Extraction Method
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                Extraction Rule
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fields.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 px-4 text-center text-gray-500">
                  No fields defined. Click "Add Field" to get started.
                </td>
              </tr>
            ) : (
              fields.map((field) => (
                <tr
                  key={field.id}
                  className={cn(
                    "hover:bg-gray-50 cursor-pointer transition-colors",
                    selectedFieldId === field.id && "bg-blue-50 hover:bg-blue-50",
                    highlightedFieldId === field.id && "bg-green-50 hover:bg-green-50",
                  )}
                  onClick={() => onSelectField(field.id)}
                >
                  <td className="py-2 px-4">
                    <Input
                      value={field.name}
                      onChange={(e) => handleFieldUpdate({ ...field, name: e.target.value })}
                      placeholder="Field name"
                      className="h-8"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="py-2 px-4">
                    <Select
                      value={field.type}
                      onValueChange={(value) => handleFieldUpdate({ ...field, type: value as DataType })}
                    >
                      <SelectTrigger className="h-8" onClick={(e) => e.stopPropagation()}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DATA_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-2 px-4">
                    <Select
                      value={field.method}
                      onValueChange={(value) =>
                        handleFieldUpdate({ ...field, method: value as ExtractionMethod })
                      }
                    >
                      <SelectTrigger className="h-8" onClick={(e) => e.stopPropagation()}>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXTRACTION_METHODS.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-2 px-4">
                    <Input
                      value={field.rule}
                      onChange={(e) =>
                        handleFieldUpdate({ ...field, rule: e.target.value })
                      }
                      placeholder="Click element in preview"
                      className={cn("h-8", highlightedFieldId === field.id && "bg-green-50 border-green-300")}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="py-2 px-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteField(field.id)
                      }}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Button variant="outline" size="sm" onClick={onAddField} className="mt-2">
        <Plus className="h-4 w-4 mr-2" />
        Add Field
      </Button>

      {selectedFieldId && (
        <div className="text-xs text-blue-600 mt-2">
          <p>
            <span className="font-medium">Tip:</span> With a field selected, click on an element in the page preview to
            automatically generate an extraction rule.
          </p>
        </div>
      )}
    </div>
  )
}
