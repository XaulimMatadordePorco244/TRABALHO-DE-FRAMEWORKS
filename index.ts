import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';


// Configuração do banco de dados
const dbConfig = {
  host: "localhost",
  user: 'root',
  password: "",
  database: 'academia', // Altere para o nome do seu banco de dados
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
    console.log('Conexão com o banco de dados estabelecida com sucesso');
  } catch (error: any) {
    console.error('Erro ao conectar ao banco de dados:', error.message);
    throw error;
  } finally {
    if (conn) conn.release();
  }
}

// Configuração do Fastify
const app: FastifyInstance = fastify();
app.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'PUT']
});


// Rotas
// Rota para listar alunos (atualizada para o HTML de listagem)
app.get("/api/alunos", async (request: FastifyRequest, reply: FastifyReply) => {
  let conn: PoolConnection | null = null;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query(`
      SELECT 
        cpf, 
        nome, 
        idade, 
        plano, 
        DATE_FORMAT(data_vencimento, '%d/%m/%Y') as data_vencimento, 
        status 
      FROM alunos
    `);
    reply.status(200).send(rows);
  } catch (error: any) {
    handleDatabaseError(error, reply);
  } finally {
    if (conn) conn.release();
  }
});

// Rota para filtrar alunos (ajustada para o HTML de filtro)
app.get("/api/alunos/filtrar_alunos", async (request: FastifyRequest, reply: FastifyReply) => {
  const query = request.query as { campo: string, valor: string };
  const { campo, valor } = query;

  const camposPermitidos = ["cpf", "nome", "idade", "plano", "data_vencimento", "status"];

  if (!campo || !valor || !camposPermitidos.includes(campo)) {
    return reply.status(400).send({ error: "Parâmetros inválidos." });
  }

  let conn: PoolConnection | null = null;
  try {
    conn = await pool.getConnection();

    let querySql = "SELECT * FROM alunos WHERE ?? LIKE ?";
    let params = [campo, `%${valor}%`];

    if (campo === 'idade') {
      querySql = "SELECT * FROM alunos WHERE ?? = ?";
      params = [campo, parseInt(valor).toString()];
    } else if (campo === 'data_vencimento') {
      querySql = "SELECT * FROM alunos WHERE DATE(??) = DATE(?)";
      params = [campo, valor];
    } else if (campo === 'status') {
      querySql = "SELECT * FROM alunos WHERE ?? = ?";
      params = [campo, valor];
    }


    const [rows] = await conn.query(querySql, params);
    reply.status(200).send(rows);
  } catch (error: any) {
    handleDatabaseError(error, reply);
  } finally {
    if (conn) conn.release();
  }

});

// Rota para cadastrar aluno (ajustada para o HTML de cadastro)
app.post("/api/alunos/cadastrar_aluno", async (request: FastifyRequest, reply: FastifyReply) => {
  const aluno = request.body as any;
  let conn: PoolConnection | null = null;

  try {
    conn = await pool.getConnection();
    const [result] = await conn.query(
      "INSERT INTO alunos (nome, cpf, idade, data_vencimento, plano, status) VALUES (?, ?, ?, ?, ?, ?)",
      [
        aluno.nome,
        aluno.cpf.replace(/\D/g, ''), // Remove formatação do CPF
        aluno.idade,
        aluno.data_vencimento,
        aluno.plano,
        aluno.status || 'Ativo'
      ]
    );
    reply.status(201).send({
      message: "Aluno cadastrado com sucesso",
      id: (result as any).insertId
    });
  } catch (error: any) {
    handleDatabaseError(error, reply);
  } finally {
    if (conn) conn.release();
  }
});

// Rota para deletar aluno (ajustada para o HTML de deleção)
app.delete("/api/alunos/deletar_aluno/:cpf", async (request: FastifyRequest, reply: FastifyReply) => {
  const { cpf } = request.params as { cpf: string };
  console.log("CPF recebido para deletar:", cpf);
  let conn: PoolConnection | null = null;

  try {
    conn = await pool.getConnection();
    const cpfNumerico = cpf.replace(/\D/g, ''); // Remove formatação do CPF

    // Primeiro verifica se o aluno existe
    const [rows] = await conn.query(
      "SELECT * FROM alunos WHERE cpf = ?",
      [cpfNumerico]
    );

    if ((rows as any[]).length === 0) {
      return reply.status(404).send({ error: "Aluno não encontrado" });
    }

    // Se existir, deleta
    await conn.query(
      "DELETE FROM alunos WHERE cpf = ?",
      [cpfNumerico]
    );

    reply.status(200).send({
      message: "Aluno deletado com sucesso",
      aluno: (rows as any[])[0] // Retorna os dados do aluno deletado
    });
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
    console.log(`Servidor rodando em http://localhost:8000`);
  } catch (error) {
    console.error('Falha ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();