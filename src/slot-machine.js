const { LitElement, html, css } = window.Lit;

/**
 * Shared array to track spun boxes across all slot machine instances
 * This prevents reopening the same box when API is slow
 */
let spunBoxes = [];

/**
 * SlotMachine - A Lit web component that displays a 3x3 slot machine
 * Reuses the same GraphQL API from the fort  constructor() {
    super();
    this.availableBoxes = [];
    this.selectedBox = null;
    this.isSpinning = false;
    this.message = '';
    this.messageType = '';
    this.winningSymbol = null;
    this.slotSymbols = ['7️⃣', '💎', '⭐', '🔔', '🍒', '🍋', '🍊', '🍉', '🎰', '🎁'];system
 */
class SlotMachine extends LitElement {
  static properties = {
    contentId: { type: String, attribute: "content-id" },
    symbolSet: { type: String, attribute: "symbol-set" }, // Choose which symbol set to use
  };

  static styles = css`
    :host {
      display: block;
      margin: 0 auto;
    }

    .slot-machine-container {
      background-image: url("https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/1090271b-c880-473b-bf3d-099ea50c296a/bg_sm.webp?auto=format%2Ccompress");
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;
      border-radius: 15px;
      position: relative;
      &::before {
        content: "";
        position: absolute;
        background-image: url("https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/55b5eb0c-5777-4d56-8efa-3c382ffe46bb/FT.webp?auto=format%2Ccompress");
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 15px;
        z-index: 1;
        pointer-events: none;
      }
      .slot-machine-content,
      .info-area {
        max-width: 400px;
        margin: 0 auto;
        min-height: 120px;
        position: relative;
        padding-inline: 20px;
        &.bottom-info-area {
          max-width: 220px;
          transform: translateY(33px);
        }
      }
    }

    .title {
      text-align: center;
      color: #ffd700;
      font-size: 2.5em;
      font-weight: bold;
      text-shadow: 0 0 10px #ffd700, 0 0 20px #ffd700;
      margin-bottom: 20px;
      letter-spacing: 2px;
      font-family: "Noto Sans Ambassadori";
    }

    /* Rewards Display Area */
    .rewards-display,
    .rewards-message {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 15px;
      padding: 0px 20px 20px 20px;
      border-radius: 10px;
      transform: translateY(-5px);
    }
    .rewards-display {
      position: absolute;
      left: 50%;
      top: 0;
      flex-direction: row;
      flex-wrap: nowrap;
      padding: 0;
      gap: 0;
      width: 70%;
      overflow: hidden;
      max-width: 360px;
      transform: translateY(26px) translateX(-50%);
      column-gap: 15px;
      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: -20px;
        background: linear-gradient(rgb(93 0 255 / 20%), transparent);
        z-index: 1;
      }
    }

    .reward-symbol {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2px;
      border: 2px solid transparent;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      background-color: transparent;
    }

    /* Support for custom background images via CSS variables */
    .reward-symbol::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: var(--background-image, #071c0d);
      background-size: cover;
      background-position: center;
      opacity: 1;
      z-index: 0;
    }

    .reward-symbol > * {
      position: relative;
      z-index: 1;
    }

    .reward-symbol.winning {
      background: var(--background-image, #071c0d);
      animation: pulse 1s infinite;
      filter: brightness(1);
    }

    .reward-symbol-icon {
      width: 25px;
      height: 25px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: "Noto Sans Ambassadori";
    }

    .reward-symbol-icon img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .reward-symbol-label {
      font-size: 1em;
      color: rgb(255, 255, 255);
      text-align: center;
      display: flex;
      justify-content: center;
      align-items: center;
      column-gap: 0px;
      font-family: "Noto Sans Ambassadori";
      column-gap: 2px;
    }

    @keyframes pulse {
      0%,
      100% {
        filter: brightness(1);
      }
      50% {
        filter: brightness(1.7);
      }
    }

    /* Slot Machine Display */
    .slot-display-container {
      display: flex;
      gap: 20px;
      align-items: center;
      position: relative;
    }

    .slot-screen {
      flex: 1;
      border-radius: 15px;
      margin-inline: 60px;
      padding: 20px;
      margin-top: 75px;
    }

    .slot-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      column-gap: 5px;
    }

    .slot-reel {
      background: #1a1a2e;
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
      outline: 2px solid rgba(255, 215, 0, 0.3);
    }

    .slot-reel.middle-row {
      border-color: #ffd700;
      box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
    }

    /* Reel strip container - holds all symbols vertically */
    .reel-strip {
      display: flex;
      flex-direction: column;
      position: absolute;
      width: 100%;
      will-change: transform;
      transition: none;
      top: 0;
      left: 0;
    }

    .slot-reel.spinning .reel-strip {
      /* Use CSS variable for animation to maintain starting position */
      animation: none;
    }

    @keyframes roll-reel {
      from {
        transform: translateY(var(--start-pos, 0));
      }
      to {
        transform: translateY(
          calc(var(--start-pos, 0) + 100px)
        ); /* Height of one symbol - moving DOWN */
      }
    }

    /* Individual symbol in the strip */
    .slot-symbol {
      width: 100%;
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: var(--background-image-strip, #071c0d);
    }

    .slot-symbol img {
      width: 50px;
      height: 50px;
      object-fit: contain;
      pointer-events: none;
      user-select: none;
      transition: filter 0.2s ease;
    }

    .slot-reel.spinning .slot-symbol img {
      filter: blur(3px);
    }

    /* Lever */
    .lever-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      position: absolute;
      right: 0px;
      top: 50%;
      transform: translateY(-50%);
    }

    .lever {
      width: 20px;
      height: 120px;
      background: linear-gradient(to right, #c41e3a, #8b0000);
      border-radius: 20px;
      position: relative;
      cursor: pointer;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
      transition: transform 0.1s ease;
      transform: scale3d(1, 1, 1) translateY(-5px);
    }

    .lever:not(.disabled):hover {
      transform: scale3d(1, 0.95, 1) translateY(0px);
    }

    .lever.disabled {
      cursor: not-allowed;
    }

    .lever::before {
      content: "";
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      width: 50px;
      height: 50px;
      background: radial-gradient(circle, #ffd700, #ff8c00);
      border-radius: 50%;
      box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
    }
    .lever::after {
      content: "";
      position: absolute;
      bottom: 0px;
      right: 0;
      width: 50px;
      height: 20px;
      background: linear-gradient(to right, #c41e3a, #8b0000);
      border-bottom-right-radius: 10px;
    }

    .lever.pulled {
      animation: lever-pull 0.5s ease;
    }
    /*  Spin Button    
  .spin-button {
      font-size: .7em;
      border: none;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      text-align: center;
      background-image: radial-gradient(circle, #ff8c00, #c41e3a);
      color: white;
      cursor: pointer;
      position: absolute;
      transition: background 0.3s ease;
      left: 50%;
      transform: translateX(-50%);
      bottom: -60px;
      border: 2px solid #990000;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.7);
      font-family: 'Noto Sans Ambassadori Bold';
      z-index: 2;
      &:hover {
        background-image: radial-gradient(circle, #ffa537, #df2141);
      }
    }
    .spin-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .spin-button.pulled {
      opacity: 0.5;
      cursor: not-allowed;
    } */
    @keyframes lever-pull {
      0% {
        transform: scale3d(1, 0.95, 1) translateY(0px);
      }
      50% {
        transform: scale3d(1, 0.9, 1) translateY(5px);
      }
      100% {
        transform: scale3d(1, 0.95, 1) translateY(0px);
      }
    }

    /* Bottom Info Area */
    .info-area {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-radius: 10px;
      color: #fff;
    }

    .spins-counter {
      font-size: 1.1em;
      font-family: "Noto Sans Ambassadori";
      transform: translateY(1px);
      &.large {
        transform: translate(-4px, 2px);
      }
    }

    .spins-counter span {
      color: #ffd700;
      font-size: 1.1em;
      text-shadow: 0 0 10px #ffd700;
      font-family: "Noto Sans Ambassadori";
    }

    .message {
      text-align: center;
      padding: 15px;
      margin: 0 20px;
      border-radius: 10px;
      font-family: "Noto Sans Ambassadori";
      font-size: 0.9em;
      text-shadow: #c300ff 1px 0 10px;
    }

    .message.info {
      color: #ffffff;
    }

    .message.error {
      color: #ffffff;
    }

    .message.spacer {
      opacity: 0;
    }

    .refresh-button {
      padding: 0;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1.1em;
      transform: translate(2px, 3px);
      cursor: pointer;
      transition: all 0.3s ease;
      font-family: "Noto Sans Ambassadori";
      background: transparent;
    }

    .refresh-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .slot-symbol img {
        width: 50px;
        height: 50px;
      }

      .lever {
        margin: 20px 0;
      }

      .title {
        font-size: 1.8em;
        font-family: "Noto Sans Ambassadori";
      }
    }

    /* Prevent breaking on very small screens */
    @media (max-width: 450px) {
      :host {
        max-width: 380px;
        overflow: hidden;
        scale: 0.9;
      }
      .slot-grid {
        max-width: 240px;
      }
      .slot-machine-container {
        min-width: 380px;
      }

      .slot-machine-content,
      .info-area {
        min-width: 220px;
      }

      .slot-screen {
        margin-inline: 30px;
      }

      .lever-container {
        right: -7px;
        z-index: 2;
        .lever {
          border-bottom-left-radius: 0;
          &:after {
            display: none;
          }
          &::before {
            box-shadow: 0 0 20px rgba(0, 0, 0, 1), 0 0 20px rgba(0, 0, 0, 1);
            width: 40px;
            height: 40px;
          }
        }
      }
    }
  `;

