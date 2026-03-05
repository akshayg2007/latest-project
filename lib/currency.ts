// Currency configuration and utilities

export interface CurrencyInfo {
    code: string
    symbol: string
    name: string
    rate: number // Rate relative to USD (base currency)
    locale: string
}

// Supported currencies with their display info
export const CURRENCIES: Record<string, CurrencyInfo> = {
    INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 1, locale: 'en-IN' },
    USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.012, locale: 'en-US' },
    JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 149.50, locale: 'ja-JP' },
    AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.53, locale: 'en-AU' },
    CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.36, locale: 'en-CA' },
    CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', rate: 0.88, locale: 'de-CH' },
    CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 7.24, locale: 'zh-CN' },
    KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', rate: 1320.50, locale: 'ko-KR' },
    SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 1.34, locale: 'en-SG' },
    AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rate: 3.67, locale: 'ar-AE' },
    BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', rate: 4.97, locale: 'pt-BR' },
    MXN: { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', rate: 17.15, locale: 'es-MX' },
    ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', rate: 18.65, locale: 'en-ZA' },
    SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', rate: 10.42, locale: 'sv-SE' },
    NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', rate: 10.58, locale: 'nb-NO' },
    DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone', rate: 6.87, locale: 'da-DK' },
    PLN: { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', rate: 3.98, locale: 'pl-PL' },
    THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', rate: 35.50, locale: 'th-TH' },
    PHP: { code: 'PHP', symbol: '₱', name: 'Philippine Peso', rate: 55.85, locale: 'en-PH' },
    IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', rate: 15750, locale: 'id-ID' },
    MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', rate: 4.47, locale: 'ms-MY' },
    VND: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', rate: 24500, locale: 'vi-VN' },
    NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', rate: 1.64, locale: 'en-NZ' },
    HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', rate: 7.82, locale: 'zh-HK' },
    TWD: { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', rate: 31.50, locale: 'zh-TW' },
    RUB: { code: 'RUB', symbol: '₽', name: 'Russian Ruble', rate: 89.50, locale: 'ru-RU' },
    TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira', rate: 30.25, locale: 'tr-TR' },
    PKR: { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', rate: 279.50, locale: 'ur-PK' },
    BDT: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', rate: 109.75, locale: 'bn-BD' },
    NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rate: 1550, locale: 'en-NG' },
    EGP: { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', rate: 30.90, locale: 'ar-EG' },
    ILS: { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', rate: 3.65, locale: 'he-IL' },
    SAR: { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal', rate: 3.75, locale: 'ar-SA' },
    COP: { code: 'COP', symbol: 'COL$', name: 'Colombian Peso', rate: 3950, locale: 'es-CO' },
    ARS: { code: 'ARS', symbol: 'AR$', name: 'Argentine Peso', rate: 850, locale: 'es-AR' },
    CLP: { code: 'CLP', symbol: 'CLP$', name: 'Chilean Peso', rate: 890, locale: 'es-CL' },
    PEN: { code: 'PEN', symbol: 'S/.', name: 'Peruvian Sol', rate: 3.72, locale: 'es-PE' },
}

// Country code to currency mapping
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
    US: 'USD', UK: 'GBP', GB: 'GBP', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR',
    NL: 'EUR', BE: 'EUR', AT: 'EUR', PT: 'EUR', IE: 'EUR', FI: 'EUR', GR: 'EUR',
    IN: 'INR', JP: 'JPY', AU: 'AUD', CA: 'CAD', CH: 'CHF', CN: 'CNY',
    KR: 'KRW', SG: 'SGD', AE: 'AED', BR: 'BRL', MX: 'MXN', ZA: 'ZAR',
    SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN', TH: 'THB', PH: 'PHP',
    ID: 'IDR', MY: 'MYR', VN: 'VND', NZ: 'NZD', HK: 'HKD', TW: 'TWD',
    RU: 'RUB', TR: 'TRY', PK: 'PKR', BD: 'BDT', NG: 'NGN', EG: 'EGP',
    IL: 'ILS', SA: 'SAR', CO: 'COP', AR: 'ARS', CL: 'CLP', PE: 'PEN',
}

export const DEFAULT_CURRENCY = 'INR'

/**
 * Convert amount from base currency (DEFAULT_CURRENCY) to target currency
 */
export function convertPrice(amount: number, targetCurrency: string): number {
    const target = CURRENCIES[targetCurrency]
    const base = CURRENCIES[DEFAULT_CURRENCY]

    if (!target || !base) return amount

    // Convert: amount * (targetRate / baseRate)
    return amount * (target.rate / base.rate)
}

/**
 * Format price with proper currency symbol and locale
 */
export function formatPrice(
    amount: number,
    currencyCode: string,
    showOriginal: boolean = false
): string {
    const currency = CURRENCIES[currencyCode] || CURRENCIES.USD
    const convertedAmount = convertPrice(amount, currencyCode)

    // Use Intl.NumberFormat for proper formatting
    const formatter = new Intl.NumberFormat(currency.locale, {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: ['JPY', 'KRW', 'VND', 'IDR', 'INR'].includes(currency.code) ? 0 : 2,
        maximumFractionDigits: ['JPY', 'KRW', 'VND', 'IDR', 'INR'].includes(currency.code) ? 0 : 2,
    })

    const formatted = formatter.format(convertedAmount)

    if (showOriginal && currencyCode !== DEFAULT_CURRENCY) {
        const baseCurrency = CURRENCIES[DEFAULT_CURRENCY]
        return `${formatted} (~${baseCurrency.symbol}${amount})`
    }

    return formatted
}

/**
 * Get currency code from country code
 */
export function getCurrencyFromCountry(countryCode: string): string {
    return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] || DEFAULT_CURRENCY
}
