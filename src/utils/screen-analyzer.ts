import { queryPerplexity } from './ai-providers/perplexity';

export interface ElementInfo {
  tag: string;
  text?: string;
  className?: string;
  id?: string;
  href?: string;
  src?: string;
  type?: string;
  role?: string;
  ariaLabel?: string;
}

export async function analyzeScreen(): Promise<ElementInfo[]> {
  const elements = Array.from(document.querySelectorAll('*')).map(el => {
    const element = el as HTMLElement;
    return {
      tag: element.tagName.toLowerCase(),
      text: element.textContent?.trim(),
      className: element.className,
      id: element.id,
      href: (element as HTMLAnchorElement).href,
      src: (element as HTMLImageElement).src,
      type: element.getAttribute('type'),
      role: element.getAttribute('role'),
      ariaLabel: element.getAttribute('aria-label')
    };
  });

  return elements.filter(el => el.text || el.id || el.className);
}

export async function findBestElement(elements: ElementInfo[], purpose: string): Promise<ElementInfo | null> {
  const elementsJson = JSON.stringify(elements);
  
  const prompt = `
Analyze these webpage elements and find the best one for this purpose: "${purpose}"

Elements:
${elementsJson}

Return ONLY a JSON object for the best matching element with these properties:
{
  "tag": string,
  "text"?: string,
  "className"?: string,
  "id"?: string,
  "href"?: string,
  "src"?: string,
  "type"?: string,
  "role"?: string,
  "ariaLabel"?: string
}

Consider:
1. Element purpose and semantics
2. Text content relevance
3. ARIA labels and roles
4. Element hierarchy and context
`;

  try {
    const response = await queryPerplexity(prompt);
    const jsonStr = response.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error finding best element:', error);
    return null;
  }
}