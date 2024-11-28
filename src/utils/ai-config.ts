export interface AIConfig {
  xai: {
    apiKey: string;
    endpoint: string;
  };
  gemini: {
    apiKey: string;
    model: string;
  };
  perplexity: {
    apiKey: string;
    model: string;
  };
}

export const AI_CONFIG: AIConfig = {
  xai: {
    apiKey: 'xai-6uC60MAyM0cYImQdvz33Z9bJb0DtHfzY667xzjylmigG9jox85ySExpjbKW025xnA97f1DjaD5D7zM4V',
    endpoint: 'https://api.xai.com/v1'
  },
  gemini: {
    apiKey: 'AIzaSyDTi0JDNKFr7O4yK1sJgKGwwkY_JkCzMSQ',
    model: 'gemini-pro'
  },
  perplexity: {
    apiKey: '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',
    model: 'llama-3.1-sonar-small-128k-online'
  }
};