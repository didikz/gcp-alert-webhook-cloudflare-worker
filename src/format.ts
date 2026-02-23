import Mustache from 'mustache';

export interface GcpAlert {
    incident: {
      incident_id: string;
      renotify?: boolean;
      scoping_project_id: string;
      scoping_project_number: number;
      url: string;
      severity?: string;
      started_at: number;
      ended_at: number | null;
      state: string;
      resource_id: string;
      resource_name: string;
      resource_display_name?: string;
      resource_type_display_name: string;
      resource: {
        type: string;
        labels: Record<string, string>;
      };
      metric: {
        type: string;
        displayName: string;
        labels: Record<string, string>;
      };
      metadata?: {
        system_labels: Record<string, string>;
        user_labels: Record<string, string>;
      };
      policy_name: string;
      policy_user_labels?: Record<string, string>;
      condition_name: string;
      threshold_value: string;
      observed_value: string;
      condition?: {
        name: string;
        displayName: string;
        conditionThreshold: any;
      };
      summary: string;
      documentation: {
        content: string;
        mime_type: string;
        subject?: string;
        links?: Array<{ displayName: string; url: string; }>;
      };
      notification_channel_ids: string[];
    };
    version: '1.2';
  }
  
const DEFAULT_TEMPLATE_OPEN = `
🚨 *GCP Alert: {{{policy_name}}}* 🚨

*Summary:* {{{summary}}}

*Details:*
- *State:* 🚨 OPEN
- *Condition:* {{{condition_name}}}
- *Resource:* \`{{{resource_name}}}\`
- *Project:* \`{{{scoping_project_id}}}\`

*Timestamps:*
- *Started:* {{{started_at}}}

[View Incident]({{{url}}})
`;

const DEFAULT_TEMPLATE_RESOLVED = `
✅ *GCP Alert Resolved: {{{policy_name}}}* ✅

*Summary:* {{{summary}}}

*Details:*
- *State:* ✅ RESOLVED
- *Resource:* \`{{{resource_name}}}\`
- *Project:* \`{{{scoping_project_id}}}\`

*Timestamps:*
- *Started:* {{{started_at}}}
- *Ended:* {{{ended_at}}}

[View Incident]({{{url}}})
`;


function escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

export function formatGcpAlert(
    alert: GcpAlert,
    timezone?: string,
    openTemplate?: string,
    resolvedTemplate?: string,
): string {
    const { incident } = alert;
    const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone || 'UTC',
    };
    const startedAt = new Date(incident.started_at * 1000).toLocaleString('en-US', options);

    const view = {
        policy_name: escapeMarkdown(incident.policy_name ?? 'N/A'),
        summary: escapeMarkdown(incident.summary ?? 'N/A'),
        condition_name: escapeMarkdown(incident.condition_name ?? 'N/A'),
        resource_name: escapeMarkdown(incident.resource_name ?? 'N/A'),
        scoping_project_id: escapeMarkdown(incident.scoping_project_id ?? 'N/A'),
        started_at: startedAt,
        url: incident.url,
        ended_at: incident.ended_at ? new Date(incident.ended_at * 1000).toLocaleString('en-US', options) : 'N/A',
    };

    if (incident.state.toUpperCase() === 'OPEN') {
        const template = openTemplate || DEFAULT_TEMPLATE_OPEN;
        return Mustache.render(template, view);
    } else {
        const template = resolvedTemplate || DEFAULT_TEMPLATE_RESOLVED;
        return Mustache.render(template, view);
    }
}

