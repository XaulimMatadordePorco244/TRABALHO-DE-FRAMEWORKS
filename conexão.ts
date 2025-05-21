import mysql from 'mysql';

export const conexao = mysql.createConnection({
  host: 'localhost',
  user: 'seu_usuario_mysql',
  password: 'sua_senha_mysql',
  database: 'academia',
});

conexao.connect((erro) => {
  if (erro) {
    console.error('Erro ao conectar com o banco de dados:', erro);
    return;
  }
  console.log('Conectado ao banco de dados MySQL!');
});
