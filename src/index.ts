import { Router, json } from 'itty-router';
import { formatGcpAlert, GcpAlert } from './format';
import { sendTelegramMessage } from './telegram';

export interface Env {
	TELEGRAM_BOT_TOKEN: string;
	TELEGRAM_CHAT_ID: string;
	TIMEZONE?: string;
	AUTH_USERNAME?: string;
	AUTH_PASSWORD?: string;
	MESSAGE_TEMPLATE_OPEN?: string;
	MESSAGE_TEMPLATE_RESOLVED?: string;
}

const router = Router();

const withAuth = (request: Request, env: Env) => {
	if (!env.AUTH_USERNAME || !env.AUTH_PASSWORD) {
		return;
	}

	const authHeader = request.headers.get('Authorization');
	if (!authHeader || !authHeader.startsWith('Basic ')) {
		return new Response('Unauthorized', {
			status: 401,
			headers: { 'WWW-Authenticate': 'Basic realm="gcp-webhook-alert-service"' },
		});
	}

	try {
		const base64Credentials = authHeader.substring(6);
		const credentials = atob(base64Credentials);
		const [username, password] = credentials.split(':');

		if (username !== env.AUTH_USERNAME || password !== env.AUTH_PASSWORD) {
			return new Response('Unauthorized: Invalid credentials', { status: 401 });
		}
	} catch (err) {
		return new Response('Unauthorized: Malformed credentials', { status: 401 });
	}
};

router.get('/', () => {
  return json({ status: 'healthy' });
});

router.post('/webhook', withAuth, async (request: Request, env: Env) => {
  console.log('Received webhook request.');
  try {
    const alert = await request.json<GcpAlert>();
    const message = formatGcpAlert(
      alert,
      env.TIMEZONE,
      env.MESSAGE_TEMPLATE_OPEN,
      env.MESSAGE_TEMPLATE_RESOLVED
    );
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

