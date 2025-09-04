/*
  main-app.js
  Organized layout (no behavior changes):
  - Constants and configuration
  - GraphQL helpers
  - Cookie and auth utilities
  - Session info UI
  - Cookie consent banner
  - Jackpot overlays (Bell Link, High Cash, Progressive, VIP Bell Link)
  - Wheel of Fortune
  - "New" games badge CSS generator
  - Shop items (store)
  - Sportsbook search widget (Altenar)
  - UI helpers (theme toggle, language/url switch)
  - Loot/Mystery Boxes (open rewards)

*/

// ===================== Constants and configuration =====================
const API_URL = "https://www.ambassadoribet.com/_internal/gql";
const BRAND_ID = "ab";

// ===================== GraphQL helpers =====================
async function fetchGraphQL(query, variables = {}) {
  const authData = extractAuthDataFromCookie();
  if (!authData || !authData.accessToken) {
    throw new Error("Unable to retrieve authorization data.");
  }
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "tm-bid": "ab",
      Authorization: `Bearer ${authData.accessToken}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const result = await response.json();
  return result;
}

// ===================== Cookie and auth utilities =====================
function extractAuthDataFromCookie() {
  const auth = getCookie("auth");
  if (!auth) {
    console.warn("Auth cookie not found.");
    return null;
  }
  try {
    const decodedAuth = decodeURIComponent(auth);
    const authData = JSON.parse(decodedAuth);
    return {
      userId: authData.userId,
      accessToken: authData.accessToken,
    };
  } catch (error) {
    console.error("Error parsing auth cookie:", error);
    return null;
  }
}

function getUserSegments() {
  const cookieKeys = ["guestUserSegments", "guestUserSegments.v2"];
  let segments = null;

  for (const key of cookieKeys) {
    const cookieValue = getCookie(key);
    if (cookieValue) {
      try {
        const decodedSegments = decodeURIComponent(cookieValue);
        segments = JSON.parse(decodedSegments);
        if (Array.isArray(segments)) {
          return segments;
        } else {
          console.warn(`Cookie ${key} does not contain a valid array.`);
          return null;
        }
      } catch (error) {
        console.error(`Error parsing ${key} cookie:`, error);
        continue; 
      }
    }
  }

  if (!segments) {
    console.warn("Guest user segments cookie not found.");
  }
  return null;
}

function getCookie(name) {
  const cookies = document.cookie.split(";");
  const cookie = cookies.find((row) => row.trim().startsWith(name + "="));
  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString();
}

// ===================== Session info UI =====================
// Function to fetch session information from the API
async function fetchSessionInfo(userId, accessToken) {
  const sessionQuery = `
        query SessionConnection($userId: ID) {
            sessionConnection(userId: $userId, last: 15) {
                edges {
                    node {
                        ip
                        os
                        browser
                        createdAt
                    }
                }
            }
        }
    `;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "tm-bid": "ab",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        query: sessionQuery,
        variables: { userId },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data?.data?.sessionConnection?.edges || [];
  } catch (error) {
    console.error("Error fetching session information:", error);
    return [];
  }
}

// Function to render session information in the UI
function renderSessionInfo(sessions) {
  const sessionList = document.getElementById("session-list");
  if (!sessionList) return;

  sessionList.innerHTML = "";

  if (sessions.length === 0) {
    sessionList.innerHTML = "<li>No session data found.</li>";
    return;
  }

  sessions.forEach((session) => {
    const { ip, os, browser, createdAt } = session.node;
    const sessionItem = document.createElement("li");
    sessionItem.innerHTML = `
            <p><span class="label">IP:</span> ${ip}</p>
            <p><span class="label">OS:</span> ${os}</p>
            <p><span class="label">Browser:</span> ${browser}</p>
            <p><span class="label">Time:</span> ${formatDate(createdAt)}</p>
        `;
    sessionList.appendChild(sessionItem);
  });
}

// Main function to load session data
async function loadSessionData() {
  const authData = extractAuthDataFromCookie();

  if (!authData || !authData.userId || !authData.accessToken) {
    console.error("Failed to retrieve user ID or access token from cookie.");
    return;
  }

  const { userId, accessToken } = authData;
  const sessions = await fetchSessionInfo(userId, accessToken);
  renderSessionInfo(sessions);
}

// ===================== Cookie consent banner =====================
document.addEventListener("DOMContentLoaded", () => {
  if (!getCookie("cookieConsent")) {
    requestAnimationFrame(createCookieConsentBanner);
  }
});

function createCookieConsentBanner() {
  const container = document.createElement("div");
  container.className = "amb-cookie-container";
  container.innerHTML = `
    <div class="cookieConsent">
      <div class="cookieConsentContainer">
        <p>საიტი იყენებს Cookie ფაილებს. დახურვის ღილაკზე დაჭერით თქვენ ეთანხმებით Cookie ფაილების გამოყენების წესებს და პირობებს. <a style="color: #cf167d" href="https://www.ambassadoribet.com/cookie-policy" target="_blank">Cookie პოლიტიკა.</a></p>
        <button class="acceptCookies">დახურვა</button>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  container.querySelector(".acceptCookies").addEventListener("click", () => {
    setCookie("cookieConsent", "true", 365);
    container.style.display = "none";
  });

  addCookieConsentStyles();
}

function addCookieConsentStyles() {
  const styles = `
    .amb-cookie-container {
      position: fixed;
      bottom: 10px;
      width: 100%;
      z-index: 10000;
      display: flex;
      justify-content: center;
    }
    .cookieConsent {
      background: rgba(0,0,0,.9);
      color: #fff;
      padding: 15px;
      font-family: 'Noto Sans Ambassadori';
      border-radius: 5px;
      max-width: 960px;
    }
    .cookieConsentContainer {
      display: flex;
      align-items: center;
      gap: 10px;
      justify-content: space-between;
    }
    .cookieConsentContainer p {
      margin: 0;
      font-size: 10px;
    }
    .cookieConsentContainer a {
      color: #cf167d;
      text-decoration: none;
    }
    .cookieConsentContainer .acceptCookies {
      background: #cf167d;
      border: none;
      color: #fff;
      padding: 8px 16px;
      cursor: pointer;
      font-size: 10px;
      font-family: 'Noto Sans Ambassadori';
      border-radius: 5px;
    }
    @media (max-width: 1200px) {
      .cookieConsentContainer {
        flex-direction: column;
      }
    }
    @media (max-width: 768px) {
      .amb-cookie-container {
        bottom: 0;
      }
    }
  `;
  const styleSheet = document.createElement("style");
  styleSheet.id = "style-cookie";
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
}


