export interface QuestaoTechPublica {
  id: number;
  pergunta: string;
  opcoes: string[];
}

export interface QuestaoTechCompleta extends QuestaoTechPublica {
  respostaCorreta: number; // Índice 0 a 3 da alternativa correta
  explicacao: string;
}

export interface BancoTech {
  id: string;
  nome: string;
  icone: string;
  descricao: string;
  badge: string;
  questoes: QuestaoTechCompleta[];
}

export const BANCO_TECNOLOGIAS: Record<string, BancoTech> = {
  React: {
    id: "React",
    nome: "React",
    icone: "⚛️",
    descricao: "Biblioteca para construção de interfaces reativas e baseadas em componentes.",
    badge: "⚛️ React Specialist",
    questoes: [
      {
        id: 1,
        pergunta: "Qual é a principal função do Virtual DOM no ecossistema React?",
        opcoes: [
          "Substituir o navegador na renderização direta de elementos gráficos.",
          "Minimizar mutações diretas no DOM real calculando diffs em memória.",
          "Compilar código JavaScript diretamente para WebAssembly.",
          "Gerenciar a conexão via WebSocket com o banco de dados."
        ],
        respostaCorreta: 1,
        explicacao: "O Virtual DOM calcula as diferenças em memória antes de aplicar apenas as mudanças necessárias no DOM real."
      },
      {
        id: 2,
        pergunta: "Em um componente funcional, qual Hook é utilizado para gerenciar estados locais?",
        opcoes: [
          "useEffect",
          "useReducer apenas para strings",
          "useState",
          "useContext"
        ],
        respostaCorreta: 2,
        explicacao: "O Hook useState é o mecanismo padrão para declarar e atualizar variáveis de estado local."
      },
      {
        id: 3,
        pergunta: "O que acontece quando o array de dependências do useEffect é fornecido vazio ([] )?",
        opcoes: [
          "O efeito é executado apenas uma vez, logo após a montagem inicial do componente.",
          "O efeito é disparado em todo ciclo de renderização.",
          "O efeito é cancelado e nunca executado.",
          "O componente entra em loop infinito de renderização."
        ],
        respostaCorreta: 0,
        explicacao: "Um array de dependências vazio instrui o React a executar o efeito somente após a montagem do componente."
      },
      {
        id: 4,
        pergunta: "Por que as 'keys' são fundamentais ao renderizar listas de elementos dinâmicos em React?",
        opcoes: [
          "Para criptografar os dados exibidos ao usuário final.",
          "Para permitir que o CSS aplique gradientes automaticamente.",
          "Para ajudar o algoritmo de reconciliação a identificar itens adicionados, removidos ou reordenados.",
          "Para garantir que a lista seja sincronizada com o LocalStorage."
        ],
        respostaCorreta: 2,
        explicacao: "As chaves fornecem identidade estável aos elementos na árvore virtual para reconciliação otimizada."
      },
      {
        id: 5,
        pergunta: "Qual das opções abaixo viola as Regras dos Hooks (Rules of Hooks)?",
        opcoes: [
          "Chamar um Hook dentro do escopo principal de um componente funcional.",
          "Chamar um Hook dentro de uma função personalizada de Hook (custom hook).",
          "Chamar um Hook dentro de uma estrutura condicional (if/else) ou laço de repetição.",
          "Chamar múltiplos useState sequenciais no topo do componente."
        ],
        respostaCorreta: 2,
        explicacao: "Hooks devem ser sempre invocados no nível superior do componente para garantir a mesma ordem em cada render."
      },
      {
        id: 6,
        pergunta: "Qual é o objetivo do Hook useMemo?",
        opcoes: [
          "Memorizar o resultado computado de uma operação pesada entre renders.",
          "Memorizar a referência de uma função de callback.",
          "Persistir o estado do componente após o fechamento da aba.",
          "Criar uma referência direta para um elemento HTML nativo."
        ],
        respostaCorreta: 0,
        explicacao: "useMemo memoriza o valor de retorno de um cálculo dispendioso até que suas dependências sofram alteração."
      },
      {
        id: 7,
        pergunta: "O que caracteriza o padrão 'Unidirectional Data Flow' (Fluxo Unidirecional de Dados) no React?",
        opcoes: [
          "Os dados viajam exclusivamente dos componentes filhos para os pais via props.",
          "Os dados fluem dos componentes superiores (pais) para os inferiores (filhos) através de props.",
          "Todos os componentes compartilham uma variável global única e mutável.",
          "O DOM manipula diretamente o estado do componente sem avisar o React."
        ],
        respostaCorreta: 1,
        explicacao: "No React os dados fluem de cima para baixo, promovendo previsibilidade e desacoplamento."
      },
      {
        id: 8,
        pergunta: "Como uma função de limpeza (cleanup) é declarada dentro de um useEffect?",
        opcoes: [
          "Retornando uma função a partir da função callback do useEffect.",
          "Passando um segundo argumento com o método window.clean().",
          "Invocando o método useEffect.destroy() ao final do arquivo.",
          "Utilizando a palavra-chave finally no bloco do useEffect."
        ],
        respostaCorreta: 0,
        explicacao: "Se o callback do useEffect retornar uma função, o React a executa ao desmontar ou antes de reexecutar o efeito."
      },
      {
        id: 9,
        pergunta: "Qual é a finalidade principal da Context API?",
        opcoes: [
          "Substituir o backend em conexões com bancos de dados relacionais.",
          "Compartilhar dados globais ou de árvore sem precisar passar props manualmente em cada nível (prop drilling).",
          "Aumentar a velocidade da CPU do dispositivo do cliente.",
          "Converter código TypeScript para JavaScript em tempo real."
        ],
        respostaCorreta: 1,
        explicacao: "A Context API evita prop drilling transmitindo estados globais como tema, usuário ou autenticação."
      },
      {
        id: 10,
        pergunta: "O que o React.StrictMode faz em ambiente de desenvolvimento?",
        opcoes: [
          "Bloqueia qualquer requisição HTTP assíncrona.",
          "Executa certas funções e efeitos duas vezes intencionalmente para detectar efeitos colaterais e métodos obsoletos.",
          "Impede que o código rode se houver mais de 5 componentes na página.",
          "Compila o projeto em modo produção automaticamente."
        ],
        respostaCorreta: 1,
        explicacao: "No modo estrito de desenvolvimento, o React renderiza em dobro para salientar bugs e efeitos colaterais impuros."
      }
    ]
  },

  TypeScript: {
    id: "TypeScript",
    nome: "TypeScript",
    icone: "🟦",
    descricao: "Superset tipado do JavaScript que traz segurança e escalabilidade ao código.",
    badge: "🟦 TypeScript Master",
    questoes: [
      {
        id: 1,
        pergunta: "Qual é o tipo mais seguro para representar um valor cujo tipo é desconhecido no TypeScript moderno?",
        opcoes: [
          "any",
          "unknown",
          "never",
          "void"
        ],
        respostaCorreta: 1,
        explicacao: "O tipo 'unknown' exige checagem de tipo (narrowing) antes de permitir qualquer operação, garantindo segurança estrita."
      },
      {
        id: 2,
        pergunta: "Qual operador do TypeScript permite criar um tipo que combina múltiplos tipos em um único (Intersection Type)?",
        opcoes: [
          "| (barra vertical)",
          "& (e comercial)",
          "? (ponto de interrogação)",
          ": (dois pontos)"
        ],
        respostaCorreta: 1,
        explicacao: "O operador & cria uma interseção, exigindo que o objeto satisfaça todas as propriedades dos tipos combinados."
      },
      {
        id: 3,
        pergunta: "Qual é a principal utilidade dos Generics no TypeScript?",
        opcoes: [
          "Criar componentes e funções reutilizáveis capazes de trabalhar com uma variedade de tipos preservando a tipagem.",
          "Forçar a execução síncrona de chamadas de rede.",
          "Substituir as interfaces por tipos primitivos.",
          "Exportar variáveis privadas fora do módulo."
        ],
        respostaCorreta: 0,
        explicacao: "Generics permitem criar abstrações type-safe com parâmetros de tipos dinâmicos (ex: <T>)."
      },
      {
        id: 4,
        pergunta: "O que o modificador 'readonly' faz quando aplicado a uma propriedade de interface?",
        opcoes: [
          "Impede que a propriedade seja lida por outros arquivos.",
          "Impede que o valor da propriedade seja alterado após a inicialização.",
          "Torna a propriedade opcional no momento da instanciação.",
          "Exclui a propriedade automaticamente no bundle final."
        ],
        respostaCorreta: 1,
        explicacao: "Propriedades marcadas como readonly são imutáveis após a atribuição inicial."
      },
      {
        id: 5,
        pergunta: "Qual Utility Type torna todas as propriedades de uma interface opcionais?",
        opcoes: [
          "Required<T>",
          "Pick<T, K>",
          "Partial<T>",
          "Omit<T, K>"
        ],
        respostaCorreta: 2,
        explicacao: "Partial<T> transforma todas as chaves de um tipo T em opcionais (com ?)."
      },
      {
        id: 6,
        pergunta: "O que o tipo 'never' representa no sistema de tipos do TypeScript?",
        opcoes: [
          "Valores que nunca podem ocorrer, como em funções que lançam exceções ou loops infinitos.",
          "Valores que podem ser null ou undefined.",
          "Funções que retornam uma Promise resolvida.",
          "Variáveis globais que não possuem escopo fechado."
        ],
        respostaCorreta: 0,
        explicacao: "O tipo 'never' expressa a ausência total de valores possíveis e ponto inalcançável de código."
      },
      {
        id: 7,
        pergunta: "Qual a diferença conceitual entre 'interface' e 'type alias' no TypeScript?",
        opcoes: [
          "Interfaces podem ser mescladas via declaration merging; type aliases oferecem suporte mais amplo a uniões e tuplas.",
          "Type aliases rodam mais rápido no navegador que interfaces.",
          "Interfaces não suportam herança via extends.",
          "Type aliases não podem receber objetos nem funções."
        ],
        respostaCorreta: 0,
        explicacao: "Interfaces suportam declaration merging aberto; types são mais flexíveis com uniões primitivas e mapeamentos."
      },
      {
        id: 8,
        pergunta: "Como o 'Optional Chaining' (?.) se comporta em tempo de execução?",
        opcoes: [
          "Lança um TypeError caso o valor anterior seja null ou undefined.",
          "Avalia imediatamente como undefined sem quebrar a execução se a referência for nula ou indefinida.",
          "Converte o valor para string vazia.",
          "Reinicia a página automaticamente."
        ],
        respostaCorreta: 1,
        explicacao: "O encadeamento opcional retorna undefined de forma segura se o operando à esquerda for nullish."
      },
      {
        id: 9,
        pergunta: "Para que serve o operador 'keyof' no TypeScript?",
        opcoes: [
          "Retorna uma união de tipos literais contendo as chaves públicas conhecidas de um tipo de objeto.",
          "Verifica se uma chave existe no LocalStorage.",
          "Criptografa as chaves de um objeto JSON.",
          "Remove as chaves privadas de uma classe."
        ],
        respostaCorreta: 0,
        explicacao: "keyof T produz um tipo que é a união de todas as chaves literais de T."
      },
      {
        id: 10,
        pergunta: "Qual das opções representa uma checagem de tipo (Type Guard) válida no TypeScript?",
        opcoes: [
          "if (typeof x === 'string')",
          "if (x == null_guard)",
          "if (cast<string>(x))",
          "if (x.isTypeScript())"
        ],
        respostaCorreta: 0,
        explicacao: "Cláusulas typeof, instanceof ou predicados 'x is Tipo' refinam o tipo no escopo condicional."
      }
    ]
  },

  Python: {
    id: "Python",
    nome: "Python",
    icone: "🐍",
    descricao: "Linguagem versátil com foco em legibilidade, automação, backend e ciência de dados.",
    badge: "🐍 Python Developer Pro",
    questoes: [
      {
        id: 1,
        pergunta: "Qual é a estrutura de dados embutida do Python que é imutável e ordenada?",
        opcoes: [
          "Lista (list)",
          "Dicionário (dict)",
          "Tupla (tuple)",
          "Conjunto (set)"
        ],
        respostaCorreta: 2,
        explicacao: "Tuplas são sequências ordenadas de elementos que não podem ter seus itens modificados após a criação."
      },
      {
        id: 2,
        pergunta: "Qual é a saída da expressão `[x * 2 for x in range(3)]`?",
        opcoes: [
          "[0, 2, 4]",
          "[2, 4, 6]",
          "[0, 1, 2]",
          "[2, 2, 2]"
        ],
        respostaCorreta: 0,
        explicacao: "range(3) gera 0, 1 e 2. Multiplicando cada elemento por 2, obtém-se a lista [0, 2, 4]."
      },
      {
        id: 3,
        pergunta: "Para que serve o bloco `with` ao manipular arquivos em Python?",
        opcoes: [
          "Para garantir o fechamento seguro e liberação do arquivo através de um context manager, mesmo em caso de erro.",
          "Para acelerar o download do arquivo via internet.",
          "Para criptografar o conteúdo do arquivo em formato binário.",
          "Para impedir que outros usuários do sistema operacional leiam o arquivo."
        ],
        respostaCorreta: 0,
        explicacao: "A instrução `with` invoca os métodos __enter__ e __exit__, garantindo o fechamento limpo do recurso."
      },
      {
        id: 4,
        pergunta: "Como são chamadas as funções anônimas de linha única em Python?",
        opcoes: [
          "inline functions",
          "lambda functions",
          "arrow functions",
          "micro functions"
        ],
        respostaCorreta: 1,
        explicacao: "A palavra-chave `lambda` define pequenas funções anônimas no Python."
      },
      {
        id: 5,
        pergunta: "Qual é a diferença entre os operadores `==` e `is` no Python?",
        opcoes: [
          "`==` compara a igualdade de valores; `is` compara a identidade na memória (mesmo objeto).",
          "`==` é exclusivo de strings; `is` é exclusivo de números inteiros.",
          "`==` compara tipos; `is` compara nomes de variáveis.",
          "Ambos são exatamente idênticos em todas as circunstâncias."
        ],
        respostaCorreta: 0,
        explicacao: "`==` avalia a equivalência de dados (__eq__), enquanto `is` testa se id(a) == id(b)."
      },
      {
        id: 6,
        pergunta: "O que o decorador `@property` permite fazer em uma classe Python?",
        opcoes: [
          "Transformar um método de instância para ser acessado como se fosse um atributo público.",
          "Tornar o atributo imutável a nível de hardware.",
          "Permitir herança múltipla sem construtor.",
          "Criar uma chave primária em um banco de dados relacional."
        ],
        respostaCorreta: 0,
        explicacao: "`@property` cria getters e setters elegantes, permitindo acesso funcional com sintaxe de atributo."
      },
      {
        id: 7,
        pergunta: "Qual módulo padrão do Python é utilizado para serializar e desserializar estruturas de dados em JSON?",
        opcoes: [
          "requests",
          "pickle",
          "json",
          "parser"
        ],
        respostaCorreta: 2,
        explicacao: "O módulo embutido `json` oferece funções como json.dumps() e json.loads()."
      },
      {
        id: 8,
        pergunta: "Qual estrutura de controle de exceções garante a execução de um bloco de código ocorra ou não um erro?",
        opcoes: [
          "try",
          "except",
          "else",
          "finally"
        ],
        respostaCorreta: 3,
        explicacao: "O bloco `finally` é sempre executado, ideal para limpezas de recursos e encerramentos."
      },
      {
        id: 9,
        pergunta: "Como são representados os parâmetros variáveis posicionais e nomeados em uma definição de função?",
        opcoes: [
          "*args e **kwargs",
          "&args e &&kwargs",
          "params e options",
          "...args e ...props"
        ],
        respostaCorreta: 0,
        explicacao: "*args empacota argumentos posicionais em tupla e **kwargs empacota argumentos nomeados em dicionário."
      },
      {
        id: 10,
        pergunta: "Qual método mágico é responsável por inicializar uma nova instância de uma classe?",
        opcoes: [
          "__new__",
          "__init__",
          "__start__",
          "__create__"
        ],
        respostaCorreta: 1,
        explicacao: "O método `__init__` atua como o construtor de inicialização das propriedades do objeto em Python."
      }
    ]
  },

  JavaScript: {
    id: "JavaScript",
    nome: "JavaScript",
    icone: "🟨",
    descricao: "A espinha dorsal da web moderna: lógica assíncrona, DOM e ecossistema fullstack.",
    badge: "🟨 JavaScript Alchemist",
    questoes: [
      {
        id: 1,
        pergunta: "Qual é a principal diferença entre `let` e `var` em relação ao escopo?",
        opcoes: [
          "`let` possui escopo de bloco; `var` possui escopo de função ou global.",
          "`let` não pode ter seu valor reatribuído; `var` sempre pode.",
          "`var` não sofre hoisting; `let` sofre hoisting sem Temporal Dead Zone.",
          "Não há diferença, são apenas sinônimos sintáticos."
        ],
        respostaCorreta: 0,
        explicacao: "`let` respeita o escopo de bloco delimitado por chaves {}, prevenindo vazamento de escopo comum ao `var`."
      },
      {
        id: 2,
        pergunta: "O que é uma Closure em JavaScript?",
        opcoes: [
          "Uma função que se fecha e encerra o navegador.",
          "A combinação de uma função com as referências ao seu estado léxico externo.",
          "Um método especial para fechar conexões de banco de dados.",
          "Um erro de sintaxe lançado quando chaves não são fechadas."
        ],
        respostaCorreta: 1,
        explicacao: "Uma closure dá acesso ao escopo de uma função externa a partir de uma função interna mesmo após a execução da externa."
      },
      {
        id: 3,
        pergunta: "Qual método de array cria um novo array com todos os elementos que passaram em um teste lógico?",
        opcoes: [
          "map()",
          "forEach()",
          "filter()",
          "reduce()"
        ],
        respostaCorreta: 2,
        explicacao: "`filter()` itera sobre a coleção e retorna um novo array contendo os elementos cuja condição retornou true."
      },
      {
        id: 4,
        pergunta: "Qual é a saída de `typeof NaN` no JavaScript?",
        opcoes: [
          "'number'",
          "'nan'",
          "'undefined'",
          "'object'"
        ],
        respostaCorreta: 0,
        explicacao: "NaN significa 'Not-a-Number', mas segundo a especificação IEEE 754 seu tipo de dado é primitivamente 'number'."
      },
      {
        id: 5,
        pergunta: "Qual é o papel do Event Loop no runtime JavaScript?",
        opcoes: [
          "Executar códigos em paralelo usando múltiplos núcleos de CPU diretamente sem threads.",
          "Monitorar a Call Stack e a Task Queue, despachando callbacks pendentes quando a pilha estiver livre.",
          "Compilar código JavaScript para binário nativo.",
          "Limpar o cache do navegador periodicamente."
        ],
        respostaCorreta: 1,
        explicacao: "O Event Loop viabiliza a execução assíncrona não-bloqueante num ambiente prioritariamente single-threaded."
      },
      {
        id: 6,
        pergunta: "Qual método é utilizado para aguardar a resolução de múltiplas Promises simultâneas falhando se qualquer uma for rejeitada?",
        opcoes: [
          "Promise.race()",
          "Promise.all()",
          "Promise.any()",
          "Promise.allSettled()"
        ],
        respostaCorreta: 1,
        explicacao: "Promise.all() resolve quando todas concluem com sucesso ou rejeita imediatamente no primeiro erro (fail-fast)."
      },
      {
        id: 7,
        pergunta: "Como funciona a igualdade estrita (`===`) comparada à solta (`==`)?",
        opcoes: [
          "`===` verifica valor e tipo sem realizar coerção de tipos implícita.",
          "`==` nunca realiza conversão de tipos.",
          "`===` converte strings em números antes de checar.",
          "Ambas operam da mesma forma para objetos e arrays."
        ],
        respostaCorreta: 0,
        explicacao: "A igualdade estrita não faz coerção; tipos diferentes resultam em false imediatamente."
      },
      {
        id: 8,
        pergunta: "Qual é o valor padrão de uma variável declarada com `let` sem atribuição de valor?",
        opcoes: [
          "null",
          "0",
          "undefined",
          "false"
        ],
        respostaCorreta: 2,
        explicacao: "Variáveis inicializadas sem valor recebem implicitamente o valor `undefined`."
      },
      {
        id: 9,
        pergunta: "O que o operador spread (`...`) faz quando aplicado a um array?",
        opcoes: [
          "Espalha os elementos do array em locais onde zero ou mais argumentos ou elementos são esperados.",
          "Inverte a ordem dos itens do array.",
          "Filtra os números negativos do array.",
          "Converte o array em uma string binária."
        ],
        respostaCorreta: 0,
        explicacao: "A sintaxe de espalhamento descompacta elementos iteráveis em novos arrays, objetos ou listas de argumentos."
      },
      {
        id: 10,
        pergunta: "Qual é o benefício do padrão `async / await` introduzido no ES2017?",
        opcoes: [
          "Permitir escrever código assíncrono com aparência e estrutura síncrona legível.",
          "Tornar o JavaScript 100% multithreaded.",
          "Substituir o uso de variáveis locais.",
          "Eliminar a necessidade de funções no código."
        ],
        respostaCorreta: 0,
        explicacao: "Async/await é açúcar sintático sobre Promises, facilitando try/catch e leitura sequencial limpa."
      }
    ]
  },

  Node: {
    id: "Node",
    nome: "Node.js",
    icone: "🟢",
    descricao: "Ambiente de execução JavaScript no servidor baseado no motor V8 do Google Chrome.",
    badge: "🟢 Node.js Architect",
    questoes: [
      {
        id: 1,
        pergunta: "Qual é a biblioteca em C/C++ que gerencia o Event Loop e operações de I/O assíncronas no Node.js?",
        opcoes: [
          "libuv",
          "v8-engine",
          "openSSL",
          "boost"
        ],
        respostaCorreta: 0,
        explicacao: "A libuv é responsável pela abstração multiplataforma e manipulação não-bloqueante de arquivos e rede."
      },
      {
        id: 2,
        pergunta: "Em aplicações Express.js, o que é um 'Middleware'?",
        opcoes: [
          "Uma função que tem acesso aos objetos de requisição (req), resposta (res) e à próxima função (next) no ciclo de requisição.",
          "Um banco de dados embutido em memória.",
          "Um arquivo estático como imagem ou folha de estilo.",
          "Um compilador que converte CSS em JavaScript."
        ],
        respostaCorreta: 0,
        explicacao: "Middlewares interceptam requisições HTTP, executando validações, logs, autenticação ou transformações."
      },
      {
        id: 3,
        pergunta: "Qual arquivo de configuração lista os pacotes de dependências de um projeto Node.js?",
        opcoes: [
          "package.json",
          "node_modules.lock",
          "server.config.js",
          "tsconfig.node"
        ],
        respostaCorreta: 0,
        explicacao: "O package.json concentra os metadados do projeto, scripts e lista de dependências de produção e desenvolvimento."
      },
      {
        id: 4,
        pergunta: "Para que servem os 'Streams' no Node.js?",
        opcoes: [
          "Para processar grandes volumes de dados em pedaços contínuos (chunks) sem alocar tudo na memória RAM.",
          "Para transmitir vídeos ao vivo para o YouTube.",
          "Para renderizar páginas HTML diretamente no navegador.",
          "Para criptografar senhas usando hash irreversível."
        ],
        respostaCorreta: 0,
        explicacao: "Streams permitem leitura/escrita eficiente de dados pesados mantendo baixo consumo de memória."
      },
      {
        id: 5,
        pergunta: "Qual objeto global no Node.js fornece acesso às variáveis de ambiente do sistema?",
        opcoes: [
          "process.env",
          "window.env",
          "global.environment",
          "system.variables"
        ],
        respostaCorreta: 0,
        explicacao: "process.env armazena as variáveis de ambiente carregadas pelo SO ou arquivos .env."
      },
      {
        id: 6,
        pergunta: "Qual é a diferença entre `npm install --save` e `npm install --save-dev`?",
        opcoes: [
          "`--save` instala dependências necessárias em produção; `--save-dev` instala ferramentas úteis apenas no desenvolvimento e build.",
          "`--save-dev` instala pacotes diretamente no sistema operacional.",
          "`--save` não adiciona o pacote ao package.json.",
          "Ambos executam o mesmo comando sem qualquer distinção."
        ],
        respostaCorreta: 0,
        explicacao: "devdependencies (como TypeScript, linters e testes) não são empacotadas no runtime final de produção."
      },
      {
        id: 7,
        pergunta: "O que o método `path.join()` do módulo nativo 'path' realiza?",
        opcoes: [
          "Une múltiplos segmentos de caminho usando o separador específico do sistema operacional (ex: / ou \\).",
          "Cria uma nova pasta no disco rígido.",
          "Converte arquivos de imagem em texto.",
          "Realiza upload de arquivos para a nuvem."
        ],
        respostaCorreta: 0,
        explicacao: "path.join normaliza e combina caminhos de diretório garantindo compatibilidade entre Windows e Linux."
      },
      {
        id: 8,
        pergunta: "Qual código de status HTTP deve ser retornado por uma API REST para indicar que um novo recurso foi criado com sucesso?",
        opcoes: [
          "200 OK",
          "201 Created",
          "204 No Content",
          "301 Moved Permanently"
        ],
        respostaCorreta: 1,
        explicacao: "O status 201 Created é a convenção RESTful para respostas de criação bem-sucedida (ex: POST)."
      },
      {
        id: 9,
        pergunta: "Por que se deve evitar operações síncronas como `fs.readFileSync` em rotas de APIs de alta concorrência?",
        opcoes: [
          "Porque elas bloqueiam o Event Loop do processo único do Node, travando todas as requisições de outros clientes.",
          "Porque o arquivo é apagado automaticamente.",
          "Porque consome largura de banda de internet.",
          "Porque o Node.js não permite o uso de arquivos de texto."
        ],
        respostaCorreta: 0,
        explicacao: "Operações I/O síncronas bloqueiam a thread principal do Node até sua conclusão, reduzindo drasticamente o throughput."
      },
      {
        id: 10,
        pergunta: "Qual módulo nativo do Node.js permite criar servidores HTTP sem precisar de pacotes externos?",
        opcoes: [
          "http",
          "express",
          "net-server",
          "web-socket"
        ],
        respostaCorreta: 0,
        explicacao: "O módulo embutido `http` (ou `https`) fornece métodos como createServer() nativamente."
      }
    ]
  },

  Database: {
    id: "Database",
    nome: "SQL & Bancos de Dados",
    icone: "🗄️",
    descricao: "Modelagem relacional, queries avançadas, integridade referencial e transações ACID.",
    badge: "🗄️ Database Specialist",
    questoes: [
      {
        id: 1,
        pergunta: "O que a propriedade 'Atomicidade' garante no modelo transacional ACID?",
        opcoes: [
          "Que a transação seja executada por completo ou inteiramente desfeita (tudo ou nada), sem estados intermediários.",
          "Que a tabela seja criptografada usando física quântica.",
          "Que todas as colunas sejam do tipo numérico.",
          "Que o banco nunca reinicie durante o dia."
        ],
        respostaCorreta: 0,
        explicacao: "A atomicidade assegura que se qualquer operação da transação falhar, toda ela é revertida (rollback)."
      },
      {
        id: 2,
        pergunta: "Qual comando SQL é utilizado para extrair dados combinando registros de duas tabelas com base em uma condição comum?",
        opcoes: [
          "JOIN",
          "MERGE",
          "UNION ALL",
          "ATTACH"
        ],
        respostaCorreta: 0,
        explicacao: "A cláusula JOIN relaciona linhas de duas ou mais tabelas baseado em chaves primárias e estrangeiras."
      },
      {
        id: 3,
        pergunta: "Qual cláusula é utilizada para filtrar resultados de funções agregadas como COUNT() ou AVG()?",
        opcoes: [
          "WHERE",
          "HAVING",
          "GROUP FILTER",
          "ORDER BY"
        ],
        respostaCorreta: 1,
        explicacao: "A cláusula `HAVING` atua sobre os grupos formados por `GROUP BY`, enquanto `WHERE` filtra linhas antes da agregação."
      },
      {
        id: 4,
        pergunta: "O que é uma Chave Primária (Primary Key)?",
        opcoes: [
          "Uma coluna ou combinação de colunas que identifica de forma unívoca e exclusiva cada linha em uma tabela.",
          "Uma senha usada para conectar no banco de dados.",
          "Uma chave que permite abrir arquivos no Windows.",
          "O primeiro índice criado automaticamente no schema."
        ],
        respostaCorreta: 0,
        explicacao: "Chaves primárias garantem unicidade e não-nulidade em cada tupla da tabela."
      },
      {
        id: 5,
        pergunta: "Qual é o principal impacto positivo da criação de um Índice (Index) em colunas frequentemente consultadas?",
        opcoes: [
          "Acelera drasticamente a velocidade de buscas e filtros (SELECT).",
          "Diminui o espaço ocupado no disco rígido.",
          "Acelera a velocidade de inserções em massa (INSERT).",
          "Torna desnecessário o uso de backups."
        ],
        respostaCorreta: 0,
        explicacao: "Índices criam árvores de busca balanceadas (B-Tree), transformando leituras lineares em operações logarítmicas."
      },
      {
        id: 6,
        pergunta: "O que uma Chave Estrangeira (Foreign Key) assegura no modelo relacional?",
        opcoes: [
          "Integridade referencial entre duas tabelas, impedindo registros órfãos.",
          "Comunicação com servidores de outros países.",
          "Tradução de textos armazenados no banco.",
          "Formatação de valores monetários."
        ],
        respostaCorreta: 0,
        explicacao: "Chaves estrangeiras mantêm a integridade referencial vinculando dados aos valores válidos da tabela pai."
      },
      {
        id: 7,
        pergunta: "Qual comando SQL exclui todos os registros de uma tabela mantendo sua estrutura e reiniciando sequências de auto-incremento?",
        opcoes: [
          "TRUNCATE TABLE",
          "DROP TABLE",
          "DELETE ALL",
          "CLEAR TABLE"
        ],
        respostaCorreta: 0,
        explicacao: "TRUNCATE remove todos os dados rapidamente de forma otimizada sem registrar linha por linha no log de transações."
      },
      {
        id: 8,
        pergunta: "Qual das opções representa uma característica dos bancos de dados NoSQL orientados a documentos (ex: MongoDB/Firestore)?",
        opcoes: [
          "Armazenamento de dados em documentos flexíveis semiestruturados (como JSON/BSON) sem esquema rígido obrigatório.",
          "Obrigatoriedade de relacionamentos rígidos via Foreign Keys.",
          "Incompatibilidade absoluta com JavaScript.",
          "Incapacidade de realizar buscas por texto."
        ],
        respostaCorreta: 0,
        explicacao: "Bancos orientados a documentos priorizam esquemas dinâmicos e escalabilidade horizontal para dados agregados."
      },
      {
        id: 9,
        pergunta: "O que a Primeira Forma Normal (1FN) exige na normalização de tabelas relacionais?",
        opcoes: [
          "Que os valores dos atributos sejam atômicos (indivisíveis) e sem grupos repetitivos.",
          "Que a tabela tenha pelo menos três chaves estrangeiras.",
          "Que todas as colunas sejam criptografadas.",
          "Que o banco use apenas letras maiúsculas."
        ],
        respostaCorreta: 0,
        explicacao: "1FN proíbe arrays, listas aninhadas ou múltiplos valores na mesma célula de uma linha."
      },
      {
        id: 10,
        pergunta: "Qual comando garante que as alterações de uma transação sejam gravadas permanentemente no banco?",
        opcoes: [
          "COMMIT",
          "ROLLBACK",
          "SAVEPOINT",
          "APPLY"
        ],
        respostaCorreta: 0,
        explicacao: "O comando `COMMIT` consolida as operações pendentes tornando-as permanentes no armazenamento de dados."
      }
    ]
  }
};

