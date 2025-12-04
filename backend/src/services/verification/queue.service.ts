import { verificationQueue } from '../../lib/redis';
import { VerificationJobData } from '../../types/verification';

/**
 * Queue Service
 * Manages job queue for async verification processing
 */
export class QueueService {
  /**
   * Add verification job to queue
   * @param documentId - Document ID to verify
   * @param priority - Job priority (1-10, higher = more important)
   */
  async addVerificationJob(documentId: string, priority: number = 5): Promise<string> {
    try {
      const job = await verificationQueue.add(
        'verify-document',
        { documentId } as VerificationJobData,
        {
          priority,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000, // Start with 2 seconds, then 4, 8, etc.
          },
          removeOnComplete: {
            count: 100, // Keep last 100 completed jobs
            age: 24 * 3600, // Remove after 24 hours
          },
          removeOnFail: {
            count: 500, // Keep last 500 failed jobs
            age: 7 * 24 * 3600, // Remove after 7 days
          },
        }
      );

      console.log(`[QueueService] Added job ${job.id} for document ${documentId}`);
      return job.id as string;
    } catch (error) {
      console.error('[QueueService] Failed to add job:', error);
      throw new Error('Failed to queue verification job');
    }
  }

  /**
   * Get job status
   * @param jobId - Job ID
   */
  async getJobStatus(jobId: string) {
    try {
      const job = await verificationQueue.getJob(jobId);

      if (!job) {
        return null;
      }

      const state = await job.getState();

      return {
        id: job.id,
        state, // 'waiting', 'active', 'completed', 'failed', 'delayed'
        progress: job.progress,
        data: job.data,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
      };
    } catch (error) {
      console.error('[QueueService] Failed to get job status:', error);
      return null;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        verificationQueue.getWaitingCount(),
        verificationQueue.getActiveCount(),
        verificationQueue.getCompletedCount(),
        verificationQueue.getFailedCount(),
        verificationQueue.getDelayedCount(),
      ]);

      return {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
      };
    } catch (error) {
      console.error('[QueueService] Failed to get queue stats:', error);
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        total: 0,
      };
    }
  }

  /**
   * Retry failed job
   * @param jobId - Job ID to retry
   */
  async retryJob(jobId: string): Promise<boolean> {
    try {
      const job = await verificationQueue.getJob(jobId);

      if (!job) {
        console.error(`[QueueService] Job ${jobId} not found`);
        return false;
      }

      await job.retry();
      console.log(`[QueueService] Retrying job ${jobId}`);
      return true;
    } catch (error) {
      console.error('[QueueService] Failed to retry job:', error);
      return false;
    }
  }

  /**
   * Remove job from queue
   * @param jobId - Job ID to remove
   */
  async removeJob(jobId: string): Promise<boolean> {
    try {
      const job = await verificationQueue.getJob(jobId);

      if (!job) {
        return false;
      }

      await job.remove();
      console.log(`[QueueService] Removed job ${jobId}`);
      return true;
    } catch (error) {
      console.error('[QueueService] Failed to remove job:', error);
      return false;
    }
  }

  /**
   * Clean old jobs from queue
   * @param grace - Grace period in milliseconds
   */
  async cleanQueue(grace: number = 24 * 3600 * 1000): Promise<void> {
    try {
      await verificationQueue.clean(grace, 100, 'completed');
      await verificationQueue.clean(grace * 7, 100, 'failed'); // Keep failed jobs longer
      console.log('[QueueService] Queue cleaned successfully');
    } catch (error) {
      console.error('[QueueService] Failed to clean queue:', error);
    }
  }
}

// Export singleton instance
export const queueService = new QueueService();

