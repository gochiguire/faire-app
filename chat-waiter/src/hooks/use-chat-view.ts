
// src/hooks/use-chat-view.ts
'use client';

import { useState, useCallback } from 'react';

/** One message in the chat (as per prompt's "Data models" section) */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** One order placed by a user (as per prompt's "Data models" section) */
export interface Order {
  id: string;
  desc: string;
  userName: string;
  status: 'ordering' | 'decided' | 'cooking' | 'finished';
}

const INITIAL_ASSISTANT_MESSAGE_CONTENT = '¡Hola! Soy tu asistente virtual de DineAI. ¿Cómo puedo ayudarte a elegir tu comida hoy?';

/**
 * Returns all state and actions the chat view needs.
 * Provide a mocked implementation for now.
 */
export function useChatView(): {
  chatHistory: ChatMessage[];
  userName: string;
  addMessage: (userName: string, message: string) => void;
  newChat: () => void;
  setUserName: (name: string) => void;
} {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'assistant', content: INITIAL_ASSISTANT_MESSAGE_CONTENT },
  ]);
  const [userName, setUserNameState] = useState<string>('Cliente Invitado');

  const addMessage = useCallback(
    (messageAuthorName: string, messageContent: string) => {
      const userMessage: ChatMessage = {
        role: 'user',
        content: messageContent,
      };

      setChatHistory((prev) => [...prev, userMessage]);

      // Simulate assistant thinking by adding a "Pensando..." message
      const thinkingMessage: ChatMessage = {
        role: 'assistant',
        content: 'Pensando...',
      };
      setChatHistory((prev) => [...prev, thinkingMessage]);

      // Simulate delay and then replace "Pensando..." with the actual response
      //TODO execute the prompt to get the response
      setTimeout(() => {
        const assistantResponse: ChatMessage = {
          role: 'assistant',
          content: `De acuerdo, ${messageAuthorName}. Entendido: "${messageContent}". Esta es una respuesta simulada. ¿Qué más te gustaría hacer?`,
        };
        setChatHistory((prev) => {
          // Attempt to remove the "Pensando..." message if it's the last one
          const newHistory = [...prev];
          if (newHistory.length > 0 && newHistory[newHistory.length - 1].content === 'Pensando...') {
            newHistory.pop();
          }
          return [...newHistory, assistantResponse];
        });
      }, 1500);
    },
    [] 
  );

  const newChat = useCallback(() => {
    setChatHistory([{ role: 'assistant', content: 'He reiniciado nuestro chat. ¿En qué puedo ayudarte ahora?' }]);
  }, []);

  const setUserNameHook = useCallback((name: string) => {
    setUserNameState(name);
    // Optionally, inform the user or assistant about the name change
    setChatHistory((prev) => [
      ...prev,
      { role: 'assistant', content: `¡Hola ${name}! He actualizado tu nombre.`}
    ]);
  }, []);

  return {
    chatHistory,
    userName,
    addMessage,
    newChat,
    setUserName: setUserNameHook,
  };
}
