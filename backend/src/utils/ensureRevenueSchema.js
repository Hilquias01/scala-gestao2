const ensureRevenueSchema = async (sequelize, Sequelize) => {
  const queryInterface = sequelize.getQueryInterface();
  const tableName = 'revenues';

  let table;
  try {
    table = await queryInterface.describeTable(tableName);
  } catch (error) {
    return;
  }

  const addColumnIfMissing = async (columnName, spec) => {
    if (table[columnName]) return;
    await queryInterface.addColumn(tableName, columnName, spec);
  };

  await addColumnIfMissing('kind', {
    type: Sequelize.ENUM('retirada', 'entrega'),
    allowNull: true,
  });

  await addColumnIfMissing('pickup_location', {
    type: Sequelize.ENUM('areial', 'deposito'),
    allowNull: true,
  });
};

module.exports = ensureRevenueSchema;

