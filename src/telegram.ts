export async function sendTelegramMessage(
    message: string,
    botToken: string,
    chatId: string
  ): Promise<void> {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to send Telegram message: ${errorData.description}`);
    }
  }
  