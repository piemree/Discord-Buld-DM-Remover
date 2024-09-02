# Discord Message Cleaner

This project provides a tool to help users bulk delete their own messages in the Discord web application. It offers two usage methods: a Chrome extension or a JavaScript function that can be run directly in the browser console.

## ⚠️ Warning

Please consider the following points before using this tool:

1. This tool does not use Discord's official API and may violate Discord's Terms of Service.
2. Bulk message deletion is irreversible. There is no way to recover deleted messages.
3. Using this tool may result in risks such as account suspension.
4. This tool is created for educational and personal use. Users are responsible for any misuse.

## Usage as a Chrome Extension

1. Clone this repository or download it as a ZIP file.
2. Go to `chrome://extensions/` in your Chrome browser.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the "remover-extention" folder.
5. Open the Discord web application and click on the extension icon.
6. Enter the number of messages you want to delete and click the "Delete Messages" button.

## Usage via Console

1. Open the Discord web application and navigate to the channel where you want to delete messages.
2. Open your browser's developer tools (usually by pressing F12).
3. Paste the following code into the Console tab:

```javascript
let authToken = null;

async function getAuthToken() {
  if (authToken) return authToken;

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.id = 'get-auth-token-script';
    script.textContent = `
      if (typeof getAuthTokenForExtension === 'undefined') {
        function getAuthTokenForExtension() {
          const authToken = (webpackChunkdiscord_app.push([[''],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}]),m).find(m=>m?.exports?.default?.getToken!==void 0).exports.default.getToken();
          document.dispatchEvent(new CustomEvent('auth_token_ready', { detail: authToken }));
        }
      }
      getAuthTokenForExtension();
    `;
    document.body.appendChild(script);
    document.addEventListener('auth_token_ready', function(e) {
      authToken = e.detail;
      resolve(authToken);
    }, { once: true });
  });
}

async function deleteUserMessages(messageCount) {
  const channelId = window.location.href.split('/').pop();

  authToken = await getAuthToken();

  function getUserMessages() {
    return Array.from(document.querySelectorAll('li[id^="chat-messages-"]'))
      .reverse()
      .filter(li => {
        const editButton = li.querySelector('div[aria-label="Edit"]');
        return !!editButton;
      })
      .map(li => {
        const accessoriesDiv = li.querySelector('div[id^="message-accessories-"]');
        if (accessoriesDiv) {
          const idParts = accessoriesDiv.id.split('-');
          return idParts[idParts.length - 1];
        }
        return null;
      })
      .filter(id => id !== null)
      .slice(0, messageCount);
  }

  async function deleteMessages() {
    const messageIds = getUserMessages();
    console.log(`Last ${messageIds.length} messages to be deleted:`);
    console.log(messageIds);

    for (const messageId of messageIds) {
      const url = `https://discord.com/api/v9/channels/${channelId}/messages/${messageId}`;
      try {
        const response = await fetch(url, {
          method: 'DELETE',
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        });
      
        if (!response.ok) {
          console.error(`Failed to delete message: ${messageId}`, response.statusText);
        } else {
          console.log(`Message deleted: ${messageId}`);
        }
      
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error occurred: ${messageId}`, error);
      }
    }

    const remainingMessages = getUserMessages();
    if (remainingMessages.length > 0) {
      console.log('More messages found. Continuing deletion...');
      await deleteMessages();
    } else {
      console.log('Deletion process completed.');
    }
  }

  await deleteMessages();
}

// To call the function:
// deleteUserMessages(10); // To delete the last 10 messages
```

4. After pasting the code, remove the comment from the last line and enter the desired number of messages:

```javascript
deleteUserMessages(10); // To delete the last 10 messages
```

5. Press Enter to run the function.

## Contributing

If you'd like to contribute to this project, please open a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the [MIT License](LICENSE).

This README file provides an overview of the project, usage instructions for both the Chrome extension and console methods, and important warnings. It also includes the code block for console usage, allowing users to easily copy and paste it into their browser's console when using the Discord web application.

Remember to include the appropriate license file in your repository to match the license mentioned in the README.
