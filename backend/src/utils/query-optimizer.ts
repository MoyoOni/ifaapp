import { PrismaClient } from '@prisma/client';

/**
 * Query Performance Analysis Utility
 * Helps identify slow queries and optimize database performance
 */
export class QueryOptimizer {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Enable query logging for performance analysis
   */
  async enableQueryLogging(): Promise<void> {
    // This would typically be configured in the Prisma client setup
    // For now, we'll create helper methods to analyze queries
  }

  /**
   * Analyze common query patterns and suggest optimizations
   */
  async analyzeQueryPatterns(): Promise<QueryAnalysisReport> {
    const report: QueryAnalysisReport = {
      slowQueries: [],
      missingIndexes: [],
      recommendations: [],
    };

    // Check for common query patterns that could benefit from indexes
    const patterns = await this.identifyQueryPatterns();

    // Analyze appointment queries
    if (patterns.appointmentQueries > 100) {
      report.recommendations.push({
        type: 'INDEX',
        table: 'Appointment',
        columns: ['date', 'status'],
        reason: 'High volume of appointment queries by date and status',
      });
    }

    // Analyze guidance plan queries
    if (patterns.guidancePlanQueries > 50) {
      report.recommendations.push({
        type: 'INDEX',
        table: 'GuidancePlan',
        columns: ['babalawoId', 'status'],
        reason: 'Frequent guidance plan lookups by babalawo and status',
      });
    }

    // Analyze transaction queries
    if (patterns.transactionQueries > 200) {
      report.recommendations.push({
        type: 'INDEX',
        table: 'Transaction',
        columns: ['userId', 'type'],
        reason: 'High volume of transaction queries by user and type',
      });
    }

    return report;
  }

  /**
   * Identify common query patterns in the application
   */
  private async identifyQueryPatterns(): Promise<QueryPatterns> {
    // This would typically integrate with application logging
    // For now, return sample data based on common usage patterns

    return {
      appointmentQueries: 150,
      guidancePlanQueries: 75,
      transactionQueries: 300,
      orderQueries: 120,
      userQueries: 200,
    };
  }

  /**
   * Get database statistics and performance metrics
   */
  async getDatabaseStats(): Promise<DatabaseStats> {
    try {
      // Get table sizes
      const tableSizes = (await this.prisma.$queryRaw`
        SELECT 
          tablename,
          pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size,
          (xpath('/row/c/text()', xmlagg(xpath('//text()', query_to_xml(format('SELECT COUNT(*) FROM %I', tablename), true, true, '')))))[1]::text::int as row_count
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(tablename::regclass) DESC
      `) as any[];

      // Get index usage statistics
      const indexStats = (await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        ORDER BY idx_tup_read DESC
        LIMIT 10
      `) as any[];

      return {
        tableSizes,
        indexUsage: indexStats,
        totalTables: tableSizes.length,
        largestTable: tableSizes[0]?.tablename || 'Unknown',
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {
        tableSizes: [],
        indexUsage: [],
        totalTables: 0,
        largestTable: 'Unknown',
      };
    }
  }

  /**
   * Generate query optimization recommendations
   */
  async generateRecommendations(): Promise<OptimizationRecommendation[]> {
    const analysis = await this.analyzeQueryPatterns();
    const stats = await this.getDatabaseStats();

    const recommendations: OptimizationRecommendation[] = [...analysis.recommendations];

    // Add general recommendations based on database stats
    if (stats.tableSizes.length > 0) {
      const largeTables = stats.tableSizes.filter(
        (table: any) => parseInt(table.size) > 1000000 // 1MB threshold
      );

      largeTables.forEach((table: any) => {
        recommendations.push({
          type: 'PARTITION',
          table: table.tablename,
          reason: `Large table (${table.size}) may benefit from partitioning`,
          columns: ['createdAt'],
        });
      });
    }

    return recommendations;
  }
}

// Types
interface QueryAnalysisReport {
  slowQueries: SlowQuery[];
  missingIndexes: MissingIndex[];
  recommendations: OptimizationRecommendation[];
}

interface SlowQuery {
  query: string;
  executionTime: number;
  frequency: number;
}

interface MissingIndex {
  table: string;
  columns: string[];
  suggestedIndex: string;
}

interface OptimizationRecommendation {
  type: 'INDEX' | 'PARTITION' | 'QUERY_REWRITE';
  table: string;
  columns?: string[];
  reason: string;
}

interface QueryPatterns {
  appointmentQueries: number;
  guidancePlanQueries: number;
  transactionQueries: number;
  orderQueries: number;
  userQueries: number;
}

interface DatabaseStats {
  tableSizes: any[];
  indexUsage: any[];
  totalTables: number;
  largestTable: string;
}
