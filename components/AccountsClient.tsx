"use client"

import React, { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
    Plus,
    CreditCard,
    Smartphone,
    Building2,
    Wallet,
    Check,
    AlertCircle,
    Shield,
    Trash2,
    Star,
    IndianRupee
} from "lucide-react"
import {
    addPaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    addPayoutAccount,
    deletePayoutAccount,
    setPrimaryPayoutAccount
} from "@/app/actions/payment"

interface AccountsClientProps {
    initialPaymentMethods: any[]
    initialPayoutAccounts: any[]
    userName: string
}

export default function AccountsClient({ initialPaymentMethods, initialPayoutAccounts, userName }: AccountsClientProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const [savedPaymentMethods, setSavedPaymentMethods] = useState(initialPaymentMethods)
    const [payoutAccounts, setPayoutAccounts] = useState(initialPayoutAccounts)

    // Sync props to state when server revalidates
    useEffect(() => {
        setSavedPaymentMethods(initialPaymentMethods)
    }, [initialPaymentMethods])

    useEffect(() => {
        setPayoutAccounts(initialPayoutAccounts)
    }, [initialPayoutAccounts])

    const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false)
    const [showAddPayoutDialog, setShowAddPayoutDialog] = useState(false)
    const [autoSelectLastUsed, setAutoSelectLastUsed] = useState(true)

    // Form states for Payment Methods
    const [paymentTab, setPaymentTab] = useState("upi")
    const [upiId, setUpiId] = useState("")
    const [isDefault, setIsDefault] = useState(false)
    const [cardNumber, setCardNumber] = useState("")
    const [cardExpiry, setCardExpiry] = useState("")
    const [cardCvv, setCardCvv] = useState("")
    const [cardHolder, setCardHolder] = useState(userName)
    const [selectedBank, setSelectedBank] = useState("")
    const [walletProvider, setWalletProvider] = useState("")
    const [walletMobile, setWalletMobile] = useState("")

    // Form states for Payout Accounts
    const [payoutTab, setPayoutTab] = useState("upi")
    const [payoutUpiId, setPayoutUpiId] = useState("")
    const [payoutAccountHolder, setPayoutAccountHolder] = useState(userName)
    const [payoutBankName, setPayoutBankName] = useState("")
    const [payoutAccountNumber, setPayoutAccountNumber] = useState("")
    const [payoutIfsc, setPayoutIfsc] = useState("")
    const [payoutIsPrimary, setPayoutIsPrimary] = useState(false)

    const handleAddPaymentMethod = () => {
        let identifier = ""
        let maskedIdentifier = ""
        let type = paymentTab

        if (type === 'upi') {
            identifier = upiId
            maskedIdentifier = upiId.replace(/^(.{1}).*(@.*)$/, "$1***$2")
        } else if (type === 'card') {
            identifier = cardNumber
            maskedIdentifier = `•••• •••• •••• ${cardNumber.slice(-4)}`
        } else if (type === 'netbanking') {
            identifier = selectedBank
            maskedIdentifier = selectedBank
        } else if (type === 'wallet') {
            identifier = walletMobile
            maskedIdentifier = walletMobile.replace(/^(.{3}).*(.{2})$/, "$1*****$2")
        }

        const newMethodData = {
            type,
            identifier,
            maskedIdentifier: maskedIdentifier || identifier,
            holderName: cardHolder || userName,
            isDefault: isDefault,
            bankName: type === 'netbanking' ? selectedBank : undefined,
            walletProvider: type === 'wallet' ? walletProvider : undefined
        }

        startTransition(async () => {
            await addPaymentMethod(newMethodData)
            setShowAddPaymentDialog(false)
            resetPaymentForm()
        })
    }

    const resetPaymentForm = () => {
        setUpiId("")
        setCardNumber("")
        setCardExpiry("")
        setCardCvv("")
        setIsDefault(false)
        setSelectedBank("")
        setWalletProvider("")
        setWalletMobile("")
    }

    const handleAddPayoutAccount = () => {
        const type = payoutTab

        const newAccountData = {
            type,
            identifier: type === 'upi' ? payoutUpiId : payoutAccountNumber,
            holderName: payoutAccountHolder || userName,
            isPrimary: payoutIsPrimary,
            bankName: payoutBankName,
            accountNumber: type === 'bank' ? payoutAccountNumber : undefined,
            ifsc: type === 'bank' ? payoutIfsc : undefined
        }

        startTransition(async () => {
            await addPayoutAccount(newAccountData)
            setShowAddPayoutDialog(false)
            resetPayoutForm()
        })
    }

    const resetPayoutForm = () => {
        setPayoutUpiId("")
        setPayoutAccountHolder(userName)
        setPayoutBankName("")
        setPayoutAccountNumber("")
        setPayoutIfsc("")
        setPayoutIsPrimary(false)
    }

    const getPaymentIcon = (type: string) => {
        switch (type) {
            case 'upi':
                return <Smartphone className="h-4 w-4" />
            case 'card':
                return <CreditCard className="h-4 w-4" />
            case 'netbanking':
                return <Building2 className="h-4 w-4" />
            case 'wallet':
                return <Wallet className="h-4 w-4" />
            default:
                return <CreditCard className="h-4 w-4" />
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'verified':
                return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200"><Check className="h-3 w-3 mr-1" />Verified</Badge>
            case 'pending':
                return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>
            case 'failed':
                return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>
            default:
                return null
        }
    }

    const handleSetDefaultPayment = (id: string) => {
        startTransition(async () => {
            await setDefaultPaymentMethod(id)
        })
    }

    const handleSetPrimaryPayout = (id: string) => {
        startTransition(async () => {
            await setPrimaryPayoutAccount(id)
        })
    }

    const handleRemovePaymentMethod = (id: string) => {
        startTransition(async () => {
            await deletePaymentMethod(id)
        })
    }

    const handleRemovePayoutAccount = (id: string) => {
        startTransition(async () => {
            await deletePayoutAccount(id)
        })
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                    <div className="inline-flex items-center rounded-full border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                        <Shield className="mr-1.5 h-3.5 w-3.5" />
                        Payments & Payouts
                    </div>
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">Accounts</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage how you pay and get paid across all your projects.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Dialog open={showAddPaymentDialog} onOpenChange={setShowAddPaymentDialog}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 px-4" disabled={isPending}>
                                <Plus className="h-4 w-4" />
                                Add Account
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Add Payment Method</DialogTitle>
                                <DialogDescription>
                                    Add a new payment method for purchases and services
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <Tabs defaultValue="upi" onValueChange={setPaymentTab} className="w-full">
                                    <TabsList className="grid w-full grid-cols-4">
                                        <TabsTrigger value="upi">UPI</TabsTrigger>
                                        <TabsTrigger value="card">Card</TabsTrigger>
                                        <TabsTrigger value="netbanking">Bank</TabsTrigger>
                                        <TabsTrigger value="wallet">Wallet</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="upi" className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="upi-id">UPI ID</Label>
                                            <Input
                                                id="upi-id"
                                                placeholder="eg. prnavgpay@upi"
                                                value={upiId}
                                                onChange={(e) => setUpiId(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="upi-name">Account Holder Name</Label>
                                            <Input id="upi-name" value={userName} placeholder="Akshay Gujar" readOnly />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="upi-default"
                                                checked={isDefault}
                                                onCheckedChange={(checked) => setIsDefault(checked === true)}
                                            />
                                            <Label htmlFor="upi-default">Set as default payment method</Label>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Use this UPI to pay for projects and services
                                        </p>
                                    </TabsContent>
                                    <TabsContent value="card" className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="card-number">Card Number</Label>
                                            <Input
                                                id="card-number"
                                                placeholder="4242 4242 4242 4242"
                                                value={cardNumber}
                                                onChange={(e) => setCardNumber(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="expiry">Expiry Date</Label>
                                                <Input
                                                    id="expiry"
                                                    placeholder="MM/YY"
                                                    value={cardExpiry}
                                                    onChange={(e) => setCardExpiry(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="cvv">CVV</Label>
                                                <Input
                                                    id="cvv"
                                                    placeholder="123"
                                                    value={cardCvv}
                                                    onChange={(e) => setCardCvv(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="card-name">Cardholder Name</Label>
                                            <Input
                                                id="card-name"
                                                placeholder="Akshay Gujar"
                                                value={cardHolder}
                                                onChange={(e) => setCardHolder(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="save-card"
                                                checked={isDefault}
                                                onCheckedChange={(checked) => setIsDefault(checked === true)}
                                            />
                                            <Label htmlFor="save-card">Save card for future payments</Label>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Cards are securely tokenized and never stored directly
                                        </p>
                                    </TabsContent>
                                    <TabsContent value="netbanking" className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="bank-select">Select Bank</Label>
                                            <Select value={selectedBank} onValueChange={setSelectedBank}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choose your bank" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="sbi">State Bank of India</SelectItem>
                                                    <SelectItem value="hdfc">HDFC Bank</SelectItem>
                                                    <SelectItem value="icici">ICICI Bank</SelectItem>
                                                    <SelectItem value="axis">Axis Bank</SelectItem>
                                                    <SelectItem value="kotak">Kotak Bank</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="account-name">Account Holder Name (Optional)</Label>
                                            <Input
                                                id="account-name"
                                                placeholder="Akshay Gujar"
                                                value={cardHolder}
                                                onChange={(e) => setCardHolder(e.target.value)}
                                            />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            You'll be redirected to your bank to complete payment
                                        </p>
                                    </TabsContent>
                                    <TabsContent value="wallet" className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="wallet-select">Wallet Provider</Label>
                                            <Select value={walletProvider} onValueChange={setWalletProvider}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choose wallet" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="paytm">Paytm</SelectItem>
                                                    <SelectItem value="phonepe">PhonePe</SelectItem>
                                                    <SelectItem value="gpay">Google Pay</SelectItem>
                                                    <SelectItem value="mobikwik">MobiKwik</SelectItem>
                                                    <SelectItem value="amazonpay">Amazon Pay</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="wallet-mobile">Mobile Number / Email</Label>
                                            <Input
                                                id="wallet-mobile"
                                                placeholder="+91 98765 43210"
                                                value={walletMobile}
                                                onChange={(e) => setWalletMobile(e.target.value)}
                                            />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Pay securely using your wallet balance
                                        </p>
                                    </TabsContent>
                                </Tabs>
                                <Button onClick={handleAddPaymentMethod} className="w-full" disabled={isPending}>
                                    {isPending ? "Adding..." : "Add Payment Method"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Saved Payment Methods */}
            <Card className="border border-border/70 bg-background/60 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <span>Saved Payment Methods</span>
                    </CardTitle>
                    <CardDescription>
                        Payment methods used for spending on projects and services
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {savedPaymentMethods.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
                            <CreditCard className="mb-3 h-10 w-10 text-muted-foreground" />
                            <p className="mb-2 text-sm font-medium text-foreground">No payment methods yet</p>
                            <p className="mb-4 text-xs text-muted-foreground max-w-xs">
                                Add a card, UPI, or another method to speed up future checkouts.
                            </p>
                            <Button onClick={() => setShowAddPaymentDialog(true)} size="sm" className="gap-2 px-4">
                                <Plus className="h-4 w-4" />
                                Add Payment Method
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {savedPaymentMethods.map((method) => (
                                <div
                                    key={method.id}
                                    className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4 transition-colors hover:bg-muted/70 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-background">
                                            {getPaymentIcon(method.type)}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-medium">{method.maskedIdentifier}</span>
                                                {method.cardNetwork && (
                                                    <span className="rounded-full bg-background px-2 py-0.5 text-xs uppercase text-muted-foreground">
                                                        {method.cardNetwork}
                                                    </span>
                                                )}
                                                {method.isDefault && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        <Star className="mr-1 h-3 w-3" />
                                                        Default
                                                    </Badge>
                                                )}
                                            </div>
                                            {method.holderName && (
                                                <p className="text-xs text-muted-foreground">{method.holderName}</p>
                                            )}
                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                {getStatusBadge(method.status)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-1 sm:gap-2">
                                        {!method.isDefault && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-dashed"
                                                onClick={() => handleSetDefaultPayment(method.id)}
                                                disabled={isPending}
                                            >
                                                Set default
                                            </Button>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => handleRemovePaymentMethod(method.id)}
                                            disabled={isPending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Payout Accounts */}
            <Card className="border border-border/70 bg-background/60 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                            <IndianRupee className="h-5 w-5" />
                        </div>
                        <span>Payout Accounts</span>
                    </CardTitle>
                    <CardDescription>
                        Accounts for receiving freelancer earnings, refunds, and withdrawals
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground max-w-xl">
                            Only UPI and bank accounts are supported for payouts. Add at least one verified account to
                            withdraw your earnings.
                        </p>
                        <Dialog open={showAddPayoutDialog} onOpenChange={setShowAddPayoutDialog}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 px-3" disabled={isPending}>
                                    <Plus className="h-4 w-4" />
                                    Add Payout Account
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Add Payout Account</DialogTitle>
                                    <DialogDescription>
                                        Add an account to receive payments and withdrawals
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <Tabs defaultValue="upi" onValueChange={setPayoutTab} className="w-full">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="upi">UPI</TabsTrigger>
                                            <TabsTrigger value="bank">Bank Account</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="upi" className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="payout-upi-id">UPI ID</Label>
                                                <Input
                                                    id="payout-upi-id"
                                                    placeholder="eg. prnavgpay@upi"
                                                    value={payoutUpiId}
                                                    onChange={(e) => setPayoutUpiId(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="payout-upi-name">Account Holder Name</Label>
                                                <Input id="payout-upi-name" value={userName} placeholder="Akshay Gujar" readOnly />
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="payout-upi-primary"
                                                    checked={payoutIsPrimary}
                                                    onCheckedChange={(checked) => setPayoutIsPrimary(checked === true)}
                                                />
                                                <Label htmlFor="payout-upi-primary">Set as primary payout account</Label>
                                            </div>
                                        </TabsContent>
                                        <TabsContent value="bank" className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="bank-holder">Account Holder Name</Label>
                                                <Input
                                                    id="bank-holder"
                                                    placeholder="Akshay Gujar"
                                                    value={payoutAccountHolder}
                                                    onChange={(e) => setPayoutAccountHolder(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="bank-name">Bank Name</Label>
                                                <Select value={payoutBankName} onValueChange={setPayoutBankName}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select bank" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="sbi">State Bank of India</SelectItem>
                                                        <SelectItem value="hdfc">HDFC Bank</SelectItem>
                                                        <SelectItem value="icici">ICICI Bank</SelectItem>
                                                        <SelectItem value="axis">Axis Bank</SelectItem>
                                                        <SelectItem value="kotak">Kotak Bank</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="account-number">Account Number</Label>
                                                <Input
                                                    id="account-number"
                                                    placeholder="1234567890"
                                                    value={payoutAccountNumber}
                                                    onChange={(e) => setPayoutAccountNumber(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="ifsc-code">IFSC Code</Label>
                                                <Input
                                                    id="ifsc-code"
                                                    placeholder="SBIN0000001"
                                                    value={payoutIfsc}
                                                    onChange={(e) => setPayoutIfsc(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="payout-bank-primary"
                                                    checked={payoutIsPrimary}
                                                    onCheckedChange={(checked) => setPayoutIsPrimary(checked === true)}
                                                />
                                                <Label htmlFor="payout-bank-primary">Set as primary payout account</Label>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                    <Button onClick={handleAddPayoutAccount} className="w-full" disabled={isPending}>
                                        {isPending ? "Adding..." : "Add Payout Account"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                    {payoutAccounts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
                            <IndianRupee className="mb-3 h-10 w-10 text-muted-foreground" />
                            <p className="mb-2 text-sm font-medium text-foreground">No payout accounts added</p>
                            <p className="mb-4 text-xs text-muted-foreground max-w-xs">
                                Add a UPI ID or bank account to receive payouts, refunds, and withdrawals.
                            </p>
                            <Button onClick={() => setShowAddPayoutDialog(true)} variant="outline" size="sm" className="gap-2 px-4">
                                <Plus className="h-4 w-4" />
                                Add Payout Account
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {payoutAccounts.map((account) => (
                                <div
                                    key={account.id}
                                    className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4 transition-colors hover:bg-muted/70 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-background">
                                            {account.type === 'upi' ?
                                                <Smartphone className="h-4 w-4" /> :
                                                <Building2 className="h-4 w-4" />
                                            }
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-medium">
                                                    {account.type === 'upi' ? account.identifier : account.accountNumber}
                                                </span>
                                                {account.bankName && (
                                                    <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                                                        {account.bankName}
                                                    </span>
                                                )}
                                                {account.isPrimary && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        <Star className="mr-1 h-3 w-3" />
                                                        Primary
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">{account.holderName}</p>
                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                {getStatusBadge(account.status)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-1 sm:gap-2">
                                        {!account.isPrimary && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-dashed"
                                                onClick={() => handleSetPrimaryPayout(account.id)}
                                                disabled={isPending}
                                            >
                                                Set primary
                                            </Button>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => handleRemovePayoutAccount(account.id)}
                                            disabled={isPending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Default & Preferences */}
            <Card className="border border-border/70 bg-background/60 shadow-sm">
                <CardHeader>
                    <CardTitle>Default & Preferences</CardTitle>
                    <CardDescription>
                        Configure your default payment and payout preferences
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                                <Label htmlFor="default-payment">Default Payment Method</Label>
                                <p className="text-sm text-muted-foreground">
                                    Used for project payments and service purchases
                                </p>
                            </div>
                            <Select
                                defaultValue={savedPaymentMethods.find((m: any) => m.isDefault)?.id || ""}
                                value={savedPaymentMethods.find((m: any) => m.isDefault)?.id || ""}
                                onValueChange={handleSetDefaultPayment}
                                disabled={isPending}
                            >
                                <SelectTrigger className="w-full sm:w-64">
                                    <SelectValue placeholder="Select default" />
                                </SelectTrigger>
                                <SelectContent>
                                    {savedPaymentMethods.map((method) => (
                                        <SelectItem key={method.id} value={method.id}>
                                            {method.maskedIdentifier}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                                <Label htmlFor="primary-payout">Primary Payout Account</Label>
                                <p className="text-sm text-muted-foreground">
                                    Used for receiving earnings and refunds
                                </p>
                            </div>
                            <Select
                                defaultValue={payoutAccounts.find((a: any) => a.isPrimary)?.id || ""}
                                value={payoutAccounts.find((a: any) => a.isPrimary)?.id || ""}
                                onValueChange={handleSetPrimaryPayout}
                                disabled={isPending}
                            >
                                <SelectTrigger className="w-full sm:w-64">
                                    <SelectValue placeholder="Select primary" />
                                </SelectTrigger>
                                <SelectContent>
                                    {payoutAccounts.map((account) => (
                                        <SelectItem key={account.id} value={account.id}>
                                            {account.type === 'upi' ? account.identifier : `${account.bankName} - ${account.accountNumber}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                                <Label htmlFor="auto-select">Auto-select last used payment method</Label>
                                <p className="text-sm text-muted-foreground">
                                    Automatically select your most recently used payment method at checkout
                                </p>
                            </div>
                            <Checkbox
                                id="auto-select"
                                checked={autoSelectLastUsed}
                                onCheckedChange={(checked) => setAutoSelectLastUsed(checked as boolean)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>


            {/* Footer */}
            <div className="border-t pt-6 text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Secure &amp; Encrypted</span>
                </div>
                <p className="mx-auto max-w-2xl text-xs text-muted-foreground">
                    All payment details are encrypted and securely stored. We use industry-standard security measures to protect your financial information.
                </p>
            </div>
        </div>
    )
}
