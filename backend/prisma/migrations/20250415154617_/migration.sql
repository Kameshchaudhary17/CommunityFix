-- AlterTable
ALTER TABLE `notification` MODIFY `type` ENUM('REPORT_STATUS_CHANGED', 'NEW_COMMENT', 'SUGGESTION_STATUS_CHANGED', 'NEW_UPVOTE', 'ACCOUNT_VERIFIED', 'NEW_REPORT') NOT NULL;
