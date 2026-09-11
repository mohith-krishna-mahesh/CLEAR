import { app } from "./app";
import { env } from "./config/env";

const port = parseInt(env.PORT, 10) || 3001;

app.listen(port, () => {
  console.log(`[registry-hub] Service listening on port ${port}`);
});
