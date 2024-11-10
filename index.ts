import "dotenv/config";
import { config } from "dotenv";
import neynarClient from "./neynarClient";

// Force dotenv to load
config();


const server = Bun.serve({
    port: 3000,
    async fetch(req) {
      try {
        if (req.method !== 'POST') {
          return new Response('Method not allowed', { status: 405 });
        }

        const contentType = req.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          return new Response('Content-Type must be application/json', { status: 400 });
        }

        const body = await req.text();
        console.log('Raw webhook body:', body);
        console.log('Body length:', body.length);

        if (!body) {
          return new Response('Empty request body', { status: 400 });
        }

        let hookData;
        try {
          hookData = JSON.parse(body);
        } catch (parseError: unknown) {
          console.error('JSON Parse error:', parseError);
          return new Response(`Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`, { status: 400 });
        }
        
        if (!hookData?.data?.author?.username || !hookData?.data?.hash) {
          return new Response('Invalid webhook data format', { status: 400 });
        }

        // Add check for specific user ID
        if (hookData.data.author.fid !== 11528) {
          return new Response('Not the target user', { status: 200 });
        }

        const reply = await neynarClient.publishCast(
          process.env.SIGNER_UUID!,
          `gm ${hookData.data.author.username}`,
          {
            replyTo: hookData.data.hash,
          }
        );
  
        return new Response(`Replied to the cast with hash: ${reply.hash}`);
      } catch (e: any) {
        return new Response(e.message, { status: 500 });
      }
    },
  });
  
  console.log(`Listening on localhost:${server.port}`);