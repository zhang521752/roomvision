// 队列系统：按用户等级优先级处理生成任务

export type QueuePriority = 'premium' | 'pro' | 'free';

const MAX_QUEUE_SIZE = 100;
const TASK_TIMEOUT_MS = 5 * 60 * 1000;

export interface QueueTask {
  id: string;
  priority: QueuePriority;
  userId?: string;
  payload: any;
  createdAt: number;
  resolve: (result: any) => void;
  reject: (error: any) => void;
  executor: (payload: any) => Promise<any>;
}

export class QueueManager {
  private queues: Record<QueuePriority, QueueTask[]> = {
    premium: [],
    pro: [],
    free: [],
  };
  private processing = false;
  private maxConcurrent = 2;
  private activeCount = 0;
  private taskCounter = 0;

  async enqueue<T>(
    payload: any,
    priority: QueuePriority,
    executor: (payload: any) => Promise<T>,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.getQueueLength() >= MAX_QUEUE_SIZE) {
        reject(new Error(`Queue is full (max ${MAX_QUEUE_SIZE} tasks)`));
        return;
      }

      const task: QueueTask = {
        id: `task-${Date.now()}-${++this.taskCounter}`,
        priority,
        payload,
        createdAt: Date.now(),
        resolve,
        reject,
        executor,
      };

      this.queues[priority].push(task);
      console.log(`[Queue] Enqueued ${task.id} (${priority}), waiting: ${this.getQueueLength()}`);

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private getNextTask(): QueueTask | null {
    const order: QueuePriority[] = ['premium', 'pro', 'free'];
    for (const priority of order) {
      if (this.queues[priority].length > 0) {
        return this.queues[priority].shift()!;
      }
    }
    return null;
  }

  private async processQueue() {
    if (this.activeCount >= this.maxConcurrent) return;
    this.processing = true;

    while (true) {
      if (this.activeCount >= this.maxConcurrent) break;

      const task = this.getNextTask();
      if (!task) {
        this.processing = false;
        break;
      }

      this.activeCount++;
      const waitTime = Date.now() - task.createdAt;
      if (waitTime > 1000) {
        console.log(`[Queue] ${task.id} waited ${waitTime}ms before processing`);
      }

      const timeoutId = setTimeout(() => {
        task.reject(new Error(`Task ${task.id} timed out after ${TASK_TIMEOUT_MS}ms`));
      }, TASK_TIMEOUT_MS);

      task.executor(task.payload)
        .then((result) => {
          clearTimeout(timeoutId);
          task.resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          task.reject(error);
        })
        .finally(() => {
          this.activeCount--;
          this.processQueue();
        });
    }
  }

  getQueueLength(): number {
    return this.queues.premium.length + this.queues.pro.length + this.queues.free.length;
  }

  getActiveCount(): number {
    return this.activeCount;
  }

  getStatus() {
    return {
      premium: this.queues.premium.length,
      pro: this.queues.pro.length,
      free: this.queues.free.length,
      active: this.activeCount,
      total: this.getQueueLength(),
    };
  }
}

export const queueManager = new QueueManager();
