import React from "react";
import GameEngine from "./GameEngine.js";
import NewPlayerForm from "./NewPlayerForm";

function PlayersSoFarControl(props) {
  return (
    <div>
      <p>Players so far:</p>
      <div>
        {props.players.map((p, i) => (
          <div>
            <b>{p.name}</b> ({p.short})
          </div>
        ))}
      </div>
    </div>
  );
}

class WhiteCard extends React.Component {
  constructor(props) {
    super(props);

    this.cardSelected = this.cardSelected.bind(this);

    if (props.orientation && props.orientation.toLowerCase() === "horizontal") {
      this.className = "card white horizontal";
    } else if (
      props.orientation &&
      props.orientation.toLowerCase() === "vertical"
    ) {
      this.className = "card white vertical";
    } else {
      this.className = "card white";
    }
  }

  cardSelected() {
    if (!this.props.cardSelected) {
      // no op
      return;
    }
    this.props.cardSelected(this.props.card);
  }

  render() {
    return (
      <div onClick={this.cardSelected} className={this.className}>
        {this.props.card.text}
      </div>
    );
  }
}

class OwnerWaiting extends React.Component {
  constructor(props) {
    super(props);

    this.startGame = this.startGame.bind(this);
  }

  startGame() {
    this.props.startGame();
  }

  shareUrl() {
    const shareInfo = {
      title: "offensive.cards online",
      text: "Join me for a game of offensive.cards",
      url: document.location.href,
    };

    navigator.share(shareInfo);
  }

  render() {
    let shareHtml;

    if (typeof navigator.share === "function") {
      shareHtml = (
        <div>
          <button onClick={this.shareUrl}>Share</button>
        </div>
      );
    } else {
      shareHtml = <a href={document.location.href}>{document.location.href}</a>;
    }

    return (
      <div>
        <p>
          Waiting for more players to join, you need 3 to start. You have{" "}
          {this.props.players.length} so far, including yourself.
        </p>
        <p>Invite people to join you by send them this link: </p>
        <p>{shareHtml}</p>
        <PlayersSoFarControl players={this.props.players} />
        <p>
          {this.props.players.length >= this.props.minimumPlayers && (
            <button onClick={this.startGame}>Start game</button>
          )}
        </p>
      </div>
    );
  }
}

function BlackCard(props) {
  return (
    <div className="card black">{props.text.replace("_", "________")}</div>
  );
}

class Players extends React.Component {
  constructor(props) {
    super(props);

    autoBind(this);
  }

  isJudge(player) {
    if (!this.props.game) return false;
    const game = this.props.game;
    const match = game.players.indexOf(player) === game.currentJudgeIndex;
    return match;
  }

  hasSubmitted(player) {
    if (!this.props.game) return false;
    const game = this.props.game;
    const playerIndex = game.players.indexOf(player);
    const submissions = game.submissions.filter(
      (s) => s.playerIndex === playerIndex
    );
    return submissions.length === 1;
  }

  render() {
    var that = this;

    function JudgeBadge(player) {
      if (that.isJudge(player)) {
        return <div className="badge judge"></div>;
      }
    }

    function SubmittedBadge(player) {
      if (that.hasSubmitted(player)) {
        return <div className="badge submitted"></div>;
      }
    }

    let players = [];

    if (this.props.game) {
      players = this.props.game.players;
    }

    return (
      <div className="players">
        {players.map((p) => {
          let className = "player";
          if (p.id === this.props.currentPlayerId) {
            className = "player current";
          }
          return (
            <div key={p.id} tooltip={p.name} className={className}>
              {p.short}
              <div className="score">{p.score}</div>
              {JudgeBadge(p)}
              {SubmittedBadge(p)}
            </div>
          );
        })}
      </div>
    );
  }
}

function autoBind(instance) {
  const props = Object.getOwnPropertyNames(
    Object.getPrototypeOf(instance)
  ).filter((p) => typeof instance[p] === "function");
  props.forEach((p) => (instance[p] = instance[p].bind(instance)));
}