  constructor() {
    super();
    this.availableBoxes = [];
    this.spunBoxIds = [];
    this.selectedBox = null;
    this.isSpinning = false;
    this.message = "";
    this.messageType = "";
    this.winningSymbol = null;
    this.lastBoxRewards = null; // Store last box rewards for display after spinning last wheel
    this.symbolSet = "default"; // Default symbol set

    // Sound effects
    this.sounds = {
      lever: new Audio(
        "https://assets.takeshape.io/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/97424d61-9a8c-4c7f-bfc0-cc673c28727c/LeverTwoLargeMetalPulls_x3eOD_01.wav"
      ), // Lever pull sound
      spin: new Audio(
        "https://assets.takeshape.io/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/d9c94d90-5d2a-4974-a603-4ce28f18f198/spin.wav"
      ), // Spinning sound
      win: new Audio(
        "https://assets.takeshape.io/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/45d39293-bebb-484e-8f0c-b3324bfebb6f/Slot%20Machine%20Win.wav"
      ), // Win sound
    };

    // Set volume levels
    this.sounds.lever.volume = 0.4;
    this.sounds.spin.volume = 0.6;
    this.sounds.win.volume = 0.3;

    // Define multiple symbol sets
    this.symbolSets = {
      default: [
        "https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/129c26b8-7847-4f3f-8e33-1edac2d46c30/07.png?auto=format%2Ccompress",
        "https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/5a81517b-0863-4d37-be8d-6fe5b6854647/08.png?auto=format%2Ccompress",
        "https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/f1871083-762b-4441-9816-a91e06d28316/04.png?auto=format%2Ccompress",
        "https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/5682beca-0744-428b-a5b5-cd12e9aeecdd/10.png?auto=format%2Ccompress",
        "https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/296e44c3-1411-45a0-b976-e05a37c3dcc2/09.png?auto=format%2Ccompress",
        "https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/cf0a32f9-19c8-4a87-b690-5d6c5a646feb/01.png?auto=format%2Ccompress",
        "https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/d07ddbbd-31c9-49fc-835e-d6600b0671ae/03.png?auto=format%2Ccompress",
        "https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/50289e36-3b9e-4335-9498-dee7835d73f9/05.png?auto=format%2Ccompress",
        "https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/44dd9b46-3a18-4c88-94e5-8fd8abf443eb/02.png?auto=format%2Ccompress",
        "https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/2917ca82-11b8-4c2a-aec5-7e506304fd8b/06.png?auto=format%2Ccompress",
      ],
      alternate: [
        "https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/73039046-5e0b-40b9-9de3-e135d98f1fcf/Symbol_Seven.png?auto=format%2Ccompress",
        "https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/41efaeb2-407e-490c-909d-5e5a9a38d555/Symbol_Spade.png?auto=format%2Ccompress",
        "https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/23845ae1-8faa-43c1-8095-235c7540e8b3/Symbol_Clover.png?auto=format%2Ccompress",
        "https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/1bff6501-f3d6-4307-bee2-fa7febd9d342/Symbol_Bell.png?auto=format%2Ccompress",
        "https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/cd21381d-17f0-43fe-b096-01d982846667/Symbol_Clubs.png?auto=format%2Ccompress",
        "https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/564d6a76-2c48-4ced-8d10-5ebbf81576e9/Symbol_Crown.png?auto=format%2Ccompress",
        "https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/9ef5ee0f-ee93-47d0-be3b-af92314f05bb/Symbol_Diamond.png?auto=format%2Ccompress",
        "https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/c7008c54-a32e-40a7-be81-7a7249f34542/Symbol_Heart.png?auto=format%2Ccompress",
        "https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/19290f93-51e2-4084-85e1-7408010e6a6a/Symbol_Yellow%20Scatter.png?auto=format%2Ccompress",
        "https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/ce8404d8-62b5-4161-9c70-46049cf15a8f/Symbol_White%20Scatter.png?auto=format%2Ccompress",
      ],
    };

    // Initialize symbol URLs and HTML
    this.updateSymbolSet();
    
    // Initial state: 777 in middle, 2nd and 3rd best symbols in top/bottom
    this.reelSymbols = [
      [this.symbolUrls[3], this.symbolUrls[9], this.symbolUrls[3]], // Top row
      [this.symbolUrls[0], this.symbolUrls[0], this.symbolUrls[0]], // Middle row: 777
      [this.symbolUrls[9], this.symbolUrls[3], this.symbolUrls[9]], // Bottom row
    ];

    // Translations
    this.translations = {
      en: {
        title: "SLOT MACHINE",
        spinsAvailable: "Spins",
        refresh: "Refresh",
        noActiveRewards: "No active rewards available",
        noActiveSlots: "No active slots available",
        pleaseLogin: "Please log in to play",
        failedToLoad: "Failed to load slot data",
        errorDuringSpin: "Error during spin. Please try again.",
        errorDetermining: "Error determining winning reward",
        youWon: "You won",
      },
      ka: {
        title: "სლოტის აპარატი",
        spinsAvailable: "სპინები",
        refresh: "განახლება",
        noActiveRewards: "აქტიური ჯილდოები არ არის",
        noActiveSlots: "აქტიური სლოტები არ არის",
        pleaseLogin: "გთხოვთ შეხვიდეთ თამაშის დასაწყებად",
        failedToLoad: "სლოტის მონაცემების ჩატვირთვა ვერ მოხერხდა",
        errorDuringSpin: "შეცდომა ბრუნვისას. გთხოვთ სცადოთ თავიდან.",
        errorDetermining: "შეცდომა გამარჯვებული ჯილდოს განსაზღვრისას",
        youWon: "თქვენ მოიგეთ",
      },
      ru: {
        title: "ИГРОВОЙ АВТОМАТ",
        spinsAvailable: "Spins",
        refresh: "Обновить",
        noActiveRewards: "Нет активных наград",
        noActiveSlots: "Нет активных слотов",
        pleaseLogin: "Пожалуйста, войдите, чтобы играть",
        failedToLoad: "Не удалось загрузить данные слота",
        errorDuringSpin: "Ошибка при вращении. Пожалуйста, попробуйте еще раз.",
        errorDetermining: "Ошибка при определении выигрышной награды",
        youWon: "Вы выиграли",
      },
      tr: {
        title: "SLOT MAKİNESİ",
        spinsAvailable: "Spins",
        refresh: "Yenile",
        noActiveRewards: "Aktif ödül yok",
        noActiveSlots: "Aktif slot yok",
        pleaseLogin: "Oynamak için lütfen giriş yapın",
        failedToLoad: "Slot verileri yüklenemedi",
        errorDuringSpin: "Döndürme sırasında hata. Lütfen tekrar deneyin.",
        errorDetermining: "Kazanan ödül belirlenirken hata",
        youWon: "Kazandınız",
      },
    };

    this.lang = document.documentElement.lang || "en";
  }

