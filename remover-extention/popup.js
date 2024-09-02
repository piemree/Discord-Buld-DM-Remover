document.getElementById('deleteButton').addEventListener('click', function() {
  const messageCount = document.getElementById('messageCount').value;
  
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: "deleteMessages", messageCount: messageCount}, function(response) {
      document.getElementById('status').textContent = "Check console for results";
    });
  });
});