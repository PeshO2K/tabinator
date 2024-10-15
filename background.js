// LIMIT THE NUMBER OF TABS
 let MAX_TABS = Infinity; // Set the default maximum number of open tabs allowed
const PINNED_URLS = [
  'https://chatgpt.com/c/6704b0a8-8c24-8011-ac87-560bdabb2ee2',
  'https://developer.chrome.com',
  'chrome://extensions/',
]; // URLs to auto-pin

function getNumberTabs(){
  return new Promise((resolve)=>{
    let numberTabs;
    chrome.tabs.query({},(tabs)=>{
      numberTabs=tabs.length;
      resolve(tabs);
    });
    
  });
};
// LIMITING NUMMBER OF TABS OPEN FUNCTIONALITY
function enforceTabLimit() {
  return new Promise((resolve) => {
    chrome.tabs.query({}, function (tabs) {
      const openTabsCount = tabs.length;

      if (openTabsCount > MAX_TABS) {
        const nonPinnedTabs = tabs
          .filter((tab) => !tab.pinned)
          .sort((a, b) => a.lastAccessed - b.lastAccessed);

        let excessTabsCount = openTabsCount - MAX_TABS;
        let removedTabs=[];

        // Close the oldest non-pinned tabs
        for (let i = 0; i < excessTabsCount && i < nonPinnedTabs.length; i++) {
          removedTabs.push(nonPinnedTabs[i].id)
          chrome.tabs.remove(nonPinnedTabs[i].id);
        }
        const filteredTabs = tabs.filter(
          (tab) => !removedTabs.includes(tab.id)
        );

        // After closing tabs, notify the popup script
        chrome.runtime.sendMessage({
          action: 'tabsUpdated',
          tabsCount: tabs.length - excessTabsCount,
          newTabs: filteredTabs,
        });
      }
      else{
        chrome.runtime.sendMessage({
          action: 'limitUpdated',
          newLimit: MAX_TABS,          
        });

      }
      resolve();
    });
  });
}

// function enforceTabLimit() {
//   return new Promise((resolve) => {
//     chrome.tabs.query({}, async function (tabs) {
//       let openTabsCount = tabs.length;

//       if (openTabsCount > MAX_TABS) {
//         // Filter non-pinned tabs and sort them by lastAccessed time
//         const nonPinnedTabs = tabs
//           .filter((tab) => !tab.pinned)
//           .sort((a, b) => a.lastAccessed - b.lastAccessed);

//         let excessTabsCount = openTabsCount - MAX_TABS;
//         let removedTabs=[]

//         // Close the oldest non-pinned tabs
//         for (let i = 0; i < excessTabsCount && i < nonPinnedTabs.length; i++) {
//           removedTabs.push(nonPinnedTabs[i].id);
//           chrome.tabs.remove(nonPinnedTabs[i].id);       
        
//         }
//         const filteredTabs = tabs.filter(
//           (tab) => !removedTabs.includes(tab.id)
//         );

//         chrome.runtime.sendMessage({
//           action: 'tabsUpdated',
//           tabsCount: tabs.length - excessTabsCount,
//           newTabs: filteredTabs,
//         });
//         resolve();
//       }
//     });
//   });
// }
// function enforceTabLimit() {

//   chrome.tabs.query({}, function (tabs) {
//     let openTabsCount = tabs.length;

//     if (openTabsCount > MAX_TABS) {
//       // Filter non-pinned tabs and sort them by lastAccessed time
//       const nonPinnedTabs = tabs
//         .filter((tab) => !tab.pinned)
//         .sort((a, b) => a.lastAccessed - b.lastAccessed);

//       let excessTabsCount = openTabsCount - MAX_TABS;

//       // Close the oldest non-pinned tabs
//       for (let i = 0; i < excessTabsCount && i < nonPinnedTabs.length; i++) {
//         chrome.tabs.remove(nonPinnedTabs[i].id);
//       }
//     }
//   });
// }


// Listen for messages from the popup to dynamically set max tabs
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setMaxTabs') {
    setMaxTabs(request.newLimit, sendResponse);
    // Required to keep the message channel open for async response
    return true;
  } else {
    sendResponse({ status: 'error', message: 'Invalid action' });
  }
});


// Function to dynamically set the maximum allowed tabs
function setMaxTabs(newLimit, callback) {
  chrome.tabs.query({ pinned: true }, async function (pinnedTabs) {
    const pinnedCount = pinnedTabs.length;
    const allTabs = await getNumberTabs();
    const numTabs =  allTabs.length;
    
    
    

    // Ensure newLimit is not less than the number of pinned tabs and greater than 0
    if (newLimit > 0 && newLimit >= pinnedCount) {
      MAX_TABS = newLimit;
      await enforceTabLimit(); // Enforce limit whenever it's updated
      callback({ status: 'success', message: `Max tabs limit set to: ${MAX_TABS}`, numbertabs:numTabs });
    } else {
      callback({
        status: 'error',
        message: `Invalid limit: Must be greater than or equal to the number of pinned tabs (${pinnedCount}).`,
      });
    }
  });
}


