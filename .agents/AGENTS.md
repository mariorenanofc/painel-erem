# Regras do Projeto (EREM Painel)

## Diretrizes de Codificação e Tipagem

### 1. Proibição Estrita do Tipo `any`
* **Regra**: Sob hipótese alguma deve ser utilizada a palavra-chave `any` para tipar variáveis, constantes, parâmetros de funções, retornos, mapeadores ou blocos de captura de erro (`catch`).
* **Abordagem Correta**:
  - Defina interfaces claras (ex: `interface Aluno`, `interface Atividade`).
  - Para loops de consulta no Firestore, utilize `QueryDocumentSnapshot` ou defina as propriedades esperadas do `.data()`.
  - Em tratamento de exceções, use `catch (error: unknown)` e realize o cast necessário (ex: `const err = error as Error`).
