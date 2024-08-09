'use client';

import { Box, Button, Stack, TextField, useTheme } from '@mui/material';
import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm the Headstarter support assistant. How can I help you today?",
    },
  ]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme(); // Accessing theme for consistent styling

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true);

    setMessage('');
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, { role: 'user', content: message }]),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ];
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
      ]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      alignItems="center"
      bgcolor={theme.palette.background.default} // Background color from the theme
      px={2} // Adding padding for better spacing
    >
      <Stack
        direction={'column'}
        width="100%"
        maxWidth="900px" // Limit the width for readability
        flexGrow={1}
        overflow="auto"
        spacing={3}
        pt={2} // Padding from the top
      >
        {messages.map((message, index) => (
          <Box
            key={index}
            display="flex"
            justifyContent={
              message.role === 'assistant' ? 'flex-start' : 'flex-end'
            }
          >
            <Box
              bgcolor={
                message.role === 'assistant'
                  ? theme.palette.primary.main
                  : theme.palette.secondary.main
              }
              color="white"
              borderRadius={16}
              p={2}
              maxWidth="75%" // Limit the width of the message bubbles
              boxShadow={3} // Add some shadow for depth
            >
              {message.content}
            </Box>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Stack>
      <Stack direction={'row'} spacing={2} width="100%" maxWidth="900px" pb={2}>
        <TextField
          label="Message"
          fullWidth
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          variant="outlined"
        />
        <Button
          variant="contained"
          onClick={sendMessage}
          disabled={isLoading}
        >
          Send
        </Button>
      </Stack>
    </Box>
  );
}
