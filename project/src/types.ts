export interface User {
  id: string;
  email: string;
  gmail_token?: string;
  last_sync?: string;
  created_at: string;
}

export interface RawEmail {
  id: string;
  user_id: string;
  subject: string;
  sender: string;
  body: string;
  date_received: string;
  gmail_id?: string;
  created_at: string;
}

export interface ClassifiedEmail {
  id: string;
  user_id: string;
  raw_email_id: string;
  category: 'job' | 'event' | 'important' | 'others' | 'spam';
  priority: 'high' | 'medium' | 'low';
  spam_score: number;
  job_title?: string;
  company?: string;
  location?: string;
  experience_level?: string;
  skills?: string[];
  application_deadline?: string;
  event_title?: string;
  event_date?: string;
  event_location?: string;
  organizer?: string;
  meeting_link?: string;
  reminder_set: boolean;
  created_at: string;
  raw_email?: RawEmail;
}

export interface DashboardStats {
  total: number;
  jobs: number;
  events: number;
  important: number;
  spam: number;
}
