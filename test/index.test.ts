import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import worker, { Env } from '../src/index';
import { GcpAlert } from '../src/format';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
beforeEach(() => server.resetHandlers());

const mockAlert: GcpAlert = {
  version: '1.2',
  incident: {
    incident_id: '12345',
    renotify: true,
    scoping_project_id: 'test-project',
    scoping_project_number: 123456789,
    url: 'http://example.com/incident',
    severity: 'no severity',
    started_at: 1678886400,
    ended_at: null,
    state: 'OPEN',
    resource_id: '123',
    resource_name: 'my-function',
    resource_display_name: 'my-function-display',
    resource_type_display_name: 'Cloud Function',
    resource: {
      type: 'cloud_function',
      labels: {
        function_name: 'my-function',
      },
    },
    metric: {
      type: 'cloudfunctions.googleapis.com/function/execution_count',
      displayName: 'Execution count',
      labels: {},
    },
    metadata: {
      system_labels: { "labelkey": "labelvalue" },
      "user_labels": { "labelkey": "labelvalue" }
    },
    policy_name: 'Function Error Rate',
    policy_user_labels: {
      "user-label-1": "important label"
    },
    condition_name: 'High error rate',
    threshold_value: '10',
    observed_value: '15',
    summary: 'Error rate for my-function is high',
    documentation: {
      content: 'More details here',
      mime_type: 'text/markdown',
      subject: 'ALERT - No severity',
      links: [
        {
          displayName: 'Playbook',
          url: 'https://myownpersonaldomain.com/playbook?name=${resource.name}'
        }
      ]
    },
    notification_channel_ids: [],
  },
};


