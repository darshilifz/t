
const express = require('express');
const cors = require('cors');
import { createServer } from "http";

 

const port =
    Number(process.env.PORT || 2567) +
    Number(process.env.NODE_APP_INSTANCE || 0);
const app = express();

app.use(cors());
app.use(express.json());


// Attach WebSocket Server on HTTP Server.
const server = createServer(app);
app.use('/api' ,require('./routes'));

server.listen(port);

// console.log(`Listening on ws://localhost:${port}`);

//app.get('/', (req,res) => res.send('Express + TypeScript Server'));
// app.listen(PORT, () => {
//   console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
// });