class PlayGame extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      viewState: {
        state: "Loading",
      },
    };

    this.gameEngine = new GameEngine();
    this.gameEngine.onGameUpdated((game) => {
      this.refreshViewState({ game });
    });

    autoBind(this);
  }

  lookupBlackCard(id) {
    // TODO - this is probably not very efficient - turn into dictionary?
    const cards = this.state.cards.blackCards.filter((c) => c.id === id);
    return cards[0].text;
  }

  lookupWhiteCard(id) {
    // TODO - this is probably not very efficient - turn into dictionary?
    const cards = this.state.cards.whiteCards.filter((c) => c.id === id);
    return cards[0].text;
  }

  async componentDidMount() {
    const [game, cards] = await Promise.all([
      this.gameEngine.getGame(this.props.gameId),
      this.gameEngine.getCards(),
    ]);

    this.refreshViewState({
      isLoading: false,
      game: game,
      cards: cards,
    });
  }

  refreshViewState(state) {
    let viewState = {};
    // if game state not loaded yet, no point setting up viewState
    if (this.state.game || state.game) {
      viewState = this.gameEngine.evaluateViewState();
    }
    const newState = Object.assign({ viewState: viewState }, state);
    this.setState(newState);
  }

  refresh(evt) {
    evt.preventDefault();
    document.location.reload();
  }

  async joinGame(player) {
    try {
      const game = await this.gameEngine.joinGame({ player: player });
      this.refreshViewState({ game });
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  async startGame() {
    try {
      const game = await this.gameEngine.startGame();
      this.refreshViewState({ game });
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  async nextRound() {
    try {
      const game = await this.gameEngine.nextRound();
      this.refreshViewState({ game });
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  async redeal(evt) {
    evt.preventDefault();
    try {
      if (window.confirm(`Are you sure you want to exchange your cards?`)) {
        const game = await this.gameEngine.redeal();
        this.refreshViewState({ game });
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  async cardSelected(card) {
    try {
      const viewState = this.state.viewState.state;
      if (viewState === "JudgeSelect") {
        const game = await this.gameEngine.pickWinner(card);

        this.refreshViewState({ game });
      } else if (this.state.game.state === "Playing") {
        const game = await this.gameEngine.submitCard(card);

        this.refreshViewState({ game });
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  ownerWaiting(game, viewState) {
    return (
      <OwnerWaiting
        players={game.players}
        startGame={this.startGame}
        minimumPlayers={game.minimumPlayers}
      />
    );
  }

  newPlayerForm(game, viewState) {
    return (
      <div>
        <p>
          Your friend {game.players[0].name} created a game. Enter your details
          below to join them.
        </p>
        <NewPlayerForm submitted={this.joinGame} buttonText="Join game" />
      </div>
    );
  }

  newPlayerWaiting(game, viewState) {
    return (
      <div>
        <p>
          Waiting for the game to start. There are {game.players.length} so far,
          including you.
        </p>
        <PlayersSoFarControl players={game.players} />
      </div>
    );
  }

  judgeWaiting(game, viewState) {
    return (
      <div>
        <div className="cards">
          <BlackCard text={this.lookupBlackCard(game.currentBlackCard)} />
        </div>
        <p>
          You're judging this round. Hold tight, we have{" "}
          {game.submissions.length}/{game.players.length - 1} entries so far.
        </p>
      </div>
    );
  }

  playerSelect(game, viewState) {
    const cards = this.state.viewState.currentPlayer.cards.map((c) => {
      return {
        id: c,
        text: this.lookupWhiteCard(c),
      };
    });

    const cardsHtml = cards.map((c) => (
      <WhiteCard
        key={c.id}
        card={c}
        cardSelected={this.cardSelected}
        orientation="vertical"
      />
    ));

    let redealButton = (
      <a href="#" onClick={this.redeal}>
        Do it!
      </a>
    );
    let redealsHtml;
    const redealsLeft = this.state.viewState.currentPlayer.redealsLeft;

    if (redealsLeft === 0) {
      redealsHtml = <p>You have no redeals remaining.</p>;
    } else if (redealsLeft === 1) {
      redealsHtml = <p>You have one redeal remaining. {redealButton}</p>;
    } else {
      redealsHtml = (
        <p>
          You have {redealsLeft} redeals remaining. {redealButton}
        </p>
      );
    }

    return (
      <div>
        <div className="cards">
          <BlackCard text={this.lookupBlackCard(game.currentBlackCard)} />
        </div>
        <p></p>
        <div className="cards">{cardsHtml}</div>
        <p>&nbsp;</p>
        {redealsHtml}
      </div>
    );
  }

  playerWaiting(game, viewState) {
    const playerIndex = game.players.findIndex(
      (p) => p.id === this.state.viewState.currentPlayer.id
    );
    const submission = game.submissions.find(
      (s) => s.playerIndex === playerIndex
    );
    const whiteCardText = this.lookupWhiteCard(submission.cardId);

    const judgeName = game.players[game.currentJudgeIndex].name;

    const submittedCardsHtml = submissions.map((s) => (
      <WhiteCard
        key={s.id}
        card={s}
        cardSelected={this.cardSelected}
        orientation="horizontal"
      />
    ));

    return (
      <div>
        <p>
          {judgeName} is judging - wait for their decision.
        </p>
        <div className="cards">
          <BlackCard text={this.lookupBlackCard(game.currentBlackCard)} />
        </div>
        <p>Submissions:</p>
        <div class="cardsHorizontal">{submittedCardsHtml}</div>
      </div>
    );
  }

  playerSubmitted(game, viewState) {
    const playerIndex = game.players.findIndex(
      (p) => p.id === this.state.viewState.currentPlayer.id
    );
    const submission = game.submissions.find(
      (s) => s.playerIndex === playerIndex
    );
    const whiteCardText = this.lookupWhiteCard(submission.cardId);

    return (
      <div>
        <p>
          Please wait: {game.submissions.length}/{game.players.length - 1}{" "}
          submissions so far.
        </p>
        <div className="cards">
          <BlackCard text={this.lookupBlackCard(game.currentBlackCard)} />
        </div>
        <p>You submitted:</p>
        <div className="cards">
          <WhiteCard card={{ text: whiteCardText }} />
        </div>
      </div>
    );
  }

  judgeSelect(game, viewState) {
    const submissions = this.state.game.submissions.map((s) => {
      return {
        id: s.id,
        text: this.lookupWhiteCard(s.cardId),
      };
    });

    const submittedCardsHtml = submissions.map((s) => (
      <WhiteCard
        key={s.id}
        card={s}
        cardSelected={this.cardSelected}
        orientation="horizontal"
      />
    ));

    return (
      <div>
        <div className="cards">
          <BlackCard text={this.lookupBlackCard(game.currentBlackCard)} />
        </div>
        <p>Select a winning card:</p>
        <div class="cardsHorizontal">{submittedCardsHtml}</div>
      </div>
    );
  }

  reveal(game, viewState) {
    const lr = game.lastRound;
    const blackCardText = this.lookupBlackCard(lr.blackCard);
    const whiteCardText = this.lookupWhiteCard(lr.whiteCard);
    const player = game.players[lr.winningPlayerIndex];

    let nextRound = <p></p>;
    if (this.state.viewState.isJudge) {
      nextRound = <button onClick={this.nextRound}>Next round</button>;
    }

    return (
      <div>
        <h1>Winner!</h1>
        <img
          src={lr.gifUrl}
          alt="Celebration animation"
          className="celebrationGif"
        />
        <p>{player.name} 👏👏👏</p>
        <div className="cards">
          <BlackCard text={blackCardText.replace("_", whiteCardText)} />
        </div>
        {nextRound}
      </div>
    );
  }

  notLoaded(game, viewState) {
    return <div>Game not loaded... (viewState: {viewState})</div>;
  }

  mainViewSwitch() {
    const game = this.state.game;
    const viewState = this.state.viewState.state;

    var switchDict = {
      OwnerWaiting: this.ownerWaiting,
      NewPlayerForm: this.newPlayerForm,
      NewPlayerWaiting: this.newPlayerWaiting,
      JudgeWaiting: this.judgeWaiting,
      PlayerSelect: this.playerSelect,
      PlayerSubmitted: this.playerSubmitted,
      PlayerWaiting: this.playerWaiting,
      JudgeSelect: this.judgeSelect,
      Reveal: this.reveal,
      Loading: this.notLoaded,
    };

    // ensure the websocket for all states where the game object should be refreshed
    if (!["Loading", "NewPlayerForm"].includes(viewState)) {
      this.gameEngine.ensureWebSocket();
    }

    let fn = switchDict[viewState];

    if (!fn || typeof fn === undefined) {
      fn = this.notLoaded;
    }

    return fn(game, viewState);
  }

  render() {
    let currentPlayerId = -1;
    if (this.state.viewState.currentPlayer) {
      currentPlayerId = this.state.viewState.currentPlayer.id;
    }
    return (
      <div>
        <Players game={this.state.game} currentPlayerId={currentPlayerId} />
        <p>&nbsp;</p>
        {this.mainViewSwitch()}
        <p>&nbsp;</p>
        <p>
          Having trouble? Try{" "}
          <a href="#" onClick={this.refresh}>
            refreshing
          </a>
          .
        </p>
      </div>
    );
  }
}

export default PlayGame;
