const WebSocket = require('ws');

const ws = new WebSocket('wss://ws.backpack.exchange');

ws.on('open', () => {
  console.log('Connected to Backpack WS');
  
  // Let's subscribe to ticker and depth
  const subscribeMsg = {
    method: 'SUBSCRIBE',
    params: ['ticker.SOL_USDC', 'depth.SOL_USDC']
  };
  ws.send(JSON.stringify(subscribeMsg));
});

let msgCount = 0;
ws.on('message', (data) => {
  console.log('Received message:', JSON.parse(data.toString()));
  msgCount++;
  if (msgCount >= 5) {
    ws.close();
    process.exit(0);
  }
});

ws.on('error', (err) => {
  console.error('WS Error:', err);
});
