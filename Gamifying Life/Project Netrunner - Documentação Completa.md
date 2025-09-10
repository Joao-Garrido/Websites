# Project Netrunner - Documentação Completa

## 🎯 Visão Geral

O **Project Netrunner** é uma aplicação web de gamificação de produtividade pessoal com tema cyberpunk. A aplicação transforma tarefas do dia a dia em "contratos" de hacking, permitindo que os usuários ganhem experiência, créditos e evoluam seu "Cyberdeck" conforme completam suas atividades.

**URL da Aplicação:** https://kkh7ikc79oen.manus.space

## 🚀 Funcionalidades Implementadas

### ✅ Sistema de Gamificação Completo
- **Netrunner Profile**: Cada usuário tem um alias único, nível e estatísticas
- **Sistema de EXP**: Ganhe experiência completando contratos
- **Sistema de Créditos (¥)**: Moeda virtual para compras futuras
- **Sistema de Bandwidth**: Recurso diário que simula tempo/energia

### ✅ Sistema de Contratos (Tarefas)
- **Três Níveis de Dificuldade**:
  - Low-Profile (Fácil) - Verde
  - Standard-Op (Médio) - Amarelo  
  - High-Stakes (Difícil) - Vermelho
- **Estados dos Contratos**: Pending → Active → Completed
- **Recompensas Dinâmicas**: Baseadas em dificuldade e tempo estimado
- **Sistema de Eficiência**: Bônus por completar dentro do prazo

### ✅ Interface Cyberpunk Imersiva
- **Tema Visual Completo**: Cores neon, efeitos de brilho, animações
- **Efeitos Especiais**: Glitches aleatórios, animações de dados
- **Layout Responsivo**: Funciona em desktop e mobile
- **Componentes Temáticos**: Terminais, hologramas, data streams

### ✅ Data Stream em Tempo Real
- **Log de Atividades**: Todas as ações são registradas
- **Timestamps**: Horário de cada evento
- **Tipos de Mensagem**: Success, Info, Warning, Error
- **Atualizações Automáticas**: Interface atualiza em tempo real

### ✅ Sistema de Signal Debt
- **Penalidade por Excesso**: -25% EXP/¥ quando bandwidth negativo
- **Indicadores Visuais**: UI fica "glitchada" durante debt
- **Recuperação**: Bandwidth reseta diariamente

## 🛠️ Arquitetura Técnica

### Frontend (React + Vite)
- **Framework**: React 18 com Vite
- **Styling**: Tailwind CSS + CSS customizado
- **Componentes**: shadcn/ui para componentes base
- **Ícones**: Lucide React
- **Animações**: CSS animations + Framer Motion ready
- **Estado**: Custom hooks para gerenciamento de estado

### Backend (Flask + SQLAlchemy)
- **Framework**: Flask com SQLAlchemy ORM
- **Banco de Dados**: SQLite (desenvolvimento) / PostgreSQL ready
- **API**: RESTful com CORS habilitado
- **Modelos**: Netrunner, Contract, EpicHack, Milestone, SkillPoint, DataStreamEntry

### Deployment
- **Plataforma**: Manus Cloud Platform
- **Tipo**: Full-stack deployment (Flask servindo frontend)
- **URL**: https://kkh7ikc79oen.manus.space
- **SSL**: Habilitado automaticamente

## 📊 Modelos de Dados

### Netrunner (Usuário)
```python
- id: Integer (Primary Key)
- alias: String (Unique)
- level: Integer
- exp: Integer
- credits: Integer
- max_bandwidth: Float
- current_bandwidth: Float
- signal_debt: Boolean
- created_at: DateTime
- last_active: DateTime
```

### Contract (Tarefa)
```python
- id: Integer (Primary Key)
- netrunner_id: Foreign Key
- title: String
- description: Text
- difficulty: String (Low-Profile/Standard-Op/High-Stakes)
- status: String (pending/active/completed/failed)
- time_estimate: Float
- time_spent: Float
- progress: Integer (0-100)
- exp_reward: Integer
- credit_reward: Integer
- contract_type: String (main/maintenance/epic_hack)
```

### DataStreamEntry (Log)
```python
- id: Integer (Primary Key)
- netrunner_id: Foreign Key
- message: String
- entry_type: String (info/success/warning/error)
- created_at: DateTime
```

## 🎮 Como Usar

### 1. Primeiro Acesso
1. Acesse https://kkh7ikc79oen.manus.space
2. Clique em "Initialize Demo Profile" para criar um perfil
3. Ou clique em "Setup Demo" para carregar dados de exemplo

