// Services exports
export { QuadroLotacaoService } from './QuadroLotacaoService.js';
export { QuadroLotacaoServiceWithAudit } from './QuadroLotacaoServiceWithAudit.js';
export { AuditService, type AuditContext, type AuditSearchCriteria, type AuditTrailEntry, type AuditStats } from './AuditService.js';
export { AuditMiddleware } from './AuditMiddleware.js';
export { AuditUtils, Auditable } from './AuditUtils.js';
export { PropostaService, type CreatePropostaRequest, type ApprovalRequest, type RejectionRequest } from './PropostaService.js';
export { 
  NotificationService, 
  notificationService,
  type NotificationChannel,
  type NotificationPreferences,
  type NotificationTemplate,
  type NotificationRequest,
  type EmailNotification,
  type SMSNotification,
  type InAppNotification,
  type NotificationResult
} from './NotificationService.js';
export { NotificationHelpers } from './NotificationHelpers.js';
export { 
  PcDComplianceService,
  type PcDComplianceData,
  type PcDAlert,
  type PcDReport
} from './PcDComplianceService.js';
export { 
  AnalyticsService,
  analyticsService,
  type AnalyticsFilters,
  type AnalyticsReport,
  type OccupancyRate,
  type TrendData,
  type PeriodComparison,
  type ExportOptions
} from './AnalyticsService.js';