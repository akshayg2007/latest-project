import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // 1. Find the first user in the DB to be the "Seller"
    const seller = await db.user.findFirst()

    if (!seller) {
      return NextResponse.json({ error: "Please sign up a user first!" }, { status: 400 })
    }

    // 2. Create sample gigs linked to that user
    await db.service.createMany({
      data: [
        {
          title: "I will build a modern Next.js website with Shadcn UI",
          description: "I am a professional developer...",
          category: "Programming",
          price: 85,
          deliveryTime: 3,
          images: ["https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80"],
          sellerId: seller.id
        },
        {
          title: "I will design a minimalist logo for your startup",
          description: "Minimalist logos are the trend...",
          category: "Graphics",
          price: 45,
          deliveryTime: 2,
          images: ["https://images.unsplash.com/photo-1626785774573-4b799314348d?auto=format&fit=crop&w=800&q=80"],
          sellerId: seller.id
        },
        {
          title: "I will write SEO optimized blog posts",
          description: "Get more traffic with my writing...",
          category: "Writing",
          price: 25,
          deliveryTime: 1,
          images: ["https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80"],
          sellerId: seller.id
        },
        {
          title: "I will fix your Python scripts and bugs instantly",
          description: "Python expert here to help...",
          category: "Programming",
          price: 30,
          deliveryTime: 1,
          images: ["https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80"],
          sellerId: seller.id
        }
      ]
    })

    return NextResponse.json({ message: "Database seeded successfully! Go check /explore" })
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong seeding." }, { status: 500 })
  }
}