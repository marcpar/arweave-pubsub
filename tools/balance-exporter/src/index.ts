import yargs from 'yargs';
import koa from 'koa';
import { ExposeMetrics } from './metrics';

let app = new koa();
(async () => {
    let argv = await yargs.array('account')
        .string('account')
        .demandOption('account')
        .default('network', 'mainnet')
        .string('network')
        .number('port')
        .default('port', 8080)
        .parse();

    app.use(ExposeMetrics(argv.account, argv.network));

    app.listen(argv.port, undefined, undefined, () => {
        console.log(`listening on port ${argv.port}`)
    });
})();