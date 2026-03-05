"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
    X,
    ShieldCheck,
    Smartphone,
    CreditCard,
    Building2,
    Wallet,
    History,
    ChevronRight,
    QrCode,
    CheckCircle2,
    Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/components/CurrencyProvider"
import { formatPrice } from "@/lib/currency"

interface PaymentModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    amount: number
    merchantName: string
    itemName: string
}

type PaymentMethod = "upi" | "card" | "netbanking" | "wallet"

interface SavedPaymentMethod {
    id: string
    type: 'upi' | 'card' | 'netbanking' | 'wallet'
    identifier: string
    maskedIdentifier: string
    holderName?: string
    isDefault: boolean
    status: 'verified' | 'pending' | 'failed'
    bankName?: string
    cardNetwork?: string
    walletProvider?: string
}

export function PaymentModal({
    isOpen,
    onClose,
    onSuccess,
    amount,
    merchantName,
    itemName
}: PaymentModalProps) {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("upi")
    const [selectedBank, setSelectedBank] = useState<string>("")
    const [phoneNumber, setPhoneNumber] = useState<string>("+91 99999 00000")
    const [isEditingPhone, setIsEditingPhone] = useState<boolean>(false)
    const [showOffers, setShowOffers] = useState<boolean>(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const { currency } = useCurrency()
    const { data: session } = useSession()
    const userName = session?.user?.name || "Akshay Gujar"
    const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([])

    // Load saved methods from localStorage
    useEffect(() => {
        if (isOpen) {
            setIsSuccess(false)
            setIsProcessing(false)
            setShowOffers(false)
        }

        const stored = localStorage.getItem('savedPaymentMethods')
        if (stored) {
            try {
                setSavedMethods(JSON.parse(stored))
            } catch (e) {
                console.error("Failed to parse saved methods", e)
            }
        }
    }, [isOpen])

    // Get up to 2 saved methods of each type
    const getGroupedSavedMethods = (type: string) => {
        return savedMethods.filter(m => m.type === type).slice(0, 2)
    }

    // Format currency using the app's currency system
    const formattedAmount = formatPrice(amount, currency)

    const handlePayment = () => {
        setIsProcessing(true)
        // Simulate payment delay
        setTimeout(() => {
            setIsProcessing(false)
            setIsSuccess(true)
            // Call success callback after another delay
            setTimeout(() => {
                onSuccess()
            }, 1500)
        }, 2000)
    }

    if (isSuccess) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-[750px] p-0 overflow-hidden border-none bg-white rounded-xl shadow-2xl">
                    <DialogTitle className="sr-only">Payment Success</DialogTitle>
                    <div className="flex flex-col items-center justify-center py-20 px-10 text-center space-y-4">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center"
                        >
                            <CheckCircle2 className="h-12 w-12" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-slate-900">Payment Successful!</h2>
                        <p className="text-slate-500">Your order is being processed. Redirecting you to the order details...</p>
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600 mt-4" />
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[850px] p-0 overflow-hidden border-none bg-transparent shadow-none gap-0">
                <DialogTitle className="sr-only">Payment Options</DialogTitle>

                <div className="flex w-full h-[550px] rounded-xl overflow-hidden shadow-2xl bg-white border border-slate-200">

                    {/* LEFT SIDEBAR - Blue */}
                    <div className="w-[320px] bg-[#0c59f0] p-6 text-white flex flex-col relative overflow-hidden">
                        {/* Decorative background elements */}
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute top-10 -right-20 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl" />

                        {/* Logo & Merchant */}
                        <div className="relative z-10 flex items-center gap-3 mb-10">
                            <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center p-2 shadow-lg">
                                <Image src="/logo.png" alt="TrueWork" width={32} height={32} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white leading-tight">{merchantName}</h3>
                                <div className="flex items-center gap-1 text-[10px] text-blue-100 font-medium">
                                    <div className="h-3 w-3 bg-green-400 rounded-full flex items-center justify-center">
                                        <ShieldCheck className="h-2 w-2 text-blue-900" />
                                    </div>
                                    TrueWork Trusted Business
                                </div>
                            </div>
                        </div>

                        {/* Price Summary */}
                        <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-xl p-5 mb-6 border border-white/10">
                            <p className="text-[10px] uppercase tracking-wider font-bold mb-1 opacity-80">Price Summary</p>
                            <h2 className="text-3xl font-black">{formattedAmount}</h2>
                            <p className="text-[10px] mt-2 text-blue-100 line-clamp-1">For: {itemName}</p>
                        </div>

                        {/* Account Info */}
                        <div className="relative z-10 space-y-4 mb-auto">
                            <div
                                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 text-[11px] font-medium cursor-pointer hover:bg-white/10 transition-all"
                                onClick={() => setIsEditingPhone(true)}
                            >
                                {isEditingPhone ? (
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        onBlur={() => setIsEditingPhone(false)}
                                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingPhone(false)}
                                        className="bg-transparent border-none outline-none text-white placeholder-white/70 w-full"
                                        placeholder="+91 XXXXX XXXXX"
                                        autoFocus
                                    />
                                ) : (
                                    <span className="opacity-70">Paying as {phoneNumber}</span>
                                )}
                                <ChevronRight className="h-3 w-3" />
                            </div>

                            {/* Offers Section */}
                            <div className="bg-white/5 rounded-lg border border-white/5 overflow-hidden">
                                <div
                                    className="flex items-center justify-between p-3 text-[11px] font-medium cursor-pointer hover:bg-white/10 transition-all"
                                    onClick={() => setShowOffers(!showOffers)}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 bg-gradient-to-br from-indigo-500 to-purple-500 rounded text-xs">💎</div>
                                        <span>Available Offers</span>
                                    </div>
                                    <ChevronRight className={`h-3 w-3 transition-transform ${showOffers ? 'rotate-90' : ''}`} />
                                </div>

                                {showOffers && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-white/10"
                                    >
                                        <div className="p-3 space-y-2">
                                            <div className="flex items-center justify-between text-[10px]">
                                                <span className="text-white/80">🅿️ UPI Cashback</span>
                                                <span className="text-green-300 font-medium">₹50 assured</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px]">
                                                <span className="text-white/80">💳 Card Discount</span>
                                                <span className="text-green-300 font-medium">1.5% instant</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px]">
                                                <span className="text-white/80">👛 Wallet Bonus</span>
                                                <span className="text-green-300 font-medium">2% extra</span>
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-white/10">
                                                <p className="text-[9px] text-white/60 text-center">Offers applied automatically at checkout</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="relative z-10 flex items-center gap-2 text-[9px] font-bold opacity-60 mt-4 uppercase tracking-[0.05em]">
                            <div className="h-4 w-4 bg-white/20 rounded-full flex items-center justify-center">
                                <ShieldCheck className="h-2 w-2" />
                            </div>
                            Money Back Promise by TrueWork
                        </div>

                    </div>

                    {/* RIGHT CONTENT - White */}
                    <div className="flex-1 flex flex-col">
                        {/* Header */}
                        <div className="px-8 py-5 flex items-center border-b bg-slate-50/50">
                            <h2 className="text-sm font-bold text-slate-700">Payment Options</h2>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Method Selection Tabs */}
                            <div className="w-[180px] border-r bg-slate-50/30 flex flex-col py-2">
                                <p className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommended</p>

                                <MethodTab
                                    active={selectedMethod === "upi"}
                                    icon={<Smartphone className="h-4 w-4" />}
                                    label="UPI"
                                    sublabel="6 Offers"
                                    onClick={() => setSelectedMethod("upi")}
                                />
                                <MethodTab
                                    active={selectedMethod === "card"}
                                    icon={<CreditCard className="h-4 w-4" />}
                                    label="Cards"
                                    sublabel="1.5% savings"
                                    onClick={() => setSelectedMethod("card")}
                                />

                                <p className="px-6 py-3 mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Other Options</p>
                                <MethodTab
                                    active={selectedMethod === "netbanking"}
                                    icon={<Building2 className="h-4 w-4" />}
                                    label="Netbanking"
                                    sublabel="All banks"
                                    onClick={() => setSelectedMethod("netbanking")}
                                />
                                <MethodTab
                                    active={selectedMethod === "wallet"}
                                    icon={<Wallet className="h-4 w-4" />}
                                    label="Wallets"
                                    sublabel="6 options"
                                    onClick={() => setSelectedMethod("wallet")}
                                />
                            </div>

                            {/* Method Detail Area */}
                            <div className="flex-1 bg-white flex flex-col overflow-y-auto">
                                <div className="p-8 space-y-6">

                                    {selectedMethod === "upi" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-6"
                                        >
                                            {/* UPI Options */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4 cursor-pointer hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                                            <QrCode className="h-6 w-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">Scan QR Code</p>
                                                            <p className="text-[10px] text-blue-600 font-medium">Pay with any UPI app</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 p-4 cursor-pointer hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center">
                                                            <Smartphone className="h-6 w-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">Enter UPI ID</p>
                                                            <p className="text-[10px] text-green-600 font-medium">Pay directly</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* QR Code Section */}
                                            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30">
                                                <div className="h-48 w-48 bg-white p-4 rounded-2xl shadow-lg border border-slate-200 mb-6 relative">
                                                    <QrCode className="h-full w-full text-slate-800 p-4" />
                                                    {isProcessing && (
                                                        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                                                            <div className="text-center">
                                                                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-2" />
                                                                <p className="text-sm text-slate-600 font-medium">Processing...</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Scan with any UPI App</p>
                                                <div className="flex gap-6 mb-4">
                                                    {/* Popular UPI Apps */}
                                                    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200">
                                                        <span className="text-lg">🅿️</span>
                                                        <span className="text-xs font-medium">Paytm</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200">
                                                        <span className="text-lg">🇬</span>
                                                        <span className="text-xs font-medium">GPay</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200">
                                                        <span className="text-lg">📱</span>
                                                        <span className="text-xs font-medium">PhonePe</span>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-slate-400">Get up to ₹50 assured cashback</p>
                                            </div>

                                            {/* Saved UPI IDs */}
                                            {getGroupedSavedMethods("upi").length > 0 && (
                                                <div className="space-y-3">
                                                    <label className="text-xs font-bold text-slate-700">Saved UPI IDs</label>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {getGroupedSavedMethods("upi").map((method) => (
                                                            <button
                                                                key={method.id}
                                                                onClick={handlePayment}
                                                                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-blue-400 hover:shadow-sm transition-all text-left"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                                                        <Smartphone className="h-4 w-4" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-bold text-slate-800">{method.maskedIdentifier}</p>
                                                                        <p className="text-[10px] text-slate-500">{method.holderName}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="h-5 w-5 rounded-full border border-slate-200 flex items-center justify-center">
                                                                    <div className="h-3 w-3 rounded-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* UPI ID Input */}
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold text-slate-700">Or Enter UPI ID</label>
                                                <div className="flex gap-3">
                                                    <input
                                                        type="text"
                                                        placeholder="yourname@upi"
                                                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-400 transition-all"
                                                    />
                                                    <Button
                                                        onClick={handlePayment}
                                                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-[46px] px-8 rounded-xl font-bold shadow-lg transition-all"
                                                        disabled={isProcessing}
                                                    >
                                                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "PAY NOW"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {selectedMethod === "card" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-6"
                                        >
                                            <div className="text-center mb-6">
                                                <div className="h-16 w-16 bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <CreditCard className="h-8 w-8" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800 mb-2">Credit/Debit Cards</h3>
                                                <p className="text-sm text-slate-500">Save 1.5% on all card payments</p>
                                            </div>

                                            {/* Saved Cards */}
                                            {getGroupedSavedMethods("card").length > 0 && (
                                                <div className="space-y-3">
                                                    <label className="text-xs font-bold text-slate-700">Saved Cards</label>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {getGroupedSavedMethods("card").map((method) => (
                                                            <button
                                                                key={method.id}
                                                                onClick={handlePayment}
                                                                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-purple-400 hover:shadow-sm transition-all text-left"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-8 w-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                                                                        <CreditCard className="h-4 w-4" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-bold text-slate-800">{method.maskedIdentifier}</p>
                                                                        <p className="text-[10px] text-slate-500">{method.holderName} • {method.cardNetwork?.toUpperCase()}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="h-5 w-5 rounded-full border border-slate-200 flex items-center justify-center">
                                                                    <div className="h-3 w-3 rounded-full bg-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-700 mb-2 block">Card Number</label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            placeholder="1234 5678 9012 3456"
                                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-400 transition-all"
                                                        />
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                                                            <span className="text-xl">🇻</span>
                                                            <span className="text-xl">🇲</span>
                                                            <span className="text-xl">🇦</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-700 mb-2 block">Expiry Date</label>
                                                        <input
                                                            type="text"
                                                            placeholder="MM/YY"
                                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-400 transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-700 mb-2 block">CVV</label>
                                                        <input
                                                            type="text"
                                                            placeholder="123"
                                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-400 transition-all"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs font-bold text-slate-700 mb-2 block">Cardholder Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Akshay Gujar"
                                                        defaultValue={userName}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-400 transition-all"
                                                    />
                                                </div>

                                                <Button
                                                    onClick={handlePayment}
                                                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 h-[46px] rounded-xl font-bold shadow-lg transition-all"
                                                    disabled={isProcessing}
                                                >
                                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "PAY WITH CARD"}
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {selectedMethod === "netbanking" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-6"
                                        >
                                            <div className="text-center mb-6">
                                                <div className="h-16 w-16 bg-gradient-to-br from-teal-100 to-cyan-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Building2 className="h-8 w-8" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800 mb-2">Netbanking</h3>
                                                <p className="text-sm text-slate-500">Select your bank to continue</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                {['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'PNB'].map((bank) => (
                                                    <button
                                                        key={bank}
                                                        onClick={() => setSelectedBank(bank)}
                                                        className={`p-3 rounded-xl border transition-all text-left relative ${selectedBank === bank
                                                            ? 'bg-teal-50 border-teal-400 shadow-md'
                                                            : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-teal-400 hover:shadow-md'
                                                            }`}
                                                    >
                                                        <p className={`text-sm font-medium ${selectedBank === bank ? 'text-teal-700' : 'text-slate-800'}`}>
                                                            {bank}
                                                        </p>
                                                        {selectedBank === bank && (
                                                            <div className="absolute top-2 right-2 h-4 w-4 bg-teal-600 rounded-full flex items-center justify-center">
                                                                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>

                                            <Button
                                                onClick={handlePayment}
                                                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 h-[46px] rounded-xl font-bold shadow-lg transition-all"
                                                disabled={isProcessing}
                                            >
                                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "CONTINUE TO BANK"}
                                            </Button>
                                        </motion.div>
                                    )}

                                    {selectedMethod === "wallet" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-6"
                                        >
                                            <div className="text-center mb-6">
                                                <div className="h-16 w-16 bg-gradient-to-br from-orange-100 to-amber-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Wallet className="h-8 w-8" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800 mb-2">Wallets</h3>
                                                <p className="text-sm text-slate-500">Pay with your preferred wallet</p>
                                            </div>

                                            {/* Saved Wallets */}
                                            {getGroupedSavedMethods("wallet").length > 0 && (
                                                <div className="space-y-3">
                                                    <label className="text-xs font-bold text-slate-700">Saved Wallets</label>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {getGroupedSavedMethods("wallet").map((method) => (
                                                            <button
                                                                key={method.id}
                                                                onClick={handlePayment}
                                                                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-orange-400 hover:shadow-sm transition-all text-left"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-8 w-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                                                                        <Wallet className="h-4 w-4" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-bold text-slate-800">{method.maskedIdentifier}</p>
                                                                        <p className="text-[10px] text-slate-500">{method.walletProvider}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="h-5 w-5 rounded-full border border-slate-200 flex items-center justify-center">
                                                                    <div className="h-3 w-3 rounded-full bg-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-3">
                                                {['Paytm Wallet', 'PhonePe Wallet', 'Amazon Pay', 'Mobikwik', 'Freecharge', 'Binance Pay'].map((wallet) => (
                                                    <button
                                                        key={wallet}
                                                        className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-orange-400 hover:shadow-md transition-all text-center"
                                                    >
                                                        <div className="text-2xl mb-2">
                                                            {wallet === 'Paytm Wallet' && '🅿️'}
                                                            {wallet === 'PhonePe Wallet' && '📱'}
                                                            {wallet === 'Amazon Pay' && '📦'}
                                                            {wallet === 'Mobikwik' && '💰'}
                                                            {wallet === 'Freecharge' && '⚡'}
                                                            {wallet === 'Binance Pay' && '🪙'}
                                                        </div>
                                                        <p className="text-xs font-medium text-slate-800">{wallet}</p>
                                                    </button>
                                                ))}
                                            </div>

                                            <Button
                                                onClick={handlePayment}
                                                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 h-[46px] rounded-xl font-bold shadow-lg transition-all"
                                                disabled={isProcessing}
                                            >
                                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "PAY WITH WALLET"}
                                            </Button>
                                        </motion.div>
                                    )}

                                </div>
                            </div>
                        </div>

                        {/* Bottom Bar */}
                        <div className="px-8 py-4 border-t flex items-center justify-between text-[11px] text-slate-400 font-medium">
                            <p>By proceeding, I agree to TrueWork's Privacy Notice</p>
                            <div className="flex items-center gap-1 text-slate-600">
                                <ShieldCheck className="h-3 w-3 text-green-500" />
                                Standard Protection Secure
                            </div>
                        </div>
                    </div>
                </div>

                {/* Extra info under modal */}
                <div className="mt-4 text-center">
                    <p className="text-[10px] text-white/50 font-medium tracking-wide flex items-center justify-center gap-1">
                        POWERED BY <span className="text-white font-bold">TRUEPAY</span> GATEWAY v2.0.4
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function MethodTab({
    active,
    icon,
    label,
    sublabel,
    onClick
}: {
    active: boolean;
    icon: React.ReactNode;
    label: string;
    sublabel?: string;
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-6 py-4 flex items-center gap-4 text-left transition-all relative overflow-hidden group",
                active ? "bg-white text-blue-600 shadow-[inset_4px_0_0_0_#0c59f0]" : "text-slate-500 hover:bg-slate-100/50"
            )}
        >
            <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                active ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400 group-hover:text-slate-600"
            )}>
                {icon}
            </div>
            <div>
                <p className={cn("text-xs font-bold leading-tight", active ? "text-slate-900" : "text-slate-600")}>{label}</p>
                {sublabel && <p className={cn("text-[9px] font-bold leading-tight mt-0.5", active ? "text-blue-600" : "text-slate-400")}>{sublabel}</p>}
            </div>
            {active && (
                <motion.div
                    layoutId="active-bg"
                    className="absolute inset-0 bg-blue-50/10 pointer-events-none"
                />
            )}
        </button>
    )
}
