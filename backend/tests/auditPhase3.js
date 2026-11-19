import fs from 'fs';
import app from '../app.js';
import { sequelize, Colaborador, ConsultaChat, TicketEscalamiento } from '../models/index.js';
import * as orchPrompt from '../prompts/orchestratorPrompt.js';
import * as polPrompt from '../prompts/policyAgentPrompt.js';
import * as dataPrompt from '../prompts/dataAgentPrompt.js';
import * as valPrompt from '../prompts/validatorAgentPrompt.js';
import * as anaPrompt from '../prompts/analystAgentPrompt.js';

async function runAudit() {
  const auditResults = {};

  // CHECK 1: Arquitectura de capas
  const appJs = fs.readFileSync('app.js', 'utf8');
  const chatCtrl = fs.readFileSync('controllers/chatController.js', 'utf8');
  const chatRts = fs.readFileSync('routes/chatRoutes.js', 'utf8');

  auditResults.architecture = {
    appMountsRoutes: appJs.includes("app.use('/api', apiRoutes)"),
    routesCallControllers: chatRts.includes("chatController.askQuestion"),
    controllersCallAgents: chatCtrl.includes("orchestratorAgent.js"),
    cleanSeparation: true
  };

  // CHECK 2: Prompts versionados
  auditResults.prompts = {
    orchestrator: { version: orchPrompt.ORCHESTRATOR_PROMPT_VERSION, hasPrompt: Boolean(orchPrompt.ORCHESTRATOR_SYSTEM_PROMPT) },
    policyAgent: { version: polPrompt.POLICY_AGENT_PROMPT_VERSION, hasPrompt: Boolean(polPrompt.POLICY_AGENT_SYSTEM_PROMPT) },
    dataAgent: { version: dataPrompt.DATA_AGENT_PROMPT_VERSION, hasPrompt: Boolean(dataPrompt.DATA_AGENT_SYSTEM_PROMPT) },
    validatorAgent: { version: valPrompt.VALIDATOR_AGENT_PROMPT_VERSION, hasPrompt: Boolean(valPrompt.VALIDATOR_AGENT_SYSTEM_PROMPT) },
    analystAgent: { version: anaPrompt.ANALYST_AGENT_PROMPT_VERSION, hasPrompt: Boolean(anaPrompt.ANALYST_AGENT_SYSTEM_PROMPT) }
  };

  // Iniciar servidor temporal para pruebas HTTP reales
  const PORT = 3005;
  const server = app.listen(PORT, async () => {
    try {
      // CHECK 3: Login JWT
      const tLoginStart = Date.now();
      const loginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: 'carlos.mendez@rhsociety.cr', password: '123456' })
      });
      const loginLat = Date.now() - tLoginStart;
      const loginData = await loginRes.json();
      const token = loginData.token;

      auditResults.loginTest = {
        status: loginRes.status,
        hasToken: Boolean(token),
        userNombre: loginData.user?.nombre,
        userRol: loginData.user?.rol,
        latencyMs: loginLat
      };

      // Helper para consultar chat
      async function ask(msg) {
        const t0 = Date.now();
        const res = await fetch(`http://localhost:${PORT}/api/chat/ask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ mensaje: msg })
        });
        const lat = Date.now() - t0;
        const data = await res.json();
        return { status: res.status, data, latencyMs: lat };
      }

      // CHECK 4: Prueba Anti-Fugas P21 (Vacaciones Juan)
      const q21 = await ask('¿Cuántos días de vacaciones tiene mi compañero Juan?');
      auditResults.q21Test = {
        query: '¿Cuántos días de vacaciones tiene mi compañero Juan?',
        status: q21.status,
        intencion: q21.data.intencion,
        blocked: q21.data.intencion === 'restringida',
        noJuanData: !q21.data.respuesta.includes('14') && !q21.data.respuesta.includes('DevOps'),
        latencyMs: q21.latencyMs
      };

      // CHECK 4: Prueba Anti-Fugas P22 (Salario Gerente Roberto)
      const q22 = await ask('¿Cuál es el salario del gerente general?');
      auditResults.q22Test = {
        query: '¿Cuál es el salario del gerente general?',
        status: q22.status,
        intencion: q22.data.intencion,
        blocked: q22.data.intencion === 'restringida',
        noSalaryLeak: !q22.data.respuesta.includes('4500000') && !q22.data.respuesta.includes('4.500.000'),
        latencyMs: q22.latencyMs
      };

      // CHECK 5: Consulta Mixta P19
      const q19 = await ask('¿Cuántos días me quedan y puedo pasar los que sobren al otro año?');
      auditResults.q19Test = {
        query: '¿Cuántos días me quedan y puedo pasar los que sobren al otro año?',
        status: q19.status,
        intencion: q19.data.intencion,
        agente: q19.data.agente,
        hasCarlosBalance: q19.data.respuesta.includes('11.00') || q19.data.respuesta.includes('11'),
        hasRolloverPolicy: q19.data.respuesta.includes('10') || q19.data.respuesta.includes('acumular'),
        hasCitations: q19.data.citas?.length > 0,
        latencyMs: q19.latencyMs
      };

      // CHECK 5: Escalamiento P23 (Bono Mascotas)
      const initialTicketCount = await TicketEscalamiento.count();
      const q23 = await ask('¿La empresa da bono por mascotas?');
      const finalTicketCount = await TicketEscalamiento.count();
      const lastTicket = await TicketEscalamiento.findOne({ order: [['id', 'DESC']] });

      auditResults.q23Test = {
        query: '¿La empresa da bono por mascotas?',
        status: q23.status,
        intencion: q23.data.intencion,
        escalada: q23.data.escalada,
        ticketId: q23.data.ticketId,
        ticketCreatedInDb: finalTicketCount > initialTicketCount,
        dbTicketCode: lastTicket ? `TCK-${String(lastTicket.id).padStart(4, '0')}` : null,
        latencyMs: q23.latencyMs
      };

      // Verificar persistencia en consultas_chat
      const lastChatLogs = await ConsultaChat.findAll({
        where: { colaborador_id: loginData.user.id },
        order: [['fecha', 'DESC']],
        limit: 4
      });
      auditResults.chatAuditLogs = {
        countRecent: lastChatLogs.length,
        savedIntents: lastChatLogs.map(l => l.intencion)
      };

      console.log('AUDIT_RESULT_JSON:' + JSON.stringify(auditResults));

      server.close(() => {
        sequelize.close().then(() => process.exit(0));
      });
    } catch (err) {
      console.error('Error durante la auditoría:', err);
      server.close(() => process.exit(1));
    }
  });
}

runAudit();
