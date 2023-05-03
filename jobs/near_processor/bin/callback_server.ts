import { createServer, } from "http";
import { Logger } from "lib/dist/util/logger.js";


createServer((req, res) => {
    req.on('data', (data) => {
        Logger().info(data)
    });

    res.write("200")
    res.end();
}).listen(8080);