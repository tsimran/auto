import React, { useState } from 'react';
import { Terminal, Loader2 } from 'lucide-react';
import { processCommand } from '../utils/command-processor';

export const CommandSearch: React.FC = () => {
  const [command, setCommand] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isExecuting) return;

    setIsExecuting(true);
    try {
      await processCommand(command);
      setCommand('');
    } catch (error) {
      console.error('Command execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="mt-4">
      <form onSubmit={handleSubmit}>
        <div className="input-container bg-gray-50 dark:bg-gray-800/50">
          <div className="pl-3 pr-2 text-blue-500 dark:text-blue-400">
            <Terminal className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter a command (e.g., OPEN YOUTUBE AND PLAY...)"
            className="input-field !pl-0 font-mono text-sm"
            disabled={isExecuting}
          />
          <button
            type="submit"
            disabled={isExecuting}
            className="absolute right-2 p-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 
              dark:hover:text-blue-300 disabled:opacity-50 transition-colors"
          >
            {isExecuting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span className="text-sm font-medium">Execute</span>
            )}
          </button>
        </div>
      </form>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Try commands like "OPEN YOUTUBE AND PLAY..." or "SEARCH FOR ... ON YOUTUBE"
      </p>
    </div>
  );
};