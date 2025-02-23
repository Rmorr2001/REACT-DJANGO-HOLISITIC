import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  Divider,
  Button,
  Card,
} from '@mui/material';
import {
  Send as SendIcon,
  AutoFixHigh as AIIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';

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
  const [processingResponse, setProcessingResponse] = useState(false);
  const [showTips, setShowTips] = useState(false);
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
      
      // Add a preliminary message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: assistantMessage,
        processing: true
      }]);
      
      // Signal that we're processing the response
      setProcessingResponse(true);
      
      // Process the response (potentially async)
      try {
        const processedMessage = await processResponse(assistantMessage);
        
        // Update the message with the processed content
        setMessages(prev => prev.map((msg, idx) => 
          idx === prev.length - 1 ? { role: 'assistant', content: processedMessage } : msg
        ));
      } catch (processError) {
        console.error('Error processing response:', processError);
        // Keep the original message if processing fails
        setMessages(prev => prev.map((msg, idx) => 
          idx === prev.length - 1 ? { role: 'assistant', content: assistantMessage } : msg
        ));
      } finally {
        setProcessingResponse(false);
      }
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
        <IconButton size="small" onClick={onClose} disabled={isLoading || processingResponse}>
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
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowTips(true)}
              sx={{ mt: 2 }}
            >
              Show AI Usage Tips
            </Button>
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
                    position: 'relative'
                  }}
                >
                  <Box sx={{ 
                    flexGrow: 1, 
                    overflowY: 'auto',
                    fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", sans-serif',
                    '& p': { 
                      margin: '4px 0',
                      lineHeight: 1.6,
                      fontSize: '1rem'
                    },
                    '& pre': { 
                      margin: '8px 0', 
                      whiteSpace: 'pre-wrap',
                      fontFamily: '"Consolas", "Monaco", monospace',
                      fontSize: '0.9rem'
                    },
                    '& code': { 
                      backgroundColor: '#f5f5f5', 
                      padding: '2px 4px', 
                      borderRadius: 4 
                    }
                  }}>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </Box>
                  
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
          disabled={isLoading || processingResponse}
          InputProps={{
            endAdornment: (
              <IconButton 
                onClick={handleSend}
                disabled={isLoading || processingResponse || !input.trim()}
                color="primary"
              >
                {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
              </IconButton>
            )
          }}
        />
        {processingResponse && (
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              Processing actions...
            </Typography>
          </Box>
        )}
      </Box>

      <TipsDialog open={showTips} onClose={() => setShowTips(false)} />
    </Dialog>
  );
};

const TipsDialog = ({ open, onClose }) => (
  <Dialog 
    open={open} 
    onClose={onClose}
    maxWidth="sm"
    fullWidth
  >
    <Card sx={{ 
      p: 3,
      backgroundColor: '#f8fafc',
      boxShadow: 3,
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        mb: 2
      }}>
        <AIIcon color="primary" />
        <Typography variant="h6" fontWeight="bold">AI Assistant Tips</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Typography variant="body1" sx={{ mb: 2 }}>
        🚧 <strong>Beta Status</strong> 🚧
      </Typography>

      <Typography variant="body1" sx={{ mb: 2 }}>
        ✨ <strong>Key Phrases That Work Well</strong>
      </Typography>

      <Box component="ul" sx={{ mb: 3, pl: 2 }}>
        <Typography component="li">"Create a new project for a restaurant simulation"</Typography>
        <Typography component="li">"Help me configure nodes for a retail store"</Typography>
        <Typography component="li">"Analyze my simulation results"</Typography>
        <Typography component="li">"Explain what utilization means"</Typography>
        <Typography component="li">"Show me a basic queue setup"</Typography>
      </Box>

      <Typography variant="body1" sx={{ mb: 2 }}>
        💡 <strong>Configuration Tips</strong>
      </Typography>

      <Box component="ul" sx={{ mb: 3, pl: 2 }}>
        <Typography component="li">Start with simple requests</Typography>
        <Typography component="li">Mention specific numbers (servers, arrival rates)</Typography>
        <Typography component="li">Be explicit about connections between nodes</Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        🚧 This AI assistant is currently in beta. 🚧 <br/> While it's designed to help you with queuing simulations, it might occasionally:
        <Box component="ul" sx={{ pl: 2 }}>
          <Typography component="li">Give confusing responses about JSON configurations</Typography>
          <Typography component="li">Misunderstand complex requests</Typography>
          <Typography component="li">Need rephrasing of questions</Typography>
        </Box>
        Need to start over? Just refresh the page or close and reopen the assistant.
      </Typography>
    </Card>
  </Dialog>
);

export default GeminiChatShell;