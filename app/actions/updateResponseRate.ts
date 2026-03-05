import { db } from "@/lib/db"

export async function calculateAndUpdateResponseRate(userId: string) {
  // Get all conversations where the user is userB (receiver)
  const conversations = await db.conversation.findMany({
    where: {
      userBId: userId
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  let totalResponseTime = 0
  let responseCount = 0
  const oneHourInMs = 60 * 60 * 1000

  for (const conversation of conversations) {
    const messages = conversation.messages
    
    // Find first message from userA and first response from userB
    let firstMessageFromA = messages.find(m => m.senderId === conversation.userAId)
    let firstResponseFromB = messages.find(m => m.senderId === userId)
    
    if (firstMessageFromA && firstResponseFromB) {
      const timeDiff = firstResponseFromB.createdAt.getTime() - firstMessageFromA.createdAt.getTime()
      
      // Only count if response was within 24 hours
      if (timeDiff <= 24 * oneHourInMs) {
        totalResponseTime += timeDiff
        responseCount++
      }
    }
  }

  // Calculate response rate (percentage of responses within 1 hour)
  const responsesWithinOneHour = conversations.reduce((count, conversation) => {
    const messages = conversation.messages
    let firstMessageFromA = messages.find(m => m.senderId === conversation.userAId)
    let firstResponseFromB = messages.find(m => m.senderId === userId)
    
    if (firstMessageFromA && firstResponseFromB) {
      const timeDiff = firstResponseFromB.createdAt.getTime() - firstMessageFromA.createdAt.getTime()
      if (timeDiff <= oneHourInMs) {
        return count + 1
      }
    }
    return count
  }, 0)

  const responseRate = conversations.length > 0 ? Math.round((responsesWithinOneHour / conversations.length) * 100) : null

  // Update credibility score
  if (responseRate !== null) {
    await db.credibilityScore.upsert({
      where: { userId },
      update: { responseRate },
      create: {
        userId,
        responseRate
      }
    })
  }

  return responseRate
}
