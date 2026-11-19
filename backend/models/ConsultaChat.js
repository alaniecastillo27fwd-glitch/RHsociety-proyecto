import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const ConsultaChat = sequelize.define('ConsultaChat', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  colaborador_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  pregunta: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  intencion: {
    type: DataTypes.STRING(80),
    allowNull: true,
  },
  agente: {
    type: DataTypes.STRING(80),
    allowNull: true,
  },
  documentos_citados: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  resuelta: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  escalada: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  latencia_ms: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'consultas_chat',
  timestamps: true,
});

export default ConsultaChat;
