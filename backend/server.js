require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./src/models'); // Importa o db object do models/index.js

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'Bem-vindo à API do Scala Gestão! Ambiente Profissional.' });
});

// Rotas da Aplicação
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/vehicles', require('./src/routes/vehicle.routes'));
app.use('/api/employees', require('./src/routes/employee.routes'));
app.use('/api/refuelings', require('./src/routes/refueling.routes.js'));
app.use('/api/dashboard', require('./src/routes/dashboard.routes.js')); 
app.use('/api/maintenances', require('./src/routes/maintenance.routes.js'));
app.use('/api/general-expenses', require('./src/routes/generalExpense.routes.js'));
app.use('/api/revenues', require('./src/routes/revenue.routes.js'));


const PORT = process.env.PORT || 5000;

// Inicialização do Servidor
async function startServer() {
  try {
    // Conecta ao banco de dados usando a instância do sequelize do db object
    await db.sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso.');

    // Sincroniza os modelos. Em produção, considere usar Migrations.
    await db.sequelize.sync({ force: false });
    console.log('✅ Todos os modelos foram sincronizados com sucesso.');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Não foi possível iniciar o servidor:', error);
    process.exit(1); // Encerra o processo se não conseguir conectar ao DB
  }
}

startServer();