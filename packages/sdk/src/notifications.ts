/**
 * Slack Notifications for AI Council
 */

export interface SlackNotificationConfig {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

export interface NotificationMessage {
  text: string;
  phase?: string;
  consensus?: boolean;
  sessionId?: string;
  task?: string;
}

export class SlackNotifier {
  private config: SlackNotificationConfig;

  constructor(config: SlackNotificationConfig) {
    this.config = config;
  }

  async notify(message: NotificationMessage): Promise<void> {
    const payload = {
      channel: this.config.channel,
      username: this.config.username || 'AI Council',
      icon_emoji: this.config.iconEmoji || ':robot_face:',
      text: message.text,
      attachments: [
        {
          color: message.consensus ? '#36a64f' : '#ff9800',
          fields: [
            {
              title: 'Task',
              value: message.task || 'N/A',
              short: false,
            },
            {
              title: 'Phase',
              value: message.phase || 'N/A',
              short: true,
            },
            {
              title: 'Consensus',
              value: message.consensus ? '✅ Achieved' : '❌ Not reached',
              short: true,
            },
            {
              title: 'Session',
              value: message.sessionId || 'N/A',
              short: true,
            },
          ],
        },
      ],
    };

    const response = await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`);
    }
  }

  async notifyPhaseComplete(
    phase: string,
    task: string,
    consensus: boolean,
    sessionId: string
  ): Promise<void> {
    await this.notify({
      text: `AI Council ${phase} phase ${consensus ? '✅' : '⚠️'}`,
      phase,
      consensus,
      sessionId,
      task,
    });
  }

  async notifyConsensusComplete(
    task: string,
    sessionId: string,
    results: any
  ): Promise<void> {
    await this.notify({
      text: `AI Council completed review for "${task}"`,
      phase: 'complete',
      consensus: true,
      sessionId,
      task,
    });
  }
}

export default SlackNotifier;