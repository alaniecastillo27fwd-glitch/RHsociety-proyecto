import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const SaldoVacaciones = sequelize.define('SaldoVacaciones', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  colaborador_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  periodo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Periodo anual computable, ej. 2025-2026',
  },
  dias_asignados: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 15.00,
    comment: 'RHsociety otorga 15 días hábiles anuales base',
  },
  dias_tomados: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  dias_disponibles: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 15.00,
  },
}, {
  tableName: 'saldos_vacaciones',
  timestamps: true,
});

export default SaldoVacaciones;
