import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  Typography,
  Box,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  Brightness7Rounded as AIIcon,  // if I was less lasy this would be a universal variable...
  Close as CloseIcon,
} from '@mui/icons-material';

const API_KEY = 'AIzaSyCoJEcBZOQZFj-xuwKg9prq5w4LBBSM3NM';

/**
 * A reusable chat dialog component that interfaces with the Gemini API
 */
const GeminiChatShell = ({ 
  open, 
  onClose, 
  messages,
  setMessages,
  systemPrompt,
  dialogTitle = "AI Assistant",
  dialogIcon = <AIIcon color="primary" />,
  placeholderText = "Type your message here...",
  processResponse = (response) => response,
  welcomeMessage = null
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage
    }]);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}

Previous conversation:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Current message:
${userMessage}`
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.candidates[0].content.parts[0].text;
      const processedMessage = processResponse(assistantMessage);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: processedMessage
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I apologize, but I encountered an error processing your request. Could you please try rephrasing or provide more details?`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        {dialogIcon}
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {dialogTitle}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        gap: 2,
        p: 2
      }}>
        {messages.length === 0 ? (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
            color: 'text.secondary'
          }}>
            {dialogIcon}
            <Typography variant="h6">
              {welcomeMessage?.title || "Welcome! How can I help you today?"}
            </Typography>
            {welcomeMessage?.description && (
              <Typography variant="body2" textAlign="center" maxWidth="80%">
                {welcomeMessage.description}
              </Typography>
            )}
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2
                }}
              >
                <Box
                  sx={{
                    maxWidth: '80%',
                    bgcolor: message.role === 'user' ? 'primary.main' : 'grey.100',
                    color: message.role === 'user' ? 'white' : 'text.primary',
                    borderRadius: 2,
                    p: 2,
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Typography>
                </Box>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </DialogContent>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder={placeholderText}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          InputProps={{
            endAdornment: (
              <IconButton 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                color="primary"
              >
                {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
              </IconButton>
            )
          }}
        />
      </Box>
    </Dialog>
  );
};

export default GeminiChatShell;