import { getState, setState } from './db';
import { sseBroker } from './sse';
import { computeAdemeCarbonImpact } from './integrations';

// ============================================================================
// PHASE 2.2 : FILE DE TRAITEMENT ASYNCHRONE & MOTEUR DE WORKERS (BULLMQ PATTERN)
// ============================================================================

export type JobType = 
  | 'COMPUTE_ADEME_CARBON_AUDIT'
  | 'GENERATE_LEGAL_CONTRACTS_OF'
  | 'DISPATCH_WEBHOOKS_AND_NOTIFICATIONS'
  | 'RECONCILE_BANK_SETTLEMENT';

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface AsyncJob {
  id: string;
  type: JobType;
  title: string;
  payload: any;
  status: JobStatus;
  priority: 'low' | 'normal' | 'high' | 'critical';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  attempts: number;
  maxAttempts: number;
  result?: any;
  error?: string;
}

export interface QueueMetrics {
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageLatencyMs: number;
  successRatePct: number;
  activeWorkers: number;
  uptimeSeconds: number;
  lastProcessedAt?: string;
}

class QueueEngine {
  private jobs: AsyncJob[] = [];
  private isProcessingLoopActive: boolean = false;
  private maxConcurrency: number = 3;
  private currentActiveWorkers: number = 0;
  private startTime: number = Date.now();
  private totalExecutionTimeMs: number = 0;
  private totalCompletedCount: number = 0;

  constructor() {
    this.seedInitialJobs();
  }

  private seedInitialJobs() {
    // Seed initial demonstration jobs
    const initialSeed: Array<Omit<AsyncJob, 'id' | 'createdAt' | 'attempts' | 'maxAttempts' | 'status'>> = [
      {
        type: 'COMPUTE_ADEME_CARBON_AUDIT',
        title: 'Audit Carbone Scope 3 - Flacons PCR 250ml (Campagne #camp-01)',
        payload: { materialCode: 'pehd_pcr', quantity: 42500, unitWeightGrams: 28 },
        priority: 'high'
      },
      {
        type: 'GENERATE_LEGAL_CONTRACTS_OF',
        title: 'Génération automatique OF Usine Plastinnov (#OF-2026-NOR-01)',
        payload: { campaignId: 'camp-01', targetMOQ: 50000, supplierId: 'sup-01' },
        priority: 'critical'
      },
      {
        type: 'DISPATCH_WEBHOOKS_AND_NOTIFICATIONS',
        title: 'Synchronisation Webhook ERP SAP (Écritures Journal Achats)',
        payload: { destination: 'https://sap-erp.botanica.internal/webhooks/orders', ordersCount: 3 },
        priority: 'normal'
      }
    ];

    initialSeed.forEach((item, idx) => {
      const now = new Date(Date.now() - (idx + 1) * 3600000).toISOString();
      this.jobs.push({
        id: `job-${1000 + idx}`,
        type: item.type,
        title: item.title,
        payload: item.payload,
        status: 'completed',
        priority: item.priority,
        createdAt: now,
        startedAt: now,
        completedAt: now,
        durationMs: 45 + Math.floor(Math.random() * 60),
        attempts: 1,
        maxAttempts: 3,
        result: { success: true, processedItems: 1 }
      });
      this.totalCompletedCount++;
      this.totalExecutionTimeMs += 65;
    });
  }

  public getJobs(limit: number = 50): AsyncJob[] {
    return this.jobs.slice(0, limit);
  }

  public getMetrics(): QueueMetrics {
    const pendingJobs = this.jobs.filter(j => j.status === 'queued').length;
    const processingJobs = this.jobs.filter(j => j.status === 'processing').length;
    const completedJobs = this.jobs.filter(j => j.status === 'completed').length;
    const failedJobs = this.jobs.filter(j => j.status === 'failed').length;

    const avgLatency = this.totalCompletedCount > 0 
      ? Math.round(this.totalExecutionTimeMs / this.totalCompletedCount) 
      : 55;

    const totalDone = completedJobs + failedJobs;
    const successRate = totalDone > 0 ? Math.round((completedJobs / totalDone) * 1000) / 10 : 100;

    return {
      totalJobs: this.jobs.length,
      pendingJobs,
      processingJobs,
      completedJobs,
      failedJobs,
      averageLatencyMs: avgLatency,
      successRatePct: successRate,
      activeWorkers: this.currentActiveWorkers,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      lastProcessedAt: this.jobs.find(j => j.completedAt)?.completedAt
    };
  }

