/**
 * Real-Time Updates System
 * Handles WebSocket connections and live data synchronization for Huzzology
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { CacheService } from './cache';
import { QueryMonitor } from './queryMonitor';

interface UpdateEvent {
  type: 'archetype_update' | 'trend_update' | 'user_activity' | 'moderation_action' | 'system_metric';
  data: any;
  timestamp: number;
  userId?: string;
  archetypeId?: string;
}

interface ClientSubscription {
  userId: string;
  interests: string[]; // archetype IDs, trend categories, etc.
  lastActivity: number;
}

interface RealTimeMetrics {
  connectedClients: number;
  activeSubscriptions: number;
  messagesPerSecond: number;
  averageLatency: number;
  errorRate: number;
}

export class RealTimeUpdateService {
  private io: SocketIOServer;
  private cache: CacheService;
  private queryMonitor: QueryMonitor;
  private subscriptions: Map<string, ClientSubscription> = new Map();
  private updateQueue: UpdateEvent[] = [];
  private metrics: RealTimeMetrics = {
    connectedClients: 0,
    activeSubscriptions: 0,
    messagesPerSecond: 0,
    averageLatency: 0,
    errorRate: 0,
  };
  private messageCount = 0;
  private errorCount = 0;
  private latencySum = 0;
  private latencyCount = 0;

  constructor(server: HTTPServer, cache: CacheService) {
    this.cache = cache;
    this.queryMonitor = QueryMonitor.getInstance();
    
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupEventHandlers();
    this.startMetricsCollection();
    this.startQueueProcessor();
  }

  /**
   * Set up Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      this.metrics.connectedClients++;

      // Handle user authentication and subscription
      socket.on('authenticate', async (data: { userId: string; token?: string }) => {
        try {
          // TODO: Validate token if authentication is required
          const subscription: ClientSubscription = {
            userId: data.userId,
            interests: [],
            lastActivity: Date.now(),
          };
          
          this.subscriptions.set(socket.id, subscription);
          this.metrics.activeSubscriptions++;
          
          socket.emit('authenticated', { success: true });
          
          // Send initial data
          await this.sendInitialData(socket, data.userId);
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('authenticated', { success: false, error: 'Authentication failed' });
        }
      });

      // Handle subscription to specific data types
      socket.on('subscribe', (data: { interests: string[] }) => {
        const subscription = this.subscriptions.get(socket.id);
        if (subscription) {
          subscription.interests = data.interests;
          subscription.lastActivity = Date.now();
          socket.emit('subscribed', { interests: data.interests });
        }
      });

      // Handle unsubscription
      socket.on('unsubscribe', (data: { interests: string[] }) => {
        const subscription = this.subscriptions.get(socket.id);
        if (subscription) {
          subscription.interests = subscription.interests.filter(
            interest => !data.interests.includes(interest)
          );
          subscription.lastActivity = Date.now();
          socket.emit('unsubscribed', { interests: data.interests });
        }
      });

      // Handle ping for latency measurement
      socket.on('ping', (timestamp: number) => {
        const latency = Date.now() - timestamp;
        this.recordLatency(latency);
        socket.emit('pong', { timestamp, latency });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
        this.subscriptions.delete(socket.id);
        this.metrics.connectedClients--;
        this.metrics.activeSubscriptions--;
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
        this.errorCount++;
      });
    });
  }

  /**
   * Send initial data to newly connected client
   */
  private async sendInitialData(socket: any, userId: string): Promise<void> {
    try {
      // Send trending archetypes
      const trendingArchetypes = await this.cache.get('trending_archetypes');
      if (trendingArchetypes) {
        socket.emit('initial_data', {
          type: 'trending_archetypes',
          data: trendingArchetypes,
        });
      }

      // Send recent activity
      const recentActivity = await this.cache.get(`user_activity:${userId}`);
      if (recentActivity) {
        socket.emit('initial_data', {
          type: 'recent_activity',
          data: recentActivity,
        });
      }

      // Send system metrics if user has admin privileges
      // TODO: Check user permissions
      const systemMetrics = this.getSystemMetrics();
      socket.emit('initial_data', {
        type: 'system_metrics',
        data: systemMetrics,
      });
    } catch (error) {
      console.error('Error sending initial data:', error);
      this.errorCount++;
    }
  }

  /**
   * Broadcast update to relevant clients
   */
  async broadcastUpdate(event: UpdateEvent): Promise<void> {
    try {
      // Add to queue for processing
      this.updateQueue.push(event);
      
      // Also try immediate broadcast for real-time updates
      await this.processUpdate(event);
    } catch (error) {
      console.error('Error broadcasting update:', error);
      this.errorCount++;
    }
  }

  /**
   * Process a single update event
   */
  private async processUpdate(event: UpdateEvent): Promise<void> {
    const relevantClients = this.findRelevantClients(event);
    
    if (relevantClients.length === 0) {
      return;
    }

    // Cache the update for offline clients
    await this.cacheUpdate(event);

    // Broadcast to connected clients
    relevantClients.forEach(socketId => {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit('update', event);
        this.messageCount++;
      }
    });
  }

  /**
   * Find clients interested in this update
   */
  private findRelevantClients(event: UpdateEvent): string[] {
    const relevantClients: string[] = [];

    this.subscriptions.forEach((subscription, socketId) => {
      let isRelevant = false;

      switch (event.type) {
        case 'archetype_update':
          isRelevant = subscription.interests.includes(event.archetypeId || '') ||
                      subscription.interests.includes('all_archetypes');
          break;
        
        case 'trend_update':
          isRelevant = subscription.interests.includes('trends') ||
                      subscription.interests.includes('all_updates');
          break;
        
        case 'user_activity':
          isRelevant = subscription.userId === event.userId ||
                      subscription.interests.includes('user_activity');
          break;
        
        case 'moderation_action':
          isRelevant = subscription.interests.includes('moderation') ||
                      subscription.interests.includes('admin_updates');
          break;
        
        case 'system_metric':
          isRelevant = subscription.interests.includes('system_metrics');
          break;
      }

      if (isRelevant) {
        relevantClients.push(socketId);
      }
    });

    return relevantClients;
  }

  /**
   * Cache update for offline clients
   */
  private async cacheUpdate(event: UpdateEvent): Promise<void> {
    const cacheKey = `updates:${event.type}:${Date.now()}`;
    await this.cache.set(cacheKey, event, { ttl: 3600 }); // 1 hour TTL
  }

  /**
   * Start processing queued updates
   */
  private startQueueProcessor(): void {
    setInterval(async () => {
      if (this.updateQueue.length === 0) {
        return;
      }

      const batch = this.updateQueue.splice(0, 100); // Process up to 100 updates at once
      
      for (const event of batch) {
        try {
          await this.processUpdate(event);
        } catch (error) {
          console.error('Error processing queued update:', error);
          this.errorCount++;
        }
      }
    }, 100); // Process every 100ms
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateMetrics();
    }, 1000); // Update metrics every second

    // Reset counters every minute
    setInterval(() => {
      this.messageCount = 0;
      this.errorCount = 0;
      this.latencySum = 0;
      this.latencyCount = 0;
    }, 60000);
  }

  /**
   * Update real-time metrics
   */
  private updateMetrics(): void {
    this.metrics.messagesPerSecond = this.messageCount;
    this.metrics.errorRate = this.messageCount > 0 ? this.errorCount / this.messageCount : 0;
    this.metrics.averageLatency = this.latencyCount > 0 ? this.latencySum / this.latencyCount : 0;
  }

  /**
   * Record latency measurement
   */
  private recordLatency(latency: number): void {
    this.latencySum += latency;
    this.latencyCount++;
  }

  /**
   * Get current system metrics
   */
  getSystemMetrics(): any {
    const queryStats = this.queryMonitor.getStats();
    
    return {
      realTime: this.metrics,
      database: {
        averageQueryTime: queryStats.averageQueryTime,
        slowQueryCount: queryStats.slowQueries.length,
        errorRate: queryStats.errorRate,
        poolUtilization: queryStats.poolUtilization,
      },
      server: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Get real-time metrics
   */
  getMetrics(): RealTimeMetrics {
    return { ...this.metrics };
  }

  /**
   * Cleanup inactive subscriptions
   */
  cleanupInactiveSubscriptions(): void {
    const now = Date.now();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

    this.subscriptions.forEach((subscription, socketId) => {
      if (now - subscription.lastActivity > inactiveThreshold) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
        this.subscriptions.delete(socketId);
      }
    });
  }

  /**
   * Shutdown the real-time service
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down real-time update service...');
    
    // Notify all clients
    this.io.emit('server_shutdown', { message: 'Server is shutting down' });
    
    // Close all connections
    this.io.close();
    
    console.log('Real-time update service shut down successfully');
  }
}

// Utility functions for common update types
export class UpdateBroadcaster {
  constructor(private realTimeService: RealTimeUpdateService) {}

  /**
   * Broadcast archetype update
   */
  async archetypeUpdated(archetypeId: string, data: any, userId?: string): Promise<void> {
    await this.realTimeService.broadcastUpdate({
      type: 'archetype_update',
      data,
      timestamp: Date.now(),
      userId,
      archetypeId,
    });
  }

  /**
   * Broadcast trend update
   */
  async trendUpdated(data: any): Promise<void> {
    await this.realTimeService.broadcastUpdate({
      type: 'trend_update',
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast user activity
   */
  async userActivity(userId: string, activity: any): Promise<void> {
    await this.realTimeService.broadcastUpdate({
      type: 'user_activity',
      data: activity,
      timestamp: Date.now(),
      userId,
    });
  }

  /**
   * Broadcast moderation action
   */
  async moderationAction(action: any, userId?: string): Promise<void> {
    await this.realTimeService.broadcastUpdate({
      type: 'moderation_action',
      data: action,
      timestamp: Date.now(),
      userId,
    });
  }

  /**
   * Broadcast system metrics
   */
  async systemMetrics(metrics: any): Promise<void> {
    await this.realTimeService.broadcastUpdate({
      type: 'system_metric',
      data: metrics,
      timestamp: Date.now(),
    });
  }
}

export { RealTimeUpdateService, UpdateBroadcaster, type UpdateEvent, type RealTimeMetrics }; 