# Webhook Processing System

## Overview

The Webhook Processing System handles real-time integration with RH Legado systems, processing colaborador events (admission, transfer, termination) and automatically updating the quadro efetivo. The system includes comprehensive cargo discrepancy handling, retry logic with exponential backoff, and complete audit trail.

## Requirements Addressed

- **10.1**: Webhook processing with signature validation and automatic quadro efetivo updates
- **10.2**: Cargo discrepancy handling with configurable actions (alertar, permitir, bloquear, exigir_aprovacao)
- **10.5**: Retry logic with exponential backoff for failed webhook processing

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   RH Legado     │───▶│ Webhook          │───▶│ Normalization   │
│   System        │    │ Controller       │    │ Service         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │                         │
                              ▼                         ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │ Cargo Discrepancy│    │ Quadro Efetivo  │
                       │ Handler          │    │ Update          │
                       └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │ Audit & Notify   │
                       └──────────────────┘
```

## Webhook Endpoints

### POST /api/webhooks/colaborador/admitido
Processes colaborador admission events from RH Legado system.

**Request Headers:**
- `X-Webhook-Signature`: HMAC-SHA256 signature for payload validation
- `Content-Type`: application/json

**Request Body:**
```json
{
  "event_type": "colaborador.admitido",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "colaborador_id": "col_001",
    "nome": "João Silva",
    "cpf": "123.456.789-00",
    "cargo_id": "cargo_dev_junior",
    "centro_custo_id": "cc_ti",
    "turno": "integral",
    "data_admissao": "2025-01-15",
    "pcd": false,
    "status": "ativo"
  }
}
```

**Success Response (200):**
```json
{
  "acknowledged": true,
  "message": "Admission processed successfully",
  "colaborador_id": "col_001"
}
```

**Cargo Discrepancy Response (409):**
```json
{
  "error": "Cargo discrepancy detected",
  "message": "Admission blocked due to cargo discrepancy: expected cargo_dev_pleno, got cargo_dev_junior",
  "action": "bloquear",
  "acknowledged": false,
  "colaborador_id": "col_001",
  "proposta_id": "prop_001"
}
```

### POST /api/webhooks/colaborador/transferido
Processes colaborador transfer events between centers.

**Additional Required Fields:**
- `centro_custo_anterior`: Previous center ID
- `cargo_anterior`: Previous cargo ID (optional)
- `data_evento`: Transfer date (optional, defaults to timestamp)

### POST /api/webhooks/colaborador/desligado
Processes colaborador termination events.

**Additional Fields:**
- `data_desligamento`: Termination date (optional, defaults to current date)

### GET /api/webhooks/health
Health check endpoint for monitoring webhook service status.

## Cargo Discrepancy Handling

The system detects when the real cargo differs from the expected cargo in the quadro and applies configurable actions based on company settings.

### Configuration

Company configuration in `empresas.configuracoes.acaoCargoDiscrepante`:

```typescript
type CargoDiscrepancyAction = 'alertar' | 'permitir' | 'bloquear' | 'exigir_aprovacao';
```

### Actions

#### 1. ALERTAR (Alert)
- **Behavior**: Allow admission but send alert to RH team
- **HTTP Response**: 200 (Success)
- **Notifications**: Email + In-app notification to RH
- **Audit**: Discrepancy logged with alert action

#### 2. PERMITIR (Allow)
- **Behavior**: Allow admission without restrictions
- **HTTP Response**: 200 (Success)
- **Notifications**: None
- **Audit**: Discrepancy logged with permit action

#### 3. BLOQUEAR (Block)
- **Behavior**: Block admission, require manual intervention
- **HTTP Response**: 409 (Conflict)
- **Notifications**: None (RH Legado handles rejection)
- **Audit**: Discrepancy logged with block action

#### 4. EXIGIR_APROVACAO (Require Approval)
- **Behavior**: Block admission, create proposal for approval workflow
- **HTTP Response**: 409 (Conflict)
- **Notifications**: Proposal creation notification to RH
- **Audit**: Discrepancy logged + proposal creation logged
- **Workflow**: 3-level approval process (Coordenação → Gerente → Diretor → RH)

## Security

### Webhook Signature Validation

All webhooks must include a valid HMAC-SHA256 signature in the `X-Webhook-Signature` header:

```typescript
const signature = crypto
  .createHmac('sha256', secretKey)
  .update(JSON.stringify(payload))
  .digest('hex');

