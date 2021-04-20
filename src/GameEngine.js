class GameEngine {
  constructor() {
    this.domain = "https://cfcards.molmorg.workers.dev/";
    this.hostname = new URL(this.domain).host;
    this.userIdKey = "cards-userId";
    this.game = null;
    this.cards = null;

    this.webSocket = null;
    this.gameUpdatedHandlers = [];
  }

  /* There are several view-states post game creation

  game.state: NotStarted

    OwnerWaiting
    NewPlayerForm
    NewPlayerWaiting

  game.state: Playing

    JudgeWaiting - judge is waiting for submissions
    PlayerSelect - player is choosing their card
    PlayerSubmitted - player selected, waiting for other players

  game.state: Judging

    JudgeSelect - judge is choosing the winner
    PlayerWaiting - player is waiting for the judge

  game.state: Reveal

    Reveal - judge needs to press 'next round' (timer can do it too) - same view

  */

  onGameUpdated(handler) {
    this.gameUpdatedHandlers.push(handler);
  }

  join() {
    const ws = new WebSocket(`wss://${this.hostname }/websocket/${this.game.id}`);
    let rejoined = false;
    const startTime = Date.now();

    ws.addEventListener("open", (event) => {
      this.webSocket = ws;
    });

    ws.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        console.error(`WebSocket error: ${JSON.stringify(data.error)}`);
        return;
      }
      this.game = data;
      this.gameUpdatedHandlers.forEach(handler => {
        handler(this.game);
      });
    });

    ws.addEventListener("close", (event) => {
      console.log("WebSocket closed, reconnecting:", event.code, event.reason);
      rejoin();
    });

    ws.addEventListener("error", (event) => {
      console.log("WebSocket  error, reconnecting:", event);
      rejoin();
    });

    // TODO - write a backoff algorithm
    const rejoin = async () => {
      if (!rejoined) {
        rejoined = true;
        this.webSocket = null;

        let timeSinceLastJoin = Date.now() - startTime;
        if (timeSinceLastJoin < 5000) {
          await new Promise((resolve) =>
            setTimeout(resolve, 5000 - timeSinceLastJoin)
          );
        }

        this.join();
      }
    };
  }

  ensureWebSocket() {
    if (!this.webSocket) {
      this.join();
    }
  }

  evaluateViewState() {
    const game = this.game;
    const viewState = {
      currentPlayer: null,
      state: null,
      isJudge: false,
      isOwner: false,
      playerSubmitted: false,
    };

    const userObject = this.getUserObject();

    if (userObject !== null) {
      const playerArray = game.players.filter(
        (p) => p.id === userObject.userId
      );
      viewState.currentPlayer = playerArray[0];

      if (game.currentJudgeIndex > -1) {
        viewState.isJudge =
          game.players[game.currentJudgeIndex].id === userObject.userId;
      }

      const owners = game.players.filter((p) => p.isGameOwner === true);
      viewState.isOwner = owners[0].id === userObject.userId;

      if (game.state === "Playing") {
        const playerIndex = game.players.indexOf(viewState.currentPlayer);
        const matchingSubmissions = game.submissions.filter(
          (s) => s.playerIndex === playerIndex
        );
        viewState.playerSubmitted = matchingSubmissions.length === 1;
      }
    }

    switch (game.state) {
      case "NotStarted":
        if (viewState.isOwner) {
          viewState.state = "OwnerWaiting";
        } else if (viewState.currentPlayer !== null) {
          viewState.state = "NewPlayerWaiting";
        } else {
          viewState.state = "NewPlayerForm";
        }
        break;

      case "Playing":
        if (viewState.isJudge) {
          viewState.state = "JudgeWaiting";
        } else if (viewState.playerSubmitted) {
          viewState.state = "PlayerSubmitted";
        } else {
          viewState.state = "PlayerSelect";
        }
        break;

      case "Judging":
        if (viewState.isJudge) {
          viewState.state = "JudgeSelect";
        } else {
          viewState.state = "PlayerWaiting";
        }
        break;

      case "Reveal":
        viewState.state = "Reveal";
        break;

      default:
        const message = `Invalid game state: ${game.state}`;
        throw new Error(message);
    }

    return viewState;
  }

  getUserObject() {
    const uoString = localStorage.getItem(this.userIdKey);
    // ensure correct format etc
    const userObject = JSON.parse(uoString);

    if (this.game && this.game.id === userObject.gameId) {
      return userObject;
    }
    // we only return this if it matches the current game id
    return null;
  }

  createRequest(path, method, payload) {
    const url = new URL(path, this.domain);
    const init = {
      method: method,
      headers: {},
    };

    if (payload) {
      init.body = JSON.stringify(payload);
      init.headers["Content-Type"] = "application/json";
    }

    const userObject = this.getUserObject();
    if (userObject) {
      init.headers[this.userIdKey] = userObject.userId;
    }

    const request = new Request(url.href, init);

    return request;
  }

  async getGame(gameId) {
    const request = this.createRequest(`/games/${gameId}`, "GET");
    const response = await fetch(request);
    const game = await response.json();
    this.game = game;
    return game;
  }

  async getCards() {
    const request = this.createRequest("/cards", "GET");
    const response = await fetch(request);
    const cards = await response.json();
    this.cards = cards;
    return cards;
  }

  async createGame(payload) {
    const request = this.createRequest("/games", "POST", payload);
    const response = await fetch(request);
    const game = await response.json();

    const userObject = {
      gameId: game.id,
      userId: response.headers.get(this.userIdKey),
    };

    localStorage.setItem(this.userIdKey, JSON.stringify(userObject));
    this.game = game;
    return game;
  }

  async startGame() {
    const request = this.createRequest(`/games/${this.game.id}/start`, "POST");
    const response = await fetch(request);
    const game = await response.json();

    this.game = game;
    return game;
  }

  async redeal() {
    const request = this.createRequest(`/games/${this.game.id}/redeal`, "POST");
    const response = await fetch(request);
    const game = await response.json();

    this.game = game;
    return game;
  }

  async joinGame(payload) {
    const request = this.createRequest(
      `/games/${this.game.id}/join`,
      "POST",
      payload
    );
    const response = await fetch(request);
    const game = await response.json();

    const userObject = {
      gameId: game.id,
      userId: response.headers.get(this.userIdKey),
    };

    localStorage.setItem(this.userIdKey, JSON.stringify(userObject));
    this.game = game;

    return game;
  }

  async submitCard(card) {
    const body = {
      submittedCard: card.id,
    };

    const request = this.createRequest(
      `/games/${this.game.id}/submit`,
      "POST",
      body
    );
    const response = await fetch(request);
    const game = await response.json();

    this.game = game;
    return game;
  }

  async pickWinner(submission) {
    const body = {
      winningSubmissionId: submission.id,
    };

    const request = this.createRequest(
      `/games/${this.game.id}/pickWinner`,
      "POST",
      body
    );
    const response = await fetch(request);
    const game = await response.json();

    this.game = game;
    return game;
  }

  async nextRound(submission) {
    const request = this.createRequest(
      `/games/${this.game.id}/nextRound`,
      "POST"
    );
    const response = await fetch(request);
    const game = await response.json();

    this.game = game;
    return game;
  }
}

export default GameEngine;
