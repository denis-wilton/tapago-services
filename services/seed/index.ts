import cron from "node-cron";

const USER_TARGET_PER_DAY = 4;
const TRANSACTIONS_PER_USER_MAX = 15;

type UserID = string;

interface TransactionsCount {
  [key: UserID]: {
    today: number;
    total: number;
  };
}

let usersToday: UserID[] = [];
let transactionsCount: TransactionsCount = {};

const addUser = async (): Promise<void> => {
  const pessoa = geraPessoa();

  await fetch(`http://customers:3000/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: pessoa.nomeCompleto,
      email: pessoa.email,
      cpf: pessoa.cpf,
    }),
  }).catch((err) => {
    console.error("Erro ao adicionar usuário:", err);
  });

  // Discover the new ID by diffing the old transactionsCount with the new one
  const oldIds = Object.keys(transactionsCount);
  await fillTransactionsMap();
  const newIds = Object.keys(transactionsCount);
  const newId = newIds.find((id) => !oldIds.includes(id));

  if (!newId) {
    console.log("Erro ao descobrir o novo ID");
    return;
  }

  console.log(`Usuário adicionado: ${newId}`);

  usersToday.push(newId ?? `${Math.random()}`);
};

const addTransaction = async (userId: UserID): Promise<void> => {
  const transacao = gerarTransacao();

  await fetch(`http://transactions:3000/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customerId: userId,
      description: transacao.descricao,
      amount: transacao.preco,
    }),
  }).catch((err) => {
    console.error("Erro ao adicionar transação:", err);
  });

  console.log(`Transação adicionada para o usuário: ${userId}`);
  transactionsCount[userId].today++;
  transactionsCount[userId].total++;
};

const fillTransactionsMap = async () => {
  const [customers, transactions] = await Promise.all([
    fetch(`http://customers:3000/`)
      .then((res) => res.json())
      .catch((err) => {
        console.error("Erro ao buscar clientes:", err);
        return [];
      }),
    fetch(`http://transactions:3000/`)
      .then((res) => res.json())
      .catch((err) => {
        console.error("Erro ao buscar transações:", err);
        return [];
      }),
  ]);

  for (const customer of customers) {
    const customerTransactions = transactions.filter(
      (transaction: { customerId: string }) =>
        transaction.customerId === customer.id
    );

    if (!transactionsCount[customer.id]) {
      transactionsCount[customer.id] = {
        today: 0,
        total: customerTransactions.length,
      };
    } else {
      transactionsCount[customer.id].total = customerTransactions.length;
    }
  }
};

const checkAddUser = (): void => {
  if (usersToday.length < USER_TARGET_PER_DAY) {
    const chanceToAddUser = (1 / 3600) * 30;
    if (Math.random() < chanceToAddUser) {
      addUser();
    }
  }
};

const checkAddTransactions = (): void => {
  Object.keys(transactionsCount).forEach((userId: UserID) => {
    if (transactionsCount[userId].today < TRANSACTIONS_PER_USER_MAX) {
      const chanceToAddTransaction = (1 / 3600) * 30;
      if (Math.random() < chanceToAddTransaction) {
        addTransaction(userId);
      }
    }
  });
};

async function logStatus() {
  console.log("Usuários hoje: ", JSON.stringify(usersToday));
  Object.keys(transactionsCount).forEach((userId: UserID) => {
    console.log(
      `Transações do cliente ${userId}: ${transactionsCount[userId].total} (hoje: ${transactionsCount[userId].today})`
    );
  });
}

(async () => {
  await fillTransactionsMap();

  cron.schedule("0 0 * * *", async () => {
    usersToday = [];
    await fillTransactionsMap();
    Object.keys(transactionsCount).forEach((userId: UserID) => {
      transactionsCount[userId].today = 0;
    });
    console.log("Lista de usuários do dia resetada para o novo dia.");
  });

  cron.schedule("* * * * * *", () => {
    console.log("RUNNING!");
    checkAddUser();
    checkAddTransactions();
    logStatus();
  });
})();

