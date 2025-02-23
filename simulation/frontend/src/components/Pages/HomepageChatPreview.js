import React, { useState, useRef, useEffect } from 'react';
import { 
  Paper, 
  Box, 
  Typography, 
  TextField, 
  IconButton, 
  CircularProgress,
} from '@mui/material';
import { Send as SendIcon, AutoFixHigh as AIIcon } from '@mui/icons-material';
import { useAIAssistant } from '../Gemini/AIAssistantContext.js';
import { getSystemPrompt } from '../Gemini/AIAssistantUtils.js';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const API_KEY = 'AIzaSyCoJEcBZOQZFj-xuwKg9prq5w4LBBSM3NM';

/**
 * A compact version of the AI assistant that appears on the homepage
 * Uses the same processing logic as the main assistant
 */
const HomepageChatPreview = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewMessages, setPreviewMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi there! I can help you create simulations for restaurants, stores, and other service facilities. What would you like to simulate today?'
    }
  ]);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  // Get access to the main assistant's context and functions
  const { 
    openAssistant, 
    setMessages,
    // Import the processResponse function from the main assistant context
    processResponse
  } = useAIAssistant();
  
  const location = useLocation();
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [previewMessages]);

  // Add this function at the top of the component
  const processMessageContent = async (message) => {
    if (message.content instanceof Promise) {
      try {
        const resolvedContent = await message.content;
        return resolvedContent;
      } catch (error) {
        console.error('Error processing message content:', error);
        return 'Error processing message';
      }
    }
    return message.content;
  };

  // Handle sending a message - using the main assistant's processing
  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    
    // Add user message to preview chat
    setPreviewMessages(prev => [...prev, {
      role: 'user',
      content: userMessage
    }]);
    
    try {
      // Get the system prompt from the same utility
      const systemPrompt = getSystemPrompt(location.pathname, {
        projects: [],
        currentProject: null,
        nodes: [],
        simulationResults: null
      });
      
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
${previewMessages.map(m => `${m.role}: ${m.content}`).join('\n')}

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
      
      // Process the response using the main assistant's processResponse function
      const processedMessage = await processMessageContent({
        content: processResponse(assistantMessage)
      });

      setPreviewMessages(prev => [...prev, {
        role: 'assistant',
        content: processedMessage
      }]);
    } catch (error) {
      console.error('Error:', error);
      setPreviewMessages(prev => [...prev, {
        role: 'assistant',
        content: `I apologize, but I encountered an error processing your request. Could you please try rephrasing or provide more details?`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle switching to the full assistant
  const handleOpenFullAssistant = () => {
    // Transfer the preview conversation to the real assistant
    setMessages(previewMessages);
    // Open the full assistant dialog
    openAssistant();
  };

  // Handle pressing Enter to send message - prevent page jumping
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        bgcolor: '#041E6A', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <AIIcon />
        <Typography variant="subtitle1" fontWeight="medium">
          SimpleTalk Assistant
        </Typography>
      </Box>
      
      {/* Messages area - Fixed height container */}
      <Box 
        ref={chatContainerRef}
        sx={{ 
          flexGrow: 1, 
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          bgcolor: 'white',
          height: '240px', // Fixed height to prevent page jumping
        }}
      >
        {previewMessages.map((message, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <Box
              sx={{
                maxWidth: '85%',
                bgcolor: message.role === 'user' ? '#1976d2' : '#f5f5f5',
                color: message.role === 'user' ? 'white' : 'text.primary',
                borderRadius: 2,
                p: 2,
                boxShadow: 1,
              }}
            >
              {message.role === 'assistant' && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, gap: 1 }}>
                  <AIIcon fontSize="small" sx={{ color: '#1976d2' }} />
                  <Typography variant="caption" fontWeight="bold" sx={{ color: '#1976d2' }}>
                    SimpleTalk
                  </Typography>
                </Box>
              )}
              <Box sx={{ 
                '& p': { margin: '4px 0' },
                '& strong': { fontWeight: 'bold' },
                '& em': { fontStyle: 'italic' }
              }}>
                {typeof message.content === 'string' ? (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                ) : (
                  'Processing...'
                )}
              </Box>
            </Box>
          </Box>
        ))}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Box sx={{ bgcolor: '#f5f5f5', borderRadius: 2, p: 2, boxShadow: 1 }}>
              <CircularProgress size={20} thickness={4} sx={{ color: '#1976d2' }} />
            </Box>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>
      
      {/* Input area */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}>
          <TextField
            fullWidth
            placeholder="Ask how I can help with your simulation..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            size="small"
            disabled={isLoading}
            InputProps={{
              endAdornment: (
                <IconButton 
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  sx={{ color: '#1976d2' }}
                >
                  {isLoading ? <CircularProgress size={20} /> : <SendIcon />}
                </IconButton>
              )
            }}
          />
        </form>
        <Box sx={{ mt: 1, textAlign: 'center' }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#1976d2', 
              cursor: 'pointer', 
              '&:hover': { textDecoration: 'underline' } 
            }}
            onClick={handleOpenFullAssistant}
          >
            Open full assistant
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default HomepageChatPreview;