// ===================== Jackpot overlays: Bell Link =====================
async function fetchBellLink() {
  const apiUrl =
    "https://ambassadoribetge-api-prod-bgsp.egt-ong.com/api/jackpot/stats";
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();

    // Check if instanceStats exists
    if (
      data.jackpotInstancesStats &&
      data.jackpotInstancesStats.instanceStats
    ) {
      const instances = data.jackpotInstancesStats.instanceStats;

      // Find the "High Cash" instance
      const vipBellLinkInstance = instances.find(
        (instance) => instance.instanceName === "Bell Link"
      );
      if (vipBellLinkInstance) {
        const level1Stats = vipBellLinkInstance.levelStats.find(
          (level) => level.levelId === 1
        );
        if (level1Stats) {
          const currentValueObj = level1Stats.currentValue.find(
            (val) => val.key === "GEL"
          );
          if (currentValueObj) {
            let currentValue = Math.round(currentValueObj.value / 100);
            currentValue = `"${new Intl.NumberFormat("en-US").format(
              currentValue
            )}₾"`; // Add commas

            // Inject dynamic CSS into the document
            const style = document.createElement("style");
            style.innerHTML = `
                          x-casino-game-thumb[data-id="40-lucky-king-bell-link"],
                          x-casino-game-thumb[data-id="40-super-fruits-bell-link"],
                          x-casino-game-thumb[data-id="40-burning-hot-bell-link"],
                          x-casino-game-thumb[data-id="40-zodiac-wheel-bell-link"],
                          x-casino-game-thumb[data-id="flaming-hot-extreme-bell-link"],
                          x-casino-game-thumb[data-id="40-lucky-king-extreme-bell-link"],
                          x-casino-game-thumb[data-id="vampire-night-bell-link"],
                          x-casino-game-thumb[data-id="shining-crown-bell-link"],
                          x-casino-game-thumb[data-id="burning-hot-bell-link"],
                          x-casino-game-thumb[data-id="20-super-hot-bell-link"],
                          x-casino-game-thumb[data-id="zodiac-wheel-bell-link"],
                          x-casino-game-thumb[data-id="flaming-hot-bell-link"],
                          x-casino-game-thumb[data-id="20-super-fruits-bell-link"],
                          x-casino-game-thumb[data-id="5-dazzling-hot-bell-link"],
                          x-casino-game-thumb[data-id="40-super-hot-bell-link"],
                          x-casino-game-thumb[data-id="40-shining-crown-bell-link"] {
                              &::before {
                                  content: ${currentValue};
                                      position: absolute;
                                      bottom: 10px;
                                      right: 10px;
                                      font-size: var(--font-size-body);
                                      background: rgb(70 7 104 / 92%) url("https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/8228a998-a96c-4939-bedc-51cad1b895d5/vip-bell-link.svg") no-repeat 5px center;
                                      padding: 5px 5px 5px 25px;
                                      border-radius: 7px;
                                      z-index: 2;
                                      pointer-events: none;
                                      border: solid 2px #cf167d;
                              }
                          }
                      `;

            // Remove old styles if they exist
            const existingStyle = document.getElementById(
              "bell-link-style"
            );
            if (existingStyle) {
              existingStyle.remove();
            }

            // Add new styles
            style.id = "bell-link-style";
            document.head.appendChild(style);
          } else {
            console.warn("currentValue for GEL not found.");
          }
        } else {
          console.warn("Level 1 stats not found.");
        }
      } else {
        console.warn("High Cash instance not found.");
      }
    } else {
      console.warn("instanceStats not found in response.");
    }
  } catch (error) {
    console.error("Error fetching jackpot stats:", error);
  }
}

// Call the function immediately and every 3.5 seconds
setTimeout(() => {
  fetchBellLink();
}, 6600);

// ===================== Jackpot overlays: High Cash =====================
async function fetchHighCash() {
  const apiUrl = 'https://ambassadoribetge-api-prod-bgsp.egt-ong.com/api/jackpot/stats';
  try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();

      // Check if instanceStats exists
      if (data.jackpotInstancesStats && data.jackpotInstancesStats.instanceStats) {
          const instances = data.jackpotInstancesStats.instanceStats;

          // Find the "High Cash" instance
          const highCashInstance = instances.find(instance => instance.instanceName === "High Cash");
          if (highCashInstance) {
              const level1Stats = highCashInstance.levelStats.find(level => level.levelId === 1);
              if (level1Stats) {
                  const currentValueObj = level1Stats.currentValue.find(val => val.key === 'GEL');
                  if (currentValueObj) {
                    let currentValue = Math.round(currentValueObj.value / 100);
                    currentValue = `"${new Intl.NumberFormat('en-US').format(currentValue)}₾"`; // Add commas

                      // Inject dynamic CSS into the document
                      const style = document.createElement("style");
                      style.innerHTML = `
                          x-casino-game-thumb[data-id="princess-cash"],
                          x-casino-game-thumb[data-id="leprechance-treasury"],
                          x-casino-game-thumb[data-id="dragons-realm"],
                          x-casino-game-thumb[data-id="mummy-secret"] {
                              &::before {
                                  content: ${currentValue};
                                      position: absolute;
                                      bottom: 10px;
                                      right: 10px;
                                      font-size: var(--font-size-body);
                                      background: var(--background-background) url("https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/f7d50df4-859a-4cb8-bc88-ea83e01e1174/HighCash.svg") no-repeat 5px center;
                                      padding: 5px 5px 5px 25px;
                                      border-radius: 7px;
                                      z-index: 2;
                                      pointer-events: none;
                              }
                          }
                      `;

                      // Remove old styles if they exist
                      const existingStyle = document.getElementById("high-cash-style");
                      if (existingStyle) {
                          existingStyle.remove();
                      }

                      // Add new styles
                      style.id = "high-cash-style";
                      document.head.appendChild(style);
                  } else {
                      console.warn("currentValue for GEL not found.");
                  }
              } else {
                  console.warn("Level 1 stats not found.");
              }
          } else {
              console.warn("High Cash instance not found.");
          }
      } else {
          console.warn("instanceStats not found in response.");
      }
  } catch (error) {
      console.error('Error fetching jackpot stats:', error);
  }
}

// Call the function immediately and every 3.5 seconds
setTimeout(() => {
  fetchHighCash();
}, 3600);

// ===================== Jackpot overlays: Progressive =====================
async function fetchProgressiveJackpot() {
  try {
      const response = await fetch('https://ambassadoribetge-api-prod-bgsp.egt-ong.com/api/jackpot/stats');
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      
      if (!data.jackpotInstancesStats?.instanceStats) {
          console.warn("No instance stats found");
          return;
      }

      // Game mapping - name to data-id
      const games = {
          "Versailles Gold": "versailles-gold-jp-egt",
          "Burning Hot": "burning-hot-jp-egt",
          "Rise of Ra": "rise-of-ra-jp-egt",
          "40 Super Hot": "40-super-hot-jp-egt",
          "20 Super Hot": "20-super-hot-jp-egt"
      };
      
      // Create common CSS for all games
      let baseStyles = `
          x-casino-game-thumb[data-id$="-jp-egt"]::before {
              position: absolute;
              bottom: 10px;
              right: 10px;
              font-size: var(--font-size-body);
              background: rgb(7 20 104 / 92%) url("https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/54d869aa-cdfa-4227-a3e7-f52b48a5dc96/Progressive.svg") no-repeat 5px center;
              padding: 5px 5px 5px 25px;
              border-radius: 7px;
              z-index: 2;
              pointer-events: none;
              border: solid 2px #167fcf;
          }
      `;
      
      // Generate individual game styles
      let gameStyles = '';
      for (const instance of data.jackpotInstancesStats.instanceStats) {
          const gameId = games[instance.instanceName];
          if (!gameId) continue;
          
          const level1 = instance.levelStats?.find(level => level.levelId === 1);
          if (!level1) continue;
          
          const gelValue = level1.currentValue?.find(val => val.key === 'GEL');
          if (!gelValue) continue;
          
          const formattedValue = new Intl.NumberFormat('en-US').format(Math.round(gelValue.value / 100));
          gameStyles += `
              x-casino-game-thumb[data-id="${gameId}"]::before {
                  content: "${formattedValue}₾";
              }
          `;
      }
      
      // Apply styles
      const styleElement = document.getElementById("progressive-jackpot-style") || document.createElement("style");
      styleElement.id = "progressive-jackpot-style";
      styleElement.textContent = baseStyles + gameStyles;
      
      if (!styleElement.parentNode) {
          document.head.appendChild(styleElement);
      }
      
  } catch (error) {
      console.error('Error fetching jackpot stats:', error);
  }
}

