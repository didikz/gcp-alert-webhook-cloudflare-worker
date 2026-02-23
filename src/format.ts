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
      state: string; // Changed from 'OPEN' | 'CLOSED' to string to accommodate 'closed' or 'open'
      resource_id: string;
      resource_name: string;
      resource_display_name?: string; // Added
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
      metadata?: { // Added
        system_labels: Record<string, string>;
        user_labels: Record<string, string>;
      };
      policy_name: string;
      policy_user_labels?: Record<string, string>; // Added
      condition_name: string;
      threshold_value: string;
      observed_value: string;
      condition?: { // Added
        name: string;
        displayName: string;
        conditionThreshold: any; // Simplified to any
      };
      summary: string;
      documentation: {
        content: string;
        mime_type: string;
        subject?: string; // Added
        links?: Array<{ displayName: string; url: string; }>; // Added
      };
      notification_channel_ids: string[];
    };
    version: '1.2';
  }
  
  function escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }
  
  export function formatGcpAlert(alert: GcpAlert, timezone?: string): string {
    const { incident } = alert;
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone || 'UTC',
    };
    const startedAt = new Date(incident.started_at * 1000).toLocaleString('en-US', options);
  
    if (incident.state.toUpperCase() === 'OPEN') {
      return `
  🚨 *GCP Alert: ${escapeMarkdown(incident.policy_name ?? 'N/A')}* 🚨
  
  *Summary:* ${escapeMarkdown(incident.summary ?? 'N/A')}
  
  *Details:*
  - *State:* 🚨 OPEN
  - *Condition:* ${escapeMarkdown(incident.condition_name ?? 'N/A')}
  - *Resource:* \`${escapeMarkdown(incident.resource_name ?? 'N/A')}\`
  - *Project:* \`${escapeMarkdown(incident.scoping_project_id ?? 'N/A')}\`
  
  *Timestamps:*
  - *Started:* ${startedAt}
  
  [View Incident](${incident.url})
  `;
    } else {
      const endedAt = incident.ended_at ? new Date(incident.ended_at * 1000).toLocaleString('en-US', options) : 'N/A';
  
      return `
  ✅ *GCP Alert Resolved: ${escapeMarkdown(incident.policy_name ?? 'N/A')}* ✅
  
  *Summary:* ${escapeMarkdown(incident.summary ?? 'N/A')}
  
  *Details:*
  - *State:* ✅ RESOLVED
  - *Resource:* \`${escapeMarkdown(incident.resource_name ?? 'N/A')}\`
  - *Project:* \`${escapeMarkdown(incident.scoping_project_id ?? 'N/A')}\`
  
  *Timestamps:*
  - *Started:* ${startedAt}
  - *Ended:* ${endedAt}
  
  [View Incident](${incident.url})
  `;
    }
  }  