import { retiredFeatureResponse } from '@/lib/retired-feature'

export async function POST() {
  return retiredFeatureResponse('Interview Practice')
}
