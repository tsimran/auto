export interface CommandAction {
  type: string;
  params: Record<string, string>;
}

export type CommandType = 
  | 'web_search'
  | 'web_navigate'
  | 'youtube_search'
  | 'youtube_play'
  | 'wikipedia_search'
  | 'github_search'
  | 'stackoverflow_search'
  | 'email_compose'
  | 'translate'
  | 'calculate'
  | 'weather_check'
  | 'maps_search';

export interface CommandResult {
  success: boolean;
  message?: string;
  error?: string;
}