const headerValue = `sha256=${signature}`;
```

### Configuration

Set the webhook secret key in environment variables:
```bash
WEBHOOK_SECRET_KEY=your-secret-key-here
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_RETRY_DELAY_MS=1000
WEBHOOK_MAX_RETRY_DELAY_MS=10000
```

## Retry Logic

The system implements exponential backoff retry logic for failed webhook processing:

1. **Initial Attempt**: Process webhook immediately
2. **Retry 1**: Wait 1 second, retry
3. **Retry 2**: Wait 2 seconds, retry  
4. **Retry 3**: Wait 4 seconds, retry
5. **Final Failure**: Log error and return 500

**Maximum Delay**: Configurable (default 10 seconds)
**Maximum Attempts**: Configurable (default 3)

## Error Handling

### Validation Errors (400)
- Missing required fields
- Invalid data types
- Invalid enum values

### Authentication Errors (401)
- Missing webhook signature
- Invalid webhook signature
- Signature verification failure

### Business Logic Errors (409)
- Cargo discrepancy with BLOQUEAR action
- Cargo discrepancy with EXIGIR_APROVACAO action

### Internal Errors (500)
- Database connection failures
- Service unavailability
- Unexpected exceptions

## Monitoring and Observability

### Audit Trail

All webhook processing is logged with complete audit trail:

```typescript
{
  entidadeId: "colaborador_id",
  entidadeTipo: "webhook",
  acao: "webhook_admissao_processado",
  usuarioId: "sistema",
  usuarioNome: "RH Legado Webhook",
  motivo: "Webhook de admissão processado com sucesso",
  timestamp: "2025-01-15T10:30:00Z",
  valoresDepois: { payload, event }
}
```

### Metrics

Key metrics to monitor:

- **Processing Time**: Should be < 2 seconds (requirement 3.1)
- **Success Rate**: Target > 95%
- **Retry Rate**: Monitor for system health
- **Cargo Discrepancy Rate**: Business intelligence metric

### Health Checks

The `/api/webhooks/health` endpoint provides:
- Service status
- Timestamp
- Version information
- Database connectivity (future enhancement)

## Integration Examples

### RH Legado Integration

```typescript
// Example: Sending webhook from RH Legado system
const payload = {
  event_type: 'colaborador.admitido',
  timestamp: new Date().toISOString(),
  data: {
    colaborador_id: 'col_001',
    nome: 'João Silva',
    cpf: '123.456.789-00',
    cargo_id: 'cargo_dev_junior',
    centro_custo_id: 'cc_ti',
    turno: 'integral',
    data_admissao: '2025-01-15',
    pcd: false,
    status: 'ativo'
  }
};

const signature = crypto
  .createHmac('sha256', secretKey)
  .update(JSON.stringify(payload))
  .digest('hex');

const response = await fetch('/api/webhooks/colaborador/admitido', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': `sha256=${signature}`
  },
  body: JSON.stringify(payload)
});
```

### Error Handling in RH Legado

```typescript
if (response.status === 409) {
  const error = await response.json();
  
  if (error.action === 'bloquear') {
    // Handle blocked admission
    console.log('Admission blocked:', error.message);
    // Show error to user, require manual intervention
  }
  
  if (error.action === 'exigir_aprovacao') {
    // Handle approval requirement
    console.log('Approval required:', error.message);
    console.log('Proposal ID:', error.proposta_id);
    // Notify user that approval workflow was initiated
  }
}
```

## Testing

### Unit Tests
- Webhook signature validation
- Payload validation
- Cargo discrepancy logic
- Retry mechanism
- Error handling

### Integration Tests
- End-to-end webhook processing
- Database operations
- External service integration
- Performance testing

### Load Testing
- Concurrent webhook processing
- High-volume scenarios
- Stress testing retry logic

## Deployment Considerations

### Environment Variables
```bash
# Required
WEBHOOK_SECRET_KEY=your-secret-key-here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=quadro_lotacao
DB_USER=postgres
DB_PASSWORD=postgres

# Optional
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_RETRY_DELAY_MS=1000
WEBHOOK_MAX_RETRY_DELAY_MS=10000
```

### Infrastructure
- Load balancer for high availability
- Database connection pooling
- Redis for caching (if needed)
- Monitoring and alerting setup

### Security
- HTTPS/TLS 1.3 for all webhook endpoints
- Network security groups
- Rate limiting
- DDoS protection

## Troubleshooting

### Common Issues

1. **Invalid Signature Errors**
   - Verify secret key configuration
   - Check payload serialization
   - Ensure consistent encoding

2. **Timeout Errors**
   - Check database connectivity
   - Monitor processing time
   - Review retry configuration

3. **Cargo Discrepancy Issues**
   - Verify company configuration
   - Check quadro data integrity
   - Review business rules

### Debug Mode

Enable debug logging:
```bash
DEBUG=webhook:* npm start
```

### Monitoring Queries

```sql
-- Recent webhook processing
SELECT * FROM audit_logs 
WHERE acao LIKE 'webhook_%' 
ORDER BY timestamp DESC 
LIMIT 50;

-- Cargo discrepancy rate
SELECT 
  COUNT(*) as total_webhooks,
  COUNT(CASE WHEN acao = 'cargo_discrepancy_detected' THEN 1 END) as discrepancies,
  (COUNT(CASE WHEN acao = 'cargo_discrepancy_detected' THEN 1 END) * 100.0 / COUNT(*)) as discrepancy_rate
FROM audit_logs 
WHERE acao LIKE 'webhook_%' 
AND timestamp >= NOW() - INTERVAL '24 hours';
```

## Future Enhancements

1. **Webhook Replay**: Ability to replay failed webhooks
2. **Batch Processing**: Handle multiple events in single request
3. **Event Sourcing**: Complete event history reconstruction
4. **Advanced Monitoring**: Real-time dashboards and alerts
5. **Multi-tenant Support**: Company-specific webhook endpoints