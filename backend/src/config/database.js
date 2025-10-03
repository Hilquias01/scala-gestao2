const { Sequelize } = require('sequelize');
require('dotenv').config();

// Verifica se todas as variáveis de ambiente necessárias estão definidas
if (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_HOST) {
  console.error('ERRO: Variáveis de ambiente do banco de dados (DB_NAME, DB_USER, DB_HOST) não estão definidas.');
  process.exit(1);
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD || null,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false, // Desative para não poluir o console em produção
  }
);

module.exports = sequelize;