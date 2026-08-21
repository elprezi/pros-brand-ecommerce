export interface HealthResponse {
  status: 'ok' | 'error';
  database: 'connected' | 'disconnected';
}

export async function getHealthStatus(dbConnected: boolean = true): Promise<{ status: number; body: HealthResponse }> {
  if (!dbConnected) {
    return {
      status: 503,
      body: {
        status: 'error',
        database: 'disconnected',
      },
    };
  }

  return {
    status: 200,
    body: {
      status: 'ok',
      database: 'connected',
    },
  };
}
