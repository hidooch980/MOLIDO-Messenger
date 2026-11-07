ALTER TABLE "messages" ADD COLUMN "clientMessageId" TEXT;
CREATE UNIQUE INDEX "messages_senderId_clientMessageId_key"
ON "messages"("senderId", "clientMessageId");
