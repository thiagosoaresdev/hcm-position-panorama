import axios, { AxiosInstance } from 'axios';
import { platformConfig } from '../core/config/environment.js';

// Notification types and interfaces
export interface NotificationChannel {
  type: 'email' | 'sms' | 'inapp';
  enabled: boolean;
}

export interface NotificationPreferences {
  userId: string;
  channels: NotificationChannel[];
  propostas: boolean;
  normalizacao: boolean;
  pcdAlerts: boolean;
  auditoria: boolean;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  channels: ('email' | 'sms' | 'inapp')[];
}

export interface NotificationRequest {
  templateId: string;
  recipient: string;
  variables: Record<string, any>;
  channels?: ('email' | 'sms' | 'inapp')[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    encoding?: string;
  }>;
}

export interface SMSNotification {
  to: string;
  message: string;
}

export interface InAppNotification {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  actionText?: string;
  data?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
/**
 * NotificationService - Integrates with Platform Notifications API
 * Provides multi-channel notification delivery (email, SMS, in-app)
 * Manages user preferences and notification templates
 */
export class NotificationService {
  private apiClient: AxiosInstance;
  private templates: Map<string, NotificationTemplate> = new Map();
  private userPreferences: Map<string, NotificationPreferences> = new Map();

  constructor(accessToken?: string) {
    this.apiClient = axios.create({
      baseURL: platformConfig.notifications.url,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
      },
      timeout: 10000
    });

    this.initializeTemplates();
  }

