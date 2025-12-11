import React, { useState } from 'react';
import { NotificationCenter } from '../components/notifications/NotificationCenter.js';
import { notificationService } from '../services/NotificationService.js';

/**
 * Example component showing how to integrate the complete notification system
 * This demonstrates all the features implemented for task 14:
 * 
 * 1. Notification display components ✓
 * 2. Notification center with action buttons ✓
 * 3. Real-time notification updates ✓
 * 4. Notification history and management ✓
 * 5. Floating cards with direct action options (Requirement 7.5) ✓
 */
export const NotificationSystemExample: React.FC = () => {
  const [userId] = useState('user_123'); // In real app, get from auth context

  const handleNotificationAction = async (action: string, notificationId: string, notification: any) => {
    console.log('Handling notification action:', { action, notificationId, notification });

    switch (action) {
      case 'approve':
        // Handle approval
        console.log('Approving proposal:', notification.data?.propostaId);
        break;
      
      case 'reject':
        // Handle rejection
        console.log('Rejecting proposal:', notification.data?.propostaId);
        break;
      
      case 'view_report':
        // Navigate to report
        console.log('Viewing report:', notification.data?.normalizacaoId);
        break;
      
      case 'create_pcd_vaga':
        // Navigate to create PcD position
        console.log('Creating PcD position');
        break;
      
      default:
        console.log('Unknown action:', action);
    }
  };

  // Demo functions to test the notification system
  const sendTestNotification = async (type: 'info' | 'success' | 'warning' | 'error') => {
    const notifications = {
      info: {
        templateId: 'test_notification',
        recipient: userId,
        variables: {
          title: 'Informação do Sistema',
          message: 'Esta é uma notificação informativa de teste.',
          actionUrl: '/dashboard',
          actionText: 'Ver Dashboard'
        }
      },
      success: {
        templateId: 'proposta_aprovada',
        recipient: userId,
        variables: {
          descricao: 'Criação de 2 vagas para Desenvolvedor Pleno',
          aprovador: 'João Silva',
          comentario: 'Aprovado conforme orçamento disponível'
        }
      },
      warning: {
        templateId: 'pcd_alerta',
        recipient: userId,
        variables: {
          empresa: 'Senior Sistemas S.A.',
          pcdAtual: '12',
          percentualAtual: '2.1',
          pcdMeta: '15',
          percentualMeta: '3.0',
          deficit: '3'
        }
      },
      error: {
        templateId: 'normalizacao_erro',
        recipient: userId,
        variables: {
          erro: 'Falha na conexão com RH Legado',
          detalhes: 'Timeout na sincronização de dados'
        }
      }
    };

    try {
      await notificationService.sendNotification(notifications[type]);
      console.log(`${type} notification sent`);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const sendPropostaNotification = async () => {
    // Simulate a proposal notification with action buttons
    const notification = {
      userId,
      title: 'Nova Proposta Pendente',
      message: 'Proposta de criação de 3 vagas para Analista Senior requer sua aprovação.',
      type: 'warning' as const,
      actionText: 'Revisar Proposta',
      actionUrl: '/propostas/prop_123',
      data: {
        type: 'proposta_pendente',
        propostaId: 'prop_123',
        solicitante: 'Maria Santos',
        tipo: 'inclusao',
        impactoOrcamentario: 'R$ 45.000/mês'
      }
    };

    // Simulate receiving the notification
    const event = new CustomEvent('notification', { detail: notification });
    window.dispatchEvent(event);
  };

  const sendNormalizacaoNotification = async () => {
    const notification = {
      userId,
      title: 'Normalização Concluída',
      message: 'Normalização do quadro efetivo processou 127 postos de trabalho com 23 alterações.',
      type: 'success' as const,
      actionText: 'Ver Relatório',
      actionUrl: '/normalizacao/relatorio/norm_456',
      data: {
        type: 'normalizacao_concluida',
        normalizacaoId: 'norm_456',
        postosProcessados: 127,
        alteracoes: 23,
        tempoExecucao: '2m 34s'
      }
    };

    const event = new CustomEvent('notification', { detail: notification });
    window.dispatchEvent(event);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Sistema de Notificações - Exemplo Completo</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>Funcionalidades Implementadas</h2>
        <ul>
          <li>✅ Componentes de exibição de notificações</li>
          <li>✅ Central de notificações com botões de ação</li>
          <li>✅ Atualizações em tempo real</li>
          <li>✅ Histórico e gerenciamento de notificações</li>
          <li>✅ Cards flutuantes com opções de ação direta (Req. 7.5)</li>
        </ul>
      </div>

      {/* Notification Center - This is the main component */}
      <div style={{ 
        position: 'fixed', 
        top: '20px', 
        right: '20px',
        zIndex: 1000,
        background: 'white',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <NotificationCenter
          userId={userId}
          enableRealTime={true}
          showPreferences={true}
          maxFloatingNotifications={3}
          onNotificationAction={handleNotificationAction}
        />
      </div>

      <div style={{ marginTop: '60px' }}>
        <h2>Testar Notificações</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <button 
            onClick={() => sendTestNotification('info')}
            style={{ padding: '10px 15px', backgroundColor: '#1E90FF', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Notificação Info
          </button>
          <button 
            onClick={() => sendTestNotification('success')}
            style={{ padding: '10px 15px', backgroundColor: '#28A745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Notificação Sucesso
          </button>
          <button 
            onClick={() => sendTestNotification('warning')}
            style={{ padding: '10px 15px', backgroundColor: '#FFC107', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Notificação Aviso
          </button>
          <button 
            onClick={() => sendTestNotification('error')}
            style={{ padding: '10px 15px', backgroundColor: '#DC3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Notificação Erro
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={sendPropostaNotification}
            style={{ padding: '10px 15px', backgroundColor: '#6F42C1', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Proposta Pendente (com ações)
          </button>
          <button 
            onClick={sendNormalizacaoNotification}
            style={{ padding: '10px 15px', backgroundColor: '#20C997', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Normalização Concluída
          </button>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>Como Usar</h2>
        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
          <h3>1. Integração Básica</h3>
          <pre style={{ backgroundColor: '#e9ecef', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
{`import { NotificationCenter } from './components/notifications';

// No seu componente principal (App.tsx)
<NotificationCenter
  userId={currentUser.id}
  enableRealTime={true}
  showPreferences={true}
  onNotificationAction={handleNotificationAction}
/>`}
          </pre>

          <h3>2. Enviar Notificações</h3>
          <pre style={{ backgroundColor: '#e9ecef', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
{`import { notificationService } from './services/NotificationService';

// Enviar notificação
await notificationService.sendNotification({
  templateId: 'proposta_criada',
  recipient: 'user_123',
  variables: {
    descricao: 'Nova vaga criada',
    solicitante: 'João Silva'
  }
});`}
          </pre>

          <h3>3. Notificações Flutuantes (Req. 7.5)</h3>
          <p>
            As notificações flutuantes aparecem automaticamente no canto da tela com botões de ação direta,
            permitindo que o usuário aprove/rejeite propostas, visualize relatórios ou execute outras ações
            sem sair da página atual.
          </p>

          <h3>4. Histórico e Gerenciamento</h3>
          <p>
            Clique no sino de notificações e depois na aba "Histórico" para ver todas as notificações,
            filtrar por tipo/status, marcar como lida/não lida, arquivar ou excluir.
          </p>
        </div>
      </div>
    </div>
  );
};