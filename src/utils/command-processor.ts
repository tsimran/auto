import Browser from 'webextension-polyfill';
import { queryPerplexity } from './ai-providers/perplexity';

interface CommandAction {
  type: string;
  params: Record<string, string>;
}

export async function processCommand(command: string): Promise<string> {
  try {
    // First, use Perplexity to understand the command
    const aiPrompt = `
You are a command parser. Analyze this command and return ONLY a JSON object with 'type' and 'params'.
Command: "${command}"

Valid types:
- youtube_play: For playing videos on YouTube
- youtube_search: For searching on YouTube

Example formats:
"OPEN YOUTUBE AND PLAY DESPACITO" →
{
  "type": "youtube_play",
  "params": {
    "query": "despacito"
  }
}

"SEARCH FOR COOKING VIDEOS ON YOUTUBE" →
{
  "type": "youtube_search",
  "params": {
    "query": "cooking videos"
  }
}

Return ONLY the JSON object, no additional text or markdown.
`;

    const response = await queryPerplexity(aiPrompt);
    
    // Clean the response and parse JSON
    const jsonStr = response.replace(/```json\n?|\n?```/g, '').trim();
    const action: CommandAction = JSON.parse(jsonStr);

    // Execute the command based on its type
    switch (action.type) {
      case 'youtube_play':
      case 'youtube_search':
        await executeYouTubeAction(action);
        return ''; // Return empty string to prevent showing response in extension

      default:
        throw new Error('Unrecognized command type');
    }
  } catch (error) {
    console.error('Command processing error:', error);
    throw error; // Propagate error to prevent showing response in extension
  }
}

async function executeYouTubeAction(action: CommandAction): Promise<void> {
  const { query } = action.params;
  const encodedQuery = encodeURIComponent(query);
  
  // Create a new tab with YouTube search
  const tab = await Browser.tabs.create({
    url: `https://www.youtube.com/results?search_query=${encodedQuery}`,
    active: true
  });

  if (!tab.id) return;

  // Wait for page load
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Execute script to handle the YouTube page
  await Browser.scripting.executeScript({
    target: { tabId: tab.id },
    func: (actionType) => {
      function waitForElement(selector: string, timeout = 10000): Promise<Element | null> {
        return new Promise((resolve) => {
          const startTime = Date.now();
          
          const checkElement = () => {
            const element = document.querySelector(selector);
            if (element) {
              resolve(element);
              return;
            }
            
            if (Date.now() - startTime > timeout) {
              resolve(null);
              return;
            }
            
            requestAnimationFrame(checkElement);
          };
          
          checkElement();
        });
      }

      // Handle different action types
      async function handleAction() {
        if (actionType === 'youtube_play') {
          // Wait for the first video thumbnail
          const videoLink = await waitForElement('ytd-video-renderer a#thumbnail');
          if (videoLink && videoLink instanceof HTMLAnchorElement) {
            videoLink.click();
          }
        }
        // For youtube_search, we just leave the search results page open
      }

      handleAction().catch(console.error);
    },
    args: [action.type]
  });
}