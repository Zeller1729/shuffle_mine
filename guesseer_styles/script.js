let elementsList = []; // CSVからロードされた単語リスト
let targetElement = "";
let maxAttempts = 0;
let remainingAttempts = 0;
let gameActive = false;

// DOM要素の取得
const chatMessages = document.getElementById("chat-messages");
const fileArea = document.getElementById("file-area");
const setupArea = document.getElementById("setup-area");
const gameArea = document.getElementById("game-area");
const retryArea = document.getElementById("retry-area");
const csvFileInput = document.getElementById("csv-file");
const fileSelectBtn = document.getElementById("file-select-btn");
const maxAttemptsInput = document.getElementById("max-attempts");
const startBtn = document.getElementById("start-btn");
const userGuessInput = document.getElementById("user-guess");
const guessBtn = document.getElementById("guess-btn");
const retryBtn = document.getElementById("retry-btn");
const gameSubtitle = document.getElementById("game-subtitle");

// イベントリスナーの登録
fileSelectBtn.addEventListener("click", () => csvFileInput.click());
csvFileInput.addEventListener("change", handleFileSelect);

// ドラッグ＆ドロップのハンドリング
const chatContainer = document.querySelector(".chat-container");
chatContainer.addEventListener("dragover", (e) => {
  e.preventDefault();
  chatContainer.style.boxShadow = "0 4px 20px rgba(79, 70, 229, 0.4)";
});
chatContainer.addEventListener("dragleave", () => {
  chatContainer.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.1)";
});
chatContainer.addEventListener("drop", (e) => {
  e.preventDefault();
  chatContainer.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.1)";
  const files = e.dataTransfer.files;
  if (files.length > 0 && files[0].name.endsWith(".csv")) {
    readCsvFile(files[0]);
  } else {
    addMessage("system", "※CSVファイル(.csv)をドロップしてください。");
  }
});

startBtn.addEventListener("click", startGame);
maxAttemptsInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") startGame();
});

guessBtn.addEventListener("click", submitGuess);
userGuessInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") submitGuess();
});

retryBtn.addEventListener("click", resetGame);

// メッセージをチャットに追加する共通関数
function addMessage(sender, text) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);

  const bubbleDiv = document.createElement("div");
  bubbleDiv.classList.add("bubble");
  bubbleDiv.innerHTML = text.replace(/\n/g, "<br>");

  messageDiv.appendChild(bubbleDiv);
  chatMessages.appendChild(messageDiv);

  // 最新のメッセージが見えるようにスクロール
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ファイル選択時のハンドラ
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    readCsvFile(file);
  }
}

// CSVファイルを読み込む
function readCsvFile(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    parseAndSetCsv(e.target.result, file.name);
  };
  reader.onerror = function () {
    addMessage("system", "ファイルの読み込み中にエラーが発生しました。");
  };
  reader.readAsText(file, "UTF-8");
}

// CSVテキストをパースしてリストを設定
function parseAndSetCsv(text, filename) {
  const lines = text.split(/\r?\n/);
  const words = [];

  lines.forEach((line) => {
    const elements = line.split(",").map((item) => item.trim());
    elements.forEach((item) => {
      if (item) {
        words.push(item);
      }
    });
  });

  if (words.length < 2) {
    addMessage(
      "system",
      "エラー: リストには少なくとも2つ以上の単語が必要です。",
    );
    return;
  }

  elementsList = words;
  addMessage(
    "system",
    `「${filename}」から単語リストを読み込みました！\n登録単語数: ${elementsList.length} 件\n\n次に、回答可能な回数を入力して「ゲーム開始」ボタンを押してください。`,
  );
  console.log("Loaded words:", elementsList); // デバッグ用ログ
  gameSubtitle.textContent = `読み込み済み: ${filename} (単語数: ${elementsList.length})`;

  // UI切り替え
  fileArea.classList.add("hidden");
  setupArea.classList.remove("hidden");
  maxAttemptsInput.focus();
}

// ゲーム開始処理
function startGame() {
  const inputVal = parseInt(maxAttemptsInput.value);
  if (isNaN(inputVal) || inputVal <= 0) {
    alert("有効な回答回数を入力してください（1以上）。");
    return;
  }

  maxAttempts = inputVal;
  remainingAttempts = maxAttempts;
  gameActive = true;

  // ランダムに正解を選択
  const randomIndex = Math.floor(Math.random() * elementsList.length);
  targetElement = elementsList[randomIndex];

  // UIの切り替え
  setupArea.classList.add("hidden");
  gameArea.classList.remove("hidden");
  userGuessInput.focus();

  // 開始メッセージを表示
  addMessage(
    "system",
    `ゲームを開始しました！\n回答可能回数は ${maxAttempts} 回です。\nリスト内のいずれかの言葉を入力して送信してください。`,
  );
}

// ユーザーの回答処理
function submitGuess() {
  if (!gameActive) return;

  let guess = userGuessInput.value.trim();
  if (!guess) return;

  // リストに存在するか確認
  const guessIndex = elementsList.indexOf(guess);
  if (guessIndex === -1) {
    addMessage(
      "system",
      `「${guess}」は、単語リストに含まれていません。正しい表記で入力されているか確認してください。\n（※回数は減りません）`,
    );
    userGuessInput.value = "";
    return;
  }

  // ユーザーの回答をチャットに追加
  addMessage("user", guess);
  userGuessInput.value = "";
  remainingAttempts--;

  // 正解のインデックスを取得
  const targetIndex = elementsList.indexOf(targetElement);

  if (guess === targetElement) {
    // 正解
    addMessage(
      "system",
      `おめでとうございます！正解は「${targetElement}」でした！\n🎉あなたの勝ちです！🎉`,
    );
    endGame(true);
  } else if (remainingAttempts <= 0) {
    // 回数切れでゲームオーバー
    addMessage(
      "system",
      `残念！回答回数がなくなりました。\n正解は「${targetElement}」でした。\,,``🤪nあなたの負けです！🤪`,
    );
    endGame(false);
  } else {
    // 前後の判定
    let hint = "";
    if (guessIndex > targetIndex) {
      hint = `正解は「${guess}」より前（リストの上側）にあります。`;
    } else {
      hint = `正解は「${guess}」より後（リストの下側）にあります。`;
    }
    addMessage("system", `${hint}\n(残り回答回数: ${remainingAttempts}回)`);
  }
}

// ゲーム終了処理
function endGame(isWin) {
  gameActive = false;
  gameArea.classList.add("hidden");
  retryArea.classList.remove("hidden");
}

// ゲームのリセット（もう一回遊ぶ）
function resetGame() {
  addMessage("system", "--- 新しいゲームを開始します ---");

  retryArea.classList.add("hidden");
  setupArea.classList.remove("hidden");
  maxAttemptsInput.focus();
}
