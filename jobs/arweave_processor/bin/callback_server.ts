import { createServer, } from "http";
import { util } from 'lib';

createServer((req, res) => {
    req.on('data', (data) => {
        util.Logger().info(data)
    });

    res.write("200")
    res.end();
}).listen(8080);