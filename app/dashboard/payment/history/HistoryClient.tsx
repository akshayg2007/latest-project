"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import {
    ArrowDownLeft,
    ArrowUpRight,
    Calendar,
    CreditCard,
    Download,
    Search,
    Briefcase,
    ShoppingBag,
    Wrench,
    TrendingUp,
    SearchX
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { StatPrice, DashboardPrice } from "@/components/DashboardPrice"

interface Transaction {
    id: string
    type: string
    amount: number
    paymentFor: string
    referenceId: string
    title: string
    paymentMode: string
    role: string
    status: string
    date: Date | string
}

interface HistoryClientProps {
    initialTransactions: Transaction[]
    userRole: 'client' | 'freelancer'
}

export default function HistoryClient({ initialTransactions, userRole }: HistoryClientProps) {
    const [timeFilter, setTimeFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [forFilter, setForFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')

    // Filter Logic
    const filteredTransactions = useMemo(() => {
        return initialTransactions.filter(txn => {
            if (typeFilter !== 'all' && txn.type !== typeFilter) return false
            if (forFilter !== 'all' && txn.paymentFor !== forFilter) return false

            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                const matchesSearch =
                    txn.title.toLowerCase().includes(query) ||
                    txn.id.toLowerCase().includes(query) ||
                    txn.referenceId.toLowerCase().includes(query)
                if (!matchesSearch) return false
            }

            if (timeFilter !== 'all') {
                const txnDate = new Date(txn.date)
                const now = new Date()
                if (timeFilter === 'this_week') {
                    const oneWeekAgo = new Date()
                    oneWeekAgo.setDate(now.getDate() - 7)
                    if (txnDate < oneWeekAgo) return false
                }
                if (timeFilter === 'this_month') {
                    const oneMonthAgo = new Date()
                    oneMonthAgo.setMonth(now.getMonth() - 1)
                    if (txnDate < oneMonthAgo) return false
                }
                if (timeFilter === 'this_year') {
                    const oneYearAgo = new Date()
                    oneYearAgo.setFullYear(now.getFullYear() - 1)
                    if (txnDate < oneYearAgo) return false
                }
            }
            return true
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }, [initialTransactions, typeFilter, forFilter, searchQuery, timeFilter])

    // Metrics
    const metrics = useMemo(() => {
        const successTxns = filteredTransactions.filter(t => t.status === 'success')
        return {
            totalAmount: successTxns.reduce((acc, curr) => acc + curr.amount, 0),
            count: filteredTransactions.length,
            completedWork: successTxns.length
        }
    }, [filteredTransactions])

    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase()
        switch (s) {
            case 'success':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">Success</Badge>
            case 'pending':
                return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">Pending</Badge>
            case 'failed':
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">Failed</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const getTypeIcon = (type: string) => {
        if (type === 'credit') {
            return <ArrowDownLeft className="h-4 w-4 text-green-600" />
        }
        return <ArrowUpRight className="h-4 w-4 text-red-600" />
    }

    const getPaymentForIcon = (paymentFor: string) => {
        switch (paymentFor) {
            case 'service': return <Wrench className="h-3 w-3 mr-1" />
            case 'product': return <ShoppingBag className="h-3 w-3 mr-1" />
            case 'job': return <Briefcase className="h-3 w-3 mr-1" />
            default: return null
        }
    }

    const downloadStatement = () => {
        import('jspdf').then(jsPDF => {
            import('jspdf-autotable').then(autoTable => {
                const doc = new jsPDF.default()
                doc.setFontSize(18)
                doc.text("Payment History Statement", 14, 22)

                const tableColumn = ["ID", "Date", "Type", "Amount", "Category", "Title", "Status"]
                const tableRows = filteredTransactions.map(txn => [
                    txn.id.slice(0, 8),
                    format(new Date(txn.date), "yyyy-MM-dd"),
                    txn.type.toUpperCase(),
                    `₹${txn.amount.toLocaleString('en-IN')}`,
                    txn.paymentFor,
                    txn.title,
                    txn.status
                ])

                // @ts-ignore
                autoTable.default(doc, {
                    head: [tableColumn],
                    body: tableRows,
                    startY: 30,
                    theme: 'grid',
                    headStyles: { fillColor: [15, 23, 42] }
                })

                doc.save(`statement_${format(new Date(), "yyyy-MM-dd")}.pdf`)
            })
        })
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Payment History</h1>
                <p className="text-muted-foreground text-sm">Review your platform transactions and ledger history.</p>
            </div>

            {/* Summary Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {userRole === 'client' ? 'Total Spent' : 'Total Earned'}
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold"><StatPrice amount={metrics.totalAmount} /></div>
                        <p className="text-xs text-muted-foreground">Across all successful orders</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.count}</div>
                        <p className="text-xs text-muted-foreground">Total records in history</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.completedWork}</div>
                        <p className="text-xs text-muted-foreground">Finalized platform items</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search transactions..."
                        className="pl-9 bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                        <SelectTrigger className="w-[120px] bg-white">
                            <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="this_week">This Week</SelectItem>
                            <SelectItem value="this_month">This Month</SelectItem>
                            <SelectItem value="this_year">This Year</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[100px] bg-white">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="credit">Credit</SelectItem>
                            <SelectItem value="debit">Debit</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={forFilter} onValueChange={setForFilter}>
                        <SelectTrigger className="w-[120px] bg-white">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Category</SelectItem>
                            <SelectItem value="service">Service</SelectItem>
                            <SelectItem value="product">Product</SelectItem>
                            <SelectItem value="job">Job</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="sm" onClick={downloadStatement}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[100px] font-bold">ID</TableHead>
                            <TableHead className="font-bold">Type</TableHead>
                            <TableHead className="font-bold">Description</TableHead>
                            <TableHead className="font-bold">Category</TableHead>
                            <TableHead className="font-bold">Status</TableHead>
                            <TableHead className="font-bold">Date</TableHead>
                            <TableHead className="text-right font-bold">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map((txn) => (
                                <TableRow key={txn.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-mono text-[10px] text-muted-foreground uppercase">
                                        {txn.id.slice(0, 8)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            {getTypeIcon(txn.type)}
                                            <span className={`text-[10px] font-bold uppercase ${txn.type === 'credit' ? 'text-green-700' : 'text-red-700'}`}>
                                                {txn.type}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-900">{txn.title}</span>
                                            <span className="text-[10px] text-muted-foreground">Ref: {txn.referenceId.slice(0, 10)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase w-fit">
                                            {getPaymentForIcon(txn.paymentFor)}
                                            {txn.paymentFor}
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(txn.status)}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {format(new Date(txn.date), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        <div className={txn.type === 'credit' ? 'text-green-600' : 'text-rose-600'}>
                                            {txn.type === 'credit' ? '+' : '-'}
                                            <DashboardPrice amount={txn.amount} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <SearchX className="h-10 w-10 mb-2 opacity-20" />
                                        <p className="font-medium">No records found</p>
                                        <p className="text-xs">Try adjusting your filters or search query.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
