import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleApiRequest } from './src/server/apiHandler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Mount API Handler
app.use((req, res, next) => {
  handleApiRequest(req, res, next);
});

// Serve static production build files if available
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`U.R PERFUMES server is running on port ${PORT}`);
});
