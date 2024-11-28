import { queryPerplexity } from './ai-providers/perplexity';

export interface ElementLocation {
  element: Element;
  rect: DOMRect;
  center: { x: number; y: number };
  confidence: number;
}

export async function findElementByAI(purpose: string, html: string): Promise<string> {
  const prompt = `
Analyze this HTML and find the most accurate CSS selector for: "${purpose}"

HTML Content:
${html}

Return ONLY a CSS selector string that uniquely identifies the element.
Consider:
1. Unique IDs
2. Specific classes
3. ARIA attributes
4. Element hierarchy
5. Data attributes
`;

  try {
    const response = await queryPerplexity(prompt);
    return response.trim().replace(/^['"]|['"]$/g, '');
  } catch (error) {
    console.error('Error finding element:', error);
    throw error;
  }
}

export async function getElementLocation(
  tabId: number,
  selector: string
): Promise<ElementLocation | null> {
  const result = await Browser.scripting.executeScript({
    target: { tabId },
    func: (sel: string) => {
      const element = document.querySelector(sel);
      if (!element) return null;

      const rect = element.getBoundingClientRect();
      return {
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        },
        center: {
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2
        }
      };
    },
    args: [selector]
  });

  const location = result[0].result;
  return location ? {
    ...location,
    confidence: 1,
    element: document.querySelector(selector) as Element
  } : null;
}