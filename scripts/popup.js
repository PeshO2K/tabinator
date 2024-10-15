
  let selectedTabs = [];
  let pinnedTabList ;
  let unpinnedTabList;
  let pinBtn;
  let groupBtn;
  let ungroupBtn;
  let unpinBtn;
  let closeBtn;
  let groupTitleInput;
  let groupColorPicker;
  let confirmCreateGroupBtn; 
  let tabGroupInputs;
  let maxTabsInput;
  let numbertabs; 

document.addEventListener('DOMContentLoaded', async function () {
  maxTabsInput = document.getElementById('maxTabsInput');
  const setMaxTabsBtn = document.getElementById('setMaxTabsBtn');
  const feedbackMessage = document.getElementById('limitSetBanner');

  pinBtn = document.getElementById('pinBtn');
  groupBtn = document.getElementById('groupBtn');
  unpinBtn = document.getElementById('unpinBtn');
  ungroupBtn = document.getElementById('ungroupBtn');
  closeBtn = document.getElementById('closeBtn');
  groupTitleInput = document.getElementById('groupTitleInput');
  groupColorPicker = document.getElementById('groupColorPicker');
  confirmCreateGroupBtn = document.getElementById('confirmCreateGroupBtn');
  tabGroupInputs = document.getElementById('tabGroupInputs');

  pinnedTabList = document.getElementById('pinnedTabList');
  unpinnedTabList = document.getElementById('unpinnedTabList');


  
  await getMaxTabs();

  function setMaxTabs(newMaxTabs) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'setMaxTabs', newLimit: newMaxTabs },
        function (response) {
          if (response && response.status === 'success') {
            // Check if response is defined
            // Save the new maxTabs value in chrome.storage.sync only if background succeeds
            chrome.storage.sync.set({ maxTabs: newMaxTabs }, function () {
              feedbackMessage.textContent = `Max tabs limit set to: ${newMaxTabs}`;
              feedbackMessage.classList.remove('errormsg');
              maxTabsInput.value = newMaxTabs; // Update the input value to the new limit
              resolve(); // Resolve the promise after setting storage
            });
            chrome.tabs.query({}, function (tabs) {
              console.log('{Debugger} open tabs', tabs.length);
            });
            console.log("[Debugger-setMaxTabs-numbertabs]",response.numbertabs);
            // If currentTabs is asynchronous, use await if this function is marked as async
            // currentTabs(); // Ensure this is handled correctly if it returns a promise
          } else {
            feedbackMessage.textContent = response
              ? `${response.message}`
              : 'Error: No response';
            feedbackMessage.classList.add('errormsg');
            resolve(); // Resolve even in case of an error
          }
        }
      );
    });
  }






 

  

  async function myCallback() {
    
    // await getMaxTabs();
    const newMaxTabs = parseInt(maxTabsInput.value);
    if (isNaN(newMaxTabs) || newMaxTabs === 0) {
      feedbackMessage.textContent = `Invalid limit: Cannot be zero (0).`;
      feedbackMessage.classList.add('errormsg');
    } else {
      await setMaxTabs(newMaxTabs);
      
    }
  }
  currentTabs();

  maxTabsInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      myCallback();
    }
  });

  // Add event listener to the button
  setMaxTabsBtn.addEventListener('click', myCallback);
  // Event listeners for buttons
  groupBtn.addEventListener('click', function () {
    tabGroupInputs.style.display =
      tabGroupInputs.style.display === 'none' ? 'block' : 'none';
  });

  pinBtn.addEventListener('click', pinTabs);
  unpinBtn.addEventListener('click', unpinTabs);
  closeBtn.addEventListener('click', closeTabs);
  confirmCreateGroupBtn.addEventListener('click', createTabGroup); // Event listener for grouping tabs
  ungroupBtn.addEventListener('click', ungroupTabs);
});

function getMaxTabs() {
  return new Promise((resolve) => {
    chrome.storage.sync.get('maxTabs', function (data) {
      const savedMaxTabs = data.maxTabs;
      if (savedMaxTabs) {
        maxTabsInput.value = savedMaxTabs; // Set the input to the saved value
      }
      resolve(savedMaxTabs); // Resolve the promise with the saved value
    });
  });
}

