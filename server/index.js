import { buildApp } from './app.js';
import { getPort } from './config.js';

const app = buildApp();
const port = getPort();
app.listen(port, () => console.log(`server listening on ${port}`));
