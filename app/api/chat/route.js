import { NextResponse } from 'next/server'; // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai'; // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `Welcome to HeadstarterAI's customer support! I'm here to assist you with any questions or issues you may have regarding our AI-powered interview platform for software engineering jobs. Here's how I can help:
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
    apiKey: process.env.OPEN_API_KEY, // Ensure your .env.local file is correctly configured
  });
  const data = await req.json(); // Parse the JSON body of the incoming request

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{ role: 'system', content: systemPrompt }, ...data], // Include the system prompt and user messages
    model: 'gpt-4', // Use GPT-4 model
    stream: true, // Enable streaming responses
  });

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder(); // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content; // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content); // Encode the content to Uint8Array
            controller.enqueue(text); // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        console.error('Error during streaming:', err); // Log the error for debugging
        controller.error(err); // Handle any errors that occur during streaming
      } finally {
        controller.close(); // Close the stream when done
      }
    },
  });

  return new Response(stream); // Return the streaming response
}
