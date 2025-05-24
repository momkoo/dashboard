"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Database, Search } from "lucide-react"

// Simplified navigation bar component to reduce error potential
export function NavigationBar() {
  const pathname = usePathname()

  // Function to check if a path is active
  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <div className="bg-white border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg">Web Data Dashboard</span>
          </div>
          
          <nav className="flex items-center space-x-1">
            <Link 
              href="/"
              className={`px-3 py-2 rounded-md flex items-center space-x-1 ${isActive('/') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            
            <Link 
              href="/analyze"
              className={`px-3 py-2 rounded-md flex items-center space-x-1 ${isActive('/analyze') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Search className="h-4 w-4" />
              <span>Analyze</span>
            </Link>
            
            <Link 
              href="/management"
              className={`px-3 py-2 rounded-md flex items-center space-x-1 ${isActive('/management') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Database className="h-4 w-4" />
              <span>Management</span>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  )
}
