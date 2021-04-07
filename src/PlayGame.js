import React from "react";
import GameEngine from "./GameEngine.js";
import NewPlayerForm from "./NewPlayerForm";

function PlayersSoFarControl(props) {
  return (
    <div>
      <p>Players:</p>
      <div>
        {props.players.map((p, i) => (
          <div>
            {p.short} ({p.score})
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
  }

  cardSelected() {
    this.props.cardSelected(this.props.card);
  }

  render() {
    return <div onClick={this.cardSelected}>{this.props.card.text}</div>;
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

  render() {
    return (
      <div>
        <p>
          Waiting for more players to join, you need 3 to start. You have{" "}
          {this.props.players.length} so far, including yourself.
        </p>
        <p>Invite people to join you by send them this link: </p>
        <p>
          <a href={document.location.href}>{document.location.href}</a>
        </p>
        <PlayersSoFarControl players={this.props.players} />
        <p>
          {this.props.players.length > 1 && (
            <button onClick={this.startGame}>Start game</button>
          )}
        </p>
      </div>
    );
  }
}

function BlackCard(props) {
  return <p>{props.text.replace("_", "________")}</p>;
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

    this.joinGame = this.joinGame.bind(this);
    this.startGame = this.startGame.bind(this);
    this.cardSelected = this.cardSelected.bind(this);
    this.lookupWhiteCard = this.lookupWhiteCard.bind(this);
    this.lookupBlackCard = this.lookupBlackCard.bind(this);
    this.nextRound = this.nextRound.bind(this);
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

    this.setState({
      isLoading: false,
      game: game,
      cards: cards,
    });

    this.refreshViewState();
  }

  refreshViewState() {
    // if game state not loaded yet, no point setting up viewState
    if (!this.state.game) {
      return;
    }
    const viewState = this.gameEngine.evaluateViewState();
    this.setState({
      viewState: viewState,
    });
  }

  async joinGame(player) {
    const game = await this.gameEngine.joinGame({ player: player });
    this.setState({
      game: game,
    });

    this.refreshViewState();
  }

  async startGame() {
    const game = await this.gameEngine.startGame();
    this.setState({
      game: game,
    });

    this.refreshViewState();
  }

  async nextRound() {
    const game = await this.gameEngine.nextRound();
    this.setState({
      game: game
    });

    this.refreshViewState();
  }

  async cardSelected(card) {
    const viewState = this.state.viewState.state;
    if (viewState === "JudgeSelect") {
      const game = await this.gameEngine.pickWinner(card);
      this.setState({
        game: game,
      });

      this.refreshViewState();
    } else if (this.state.game.state === "Playing") {
      const game = await this.gameEngine.submitCard(card);
      this.setState({
        game: game,
      });

      this.refreshViewState();
    }
  }

  render() {
    const game = this.state.game;
    const viewState = this.state.viewState.state;

    if (viewState === "OwnerWaiting") {
      return <OwnerWaiting players={game.players} startGame={this.startGame} />;
    } else if (viewState === "NewPlayerForm") {
      return (
        <div>
          <p>
            Your friend {game.players[0].name} created a game. Enter your
            details below to join them.
          </p>
          <NewPlayerForm submitted={this.joinGame} buttonText="Join game" />
        </div>
      );
    } else if (viewState === "NewPlayerWaiting") {
      return (
        <div>
          <p>
            Waiting for the game to start. There are {game.players.length} so
            far, including you.
          </p>
          <PlayersSoFarControl players={game.players} />
        </div>
      );
    } else if (viewState === "JudgeWaiting") {
      return (
        <div>
          <p>
            You're judging this round. Hold tight, we have{" "}
            {game.submissions.length}/{game.players.length - 1} entries so far.
          </p>
        </div>
      );
    } else if (viewState === "PlayerSelect") {
      const cards = this.state.viewState.currentPlayer.cards.map((c) => {
        return {
          id: c,
          text: this.lookupWhiteCard(c),
        };
      });

      const cardsHtml = cards.map((c) => (
        <li key={c.id}>
          <WhiteCard card={c} cardSelected={this.cardSelected} />
        </li>
      ));

      return (
        <div>
          <BlackCard text={this.lookupBlackCard(game.currentBlackCard)} />
          {cards.length} card(s).
          <ul>{cardsHtml}</ul>
        </div>
      );
    } else if (viewState === "PlayerWaiting") {
      const playerIndex = game.players.indexOf(this.state.viewState.currentPlayer);
      const matchingSubmissions = game.submissions.filter(s => s.playerIndex === playerIndex);
      const submission = matchingSubmissions[0];
      const whiteCardText = this.lookupWhiteCard(submission.cardId);

      return (
        <div>
          <p>Please wait: {game.submissions.length}/{game.players.length -1} submissions so far.</p>
          <BlackCard text={this.lookupBlackCard(game.currentBlackCard)} />
          <p>You submitted:</p>
          <WhiteCard card={{text: whiteCardText}} />
        </div>
      )
    } else if (viewState === "JudgeSelect") {
      const cards = this.state.game.submissions.map((s) => {
        return {
          id: s.id,
          text: this.lookupWhiteCard(s.cardId),
        };
      });

      const cardsHtml = cards.map((c) => (
        <li key={c.id}>
          <WhiteCard card={c} cardSelected={this.cardSelected} />
        </li>
      ));

      return (
        <div>
          <BlackCard text={this.lookupBlackCard(game.currentBlackCard)} />
          {cards.length} card(s).
          <ol>{cardsHtml}</ol>
        </div>
      );
    } else if (viewState === "Reveal") {
      const lr = game.lastRound;
      const blackCardText = this.lookupBlackCard(lr.blackCard);
      const whiteCardText = this.lookupWhiteCard(lr.whiteCard);
      const player = game.players[lr.winningPlayerIndex];

    
      let nextRound = <p></p>;
      if (this.state.viewState.isJudge) {
        nextRound = <button onClick={this.nextRound}>Next round</button>
      }

      return (
        <div>
          <h1>Winner!</h1>
          <img src={lr.gifUrl} alt="Celebration animation"/>
          <p>{player.name} 👏👏👏</p>
          <BlackCard text={blackCardText.replace('_', whiteCardText)} />
          {nextRound}
        </div>
      );
    } else {
      return <div>Game not loaded... (viewState: {viewState})</div>;
    }
  }
}

export default PlayGame;
