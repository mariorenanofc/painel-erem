# Registro de Consumo do Firebase - EREM Painel

Este arquivo registra a evolução de consumo de recursos do Cloud Firestore (leituras, gravações e exclusões) ao longo das otimizações do sistema.

## Registro Baseline (Antes da Otimização)
* **Data:** 05/08/2026
* **Hora:** 07:28 AM (Início do dia de testes/ajustes)
* **Estado:** Inicial (Cotas do Firebase recém-resetadas/iniciais)

| Métrica | Consumo Atual | Limite Diário (Sem Custo) | Porcentagem Usada |
| :--- | :--- | :--- | :--- |
| **Leituras** | 0 | 50.000 (50 mil) | 0% |
| **Gravações (Writes)** | 0 | 20.000 (20 mil) | 0% |
| **Exclusões (Deletes)** | 0 | 20.000 (20 mil) | 0% |

---

## Log de Modificações Aplicadas
* **Data:** 05/08/2026
* **Hora:** 08:12 AM
* **Alteração Realizada:** Correção de Cabeçalhos HTTP de Cache Control (`no-store`) nas rotas `/api/alunos/portal`, `/api/alunos/ranking`, `/api/alunos/perfil` e `/api/tutor/transacoes`.
* **Objetivo:** Resolver em tempo de aula o delay de 5 minutos na visualização de atividades publicadas e o bug de cache do navegador exibindo 0 XP nas transações do tutor.
* **Status:** Concluído e em observação durante o dia.

---
*Observação: As métricas de baseline acima foram extraídas diretamente do painel de controle do Firebase Console no início do dia de uso.*
