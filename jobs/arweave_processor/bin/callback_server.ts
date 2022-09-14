import { createServer, } from "http";
import { Logger } from "../src/lib/logger.js";

createServer((req, res) => {
    req.on('data', (data) => {
        Logger().info(data)
    });

    res.write("200")
    res.end();
}).listen(8080);