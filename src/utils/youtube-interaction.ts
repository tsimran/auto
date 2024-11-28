import Browser from 'webextension-polyfill';
import { queryPerplexity } from './ai-providers/perplexity';
import { findElementByAI } from './element-finder';
import { moveMouse, simulateClick } from './mouse-controller';

async function findAndClickElement(tabId: number, purpose: string): Promise<void> {
  // Get page content
  const content = await Browser.scripting.executeScript({
    target: { tabId },
    func: () => document.documentElement.outerHTML
  });

  // Find element using AI
  const selector = await findElementByAI(purpose, content[0].result);

  // Get element location
  const location = await Browser.scripting.executeScript({
    target: { tabId },
    func: (sel: string) => {
      const element = document.querySelector(sel);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    },
    args: [selector]
  });

  if (location[0].result) {
    // Move mouse and click
    await simulateClick(tabId, location[0].result);
  }
}

export async function playYouTubeVideo(tabId: number): Promise<void> {
  try {
    // Wait for page load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Find and click first video
    await findAndClickElement(tabId, 'first video thumbnail or link');

    // Wait for video page load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Find and click play button if needed
    await Browser.scripting.executeScript({
      target: { tabId },
      func: async () => {
        const video = document.querySelector('video');
        if (video && video.paused) {
          const playButton = document.querySelector('.ytp-play-button');
          if (playButton instanceof HTMLElement) {
            playButton.click();
          }
        }

        // Verify video is playing
        if (video) {
          await new Promise<void>((resolve) => {
            const checkPlay = () => {
              if (!video.paused) {
                resolve();
              } else {
                setTimeout(checkPlay, 100);
              }
            };
            checkPlay();
          });
        }
      }
    });

    // Add video controls overlay
    await Browser.scripting.executeScript({
      target: { tabId },
      func: () => {
        const controls = document.createElement('div');
        controls.innerHTML = `
          <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.7);
            padding: 10px;
            border-radius: 8px;
            z-index: 9999;
            color: white;
            font-family: system-ui;
          ">
            <div>AI Assistant</div>
            <div style="color: #4ADE80">✓ Video playing</div>
          </div>
        `;
        document.body.appendChild(controls);
        setTimeout(() => controls.remove(), 3000);
      }
    });
  } catch (error) {
    console.error('Error playing YouTube video:', error);
    throw error;
  }
}