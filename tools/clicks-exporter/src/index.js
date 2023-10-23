const net = require('net');
const koa = require('koa');
const axios = require('axios');

const ACTIVITY_REPORT_URL = process.env.ACTIVITY_REPORT_URL ?? 'https://testminter.azurewebsites.net';
const GRAPHITE_HOST = process.env.GRAPHITE_HOST ?? 'localhost';
const GRAPHITE_PORT = process.env.GRAPHITE_PORT ?? 2003;
const SERVER_PORT = process.env.SERVER_PORT ?? 3000;
const METRICS_INTERVAL_SECONDS = process.env.METRICS_INTERVAL_SECONDS ?? 1;

let app = new koa();

let metricsQueue = {};
(async () => {
    while (true) {
        for (const timeStamp in metricsQueue) {
            //console.log(`${timeStamp}: ${JSON.stringify(metricsQueue[timeStamp])}`)
            let currentTimestamp = Math.floor(new Date().getTime() / 1000) - METRICS_INTERVAL_SECONDS;
            if (currentTimestamp > timeStamp) {
                let success = true;

                for (const metric in metricsQueue[timeStamp]) {
                    console.log(`WRITING ${timeStamp}: ${metric} ${metricsQueue[timeStamp][metric]}`)
                    success = success && await writeMetrics(GRAPHITE_HOST, GRAPHITE_PORT, metric, metricsQueue[timeStamp][metric]);
                }
                if (success) {
                    delete metricsQueue[timeStamp];
                }
            }
        }
        await Sleep(METRICS_INTERVAL_SECONDS * 1000);
    }
})();

app.use((ctx) => {
    let url = ctx.request.url.substring(1);

    ctx.res.statusCode = 200;
    (async () => {
        try {
            let res = await axios.get(`${ACTIVITY_REPORT_URL}/${url}`);
            if (res.status === 200) {
                queueMetrics(`podium-labs.${url.replace("/", ".")}.sum`);
            }
        } catch (_) {}
    })();
});

app.listen(SERVER_PORT);

function queueMetrics(metrics) {
    let currentTimestamp = Math.floor(new Date().getTime() / 1000);
    let metricTimeStamp = currentTimestamp - (currentTimestamp % METRICS_INTERVAL_SECONDS);

    if (metricsQueue[metricTimeStamp] === null || metricsQueue[metricTimeStamp] === undefined) {
        metricsQueue[metricTimeStamp] = {};
    }

    if (metricsQueue[metricTimeStamp][metrics] === null || metricsQueue[metricTimeStamp][metrics] === undefined) {
        metricsQueue[metricTimeStamp][metrics] = 1
        return;
    } else {
        metricsQueue[metricTimeStamp][metrics] += 1
    }
}

async function writeMetrics(address, port, metric, value) {
    let client = new net.Socket();
    return new Promise((fRes) => {
        client.connect(port, address, function () {
            let msg = `${metric} ${value} ${Math.floor(new Date().getTime() / 1000)}`
            let res = client.write(`${msg}\n`)
            client.destroy();
            fRes(res);
        })
    })
}

async function Sleep(ms) {
    return new Promise((fRes) => {
        setTimeout(fRes, ms)
    });
}