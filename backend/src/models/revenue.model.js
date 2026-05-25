const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Revenue = sequelize.define('Revenue', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'employees', key: 'id' },
      comment: 'Obrigatório quando kind=entrega',
    },
    vehicle_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'vehicles', key: 'id' },
      comment: 'Obrigatório quando kind=entrega',
    },
    kind: {
      type: DataTypes.ENUM('retirada', 'entrega'),
      allowNull: true,
      comment: 'retirada (Areial/Deposito) ou entrega (com motorista/veiculo)',
    },
    pickup_location: {
      type: DataTypes.ENUM('areial', 'deposito'),
      allowNull: true,
      comment: 'Obrigatorio quando kind=retirada',
    },
  }, {
    tableName: 'revenues',
    timestamps: true,
  });

  return Revenue;
};
