export const dynamic = 'force-dynamic'

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ExploreClient } from "@/app/explore/ExploreClient"

export default async function ExplorePage() {
  const session = await auth()
  if (!session?.user) redirect("/api/auth/signin")

  // Read activeProfile from DB (session may be stale after workspace switch)
  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { activeProfile: true, role: true }
  })
  const userRole = currentUser?.activeProfile || session.user.activeProfile // 'BUYER' or 'SELLER' (freelancer)
  // Optimized: Parallel fetch with limits
  const [services, products, jobs, users] = await Promise.all([
    db.service.findMany({
      where: {
        isRemoved: false,
        ...(currentUser?.role !== 'ADMIN' && {
          OR: [
            { seller: { isShadowBanned: false } },
            { sellerId: session.user.id }
          ]
        })
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        seller: { select: { username: true, avatarUrl: true } },
        reviews: { select: { rating: true } },
        _count: { select: { likes: true } },
        likes: session?.user?.id ? { where: { userId: session.user.id } } : false
      }
    }),
    db.product.findMany({
      where: {
        isRemoved: false,
        ...(currentUser?.role !== 'ADMIN' && {
          OR: [
            { seller: { isShadowBanned: false } },
            { sellerId: session.user.id }
          ]
        })
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        seller: { select: { username: true, avatarUrl: true } },
        _count: { select: { likes: true } },
        likes: session?.user?.id ? { where: { userId: session.user.id } } : false
      }
    }),
    db.job.findMany({
      where: {
        status: 'OPEN',
        isRemoved: false,
        ...(currentUser?.role !== 'ADMIN' && {
          OR: [
            { client: { isShadowBanned: false } },
            { clientId: session.user.id }
          ]
        })
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        client: { select: { username: true, avatarUrl: true } },
        applications: true,
        _count: { select: { likes: true } },
        likes: session?.user?.id ? { where: { userId: session.user.id } } : false
      }
    }),
    db.user.findMany({
      where: {
        onboardingComplete: true,
        ...(currentUser?.role !== 'ADMIN' && {
          OR: [
            { isShadowBanned: false },
            { id: session.user.id }
          ]
        })
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        freelancerProfile: true,
        clientProfile: true
      }
    })
  ]) as [any[], any[], any[], any[]];

  // Transform Services
  const transformedServices = services.map(service => {
    const ratings = service.reviews.map((r: any) => r.rating);
    const avgRating = ratings.length > 0 ? ratings.reduce((a: any, b: any) => a + b, 0) / ratings.length : 0;
    return {
      id: service.id,
      type: 'SERVICE' as const,
      title: service.title,
      description: service.description,
      category: service.category || 'Service',
      price: service.price,
      deliveryTime: service.deliveryTime,
      images: service.images,
      createdAt: service.createdAt.toISOString(),
      seller: service.seller,
      avgRating,
      reviewCount: ratings.length,
      skills: service.tools || service.tags || [],
      likesCount: service._count.likes,
      isLiked: service.likes?.length > 0,
      revisions: service.revisions,
      paymentFrequency: service.paymentFrequency,
      pricingMethod: service.pricingMethod,
    };
  });

  // Transform Products
  const transformedProducts = products.map(product => ({
    id: product.id,
    type: 'PRODUCT' as const,
    title: product.name,
    description: product.description,
    category: product.category || 'Product',
    price: product.price,
    deliveryTime: null,
    images: product.images,
    createdAt: product.createdAt.toISOString(),
    seller: product.seller,
    avgRating: 0,
    reviewCount: 0,
    license: product.license,
    likesCount: product._count.likes,
    isLiked: product.likes?.length > 0
  }));

  // Transform Jobs
  const transformedJobs = jobs.map(job => ({
    id: job.id,
    type: 'JOB' as const,
    title: job.title,
    description: job.description,
    category: job.category || 'Job',
    price: job.budget,
    budgetType: job.budgetType,
    deliveryTime: null,
    images: [],
    createdAt: job.createdAt.toISOString(),
    seller: job.client,
    avgRating: 0,
    reviewCount: job.applications.length,
    skills: job.skills,
    experienceLevel: job.experienceLevel,
    likesCount: job._count.likes,
    isLiked: job.likes?.length > 0
  }));

  // Transform Users (Profiles)
  const transformedUsers = users.filter(user => user.username).map(user => ({
    id: user.id,
    type: 'PROFILE' as const,
    title: user.username || 'User',
    description: user.bio || '',
    category: user.freelancerProfile?.title || (user.activeProfile === 'SELLER' ? 'Freelancer' : 'Client'),
    price: user.freelancerProfile?.hourlyRate ? parseFloat(user.freelancerProfile.hourlyRate) : 0,
    deliveryTime: null,
    images: user.avatarUrl ? [user.avatarUrl] : [],
    createdAt: user.createdAt.toISOString(),
    seller: {
      username: user.username,
      avatarUrl: user.avatarUrl
    },
    avgRating: 0,
    reviewCount: 0,
    skills: user.freelancerProfile?.skills || []
  }));

  const allItems = [...transformedServices, ...transformedProducts, ...transformedJobs, ...transformedUsers];

  // Filter items based on user role
  // No filtering based on user role - show everything to everyone
  const filteredItems = allItems;

  // Calculate price range only for items that are actually displayed (excluding profiles)
  const displayItems = allItems.filter(item => item.type !== 'PROFILE');
  const categories = [...new Set(displayItems.map(item => item.category))].filter(Boolean);
  const prices = displayItems.map(item => item.price).filter(p => !isNaN(p));
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 1000;

  return (
    <ExploreClient
      initialItems={filteredItems as any}
      categories={categories}
      priceRange={{ min: minPrice, max: maxPrice }}
      isDashboard={true}
      userRole={userRole as string}
    />
  );
}