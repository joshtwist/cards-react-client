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
  }

  lookupWhiteCard(id) {
    // TODO - this is probably not very efficient - turn into dictionary?
    const cards = this.state.whiteCards.filter((c) => c.id === id);
    return cards[0].text;
  }

  lookupBlackCard(id) {
    // TODO this is probably not very efficient - turn into dictionary?
    const cards = this.state.blackCards.filter((c) => c.id === id);
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
    } else if (this.state.viewState.state === "NewPlayerWaiting") {
      return (
        <div>
          <p>
            Waiting for the game to start. There are {game.players.length}{" "}
            so far, including you.
          </p>
          <PlayersSoFarControl players={game.players} />
        </div>
      );
    } else {
      return <div>Game not loaded... (viewState: {viewState})</div>;
    }
  }
}

export default PlayGame;
