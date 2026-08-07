# Sistema de Gerenciamento de Tickets (Help Desk)

Um sistema completo, leve e funcional de Help Desk desenvolvido em Node.js e Vanilla JavaScript com persistência atômica em arquivos JSON.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js instalado (v16 ou superior recomendada)

### Passo a Passo

1. **Abra o terminal na pasta do projeto**:
   ```bash
   cd d:\TesteDeply
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Inicie o servidor**:
   ```bash
   npm start
   # ou
   node server.js
   ```

4. **Acesse no navegador**:
   [http://localhost:3000](http://localhost:3000)

---

## 🔑 Credenciais Padrão (Criadas Automaticamente na Inicialização)

O sistema realiza *seeding* automático na primeira execução criando as contas:

### 1. Perfil Administrador
- **E-mail:** `admin@helpdesk.com`
- **Senha:** `admin123`
- **Permissões:** Gerenciar usuários, visualizar todos os chamados, alterar status e responder a tickets.

### 2. Perfil Usuário
- **E-mail:** `usuario@helpdesk.com`
- **Senha:** `user123`
- **Permissões:** Abrir novos tickets e acompanhar as respostas dos seus próprios chamados.

---

## 🛠️ Stack Técnica e Funcionalidades

- **Front-end:** HTML5, CSS3 moderno (Dark mode, cards e modais responsivos) e Vanilla JavaScript puro (sem frameworks).
- **Back-end:** Node.js com Express para rotas RESTful.
- **Autenticação:** JSON Web Tokens (JWT) armazenados no `localStorage` e passados via cabeçalho `Authorization: Bearer <token>`.
- **Persistência de Dados:** Arquivos JSON (`usuarios.json` e `tickets.json`) com gravação atômica (`.tmp` + `fs.renameSync`) e controle de trava em memória para prevenir corrupção em chamadas simultâneas.
- **Integridade Referencial:** Apenas IDs de usuários são mantidos em `tickets.json` (`criadoPor` e `respondidoPor`). No momento da busca, a API popula dinamicamente o nome e e-mail correspondente.

---

## 📋 Regras de Negócio Implementadas

### Perfil ADMIN
- Criar novos usuários (definindo nome, e-mail único, senha e perfil).
- Desativar e reativar usuários (alteração lógica do campo `ativo`).
- Alterar a senha de qualquer usuário.
- Visualizar todos os tickets de todos os usuários.
- Filtrar tickets por status (`aberto`, `em_andamento`, `resolvido`, `fechado`) e prioridade.
- Responder a chamados e atualizar seus status.
- **Restrição:** Não pode criar tickets de suporte (permissão negada no backend).

### Perfil USUÁRIO
- Criar novos tickets com título, descrição e prioridade (`baixa`, `media`, `alta`).
- Os tickets são vinculados automaticamente ao seu ID de sessão.
- Visualizar apenas os seus próprios tickets com o status e a resposta enviada pelo administrador.
- **Restrição:** Não pode responder tickets, alterar status, ver tickets de terceiros ou gerenciar usuários.

---

## 📡 Endpoints da API REST

### Autenticação (`/api/auth`)
- `POST /api/auth/login` - Realiza login e gera token JWT.
- `GET /api/auth/me` - Retorna os dados do usuário autenticado na sessão.

### Usuários (`/api/users`) *(Exclusivo Admin)*
- `GET /api/users` - Lista todos os usuários.
- `POST /api/users` - Cadastra novo usuário.
- `PATCH /api/users/:id/status` - Ativa ou desativa um usuário.
- `PATCH /api/users/:id/password` - Redefine a senha de um usuário.

### Tickets (`/api/tickets`)
- `GET /api/tickets` - Lista os tickets (Usuário vê os seus; Admin vê todos). Aceita query `?status=` e `?prioridade=`.
- `GET /api/tickets/:id` - Detalhes de um ticket.
- `POST /api/tickets` - Cria um ticket *(Exclusivo perfil Usuário)*.
- `PATCH /api/tickets/:id/responder` - Responde e/ou altera status *(Exclusivo perfil Admin)*.
- `PATCH /api/tickets/:id/status` - Altera status de um ticket *(Exclusivo perfil Admin)*.
