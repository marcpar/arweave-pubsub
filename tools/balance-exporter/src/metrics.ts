import koa from 'koa';
import prom from 'prom-client';
import * as nearAPI from 'near-api-js';


function ExposeMetrics(addresses: string[], network: string): koa.Middleware {
    let registry = new prom.Registry();
    registry.setDefaultLabels({
        network: network
    });
    
    nearAPI.connect({
        networkId: network,
        nodeUrl: `https://rpc.${network}.near.org/`
    }).then(async (near) => {
        let gauge = new prom.Gauge({
            help: 'account balance',
            name: 'balance',
            registers: [registry],
            labelNames: ['type', 'address'],
            collect: async () => {
                addresses.forEach(async (address) => {
                    let account = await near.account(address);
                    let balance = await account.getAccountBalance();
                    gauge.set({
                        type: 'available',
                        address: address
                    }, parseFloat(nearAPI.utils.format.formatNearAmount(balance.available)));
                    gauge.set({
                        type: 'staked',
                        address: address
                    }, parseFloat(nearAPI.utils.format.formatNearAmount(balance.staked)));
                    gauge.set({
                        type: 'state_staked',
                        address: address
                    }, parseFloat(nearAPI.utils.format.formatNearAmount(balance.stateStaked)));
                    gauge.set({
                        type: 'total',
                        address: address
                    }, parseFloat(nearAPI.utils.format.formatNearAmount(balance.total)))
                })
            }
        });
    })

    registry.resetMetrics();

    return (async (ctx: koa.Context, _next: koa.Next) => {
        ctx.body = await registry.metrics();
    })
}




export {
    ExposeMetrics
}