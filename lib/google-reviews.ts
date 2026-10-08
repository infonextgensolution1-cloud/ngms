export type GoogleReview = {
  authorName?: string
  rating?: number
  text?: string
  relativePublishTimeDescription?: string
  googleMapsUri?: string
}

export type GoogleReviewsData = {
  name?: string
  rating?: number
  userRatingCount?: number
  reviews: GoogleReview[]
  googleMapsUri?: string
  writeAReviewUri?: string
  reviewsUri?: string
}

const PLACE_ID = 'ChIJA4Z3AZU_jUURHiApfVOkoNY'
const FALLBACK_MAPS_URI = `https://www.google.com/maps/search/?api=1&query=NextGen%20Solar%20Cleaning%20Maintenance%20Solutions&query_place_id=${PLACE_ID}`
const FALLBACK_WRITE_REVIEW_URI = `https://search.google.com/local/writereview?placeid=${PLACE_ID}`

export async function getGoogleReviews(): Promise<GoogleReviewsData> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) {
    return {
      reviews: [],
      googleMapsUri: FALLBACK_MAPS_URI,
      writeAReviewUri: FALLBACK_WRITE_REVIEW_URI,
      reviewsUri: FALLBACK_MAPS_URI,
    }
  }

  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${PLACE_ID}`, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'displayName,rating,userRatingCount,reviews,googleMapsLinks',
      },
      next: { revalidate: 300 },
    })

    if (!response.ok) throw new Error(`Google Places API: ${response.status}`)
    const data = await response.json()

    return {
      name: data.displayName?.text,
      rating: data.rating,
      userRatingCount: data.userRatingCount,
      reviews: (data.reviews ?? []).map((review: any) => ({
        authorName: review.authorAttribution?.displayName,
        rating: review.rating,
        text: review.text?.text,
        relativePublishTimeDescription: review.relativePublishTimeDescription,
        googleMapsUri: review.googleMapsUri,
      })),
      googleMapsUri: data.googleMapsLinks?.placeUri ?? FALLBACK_MAPS_URI,
      writeAReviewUri: data.googleMapsLinks?.writeAReviewUri ?? FALLBACK_WRITE_REVIEW_URI,
      reviewsUri: data.googleMapsLinks?.reviewsUri ?? FALLBACK_MAPS_URI,
    }
  } catch (error) {
    console.error('Google reviews fetch failed:', error)
    return {
      reviews: [],
      googleMapsUri: FALLBACK_MAPS_URI,
      writeAReviewUri: FALLBACK_WRITE_REVIEW_URI,
      reviewsUri: FALLBACK_MAPS_URI,
    }
  }
}
