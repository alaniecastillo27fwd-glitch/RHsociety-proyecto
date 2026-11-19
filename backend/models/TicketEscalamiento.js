import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const TicketEscalamiento = sequelize.define('TicketEscalamiento', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  colaborador_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  consulta_chat_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  pregunta_original: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  motivo_escalamiento: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('abierto', 'en_revision', 'resuelto'),
    allowNull: false,
    defaultValue: 'abierto',
  },
  respuesta_rrhh: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'tickets_escalamiento',
  timestamps: true,
});

export default TicketEscalamiento;
