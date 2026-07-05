import { NextResponse } from 'next/server'

export function retiredFeatureResponse(featureName: string) {
  return NextResponse.json(
    {
      error: `${featureName} is coming soon and is not available in the current production release.`,
    },
    {
      status: 410,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}
