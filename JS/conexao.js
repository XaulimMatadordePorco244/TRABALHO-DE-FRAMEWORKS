const fastify = require('fastify')();
const mysql = require('mysql2/promise'); // versão com suporte a async/await

// Conexão com o banco
fastify.register(async function (fastify, opts) {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'alunos'
  });

  fastify.decorate('mysql', connection); // adiciona à instância do fastify
});

// Rota de teste
fastify.get('/alunos', async (request, reply) => {
  const [rows] = await fastify.mysql.query('SELECT * FROM alunos');
  return rows;
});

// Inicia o servidor
fastify.listen({ port: 3000 }, (err, address) => {
  if (err) throw err;
  console.log(`Servidor rodando em ${address}`);
});
