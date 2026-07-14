-- Additive, non-destructive index creation only (audit finding M1).
-- Applied directly via `prisma db execute` rather than `prisma migrate dev` because the
-- live database has pre-existing drift from migration history (see conversation notes /
-- CHANGELOG) that makes `migrate dev` demand a full schema reset. This script only adds
-- indexes and does not touch or depend on the drifted objects.
CREATE INDEX IF NOT EXISTS "Trip_organizerId_idx" ON "Trip"("organizerId");
CREATE INDEX IF NOT EXISTS "Review_userId_idx" ON "Review"("userId");
CREATE INDEX IF NOT EXISTS "report_reporterId_idx" ON "report"("reporterId");
CREATE INDEX IF NOT EXISTS "conversation_participant_userId_idx" ON "conversation_participant"("userId");
CREATE INDEX IF NOT EXISTS "group_member_userId_idx" ON "group_member"("userId");