function getRGBAColor(color, alpha) {
  const colors = {
    red: '255, 0, 0',
    orange: '255, 165, 0',
    yellow: '255, 255, 0',
    green: '0, 128, 0',
    cyan: '0, 255, 255',
    blue: '0, 0, 255',
    purple: '128, 0, 128',
    pink: '255, 192, 203',
    // Add more colors as needed
  };

  // If the color is in the defined colors list, return the RGBA string
  if (colors[color]) {
    return `rgba(${colors[color]}, ${alpha})`;
  }

  // If the color is a hex code, convert to RGBA
  if (color.startsWith('#')) {
    let r = 0,
      g = 0,
      b = 0;

    // 3 digits
    if (color.length === 4) {
      r = parseInt(color[1] + color[1], 16);
      g = parseInt(color[2] + color[2], 16);
      b = parseInt(color[3] + color[3], 16);
    }
    // 6 digits
    else if (color.length === 7) {
      r = parseInt(color[1] + color[2], 16);
      g = parseInt(color[3] + color[4], 16);
      b = parseInt(color[5] + color[6], 16);
    }

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Fallback to transparent if color is not recognized
  return `rgba(0, 0, 0, 0)`;
}


function fetchTabGroups() {
  chrome.tabGroups.query({}, function (groups) {
    const groupTabList = document.getElementById('groupTabList');
    groupTabList.innerHTML = ''; // Clear the current list

    if (groups.length === 0) {
      groupTabList.innerHTML = '<p class="not-found" >No tab groups found.</p>';
      return;
    }

    groups.forEach((group) => {
      let groupTabs
      const groupDiv = document.createElement('div');
      groupDiv.classList.add('tab-group');
      groupDiv.id = `group-${group.id}`

      const circleElement = document.createElement('div');
      circleElement.classList.add('tab-group-circle');
      circleElement.style.backgroundColor = group.color || 'transparent';

      // Create the title for the group
      const titleElement = document.createElement('span');
      titleElement.classList.add('tab-group-title');
      titleElement.textContent = group.title || 'Unnamed Group';

      // Append circle and title to the group element
      groupDiv.appendChild(circleElement);
      groupDiv.appendChild(titleElement);



      // Fetch tabs in this group and update their background color to math the groups'
      chrome.tabs.query({ groupId: group.id }, function (tabs) {
        if (tabs.length === 0) {
          tabListContainer.innerHTML =
            '<p class="not-found">No tabs in this group.</p>';
            groupDiv.style.justifyContent='center';
            groupDiv.style.backgroundColor= 'yellow';
        } else {
          groupTabs = tabs
          tabs.forEach((tab) => {
            //get the element with tab id
            thisTab = document.getElementById(`li-tab-${tab.id}`);
            // thisTab.style.backgroundColor = group.color || 'transparent';
            const rgbaColor = getRGBAColor(group.color || 'transparent', 0.4); // 0.7 for slight transparency
            thisTab.style.backgroundColor = rgbaColor;
            // thisTab.style.color = 'black';
          });
        }
      });
      // Optionally add styles to make it look distinct
      groupDiv.style.padding = '5px';
      groupDiv.style.margin = '5px 0';
      // groupDiv.style.color = 'black';

      groupDiv.addEventListener('click',function(){
        console.log (this.id)
        // select all tabs of the group
        if (groupTabs){
          groupTabs.forEach((tab)=>
            {
              const tabInGroup = document.getElementById(`tab-${tab.id}`);

              tabInGroup.checked = true;
              console.log(tab.title, tabInGroup.checked);
              console.log();
              // Create and dispatch the change event
              const event = new Event('change', {
                bubbles: true,
                cancelable: true,
              });

              tabInGroup.dispatchEvent(event);
              
            });
            
        }
        // currentTabs();

      });

      groupTabList.appendChild(groupDiv);
    });
  });
}



function someFunction(tabs){
  if (tabs)
    {const openTabsCount = tabs.length;
      const pinnedTabs = tabs.filter((tab) => tab.pinned);
      const unPinnedTabs = tabs.filter((tab) => !tab.pinned);
      // const tabLimit = maxTabsInput.value;
      // await getMaxTabs();
      const tabLimit = maxTabsInput.value;
      const availableSlots = tabLimit - openTabsCount;
      console.log(availableSlots);

      const approachingLimit = openTabsCount>=(0.9 * tabLimit);
      const eightyLimit = openTabsCount >= (0.8 * tabLimit) && openTabsCount < (0.9 * tabLimit);
      const openTabCountElement =  document.getElementById(
        'openTabCount'
      )
      openTabCountElement.className="tab-counter"

      approachingLimit
        ? openTabCountElement.classList.add('tab-counter-critical')
        : eightyLimit
        ? openTabCountElement.classList.add('tab-counter-warning')
        : 'tab-counter';


      // Clear existing lists
      pinnedTabList.innerHTML = ''; // Clear the pinned tab list
      unpinnedTabList.innerHTML = ''; // Clear the unpinned tab list

      openTabCountElement.innerHTML = ` <p><span class=${
        approachingLimit
          ? 'tab-counter-open-critical'
          : eightyLimit
          ? 'tab-counter-open-warning'
          : 'tab-counter-open-default'
      }>Open: ${openTabsCount} </span> <span class='tab-counter-breakdown'>(Pinned: ${
        pinnedTabs.length
      } |  Other: ${unPinnedTabs.length})</span></p>
      <p>Limit: ${tabLimit}
      ${
        approachingLimit
          ? `<p class="tab-counter-critical-msg">${availableSlots} slot(s) remaining. <br> Older unpinned tabs will be closed first</p>`
          : ''
      }
      `;
      

      pinnedTabs.map((tab) => createListItem(tab, pinnedTabList));
      // attachListeners(pinnedTabList);
      unPinnedTabs.map((tab) => createListItem(tab, unpinnedTabList));
      fetchTabGroups();

      // attachListeners(unpinnedTabList);

      console.log(document.getElementById('maxTabsInput').value);

      return tabs;}
};

function currentTabs(tabs) {
    selectedTabs = [] //reset the selected tabs;
    if (tabs){someFunction(tabs);}else{
      chrome.tabs.query({}, function(tabs){someFunction(tabs)});
    }
   
  }


function createListItem(tab, parentList) {
  // Create the list item element
  const listItem = document.createElement('li');
  listItem.className = 'tab-list-item';
  listItem.id = `li-tab-${tab.id}`;

  // Create the checkbox element
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'tab-checkbox';
  checkbox.id = `tab-${tab.id}`;
  checkbox.setAttribute('data-title', tab.title); // Set data attribute for the title
  checkbox.setAttribute('data-id', tab.id); // Set data attribute for the id
  checkbox.setAttribute('data-pinned', tab.pinned); // Set data attribute for the pinned
  checkbox.setAttribute('data-url', tab.url); // Set data attribute for the url
  checkbox.setAttribute(
    'data-favIconurl',
    tab.favIconUrl || 'icons/llamacool.png'
  ); // Set data attribute for the icon url

  // Create the image element
  const img = document.createElement('img');
  img.src = tab.favIconUrl || 'icons/llamacool.png';
  img.className = 'tab-icon';

  // Create the label element
  const label = document.createElement('label');
  label.htmlFor = `tab-${tab.id}`;
  label.textContent = tab.title;

  const imgPin = document.createElement('img');
  imgPin.src = `icons/${tab.pinned ? 'unpin' : 'pin'}.png`;
  imgPin.className = `${tab.pinned ? ' tab-icon-unpin ' : ' tab-icon-pin '}`;
imgPin.title = `${tab.pinned ? 'unpin' : 'pin'}`;
  imgPin.setAttribute('data-pinned', tab.pinned);
  imgPin.setAttribute('data-id', tab.id);
  imgPin.setAttribute('data-url', tab.url);
 

  // Append the checkbox, image, and label to the list item
  listItem.appendChild(checkbox);
  listItem.appendChild(img);
  listItem.appendChild(label);
  listItem.appendChild(imgPin);

  imgPin.addEventListener('click', function () {
    const isPinned = this.getAttribute('data-pinned') === 'true';
    const tabId = Number(this.getAttribute('data-id'));
    pinorUnpinTab(tabId, isPinned);


  });

  // Add event listener to the checkbox
  checkbox.addEventListener('change', function () {
    const isChecked = this.checked;
    const tabTitle = this.getAttribute('data-title') || 'No title';
    const isPinned = this.getAttribute('data-pinned') || 'Dont know';
    const tabId = Number(this.getAttribute('data-id'));

    if (isChecked) {
      selectedTabs.push({ id: tabId, title: tabTitle, pinned: isPinned });
      // alert(`You checked: ${tabTitle}, Selected Tabs: ${selectedTabs}`);
    } else {
      selectedTabs = selectedTabs.filter((tab) => tab.title !== tabTitle);
      // alert(`Unchecked: ${tabTitle}, Selected Tabs: ${selectedTabs}`);
    }
    // alert(`Selected Tabs: ${selectedTabs}`);
    console.log(selectedTabs);
  });
  // console.log(listItem)

  parentList.appendChild(listItem);

  return listItem; // Return the list item
}


function pinorUnpinTab(tabId, isPinned) {
  if (tabId) {
    console.log(`${tabId}:is pinned: ${isPinned}`);
    if (isPinned === true) {
      unpinTab(tabId)
      // console.log("Unpinned tab")
    } else {
      pinTab(tabId)
      // console.log('Pinned tab');
    }
    currentTabs();
  }
}


function pinTab(tabId) {
  if (tabId) {
    // console.log(`${tabId}:is pinned: ${isPinned}`);
    chrome.tabs.update(tabId, { pinned: true });
}};
function unpinTab(tabId) {
  if (tabId) {
    // console.log(`${tabId}:is pinned: ${isPinned}`);
    chrome.tabs.update(tabId, { pinned: false });
}};




function unpinTabs(){
  selectedTabs.forEach((tab)=>{unpinTab(tab.id)})
  currentTabs();
}
function pinTabs(){
  selectedTabs.forEach((tab)=>{pinTab(tab.id)})
  currentTabs();
}


async function closeTabs() {
  const removeTabPromises = selectedTabs.map((tab) => {
    return new Promise((resolve) => {
      chrome.tabs.remove(tab.id, resolve); // Resolve after tab is removed
    });
  });

  await Promise.all(removeTabPromises); // Wait for all tabs to be removed
  currentTabs(); // Call this after all tabs are successfully removed
}

function createTabGroup() {
  const groupTitle = groupTitleInput.value.trim() || 'New Group';
  const groupColor = groupColorPicker.value || 'blue';

  // Get selected tabs
  const tabIds = selectedTabs.map((tab) => tab.id);

  if (tabIds.length === 0) {
    alert('Please select tabs to group.');
    return;
  }

  // Create a tab group
  chrome.tabs.group({ tabIds }, function (groupId) {
    // Update the group with the title and color
    chrome.tabGroups.update(groupId, {
      title: groupTitle,
      color: groupColor,
      // color: groupColorToChromeColor(groupColor),
    });
    addGroupToDisplay(groupTitle, groupColor);
  });


  currentTabs();
  tabGroupInputs.style.display = 'none';
}

function addGroupToDisplay(groupTitle, groupColor) {
  const groupTabList = document.getElementById('groupTabList');
  const groupDiv = document.createElement('div');
  groupDiv.style.backgroundColor = groupColor;
  groupDiv.textContent = groupTitle;
  groupDiv.classList.add('group-tab');


  groupDiv.style.padding = '5px';
  groupDiv.style.margin = '5px 0';
  groupTabList.appendChild(groupDiv);
}






// Ungroup selected tabs
function ungroupTabs() {
  const tabIds = selectedTabs.map(tab => tab.id);
  if (tabIds.length > 0) {
    chrome.tabs.ungroup(tabIds);
  }
  currentTabs();
}


// Listen for messages from background.js
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'tabsUpdated') {
    
    currentTabs(request.newTabs);
  }
  if (request.action === 'limitUpdated') {

    currentTabs();
  }
  
});
