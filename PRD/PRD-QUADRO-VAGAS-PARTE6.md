# PRD - SISTEMA DE GESTÃO DE QUADRO DE LOTAÇÃO
## PARTE 6: GUIA UI/UX E DESIGN SYSTEM SENIOR (AGNÓSTICO A FRAMEWORK)

---

## 🎨 DESIGN SYSTEM SENIOR - APLICAÇÃO

### Fundamentos Implementados (Agnósticos)

**Tipografia:**
- Fonte: Open Sans (HTTPS import)
- URL: `https://fonts.googleapis.com/css?family=Open+Sans:400,400i,600,600i,700,700i`
- Variações: 400 (normal), 400i (itálico), 600 (bold), 600i (bold itálico), 700 (extra bold), 700i (extra bold itálico)
- Fallback: Arial, sans-serif

**Cores (SDS Palette):**
| Nome | Código | Uso |
|------|--------|-----|
| Primary (Senior Blue) | #1E90FF | Links, botões primários, destaques |
| Success (Verde) | #28A745 | Status positivo, aprovações, ✅ |
| Info (Azul Claro) | #17A2B8 | Informações, ℹ️ |
| Warning (Amarelo) | #FFC107 | Alertas, ⚠️, atenção requerida |
| Danger (Vermelho) | #DC3545 | Erros, rejeições, ❌ |
| Neutral (Cinza) | #6C757D | Texto secundário, desabilitado |
| Background | #F8F9FA | Backgrounds, painéis |
| Text Dark | #333333 | Texto principal |
| Border | #E0E0E0 | Bordas, divisórios |

**Espaçamentos (Grid 8px - Escala Modular):**
- 4px (0.5x)
- 8px (1x)
- 16px (2x)
- 24px (3x)
- 32px (4x)
- 48px (6x)
- 64px (8x)

**Responsividade - Breakpoints:**
- **Mobile:** < 767px → 1 coluna, menu colapsado
- **Tablet:** 768px - 991px → 2 colunas
- **Desktop:** 992px - 1279px → 3 colunas
- **Large:** ≥ 1280px → 4 colunas

**Sombras SDS:**
- Baixa: `0 2px 4px rgba(0,0,0,0.1)`
- Média: `0 4px 8px rgba(0,0,0,0.15)`
- Alta: `0 8px 16px rgba(0,0,0,0.2)`

---

## 📐 PADRÃO DE LAYOUT PRINCIPAL

### App Shell (Layout Base)

```
┌──────────────────────────────────────────────────────────┐
│  [Logo] Senior X  │ Dashboard  │ [Filtros] │ [User Menu ▼]│
├──────────────────────────────────────────────────────────┤
│                                                           │
│ ┌──────────────────┬──────────────────────────────────┐  │
│ │                  │ [Breadcrumb > Dashboard]          │  │
│ │  MENU            │                                   │  │
│ │  ────────────────│  CONTEÚDO PRINCIPAL               │  │
│ │  ⌂ Dashboard     │                                   │  │
│ │  📊 Quadro       │  (Adaptável conforme módulo)      │  │
│ │  🔄 Normalização │                                   │  │
│ │  📋 Propostas    │                                   │  │
│ │  📈 Analytics    │                                   │  │
│ │  ⚙️ Configurações│                                   │  │
│ │                  │                                   │  │
│ │  ────────────────│                                   │  │
│ │  ℹ️ Sobre         │                                   │  │
│ │  🔚 Logout       │                                   │  │
│ │                  │                                   │  │
│ └──────────────────┴──────────────────────────────────┘  │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**Componentes:**
1. **Header:** Logo + Título + Filtros globais + Menu usuário (32-64px altura)
2. **Sidebar:** Menu navegação 250px (desktop) / colapsado (mobile)
3. **Main Content:** Área principal com padding 16-24px
4. **Footer:** Opcional, copyright e links

---

## 🎯 COMPONENTES ESTRUTURAIS (AGNÓSTICOS)

### 1. TOOLBAR / HEADER COM FILTROS

**Características:**
- Background: Branco (#FFFFFF) com border-bottom 1px solid #E0E0E0
- Altura: 56px (desktop) / 48px (mobile)
- Padding: 8px 16px
- Display: Flex com espaço entre elementos

**Elementos:**
- **Esquerda:** Logo (32x32px) + Título (h2, bold, #333)
- **Centro:** Filtros globais em linha
  - Dropdown Empresa (200px width)
  - Seletor Período (calendário)
  - Autocomplete Centro de Custo
- **Direita:** 
  - Botão "Filtrar" (Primary, icon + label)
  - Botão "Limpar" (Outline)
  - Menu Usuário (dropdown com Perfil, Config, Logout)

**Exemplo de implementação (CSS/HTML agnóstico):**
```
<header class="app-header">
  <div class="header-left">
    <img src="logo.png" alt="Senior X" class="logo" />
    <h2 class="header-title">Dashboard</h2>
  </div>
  
  <div class="header-center">
    <select class="filter-select">
      <option>Empresa</option>
    </select>
    <input type="date" class="filter-date" />
    <input type="text" placeholder="Centro de Custo" class="filter-autocomplete" />
    <button class="btn btn-primary">Filtrar</button>
    <button class="btn btn-outline">Limpar</button>
  </div>
  
  <div class="header-right">
    <button class="user-menu">Usuário ▼</button>
  </div>
