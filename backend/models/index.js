import sequelize, { initDatabase } from '../config/database.js';
import Colaborador from './Colaborador.js';
import SaldoVacaciones from './SaldoVacaciones.js';
import Solicitud from './Solicitud.js';
import Incapacidad from './Incapacidad.js';
import MovimientoPersonal from './MovimientoPersonal.js';
import ConsultaChat from './ConsultaChat.js';
import ReporteDiario from './ReporteDiario.js';
import TicketEscalamiento from './TicketEscalamiento.js';

// ==========================================
// CONFIGURACIÓN DE ASOCIACIONES RELACIONALES
// ==========================================

// 1. Jerarquía Organizacional (Auto-referencia Colaborador -> Jefe)
Colaborador.belongsTo(Colaborador, {
  foreignKey: 'jefe_id',
  as: 'jefe_directo',
});
Colaborador.hasMany(Colaborador, {
  foreignKey: 'jefe_id',
  as: 'subordinados',
});

// 2. Colaborador <-> SaldoVacaciones (1:1)
Colaborador.hasOne(SaldoVacaciones, {
  foreignKey: 'colaborador_id',
  as: 'saldo_vacaciones',
  onDelete: 'CASCADE',
});
SaldoVacaciones.belongsTo(Colaborador, {
  foreignKey: 'colaborador_id',
  as: 'colaborador',
});

// 3. Colaborador <-> Solicitudes (1:N)
Colaborador.hasMany(Solicitud, {
  foreignKey: 'colaborador_id',
  as: 'solicitudes',
  onDelete: 'CASCADE',
});
Solicitud.belongsTo(Colaborador, {
  foreignKey: 'colaborador_id',
  as: 'colaborador',
});

// 4. Aprobador (Colaborador) <-> Solicitudes (1:N)
Colaborador.hasMany(Solicitud, {
  foreignKey: 'aprobador_id',
  as: 'solicitudes_a_cargo',
});
Solicitud.belongsTo(Colaborador, {
  foreignKey: 'aprobador_id',
  as: 'aprobador',
});

// 5. Colaborador <-> Incapacidades (1:N)
Colaborador.hasMany(Incapacidad, {
  foreignKey: 'colaborador_id',
  as: 'incapacidades',
  onDelete: 'CASCADE',
});
Incapacidad.belongsTo(Colaborador, {
  foreignKey: 'colaborador_id',
  as: 'colaborador',
});

// 6. Colaborador <-> Movimientos de Personal (1:N)
Colaborador.hasMany(MovimientoPersonal, {
  foreignKey: 'colaborador_id',
  as: 'movimientos',
  onDelete: 'CASCADE',
});
MovimientoPersonal.belongsTo(Colaborador, {
  foreignKey: 'colaborador_id',
  as: 'colaborador',
});

// 7. Colaborador <-> Consultas Chat (1:N)
Colaborador.hasMany(ConsultaChat, {
  foreignKey: 'colaborador_id',
  as: 'consultas_chat',
  onDelete: 'SET NULL',
});
ConsultaChat.belongsTo(Colaborador, {
  foreignKey: 'colaborador_id',
  as: 'colaborador',
});

// 8. Colaborador <-> Tickets de Escalamiento (1:N)
Colaborador.hasMany(TicketEscalamiento, {
  foreignKey: 'colaborador_id',
  as: 'tickets_escalamiento',
  onDelete: 'CASCADE',
});
TicketEscalamiento.belongsTo(Colaborador, {
  foreignKey: 'colaborador_id',
  as: 'colaborador',
});

// 9. ConsultaChat <-> TicketEscalamiento (1:1)
ConsultaChat.hasOne(TicketEscalamiento, {
  foreignKey: 'consulta_chat_id',
  as: 'ticket',
  onDelete: 'SET NULL',
});
TicketEscalamiento.belongsTo(ConsultaChat, {
  foreignKey: 'consulta_chat_id',
  as: 'consulta_origen',
});

/**
 * Sincroniza todos los modelos con la base de datos MySQL.
 * Crea la base de datos si no existe, autentica la conexión y ejecuta sync.
 */
export async function syncModels(options = { alter: true }) {
  try {
    await initDatabase();
    await sequelize.authenticate();
    console.log('[Database] Conexión autenticada exitosamente con MySQL.');
    await sequelize.sync(options);
    console.log('[Database] Todas las tablas han sido sincronizadas correctamente en MySQL.');
  } catch (error) {
    console.error('[Database Error] Error sincronizando modelos en MySQL:', error);
    throw error;
  }
}

export {
  sequelize,
  initDatabase,
  Colaborador,
  SaldoVacaciones,
  Solicitud,
  Incapacidad,
  MovimientoPersonal,
  ConsultaChat,
  ReporteDiario,
  TicketEscalamiento,
};

export default {
  sequelize,
  initDatabase,
  syncModels,
  Colaborador,
  SaldoVacaciones,
  Solicitud,
  Incapacidad,
  MovimientoPersonal,
  ConsultaChat,
  ReporteDiario,
  TicketEscalamiento,
};
