const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const PUMBLE_API_URL = 'https://pumble-api-keys.addons.marketplace.cake.com';
const TRELLO_API_URL = 'https://api.trello.com/1/boards';

const {
  TRELLO_API_KEY,
  TRELLO_TOKEN,
  TRELLO_LIST_ID,  // Trello list ID
  PUMBLE_API_KEY,
  PUMBLE_CHANNEL  // Pumble channel name (e.g., "team-1")
} = process.env;

let PUMBLE_CHANNEL_ID = '';  // Dynamically set after finding the correct channel

// Set to store processed message IDs (including previously created Trello cards)
const processedMessages = new Set();

// Helper function to fetch all Trello cards from a specific list
const fetchTrelloCards = async () => {
  try {
    const response = await axios.get(`https://api.trello.com/1/lists/${TRELLO_LIST_ID}/cards`, {
      params: {
        key: TRELLO_API_KEY,
        token: TRELLO_TOKEN
      },
      headers: {
        'Accept': 'application/json'
      }
    });

    const cards = response.data;
    console.log('Fetched Trello Cards:', cards.length);
    
    // Store the message IDs that have already been processed into the set
    cards.forEach(card => {
      if (card.desc.startsWith('Created from Pumble message: ')) {
        const messageId = card.desc.replace('Created from Pumble message: ', '').trim();
        processedMessages.add(messageId);
      }
    });
    
    return cards;
  } catch (error) {
    console.error('Error fetching Trello cards:', error.response?.data || error.message);
  }
};

// Helper function to create a Trello card
const createTrelloCard = async (message) => {
  try {
    const response = await axios.post(
      `https://api.trello.com/1/cards?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}&idList=${TRELLO_LIST_ID}`,
      {
        name: message.text || 'Pumble Message Card',  // Fallback if no message text is provided
        desc: `Created from Pumble message: ${message.id}`,  // Store message ID in description to track
      }
    );
    console.log('Trello Card Created:', response.data);
  } catch (error) {
    console.error('Error creating Trello card:', error.response?.data || error.message);
  }
};

// Fetch all channels and find the channel based on the name
const findTestChannel = async () => {
  try {
    const response = await axios.get(`${PUMBLE_API_URL}/listChannels`, {
      headers: { 'Api-Key': PUMBLE_API_KEY }
    });
    
    const channels = response.data.map(entry => entry.channel);  // Extract 'channel' field from each object
    
    // Find the channel with the name provided in PUMBLE_CHANNEL environment variable
    const testChannel = channels.find(channel => channel.name === PUMBLE_CHANNEL);
    
    if (testChannel) {
      PUMBLE_CHANNEL_ID = testChannel.id;
      console.log(`Found "${PUMBLE_CHANNEL}" channel with ID: ${PUMBLE_CHANNEL_ID}`);
    } else {
      console.error(`Channel "${PUMBLE_CHANNEL}" not found`);
    }
  } catch (error) {
    console.error('Error fetching channels from Pumble:', error.response?.data || error.message);
  }
};

// Fetch messages from the Pumble channel
const fetchPumbleMessages = async () => {
  try {
    // Use the channel name (PUMBLE_CHANNEL) in the request, not the ID
    const response = await axios.get(`${PUMBLE_API_URL}/listMessages`, {
      headers: { 'Api-Key': PUMBLE_API_KEY },
      params: {
        channel: PUMBLE_CHANNEL,  // Use the channel name, not the channel ID
        limit: 100,               // Optional: Set a limit for the number of messages
        cursor: ''                // Optional: Cursor for pagination (can be empty initially)
      },
    });

    const messages = response.data.messages;
    if (messages && messages.length > 0) {
      messages.forEach(async (message) => {
        // Check if the message has already been processed based on the Trello card description
        if (!processedMessages.has(message.id)) {
          await createTrelloCard(message);
          processedMessages.add(message.id);  // Mark message as processed
        } else {
          console.log(`Message ID: ${message.id} has already been processed.`);
        }
      });
    } else {
      console.log('No messages found in the channel.');
    }
  } catch (error) {
    console.error('Error fetching messages from Pumble:', error.response?.data || error.message);
  }
};

// Fetch the channel and Trello cards once at the start, and then poll messages if found
findTestChannel().then(() => {
  if (PUMBLE_CHANNEL_ID) {
    // Fetch all existing Trello cards to prevent duplicates
    fetchTrelloCards().then(() => {
      // Start polling for messages every 60 seconds
      setInterval(fetchPumbleMessages, 10000);
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});