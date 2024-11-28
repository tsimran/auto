import Browser from 'webextension-polyfill';
import type { CommandAction, CommandResult } from './command-types';
import { playYouTubeVideo } from './youtube-interaction';

export async function executeCommand(action: CommandAction): Promise<CommandResult> {
  try {
    switch (action.type) {
      case 'web_search':
        return await executeWebSearch(action.params);
      case 'web_navigate':
        return await executeWebNavigation(action.params);
      case 'youtube_search':
      case 'youtube_play':
        return await executeYouTubeAction(action);
      case 'wikipedia_search':
        return await executeWikipediaSearch(action.params);
      case 'github_search':
        return await executeGitHubSearch(action.params);
      case 'stackoverflow_search':
        return await executeStackOverflowSearch(action.params);
      case 'email_compose':
        return await executeEmailCompose(action.params);
      case 'translate':
        return await executeTranslate(action.params);
      case 'calculate':
        return await executeCalculation(action.params);
      case 'weather_check':
        return await executeWeatherCheck(action.params);
      case 'maps_search':
        return await executeMapsSearch(action.params);
      default:
        return {
          success: false,
          error: 'Unsupported command type'
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

async function executeWebSearch(params: Record<string, string>): Promise<CommandResult> {
  const { query } = params;
  await Browser.tabs.create({
    url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    active: true
  });
  return { success: true };
}

async function executeWebNavigation(params: Record<string, string>): Promise<CommandResult> {
  const { url } = params;
  let finalUrl = url.startsWith('http') ? url : `https://${url}`;
  await Browser.tabs.create({ url: finalUrl, active: true });
  return { success: true };
}

async function executeYouTubeAction(action: CommandAction): Promise<CommandResult> {
  try {
    const { query } = action.params;
    const encodedQuery = encodeURIComponent(query);
    const tab = await Browser.tabs.create({
      url: `https://www.youtube.com/results?search_query=${encodedQuery}`,
      active: true
    });

    if (!tab.id) {
      return { 
        success: false, 
        error: 'Failed to create tab' 
      };
    }

    if (action.type === 'youtube_play') {
      await playYouTubeVideo(tab.id);
    }

    return { 
      success: true,
      message: action.type === 'youtube_play' ? 'Playing video...' : 'Showing search results...'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute YouTube action'
    };
  }
}

async function executeWikipediaSearch(params: Record<string, string>): Promise<CommandResult> {
  const { query } = params;
  await Browser.tabs.create({
    url: `https://wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`,
    active: true
  });
  return { success: true };
}

async function executeGitHubSearch(params: Record<string, string>): Promise<CommandResult> {
  const { query } = params;
  await Browser.tabs.create({
    url: `https://github.com/search?q=${encodeURIComponent(query)}`,
    active: true
  });
  return { success: true };
}

async function executeStackOverflowSearch(params: Record<string, string>): Promise<CommandResult> {
  const { query } = params;
  await Browser.tabs.create({
    url: `https://stackoverflow.com/search?q=${encodeURIComponent(query)}`,
    active: true
  });
  return { success: true };
}

async function executeEmailCompose(params: Record<string, string>): Promise<CommandResult> {
  const { to = '', subject = '', body = '' } = params;
  const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  await Browser.tabs.create({ url: mailtoUrl, active: true });
  return { success: true };
}

async function executeTranslate(params: Record<string, string>): Promise<CommandResult> {
  const { text, from = 'auto', to = 'en' } = params;
  await Browser.tabs.create({
    url: `https://translate.google.com/?sl=${from}&tl=${to}&text=${encodeURIComponent(text)}`,
    active: true
  });
  return { success: true };
}

async function executeCalculation(params: Record<string, string>): Promise<CommandResult> {
  const { expression } = params;
  await Browser.tabs.create({
    url: `https://www.google.com/search?q=${encodeURIComponent(expression)}`,
    active: true
  });
  return { success: true };
}

async function executeWeatherCheck(params: Record<string, string>): Promise<CommandResult> {
  const { location } = params;
  await Browser.tabs.create({
    url: `https://www.google.com/search?q=weather+${encodeURIComponent(location)}`,
    active: true
  });
  return { success: true };
}

async function executeMapsSearch(params: Record<string, string>): Promise<CommandResult> {
  const { query } = params;
  await Browser.tabs.create({
    url: `https://www.google.com/maps/search/${encodeURIComponent(query)}`,
    active: true
  });
  return { success: true };
}