# Regras do Projeto (EREM Painel)

## Diretrizes de Codificação e Tipagem

### 1. Proibição Estrita do Tipo `any`
* **Regra**: Sob hipótese alguma deve ser utilizada a palavra-chave `any` para tipar variáveis, constantes, parâmetros de funções, retornos, mapeadores ou blocos de captura de erro (`catch`).
* **Abordagem Correta**:
  - Defina interfaces claras (ex: `interface Aluno`, `interface Atividade`).
  - Para loops de consulta no Firestore, utilize `QueryDocumentSnapshot` ou defina as propriedades esperadas do `.data()`.
  - Em tratamento de exceções, use `catch (error: unknown)` e realize o cast necessário (ex: `const err = error as Error`).

---

## 🏛️ Diretrizes de Módulos e Arquitetura

### 2. Hall da Fama & Memorial de Formandos
* **Documento Mestre**: Consulte obrigatoriamente [`docs/arquitetura/hall-da-fama.md`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/docs/arquitetura/hall-da-fama.md) antes de criar ou modificar rotas, tipos ou telas do Hall da Fama.
* **Pilares de Responsabilidade**:
  1. **Perfil do Aluno (`PerfilModal.tsx` / `api/alunos/memorial`)**: O aluno apenas submete sua frase, stack e link de projeto (rascunho).
  2. **Curadoria do Tutor (`trilhatech` / `api/tutor/memorial`)**: Apenas o tutor pode atribuir a `especialidadeOficial`, `seloHonorifico`, `parecerTutor` e ativar `publicadoNoHall: true`.
  3. **Página Pública (`src/app/hall-da-fama/page.tsx`)**: Deve ser acessível a visitantes e alunos, exibindo apenas dados aprovados pelo tutor ou dados do modo de demonstração.
* **Imutabilidade e Segurança**: O histórico de XP, níveis e badges de alunos graduados como `Veterano` deve ser imutável após a formatura para garantir a integridade do santuário histórico.

---

## 📚 Mapa da Documentação Oficial (`docs/`)

Consulte sempre os documentos oficiais na pasta `docs/` antes de realizar intervenções estruturais:
* **Arquitetura:**
  * [`docs/arquitetura/hall-da-fama.md`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/docs/arquitetura/hall-da-fama.md): Arquitetura, regras de negócio e contratos do Hall da Fama e formandos.
  * [`docs/arquitetura/firestore-cache-cqrs.md`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/docs/arquitetura/firestore-cache-cqrs.md): CQRS (`portal_views`), cache particionado em blocos e controle de consumo de cotas do Firestore.
  * [`docs/arquitetura/saas-expansao.md`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/docs/arquitetura/saas-expansao.md): Estrutura de expansão multi-escola (SaaS), landing page e guia de onboarding.
* **Planejamento & Roadmap:**
  * [`docs/planejamento/plano-de-acao.md`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/docs/planejamento/plano-de-acao.md): Relatório de auditoria técnica e roadmap de refatorações ativas.
  * [`docs/planejamento/fases-migracao-task.md`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/docs/planejamento/fases-migracao-task.md): Histórico e checklist de migração das Fases 4.1 e 4.2.
  * [`docs/planejamento/historico-correcoes-criticas.md`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/docs/planejamento/historico-correcoes-criticas.md): Histórico de resolução de concorrência, quiz infinito e otimização de cabeçalhos HTTP.
* **Legado:**
  * [`docs/legado/appscript/`](file:///c:/Users/Mario%20Renan/OneDrive/Área%20de%20Trabalho/painel-erem/docs/legado/appscript/): Scripts legados do Google Apps Script preservados para referência histórica.
