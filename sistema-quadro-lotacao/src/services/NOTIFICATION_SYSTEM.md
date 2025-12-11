# Sistema de Notificações

Este documento descreve o sistema de notificações integrado com a Platform Notifications API da Senior X.

## Visão Geral

O sistema de notificações oferece:
- **Multi-canal**: Email, SMS e notificações in-app
- **Templates**: Templates pré-configurados para diferentes cenários
- **Preferências**: Configuração personalizada por usuário
- **Integração**: Integração transparente com Platform Notifications API
- **Confiabilidade**: Tratamento de erros e fallbacks

## Componentes Principais

### 1. NotificationService
Serviço principal que gerencia o envio de notificações.

```typescript
import { notificationService } from '../services/NotificationService.js';

// Enviar notificação usando template
const results = await notificationService.sendNotification({
  templateId: 'proposta_criada',
  recipient: 'user@company.com',
  variables: {
    descricao: 'Nova vaga para Desenvolvedor',
    solicitante: 'João Silva',
    actionUrl: '/propostas/123'
  },
  channels: ['email', 'inapp'],
  priority: 'normal'
});
```

### 2. NotificationHelpers
Funções auxiliares para cenários comuns do sistema.

```typescript
import { NotificationHelpers } from '../services/NotificationHelpers.js';

// Notificar criação de proposta
await NotificationHelpers.notifyPropostaCriada(
  proposta,
  'João Silva',
  'aprovador@company.com'
);

// Notificar conclusão de normalização
await NotificationHelpers.notifyNormalizacaoConcluida(
  50, // postos processados
  10, // alterações
  '2 minutos',
  'rh@company.com'
);
```

### 3. NotificationController
Controller para gerenciar notificações via API REST.

```typescript
// GET /api/notifications/preferences/:userId
// PUT /api/notifications/preferences/:userId
// POST /api/notifications/send
// GET /api/notifications/templates
```

## Templates Disponíveis

### proposta_criada
Notifica quando uma nova proposta é criada.
- **Variáveis**: `descricao`, `solicitante`, `tipo`, `impactoOrcamentario`, `actionUrl`
- **Canais**: Email, In-app

### proposta_aprovada
Notifica quando uma proposta é aprovada.
- **Variáveis**: `descricao`, `aprovador`, `comentario`
- **Canais**: Email, SMS, In-app

### proposta_rejeitada
Notifica quando uma proposta é rejeitada.
- **Variáveis**: `descricao`, `aprovador`, `comentario`
- **Canais**: Email, In-app

### normalizacao_concluida
Notifica quando a normalização é concluída.
- **Variáveis**: `postosProcessados`, `alteracoes`, `tempoExecucao`, `actionUrl`
- **Canais**: Email, In-app

### pcd_alerta
Alerta sobre conformidade PcD.
- **Variáveis**: `empresa`, `pcdAtual`, `percentualAtual`, `pcdMeta`, `percentualMeta`, `deficit`
- **Canais**: Email, In-app

## Configuração de Preferências

### Estrutura de Preferências
```typescript
interface NotificationPreferences {
  userId: string;
  channels: NotificationChannel[];
  propostas: boolean;
  normalizacao: boolean;
  pcdAlerts: boolean;
  auditoria: boolean;
}

interface NotificationChannel {
  type: 'email' | 'sms' | 'inapp';
  enabled: boolean;
}
```

### Exemplo de Uso
```typescript
// Obter preferências do usuário
const preferences = await notificationService.getUserPreferences('user123');

// Atualizar preferências
const success = await notificationService.updateUserPreferences('user123', {
  channels: [
    { type: 'email', enabled: true },
    { type: 'sms', enabled: false },
    { type: 'inapp', enabled: true }
  ],
  propostas: true,
  pcdAlerts: true
});
```

## Componentes React

### NotificationPreferences
Componente para gerenciar preferências de notificação.

```tsx
import { NotificationPreferences } from '../components/notifications';

<NotificationPreferences
  userId="user123"
  onSave={(preferences) => console.log('Saved:', preferences)}
  onCancel={() => console.log('Cancelled')}
/>
```

### InAppNotifications
Componente para exibir notificações in-app.

```tsx
import { InAppNotifications } from '../components/notifications';

<InAppNotifications
  userId="user123"
  maxVisible={5}
  autoHideDelay={5000}
/>
```