/**
 * Retorna lista de tecnologias suportadas para o memorial
 */
export function listarTecnologiasDisponiveis() {
  return Object.values(BANCO_TECNOLOGIAS).map(item => ({
    id: item.id,
    nome: item.nome,
    icone: item.icone,
    descricao: item.descricao,
    badge: item.badge,
    totalQuestoes: item.questoes.length
  }));
}

/**
 * Retorna as questões de uma tecnologia SEM as respostas corretas (seguro para o frontend)
 */
export function obterQuestoesPublicas(techId: string): QuestaoTechPublica[] | null {
  const banco = BANCO_TECNOLOGIAS[techId];
  if (!banco) return null;

  return banco.questoes.map(q => ({
    id: q.id,
    pergunta: q.pergunta,
    opcoes: [...q.opcoes]
  }));
}

/**
 * Avalia as respostas do aluno e calcula nota e aprovação (nota >= 7)
 */
export function avaliarQuestoesTech(techId: string, respostas: Record<number, number>): {
  sucesso: boolean;
  nota: number;
  acertos: number;
  total: number;
  aprovado: boolean;
  badge: string;
  feedback: string;
} {
  const banco = BANCO_TECNOLOGIAS[techId];
  if (!banco) {
    return {
      sucesso: false,
      nota: 0,
      acertos: 0,
      total: 0,
      aprovado: false,
      badge: "",
      feedback: "Tecnologia não encontrada no banco de questionários."
    };
  }

  let acertos = 0;
  const total = banco.questoes.length;

  banco.questoes.forEach(q => {
    const respostaAluno = respostas[q.id];
    if (respostaAluno !== undefined && respostaAluno === q.respostaCorreta) {
      acertos++;
    }
  });

  const nota = Number(((acertos / total) * 10).toFixed(1));
  const aprovado = nota >= 7; // Regra de negócio: nota superior ou igual a 7 de 10

  const feedback = aprovado
    ? `Incrível! Você obteve ${nota}/10 (${acertos} acertos de ${total}) e conquistou a badge oficial de ${banco.nome} no Hall da Fama!`
    : `Você obteve ${nota}/10 (${acertos} acertos de ${total}). É necessária nota mínima de 7.0 para aprovação. Revise os conceitos e tente novamente!`;

  return {
    sucesso: true,
    nota,
    acertos,
    total,
    aprovado,
    badge: banco.badge,
    feedback
  };
}
