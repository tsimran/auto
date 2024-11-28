import Browser from 'webextension-polyfill';

export interface MousePosition {
  x: number;
  y: number;
}

export async function moveMouse(tabId: number, target: MousePosition): Promise<void> {
  await Browser.scripting.executeScript({
    target: { tabId },
    func: (x: number, y: number) => {
      // Create cursor element if it doesn't exist
      let cursor = document.getElementById('ai-cursor');
      if (!cursor) {
        cursor = document.createElement('div');
        cursor.id = 'ai-cursor';
        cursor.style.cssText = `
          position: fixed;
          width: 20px;
          height: 20px;
          background: rgba(66, 153, 225, 0.6);
          border-radius: 50%;
          pointer-events: none;
          z-index: 999999;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 0 2px white, 0 0 0 4px rgba(66, 153, 225, 0.3);
        `;
        document.body.appendChild(cursor);
      }

      // Animate cursor to target position
      cursor.style.transform = `translate(${x}px, ${y}px)`;
      
      // Create ripple effect on click
      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 20px;
        height: 20px;
        background: rgba(66, 153, 225, 0.4);
        border-radius: 50%;
        pointer-events: none;
        z-index: 999998;
        animation: ripple 0.6s ease-out forwards;
      `;

      const style = document.createElement('style');
      style.textContent = `
        @keyframes ripple {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(3); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(ripple);

      // Remove ripple after animation
      setTimeout(() => {
        ripple.remove();
        style.remove();
      }, 600);
    },
    args: [target.x, target.y]
  });
}

export async function simulateClick(tabId: number, target: MousePosition): Promise<void> {
  await moveMouse(tabId, target);
  
  // Wait for cursor animation
  await new Promise(resolve => setTimeout(resolve, 300));

  await Browser.scripting.executeScript({
    target: { tabId },
    func: (x: number, y: number) => {
      const element = document.elementFromPoint(x, y);
      if (element instanceof HTMLElement) {
        // Highlight clicked element
        const originalOutline = element.style.outline;
        element.style.outline = '2px solid rgba(66, 153, 225, 0.6)';
        
        // Trigger events
        element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        element.click();

        // Reset outline
        setTimeout(() => {
          element.style.outline = originalOutline;
        }, 500);
      }
    },
    args: [target.x, target.y]
  });
}