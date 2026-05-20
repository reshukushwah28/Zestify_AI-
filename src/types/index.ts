export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
  imageUrl?: string;
  isGeneratedImage?: boolean;
}

export interface ChatResponse {
  text: string;
  error?: string;
}