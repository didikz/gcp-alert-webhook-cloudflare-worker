import { Router, json, status } from 'itty-router';
import { formatGcpAlert } from './format';
import { sendTelegramMessage } from './telegram';

const router = Router();

router.get('/', () => {
  return json({ status: 'healthy' });
});

router.post('/webhook', async (request, env) => {
  console.log('Received webhook request.');
  try {
    const alert = await request.json();
    const message = formatGcpAlert(alert);
    console.log('Sending message to Telegram...');
    await sendTelegramMessage(message, env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);
    return json({ success: true });
  } catch (error) {
    console.error(error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
});

router.all('*', () => new Response('Not Found.', { status: 404 }));

export default {
  fetch: router.handle,
};
