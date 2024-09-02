let authToken = null;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "deleteMessages") {
    deleteUserMessages(request.messageCount);
  }
});

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

    // Check if there are more messages to delete
    const remainingMessages = getUserMessages();
    if (remainingMessages.length > 0) {
      console.log('More messages found. Continuing deletion...');
      await deleteMessages(); // Recursive call to delete remaining messages
    } else {
      console.log('Deletion process completed.');
    }
  }

  await deleteMessages();
}

// Observe for new messages
const observeNewMessages = () => {
  const targetNode = document.querySelector('ol[data-list-id="chat-messages"]');
  if (!targetNode) return;

  const config = { childList: true, subtree: true };
  const callback = function(mutationsList, observer) {
    for(let mutation of mutationsList) {
      if (mutation.type === 'childList') {
        console.log('New messages detected');
        // You can trigger any action here when new messages are detected
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
};

// Call this function when the content script loads
observeNewMessages();