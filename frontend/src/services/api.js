import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor de Request: Adjuntar JWT en encabezado Authorization
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rhsociety_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Response: Manejo de errores globales y sesión expirada (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('[API Auth] Sesión expirada o no autorizada (401). Limpiando credenciales locales...');
      localStorage.removeItem('rhsociety_token');
      localStorage.removeItem('rhsociety_user');
      // Si no estamos en la pantalla de login, redirigir
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ==========================================
// 1. AUTENTICACIÓN Y PERFIL
// ==========================================

export async function loginRequest(correo, password) {
  const response = await api.post('/auth/login', { correo, password });
  return response.data;
}

export async function getProfileRequest() {
  const response = await api.get('/auth/me');
  return response.data;
}

// ==========================================
// 2. CHAT CONVERSACIONAL Y MULTIAGENTE
// ==========================================

export async function askChatRequest(pregunta, opciones = {}) {
  const response = await api.post('/chat/ask', {
    mensaje: pregunta,
    pregunta,
    ...opciones,
  });
  return response.data;
}

export async function getChatHistoryRequest() {
  const response = await api.get('/chat/history');
  return response.data;
}

// ==========================================
// 3. DASHBOARD Y ANALÍTICA DE RRHH
// ==========================================

export async function getDashboardReportRequest(fecha) {
  const response = await api.get('/dashboard/report', {
    params: fecha ? { fecha } : {},
  });
  return response.data;
}

export async function getReportsHistoryRequest() {
  const response = await api.get('/dashboard/reports');
  return response.data;
}

export async function generateReportNowRequest(fecha) {
  const response = await api.post('/dashboard/generate-report', { fecha });
  return response.data;
}

export async function getPendingRequestsRequest() {
  const response = await api.get('/dashboard/requests/pending');
  return response.data;
}

export async function updateRequestStatusRequest(id, estado, comentario = '') {
  try {
    const response = await api.patch(`/dashboard/requests/${id}`, {
      estado,
      comentario,
    });
    return response.data;
  } catch (patchErr) {
    try {
      const response = await api.put(`/dashboard/requests/${id}`, {
        estado,
        comentario,
      });
      return response.data;
    } catch (putErr) {
      const response = await api.post(`/dashboard/requests/${id}`, {
        estado,
        comentario,
      });
      return response.data;
    }
  }
}

export async function getTicketsRequest() {
  const response = await api.get('/dashboard/tickets');
  return response.data;
}

export async function resolveTicketRequest(id, respuesta_rrhh) {
  try {
    const response = await api.patch(`/dashboard/tickets/${id}`, {
      respuesta_rrhh,
    });
    return response.data;
  } catch (patchErr) {
    try {
      const response = await api.put(`/dashboard/tickets/${id}`, {
        respuesta_rrhh,
      });
      return response.data;
    } catch (putErr) {
      const response = await api.post(`/dashboard/tickets/${id}`, {
        respuesta_rrhh,
      });
      return response.data;
    }
  }
}

// ==========================================
// 4. INGESTA Y SINCRONIZACIÓN DE GOOGLE DRIVE
// ==========================================

export async function syncDriveRequest() {
  const response = await api.post('/ingest/sync');
  return response.data;
}

export default {
  api,
  loginRequest,
  getProfileRequest,
  askChatRequest,
  getChatHistoryRequest,
  getDashboardReportRequest,
  getReportsHistoryRequest,
  generateReportNowRequest,
  updateRequestStatusRequest,
  getTicketsRequest,
  resolveTicketRequest,
  syncDriveRequest,
};