setTimeout(fetchProgressiveJackpot, 5000);

// ===================== Jackpot overlays: VIP Bell Link =====================
async function fetchVipBellLink() {
  const apiUrl =
    "https://ambassadoribetge-api-prod-bgsp.egt-ong.com/api/jackpot/stats";
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();

    // Check if instanceStats exists
    if (
      data.jackpotInstancesStats &&
      data.jackpotInstancesStats.instanceStats
    ) {
      const instances = data.jackpotInstancesStats.instanceStats;

      // Find the "High Cash" instance
      const vipBellLinkInstance = instances.find(
        (instance) => instance.instanceName === "VIP Bell Link"
      );
      if (vipBellLinkInstance) {
        const level1Stats = vipBellLinkInstance.levelStats.find(
          (level) => level.levelId === 1
        );
        if (level1Stats) {
          const currentValueObj = level1Stats.currentValue.find(
            (val) => val.key === "GEL"
          );
          if (currentValueObj) {
            let currentValue = Math.round(currentValueObj.value / 100);
            currentValue = `"${new Intl.NumberFormat("en-US").format(
              currentValue
            )}₾"`; // Add commas

            // Inject dynamic CSS into the document
            const style = document.createElement("style");
            style.innerHTML = `
                          x-casino-game-thumb[data-id="vip-40-lucky-king-bell-link"],
                          x-casino-game-thumb[data-id="vip-40-super-fruits-bell-link"],
                          x-casino-game-thumb[data-id="vip-40-burning-hot-bell-link"],
                          x-casino-game-thumb[data-id="vip-40-zodiac-wheel-bell-link"],
                          x-casino-game-thumb[data-id="vip-flaming-hot-extreme-bell-link"],
                          x-casino-game-thumb[data-id="vip-40-lucky-king-extreme-bell-link"],
                          x-casino-game-thumb[data-id="vip-vampire-night-bell-link"],
                          x-casino-game-thumb[data-id="vip-shining-crown-bell-link"],
                          x-casino-game-thumb[data-id="vip-burning-hot-bell-link"],
                          x-casino-game-thumb[data-id="vip-20-super-hot-bell-link"],
                          x-casino-game-thumb[data-id="vip-zodiac-wheel-bell-link"],
                          x-casino-game-thumb[data-id="vip-flaming-hot-bell-link"],
                          x-casino-game-thumb[data-id="vip-20-super-fruits-bell-link"],
                          x-casino-game-thumb[data-id="vip-5-dazzling-hot-bell-link"],
                          x-casino-game-thumb[data-id="vip-40-super-hot-bell-link"],
                          x-casino-game-thumb[data-id="vip-40-shining-crown-bell-link"] {
                              &::before {
                                  content: ${currentValue};
                                      position: absolute;
                                      bottom: 10px;
                                      right: 10px;
                                      font-size: var(--font-size-body);
                                      background: rgb(70 7 104 / 92%) url("https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/8228a998-a96c-4939-bedc-51cad1b895d5/vip-bell-link.svg") no-repeat 5px center;
                                      padding: 5px 5px 5px 25px;
                                      border-radius: 7px;
                                      z-index: 2;
                                      pointer-events: none;
                                      border: solid 2px #cf167d;
                              }
                          }
                      `;

            // Remove old styles if they exist
            const existingStyle = document.getElementById(
              "vip-bell-link-style"
            );
            if (existingStyle) {
              existingStyle.remove();
            }

            // Add new styles
            style.id = "vip-bell-link-style";
            document.head.appendChild(style);
          } else {
            console.warn("currentValue for GEL not found.");
          }
        } else {
          console.warn("Level 1 stats not found.");
        }
      } else {
        console.warn("High Cash instance not found.");
      }
    } else {
      console.warn("instanceStats not found in response.");
    }
  } catch (error) {
    console.error("Error fetching jackpot stats:", error);
  }
}

// Call the function immediately and every 3.5 seconds
setTimeout(() => {
  fetchVipBellLink();
}, 5600);

// ===================== Wheel of Fortune =====================
let fortuneWheels = [];
let spunBoxes = [];
let selectedFortuneWheel = null;

async function fetchWheelData() {
  const query = `
    query GetUserBoxes($userId: ID) {
      userBoxConnection(userId: $userId, status: ACTIVE, last: 60) {
        edges {
          node {
            box {
              id
              type
              rewards {
                action {
                  ... on GiveAndActivateBonusAction {
                    bonusId
                    bonus {
                      description
                      contentId
                    }
                  }
                  ... on GiveBonusAction {
                    bonusId
                    bonus {
                      description
                      contentId
                    }
                  }
                  ... on GiveBoxAction {
                    boxId
                    box {
                      description
                      contentId
                    }
                  }
                  ... on GiveLoyaltyPointsAction {
                    amount
                    currencyCode
                  }
                }
                probability
              }
            }
            status
            userBoxId
          }
        }
      }
    }
  `;

  const authData = extractAuthDataFromCookie();
  const result = await fetchGraphQL(query, {
    userId: authData.userId,
  });

  fortuneWheels = result.data.userBoxConnection.edges
    .map((edge) => edge.node)
    .filter(
      (box) =>
        box.status === "ACTIVE" &&
        box.box.type === "WHEEL_OF_FORTUNE" &&
        !spunBoxes.includes(box.userBoxId)
    );

  if (fortuneWheels.length === 0) {
    const messageElement = document.createElement("div");
    messageElement.id = "noActiveWheelsMessage";
    messageElement.textContent = "";
    messageElement.style.position = "fixed";
    messageElement.style.top = "50%";
    messageElement.style.left = "50%";
    messageElement.style.transform = "translate(-50%, -50%)";
    messageElement.style.padding = "10px 20px";
    messageElement.style.backgroundColor = "#f8d7da";
    messageElement.style.color = "#721c24";
    messageElement.style.border = "1px solid #f5c6cb";
    messageElement.style.borderRadius = "5px";
    document.body.appendChild(messageElement);

    setTimeout(() => {
      document.body.removeChild(messageElement);
    }, 3000);
    displayFortuneWheels()
    return;
  }

  displayFortuneWheels();
  return fortuneWheels;
}

