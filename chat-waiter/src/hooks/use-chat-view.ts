// useChatView.ts
// ----------------
// A convenience React hook that wraps the three Jotai atoms defined in atoms.ts
//   • chatHistoryAtom – ChatHistory[] stored in sessionStorage
//   • userNameAtom    – string stored in sessionStorage
//
// It exposes a minimal API for chat‑oriented UIs:
//   const {
//     chatHistory,      // current history array
//     addMessage,       // append a new user message
//     newChat,          // clear history
//     userName,         // current userName string
//     setUserName,      // update userName
//   } = useChatView()
//
// The hook is fully typed and memoized with React.useCallback so that the
// returned functions stay stable between renders.
// --------------------------------------------------------------

import * as React from "react";
import { useAtom } from "jotai";
import { ChatHistory, chatHistoryAtom, userNameAtom } from "./atoms";

interface UseChatViewResult {
  chatHistory: ChatHistory[];
  addMessage: (userName: string, message: string) => void;
  newChat: () => void;
  userName: string;
  setUserName: (name: string) => void;
}

export function useChatView(): UseChatViewResult {
  /* ------------------------------------------------------------------ */
  const [chatHistory, setChatHistory] = useAtom(chatHistoryAtom);
  const [userName, setUserName] = useAtom(userNameAtom);

  /* Append a new user‑side message and optionally sync userName */
  const addMessage = React.useCallback(
    (userNameParam: string, message: string) => {
      // Keep the session userName in sync with the param
      if (userNameParam && userNameParam !== userName) {
        setUserName(userNameParam);
      }

      setChatHistory((prev) => [
        ...prev,
        { role: "user", content: message } satisfies ChatHistory,
      ]);
    },
    [userName, setUserName, setChatHistory]
  );

  /* Reset the conversation */
  const newChat = React.useCallback(() => {
    setChatHistory([]);
  }, [setChatHistory]);

  /* ------------------------------------------------------------------ */
  return {
    chatHistory,
    addMessage,
    newChat,
    userName,
    setUserName,
  };
}
