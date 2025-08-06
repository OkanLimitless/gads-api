'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import SuspendedAccountsDetector from '@/components/SuspendedAccountsDetector'

export default function SuspendedAccountsPage() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const mccId = searchParams.get('mccId')
  const mccName = searchParams.get('mccName')

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Please sign in to access this page.</p>
          <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (!mccId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                MCC ID Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  An MCC ID is required to detect suspended accounts. Please select an MCC account from your dashboard.
                </AlertDescription>
              </Alert>
              <div className="flex gap-4 mt-6">
                <Button onClick={() => router.push('/dashboard')} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Suspended Account Detection</h1>
          <p className="text-gray-600 mt-2">
            Detect and manage suspended client accounts under {mccName ? `${mccName} (${mccId})` : `MCC ${mccId}`}
          </p>
        </div>

        {/* Main Content */}
        <SuspendedAccountsDetector
          mccId={mccId}
          onBack={() => router.push('/dashboard')}
        />

        {/* Information Footer */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>About Suspended Account Detection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">What This Tool Does:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>Scans your MCC for client accounts with "SUSPENDED" or "CANCELED" status</li>
                <li>Provides detailed information about each suspended account</li>
                <li>Helps identify inactive accounts in your MCC structure</li>
                <li>Provides direct links to Google Ads interface for manual account management</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Why This Matters:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>Suspended accounts cannot run campaigns or generate revenue</li>
                <li>They clutter your MCC interface and make account management harder</li>
                <li>Identifying them helps you understand your account portfolio health</li>
                <li>You can manually remove them through the Google Ads interface if needed</li>
              </ul>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> This tool identifies suspended accounts for your review. 
                Any account removal must be done manually through the Google Ads interface.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}