const axios = require('axios')

const endpoint = 'https://mango-stats.herokuapp.com?mangoGroup=BTC_ETH_SOL_SRM_USDC'

// Very inefficient
function findClosestToDate(values, date) {
    let min = values[0];
    for (const val of values) {
        const valDate = new Date(val.time).getTime()
        const minDate = new Date(min.time).getTime()
        if (Math.abs(valDate - date) < Math.abs(minDate - date)) {
            min = val
        }
    }
    if(Math.abs(new Date(min.time).getTime()-date) > 24*3600*1000){
        return {
            totalDeposits: 0,
            totalBorrows: 0
        }
    }
    return min
}

const coingeckoIds = {
    'ETH': 'ethereum',
    'BTC': 'bitcoin',
    'SOL': 'solana',
    'SRM': 'serum',
    'USDC': 'usd-coin'
}


async function tvl(timestamp) {
    const balances = {};
    const stats = await axios.get(endpoint)
    const date = new Date(timestamp * 1000).getTime()
    Object.keys(coingeckoIds).map(asset => {
        const assetDeposits = stats.data.filter(stat => stat.symbol === asset)
        const closestVal = findClosestToDate(assetDeposits, date)
        balances[coingeckoIds[asset]] = closestVal.totalDeposits - closestVal.totalBorrows
    })
    return balances
}

async function test() {
    console.log(await tvl(Date.now()/1000));
}
// test();

module.exports = {
    solana: {
        tvl,
    },
    tvl
}
