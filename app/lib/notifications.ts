/**
 * Notification utilities for the quote-to-draft-order workflow.
 *
 * When a Draft Order is created from the quote form, these helpers send
 * a structured alert to the sales team via Slack or Microsoft Teams
 * incoming webhooks.  Both are optional — if no webhook URL is configured,
 * the notification is silently skipped.
 */

import {logger} from '~/lib/logger';

type QuoteNotification = {
  draftOrderName: string;
  invoiceUrl: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  project: string;
  itemCount: number;
};

function getWebhookUrl(env: Env | Record<string, unknown>): string | undefined {
  const e = env as unknown as Record<string, unknown>;
  return (e.SLACK_WEBHOOK_URL ?? e.TEAMS_WEBHOOK_URL) as string | undefined;
}

export function hasNotificationWebhook(
  env: Env | Record<string, unknown>,
): boolean {
  return Boolean(getWebhookUrl(env));
}

export async function notifyQuoteCreated(
  env: Env | Record<string, unknown>,
  data: QuoteNotification,
): Promise<boolean> {
  const webhookUrl = getWebhookUrl(env);
  if (!webhookUrl) return false;

  const isSlack = (webhookUrl as string).includes('hooks.slack.com');
  const isTeams = (webhookUrl as string).includes('webhook.office.com');

  try {
    if (isSlack) {
      await sendSlack(webhookUrl as string, data);
    } else if (isTeams) {
      await sendTeams(webhookUrl as string, data);
    } else {
      // Generic JSON POST
      await fetch(webhookUrl as string, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
      });
    }
    return true;
  } catch (error) {
    logger.warn('Notification failed', {draftOrderName: data.draftOrderName}, error);
    return false;
  }
}

async function sendSlack(webhookUrl: string, data: QuoteNotification) {
  const blocks = [
    {
      type: 'header',
      text: {type: 'plain_text', text: `New Quote: ${data.draftOrderName}`},
    },
    {
      type: 'section',
      fields: [
        {type: 'mrkdwn', text: `*Company:*\n${data.company}`},
        {type: 'mrkdwn', text: `*Contact:*\n${data.contact}`},
        {type: 'mrkdwn', text: `*Email:*\n${data.email}`},
        {type: 'mrkdwn', text: `*Phone:*\n${data.phone}`},
        {type: 'mrkdwn', text: `*Items:*\n${data.itemCount}`},
      ],
    },
  ];

  if (data.project) {
    blocks.push({
      type: 'section',
      text: {type: 'mrkdwn', text: `*Project notes:*\n${data.project}`},
    });
  }

  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `<${data.invoiceUrl}|View invoice in Shopify Admin →>`,
    },
  });

  await fetch(webhookUrl, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({blocks}),
  });
}

async function sendTeams(webhookUrl: string, data: QuoteNotification) {
  const facts = [
    {name: 'Company', value: data.company},
    {name: 'Contact', value: data.contact},
    {name: 'Email', value: data.email},
    {name: 'Phone', value: data.phone},
    {name: 'Items', value: String(data.itemCount)},
  ];

  const sections: Array<Record<string, unknown>> = [
    {
      activityTitle: `New Quote: ${data.draftOrderName}`,
      activitySubtitle: 'Quote request submitted from website',
      facts,
      markdown: true,
    },
  ];

  if (data.project) {
    sections.push({
      activityTitle: 'Project notes',
      text: data.project,
      markdown: true,
    });
  }

  sections.push({
    potentialAction: [
      {
        '@type': 'OpenUri',
        name: 'View invoice in Shopify Admin',
        targets: [{os: 'default', uri: data.invoiceUrl}],
      },
    ],
  });

  await fetch(webhookUrl, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: `New Quote: ${data.draftOrderName}`,
      themeColor: '0057B8',
      sections,
    }),
  });
}
