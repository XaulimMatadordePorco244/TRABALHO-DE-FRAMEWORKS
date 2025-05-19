import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';

// Configuração do banco de dados
const dbConfig = {
  host: "localhost",
  user: 'root',
  password: "",
  database: 'alunos', // Altere para o nome do seu banco de dados
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Criar pool de conexões
const pool: Pool = mysql.createPool(dbConfig);

// Função para testar a conexão
async function testConnection() {
  let conn: PoolConnection | null = null;
  try {
    conn = await pool.getConnection();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso');
  } catch (error: any) {
    console.error('❌ Erro ao conectar ao banco de dados:', error.message);
    throw error;
  } finally {
    if (conn) conn.release();
  }
}

// Configuração do Fastify
const app: FastifyInstance = fastify();
app.register(cors);

// Rotas
app.get("/", (request: FastifyRequest, reply: FastifyReply) => {
  reply.send("API GymSystem funcionando!");
});

// Rota para listar alunos
app.get("/alunos", async (request: FastifyRequest, reply: FastifyReply) => {
  let conn: PoolConnection | null = null;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT * FROM alunoscadastrados");
    reply.status(200).send(rows);
  } catch (error: any) {
    handleDatabaseError(error, reply);
  } finally {
    if (conn) conn.release();
  }
});

// Rota para cadastrar aluno
app.post("/alunos", async (request: FastifyRequest, reply: FastifyReply) => {
  const aluno = request.body as any;
  let conn: PoolConnection | null = null;
  
  try {
    conn = await pool.getConnection();
    const [result] = await conn.query(
      "INSERT INTO alunoscadastrados (nome, cpf, idade, data_vencimento, plano, status) VALUES (?, ?, ?, ?, ?, ?)",
      [aluno.nome, aluno.cpf, aluno.idade, aluno.data_vencimento, aluno.plano, aluno.status || 'Ativo']
    );
    reply.status(201).send({ message: "Aluno cadastrado com sucesso", id: (result as any).insertId });
  } catch (error: any) {
    handleDatabaseError(error, reply);
  } finally {
    if (conn) conn.release();
  }
});

// Função para tratar erros do banco de dados
function handleDatabaseError(error: any, reply: FastifyReply) {
  console.error('Erro no banco de dados:', error);
  
  if (error.code === "ECONNREFUSED") {
    reply.status(500).send({ error: "Servidor de banco de dados não está respondendo. Verifique se o MySQL está rodando." });
  } else if (error.code === "ER_BAD_DB_ERROR") {
    reply.status(500).send({ error: "Banco de dados não encontrado. Verifique o nome do banco." });
  } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
    reply.status(500).send({ error: "Acesso negado. Verifique usuário e senha do banco de dados." });
  } else if (error.code === "ER_DUP_ENTRY") {
    reply.status(400).send({ error: "CPF já cadastrado no sistema." });
  } else {
    reply.status(500).send({ error: "Erro interno no servidor", details: error.message });
  }
}

// Iniciar servidor
const startServer = async () => {
  try {
    await testConnection();
    await app.listen({ port: 8000, host: '0.0.0.0' });
    console.log(`🚀 Servidor rodando em http://localhost:8000`);
  } catch (error) {
    console.error('Falha ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();