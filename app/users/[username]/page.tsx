import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import { ProfileClient } from "./ProfileClient"
import { ProfileBuyer } from "./ProfileBuyer"

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ username: string }>
}

export default async function DashboardUserPage({ params }: PageProps) {
    const session = await auth()

    const paramsData = await params
    const rawUsername = decodeURIComponent(paramsData.username)
    const strippedUsername = rawUsername.startsWith("@")
        ? rawUsername.slice(1)
        : rawUsername

    const user = await db.user.findFirst({
        where: {
            OR: [
                { username: rawUsername },
                { username: strippedUsername },
            ],
        },
        include: {
            freelancerProfile: true,
            credibility: true,
            ordersSold: {
                where: { status: "COMPLETED" },
            },
            ordersBought: {
                where: { status: "COMPLETED" },
            },
            services: {
                where: { isRemoved: false },
                orderBy: { createdAt: 'desc' },
                include: {
                    reviews: {
                        include: {
                            author: {
                                select: {
                                    username: true,
                                    avatarUrl: true
                                }
                            }
                        }
                    }
                }
            },
            products: {
                where: { isRemoved: false },
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: { select: { likes: true } },
                    likes: session?.user?.id ? { where: { userId: session.user.id } } : false
                }
            },
            posts: {
                orderBy: { createdAt: 'desc' },
                include: {
                    author: true,
                    votes: true,
                    _count: { select: { comments: true } }
                }
            },
            _count: {
                select: {
                    followedBy: true,
                    following: true
                }
            },
            portfolioItems: {
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: { select: { likes: true } },
                    likes: session?.user?.id ? { where: { userId: session.user.id } } : false
                }
            },
            followedBy: {
                take: 2,
                include: {
                    follower: {
                        select: {
                            username: true,
                            avatarUrl: true
                        }
                    }
                }
            },
            clientProfile: true,
            reviews: {
                orderBy: { createdAt: 'desc' },
                include: {
                    service: {
                        select: {
                            title: true,
                            seller: {
                                select: {
                                    username: true,
                                    avatarUrl: true
                                }
                            }
                        }
                    }
                }
            },
        },
    })

    if (!user) return notFound()

    // Auto-initialize Credibility Score if missing
    if (!user.credibility) {
        await db.credibilityScore.create({
            data: { userId: user.id }
        })
        user.credibility = { score: 50 } as any
    }

    const u = user as any
    const isOwnProfile = session?.user?.id === u.id

    // Check viewer admin status first to use in shadow ban check
    const viewer = session?.user?.id ? await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    }) : null
    const isViewerAdmin = viewer?.role === "ADMIN"

    // Shadow ban logic: If the user is shadow banned, hide their content from others
    if (u.isShadowBanned && !isOwnProfile && !isViewerAdmin) {
        u.services = []
        u.products = []
        u.posts = []
        u.portfolioItems = []
    }

    // Follow Data
    const followers = u._count?.followedBy ?? 0
    const following = u._count?.following ?? 0

    const currentUserFollow = session?.user?.id ? await db.follows.findUnique({
        where: {
            followerId_followingId: {
                followerId: session.user.id,
                followingId: u.id
            }
        }
    }) : null

    const isFollowing = !!currentUserFollow

    const followerInfo = u.followedBy?.map((f: any) => ({
        username: f.follower.username,
        avatarUrl: f.follower.avatarUrl
    })) || []

    // Calculate Average Rating
    let totalRating = 0
    let totalReviews = 0
    u.services?.forEach((service: any) => {
        service.reviews?.forEach((review: any) => {
            totalRating += review.rating
            totalReviews += 1
        })
    })

    const averageRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : null
    const score = averageRating ? parseFloat(averageRating) : (u.credibility?.score ?? 50)
    const displayName = u.username

    const isBuyerMode = u.activeProfile === "BUYER"

    if (isBuyerMode) {
        const hired = u.ordersBought?.length || 0
        const posts = u.posts || []
        const reviews = u.reviews || []

        return (
            <ProfileBuyer
                user={{
                    id: u.id,
                    username: u.username,
                    displayName,
                    avatarUrl: u.avatarUrl,
                    companyName: u.clientProfile?.companyName ?? null,
                    isIndividual: u.clientProfile?.isIndividual ?? false,
                    description: u.clientProfile?.description ?? null,
                    website: u.clientProfile?.website ?? null,
                    location: u.clientProfile?.location ?? null,
                    createdAt: u.createdAt,
                    isOwnProfile,
                    hired,
                    followers,
                    following,
                    score,
                    isFollowing,
                    visualIntroUrl: u.clientProfile?.visualIntroUrl ?? null,
                    bio: u.bio,
                    followerInfo,
                    isOnline: u.isOnline ?? false,
                    isBanned: u.isBanned ?? false,
                    banReason: u.banReason ?? null,
                    suspendedUntil: u.suspendedUntil ?? null,
                    suspensionReason: u.suspensionReason ?? null,
                    isViewerAdmin,
                }}
                posts={posts}
                reviews={reviews}
            />
        )
    }

    const earned = u.ordersSold.reduce((sum: number, o: any) => sum + o.price, 0)
    const hired = u.ordersSold.length

    const allReviews = u.services?.flatMap((service: any) =>
        (service.reviews || []).map((r: any) => ({
            ...r,
            serviceTitle: service.title
        }))
    ).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime()) || []

    const isPro = hired >= 5
    const title = u.freelancerProfile?.title ?? "Freelancer"
    const visualIntroUrl = u.freelancerProfile?.visualIntroUrl ?? null

    const services = u.services || []
    const products = (u.products || []).map((p: any) => ({
        ...p,
        likesCount: p._count?.likes ?? 0,
        isLiked: p.likes && p.likes.length > 0
    }))
    const posts = u.posts || []

    return (
        <ProfileClient
            user={{
                id: u.id,
                username: u.username,
                displayName,
                avatarUrl: u.avatarUrl,
                title,
                isPro,
                earned,
                hired,
                followers,
                following,
                isFollowing,
                score,
                isOwnProfile,
                visualIntroUrl,
                bio: u.bio,
                hourlyRate: u.freelancerProfile?.hourlyRate,
                location: u.freelancerProfile?.location,
                skills: u.freelancerProfile?.skills || [],
                tools: u.freelancerProfile?.tools || [],
                languages: u.freelancerProfile?.languages || [],
                externalLinks: u.freelancerProfile?.externalLinks || [],
                followerInfo,
                isBanned: u.isBanned ?? false,
                banReason: u.banReason ?? null,
                suspendedUntil: u.suspendedUntil ?? null,
                suspensionReason: u.suspensionReason ?? null,
                isViewerAdmin,
            }}
            services={services}
            products={products}
            posts={posts}
            reviews={allReviews}
            portfolioItems={(u.portfolioItems || []).map((item: any) => ({
                ...item,
                likesCount: item._count?.likes ?? 0,
                isLiked: item.likes && item.likes.length > 0
            }))}
        />
    )
}