  /**
   * Initialize default notification templates
   */
  private initializeTemplates(): void {
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: 'proposta_criada',
        name: 'Proposta Criada',
        subject: 'Nova proposta criada: {{descricao}}',
        body: 'Uma nova proposta foi criada por {{solicitante}} e requer sua aprovação.\n\nDescrição: {{descricao}}\nTipo: {{tipo}}\nImpacto: {{impactoOrcamentario}}\n\nAcesse o sistema para revisar: {{actionUrl}}',
        variables: ['descricao', 'solicitante', 'tipo', 'impactoOrcamentario', 'actionUrl'],
        channels: ['email', 'inapp']
      },
      {
        id: 'proposta_aprovada',
        name: 'Proposta Aprovada',
        subject: 'Proposta aprovada: {{descricao}}',
        body: 'Sua proposta foi aprovada por {{aprovador}}.\n\nDescrição: {{descricao}}\nComentário: {{comentario}}\n\nAs alterações foram aplicadas ao quadro de lotação.',
        variables: ['descricao', 'aprovador', 'comentario'],
        channels: ['email', 'sms', 'inapp']
      },
      {
        id: 'proposta_rejeitada',
        name: 'Proposta Rejeitada',
        subject: 'Proposta rejeitada: {{descricao}}',
        body: 'Sua proposta foi rejeitada por {{aprovador}}.\n\nDescrição: {{descricao}}\nMotivo: {{comentario}}\n\nVocê pode editar e reenviar a proposta.',
        variables: ['descricao', 'aprovador', 'comentario'],
        channels: ['email', 'inapp']
      },
      {
        id: 'normalizacao_concluida',
        name: 'Normalização Concluída',
        subject: 'Normalização do quadro concluída',
        body: 'A normalização do quadro efetivo foi concluída.\n\nPostos processados: {{postosProcessados}}\nAlterações realizadas: {{alteracoes}}\nTempo de execução: {{tempoExecucao}}\n\nRelatório completo: {{actionUrl}}',
        variables: ['postosProcessados', 'alteracoes', 'tempoExecucao', 'actionUrl'],
        channels: ['email', 'inapp']
      },
      {
        id: 'pcd_alerta',
        name: 'Alerta PcD',
        subject: 'Alerta de conformidade PcD',
        body: 'A empresa {{empresa}} está abaixo da meta legal de PcD.\n\nAtual: {{pcdAtual}} ({{percentualAtual}}%)\nMeta: {{pcdMeta}} ({{percentualMeta}}%)\nDéficit: {{deficit}} colaboradores\n\nRecomendação: Priorizar contratação de PcD nas próximas vagas.',
        variables: ['empresa', 'pcdAtual', 'percentualAtual', 'pcdMeta', 'percentualMeta', 'deficit'],
        channels: ['email', 'inapp']
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }
  /**
   * Send notification using template
   */
  async sendNotification(request: NotificationRequest): Promise<NotificationResult[]> {
    try {
      const template = this.templates.get(request.templateId);
      if (!template) {
        throw new Error(`Template not found: ${request.templateId}`);
      }

      // Get user preferences
      const preferences = await this.getUserPreferences(request.recipient);
      
      // Determine which channels to use
      const channels = request.channels || template.channels;
      const enabledChannels = channels.filter(channel => 
        preferences.channels.find(c => c.type === channel && c.enabled)
      );

      if (enabledChannels.length === 0) {
        return [{
          success: false,
          error: 'No enabled channels for user'
        }];
      }

      // Process template variables
      const processedSubject = this.processTemplate(template.subject, request.variables);
      const processedBody = this.processTemplate(template.body, request.variables);

      // Send notifications through each enabled channel
      const results: NotificationResult[] = [];

      for (const channel of enabledChannels) {
        let result: NotificationResult;

        switch (channel) {
          case 'email':
            result = await this.sendEmail({
              to: request.recipient,
              subject: processedSubject,
              body: processedBody,
              html: this.convertToHtml(processedBody)
            });
            break;

          case 'sms':
            result = await this.sendSMS({
              to: request.recipient,
              message: `${processedSubject}\n\n${processedBody}`
            });
            break;

          case 'inapp':
            result = await this.sendInApp({
              userId: request.recipient,
              title: processedSubject,
              message: processedBody,
              type: this.getNotificationType(request.priority || 'normal'),
              actionUrl: request.variables.actionUrl,
              actionText: 'Ver Detalhes',
              data: request.variables
            });
            break;

          default:
            result = {
              success: false,
              error: `Unsupported channel: ${channel}`
            };
        }

        results.push(result);
      }

      return results;
    } catch (error) {
      return [{
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }];
    }
  }
  /**
   * Send email notification
   */
  async sendEmail(notification: EmailNotification): Promise<NotificationResult> {
    try {
      const response = await this.apiClient.post('/email/send', {
        notification_type: 'email',
        recipient: notification.to,
        subject: notification.subject,
        body: notification.body,
        html: notification.html,
        attachments: notification.attachments
      });

      return {
        success: true,
        messageId: response.data.messageId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email sending failed'
      };
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMS(notification: SMSNotification): Promise<NotificationResult> {
    try {
      const response = await this.apiClient.post('/sms/send', {
        notification_type: 'sms',
        recipient: notification.to,
        message: notification.message
      });

      return {
        success: true,
        messageId: response.data.messageId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS sending failed'
      };
    }
  }

  /**
   * Send in-app notification
   */
  async sendInApp(notification: InAppNotification): Promise<NotificationResult> {
    try {
      const response = await this.apiClient.post('/inapp/send', {
        notification_type: 'inapp',
        recipient: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        action_url: notification.actionUrl,
        action_text: notification.actionText,
        data: notification.data
      });

      return {
        success: true,
        messageId: response.data.messageId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'In-app notification failed'
      };
    }
  }
  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    // Check cache first
    if (this.userPreferences.has(userId)) {
      return this.userPreferences.get(userId)!;
    }

    try {
      const response = await this.apiClient.get(`/preferences/${userId}`);
      const preferences = response.data;
      
      // Cache preferences
      this.userPreferences.set(userId, preferences);
      
      return preferences;
    } catch (error) {
      // Return default preferences if API call fails
      const defaultPreferences: NotificationPreferences = {
        userId,
        channels: [
          { type: 'email', enabled: true },
          { type: 'sms', enabled: false },
          { type: 'inapp', enabled: true }
        ],
        propostas: true,
        normalizacao: true,
        pcdAlerts: true,
        auditoria: false
      };

      this.userPreferences.set(userId, defaultPreferences);
      return defaultPreferences;
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      await this.apiClient.put(`/preferences/${userId}`, preferences);
      
      // Update cache
      const currentPreferences = await this.getUserPreferences(userId);
      const updatedPreferences = { ...currentPreferences, ...preferences };
      this.userPreferences.set(userId, updatedPreferences);
      
      return true;
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      return false;
    }
  }

  /**
   * Get notification template
   */
  getTemplate(templateId: string): NotificationTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Add or update notification template
   */
  setTemplate(template: NotificationTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }
  /**
   * Process template variables
   */
  private processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      processed = processed.replace(new RegExp(placeholder, 'g'), String(value || ''));
    });
    
    return processed;
  }

  /**
   * Convert plain text to HTML
   */
  private convertToHtml(text: string): string {
    return text
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  /**
   * Get notification type based on priority
   */
  private getNotificationType(priority: string): 'info' | 'success' | 'warning' | 'error' {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'normal':
        return 'info';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  }

  /**
   * Clear user preferences cache
   */
  clearPreferencesCache(userId?: string): void {
    if (userId) {
      this.userPreferences.delete(userId);
    } else {
      this.userPreferences.clear();
    }
  }

  /**
   * Update access token for API calls
   */
  updateAccessToken(accessToken: string): void {
    this.apiClient.defaults.headers['Authorization'] = `Bearer ${accessToken}`;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();