# Pumble-Trello Integration

This project is a Node.js-based application that integrates Pumble with Trello. It listens for messages from a specified Pumble channel and creates Trello cards in a specific Trello list for each new message. It ensures that no duplicate cards are created, even if the program is restarted or messages are polled multiple times.

## Overview

The core functionality of this application is:
1. **Fetch Messages from Pumble**: The app polls a specified Pumble channel and fetches recent messages.
2. **Create Trello Cards**: For each new message in the Pumble channel, a Trello card is created in a specific Trello list.
3. **Duplicate Prevention**: The app ensures that Trello cards are only created once for each message by checking the list of existing Trello cards and tracking processed messages. Even after restarting the app, it avoids creating duplicate cards for messages that have already been processed.
4. **Periodic Polling**: The app continuously polls the Pumble channel at a set interval (60 seconds) to fetch new messages and process them.

## How It Works

The application works in a sequence of steps to achieve the integration between Pumble and Trello.

### 1. **Environment Variables**
The app requires several environment variables to be set in order to function. These include API keys for both Trello and Pumble, the ID of the Trello list where new cards will be created, and the name of the Pumble channel to monitor for new messages.

### Required Environment Variables:
- **TRELLO_API_KEY**: The API key for Trello.
- **TRELLO_TOKEN**: The authentication token for Trello.
- **TRELLO_LIST_ID**: The ID of the Trello list where cards will be created.
- **PUMBLE_API_KEY**: The API key for Pumble.
- **PUMBLE_CHANNEL**: The name of the Pumble channel (e.g., `"team-1"`) from which messages will be fetched.

#### Example `.env` File:
```bash
TRELLO_API_KEY=your-trello-api-key
TRELLO_TOKEN=your-trello-token
TRELLO_LIST_ID=your-trello-list-id
PUMBLE_API_KEY=your-pumble-api-key
PUMBLE_CHANNEL=team-1
```

### How to Get API Keys for Pumble and Trello

#### 1. **Getting an API Key from Pumble:**

Pumble allows users to easily generate API keys via its built-in integration. Here’s the process to obtain the API key:

- **Step 1:** Go to your Pumble workspace and click on the **+Add apps** button located at the bottom of the left sidebar.
- **Step 2:** Click **Install** next to the "API app." If the app is already installed, you will need to authorize it.
- **Step 3:** Select the workspace where the key will be used and click **Allow** to complete the installation.
- **Step 4:** To generate an API key, in any Pumble channel, type `/api-keys generate` and press Enter.
- **Step 5:** You will receive a message containing the generated API key, which will not be visible to other users. Copy this key for future use.

To manage API keys, you can also list or delete keys with the following commands:
- `/api-keys list` – Lists all API keys.
- `/api-keys delete [API_KEY]` – Deletes the specified API key.

