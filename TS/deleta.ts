import express, { Request, Response } from 'express';
import mysql from 'mysql2/promise';

const app = express();
const PORT = 3000;

// Conexão com o banco de dados
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sua_base'
};

// Rota para deletar usuário por ID
app.delete('/usuarios/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result]: any = await connection.execute('DELETE FROM usuarios WHERE id = ?', [id]);

    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    }

    res.status(200).json({ mensagem: 'Usuário deletado com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao deletar usuário.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:5500`);
});