chrome.tabs.onCreated.addListener(() => {
  enforceTabLimit();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Automatically pin tabs from the defined URLs
  if (PINNED_URLS.includes(tab.url) && !tab.pinned) {
    chrome.tabs.update(tabId, { pinned: true });
  }
  enforceTabLimit();
});

chrome.tabs.onRemoved.addListener(() => {
  enforceTabLimit();
});







//************************************************ */
// let  MAX_TABS = 5; // Set the maximum number of open tabs allowed
// const PINNED_URLS = [
//   'https://chatgpt.com/c/6704b0a8-8c24-8011-ac87-560bdabb2ee2',
//   'https://developer.chrome.com',
// ]; // URLs to auto-pin

// chrome.tabs.onCreated.addListener(() => {
//   enforceTabLimit();
// });

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   // Automatically pin tabs from the defined URLs
//   if (PINNED_URLS.includes(tab.url) && !tab.pinned) {
//     chrome.tabs.update(tabId, { pinned: true });
//   }
//   enforceTabLimit();
// });

// chrome.tabs.onRemoved.addListener(() => {
//   enforceTabLimit();
// });

// // Function to dynamically set the maximum allowed tabs
// function setMaxTabs(newLimit) {
//   chrome.tabs.query({ pinned: true }, function (pinnedTabs) {
//     const pinnedCount = pinnedTabs.length;

//     // Ensure newLimit is not less than the number of pinned tabs and not 0
//     if (newLimit > 0 && newLimit >= pinnedCount) {
//       MAX_TABS = newLimit;
//       console.log(`Max tabs limit set to: ${MAX_TABS}`);
//       enforceTabLimit(); // Enforce limit whenever it's updated
//     } else {
//       console.error(
//         `Invalid limit: must be greater than or equal to ${pinnedCount} and greater than 0.`
//       );
//     }
//   });
// }

// function enforceTabLimit() {
//   chrome.tabs.query({}, function (tabs) {
//     let openTabsCount = tabs.length;

//     if (openTabsCount > MAX_TABS) {
//       // Filter non-pinned tabs and sort them by lastAccessed time
//       const nonPinnedTabs = tabs
//         .filter((tab) => !tab.pinned)
//         .sort((a, b) => a.lastAccessed - b.lastAccessed);

//       let excessTabsCount = openTabsCount - MAX_TABS;

//       // Close the oldest non-pinned tabs
//       for (let i = 0; i < excessTabsCount && i < nonPinnedTabs.length; i++) {
//         chrome.tabs.remove(nonPinnedTabs[i].id);
//       }
//     }
//   });
// }
// *******************************************
// function enforceTabLimit() {
//   chrome.tabs.query({}, function (tabs) {
//     let openTabsCount = tabs.length;

//     if (openTabsCount > MAX_TABS) {
//       // Sort tabs by whether they're pinned, then by creation order
//       tabs.sort((a, b) =>
//         a.pinned === b.pinned ? a.id - b.id : a.pinned ? -1 : 1
//       );

//       // Close excess tabs that are not pinned
//       for (let i = MAX_TABS; i < openTabsCount; i++) {
//         if (!tabs[i].pinned) {
//           chrome.tabs.remove(tabs[i].id);
//         }
//       }
//     }
//   });
// }
// function enforceTabLimit() {
//   chrome.tabs.query({}, function (tabs) {
//     let openTabsCount = tabs.length;

//     if (openTabsCount > MAX_TABS) {
//       // Sort tabs by whether they're pinned, then by lastAccessed time
//       tabs.sort((a, b) =>
//         a.pinned === b.pinned
//           ? a.lastAccessed - b.lastAccessed
//           : a.pinned
//           ? -1
//           : 1
//       );

//       // Close the oldest non-pinned tab
//       for (let i = 0; i < openTabsCount; i++) {
//         if (!tabs[i].pinned && openTabsCount > MAX_TABS) {
//           chrome.tabs.remove(tabs[i].id);
//           openTabsCount--;
//         }
//       }
//     }
//   });
// }
// function enforceTabLimit() {
//   chrome.tabs.query({}, function (tabs) {
//     let openTabsCount = tabs.length;

//     if (openTabsCount > MAX_TABS) {
//       // Filter non-pinned tabs and sort them by lastAccessed time
//       const nonPinnedTabs = tabs
//         .filter((tab) => !tab.pinned)
//         .sort((a, b) => a.lastAccessed - b.lastAccessed);

//       let excessTabsCount = openTabsCount - MAX_TABS;

//       // Close the oldest non-pinned tabs
//       for (let i = 0; i < excessTabsCount && i < nonPinnedTabs.length; i++) {
//         chrome.tabs.remove(nonPinnedTabs[i].id);
//       }
//     }
//   });
// }
