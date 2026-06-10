const WebSocket = require('ws');

const ws = new WebSocket('wss://ws.backpack.exchange');

ws.on('open', () => {
  console.log('Connected to Backpack WS');
  
  const subscribeMsg = {
    method: 'SUBSCRIBE',
    params: ['kline.1m.SOL_USDC']
  };
  ws.send(JSON.stringify(subscribeMsg));
});

let msgCount = 0;
ws.on('message', (data) => {
  console.log('Received message:', JSON.stringify(JSON.parse(data.toString()), null, 2));
  msgCount++;
  if (msgCount >= 3) {
    ws.close();
    process.exit(0);
  }
});

ws.on('error', (err) => {
  console.error('WS Error:', err);
});