function displayFortuneWheels() {
  const fortuneListTop = document.getElementById("fortuneListTop");
  fortuneListTop.innerHTML = `<span style='--totalcount: "${fortuneWheels.length}"' class="choose-wheel-text"></span>`;
  const fortuneList = document.getElementById("fortuneList");
  fortuneList.innerHTML = "";

  fortuneWheels.forEach((wheel, index) => {
    const button = document.createElement("button");
    button.textContent = `${index + 1}`;
    button.style.margin = "5px";
    button.onclick = () => {
      selectFortuneWheel(wheel, index);
      resetRotation();
    };
    button.id = `wheel-btn-${index}`;
    fortuneList.appendChild(button);
  });
}

function resetRotation() {
  const wheelElement = document.getElementById("wheel");
  if (wheelElement) {
    wheelElement.style.transform = "rotate(0deg)";
    wheelElement.style.transition = "none";
  }
}

function selectFortuneWheel(wheel, index) {
  selectedFortuneWheel = wheel;
  selectedFortuneWheel.index = index;
  renderFortuneWheel(selectedFortuneWheel.box.rewards);
  document.getElementById("spinWheelButton").disabled = false;
}

function renderFortuneWheel(rewards) {
  const wheelElement = document.getElementById("wheel");
  wheelElement.innerHTML = "";
  const totalSegments = rewards.length;

  rewards.forEach((reward, index) => {
    const segment = document.createElement("div");
    segment.className = "segment";

    const baseRotation = -(360 / totalSegments) * index;
    const randomRotation = baseRotation + 160;
    const randomRotationTwo = baseRotation + 52;

    segment.style.setProperty("--rot-var", `rotate(${baseRotation}deg)`);
    segment.style.setProperty("--rot-var-random", `rotate(${randomRotation}deg)`);
    segment.style.setProperty("--rot-var-random-two", `rotate(${randomRotationTwo}deg)`);

 // Determine which background image to use (bonus, box, or loyalty points)
  let backgroundImageVar;
  if (reward.action[0].bonus?.contentId) {
    backgroundImageVar = `var(--${reward.action[0].bonus.contentId})`;
  } else if (reward.action[0].box?.contentId) {
    backgroundImageVar = `var(--${reward.action[0].box.contentId})`;
  } else if (reward.action[0].amount) {
    backgroundImageVar = `var(--${reward.action[0].currencyCode}-${reward.action[0].amount})`;
  }

  let currencyAmountVar;
  if (reward.action[0].amount) {
    currencyAmountVar = `${reward.action[0].amount}`;
  }

  segment.style.setProperty('--background-image-var', backgroundImageVar);
  segment.style.transform = `rotate(${(360 / totalSegments) * index}deg)`;
  segment.dataset.index = index;
  segment.innerHTML = `<span class="wheel-reward-holder ${reward?.action[0]?.currencyCode || 'no-currency'}" style="background-image: ${backgroundImageVar}, radial-gradient(rgba(255, 255, 255, .2), rgba(0, 0, 0, 0)); --currencyAmountVar: '${currencyAmountVar}';"></span>`;

  const rewardHolder = segment.querySelector('.wheel-reward-holder');

  if (!rewardHolder) {
    console.warn("wheel-reward-holder not found inside segment.");
  }

    wheelElement.appendChild(segment);
  });
}

