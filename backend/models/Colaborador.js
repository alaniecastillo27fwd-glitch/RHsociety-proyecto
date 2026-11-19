import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const Colaborador = sequelize.define('Colaborador', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  codigo_empleado: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  nombre: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  correo: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  departamento: {
    type: DataTypes.ENUM(
      'Tecnología',
      'Producto',
      'Operaciones',
      'Finanzas',
      'Ventas',
      'Recursos Humanos'
    ),
    allowNull: false,
  },
  puesto: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  salario_mensual: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  fecha_ingreso: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  proxima_evaluacion: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Fecha límite de la siguiente evaluación semestral de desempeño',
  },
  fecha_proximo_pago: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Fecha del próximo depósito quincenal de nómina',
  },
  jefe_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  rol: {
    type: DataTypes.ENUM('colaborador', 'rrhh'),
    allowNull: false,
    defaultValue: 'colaborador',
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo'),
    allowNull: false,
    defaultValue: 'activo',
  },
}, {
  tableName: 'colaboradores',
  timestamps: true,
});

export default Colaborador;
