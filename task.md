# Tarefas da Fase 4

## Fase 4.1: Coleções Pendentes e Interfaces
- [x] Criar Rota de Migração (`api/migrar-pendentes`)
- [x] Executar Migração e verificar no Firebase
- [x] Criar Interface de Usuários (Tutores) `trilhatech/usuarios`
- [x] Criar Interface de Controle de Módulos `trilhatech/modulos`
- [x] Criar Interface de Logs de Segurança `trilhatech/seguranca`
- [x] Adaptar `action-proxy` para usar `usuarios` (Login)
- [x] Adaptar funções que dependem de `controle_modulos`
- [x] Adaptar registros de Log de Segurança

## Fase 4.2: Sincronização Google Classroom
- [x] Criar `src/app/api/tutor/sincronizar-ava/route.ts`.
- [x] Configurar Google Classroom API auth com service account.
- [x] Transcrever lógica `appscript.md` (Atraso, Gabarito, Digitação).
- [x] Gravar entregas na coleção `entregas` e XP na coleção `alunos`.
- [x] Atualizar frontend `trilhatech/aulas/page.tsx` para chamar a nova rota.
