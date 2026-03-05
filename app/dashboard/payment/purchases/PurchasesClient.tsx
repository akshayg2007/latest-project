"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import Link from "next/link"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Search,
    Filter,
    ShoppingBag,
    Download,
    Calendar,
    User,
    FileText,
    ExternalLink,
    Receipt,
    ChevronDown,
    Clock,
    AlertCircle,
    Check
} from "lucide-react"
import { StatPrice } from "@/components/DashboardPrice"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu"

export default function PurchasesClient({
    transformedOrders,
    totalSpent,
    deliveredCount,
    inProgressCount
}: {
    transformedOrders: any[],
    totalSpent: number,
    deliveredCount: number,
    inProgressCount: number
}) {
    const [searchQuery, setSearchQuery] = useState("")
    const [filterType, setFilterType] = useState<string>("all")

    const filteredOrders = useMemo(() => {
        return transformedOrders.filter(order => {
            // Search Filter
            const searchLower = searchQuery.toLowerCase()
            const matchesSearch =
                order.title.toLowerCase().includes(searchLower) ||
                order.seller.toLowerCase().includes(searchLower) ||
                order.id.toLowerCase().includes(searchLower)

            // Category/Status Filter
            let matchesFilter = true
            if (filterType === 'products') matchesFilter = order.type === 'product'
            if (filterType === 'services') matchesFilter = order.type === 'service'
            if (filterType === 'completed') matchesFilter = order.status === 'completed' || (order.status === 'paid' && order.type === 'product')
            if (filterType === 'in_progress') matchesFilter = order.status === 'pending' || order.status === 'in_progress' || (order.status === 'paid' && order.type === 'service')

            return matchesSearch && matchesFilter
        })
    }, [transformedOrders, searchQuery, filterType])

    const getFilterLabel = () => {
        switch (filterType) {
            case 'products': return 'Products'
            case 'services': return 'Services'
            case 'completed': return 'Completed'
            case 'in_progress': return 'In Progress'
            default: return 'All Orders'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-lg font-semibold md:text-2xl">My Purchases</h1>
                <p className="text-muted-foreground mt-1">
                    View and manage your order history
                </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search orders..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="min-w-[100px]">
                            <Filter className="h-4 w-4 mr-2" />
                            {getFilterLabel()}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setFilterType('all')}>
                            {filterType === 'all' && <Check className="h-4 w-4 mr-2" />}
                            All Orders
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterType('products')}>
                            {filterType === 'products' && <Check className="h-4 w-4 mr-2" />}
                            Products Only
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterType('services')}>
                            {filterType === 'services' && <Check className="h-4 w-4 mr-2" />}
                            Services Only
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setFilterType('completed')}>
                            {filterType === 'completed' && <Check className="h-4 w-4 mr-2" />}
                            Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterType('in_progress')}>
                            {filterType === 'in_progress' && <Check className="h-4 w-4 mr-2" />}
                            In Progress
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <Card>
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4">
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Orders</p>
                        <p className="text-xl sm:text-2xl font-bold mt-1">{transformedOrders.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4">
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Spent</p>
                        <p className="text-xl sm:text-2xl font-bold mt-1">
                            <StatPrice amount={totalSpent} />
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4">
                        <p className="text-xs sm:text-sm text-muted-foreground">Delivered</p>
                        <p className="text-xl sm:text-2xl font-bold mt-1 text-green-600">{deliveredCount}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 p-3 sm:p-6 sm:pt-4">
                        <p className="text-xs sm:text-sm text-muted-foreground">In Progress</p>
                        <p className="text-xl sm:text-2xl font-bold mt-1 text-blue-600">{inProgressCount}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Orders Grid */}
            {filteredOrders.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredOrders.map((order: any) => (
                        <OrderCard key={order.id} order={order} />
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold">No Purchases Found</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {searchQuery ? "Try adjusting your search or filters." : "Your order history will appear here."}
                        </p>
                        {!searchQuery && (
                            <Link href="/dashboard/explore">
                                <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                                    Browse Services
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function OrderCard({ order }: {
    order: {
        id: string
        title: string
        seller: string
        price: number
        purchaseDate: Date
        status: string
        deliveryDate: Date | null
        type: 'product' | 'service'
        downloadUrls: string[]
        billingName: string
        sellerName: string
        deadline?: string | null
    }
}) {
    const statusConfig: Record<string, { label: string; color: string }> = {
        completed: { label: "Delivered", color: "bg-green-100 text-green-700" },
        paid: {
            label: order.type === 'product' ? "Completed" : "In Progress",
            color: order.type === 'product' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
        },
        pending: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
        in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
        cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
    }

    const status = statusConfig[order.status] || statusConfig.pending

    const handleDownload = (url: string) => {
        window.open(url, '_blank')
    }

    const handlePrintInvoice = () => {
        const invoiceWindow = window.open('', '_blank')
        if (!invoiceWindow) return

        const inrAmount = order.price // Now uses price directly as Rupees

        const invoiceHtml = `
            <html>
                <head>
                    <title>Invoice #${order.id.slice(0, 8)}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
                    <style>
                        @page { size: A4; margin: 0; }
                        body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 0; margin: 0; color: #0f172a; line-height: 1.5; background: white; }
                        .container { padding: 60px; max-width: 800px; margin: 0 auto; }
                        
                        /* Header Section */
                        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 60px; }
                        .brand { display: flex; align-items: center; gap: 10px; }
                        .logo-img { width: 32px; height: 32px; object-fit: contain; }
                        .logo-text { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
                        
                        .marketplace-info { font-size: 13px; color: #64748b; margin-top: 10px; font-weight: 500; }
                        .marketplace-info a { color: #2563eb; text-decoration: none; }
                        
                        .invoice-meta { text-align: right; }
                        .invoice-title { font-size: 36px; font-weight: 800; color: #1e293b; margin: 0 0 15px 0; letter-spacing: -1px; }
                        .meta-item { font-size: 14px; margin-bottom: 6px; display: flex; justify-content: flex-end; gap: 10px; }
                        .label { color: #64748b; font-weight: 500; width: 80px; text-align: right; }
                        .value { font-weight: 700; color: #0f172a; }

                        /* Billing Grid */
                        .billing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 60px; }
                        .billing-box { padding: 24px; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; }
                        .billing-box h3 { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 1.5px; margin: 0 0 15px 0; }
                        .contact-name { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
                        .contact-detail { font-size: 13px; color: #64748b; font-weight: 500; }

                        /* Table Section */
                        table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 40px; }
                        thead th { text-align: left; padding: 16px 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; letter-spacing: 0.5px; }
                        tbody td { padding: 24px 20px; border-bottom: 1px solid #f1f5f9; font-size: 15px; vertical-align: top; }
                        .item-desc { font-weight: 700; font-size: 16px; color: #0f172a; margin-bottom: 6px; }
                        .item-sub { color: #64748b; font-size: 13px; font-weight: 500; }

                        /* Summary Section */
                        .summary-container { display: flex; justify-content: flex-end; }
                        .summary-box { width: 320px; background: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #f1f5f9; }
                        .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #64748b; font-weight: 500; }
                        .summary-row.total { border-top: 1px solid #e2e8f0; margin-top: 15px; padding-top: 20px; font-weight: 800; font-size: 26px; color: #2563eb; }

                        /* Footer */
                        .footer { margin-top: 80px; padding-top: 40px; border-top: 1px solid #f1f5f9; text-align: center; }
                        .footer-text { font-size: 13px; color: #94a3b8; max-width: 480px; margin: 0 auto; font-weight: 500; line-height: 1.6; }
                        .support-info { font-size: 14px; font-weight: 700; color: #475569; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="brand">
                                <img src="${window.location.origin}/logo.png" class="logo-img" alt="Logo">
                                <span class="logo-text">Truework</span>
                                <div class="marketplace-info">
                                    Official Marketplace Transaction<br>
                                    <a href="https://meow-cyan-phi.vercel.app">meow-cyan-phi.vercel.app</a>
                                </div>
                            </div>
                            <div class="invoice-meta">
                                <div class="invoice-title">INVOICE</div>
                                <div class="meta-item">
                                    <span class="label">Number:</span>
                                    <span class="value">#ORD-${order.id.slice(0, 8).toUpperCase()}</span>
                                </div>
                                <div class="meta-item">
                                    <span class="label">Date:</span>
                                    <span class="value">${format(new Date(order.purchaseDate), 'MMM dd, yyyy')}</span>
                                </div>
                            </div>
                        </div>

                        <div class="billing-grid">
                            <div class="billing-box">
                                <h3>Billed To</h3>
                                <div class="contact-name">${order.billingName}</div>
                                <div class="contact-detail">Verified Platform Buyer</div>
                            </div>
                            <div class="billing-box">
                                <h3>Sold By</h3>
                                <div class="contact-name">${order.sellerName}</div>
                                <div class="contact-detail">Verified Platform Seller</div>
                            </div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>Item Details</th>
                                    <th style="text-align: center">Qty</th>
                                    <th style="text-align: right">Rate</th>
                                    <th style="text-align: right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <div class="item-desc">${order.title}</div>
                                        <div class="item-sub">${order.type === 'product' ? 'Instant Delivery Digital Product' : 'Professional Service Delivery'}</div>
                                    </td>
                                    <td style="text-align: center; font-weight: 600;">1</td>
                                    <td style="text-align: right; font-weight: 600;">₹${inrAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    <td style="text-align: right; font-weight: 800; color: #0f172a;">₹${inrAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div class="summary-container">
                            <div class="summary-box">
                                <div class="summary-row">
                                    <span>Subtotal</span>
                                    <span style="color: #0f172a">₹${inrAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div class="summary-row">
                                    <span>Platform Fee</span>
                                    <span style="color: #0f172a">₹0.00</span>
                                </div>
                                <div class="summary-row total">
                                    <span>Total</span>
                                    <span>₹${inrAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        <div class="footer">
                            <div class="footer-text">
                                This is an automated receipt for your digital transaction. This document ensures property rights and fulfillment of terms as per the Truework Service Agreement.
                            </div>
                            <div class="support-info">
                                help@meow-cyan-phi.vercel.app
                            </div>
                        </div>
                    </div>

                    <script>
                        window.onload = () => { 
                            setTimeout(() => {
                                window.print();
                            }, 800);
                        }
                    </script>
                </body>
            </html>
        `
        invoiceWindow.document.write(invoiceHtml)
        invoiceWindow.document.close()
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <p className="text-xs text-muted-foreground font-mono">ORD-{order.id.slice(0, 8).toUpperCase()}</p>
                        <h3 className="font-semibold text-foreground mt-1 line-clamp-2">{order.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{order.seller}</span>
                        </div>
                    </div>
                    <Badge className={status.color}>{status.label}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 my-4 text-sm">
                    <div>
                        <p className="text-xs text-muted-foreground">Amount Paid</p>
                        <p className="font-semibold text-green-600">
                            <StatPrice amount={order.price} />
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Purchase Date</p>
                        <p className="font-medium">{format(new Date(order.purchaseDate), 'MMM dd, yyyy')}</p>
                    </div>
                </div>

                {order.deliveryDate && (
                    <p className="text-xs text-muted-foreground mb-4">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        Delivered on {format(new Date(order.deliveryDate), 'MMM dd, yyyy')}
                    </p>
                )}

                {order.deadline && order.status !== 'completed' && order.status !== 'cancelled' && (
                    <div className="mb-4 flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
                        <Clock className="h-3 w-3 text-amber-600" />
                        <span className="text-xs font-bold text-amber-800">
                            Deadline: {format(new Date(order.deadline), 'MMM d, h:mm a')}
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-2 pt-4 border-t border-border">
                    {/* Main Actions based on status and type */}
                    {order.status === "completed" || (order.status === "paid" && order.type === "product") ? (
                        <>
                            {order.downloadUrls.length > 1 ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                                            <Download className="h-3.5 w-3.5 mr-1" />
                                            Download
                                            <ChevronDown className="h-3.5 w-3.5 ml-1" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[200px]">
                                        {order.downloadUrls.map((url: string, idx: number) => (
                                            <DropdownMenuItem key={idx} onClick={() => handleDownload(url)}>
                                                File {idx + 1}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Button
                                    size="sm"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    onClick={() => order.downloadUrls[0] && handleDownload(order.downloadUrls[0])}
                                    disabled={order.downloadUrls.length === 0}
                                >
                                    <Download className="h-3.5 w-3.5 mr-1" />
                                    Download
                                </Button>
                            )}
                        </>
                    ) : (
                        (order.status === "pending" || order.status === "in_progress" || (order.status === "paid" && order.type === "service")) && (
                            <Link href={`/${order.type}-order/${order.id}`} className="flex-1">
                                <Button variant="outline" size="sm" className="w-full text-center flex justify-center items-center">
                                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                    Track Order
                                </Button>
                            </Link>
                        )
                    )}

                    {/* Invoice is available for any paid/completed order */}
                    {(order.status === "completed" || order.status === "paid") && (
                        <Button variant="outline" size="sm" onClick={handlePrintInvoice}>
                            <Receipt className="h-3.5 w-3.5 mr-1" />
                            Invoice
                        </Button>
                    )}

                    <Link href={`/${order.type}-order/${order.id}`}>
                        <Button variant="ghost" size="sm">
                            <FileText className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}
