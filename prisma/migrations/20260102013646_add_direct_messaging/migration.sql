-- CreateTable
CREATE TABLE "direct_messages" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "receiverRole" TEXT NOT NULL,
    "receiverName" TEXT NOT NULL,
    "shopId" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "threadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "direct_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "direct_messages_senderId_senderRole_idx" ON "direct_messages"("senderId", "senderRole");

-- CreateIndex
CREATE INDEX "direct_messages_receiverId_receiverRole_idx" ON "direct_messages"("receiverId", "receiverRole");

-- CreateIndex
CREATE INDEX "direct_messages_shopId_idx" ON "direct_messages"("shopId");

-- CreateIndex
CREATE INDEX "direct_messages_threadId_idx" ON "direct_messages"("threadId");

-- CreateIndex
CREATE INDEX "direct_messages_createdAt_idx" ON "direct_messages"("createdAt");
