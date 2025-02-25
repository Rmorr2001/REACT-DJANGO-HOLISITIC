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
import { getSystemPrompt } from '../Gemini/AIPromptUtils.js';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { processAIAction, executeAIAction } from '../Gemini/AIAssistantUtils.js';

const API_KEY = 'AIzaSyCoJEcBZOQZFj-xuwKg9prq5w4LBBSM3NM';

const HomepageChatPreview = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [processingResponse, setProcessingResponse] = useState(false);
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
    processResponse,
    userData
  } = useAIAssistant();
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [previewMessages]);

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
      const systemPrompt = getSystemPrompt(location.pathname, userData || {
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
      
      // Add a preliminary message
      setPreviewMessages(prev => [...prev, {
        role: 'assistant',
        content: assistantMessage,
        processing: true
      }]);
      
      // Signal that we're processing the response
      setProcessingResponse(true);
      
      // Process the response using the main assistant's processResponse function
      try {
        // First check if there's an action in the message
        const action = processAIAction(assistantMessage);
        
        if (action) {
          // If there's an action, execute it
          const actionResult = await executeAIAction(action, userData, navigate);
          
          let cleanedResponse = assistantMessage.replace(/```action\n[\s\S]*?\n```/g, '').trim();
          
          if (actionResult.success) {
            if (action.type === 'get_simulation_results' || action.type === 'analyze_simulation') {
              cleanedResponse = actionResult.formattedResults || cleanedResponse;
            } else {
              cleanedResponse += `\n${actionResult.message}`;
            }
            
            // Update the message with the processed content
            setPreviewMessages(prev => prev.map((msg, idx) => 
              idx === prev.length - 1 ? { role: 'assistant', content: cleanedResponse } : msg
            ));
            
            // If action should open full assistant, transfer messages and open it
            if (actionResult.shouldOpenFullAssistant) {
              setMessages(previewMessages);
              openAssistant();
            }
          } else {
            cleanedResponse += `\nI'm sorry, I couldn't complete that action: ${actionResult.message}`;
            setPreviewMessages(prev => prev.map((msg, idx) => 
              idx === prev.length - 1 ? { role: 'assistant', content: cleanedResponse } : msg
            ));
          }
        } else {
          // If no action, just use the regular processResponse
          const processedMessage = await processResponse(assistantMessage);
          
          // Update the message with the processed content
          setPreviewMessages(prev => prev.map((msg, idx) => 
            idx === prev.length - 1 ? { role: 'assistant', content: processedMessage } : msg
          ));
        }
      } catch (processError) {
        console.error('Error processing response:', processError);
        // Keep the original message if processing fails
        setPreviewMessages(prev => prev.map((msg, idx) => 
          idx === prev.length - 1 ? { role: 'assistant', content: assistantMessage } : msg
        ));
      } finally {
        setProcessingResponse(false);
      }
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
        overflow: 'hidden',
        fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif'
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
          fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif'
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
                position: 'relative',
                fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif'
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
              <div style={{ fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif' }}>
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
              
              {/* Processing indicator */}
              {message.processing && (
                <Box sx={{ 
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  m: 1
                }}>
                  <CircularProgress size={16} />
                </Box>
              )}
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
            disabled={isLoading || processingResponse}
            InputProps={{
              endAdornment: (
                <IconButton 
                  type="submit"
                  disabled={isLoading || processingResponse || !input.trim()}
                  sx={{ color: '#1976d2' }}
                >
                  {isLoading ? <CircularProgress size={20} /> : <SendIcon />}
                </IconButton>
              ),
              style: { fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif' }
            }}
            inputProps={{
              style: { fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif' }
            }}
          />
        </form>
        {processingResponse && (
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              Processing actions...
            </Typography>
          </Box>
        )}
        <Box sx={{ mt: 1, textAlign: 'center' }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#1976d2', 
              cursor: 'pointer', 
              '&:hover': { textDecoration: 'underline' },
              fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif'
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