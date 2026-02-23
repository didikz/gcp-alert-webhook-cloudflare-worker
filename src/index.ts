import { Router, json } from 'itty-router';
import { formatGcpAlert, GcpAlert } from './format';
import { sendTelegramMessage } from './telegram';

export interface Env {
	TELEGRAM_BOT_TOKEN: string;
	TELEGRAM_CHAT_ID: string;
	TIMEZONE?: string;
}

const router = Router();

router.get('/', () => {
  return json({ status: 'healthy' });
});

router.post('/webhook', async (request: Request, env: Env) => {
  console.log('Received webhook request.');
  try {
    const alert = await request.json<GcpAlert>();
    const message = formatGcpAlert(alert, env.TIMEZONE);
    console.log('Sending message to Telegram...');
    await sendTelegramMessage(message, env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);
    return json({ success: true });
  } catch (error) {
    console.error(error);
    const e = error as Error;
    return json({ success: false, error: e.message }, { status: 500 });
  }
});

router.all('*', () => new Response('Not Found.', { status: 404 }));

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => router.handle(request, env, ctx),
};

