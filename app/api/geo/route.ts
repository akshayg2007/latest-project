import { NextRequest, NextResponse } from 'next/server'

// Vercel and Cloudflare automatically add geolocation headers
// This API route extracts the country from those headers

export async function GET(request: NextRequest) {
    try {
        // Try Vercel's geolocation header first
        const country = request.headers.get('x-vercel-ip-country')
            || request.headers.get('cf-ipcountry') // Cloudflare
            || null

        // If no header available (local dev), try IP geolocation API
        if (!country) {
            try {
                // Use a free IP geolocation service for development
                const ip = request.headers.get('x-forwarded-for')?.split(',')[0]
                    || request.headers.get('x-real-ip')
                    || '8.8.8.8' // Default to Google DNS for testing

                const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`, {
                    next: { revalidate: 3600 } // Cache for 1 hour
                })

                if (geoResponse.ok) {
                    const geoData = await geoResponse.json()
                    return NextResponse.json({
                        country: geoData.country_code || 'US',
                        city: geoData.city,
                        region: geoData.region,
                        timezone: geoData.timezone
                    })
                }
            } catch {
                // Fallback to US if all detection fails
            }
        }

        return NextResponse.json({
            country: country || 'US'
        })
    } catch (error) {
        console.error('Geo detection error:', error)
        return NextResponse.json({ country: 'US' })
    }
}