  public enqueue(
    type: JobType,
    title: string,
    payload: any,
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
  ): AsyncJob {
    const job: AsyncJob = {
      id: `job-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      type,
      title,
      payload,
      status: 'queued',
      priority,
      createdAt: new Date().toISOString(),
      attempts: 0,
      maxAttempts: 3
    };

    // Insérer selon priorité (critical en tête)
    const priorityWeight = { critical: 4, high: 3, normal: 2, low: 1 };
    const insertIdx = this.jobs.findIndex(
      j => j.status === 'queued' && priorityWeight[j.priority] < priorityWeight[priority]
    );

    if (insertIdx === -1) {
      this.jobs.unshift(job);
    } else {
      this.jobs.splice(insertIdx, 0, job);
    }

    // Broadcast temps réel SSE
    sseBroker.broadcast('JOB_ENQUEUED', {
      jobId: job.id,
      type: job.type,
      title: job.title,
      priority: job.priority,
      createdAt: job.createdAt
    });

    return job;
  }

  /**
   * Traitement d'un Job individuel par le worker
   */
  private async executeJobWorker(job: AsyncJob): Promise<void> {
    const start = Date.now();
    job.status = 'processing';
    job.startedAt = new Date().toISOString();
    job.attempts++;
    this.currentActiveWorkers++;

    sseBroker.broadcast('JOB_PROCESSING', {
      jobId: job.id,
      type: job.type,
      title: job.title,
      attempts: job.attempts
    });

    try {
      let result: any = null;

      switch (job.type) {
        case 'COMPUTE_ADEME_CARBON_AUDIT': {
          // Simulation calcul lourd Scope 3
          await new Promise(r => setTimeout(r, 120));
          const { materialCode, quantity, unitWeightGrams } = job.payload;
          result = computeAdemeCarbonImpact(materialCode || 'rpet', quantity || 10000, unitWeightGrams || 28);
          break;
        }

        case 'GENERATE_LEGAL_CONTRACTS_OF': {
          // Simulation génération automatique de contrat & ordre de fabrication usine
          await new Promise(r => setTimeout(r, 150));
          const state = getState();
          const targetCamp = state.campaigns.find(c => c.id === job.payload.campaignId) || state.campaigns[0];
          result = {
            ofNumber: `OF-2026-${Math.floor(10000 + Math.random() * 90000)}`,
            poNumber: `PO-${targetCamp.id.toUpperCase()}-BULK`,
            cmrHubNumber: `CMR-ROUEN-HUB-${Date.now().toString().slice(-6)}`,
            producedUnits: targetCamp.reservedVolume,
            contractSha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
            generatedAt: new Date().toISOString()
          };
          break;
        }

        case 'DISPATCH_WEBHOOKS_AND_NOTIFICATIONS': {
          // Simulation envoi webhook tiers (SAP / Chorus Pro / ERP)
          await new Promise(r => setTimeout(r, 90));
          result = {
            delivered: true,
            statusHttp: 200,
            endpoint: job.payload?.destination || 'https://api.erp.botanica.fr/orders',
            payloadChecksum: 'sha256-verified-ok',
            responseTimeMs: 38
          };
          break;
        }

        case 'RECONCILE_BANK_SETTLEMENT': {
          // Simulation réconciliation par lot
          await new Promise(r => setTimeout(r, 110));
          result = {
            reconciledCount: job.payload?.ordersCount || 1,
            ledgerTotalEur: job.payload?.totalEur || 12500,
            matchedBic: 'TREEFRPPXXX',
            cleared: true
          };
          break;
        }
      }

      const durationMs = Date.now() - start;
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      job.durationMs = durationMs;
      job.result = result;

      this.totalCompletedCount++;
      this.totalExecutionTimeMs += durationMs;

      sseBroker.broadcast('JOB_COMPLETED', {
        jobId: job.id,
        type: job.type,
        title: job.title,
        durationMs,
        result
      });

    } catch (err: any) {
      job.attempts++;
      if (job.attempts < job.maxAttempts) {
        job.status = 'queued'; // Retry policy
      } else {
        job.status = 'failed';
        job.completedAt = new Date().toISOString();
        job.error = err.message || 'Erreur inconnue dans le worker';
      }

      sseBroker.broadcast('JOB_FAILED', {
        jobId: job.id,
        type: job.type,
        error: job.error,
        attempts: job.attempts
      });
    } finally {
      this.currentActiveWorkers = Math.max(0, this.currentActiveWorkers - 1);
    }
  }

  /**
   * Traitement d'un job pending
   */
  public async processNext(): Promise<AsyncJob | null> {
    const pendingJob = this.jobs.find(j => j.status === 'queued');
    if (!pendingJob) return null;

    await this.executeJobWorker(pendingJob);
    return pendingJob;
  }

  /**
   * Traitement de tous les jobs en attente en parallèle (concurrence contrôlée)
   */
  public async processAllPending(): Promise<{ processedCount: number; results: AsyncJob[] }> {
    const pending = this.jobs.filter(j => j.status === 'queued');
    if (pending.length === 0) {
      return { processedCount: 0, results: [] };
    }

    const processedList: AsyncJob[] = [];
    for (const job of pending) {
      await this.executeJobWorker(job);
      processedList.push(job);
    }

    return { processedCount: processedList.length, results: processedList };
  }

  public clearCompleted() {
    this.jobs = this.jobs.filter(j => j.status !== 'completed');
  }
}

export const queueEngine = new QueueEngine();