async function openFortuneBox(userBoxId) {
  const mutation = `
    mutation OpenUserBox($input: OpenUserBoxInput!) {
      openUserBox(input: $input) {
        userBox {
          reward {
            action {
              ... on GiveBonusAction {
                bonusId
              }
              ... on GiveAndActivateBonusAction {
                bonusId
              }
              ... on GiveBoxAction {
                boxId
              }
              ... on GiveLoyaltyPointsAction {
                amount
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    input: {
      userBoxId: userBoxId,
    },
  };

  const response = await fetchGraphQL(mutation, variables);

  if (!response || !response.data || !response.data.openUserBox) {
    throw new Error("Failed to open user box or invalid response structure.");
  }

  const rewardActions = response.data.openUserBox.userBox.reward.action;

  const actionIds = rewardActions.map((action) => {
    return action.bonusId || action.boxId || action.amount;
  });

  return actionIds;
}

async function startWheelSpin() {
  if (!selectedFortuneWheel) {
    alert("No wheel selected. Please select a fortune wheel first.");
    return;
  }

  const spinButton = document.getElementById("spinWheelButton");
  spinButton.disabled = true;

  const wheelElement = document.getElementById("wheel");

  try {
    playSound("spinStartSound");

    const awardedActionIds = await openFortuneBox(selectedFortuneWheel.userBoxId);

    const winningRewardIndex = selectedFortuneWheel.box.rewards.findIndex((reward) => {
      const action = reward.action[0];
      const possibleId = action.bonusId || action.boxId || action.amount;
      return awardedActionIds.includes(possibleId);
    });

    if (winningRewardIndex === -1) {
      console.error("No matching reward found for the awarded actions:", awardedActionIds);
      spinButton.disabled = false;
      return;
    }

    const totalSegments = selectedFortuneWheel.box.rewards.length;
    const finalRotation = 360 * 5 - (360 / totalSegments) * winningRewardIndex;

    wheelElement.style.transition = "none";
    wheelElement.style.transform = "rotate(0deg)";
    void wheelElement.offsetWidth;

    function getRandomOvershoot() {
      return Math.floor(Math.random() * (200 - (-200) + 1)) - 200;
    }
    const overshoot = getRandomOvershoot();
    const incorrectRotation = finalRotation + overshoot;

    const spinTime = 4;
    const minCorrectionTime = 0.8;
    const maxCorrectionTime = 4;
    const correctionTime =
      minCorrectionTime + (Math.abs(overshoot) / 200) * (maxCorrectionTime - minCorrectionTime);

    wheelElement.style.transition = `transform ${spinTime}s cubic-bezier(0.42, 0, 0.58, 1)`;
    wheelElement.style.transform = `rotate(${incorrectRotation}deg)`;

    setTimeout(() => {
      wheelElement.style.transition = `transform ${correctionTime}s ease-out`;
      wheelElement.style.transform = `rotate(${finalRotation}deg)`;
    }, spinTime * 1000);

    const totalAnimationTime = (spinTime + correctionTime) * 1000;
    setTimeout(async () => {
      const winningSegment = wheelElement.querySelectorAll(".segment")[winningRewardIndex];
      if (winningSegment) {
        winningSegment.classList.add("winning-segment");
      }

      const wheelButton = document.getElementById(`wheel-btn-${selectedFortuneWheel.index}`);
      if (wheelButton) {
        wheelButton.remove();
      }

      spunBoxes.push(selectedFortuneWheel.userBoxId);
      fortuneWheels = fortuneWheels.filter(box => box.userBoxId !== selectedFortuneWheel.userBoxId);

      playSound("spinResultSound");

      const fetchDataButton = document.getElementById("fetchDataButton");
      fetchDataButton.disabled = true;
      setTimeout(() => {
        fetchDataButton.disabled = false;
      }, 3000);

      selectedFortuneWheel = null;
      document.getElementById("spinWheelButton").disabled = true;
      await fetchWheelData();
    }, totalAnimationTime);
  } catch (error) {
    alert("Error opening the box. Please try again.");
    console.error(error);
    spinButton.disabled = false;
  }
  addTemporarySpinningClass();
}

function playSound(soundId) {
  const sound = document.getElementById(soundId);
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(err => console.warn("Sound playback error:", err));
  }
}

function addTemporarySpinningClass() {
  const wheelElement = document.getElementById("wheel");
  if (wheelElement) {
    setTimeout(() => {
      wheelElement.classList.add("spining");
      setTimeout(() => {
        wheelElement.classList.remove("spining");
      }, 3000);
    }, 500);
  }
}

// ===================== Utilities =====================
function maskUsername(username, currentUserId, userId) {
    if (!username || username.length <= 2) return username;
    if (userId && userId === currentUserId) return username;
    return username[0] + '*****' + username[username.length - 1];
}

// ===================== "New" games badge CSS generator =====================
async function fetchNewGameIds() {
    const query = `
        query LobbyGames {
            lobbyGames(
                brandId: "ab",
                gameFilters: {
                    orderBy: [
                        {
                            direction: DESCENDING,
                            field: releasedAt
                        }
                    ]
                },
                limit: 20
            ) {
                gameId
            }
        }
    `;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query })
        });

        const data = await response.json();

        if (!data?.data?.lobbyGames) {
            console.error("Invalid response structure:", data);
            return;
        }

        const gameIds = data.data.lobbyGames.map(game => game.gameId);
        generateCSS(gameIds);
    } catch (error) {
        console.error("Error fetching game IDs:", error);
    }
}

function generateCSS(gameIds) {
    if (!gameIds.length) return;

    let cssContent = `x-casino-game-thumb {\n`;
    gameIds.forEach(id => {
        cssContent += `  &[data-id="${id}"],\n`;
    });

    // Remove last comma and close the CSS rule
    cssContent = cssContent.trim().replace(/,$/, "") + ` {\n`;
    cssContent += `    &:after {
          content: 'New';
          position: absolute;
          color: white;
          font-size: 130%;
          font-weight: bold;
          background: #1AAF92;
          top: 7px;
          right: 0;
          transform: translatex(6px);
          border-radius: 5px;
          padding: 2px 5px;
          z-index: 100000;
          font-family: 'Noto Sans Ambassadori' !important;
          pointer-events: none !important;
          background-size: 200% 200%;
  }\n  }\n}`;

    // Append CSS to the document
    const styleElement = document.createElement("style");
    styleElement.textContent = cssContent;
    document.head.appendChild(styleElement);
}

setTimeout(() => {
    fetchNewGameIds();
}, 3000);

// ===================== Shop items (store) =====================
(function () {
  const GET_SHOP_ITEMS_QUERY = `
        query ShopItemConnection {
          shopItemConnection(
            shopItemCategoryId: "ycGrHNho6Y4cSh60pN3O",
            orderBy: [
              {
                field: order,
                direction: ASCENDING
              }
            ]
          ) {
            edges {
              node {
                price {
                  value
                }
                description
                id
                contentId
              }
            }
          }
        }
      `;

  const PURCHASE_ITEM_MUTATION = `
        mutation PurchaseShopItems($input: PurchaseShopItemsInput!) {
          purchaseShopItems(input: $input) {
            shopTransaction {
              userId
              shopItems {
                id
              }
            }
          }
        }
      `;

  function createShopItem(item) {
    const itemDiv = document.createElement("div");

    itemDiv.className = `shop-item ${item.contentId || "default-contentId"}`;
    itemDiv.setAttribute("data-id", item.id);

    const description = document.createElement("h3");
    description.className = "description";
    description.textContent = item.description || "No description available.";
    itemDiv.appendChild(description);

    const buyButton = document.createElement("button");
    buyButton.textContent = `${item.price.value} ❤️`;
    buyButton.setAttribute("onclick", `window.handleBuy('${item.id}')`);
    itemDiv.appendChild(buyButton);

    return itemDiv;
  }

  async function loadShopItems() {
    const shopContainer = document.getElementById("shop-container");
    const loadButton = document.querySelector(".load-shop-button");
    loadButton.disabled = true;
    loadButton.textContent = "";

    try {
      const data = await fetchGraphQL(GET_SHOP_ITEMS_QUERY);
      if (data.errors) {
        throw new Error(data.errors.map((err) => err.message).join(", "));
      }
      const items = data.data.shopItemConnection.edges.map((edge) => edge.node);
      shopContainer.innerHTML = "";
      if (items.length === 0) {
        shopContainer.innerHTML = "<p>No items available in this category.</p>";
      } else {
        items.forEach((item) => {
          const itemElement = createShopItem(item);
          shopContainer.appendChild(itemElement);
        });
      }
      shopContainer.style.display = "flex";
    } catch (error) {
      console.error(error);
    } finally {
      loadButton.disabled = false;
      loadButton.textContent = "";
    }
  }

  async function handleBuy(itemId) {
    const itemElement = document.querySelector(
      `.shop-item[data-id="${itemId}"]`
    );
    const buyButton = itemElement.querySelector("button");
    const feedbackElement = document.createElement("div");
    feedbackElement.className = "item-feedback";

    const existingFeedback = buyButton.previousElementSibling;
    if (
      existingFeedback &&
      existingFeedback.classList.contains("item-feedback")
    ) {
      existingFeedback.remove();
    }

    try {
      const variables = {
        input: {
          shopItemIds: [itemId],
        },
      };
      const data = await fetchGraphQL(PURCHASE_ITEM_MUTATION, variables);
      if (data.errors) {
        const errorMsg = data.errors[0].message;
        if (errorMsg === "NOT_ENOUGH_MONEY") {
          feedbackElement.textContent = "";
          feedbackElement.style.color = "red";
          feedbackElement.classList.add("not-enough-money");
        } else {
          feedbackElement.textContent = `${errorMsg}`;
          feedbackElement.style.color = "red";
        }
      } else {
        feedbackElement.textContent = "";
        feedbackElement.style.color = "green";
        feedbackElement.classList.add("purchase-successful");
      }
    } catch (error) {
      feedbackElement.textContent = `${error.message}`;
      feedbackElement.style.color = "red";
      console.error(error);
    }

    itemElement.insertBefore(feedbackElement, buyButton);

    setTimeout(() => {
      if (feedbackElement.parentNode) {
        feedbackElement.remove();
      }
    }, 3000);
  }

  window.loadShopItems = loadShopItems;
  window.handleBuy = handleBuy;
})();

// ===================== Sportsbook search widget (Altenar) =====================
function triggerWidget() {
  if (!window.altenarWSDK) {
    console.error("Altenar WSDK is not loaded.");
    return;
  }

  // Initialize Altenar WSDK
  window.altenarWSDK.init({
    integration: 'ambassadoribet',
    culture: 'ka-GE',
    oddformat: 0
  });

  // Enable Memory Router
  window.altenarWSDK.addSportsBook({
    props: {
      routerType: 'memory',
      onRouteChange: (data) => {
        const url = new URL(window.location.href);
        url.search = new URLSearchParams(data).toString();
        window.history.pushState(null, '', url);
      },
    },
    container: document.getElementById('root'),
  });

  // Add the WEventSearch widget
  window.altenarWSDK.addWidget({
    widget: 'WEventSearch',
    props: {
    clearOnSelect: true,
    onEventSelect: (event) => {
      console.log("Event Selected:", event);
      navigateToEvent(event);
    },
    onChampionshipSelect: (championship) => {
      console.log("Championship Selected:", championship);
      navigateToChampionship(championship);
    },
    showBookedLiveIndicator: true,
    showFavouriteEventsIndicator: false,
    showLiveIndicator: true,
    iconOverride: {
      iso: {},
      sport: {},
      category: {
        "495": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/ad6c1639-9585-47f4-9ff0-6c981b06f1ea/A_black_image.jpg",
        "511": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/71b5c0ad-bb9d-43e1-8979-563642b8cd1f/Flag_of_Northern_Ireland_1953%E2%80%931972.svg.png",
        "542": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/535e7846-e985-446b-acef-d645b0eb1fb7/Atp.svg",
        "547": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/8cc1403b-c9b2-4540-a730-4dcdaad38a19/111_Tennis%20Ball%20Set.svg",
        "553": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/ab05336a-cbef-4153-a593-bf9576055878/WTA.png",
        "592": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/5ba8411f-285f-45fa-9aa9-39af1b5be54e/ITF.png",
        "607": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/5ba8411f-285f-45fa-9aa9-39af1b5be54e/ITF.png",
        "610": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/ad6c1639-9585-47f4-9ff0-6c981b06f1ea/A_black_image.jpg",
        "635": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/ad6c1639-9585-47f4-9ff0-6c981b06f1ea/A_black_image.jpg",
        "656": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/ad6c1639-9585-47f4-9ff0-6c981b06f1ea/A_black_image.jpg",
        "674": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/29acd7d2-39bb-451c-a012-baa43b511fd3/UFC.png",
        "679": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/ad6c1639-9585-47f4-9ff0-6c981b06f1ea/A_black_image.jpg",
        "728": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/1f6bd86e-43c6-4666-b59f-16d70a3b245c/Belator%20MMA.png",
        "742": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/c846cea7-5c21-47c3-93ac-c53c8dc458f9/AAEAAQAAAAAAAAAmAAAAJDhiM2VjNWVkLTdhNzMtNGRjZC04NTg0LWY2ODQzY2JmYmE4YQ.svg",
        "749": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/9e28ed8a-9ce0-42a6-982c-d9555fcb8a00/Zanzibar%20Flag.png",
        "839": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/56d4462e-a6b2-4fa7-9fbe-ca15343d7e71/WTA%20Challenger.png",
        "909": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/402c3655-21a6-4b68-a3c0-a6205ab8eb2b/KSW.png",
        "1244": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/75d03211-ad4f-4b78-86d4-285192f39326/Rugby%20Union.png",
        "1245": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/544b4019-b7f1-4997-8847-297b3fd41031/Rugby%20League.png",
        "1248": "https://upload.wikimedia.org/wikipedia/commons/3/33/F1.svg",
        "1460": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/60cfc4c2-286e-44f3-9969-4bada8ae11ee/EFC%20MMA.png",
        "1545": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/6341dbc6-bce0-4311-9f66-4f276a2a6145/Untitled-2-04.svg",
        "1555": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/9d1ae406-226f-4dfb-8209-e7cf37b83684/Rizin.svg",
        "1571": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/a7755fbe-379a-4407-a7b8-294d21e381f5/valhalla_cup_logo.svg",
        "1595": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/6b4f7cc8-a692-4e2b-865f-51577b943831/gtsportleague.svg",
        "1728": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/ad1e794e-65c7-4c07-98b4-91402c203ff1/Untitled-2-02.svg",
        "1729": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/28d11cd6-82df-4009-8f94-e78d5446eea5/Untitled-2-03.svg",
        "1882": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/a5a16a38-0541-4f50-aaef-750911f7f395/UTR.png",
        "1883": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/a5a16a38-0541-4f50-aaef-750911f7f395/UTR.png",
        "1949": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/e66e964d-c9a5-47be-8b32-3a42bd4f0679/e-rivals%20logo.png",
        "2020": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/3adf6f62-ba47-4fe9-abdf-8f5d130c7e2e/EAL-Logo.png",
        "2086": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/c60bfb95-91fc-4e9d-9213-1da713c5f311/h2hggl-01%20-%201.svg",
        "2090": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/64bec639-9b86-4599-bb0c-eb69c9f3fe99/72be7e_6447b0f9981c42bea5799d528af9ca76~mv2.png",
        "2091": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/36647366-6ac8-4200-bde5-6cdc49e0078e/600px-CyberLive!Arena_full_lightmode-01.svg",
        "2096": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/36647366-6ac8-4200-bde5-6cdc49e0078e/600px-CyberLive!Arena_full_lightmode-01.svg",
        "2130": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/a7755fbe-379a-4407-a7b8-294d21e381f5/valhalla_cup_logo.svg",
        "52545": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/d09a95ec-58f5-4452-8cb5-aa8904e4788e/Cage%20Warriors.png"
      },
      championship: {
        "1594": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/36647366-6ac8-4200-bde5-6cdc49e0078e/600px-CyberLive!Arena_full_lightmode-01.svg",
        "1750": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/64bec639-9b86-4599-bb0c-eb69c9f3fe99/72be7e_6447b0f9981c42bea5799d528af9ca76~mv2.png",
        "2085": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/c60bfb95-91fc-4e9d-9213-1da713c5f311/h2hggl-01%20-%201.svg",
        "2935": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/7cda3f9d-9886-472c-abdf-490b68df7589/FA%20CUP.png",
        "2936": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/2a9b4214-5303-47ba-9c95-c185c40a477b/premier%20league-01.svg",
        "2941": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/be88efaa-5da8-45ea-b91f-413fd204cb02/%E1%83%9A%E1%83%90%E1%83%9A%E1%83%98%E1%83%92%E1%83%90.png",
        "2942": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/ea4d86fd-9070-48a6-8228-c0e8424be853/%E1%83%A1%E1%83%94%E1%83%A0%E1%83%98%E1%83%90%20%E1%83%90.svg",
        "2943": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/70b307e5-e8be-41ce-8936-8d48456fc93d/%E1%83%9A%E1%83%98%E1%83%92%E1%83%90%201%20%E1%83%A1%E1%83%90%E1%83%A4%E1%83%A0%E1%83%90%E1%83%9C%E1%83%92%E1%83%94%E1%83%97%E1%83%98.svg",
        "2950": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/abff205a-e663-4877-ab2a-8fac558497c3/%E1%83%91%E1%83%A3%E1%83%9C%E1%83%93%E1%83%94%E1%83%A1%E1%83%9A%E1%83%98%E1%83%92%E1%83%90.svg",
        "2973": "https://sb2wsdk-altenar2.biahosted.com/demo.html?integration=ambassadoribet#/overview",
        "2980": "https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/3b10dc64-0e3b-4844-bc37-2e3a2146fcb8/nba-logo.svg",
        "2995": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/86d1d108-dec0-4964-a305-377793b88353/Euroleague%20Basketball.svg",
        "3013": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/3e275412-40bd-4e18-bb2c-1fdd9affe575/AO.svg",
        "3031": "https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/0c4b32b2-a36f-4b84-85b6-2fd58562f3f4/UEFA%20Euro%202024%20Germany.svg",
        "3036": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/3e275412-40bd-4e18-bb2c-1fdd9affe575/AO.svg",
        "3065": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/4b07af2c-0c12-4875-8913-e2fa8875a06d/%E1%83%94%E1%83%A0%E1%83%94%E1%83%93%E1%83%98%E1%83%95%E1%83%98%E1%83%96%E1%83%98%E1%83%9D%E1%83%9C%E1%83%98.png",
        "3102": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/e32e472d-c6fd-4e25-892b-dd0a76d7a24c/coppa%20italia%20-%20Italy%20cup.png",
        "3111": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/9973dd0d-d2b4-4489-b15b-e3763ce776dd/2023-spain-laliga-2.png",
        "3112": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/3b2e400b-5823-495e-82a4-e88176f2c896/DFB%20POKAL%20-%20Germany%20football%20cup.png",
        "3152": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/cc9db10c-2496-46ed-acb6-d9b22c3fb6b8/Portugese%20%20championship-01.svg",
        "3232": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/b12f9484-8b4b-429d-ba4d-a9c9afc7bab3/05_NHL_Shield.svg.png",
        "3264": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/dc5a2aed-b5f1-4906-90a0-0c18d03b6093/Handball%20Champions%20League.jpg",
        "3287": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/c8e96f33-0058-4e7d-847a-31b59b4155d1/logo_challengerseries_white-4%20-%20Table%20tennis%20challenge%20series.png",
        "3364": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/aa25ff94-c466-4012-969d-4eb1e36a82d4/Spain%20Super%20Cup.png",
        "3868": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/eba74c0c-3cb8-43fe-bd4d-6011bf798d93/AFC_Champions_League_Elite_logo.svg.png",
        "4044": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/646679da-3abf-479c-b60c-790ad7fecb05/Euro%20Futsal.svg",
        "4053": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/88db42f8-ae2e-4611-985d-682a13de5d4d/erovnuli-01.svg",
        "4393": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/31f177c3-774c-4e81-af1c-079fccb88771/UEFA%20youth%20league.svg",
        "4979": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/5c8633d6-055d-4f72-b28d-c1a0f5cf304b/Women%20Euro.svg",
        "5087": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/449f1e93-c354-4484-9d3a-500b5130b2dc/Davis%20Cup.png",
        "5242": "https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/1e3d92a4-79c5-48e5-b201-dd84017ad1dc/Asset%201.svg",
        "5363": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/f4526e20-8442-4fa8-83ae-9719ce14008f/TTCup.png",
        "16808": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/bf6d87be-be30-492e-9056-538564750b61/Champions%20League.svg",
        "16809": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/d74f9581-cdca-439b-b8b9-41561b321807/%E1%83%94%E1%83%95%E1%83%A0%E1%83%9D%E1%83%9E%E1%83%90%20%E1%83%9A%E1%83%98%E1%83%92%E1%83%90.svg",
        "17254": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/ce15c52b-a03a-43ea-a31a-13fc14030e64/Logo%20Euro%20u19.svg",
        "17271": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/037d62fd-4a9d-4dc0-a415-47b16aadfaab/Women%20Champions%20League.svg",
        "17424": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/8792a75d-3419-44e8-ad49-1faf0c1ff296/Asian%20Championship.png",
        "18264": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/70311580-f4a2-4640-bf3b-15002f31700e/World%20Boxing%20Association.png",
        "18388": "https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/6479dab6-edde-42fa-a061-424b53c15200/afrika%20Shecvlili.svg",
        "19414": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/f9147ed9-c5d7-48a3-b704-5e5460153a25/World%20Championship%20Europe.png",
        "28427": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/a2063f51-8003-44d1-a86a-5ddab086740e/CONCACAF%20NATIONS%20LEAGUE.png",
        "31608": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/307609f0-4891-488d-a824-31c73a211757/Conference.svga%20League.svg",
        "33007": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/e575a820-bea8-4fbe-996e-8ee6c2a1f2f5/wu19.svg",
        "34266": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/a879fc46-34e5-430d-85db-912a4fd6fcee/2024_ASEAN_United_FC_logo.svg.png",
        "35507": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/b62100e3-652e-4821-a2ae-bffddbb8a16d/TT%20Elite%20Series.png",
        "38397": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/2d4592ab-5f85-460b-aef3-89338b71c10d/UEFA%20Regions%20Cup.svg",
        "39481": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/04c21bfa-879e-4523-ae62-f7752facb9ea/Tennis%20United%20Cup%20Logo.png",
        "39667": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/202ce52f-d156-4b83-b068-55105bd997c2/Gulf%20Cup.png",
        "43503": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/c8782d54-c042-401a-b5d3-ca1c1168acb2/Women%20Nations%20League.svg",
        "49055": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/190c6fb8-9ba1-4ddd-b2be-53ac8deca619/Intercontinental%20Cup.png",
        "49402": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/36647366-6ac8-4200-bde5-6cdc49e0078e/600px-CyberLive!Arena_full_lightmode-01.svg",
        "49403": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/36647366-6ac8-4200-bde5-6cdc49e0078e/600px-CyberLive!Arena_full_lightmode-01.svg",
        "49404": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/36647366-6ac8-4200-bde5-6cdc49e0078e/600px-CyberLive!Arena_full_lightmode-01.svg",
        "50905": "https://www.ambassadoribet.com/_internal/ts-images/f2b70d9b-56f9-4d2d-be98-874fcbc02a46/dev/1ebc4727-2a1d-4b5f-bad2-06ce8fd8fcf8/PFL%20Logo.png"
      }
    }
  },
    container: document.getElementById('search-widget')
  });
}

function getCurrentSportsbookUrl() {
  const currentUrl = window.location.href;
  const match = currentUrl.match(/(https:\/\/www\.ambassadoribet\.com\/[^\/]+\/sportsbook)/);
  return match ? match[1] : currentUrl;
}

function navigateToEvent(event) {
  if (!window.altenarWSDK) {
    console.error("Altenar WSDK is not initialized.");
    return;
  }

  // Navigate within the sportsbook section
  window.altenarWSDK.set({
    page: 'event',
    eventId: event.id,
    sportId: event.sportId,
    categoryIds: [event.catId],
    championshipIds: [event.champId]
  });

  // Append event to current sportsbook URL
  const newUrl = `${getCurrentSportsbookUrl()}/event/${event.id}`;
  window.history.pushState(null, '', newUrl);

  // Close the modal after selecting an event
  document.querySelector('[data-modal-sport-search]').close();
}

function navigateToChampionship(championship) {
  if (!championship || !championship.championshipIds) {
    console.error("Invalid championship data:", championship);
    return;
  }

  // Navigate within the sportsbook section
  window.altenarWSDK.set({
    page: 'championship',
    championshipIds: championship.championshipIds,
    sportTypeId: championship.sportTypeId,
    categories: championship.categories
  });

  // Append championship to current sportsbook URL
  const newUrl = `${getCurrentSportsbookUrl()}/championship/${championship.championshipIds}`;
  window.history.pushState(null, '', newUrl);

  // Close the modal after selecting a championship
  document.querySelector('[data-modal-sport-search]').close();
}
// ===================== UI helpers (theme toggle, language/url switch) =====================
let isDarkMode = false; // Default theme state

function toggleSportTheme() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode-sport', isDarkMode);

    window.altenarWSDK.set({
        themeName: isDarkMode ? 'white' : 'light'
    });
}
function switchCurrnetUrl(navurl) {
  let url = window.location.href;
  let updatedUrl = url.replace(/(\/(ka|ru|en|tr))(\/.*)?$/, `$1/${navurl}`);

  if (url !== updatedUrl) {
      window.location.href = updatedUrl; 
  }
}
function switchLanguage(lang) {
    let url = window.location.href;
    let newUrl = url.replace(/\/(ka|ru|en|tr)\//, `/${lang}/`);
    
    if (url !== newUrl) {
        window.location.href = newUrl; // Redirect to the new URL
    }
}

// ===================== Loot/Mystery Boxes (open rewards) =====================
let rewardTimeout;
let openedBoxIds = []; 

async function fetchActiveUserBoxes() {
  const authData = extractAuthDataFromCookie();
  if (!authData) {
    throw new Error("Unable to retrieve user data.");
  }

  const query = `
    query UserBoxConnection($userId: ID) {
      userBoxConnection(userId: $userId, status: ACTIVE, last: 60) {
        edges {
          node {
            userBoxId
            status
            box {
              name
              type
              description
            }
          }
        }
      }
    }
  `;
  const data = await fetchGraphQL(query, {
    userId: authData.userId,
  });
  return data.data.userBoxConnection.edges
    .map((edge) => edge.node)
    .filter((box) => box.status === "ACTIVE")
    .filter((box) => ["LOOT_BOX", "MYSTERY_BOX"].includes(box.box.type))
    .filter((box) => !openedBoxIds.includes(box.userBoxId)); 
}

async function openBox(userBoxId) {
  const mutation = `
    mutation OpenUserBox($input: OpenUserBoxInput!) {
      openUserBox(input: $input) {
        userBox {
          reward {
            action {
              ... on GiveBonusAction {
                bonus {
                  name
                  description
                  contentId
                }
              }
              ... on GiveAndActivateBonusAction {
                bonus {
                  name
                  description
                  contentId
                }
              }
              ... on GiveBoxAction {
                box {
                  name
                  description
                }
              }
              ... on ActivateDepositBonusAction {
                bonus {
                  name
                  description
                  contentId
                }
              }
              ... on GiveLoyaltyPointsAction {
                amount
              }
            }
          }
        }
      }
    }
  `;
  const data = await fetchGraphQL(mutation, { input: { userBoxId } });
  return data.data.openUserBox.userBox.reward.action.map((action) => {
    if (action.bonus) {
      return {
        type: "BONUS",
        name: action.bonus.name,
        description: action.bonus.description,
        contentId: action.bonus.contentId,
      };
    } else if (action.box) {
      return {
        type: "BOX",
        name: action.box.name,
        description: action.box.description,
      };
    } else if (action.amount) {
      return {
        type: "LOYALTY_POINTS",
        name: "Bat Coin",
        description: `${action.amount} <span class="loyalty-points">Bat Coin</span>`,
        amount: action.amount,
      };
    }
  });
}

async function initialize() {
  clearRewards();
  const activeBoxes = await fetchActiveUserBoxes();
  const boxesContainer = document.getElementById("boxes");
  boxesContainer.innerHTML = "";

  if (activeBoxes.length === 0) {
    const noBoxesMessage = document.createElement("div");
    noBoxesMessage.className = "no-active-boxes-message";
    noBoxesMessage.innerText = "";
    noBoxesMessage.style.color = "#fff";
    noBoxesMessage.style.fontSize = "1rem";
    noBoxesMessage.style.textAlign = "center";
    noBoxesMessage.style.marginTop = "20px";
    boxesContainer.appendChild(noBoxesMessage);
    return;
  }

  for (const box of activeBoxes) {
    const boxElement = document.createElement("div");
    boxElement.className = `box ${getBoxTypeClass(box.box.type)}`;
    boxElement.innerHTML = `
      <h3>${box.box.name}</h3>
      <p>${box.box.description}</p>
      <button class="button reward-button-title" onclick="handleOpenBox('${box.userBoxId}', this)"></button>
    `;
    boxesContainer.appendChild(boxElement);
  }
}

function getBoxTypeClass(type) {
  switch (type) {
    case "LOOT_BOX":
      return "loot-box";
    case "MYSTERY_BOX":
      return "mystery-box";
    case "WHEEL_OF_FORTUNE":
      return "wheel-of-fortune";
    default:
      return "";
  }
}

async function handleOpenBox(userBoxId, button) {
  button.disabled = true;
  button.innerText = "......";
  const rewards = await openBox(userBoxId);
  openedBoxIds.push(userBoxId); 
  displayRewards(rewards);
  button.closest(".box").remove();
}

function displayRewards(rewards) {
  clearRewards();
  const rewardsContainer = document.getElementById("rewards");
  for (const reward of rewards) {
    const rewardElement = document.createElement("div");
    rewardElement.className = "reward-item";
    if (reward.type === "LOYALTY_POINTS") {
      rewardElement.innerHTML = `
        <p class="reward-title">${reward.description}</p>
        <div style="background: var(--${reward.name.replace(/\s/g, '-').toLowerCase()})" class="reward-image-id"></div>
      `;
    } else {
      rewardElement.innerHTML = `
        <p class="reward-title">${reward.name}</p>
        <strong>${reward.description}</strong>
        <div style="background: var(--${reward.contentId})" class="reward-image-id"></div>
      `;
    }
    rewardsContainer.appendChild(rewardElement);
  }
  rewardTimeout = setTimeout(clearRewards, 7000);
}

function clearRewards() {
  clearTimeout(rewardTimeout);
  document.getElementById("rewards").innerHTML = "";
}

function clearBoxes() {
  const boxesElement = document.getElementById("boxes");
  if (boxesElement) {
    boxesElement.innerHTML = "";
  }
}