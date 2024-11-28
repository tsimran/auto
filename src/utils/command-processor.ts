import { queryPerplexity } from './ai-providers/perplexity';
import { executeCommand } from './command-executor';
import type { CommandAction } from './command-types';

export async function processCommand(command: string): Promise<string> {
  try {
    const aiPrompt = `
You are an AI command interpreter. Analyze this command and return ONLY a JSON object with 'type' and 'params'.
Command: "${command}"

Valid types and their parameters:
- web_search: { query: string }
- web_navigate: { url: string }
- youtube_search: { query: string }
- youtube_play: { query: string }
- wikipedia_search: { query: string }
- github_search: { query: string }
- stackoverflow_search: { query: string }
- email_compose: { to?: string, subject?: string, body?: string }
- translate: { text: string, from?: string, to?: string }
- calculate: { expression: string }
- weather_check: { location: string }
- maps_search: { query: string }

Examples:
"SEARCH FOR REACT HOOKS" →
{
  "type": "web_search",
  "params": {
    "query": "react hooks"
  }
}

"OPEN GITHUB AND SEARCH FOR TYPESCRIPT PROJECTS" →
{
  "type": "github_search",
  "params": {
    "query": "typescript projects"
  }
}

"CHECK WEATHER IN NEW YORK" →
{
  "type": "weather_check",
  "params": {
    "location": "New York"
  }
}

Return ONLY the JSON object, no additional text or markdown.
`;

    const response = await queryPerplexity(aiPrompt);
    const jsonStr = response.replace(/```json\n?|\n?```/g, '').trim();
    const action: CommandAction = JSON.parse(jsonStr);

    const result = await executeCommand(action);
    
    if (!result.success) {
      throw new Error(result.error || 'Command execution failed');
    }

    return result.message || '';
  } catch (error) {
    console.error('Command processing error:', error);
    throw error;
  }
}