  connectedCallback() {
    super.connectedCallback();
    this.fetchSlotData();
  }

  /**
   * Called when observed attributes change
   */
  attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback(name, oldValue, newValue);
    if (name === 'symbol-set' && oldValue !== newValue) {
      this.updateSymbolSet();
    }
  }

  /**
   * Update symbol URLs based on selected symbol set
   */
  updateSymbolSet() {
    // Get the symbol set or use default
    const setName = this.symbolSet || 'default';
    this.symbolUrls = this.symbolSets[setName] || this.symbolSets.default;
    
    // Generate HTML strings from URLs
    this.slotSymbols = this.symbolUrls.map(
      (url) => `<img src="${url}" alt="symbol" />`
    );
    
    // Update reel symbols if they exist
    if (this.symbolUrls.length >= 10) {
      this.reelSymbols = [
        [this.symbolUrls[3], this.symbolUrls[9], this.symbolUrls[3]], // Top row
        [this.symbolUrls[0], this.symbolUrls[0], this.symbolUrls[0]], // Middle row: 777
        [this.symbolUrls[9], this.symbolUrls[3], this.symbolUrls[9]], // Bottom row
      ];
    }
  }

  /**
   * Get translated text
   */
  t(key) {
    const translations =
      this.translations[this.lang] || this.translations["en"];
    return translations[key] || this.translations["en"][key] || key;
  }

  /**
   * Map rewards to slot symbols based on index (1-10)
   * Each reward gets a unique symbol based on its position
   */
  getSymbolForReward(reward, index) {
    // Return the image from slotSymbols array based on index
    return this.slotSymbols[index] || this.slotSymbols[0]; // Default to first image if index > 9
  }

  /**
   * Get CSS class name from reward action
   * Returns the contentId or currencyCode based on action type
   */
  getRewardClassName(reward) {
    const action = reward.action[0];

    // GiveBonusAction - use bonus.contentId
    if (action.bonus?.contentId) {
      return action.bonus.contentId;
    }

    // GiveBoxAction - use box.contentId
    if (action.box?.contentId) {
      return action.box.contentId;
    }

    // GiveLoyaltyPointsAction - use currencyCode
    if (action.currencyCode) {
      return action.currencyCode;
    }

    return "default-reward";
  }

  /**
   * Get reward description for display in templates (returns html)
   */
  getRewardDescription(reward) {
    const action = reward.action[0];

    if (action.bonus?.description) {
      return action.bonus.description;
    }
    if (action.box?.description) {
      return action.box.description;
    }
    if (action.amount && action.currencyCode) {
      return html`${action.amount}
      ${action.currencyCode === "LPABFE"
        ? html`<img
            width="14"
            height="14"
            loading="lazy"
            src="https://www.ambassadoribet.com/_internal/ts-images/5da2b4d5-59f6-412a-82c3-f6a272b532be/dev/e411c811-02f3-4455-88c4-b7973fd24ae4/dadfgg%201.svg"
            alt="LPABFE"
          />`
        : action.currencyCode}`;
    }
    return "Mystery Reward";
  }

  /**
   * Get reward description as plain text for messages
   */
  getRewardDescriptionText(reward) {
    const action = reward.action[0];

    if (action.bonus?.description) {
      return action.bonus.description;
    }
    if (action.box?.description) {
      return action.box.description;
    }
    if (action.amount && action.currencyCode) {
      return `${action.amount} ${
        action.currencyCode === "LPABFE" ? "BC" : action.currencyCode
      }`;
    }
    return "Mystery Reward";
  }

  /**
   * Fetch slot machine data from GraphQL API
   */
  async fetchSlotData() {
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
                    ... on ActivateDepositBonusAction {
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
                contentId
              }
              status
              userBoxId
            }
          }
        }
      }
    `;

    try {
      const authData = window.extractAuthDataFromCookie();
      if (!authData || !authData.userId) {
        console.warn("Please log in to play");
        return;
      }

      const result = await window.fetchGraphQL(query, {
        userId: authData.userId,
      });

      let boxes = result.data.userBoxConnection.edges
        .map((edge) => edge.node)
        .filter(
          (box) =>
            box.status === "ACTIVE" &&
            box.box.type === "WHEEL_OF_FORTUNE" &&
            !spunBoxes.includes(box.userBoxId)
        );

      // Filter by content ID if specified
      if (this.contentId) {
        boxes = boxes.filter((box) => box.box?.contentId === this.contentId);
      }

      this.availableBoxes = boxes;

      if (this.availableBoxes.length === 0) {
        console.info("No active slots available");
      } else if (!this.selectedBox && this.availableBoxes.length > 0) {
        // Auto-select first box
        this.selectedBox = this.availableBoxes[0];
      }

      this.requestUpdate();
    } catch (error) {
      console.error("Error fetching slot data:", error);
    }
  }

  /**
   * Open a user box and get the winning reward
   */
  async openSlotBox(userBoxId) {
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
                ... on ActivateDepositBonusAction {
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

    const response = await window.fetchGraphQL(mutation, variables);

    if (!response || !response.data || !response.data.openUserBox) {
      throw new Error("Failed to open user box or invalid response structure.");
    }

    const rewardActions = response.data.openUserBox.userBox.reward.action;

    const actionIds = rewardActions.map((action) => {
      return action.bonusId || action.boxId || action.amount;
    });

    return actionIds;
  }

  /**
   * Handle lever pull and spin
   */
  async handleSpin() {
    if (!this.selectedBox || this.isSpinning) {
      return;
    }

    this.isSpinning = true;
    this.winningSymbol = null;
    this.message = "";
    this.requestUpdate();

    // Play lever pull sound
    this.playSound("lever");

    try {
      // Get the winning reward from API
      const awardedActionIds = await this.openSlotBox(
        this.selectedBox.userBoxId
      );

      // Find matching reward
      const winningRewardIndex = this.selectedBox.box.rewards.findIndex(
        (reward) => {
          const action = reward.action[0];
          const possibleId = action.bonusId || action.boxId || action.amount;
          return awardedActionIds.includes(possibleId);
        }
      );

      if (winningRewardIndex === -1) {
        console.error(
          "No matching reward found for the awarded actions:",
          awardedActionIds
        );
        this.isSpinning = false;
        this.requestUpdate();
        return;
      }

      const winningReward = this.selectedBox.box.rewards[winningRewardIndex];
      this.winningSymbol = this.getSymbolForReward(
        winningReward,
        winningRewardIndex
      );

      // Store current box rewards before clearing selectedBox
      this.lastBoxRewards = this.selectedBox.box.rewards;

      // Animate the spin
      await this.animateSlotSpin(this.winningSymbol);

      // Play win sound
      this.playSound("win");

      // Show winning message
      const rewardDesc = this.getRewardDescriptionText(winningReward);
      this.showMessage(`${this.t("youWon")}: ${rewardDesc}`, "info");

      // Mark this box as spun in the shared array
      spunBoxes.push(this.selectedBox.userBoxId);
      this.availableBoxes = this.availableBoxes.filter(
        (box) => box.userBoxId !== this.selectedBox.userBoxId
      );

      // Auto-select next box or clear selection
      this.selectedBox =
        this.availableBoxes.length > 0 ? this.availableBoxes[0] : null;

      this.isSpinning = false;
      this.requestUpdate();

      // Refresh data after delay
      setTimeout(() => this.fetchSlotData(), 2000);
    } catch (error) {
      console.error("Error during spin:", error);
      this.isSpinning = false;
      this.requestUpdate();
    }
  }

  /**
   * Animate slot machine reels spinning and stopping
   */
  async animateSlotSpin(winningSymbol) {
    const reels = this.shadowRoot.querySelectorAll(".slot-reel");
    // Animation timing (adjust these to match your sound effects)
    const spinDuration = 550; // Base spin duration in ms - time before first reel stops
    const reelStopDelay = 150; // Delay between each reel stopping in ms
    const finalTransitionDuration = 200; // Final snap animation duration in ms

    // Extract winning symbol URL
    const urlMatch = winningSymbol.match(/src="([^"]+)"/);
    const winningUrl = urlMatch ? urlMatch[1] : this.symbolUrls[0];

    // Play spinning sound
    this.playSound("spin");

    // Start spinning all reels with JavaScript-based animation for smooth continuous scroll
    reels.forEach((reel, index) => {
      const strip = reel.querySelector(".reel-strip");
      if (strip) {
        // Start from a random position within the strip
        const randomStart = -Math.floor(Math.random() * 2000);
        strip.style.transition = "none";
        strip.style.transform = `translateY(${randomStart}px)`;

        // Store the animation start time and position
        strip.dataset.startPos = randomStart;
        strip.dataset.startTime = Date.now();
      }
      reel.classList.add("spinning");
    });

    // Animate using requestAnimationFrame for smooth continuous scrolling
    let animationId;
    const animateReels = () => {
      const now = Date.now();
      reels.forEach((reel) => {
        if (!reel.classList.contains("spinning")) return;

        const strip = reel.querySelector(".reel-strip");
        if (!strip) return;

        const startPos = parseFloat(strip.dataset.startPos);
        const startTime = parseFloat(strip.dataset.startTime);
        const elapsed = now - startTime;

        // Move 2000px per second (20 symbols/sec) - doubled speed!
        const distance = (elapsed / 1000) * 5000;
        let newPos = startPos + distance;

        // Loop back when we've scrolled through all symbols (3000px)
        if (newPos > 0) {
          newPos = newPos - 3000;
          strip.dataset.startPos = newPos;
          strip.dataset.startTime = now;
        }

        strip.style.transform = `translateY(${newPos}px)`;
      });

      // Continue animation if any reel is still spinning
      const stillSpinning = Array.from(reels).some((reel) =>
        reel.classList.contains("spinning")
      );
      if (stillSpinning) {
        animationId = requestAnimationFrame(animateReels);
      }
    };

    animationId = requestAnimationFrame(animateReels);

    // Small delay to ensure CSS is applied
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Stop reels one by one (column by column)
    for (let col = 0; col < 3; col++) {
      await new Promise((resolve) =>
        setTimeout(resolve, spinDuration + col * reelStopDelay)
      );

      // Collect all reels in this column and normalize their positions
      const reelsData = [];

      // First pass: stop spinning and normalize all strips to a common offset
      for (let row = 0; row < 3; row++) {
        const reelIndex = row * 3 + col;
        const reel = reels[reelIndex];
        const strip = reel.querySelector(".reel-strip");
        if (!strip) continue;

        reel.classList.remove("spinning");

        // Get current position and normalize to first cycle (0 to -3000px range)
        const currentTransform = strip.style.transform;
        const currentMatch = currentTransform.match(/translateY\(([^)]+)px\)/);
        let currentPos = currentMatch ? parseFloat(currentMatch[1]) : 0;

        // Normalize to 0 to -3000 range
        while (currentPos < -3000) currentPos += 3000;
        while (currentPos > 0) currentPos -= 3000;

        // Snap to this normalized position instantly (no transition)
        strip.style.transition = "none";
        strip.style.transform = `translateY(${currentPos}px)`;

        reelsData.push({ reel, strip, currentPos, row });
      }

      // Force a reflow to ensure the snap is applied
      reelsData[0]?.strip.offsetHeight;

      // Very small delay for snap - keep it snappy!
      await new Promise((resolve) => setTimeout(resolve, 5));

      // Second pass: calculate final symbols and find a common base position
      const finalData = [];
      let commonBasePos = reelsData[0]?.currentPos || 0;

      for (const data of reelsData) {
        // Determine final symbol
        let finalUrl;
        if (data.row === 1) {
          // Middle row: winning symbol
          finalUrl = winningUrl;
        } else {
          // Top and bottom rows: random from 4th and 10th
          const topBottomUrls = [this.symbolUrls[3], this.symbolUrls[9]];
          finalUrl =
            topBottomUrls[Math.floor(Math.random() * topBottomUrls.length)];
        }

        // Find the index of the final symbol in the strip (first occurrence)
        const symbols = data.strip.querySelectorAll(".slot-symbol img");
        let targetIndex = 0;
        for (let i = 0; i < symbols.length; i++) {
          const img = symbols[i];
          if (img.src === finalUrl || img.src.includes(finalUrl)) {
            targetIndex = i;
            break;
          }
        }

        finalData.push({ ...data, targetIndex });
      }

      // Third pass: apply synchronized transition to final positions
      for (const data of finalData) {
        const finalPosition = -(data.targetIndex * 100) - 15;

        // Apply transition to final position (using finalTransitionDuration variable)
        data.strip.style.transition =
          `transform ${finalTransitionDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        data.strip.style.transform = `translateY(${finalPosition}px)`;
      }

      // Stop spinning sound on last column (after final transition completes)
      if (col === 2) {
        setTimeout(() => this.stopSound("spin"), finalTransitionDuration);
      }
    }

    // Cancel animation frame when done
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  }

  /**
   * Play sound effect
   */
  playSound(soundKey) {
    const sound = this.sounds[soundKey];
    if (sound) {
      sound.currentTime = 0;
      sound
        .play()
        .catch((err) =>
          console.warn(`Sound playback error for ${soundKey}:`, err)
        );
    }
  }

  /**
   * Stop sound effect
   */
  stopSound(soundKey) {
    const sound = this.sounds[soundKey];
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  }

  /**
   * Show a message to the user
   */
  showMessage(message, type = "info") {
    this.message = message;
    this.messageType = type;
    this.requestUpdate();
  }

  /**
   * Render message area
   */
  renderMessage() {
    if (!this.message) {
      return html``;
    }

    return html`
      <div class="message ${this.messageType}">${this.message}</div>
    `;
  }

  /**
   * Render rewards display area with message
   */
  renderRewardsInfo() {
    // If there's a message (like winning message), show it even if no box is selected
    if (this.message) {
      return html`
        <div class="rewards-message">
          <div class="message ${this.messageType}" style="width: 100%;">
            ${this.message}
          </div>
        </div>
      `;
    }

    // Only show "no active rewards" if no box AND no message
    if (!this.selectedBox) {
      return html`
        <div class="rewards-message">
          <div class="message info">${this.t("noActiveRewards")}</div>
        </div>
      `;
    }

    return html`<div class="rewards-message">
      <div class="message info spacer">*</div>
    </div>`;
  }

  /**
   * Render reward symbols
   */
  renderRewardsDisplay() {
    // Use lastBoxRewards if selectedBox is null (after spinning last wheel)
    const rewardsToDisplay = this.selectedBox
      ? this.selectedBox.box.rewards
      : this.lastBoxRewards;

    if (!rewardsToDisplay) {
      return html``;
    }

    return html`
      <div class="rewards-display">
        ${rewardsToDisplay.map((reward, index) => {
          const symbol = this.getSymbolForReward(reward, index);
          const className = this.getRewardClassName(reward);
          const isWinning = symbol === this.winningSymbol;

          return html`
            <div
              class="reward-symbol ${className} ${isWinning ? "winning" : ""}"
              style="--background-image: var(--${className})"
            >
              <div class="reward-symbol-icon" .innerHTML="${symbol}"></div>
              <div class="reward-symbol-label">
                ${this.getRewardDescription(reward)}
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }

  /**
   * Render slot machine display with 3x3 grid
   */
  renderSlotDisplay() {
    return html`
      <div class="slot-display-container">
        <div class="lever-container">
          <div
            class="lever ${this.isSpinning || !this.selectedBox
              ? "disabled"
              : ""} ${this.isSpinning ? "pulled" : ""}"
            @click="${this.handleSpin}"
          ></div>
        </div>
        <div class="slot-screen">
          <div class="slot-grid">
            ${[0, 1, 2].map((row) =>
              [0, 1, 2].map((col) => {
                const isMiddleRow = row === 1;
                // Set initial position to show first symbol (777 for middle, others for top/bottom)
                const initialIndex = row === 1 ? 0 : row === 0 ? 3 : 9;
                const initialOffset = -(initialIndex * 100);

                return html`
                  <div class="slot-reel ${isMiddleRow ? "middle-row" : ""}">
                    <div
                      class="reel-strip"
                      style="transform: translateY(${initialOffset - 15}px);"
                    >
                      ${this.symbolUrls.map(
                        (url) => html`
                          <div class="slot-symbol">
                            <img src="${url}" alt="symbol" />
                          </div>
                        `
                      )}
                      <!-- Duplicate symbols multiple times for diverse animation -->
                      ${this.symbolUrls.map(
                        (url) => html`
                          <div class="slot-symbol">
                            <img src="${url}" alt="symbol" />
                          </div>
                        `
                      )}
                      ${this.symbolUrls.map(
                        (url) => html`
                          <div class="slot-symbol">
                            <img src="${url}" alt="symbol" />
                          </div>
                        `
                      )}
                    </div>
                  </div>
                `;
              })
            )}
          </div>
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <div class="slot-machine-container">
        <div class="slot-machine-content">
          ${this.renderRewardsDisplay()} ${this.renderSlotDisplay()}
          <!--      Spin Button 
          <button 
            class="spin-button ${this.isSpinning || !this.selectedBox
            ? "disabled"
            : ""} ${this.isSpinning ? "pulled" : ""}"
            @click="${this.handleSpin}"
          >SPIN</button> -->
          ${this.renderRewardsInfo()}
        </div>

        <div class="info-area bottom-info-area">
          <div
            class="${this.availableBoxes.length >= 10
              ? "spins-counter large"
              : "spins-counter"}"
          >
            <span>${this.availableBoxes.length}</span>
          </div>
          <button
            class="refresh-button"
            @click="${this.fetchSlotData}"
            ?disabled="${this.isSpinning}"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M15.0711 7.99551C15.6179 8.07327 15.9981 8.57956 15.9204 9.12635C15.6826 10.7983 14.9218 12.3522 13.747 13.5654C12.5721 14.7785 11.0435 15.5888 9.37999 15.8801C7.7165 16.1714 6.00349 15.9288 4.48631 15.187C3.77335 14.8385 3.12082 14.3881 2.5472 13.8537L1.70711 14.6938C1.07714 15.3238 0 14.8776 0 13.9867V9.99997H3.98673C4.87763 9.99997 5.3238 11.0771 4.69383 11.7071L3.9626 12.4383C4.38006 12.8181 4.85153 13.1394 5.36475 13.3903C6.50264 13.9466 7.78739 14.1285 9.03501 13.9101C10.2826 13.6916 11.4291 13.0839 12.3102 12.174C13.1914 11.2641 13.762 10.0988 13.9403 8.84475C14.0181 8.29797 14.5244 7.91775 15.0711 7.99551ZM11.5137 0.812975C12.2279 1.16215 12.8814 1.61349 13.4558 2.14905L14.2929 1.31193C14.9229 0.681961 16 1.12813 16 2.01904V6H12.019C11.1281 6 10.6819 4.92287 11.3119 4.29291L12.0404 3.56441C11.6222 3.18346 11.1497 2.86125 10.6353 2.60973C9.49736 2.05342 8.21261 1.87146 6.96499 2.08994C5.71737 2.30841 4.57089 2.91611 3.68976 3.82599C2.80862 4.73586 2.23802 5.90124 2.05969 7.15523C1.98193 7.70201 1.47564 8.08223 0.928858 8.00447C0.382075 7.92671 0.00185585 7.42042 0.0796146 6.87363C0.31739 5.20166 1.07818 3.64782 2.25303 2.43465C3.42788 1.22148 4.95652 0.411217 6.62001 0.119916C8.2835 -0.171384 9.99651 0.0712179 11.5137 0.812975Z"
                fill="#B3B3B3"
              />
            </svg>
          </button>
        </div>
      </div>
    `;
  }
}

customElements.define("slot-machine", SlotMachine);
