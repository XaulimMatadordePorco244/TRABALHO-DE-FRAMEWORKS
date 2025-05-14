import mysql from 'mysql2/promise';
import fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';

const app = fastify();
app.register(cors);

// Conexão com o banco
async function conectar() {
  return await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "academia",
    port: 3306
  });
}

// Rota padrão
app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
  reply.send("Fastify Funcionando");
});

// Rota GET para listar estudantes (usada no listar_alunos.html)
app.get('/estudantes', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const conn = await conectar();
    const [dados] = await conn.query("SELECT * FROM alunos");
    reply.status(200).send(dados);
  } catch (erro: any) {
    tratarErroMySQL(erro, reply);
  }
});

// Rota POST para cadastrar alunos
app.post('/alunos', async (request: FastifyRequest, reply: FastifyReply) => {
  const { cpf, nome, idade, plano } = request.body as any;

  try {
    const conn = await conectar();
    await conn.query(
      "INSERT INTO alunos (cpf, nome, idade, plano) VALUES (?, ?, ?, ?)",
      [cpf, nome, idade, plano]
    );
    // ✅ Mensagem de sucesso já existe
    reply.status(200).send({ mensagem: "Aluno cadastrado com sucesso!" });
  } catch (erro: any) {
    tratarErroMySQL(erro, reply);
  }
});

// Função para tratamento de erros SQL
function tratarErroMySQL(erro: any, reply: FastifyReply) {
  if (erro.code === 'ECONNREFUSED') {
    reply.status(500).send({ mensagem: "Erro: Conexão recusada. Verifique o servidor MySQL." });
  } else if (erro.code === 'ER_DUP_ENTRY') {
    reply.status(400).send({ mensagem: "Erro: CPF já cadastrado." });
  } else if (erro.code === 'ER_BAD_DB_ERROR') {
    reply.status(500).send({ mensagem: "Erro: Banco de dados não encontrado." });
  } else if (erro.code === 'ER_NO_SUCH_TABLE') {
    reply.status(500).send({ mensagem: "Erro: Tabela não encontrada. Verifique se o banco está correto." });
  } else {
    console.error(erro);
    reply.status(500).send({ mensagem: "Erro desconhecido." });
  }
}

// Iniciar servidor
app.listen({ port: 8000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Servidor rodando em ${address}`);
});


