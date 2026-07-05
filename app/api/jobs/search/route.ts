import { retiredFeatureResponse } from '@/lib/retired-feature'

export async function GET() {
  return retiredFeatureResponse('Job Search')
}
