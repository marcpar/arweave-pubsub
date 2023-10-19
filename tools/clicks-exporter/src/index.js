const net = require('net');
const koa = require('koa');
const axios = require('axios');

const ACTIVITY_REPORT_URL = process.env.ACTIVITY_REPORT_URL ?? 'https://testminter.azurewebsites.net/claim-activity';
const GRAPHITE_HOST = process.env.GRAPHITE_HOST ?? 'localhost';
const GRAPHITE_PORT = process.env.GRAPHITE_PORT ?? 2003;
const SERVER_PORT = process.env.SERVER_PORT ?? 3000;

let app = new koa();

app.use(async (ctx) => {
    let url = ctx.request.url.substring(1);
    let res = await axios.get(`${ACTIVITY_REPORT_URL}/${url}`);
    if (res.status === 200) {
        let urlSplit = url.split('/');
        await writeMetrics(GRAPHITE_HOST, GRAPHITE_PORT, `claim-activity.count.${urlSplit[0]}.${urlSplit[1]}`, 1)
        ctx.res.statusCode = 200;
    }

});

app.listen(SERVER_PORT);

async function writeMetrics(address, port, metric, value) {
    let client = new net.Socket();
    return new Promise((fRes) => {
        client.connect(port, address, function () {
            let res = client.write(`${metric} ${value} ${Math.floor(new Date().getTime() / 1000)}\n`)
            client.destroy();
            fRes();
        })
    })
}