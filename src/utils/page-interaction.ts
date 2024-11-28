import Browser from 'webextension-polyfill';
import { analyzeScreen, findBestElement, type ElementInfo } from './screen-analyzer';
import { queryPerplexity } from './ai-providers/perplexity';

interface InteractionStep {
  action: 'click' | 'type' | 'wait' | 'scroll' | 'hover';
  selector?: string;
  text?: string;
  duration?: number;
  position?: { x: number; y: number };
}

export async function planInteraction(goal: string): Promise<InteractionStep[]> {
  const prompt = `
Given this interaction goal: "${goal}"

Return ONLY a JSON array of interaction steps. Each step should have:
{
  "action": "click" | "type" | "wait" | "scroll" | "hover",
  "selector"?: string (CSS selector),
  "text"?: string (for typing),
  "duration"?: number (milliseconds),
  "position"?: { x: number, y: number }
}

Example:
[
  { "action": "wait", "duration": 2000 },
  { "action": "click", "selector": "#search-button" },
  { "action": "type", "selector": "#search-input", "text": "search query" }
]
`;

  try {
    const response = await queryPerplexity(prompt);
    const jsonStr = response.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error planning interaction:', error);
    return [];
  }
}

export async function executeInteraction(
  tabId: number,
  steps: InteractionStep[]
): Promise<void> {
  for (const step of steps) {
    try {
      switch (step.action) {
        case 'click':
          await Browser.scripting.executeScript({
            target: { tabId },
            func: (selector) => {
              const element = document.querySelector(selector);
              if (element instanceof HTMLElement) {
                element.click();
              }
            },
            args: [step.selector as string]
          });
          break;

        case 'type':
          await Browser.scripting.executeScript({
            target: { tabId },
            func: (selector, text) => {
              const element = document.querySelector(selector);
              if (element instanceof HTMLInputElement) {
                element.value = text;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
              }
            },
            args: [step.selector as string, step.text as string]
          });
          break;

        case 'wait':
          await new Promise(resolve => setTimeout(resolve, step.duration));
          break;

        case 'scroll':
          await Browser.scripting.executeScript({
            target: { tabId },
            func: (position) => {
              window.scrollTo({
                top: position.y,
                left: position.x,
                behavior: 'smooth'
              });
            },
            args: [step.position as { x: number; y: number }]
          });
          break;

        case 'hover':
          await Browser.scripting.executeScript({
            target: { tabId },
            func: (selector) => {
              const element = document.querySelector(selector);
              if (element instanceof HTMLElement) {
                element.dispatchEvent(new MouseEvent('mouseover', {
                  bubbles: true,
                  cancelable: true,
                  view: window
                }));
              }
            },
            args: [step.selector as string]
          });
          break;
      }
    } catch (error) {
      console.error(`Error executing interaction step:`, error);
    }
  }
}