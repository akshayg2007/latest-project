'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CURRENCIES, DEFAULT_CURRENCY, getCurrencyFromCountry, type CurrencyInfo } from '@/lib/currency'

// Map timezones to country codes
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
    // India
    'Asia/Kolkata': 'IN',
    'Asia/Calcutta': 'IN',

    // USA
    'America/New_York': 'US',
    'America/Chicago': 'US',
    'America/Denver': 'US',
    'America/Los_Angeles': 'US',
    'America/Phoenix': 'US',
    'America/Anchorage': 'US',
    'Pacific/Honolulu': 'US',

    // UK
    'Europe/London': 'GB',

    // Europe
    'Europe/Paris': 'FR',
    'Europe/Berlin': 'DE',
    'Europe/Madrid': 'ES',
    'Europe/Rome': 'IT',
    'Europe/Amsterdam': 'NL',
    'Europe/Brussels': 'BE',
    'Europe/Vienna': 'AT',
    'Europe/Zurich': 'CH',
    'Europe/Stockholm': 'SE',
    'Europe/Oslo': 'NO',
    'Europe/Copenhagen': 'DK',
    'Europe/Helsinki': 'FI',
    'Europe/Warsaw': 'PL',
    'Europe/Prague': 'CZ',
    'Europe/Budapest': 'HU',
    'Europe/Athens': 'GR',
    'Europe/Dublin': 'IE',
    'Europe/Lisbon': 'PT',

    // Asia
    'Asia/Tokyo': 'JP',
    'Asia/Shanghai': 'CN',
    'Asia/Hong_Kong': 'HK',
    'Asia/Singapore': 'SG',
    'Asia/Seoul': 'KR',
    'Asia/Bangkok': 'TH',
    'Asia/Jakarta': 'ID',
    'Asia/Manila': 'PH',
    'Asia/Kuala_Lumpur': 'MY',
    'Asia/Dubai': 'AE',
    'Asia/Riyadh': 'SA',
    'Asia/Tehran': 'IR',
    'Asia/Karachi': 'PK',
    'Asia/Dhaka': 'BD',
    'Asia/Colombo': 'LK',
    'Asia/Kathmandu': 'NP',

    // Australia/Oceania
    'Australia/Sydney': 'AU',
    'Australia/Melbourne': 'AU',
    'Australia/Brisbane': 'AU',
    'Australia/Perth': 'AU',
    'Pacific/Auckland': 'NZ',

    // Americas
    'America/Toronto': 'CA',
    'America/Vancouver': 'CA',
    'America/Mexico_City': 'MX',
    'America/Sao_Paulo': 'BR',
    'America/Buenos_Aires': 'AR',
    'America/Lima': 'PE',
    'America/Bogota': 'CO',
    'America/Santiago': 'CL',

    // Africa
    'Africa/Cairo': 'EG',
    'Africa/Lagos': 'NG',
    'Africa/Johannesburg': 'ZA',
    'Africa/Nairobi': 'KE',

    // Russia
    'Europe/Moscow': 'RU',

    // Israel
    'Asia/Jerusalem': 'IL',
    'Asia/Tel_Aviv': 'IL',
}

function getCountryFromTimezone(): string {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        return TIMEZONE_TO_COUNTRY[timezone] || 'US'
    } catch {
        return 'US'
    }
}

interface CurrencyContextType {
    currency: string
    currencyInfo: CurrencyInfo
    isLoading: boolean
    detectedCountry: string | null
}

const CurrencyContext = createContext<CurrencyContextType>({
    currency: DEFAULT_CURRENCY,
    currencyInfo: CURRENCIES[DEFAULT_CURRENCY],
    isLoading: true,
    detectedCountry: null
})

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY)
    const [detectedCountry, setDetectedCountry] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Automatically detect user's location and set currency on mount
    useEffect(() => {
        // Detect from browser timezone (works locally!)
        const countryCode = getCountryFromTimezone()
        setDetectedCountry(countryCode)
        const detectedCurrency = getCurrencyFromCountry(countryCode)
        setCurrency(detectedCurrency)
        setIsLoading(false)
    }, [])

    const currencyInfo = CURRENCIES[currency] || CURRENCIES[DEFAULT_CURRENCY]

    return (
        <CurrencyContext.Provider
            value={{
                currency,
                currencyInfo,
                isLoading,
                detectedCountry
            }}
        >
            {children}
        </CurrencyContext.Provider>
    )
}

export function useCurrency() {
    return useContext(CurrencyContext)
}