</header>

<style>
  .app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #FFFFFF;
    border-bottom: 1px solid #E0E0E0;
    padding: 8px 16px;
    height: 56px;
  }
  
  .header-title {
    font-size: 20px;
    font-weight: 700;
    color: #333333;
    margin: 0 0 0 12px;
  }
  
  .filter-select, .filter-date, .filter-autocomplete {
    padding: 8px 12px;
    border: 1px solid #E0E0E0;
    border-radius: 4px;
    margin: 0 8px;
    font-family: Open Sans;
  }
</style>
```

---

### 2. MENU LATERAL (SIDEBAR)

**Características:**
- Desktop: 250px width, position: fixed/sticky
- Mobile: Drawer/Hamburger, posição relativa ao topo
- Background: #F8F9FA
- Border-right: 1px solid #E0E0E0
- Padding: 16px 0

**Itens do Menu:**
```
Menu Items (cada um):
├─ Ícone (24x24px, color: #1E90FF quando ativo)
├─ Label (font-size: 14px, font-weight: 600)
└─ Active Indicator (left border 4px solid #1E90FF)

Dashboard       ⌂
Quadro          📊
Normalização    🔄
Propostas       📋
Analytics       📈
Configurações   ⚙️
─────────────────
Sobre           ℹ️
Logout          🔚
```

**Responsividade:**
- Desktop (≥992px): Sempre visível
- Tablet (768-991px): Colapsável com hamburger
- Mobile (<768px): Drawer que abre/fecha, full height

**CSS Exemplo:**
```css
.sidebar {
  width: 250px;
  background: #F8F9FA;
  border-right: 1px solid #E0E0E0;
  padding: 16px 0;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  left: 0;
  top: 56px; /* abaixo do header */
}

.sidebar-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 600;
  color: #333333;
}

.sidebar-item:hover {
  background: #F0F0F0;
}

.sidebar-item.active {
  background: #E8F4FF;
  border-left: 4px solid #1E90FF;
  padding-left: 12px; /* ajusta pois borda ocupa 4px */
}

.sidebar-icon {
  width: 24px;
  height: 24px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1E90FF;
}

/* Mobile Responsiveness */
@media (max-width: 767px) {
  .sidebar {
    transform: translateX(-100%);
    z-index: 1000;
    transition: transform 0.3s ease;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
  
  .sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 999;
  }
}
```

---

### 3. CARDS / PAINÉIS (KPI Cards)

**Características:**
- Largura: Responsiva (100% → 50% → 25% conforme breakpoint)
- Mín. 280px (mobile), máx. 360px
- Padding: 16px
- Border-radius: 8px
- Border-left: 4px (color-coded)
- Box-shadow: `0 2px 4px rgba(0,0,0,0.1)`
- Hover: Sombra aumenta + translateY(-2px)

**Estrutura:**
```
┌─────────────────────┐
│ ┌─────────────────┐ │
│ │ Título      [ℹ️]│ │  Card Header (12px, #999)
│ └─────────────────┘ │
│                     │
│   93.2%             │  Card Value (24px, bold, #333)
│                     │
│ Meta: 95% • Acima   │  Card Meta (12px, #999)
│                     │
│ ✅ Acima da Meta    │  Status Badge (12px bold)
│                     │
└─────────────────────┘
```

**Variantes de Cor (Border-left):**
- Success: #28A745
- Warning: #FFC107
- Danger: #DC3545
- Info: #1E90FF

**CSS Exemplo:**
```css
.card {
  background: #FFFFFF;
  border-radius: 8px;
  border-left: 4px solid #1E90FF;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 12px;
  color: #999999;
  font-weight: 600;
}

.card-value {
  font-size: 28px;
  font-weight: 700;
  color: #333333;
  margin: 12px 0;
}

.card-meta {
  font-size: 12px;
  color: #999999;
  margin: 8px 0;
}

.card-status {
  font-size: 12px;
  font-weight: 600;
  color: #28A745;
}

/* Variantes */
.card.success { border-left-color: #28A745; }
.card.warning { border-left-color: #FFC107; }
.card.danger { border-left-color: #DC3545; }
.card.info { border-left-color: #1E90FF; }
```

---

### 4. TABELAS (DATA TABLE)

**Características:**
- Largura: 100% do container
- Border-collapse: collapse
- Header: Background #F8F9FA, font-weight 600, border-bottom 2px solid #E0E0E0
- Rows: Alternadas (odd: #FFFFFF, even: #F8F9FA)
- Hover: Background #F0F0F0
- Padding células: 12px 16px
- Font-size: 14px (corpo), 12px (rodapé)

**Componentes:**
- **Search/Filter:** Input com ícone lupa, margin-bottom 16px
- **Toolbar:** Acima da tabela com botões de ação (Novo, Exportar, etc)
- **Pagination:** Abaixo (página X de Y, linhas por página)
- **Action Buttons:** Ícones circulares (32x32px) com hover tooltip

**Responsividade:**
- Desktop (≥992px): Scroll horizontal se necessário
- Tablet/Mobile: Colunas importantes visíveis, scroll horizontal em outras

**CSS Exemplo:**
```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table thead {
  background: #F8F9FA;
  border-bottom: 2px solid #E0E0E0;
}

.data-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #333333;
}

.data-table tbody tr {
  border-bottom: 1px solid #E0E0E0;
}

.data-table tbody tr:nth-child(odd) {
  background: #FFFFFF;
}

.data-table tbody tr:nth-child(even) {
  background: #F8F9FA;
}

.data-table tbody tr:hover {
  background: #F0F0F0;
}

.data-table td {
  padding: 12px 16px;
  color: #333333;
}

.table-search {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.table-search input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  font-family: Open Sans;
}

.action-button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 4px;
  transition: all 0.2s ease;
}

.action-button:hover {
  background: #F0F0F0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.action-button.primary:hover {
  background: #1E90FF;
  color: #FFFFFF;
}

.action-button.success:hover {
  background: #28A745;
  color: #FFFFFF;
}

.action-button.danger:hover {
  background: #DC3545;
  color: #FFFFFF;
}
```

---

### 5. FORMULÁRIOS / MODALS

**Modal Base:**
```
┌─────────────────────────────────────┐
│ Novo Cargo                    [✕]   │ ← Header
├─────────────────────────────────────┤
│                                      │
│ ┌─ Campo ─────────────────────────┐ │
│ │ Centro de Custo *               │ │
│ │ [Selecione ▼]                   │ │
│ │ Campo obrigatório               │ │ ← Error
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─ Campo ─────────────────────────┐ │
│ │ Cargo *                         │ │
│ │ [__________________]            │ │
│ │ Adicione o nome do cargo        │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─ Campo ─────────────────────────┐ │
│ │ Vagas Previstas *               │ │
│ │ [5          ]                   │ │
│ └─────────────────────────────────┘ │
│                                      │
├─────────────────────────────────────┤
│ [Cancelar]              [Salvar]    │ ← Footer com botões
└─────────────────────────────────────┘
```

**Características:**
- Position: fixed, z-index: 1000
- Overlay: rgba(0,0,0,0.5) em background
- Min-width: 400px, max-width: 90%
- Border-radius: 8px
- Box-shadow: `0 8px 16px rgba(0,0,0,0.2)`
- Animation: Fade in (opacity 0→1, 200ms)

**Campos do Formulário:**
- Label: 12px bold, margin-bottom 4px
- Input: 100% width, padding 8px 12px, border 1px #E0E0E0
- Focus: outline none, border 2px #1E90FF
- Error: border 2px #DC3545, help-text 12px #DC3545
- Placeholder: color #999999, style itálico
- Spacing entre campos: 16px

**Botões:**
```
Primário: Background #1E90FF, Color #FFF, border none, padding 8px 16px
Secundário: Background transparent, Color #1E90FF, border 1px #1E90FF
Danger: Background #DC3545, Color #FFF
Outline: Background transparent, Color #333, border 1px #333

Hover: Brightness +10%, box-shadow 0 2px 8px rgba(...)
```

**CSS Exemplo:**
```css
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
  z-index: 1000;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #E0E0E0;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #333333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999999;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #E0E0E0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #333333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  font-family: Open Sans;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border: 2px solid #1E90FF;
}

.form-group.error input {
  border: 2px solid #DC3545;
}

.form-group .error-text {
  font-size: 12px;
  color: #DC3545;
  margin-top: 4px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-family: Open Sans;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.btn-primary {
  background: #1E90FF;
  color: #FFFFFF;
}

.btn-primary:hover {
  background: #0D72CC;
  box-shadow: 0 2px 8px rgba(30,144,255,0.3);
}

.btn-outline {
  background: transparent;
  color: #333333;
  border: 1px solid #E0E0E0;
}

.btn-outline:hover {
  background: #F8F9FA;
}

.btn-danger {
  background: #DC3545;
  color: #FFFFFF;
}

.btn-danger:hover {
  background: #C82333;
}
```

---

### 6. BADGES / TAGS / STATUS

**Status Badge:**
```
✅ Aprovado       → background: #D4EDDA, color: #155724
⏳ Pendente       → background: #FFF3CD, color: #856404
❌ Rejeitado      → background: #F8D7DA, color: #721C24
🔵 Em Processo    → background: #D1ECF1, color: #0C5460
```

**Exemplo:**
```css
.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.badge-success {
  background: #D4EDDA;
  color: #155724;
}

.badge-warning {
  background: #FFF3CD;
  color: #856404;
}

.badge-danger {
  background: #F8D7DA;
  color: #721C24;
}

.badge-info {
  background: #D1ECF1;
  color: #0C5460;
}
```

---

### 7. PROGRESSBAR

**Características:**
- Height: 4px ou 8px (conforme contexto)
- Background: #E0E0E0
- Progress: Background color-coded, border-radius 4px
- Label (opcional): font-size 12px, posicionado sobre a barra

**Exemplo:**
```html
<div class="progress">
  <div class="progress-bar" style="width: 75%;">75%</div>
</div>

<style>
  .progress {
    width: 100%;
    height: 8px;
    background: #E0E0E0;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .progress-bar {
    height: 100%;
    background: #28A745;
    transition: width 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #FFFFFF;
    font-size: 12px;
    font-weight: 600;
  }
</style>
```

---

### 8. TIMELINE (Rastreabilidade)

**Estrutura:**
```
  ● ─── [Data] Usuário realizou ação
  │      Descrição detalhada
  │      [Tags]
  │
  ● ─── [Data] Usuário X aprovou proposta
  │      Status: Aprovado
  │
  ◯ ─── [Data] Pendente aprovação
         Aguardando gerente
```

**CSS Exemplo:**
```css
.timeline {
  position: relative;
  padding: 20px 0 20px 40px;
}

.timeline-item {
  position: relative;
  margin-bottom: 20px;
  padding-bottom: 20px;
}

.timeline-marker {
  position: absolute;
  left: -40px;
  top: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #1E90FF;
  border: 3px solid #FFFFFF;
  box-shadow: 0 0 0 2px #1E90FF;
}

.timeline-marker.completed {
  background: #28A745;
  box-shadow: 0 0 0 2px #28A745;
}

.timeline-marker.pending {
  background: transparent;
  border: 3px solid #FFC107;
  box-shadow: none;
}

.timeline-line {
  position: absolute;
  left: -22px;
  top: 24px;
  bottom: -20px;
  width: 2px;
  background: #E0E0E0;
}

.timeline-content {
  padding-left: 16px;
}

.timeline-date {
  font-size: 12px;
  color: #999999;
  margin-bottom: 4px;
}

.timeline-title {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 4px;
}

.timeline-description {
  font-size: 13px;
  color: #666666;
  margin-bottom: 8px;
}

.timeline-tags {
  display: flex;
  gap: 4px;
}
```

---

## 📊 DASHBOARD - LAYOUT ESPECÍFICO

### Seção: Indicadores Principais (4 Cards)

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Taxa Ocup.  │ Custo Contr. │ Qualidade   │ Retenção    │
│ 93.2%       │ R$ 3.2k     │ 8.4/10      │ ⚠️ Crítica  │
│ Meta: 95%   │ Budget: 4.5k│ Meta: 8.0   │ 5 cargos    │
│ ✅ Acima    │ ✅ -29%     │ ✅ Em Alta  │ ❌ Atenção  │
└─────────────┴─────────────┴─────────────┴─────────────┘

@media (max-width: 991px) {
  ↓
  ┌─────────────┬─────────────┐
  │ Taxa Ocup.  │ Custo Contr. │
  └─────────────┴─────────────┘
  ┌─────────────┬─────────────┐
  │ Qualidade   │ Retenção    │
  └─────────────┴─────────────┘

@media (max-width: 767px) {
  ↓
  ┌─────────────┐
  │ Taxa Ocup.  │
  └─────────────┘
  ┌─────────────┐
  │ Custo Contr. │
  └─────────────┘
  ... (1 por linha)
}
```

### Seção: Previsão IA (Carousel/Scroll)

```
[← ] [ Dev Full | Analista | Gerente Proj ] [→]
     Stack       Dados

Cada card:
┌─────────────┐
│ 📈 Alta     │
│ Dev FS      │
│ +15 vagas   │
│ 87%         │
│ [Detalhes]  │
└─────────────┘
```

### Seção: Insights (Accordion)

```
▼ 💰 Salário × Permanência
  +0.76 Correlação
  Salário acima média = 76% mais permanência
  Recomendação: Revisar salários de risco

▶ 📌 Contratação × Performance
  92% Padrão histórico
  ...

▶ ⏱️ Tempo Vaga × Custo
  +R$ 450/dia por vaga aberta
  ...
```

---

## 🎯 QUADRO LOTAÇÃO - LAYOUT ESPECÍFICO

### Tabela Principal (Manutenção)

```
┌──────────────────────────────────────────────────────┐
│ [🔍 Buscar...] [➕ Novo Cargo] [⬇️ Exportar]        │
├──────────────────────────────────────────────────────┤
│ Centro | Posto | Cargo | Previstas | Efetivas | Taxa │
├──────────────────────────────────────────────────────┤
│ CC-001 | PT-01 | Dev   │    5      │    5     │ ✅   │
│ CC-001 | PT-02 | Gerente│   2      │    1     │ ⚠️   │
│ ...                                                  │
├──────────────────────────────────────────────────────┤
│ Página 1 de 5 | Mostrar 10 resultados ▼             │
└──────────────────────────────────────────────────────┘
```

---

## 🏗️ PROPOSTAS - LAYOUT ESPECÍFICO

### Tabela de Propostas

```
┌─────────────────────────────────────────────────────┐
│ ID | Tipo | Descrição | Solicitante | Status | Ações│
├─────────────────────────────────────────────────────┤
│ #1 | Nova | +5 Dev... | João Silva  | ⏳ Pend | 👁️ │
│ #2 | Alter| Transf... | Maria S.    │ ✅ Apr | 👁️ │
└─────────────────────────────────────────────────────┘
```

### Modal de Aprovação

```
┌─────────────────────────────────┐
│ Aprovar Proposta            [✕] │
├─────────────────────────────────┤
│ ID: #1                          │
│ Tipo: Nova Vaga                 │
│ Solicitante: João Silva         │
│                                 │
│ Fluxo de Aprovação:             │
│ ✅ Nível 1 (Coordenação)        │
│ ⏳ Nível 2 (Gerente)            │
│ ◯ Nível 3 (Diretor)             │
│ ◯ RH (Final)                    │
│                                 │
│ Seu Comentário:                 │
│ [________________]              │
│                                 │
├─────────────────────────────────┤
│ [❌ Rejeitar] [⏸️ Aguardar] [✅ Aprovar]
└─────────────────────────────────┘
```

---

## 📈 ANALYTICS - LAYOUT ESPECÍFICO

### Gráficos (Agnósticos)

**Gráfico de Barras - Taxa Ocupação:**
```
% Ocupação
100│           ████
   │           ████      ████
 75│   ████    ████      ████
   │   ████    ████      ████
 50│   ████    ████  ████████
   │   ████    ████  ████████
 25│   ████    ████  ████████
   │   ████    ████  ████████
  0├───────────────────────────
    Dev FS   Admin  Gerente   Analista
```

**Gráfico de Linha - Tendência Vagas:**
```
Vagas Abertas (Últimos 12 meses)
   │
20 │                      •
   │           •      •  /
15 │       •  / \  • / \/
   │   •  /  /   \/
10 │  /  /   /
   │_/_/_/__/_________________________
   J  F  M  A  M  J  J  A  S  O  N  D
```

---

## 📱 RESPONSIVIDADE - IMPLEMENTAÇÃO

### Breakpoints Aplicados (CSS Media Queries)

```css
/* Desktop First Approach */

/* Desktop: ≥ 1280px (4 colunas) */
.grid-item { flex: 0 0 calc(25% - 12px); }

/* Large Tablet: 992px - 1279px (3 colunas) */
@media (max-width: 1279px) {
  .grid-item { flex: 0 0 calc(33.333% - 12px); }
}

/* Tablet: 768px - 991px (2 colunas) */
@media (max-width: 991px) {
  .grid-item { flex: 0 0 calc(50% - 12px); }
  .sidebar { position: fixed; transform: translateX(-100%); }
  .sidebar.open { transform: translateX(0); }
  .hamburger-menu { display: block; }
}

/* Mobile: < 768px (1 coluna) */
@media (max-width: 767px) {
  .grid-item { flex: 0 0 100%; }
  .header { flex-wrap: wrap; }
  .header-center { display: none; }
  .filter-mobile { display: flex; }
  .table-scroll { overflow-x: auto; }
}
```

### Elementos Responsivos

| Elemento | Mobile (<768px) | Tablet (768-991px) | Desktop (≥1280px) |
|----------|-----------------|-------------------|-------------------|
| Sidebar | Drawer (hamburger) | Collapsible | Always visible |
| Filtros | Below header | In header | In header |
| Cards KPI | 1 por linha | 2 por linha | 4 por linha |
| Tabela | Scroll horiz. | Scroll horiz. | Scroll se needed |
| Modal | fullscreen-8px | 80vw | 50vw |
| Buttons | Larger (44px min) | Normal | Normal |

---

## 🎨 IMPLEMENTAÇÃO AGNÓSTICA (Sem Framework Específico)

> **NOTA:** Esta seção apresenta SUGESTÕES de arquitetura. Ferramentas de geração de código (Lovable, Bolt, v0, Windsurf, Cursor, Replit Agent, etc) têm TOTAL AUTONOMIA para escolher stack, frameworks e padrões que julgarem mais adequados.

### Stack Recomendado (LIVRE ESCOLHA)

Equipe/ferramenta pode escolher qualquer framework/tecnologia baseado em expertise:

**Critérios de Seleção:**
- Componentização e reusabilidade
- Ecossistema de bibliotecas UI
- State management adequado
- Curva de aprendizado da equipe
- Performance e SEO requeridos
- Suporte a integração Platform
- Cross-platform se necessário

**Tipos de Arquitetura (Agnósticos):**
- **SPA (Single Page Application):** Interatividade rica, client-side rendering
- **SSR (Server-Side Rendering):** SEO, performance inicial otimizada
- **SSG (Static Site Generation):** Performance máxima para conteúdo estático
- **Cross-platform:** Reuso de código web/mobile/desktop
- **Vanilla/Lightweight:** Controle total, dependências mínimas

### Diretório de Estilos (Agnóstico)

```
assets/
├── styles/
│   ├── variables.css          # Cores, fonts, spacing SDS
│   ├── base.css               # Reset, body, defaults
│   ├── components.css         # Buttons, cards, badges
│   ├── layout.css             # Grid, sidebar, header
│   ├── responsive.css         # Media queries
│   └── utilities.css          # Helper classes
├── fonts/
│   └── open-sans-*.woff2      # Open Sans local (backup)
└── images/
    ├── logo.png
    ├── icons/
    └── backgrounds/
```

### CSS Base (Aplicável em Qualquer Stack)

```css
/* variables.css */
:root {
  /* Colors SDS */
  --primary: #1E90FF;
  --success: #28A745;
  --info: #17A2B8;
  --warning: #FFC107;
  --danger: #DC3545;
  --light: #F8F9FA;
  --dark: #343A40;
  --text-dark: #333333;
  --text-light: #999999;
  --border: #E0E0E0;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Typography */
  --font-family: 'Open Sans', Arial, sans-serif;
  --font-size-base: 14px;
  --font-size-h1: 32px;
  --font-size-h2: 24px;
  --font-size-h3: 20px;
  --font-size-small: 12px;
  
  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 8px rgba(0,0,0,0.15);
  --shadow-lg: 0 8px 16px rgba(0,0,0,0.2);
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}

/* base.css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--text-dark);
  background: #FFFFFF;
  line-height: 1.5;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  line-height: 1.2;
}

button {
  font-family: var(--font-family);
  cursor: pointer;
}

input, select, textarea {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO UI/UX

- [ ] Tipografia Open Sans importada corretamente
- [ ] Variáveis CSS SDS aplicadas (cores, spacing, shadows)
- [ ] Componentes responsivos em 3+ breakpoints testados
- [ ] Acessibilidade: ARIA labels, focus states, keyboard nav
- [ ] Performance: Imagens otimizadas, CSS minificado
- [ ] Cross-browser: Testado em Chrome, Firefox, Safari, Edge
- [ ] Dark mode (opcional): Suporte a preferência do usuário
- [ ] Animations: Transições suaves (200-300ms)
- [ ] Hover states em todos os elementos interativos
- [ ] Loading states em botões e tabelas
- [ ] Error states com mensagens claras
- [ ] Tooltips em ações não óbvias

---

**Próximo:** PARTE 7 - Consolidação Final e Deployment