## Integração com Serviços Existentes

### PropostaService
```typescript
import { PropostaServiceWithNotifications } from '../services/PropostaServiceWithNotifications.js';

const propostaService = new PropostaServiceWithNotifications(pool, auditService);

// Criar proposta com notificação automática
const proposta = await propostaService.createProposta(request, workflowConfig, auditContext);
```

### Exemplo de Integração Manual
```typescript
// Em qualquer controller ou service
import { NotificationHelpers } from '../services/NotificationHelpers.js';

// Após criar/atualizar uma entidade
try {
  await NotificationHelpers.notifyPropostaCriada(proposta, userName, approverId);
} catch (error) {
  console.error('Notification failed:', error);
  // Não falhar a operação principal se a notificação falhar
}
```

## Configuração da API Platform

### Variáveis de Ambiente
```env
PLATFORM_NOTIFICATIONS_URL=https://api.senior.com.br/notifications
PLATFORM_CLIENT_ID=QUADRO_VAGAS_APP
PLATFORM_CLIENT_SECRET=your-secret-here
```

### Headers Obrigatórios
```typescript
{
  'Authorization': 'Bearer <access_token>',
  'Content-Type': 'application/json'
}
```

## Tratamento de Erros

### Estratégias de Fallback
1. **Cache de Preferências**: Se a API falhar, usa preferências padrão
2. **Retry Logic**: Tentativas automáticas com backoff exponencial
3. **Graceful Degradation**: Operações principais não falham se notificação falhar
4. **Logging**: Todos os erros são logados para debugging

### Exemplo de Tratamento
```typescript
try {
  const results = await notificationService.sendNotification(request);
  
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.warn('Some notifications failed:', failures);
  }
} catch (error) {
  console.error('Notification service error:', error);
  // Continue with main operation
}
```

## Monitoramento e Métricas

### Métricas Importantes
- Taxa de entrega por canal (email, SMS, in-app)
- Tempo de resposta da Platform API
- Taxa de erro por template
- Preferências de usuário mais comuns

### Logs de Auditoria
Todas as notificações enviadas são logadas com:
- Timestamp
- Recipient
- Template usado
- Canais utilizados
- Status de entrega
- Erros (se houver)

## Testes

### Testes Unitários
```bash
npm test src/services/NotificationService.test.ts
```

### Teste de Integração
```typescript
// Testar entrega de notificação
const results = await NotificationController.testNotification({
  body: {
    recipient: 'test@company.com',
    channel: 'email'
  }
});
```

## Melhores Práticas

### 1. Não Falhar Operações Principais
```typescript
// ✅ Correto
try {
  const proposta = await propostaService.create(data);
  
  // Notificação em background - não falha se der erro
  NotificationHelpers.notifyPropostaCriada(proposta, user, approver)
    .catch(error => console.error('Notification failed:', error));
    
  return proposta;
} catch (error) {
  // Só falha se a operação principal falhar
  throw error;
}

// ❌ Incorreto
const proposta = await propostaService.create(data);
await NotificationHelpers.notifyPropostaCriada(proposta, user, approver); // Pode falhar toda a operação
```

### 2. Usar Templates Apropriados
```typescript
// ✅ Correto - usar template específico
await NotificationHelpers.notifyPropostaCriada(proposta, user, approver);

// ❌ Incorreto - construir notificação manualmente
await notificationService.sendNotification({
  templateId: 'generic',
  recipient: approver,
  variables: { message: 'Nova proposta criada' }
});
```

### 3. Respeitar Preferências do Usuário
```typescript
// ✅ Correto - o serviço verifica preferências automaticamente
await notificationService.sendNotification(request);

// ❌ Incorreto - forçar canal específico sem verificar preferências
await notificationService.sendEmail(notification);
```

### 4. Usar Prioridades Adequadas
- `urgent`: Alertas críticos (PcD, segurança)
- `high`: Aprovações importantes, rejeições
- `normal`: Criação de propostas, conclusão de processos
- `low`: Lembretes, notificações informativas

## Roadmap

### Próximas Funcionalidades
- [ ] Notificações push para mobile
- [ ] Templates personalizáveis por empresa
- [ ] Agendamento de notificações
- [ ] Relatórios de entrega
- [ ] Integração com Microsoft Teams
- [ ] Notificações por webhook para sistemas externos