### 2. Gerenciando Contratos
1. **Criar Contrato**: Use a API ou interface futura
2. **Iniciar Hack**: Clique em "Initiate Hack" em um contrato pending
3. **Completar Hack**: Clique em "Complete Hack" quando terminar
4. **Ganhar Recompensas**: EXP e créditos são automaticamente adicionados

### 3. Sistema de Bandwidth
- Cada usuário começa com 16 BW por dia
- Contratos consomem bandwidth baseado no tempo
- Atividades improdutivas custam mais (penalty multiplier)
- Bandwidth reseta diariamente, convertendo sobra em créditos

### 4. Progressão
- **EXP**: Acumule para subir de nível
- **Levels**: Cada nível requer mais EXP (formula: level * 200 + 800)
- **Credits**: Use para compras futuras no Black Market
- **Signal Debt**: Evite ficar com bandwidth negativo

## 🔧 API Endpoints

### Netrunner Management
- `POST /api/netrunner` - Criar novo Netrunner
- `GET /api/netrunner/{id}` - Obter dados do Netrunner
- `GET /api/netrunner/{id}/dashboard` - Dados completos do dashboard

### Contract Management
- `GET /api/netrunner/{id}/contracts` - Listar contratos
- `POST /api/netrunner/{id}/contracts` - Criar contrato
- `POST /api/contracts/{id}/start` - Iniciar contrato
- `POST /api/contracts/{id}/complete` - Completar contrato

### Bandwidth Management
- `POST /api/netrunner/{id}/bandwidth/spend` - Gastar bandwidth
- `POST /api/netrunner/{id}/bandwidth/reset` - Reset diário

### Utilities
- `POST /api/demo/setup/{id}` - Configurar dados demo
- `GET /api/netrunner/{id}/data-stream` - Obter data stream

## 🎨 Design System

### Cores Principais
- **Background**: #0a0a0a (Preto profundo)
- **Primary**: #ff0080 (Magenta neon)
- **Secondary**: #00ff9f (Verde neon)
- **Accent**: #00ffff (Ciano neon)
- **Warning**: #ffff00 (Amarelo neon)
- **Error**: #ff4444 (Vermelho neon)

### Tipografia
- **Font Family**: Monospace (tema hacker)
- **Tamanhos**: 72px (títulos), 36px (subtítulos), 24px (corpo)

### Efeitos Visuais
- **Neon Glow**: text-shadow com cores neon
- **Grid Pattern**: Background com linhas sutis
- **Glitch Effects**: Animações de interferência
- **Holographic**: Gradientes animados
- **Data Stream**: Animações de fluxo de dados

## 🚀 Próximos Passos (Roadmap)

### Fase 2: Epic Hacks (Metas de Longo Prazo)
- Interface para criar Epic Hacks
- Sistema de milestones
- Timeline visual de progresso
- Quebra automática em contratos menores

### Fase 3: Skill Trees
- 4 árvores de habilidades:
  - System Infiltration (Trabalho/Estudo)
  - Hardware Maintenance (Saúde/Fitness)
  - Social Engineering (Pessoas/Comunicação)
  - Black ICE Ops (Disciplina/Mental)
- Sistema de skill points
- Passive bonuses

### Fase 4: Black Market
- Loja de upgrades funcionais
- Modificações cosméticas
- Sistema de loadouts
- Temas visuais alternativos

### Fase 5: Social Features
- Ranking/Leaderboards
- Guilds/Teams
- Contratos colaborativos
- Sistema de mentoria

### Fase 6: Advanced Features
- Pomodoro timer integrado
- Sincronização com calendários externos
- Notificações push
- Mobile app (PWA)
- Integração com APIs de produtividade

## 🔒 Segurança e Performance

### Implementado
- CORS configurado corretamente
- Validação de dados na API
- Error handling robusto
- SQL injection protection (SQLAlchemy ORM)

### Recomendações Futuras
- Autenticação JWT
- Rate limiting
- Input sanitization
- Database encryption
- Backup automático

## 📱 Compatibilidade

### Browsers Suportados
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Dispositivos
- Desktop (1920x1080+)
- Tablet (768x1024+)
- Mobile (375x667+)

## 🎯 Métricas de Sucesso

### Engagement
- Tempo médio de sessão
- Contratos completados por dia
- Taxa de retorno diário
- Progressão de nível

### Performance
- Tempo de carregamento < 3s
- API response time < 500ms
- 99% uptime
- Zero crashes

## 📞 Suporte

Para suporte técnico ou dúvidas sobre o projeto:
- **Documentação**: Este arquivo
- **Código Fonte**: Disponível no ambiente de desenvolvimento
- **Issues**: Reporte bugs ou solicite features

---

**Project Netrunner** - Transformando produtividade em uma experiência cyberpunk épica! 🚀🔥