function geraCPF(): string {
  const randomDigits = (count: number): number[] => {
    return Array.from({ length: count }, () => Math.floor(Math.random() * 10));
  };

  const calculateDigit = (base: number[]): number => {
    const sum = base.reduce(
      (acc, digit, index) => acc + digit * (base.length + 1 - index),
      0
    );
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const base = randomDigits(9);
  const firstDigit = calculateDigit(base);
  const secondDigit = calculateDigit([...base, firstDigit]);

  return [...base, firstDigit, secondDigit].join("");
}

function gerarNomeCompleto() {
  const primeirosNomes = [
    "João",
    "Maria",
    "Gabriel",
    "Ana",
    "Lucas",
    "Júlia",
    "Pedro",
    "Laura",
    "Gustavo",
    "Isabela",
    "Matheus",
    "Luiza",
    "Rafael",
    "Mariana",
    "Felipe",
    "Giovanna",
    "Bruno",
    "Sofia",
    "Henrique",
    "Larissa",
    "Vinícius",
    "Camila",
    "Leonardo",
    "Carolina",
    "André",
    "Fernanda",
    "Rodrigo",
    "Letícia",
    "Tiago",
    "Alice",
    "Daniel",
    "Amanda",
    "Victor",
    "Thais",
    "Bianca",
    "Renata",
    "Igor",
    "Raquel",
    "Diego",
    "Gabriela",
    "Thiago",
    "Beatriz",
    "Fábio",
    "Patrícia",
    "Guilherme",
    "Elisa",
    "Ricardo",
    "Juliana",
  ];

  const sobrenomes = [
    "Silva",
    "Souza",
    "Oliveira",
    "Santos",
    "Rodrigues",
    "Ferreira",
    "Almeida",
    "Pereira",
    "Costa",
    "Carvalho",
    "Martins",
    "Gonçalves",
    "Moura",
    "Lima",
    "Fernandes",
    "Rocha",
    "Azevedo",
    "Nunes",
    "Barros",
    "Correia",
    "Pires",
    "Campos",
    "Neves",
    "Pinto",
    "Assis",
    "Fonseca",
    "Queiroz",
    "Borges",
    "Macedo",
    "Ramos",
    "Machado",
    "Guimarães",
    "Teixeira",
    "Cavalcante",
    "Duarte",
    "Moreira",
    "Freitas",
    "Mendes",
    "Lins",
    "Nogueira",
    "Araújo",
  ];

  // Função que retorna um item aleatório de um array
  function escolherAleatorio(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Combina um primeiro nome com dois sobrenomes
  const primeiroNome = escolherAleatorio(primeirosNomes);
  const sobrenome1 = escolherAleatorio(sobrenomes);
  const sobrenome2 = escolherAleatorio(sobrenomes);

  return `${primeiroNome} ${sobrenome1} ${sobrenome2}`;
}

function gerarEmail(nomeCompleto: string) {
  const provedores = [
    "gmail.com",
    "outlook.com",
    "yahoo.com",
    "hotmail.com",
    "bol.com.br",
  ];

  // Extrai o primeiro e ultimo nome do nome completo
  const nomes = nomeCompleto.trim().split(" ");
  const primeiroNome = nomes[0].toLowerCase();
  const ultimoNome = nomes[nomes.length - 1].toLowerCase();

  // Escolhe um provedor de email aleatorio
  const provedor = provedores[Math.floor(Math.random() * provedores.length)];

  // Gera um sufixo numerico aleatorio para maior diversidade
  const sufixo = Math.floor(Math.random() * 100);

  // Combina o primeiro nome, ultimo nome e sufixo para criar o email
  return `${primeiroNome}.${ultimoNome}${sufixo}@${provedor}`;
}

function geraPessoa() {
  const nomeCompleto = gerarNomeCompleto();
  const cpf = geraCPF();
  const email = gerarEmail(nomeCompleto);

  return {
    nomeCompleto,
    cpf,
    email,
  };
}

function gerarTransacao() {
  const produtos = [
    "Smartphone",
    "Notebook",
    "Headphone",
    "Teclado Mecânico",
    "Monitor LED",
    "Cadeira Gamer",
    "Tablet",
    "Câmera Digital",
    "Console de Videogame",
    "Smartwatch",
    "Livro",
    "Caixa de Som Bluetooth",
    "Mochila",
    "Mouse",
    "SSD",
    "Memória RAM",
    "Ventilador",
    "Máquina de Café",
    "Fone de Ouvido",
    "Bicicleta",
    "Skate",
    "Patinete Elétrico",
    "Aspirador de Pó",
    "Ar Condicionado",
    "Garrafa Térmica",
    "Micro-ondas",
    "Chaleira Elétrica",
    "Carregador Portátil",
    "Capinha para Celular",
    "Filtro de Água",
    "Chinelo",
    "Tênis",
    "Jaqueta",
    "Bolsa",
    "Relógio",
    "Caneta",
    "Tablet Infantil",
    "Encadernador",
    "Bloco de Notas",
    "Câmera de Segurança",
    "Lampada Inteligente",
    "Adaptador de Tomada",
    "Extensão Elétrica",
    "Controle Remoto",
    "Caixa Organizadora",
    "Calculadora",
    "Caderno",
    "Tinta de Impressora",
  ];

  // Função para escolher um produto aleatório
  const produto = produtos[Math.floor(Math.random() * produtos.length)];

  // Gera um preço aleatório entre 10 e 5000, com duas casas decimais
  const preco = (Math.random() * (5000 - 10) + 10).toFixed(2);

  return {
    descricao: produto,
    preco: parseFloat(preco),
  };
}