Pumble’s API key grants you access to various functionalities such as sending messages, replying, and creating channels. For detailed usage and request formats, visit the [Pumble API documentation](https://pumble.com/help/integrations/automation-workflow-integrations/api-keys-integration).

#### 2. **Getting an API Key from Trello:**

To generate an API key for Trello, follow these steps:

- **Step 1:** Visit the Trello API key request page: [Trello API Keys](https://trello.com/app-key).
- **Step 2:** Log in with your Trello account credentials.
- **Step 3:** Your API key will be displayed on the page. Copy this key for later use.

To use Trello’s API for private boards or actions that require user authorization (such as creating cards or adding lists), you will also need a **Trello token**:
- **Step 4:** Click on the **"Token"** link below the API key. You will be prompted to authorize access to your Trello account.
- **Step 5:** After authorizing, a token will be generated, which you can use along with your API key.

With both the API key and token, you can access Trello's API, including actions like creating cards, managing boards, and more. Full documentation can be found [here](https://developer.atlassian.com/cloud/trello/).

### 2. **Fetching Trello Cards**

The app first checks the existing Trello cards in the specified list to ensure no duplicate cards are created. When Trello cards are created, the Pumble message ID is embedded into the card's description. This allows the app to track which messages have already been processed.

**Function: `fetchTrelloCards`**

- Fetches all cards from the Trello list (`TRELLO_LIST_ID`).
- Extracts the Pumble message ID from the description of each card.
- Stores the message IDs in a `Set` called `processedMessages` to prevent duplicates.

### 3. **Fetching Pumble Channels**

The app then fetches the list of channels from Pumble to find the channel ID for the specified channel name. This is done to dynamically locate the Pumble channel the app will be monitoring for new messages.

**Function: `findTestChannel`**

- Fetches all Pumble channels using the Pumble API.
- Locates the specified channel (`PUMBLE_CHANNEL`) by name.
- Stores the channel ID (`PUMBLE_CHANNEL_ID`) for use in message polling.

### 4. **Fetching Messages from Pumble**

Once the correct Pumble channel is located, the app fetches recent messages from that channel. This process is repeated every 60 seconds, so new messages are continually checked.

**Function: `fetchPumbleMessages`**

- Polls the Pumble API to fetch the latest messages from the specified Pumble channel.
- For each message, the function checks whether the message ID has already been processed by checking the `processedMessages` set.
- If the message has not been processed, a new Trello card is created for that message.

### 5. **Creating Trello Cards**

For each new message from Pumble that hasn't been processed, the app creates a new Trello card in the specified Trello list.

**Function: `createTrelloCard`**

- A Trello card is created for each unprocessed message.
- The card's name is the message text from Pumble.
- The card's description stores the Pumble message ID, allowing the app to track which messages have been processed.

### 6. **Duplicate Prevention**

The app prevents duplicate Trello cards in two ways:
1. **Checking Existing Cards**: Before processing new messages, the app checks all existing Trello cards in the list and stores the message IDs embedded in the card descriptions.
2. **Processed Messages Set**: A `Set` called `processedMessages` stores the IDs of messages that have already been processed, ensuring that no duplicate Trello cards are created, even if the app is restarted or the same messages are fetched again.

### 7. **Polling for New Messages**

The app runs continuously and polls for new messages every 60 seconds. If new messages are found that haven't been processed, it creates Trello cards for them. The polling interval can be adjusted if needed.

### 8. **Adding Checklists to Trello Cards (Optional)**

Each Trello card can also include a checklist. In this example, the app adds a sample checklist with predefined items to each card.

**Function: `addChecklistToCard`**

- Adds a checklist with predefined items ("Task 1", "Task 2", "Task 3") to each Trello card after it is created.
- This is an optional feature that can be customized or removed as needed.

### 9. **Program Flow**

1. The program starts by fetching all existing Trello cards to build a list of processed message IDs.
2. It then locates the correct Pumble channel by its name.
3. Once the Pumble channel is identified, it begins polling for new messages.
4. For each new message, if the message has not already been processed, it creates a new Trello card and adds the message ID to the `processedMessages` set to ensure no duplicate cards are created.
5. The program continues to poll for new messages every 60 seconds.

## How to Run the Program

### 1. **Install Dependencies**
Make sure you have Node.js installed on your system. Clone the repository and navigate to the project folder. Then, install the necessary dependencies by running:

```bash
npm install
```

### 2. **Set Environment Variables**
Create a `.env` file in the root of the project and set the required environment variables:

```bash
TRELLO_API_KEY=your-trello-api-key
TRELLO_TOKEN=your-trello-token
TRELLO_LIST_ID=your-trello-list-id
PUMBLE_API_KEY=your-pumble-api-key
PUMBLE_CHANNEL=team-1  # Name of the Pumble channel to monitor
```

### 3. **Run the Program**
After setting up the environment variables, start the program by running:

```bash
node index.js
```

The app will now run and start polling the specified Pumble channel for new messages and creating Trello cards as needed.

## Additional Customizations

### Polling Interval
By default, the app polls for new Pumble messages every 60 seconds. This interval can be changed by modifying the interval in the `setInterval` function inside the `findTestChannel` method:

```javascript
setInterval(fetchPumbleMessages, 60000);  // Polls every 60 seconds
```

You can adjust the `60000` milliseconds value to any other value as needed.

### Checklist Items
The app adds a predefined checklist to each Trello card. You can customize the checklist items in the `addChecklistToCard` function.

```javascript
await addChecklistToCard(cardId, ['Task 1', 'Task 2', 'Task 3']);
```

## Logging

The app logs the following:
- When a Trello card is successfully created.
- When a message has already been processed and will not have a duplicate Trello card created.
- Errors during the API requests to either Pumble or Trello.

## Conclusion

This project integrates Pumble and Trello to automatically create Trello cards for messages in a Pumble channel. It uses various techniques, including storing processed message IDs and checking existing Trello cards, to prevent duplicate cards from being created. The program runs continuously, polling the Pumble channel for new messages at regular intervals.