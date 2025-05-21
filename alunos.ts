import { FastifyInstance } from 'fastify';
import { conexao } from '../conexao';

export async function alunoRoutes(app: FastifyInstance) {

  // Listar alunos
  app.get('/alunos', async (request, reply) => {
    conexao.query('SELECT * FROM alunos', (erro, resultados) => {
      if (erro) {
        reply.status(500).send({ erro: 'Erro ao buscar alunos' });
      } else {
        reply.send(resultados);
      }
    });
  });

  // Cadastrar aluno
  app.post('/alunos', async (request, reply) => {
    const { cpf, nome, idade, plano } = request.body as {
      cpf: string;
      nome: string;
      idade: number;
      plano: string;
    };

    const sql = 'INSERT INTO alunos (cpf, nome, idade, plano) VALUES (?, ?, ?, ?)';
    const valores = [cpf, nome, idade, plano];

    conexao.query(sql, valores, (erro) => {
      if (erro) {
        reply.status(500).send({ erro: 'Erro ao cadastrar aluno', detalhes: erro });
      } else {
        reply.status(201).send({ mensagem: 'Aluno cadastrado com sucesso!' });
      }
    });
  });

}
