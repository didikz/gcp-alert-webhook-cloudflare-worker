# Project Overview

This project is a Cloudflare Worker written in TypeScript that serves as a webhook receiver for Google Cloud alerts. Its primary function is to receive alert notifications from Google Cloud, format them into a human-readable message, and then send them to a specified Telegram chat.

## Key Technologies

-   **Cloudflare Workers**: The serverless platform used to run the service.
-   **TypeScript**: The language used to write the worker.
-   **itty-router**: A lightweight and fast router for Cloudflare Workers.
-   **vitest**: A testing framework for unit and integration testing.
-   **msw (Mock Service Worker)**: Used to mock the Telegram API during testing.

## Architecture

The worker is structured into three main modules:

1.  `src/index.ts`: The main entry point of the worker. It uses `itty-router` to handle incoming POST requests to the `/webhook` endpoint, parses the request body, and orchestrates the formatting and sending of the alert.
2.  `src/format.ts`: This module is responsible for formatting the raw JSON payload from a Google Cloud alert into a Markdown-formatted message suitable for Telegram.
3.  `src/telegram.ts`: This module contains the logic for sending the formatted message to the Telegram Bot API.

# Building and Running

## Prerequisites

-   Node.js and npm
-   A Cloudflare account
-   A Telegram bot token and chat ID

## Installation

1.  Clone the repository.
2.  Install the dependencies:

    ```bash
    npm install
    ```

## Running Locally

To run the worker locally for development, use the following command:

```bash
npm run dev
```

This will start a local server that you can use to test the worker.

## Testing

To run the test suite, use the following command:

```bash
npm test
```

The tests use `vitest` to run unit and integration tests and `msw` to mock the Telegram API, allowing you to test the worker's logic without sending actual messages to Telegram.

## Deployment

To deploy the worker to your Cloudflare account, use the following command:

```bash
npm run deploy
```

Before deploying, make sure you have set your `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` as secrets.

# Development Conventions

## Code Style

The project uses TypeScript and follows standard TypeScript and Cloudflare Worker conventions.

## Testing

All new features and bug fixes should be accompanied by tests. The tests are located in the `test` directory and should be written using `vitest`.

## Environment Variables

The worker uses the following environment variables. For production, they should be set as secrets. For local development, they should be in a `.dev.vars` file:

-   `TELEGRAM_BOT_TOKEN`: Your Telegram bot token.
-   `TELEGRAM_CHAT_ID`: The ID of the Telegram chat where you want to send the alerts.
