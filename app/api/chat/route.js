import { NextResponse } from 'next/server';
import OpenAI from 'openai'; 

const systemPrompt = `Welcome to Headstarter AI's customer support! I'm here to assist you with any questions or issues you may have regarding our AI-powered interview platform for software engineering jobs. Here's how I can help:
1. Account Management: Assistance with account creation, login issues, profile updates, and password resets.
2. Interview Preparation: Guidance on how to prepare for AI-powered interviews, including tips on answering questions, understanding feedback, and using our preparation resources.
3. Technical Support: Help with any technical issues you might encounter on our platform, including problems with the interview process, connectivity issues, or system errors.
4. Interview Process: Information on how our AI-powered interviews work, the types of questions asked, and the evaluation process.
5. Subscription and Billing: Details about our subscription plans, billing inquiries, and payment issues.
6. Feedback and Improvement: Collecting feedback to help us improve our platform and user experience.
7. General Inquiries: Any other questions or concerns you may have about HeadstarterAI.
Please provide as much detail as possible regarding your query, and I'll do my best to assist you promptly.`;

// POST function to handle incoming requests
export async function POST(req) {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1", // Base URL for OpenRouter.ai
    apiKey: process.env.OPENROUTER_API_KEY, // Use OpenRouter API key from .env.local file
    defaultHeaders: {
      "HTTP-Referer": process.env.SITE_URL, // Optional: Referer for OpenRouter rankings
      "X-Title": process.env.SITE_NAME, // Optional: Site name for OpenRouter rankings
    },
  });

  const data = await req.json(); // Parse the JSON body of the incoming request

  // Create a chat completion request to the Llama 3.1 model via OpenRouter.ai
  const completion = await openai.chat.completions.create({
    messages: [{ role: 'system', content: systemPrompt }, ...data], // Include the system prompt and user messages
    model: 'meta-llama/llama-3.1-8b-instruct:free', // Update model name to Llama 3.1 8B
    stream: true, // Enable streaming responses
  });

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            const text = encoder.encode(content);
            controller.enqueue(text);
          }
        }
      } catch (err) {
        console.error('Error during streaming:', err);
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream); // Return the streaming response
}
