import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { db } from "@/lib/db"

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"

// Icons
import {
  Users,
  Mail
} from "lucide-react"

export default async function CustomersPage() {
  const session = await auth()
  if (!session?.user) redirect("/api/auth/signin")

  // --- 1. FETCH DATA ---
  const mySales = await db.order.findMany({
    where: { sellerId: session.user.id },
    include: { buyer: true },
    orderBy: { createdAt: 'desc' }
  })

  // --- 2. PROCESS DATA (Group by Buyer) ---
  const customersMap = new Map()

  mySales.forEach((order) => {
    const buyerId = order.buyerId
    
    if (!customersMap.has(buyerId)) {
      customersMap.set(buyerId, {
        id: buyerId,
        name: order.buyer.username || "Unknown",
        email: order.buyer.email,
        image: order.buyer.avatarUrl,
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: order.createdAt
      })
    }

    const customer = customersMap.get(buyerId)
    customer.totalOrders += 1
    customer.totalSpent += order.price
  })

  const customers = Array.from(customersMap.values())

  // --- 3. RENDER CONTENT ONLY ---
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Customers</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Client List</CardTitle>
          <CardDescription>
            People who have purchased your services.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Users className="h-10 w-10 mx-auto text-slate-300 mb-3" />
              <p>No customers yet. Keep promoting your gigs!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">User</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead className="text-right">Last Purchase</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                       <Avatar>
                        <AvatarImage src={customer.image || ""} />
                        <AvatarFallback>{customer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Mail className="w-3 h-3" />
                        {customer.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{customer.totalOrders} Orders</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ${customer.totalSpent}
                    </TableCell>
                    <TableCell className="text-right text-slate-500 text-sm">
                       {new Date(customer.lastOrderDate).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}