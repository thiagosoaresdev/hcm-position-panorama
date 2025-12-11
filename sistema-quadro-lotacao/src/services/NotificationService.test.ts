import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { NotificationService, type NotificationRequest } from './NotificationService.js';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn()
  }
}));
const mockedAxios = vi.mocked(axios);

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockAxiosInstance = {
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      defaults: { headers: {} }
    };
    
    (mockedAxios.create as any).mockReturnValue(mockAxiosInstance);
    notificationService = new NotificationService('test-token');
  });

  describe('sendNotification', () => {
    it('should send email notification successfully', async () => {
      // Arrange
      const request: NotificationRequest = {
        templateId: 'proposta_criada',
        recipient: 'user@test.com',
        variables: {
          descricao: 'Test proposta',
          solicitante: 'Test User',
          tipo: 'inclusao',
          impactoOrcamentario: 'R$ 10.000',
          actionUrl: '/propostas/123'
        },
        channels: ['email']
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          userId: 'user@test.com',
          channels: [
            { type: 'email', enabled: true },
            { type: 'sms', enabled: false },
            { type: 'inapp', enabled: true }
          ],
          propostas: true,
          normalizacao: true,
          pcdAlerts: true,
          auditoria: false
        }
      });

      mockAxiosInstance.post.mockResolvedValue({
        data: { messageId: 'msg-123' }
      });

      // Act
      const results = await notificationService.sendNotification(request);

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].messageId).toBe('msg-123');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/email/send', {
        notification_type: 'email',
        recipient: 'user@test.com',
        subject: 'Nova proposta criada: Test proposta',
        body: expect.stringContaining('Test proposta'),
        html: expect.any(String)
      });
    });

    it('should send SMS notification successfully', async () => {
      // Arrange
      const request: NotificationRequest = {
        templateId: 'proposta_aprovada',
        recipient: '+5511999999999',
        variables: {
          descricao: 'Test proposta',
          aprovador: 'Manager',
          comentario: 'Approved'
        },
        channels: ['sms']
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          userId: '+5511999999999',
          channels: [
            { type: 'email', enabled: false },
            { type: 'sms', enabled: true },
            { type: 'inapp', enabled: false }
          ],
          propostas: true,
          normalizacao: true,
          pcdAlerts: true,
          auditoria: false
        }
      });

      mockAxiosInstance.post.mockResolvedValue({
        data: { messageId: 'sms-456' }
      });

      // Act
      const results = await notificationService.sendNotification(request);

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].messageId).toBe('sms-456');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/sms/send', {
        notification_type: 'sms',
        recipient: '+5511999999999',
        message: expect.stringContaining('Test proposta')
      });
    });

    it('should send in-app notification successfully', async () => {
      // Arrange
      const request: NotificationRequest = {
        templateId: 'normalizacao_concluida',
        recipient: 'user123',
        variables: {
          postosProcessados: '50',
          alteracoes: '10',
          tempoExecucao: '2 minutos',
          actionUrl: '/normalizacao/historico'
        },
        channels: ['inapp']
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          userId: 'user123',
          channels: [
            { type: 'email', enabled: false },
            { type: 'sms', enabled: false },
            { type: 'inapp', enabled: true }
          ],
          propostas: true,
          normalizacao: true,
          pcdAlerts: true,
          auditoria: false
        }
      });

      mockAxiosInstance.post.mockResolvedValue({
        data: { messageId: 'inapp-789' }
      });

      // Act
      const results = await notificationService.sendNotification(request);

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].messageId).toBe('inapp-789');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/inapp/send', {
        notification_type: 'inapp',
        recipient: 'user123',
        title: 'Normalização do quadro concluída',
        message: expect.stringContaining('50'),
        type: 'info',
        action_url: '/normalizacao/historico',
        action_text: 'Ver Detalhes',
        data: expect.any(Object)
      });
    });

    it('should handle template not found error', async () => {
      // Arrange
      const request: NotificationRequest = {
        templateId: 'non_existent_template',
        recipient: 'user@test.com',
        variables: {}
      };

      // Act
      const results = await notificationService.sendNotification(request);

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Template not found: non_existent_template');
    });

    it('should handle no enabled channels', async () => {
      // Arrange
      const request: NotificationRequest = {
        templateId: 'proposta_criada',
        recipient: 'user@test.com',
        variables: {},
        channels: ['email']
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          userId: 'user@test.com',
          channels: [
            { type: 'email', enabled: false },
            { type: 'sms', enabled: false },
            { type: 'inapp', enabled: false }
          ],
          propostas: true,
          normalizacao: true,
          pcdAlerts: true,
          auditoria: false
        }
      });

      // Act
      const results = await notificationService.sendNotification(request);

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('No enabled channels for user');
    });
  });
  describe('getUserPreferences', () => {
    it('should get user preferences from API', async () => {
      // Arrange
      const userId = 'user123';
      const expectedPreferences = {
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

      mockAxiosInstance.get.mockResolvedValue({
        data: expectedPreferences
      });

      // Act
      const preferences = await notificationService.getUserPreferences(userId);

      // Assert
      expect(preferences).toEqual(expectedPreferences);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/preferences/user123');
    });

    it('should return default preferences when API fails', async () => {
      // Arrange
      const userId = 'user123';
      mockAxiosInstance.get.mockRejectedValue(new Error('API Error'));

      // Act
      const preferences = await notificationService.getUserPreferences(userId);

      // Assert
      expect(preferences.userId).toBe(userId);
      expect(preferences.channels).toHaveLength(3);
      expect(preferences.channels.find(c => c.type === 'email')?.enabled).toBe(true);
      expect(preferences.channels.find(c => c.type === 'sms')?.enabled).toBe(false);
      expect(preferences.channels.find(c => c.type === 'inapp')?.enabled).toBe(true);
    });

    it('should cache user preferences', async () => {
      // Arrange
      const userId = 'user123';
      const preferences = {
        userId,
        channels: [{ type: 'email', enabled: true }],
        propostas: true,
        normalizacao: true,
        pcdAlerts: true,
        auditoria: false
      };

      mockAxiosInstance.get.mockResolvedValue({ data: preferences });

      // Act
      await notificationService.getUserPreferences(userId);
      await notificationService.getUserPreferences(userId);

      // Assert
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateUserPreferences', () => {
    it('should update user preferences successfully', async () => {
      // Arrange
      const userId = 'user123';
      const updates = {
        channels: [
          { type: 'email' as const, enabled: false },
          { type: 'sms' as const, enabled: true }
        ]
      };

      mockAxiosInstance.put.mockResolvedValue({ data: { success: true } });
      mockAxiosInstance.get.mockResolvedValue({
        data: { userId, ...updates, propostas: true, normalizacao: true, pcdAlerts: true, auditoria: false }
      });

      // Act
      const result = await notificationService.updateUserPreferences(userId, updates);

      // Assert
      expect(result).toBe(true);
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/preferences/user123', updates);
    });

    it('should handle update failure', async () => {
      // Arrange
      const userId = 'user123';
      const updates = { propostas: false };

      mockAxiosInstance.put.mockRejectedValue(new Error('Update failed'));

      // Act
      const result = await notificationService.updateUserPreferences(userId, updates);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('template management', () => {
    it('should get template by ID', () => {
      // Act
      const template = notificationService.getTemplate('proposta_criada');

      // Assert
      expect(template).toBeDefined();
      expect(template?.id).toBe('proposta_criada');
      expect(template?.name).toBe('Proposta Criada');
    });

    it('should return undefined for non-existent template', () => {
      // Act
      const template = notificationService.getTemplate('non_existent');

      // Assert
      expect(template).toBeUndefined();
    });

    it('should set custom template', () => {
      // Arrange
      const customTemplate = {
        id: 'custom_template',
        name: 'Custom Template',
        subject: 'Custom Subject',
        body: 'Custom Body',
        variables: ['var1'],
        channels: ['email' as const]
      };

      // Act
      notificationService.setTemplate(customTemplate);
      const retrieved = notificationService.getTemplate('custom_template');

      // Assert
      expect(retrieved).toEqual(customTemplate);
    });

    it('should get all templates', () => {
      // Act
      const templates = notificationService.getAllTemplates();

      // Assert
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some(t => t.id === 'proposta_criada')).toBe(true);
      expect(templates.some(t => t.id === 'proposta_aprovada')).toBe(true);
    });
  });

  describe('utility methods', () => {
    it('should clear preferences cache for specific user', () => {
      // Arrange
      const userId = 'user123';
      mockAxiosInstance.get.mockResolvedValue({
        data: { userId, channels: [], propostas: true, normalizacao: true, pcdAlerts: true, auditoria: false }
      });

      // Act & Assert
      notificationService.getUserPreferences(userId);
      notificationService.clearPreferencesCache(userId);
      notificationService.getUserPreferences(userId);

      // Should call API twice since cache was cleared
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('should update access token', () => {
      // Arrange
      const newToken = 'new-access-token';

      // Act
      notificationService.updateAccessToken(newToken);

      // Assert
      expect(mockAxiosInstance.defaults.headers['Authorization']).toBe(`Bearer ${newToken}`);
    });
  });
});