# GCP Webhook Alert Service

This project implements a Cloudflare Worker designed to receive alert webhooks from Google Cloud and forward them to a specified Telegram chat. It acts as a bridge, transforming the technical Google Cloud alert JSON into a human-readable message before sending it to Telegram.

## Features

-   Receives Google Cloud Monitoring alerts via webhook.
-   Formats alert payloads into a clear, Markdown-formatted message.
-   Sends formatted messages to a Telegram chat using the Bot API.
-   Leverages Cloudflare Workers for serverless, scalable, and cost-effective execution.

## Technologies Used

-   **Cloudflare Workers**: Serverless platform
-   **TypeScript**: Primary development language
-   **itty-router**: Lightweight routing for Workers
-   **Vitest**: Testing framework
-   **MSW (Mock Service Worker)**: API mocking for tests

## Setup Guide

To get this project up and running, follow these steps:

### Prerequisites

Ensure you have the following installed:

-   **Node.js** (LTS version recommended)
-   **npm** (Node Package Manager, usually comes with Node.js)
-   A **Cloudflare account**
-   A **Telegram Bot Token** (obtain from BotFather on Telegram)
-   A **Telegram Chat ID** (the ID of the chat where you want to receive alerts)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/gcp-webhook-alert-service.git
    cd gcp-webhook-alert-service
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

### Configuration

Before deployment or local development, you need to configure your Telegram credentials.

1.  **Open `wrangler.toml`**:

    ```toml
    name = "gcp-webhook-alert-service"
    main = "src/index.ts"
    compatibility_date = "2024-02-28" # Or your desired compatibility date

    [vars]
    TELEGRAM_BOT_TOKEN = "your-telegram-bot-token" # Replace with your actual bot token
    TELEGRAM_CHAT_ID = "your-telegram-chat-id"     # Replace with your actual chat ID
    ```

2.  **Replace `your-telegram-bot-token`** with the HTTP API token you received from BotFather.
3.  **Replace `your-telegram-chat-id`** with the ID of the Telegram chat where the bot should send messages. You can get your chat ID by forwarding a message from the target chat to a bot like `@RawDataBot` or `@getidsbot`.

## Local Development

You can test the worker locally before deploying it to Cloudflare.

1.  **Start the local development server:**

    ```bash
    npm run dev
    ```

    This will usually expose the worker on `http://localhost:8787`.

2.  **Send a test webhook:**
    You can use `curl` or a tool like Postman to send a sample Google Cloud alert JSON payload to `http://localhost:8787/webhook`. Ensure your local Telegram bot can receive messages.

### Running Tests

To run the automated tests for the project:

```bash
npm test
```

## Deployment

Once configured and tested locally, you can deploy your worker to Cloudflare.

1.  **Ensure you are logged into Cloudflare Workers** via Wrangler CLI. If not, run:

    ```bash
    npx wrangler login
    ```

2.  **Deploy the worker:**

    ```bash
    npm run deploy
    ```

    Wrangler will build and deploy your worker. It will provide you with the public URL for your worker (e.g., `https://gcp-webhook-alert-service.<YOUR_SUBDOMAIN>.workers.dev/`).

## Google Cloud Webhook Configuration

After deployment, you need to configure your Google Cloud Monitoring alert policies to send notifications to your new worker.

1.  In Google Cloud Console, navigate to **Monitoring** > **Alerting**.
2.  Edit an existing alert policy or create a new one.
3.  In the "Notification Channels" section, add a new channel.
4.  Select "Webhook" as the channel type.
5.  Set the **Endpoint URL** to the public URL of your deployed Cloudflare Worker, specifically appending `/webhook` (e.g., `https://gcp-webhook-alert-service.<YOUR_SUBDOMAIN>.workers.dev/webhook`).
6.  Save the notification channel and apply it to your alert policies.

Now, whenever a Google Cloud alert is triggered, it will send a webhook to your Cloudflare Worker, which will then forward a formatted message to your Telegram chat.