describe('GCP Webhook to Telegram', () => {

  it('should return a healthy status for the root URL', async () => {
    const request = new Request('http://localhost/', {
      method: 'GET',
    });

    const env: Env = {
      TELEGRAM_BOT_TOKEN: 'your-telegram-bot-token',
      TELEGRAM_CHAT_ID: 'your-telegram-chat-id',
    };

    const response = await worker.fetch(request, env, {} as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ status: 'healthy' });
  });

  it('should receive a GCP alert and send a message to Telegram', async () => {
    const consoleSpy = vi.spyOn(console, 'log');

    server.use(
      http.post('https://api.telegram.org/botyour-telegram-bot-token/sendMessage', async ({request}) => {
        const body = await request.json();
        expect(body.chat_id).toBe('your-telegram-chat-id');
        expect(body.text).toContain('🚨 *GCP Alert: Function Error Rate* 🚨');
        expect(body.text).toContain('*Summary:* Error rate for my\\-function is high');
        expect(body.text).toContain('- *Resource:* `my\\-function`');
        expect(body.text).toContain('- *Project:* `test\\-project`');
        expect(body.text).toContain('*Started:* 3/15/2023, 1:20:00 PM');
        return HttpResponse.json({ ok: true });
      })
    );

    const request = new Request('http://localhost/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockAlert),
    });

    const env: Env = {
      TELEGRAM_BOT_TOKEN: 'your-telegram-bot-token',
      TELEGRAM_CHAT_ID: 'your-telegram-chat-id',
    };

    const response = await worker.fetch(request, env, {} as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith('Received webhook request.');
    expect(consoleSpy).toHaveBeenCalledWith('Sending message to Telegram...');

    consoleSpy.mockRestore();
  });

  it('should format the date using the specified timezone', async () => {
    server.use(
      http.post('https://api.telegram.org/botyour-telegram-bot-token/sendMessage', async ({request}) => {
        const body = await request.json();
        expect(body.text).toContain('*Started:* 3/15/2023, 8:20:00 PM');
        return HttpResponse.json({ ok: true });
      })
    );

    const request = new Request('http://localhost/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockAlert),
    });

    const env: Env = {
      TELEGRAM_BOT_TOKEN: 'your-telegram-bot-token',
      TELEGRAM_CHAT_ID: 'your-telegram-chat-id',
      TIMEZONE: 'Asia/Jakarta',
    };

    const response = await worker.fetch(request, env, {} as any);
    expect(response.status).toBe(200);
  });

  it('should escape markdown characters in the alert summary', async () => {
    const mockAlertWithMarkdown = {
      ...mockAlert,
      incident: {
        ...mockAlert.incident,
        summary: 'Error rate for my-function is `high`_*.',
        resource_name: 'my-function-`with-special-chars`'
      },
    };

    server.use(
      http.post('https://api.telegram.org/botyour-telegram-bot-token/sendMessage', async ({request}) => {
        const body = await request.json();
        expect(body.text).toContain('*Summary:* Error rate for my\\-function is \\`high\\`\\_\\*\\.');
        expect(body.text).toContain('*Resource:* `my\\-function\\-\\`with\\-special\\-chars\\``');
        return HttpResponse.json({ ok: true });
      })
    );

    const request = new Request('http://localhost/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockAlertWithMarkdown),
    });

    const env: Env = {
      TELEGRAM_BOT_TOKEN: 'your-telegram-bot-token',
      TELEGRAM_CHAT_ID: 'your-telegram-chat-id',
    };

    const response = await worker.fetch(request, env, {} as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('should send a resolved message when the alert is closed', async () => {
    const closedAlert = {
      ...mockAlert,
      incident: {
        ...mockAlert.incident,
        state: 'CLOSED',
        ended_at: 1678890000,
      },
    };

    server.use(
      http.post('https://api.telegram.org/botyour-telegram-bot-token/sendMessage', async ({request}) => {
        const body = await request.json();
        expect(body.chat_id).toBe('your-telegram-chat-id');
        expect(body.text).toContain('✅ *GCP Alert Resolved: Function Error Rate* ✅');
        expect(body.text).toContain('*Summary:* Error rate for my\\-function is high');
        expect(body.text).toContain('- *State:* ✅ RESOLVED');
        expect(body.text).not.toContain('- *Condition:*');
        expect(body.text).toContain('- *Ended:*');
        return HttpResponse.json({ ok: true });
      })
    );

    const request = new Request('http://localhost/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(closedAlert),
    });

    const env: Env = {
      TELEGRAM_BOT_TOKEN: 'your-telegram-bot-token',
      TELEGRAM_CHAT_ID: 'your-telegram-chat-id',
    };

    const response = await worker.fetch(request, env, {} as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('should handle alerts with missing properties gracefully', async () => {
    const sparseAlert = {
      version: '1.2',
      incident: {
        incident_id: '67890',
        url: 'http://example.com/incident-sparse',
        started_at: 1678886400,
        state: 'OPEN',
      },
    } as GcpAlert;

    server.use(
      http.post('https://api.telegram.org/botyour-telegram-bot-token/sendMessage', async ({request}) => {
        const body = await request.json();
        expect(body.text).toContain('*GCP Alert: N/A*');
        expect(body.text).toContain('*Summary:* N/A');
        expect(body.text).toContain('- *Condition:* N/A');
        expect(body.text).toContain('- *Resource:* `N/A`');
        expect(body.text).toContain('- *Project:* `N/A`');
        return HttpResponse.json({ ok: true });
      })
    );

    const request = new Request('http://localhost/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sparseAlert),
    });

    const env: Env = {
      TELEGRAM_BOT_TOKEN: 'your-telegram-bot-token',
      TELEGRAM_CHAT_ID: 'your-telegram-chat-id',
    };

    const response = await worker.fetch(request, env, {} as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('should use a custom template when provided', async () => {
    const customTemplate = 'Alert: {{summary}} for {{resource_name}}';
    server.use(
      http.post('https://api.telegram.org/botyour-telegram-bot-token/sendMessage', async ({request}) => {
        const body = await request.json();
        expect(body.text).toBe('Alert: Error rate for my\\-function is high for my\\-function');
        return HttpResponse.json({ ok: true });
      })
    );

    const request = new Request('http://localhost/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockAlert),
    });

    const env: Env = {
      TELEGRAM_BOT_TOKEN: 'your-telegram-bot-token',
      TELEGRAM_CHAT_ID: 'your-telegram-chat-id',
      MESSAGE_TEMPLATE_OPEN: customTemplate,
    };

    const response = await worker.fetch(request, env, {} as any);
    expect(response.status).toBe(200);
  });
});

describe('Webhook Authentication', () => {
  const authEnv: Env = {
    TELEGRAM_BOT_TOKEN: 'your-telegram-bot-token',
    TELEGRAM_CHAT_ID: 'your-telegram-chat-id',
    AUTH_USERNAME: 'testuser',
    AUTH_PASSWORD: 'testpassword',
  };

  it('should return 401 if no credentials are provided', async () => {
    const request = new Request('http://localhost/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockAlert),
    });

    const response = await worker.fetch(request, authEnv, {} as any);
    expect(response.status).toBe(401);
    expect(response.headers.get('WWW-Authenticate')).toBe('Basic realm="gcp-webhook-alert-service"');
  });

  it('should return 401 if credentials are malformed', async () => {
      const request = new Request('http://localhost/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic malformed'
        },
        body: JSON.stringify(mockAlert),
      });

      const response = await worker.fetch(request, authEnv, {} as any);
      expect(response.status).toBe(401);
      const body = await response.text();
      expect(body).toBe('Unauthorized: Malformed credentials');
    });

  it('should return 401 if incorrect credentials are provided', async () => {
    const request = new Request('http://localhost/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa('wrong:user')}`,
      },
      body: JSON.stringify(mockAlert),
    });

    const response = await worker.fetch(request, authEnv, {} as any);
    expect(response.status).toBe(401);
  });

  it('should succeed if correct credentials are provided', async () => {
    server.use(
      http.post('https://api.telegram.org/botyour-telegram-bot-token/sendMessage', async () => {
        return HttpResponse.json({ ok: true });
      })
    );

    const request = new Request('http://localhost/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa('testuser:testpassword')}`,
      },
      body: JSON.stringify(mockAlert),
    });

    const response = await worker.fetch(request, authEnv, {} as any);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });
});

