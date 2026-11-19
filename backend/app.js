import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/index.js';

const app = express();

// Configuración de Middlewares globales
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Endpoint de verificación de salud de la API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'RHsociety API Core',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Montar todas las rutas de la API en el prefijo /api
app.use('/api', apiRoutes);

// Manejador de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// Manejador global de errores (500)
app.use((err, req, res, next) => {
  console.error('[API Server Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor.',
    detalles: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

export default app;
