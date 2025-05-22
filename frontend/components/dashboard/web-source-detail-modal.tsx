// Modal to show detailed info for a WebSource, including crawled fields
// Only new comments are in English as per user rule

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { WebSource } from "./web-source-management"

interface WebSourceDetailModalProps {
  open: boolean
  source: WebSource | null
  onClose: () => void
}

export function WebSourceDetailModal({ open, source, onClose }: WebSourceDetailModalProps) {
  if (!source) return null
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{source.name}</DialogTitle>
          <DialogDescription>
            URL: <span className="text-blue-600">{source.url}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <h4 className="font-semibold mb-2">크롤링 필드 목록</h4>
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-2 py-1">필드명</th>
                <th className="border px-2 py-1">타입</th>
                <th className="border px-2 py-1">추출 방식</th>
                <th className="border px-2 py-1">추출 규칙</th>
              </tr>
            </thead>
            <tbody>
              {source.dataFields && source.dataFields.length > 0 ? (
              source.dataFields.map((f: any, idx: number) => (
                <tr key={idx}>
                  <td className="border px-2 py-1">{f.name}</td>
                  <td className="border px-2 py-1">{f.type}</td>
                  <td className="border px-2 py-1">{f.method}</td>
                  <td className="border px-2 py-1">{f.rule}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center text-gray-400 py-4">필드 정보 없음</td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
