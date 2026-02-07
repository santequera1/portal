import { env } from './config/env';
import app from './app';

app.listen(env.PORT, () => {
  console.log(`Minerva API corriendo en http://localhost:${env.PORT}`);
  console.log(`Health check: http://localhost:${env.PORT}/api/health`);
});
