// src/dashboard/frontend/app/page.tsx
// This is the root page component for the application (/)

// Corrected import: Import the default export without curly braces
import MainDashboard from '@/components/main-dashboard'


export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Render the WebSourceEditor component */}
      <MainDashboard />
    </main>
  )
}
