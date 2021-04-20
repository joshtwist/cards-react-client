import React from "react";
import PlayGame from "./PlayGame";
import GameEngine from "./GameEngine.js";
import NewPlayerForm from "./NewPlayerForm";

class App extends React.Component {
  constructor(props) {
    super(props);

    this.createGame = this.createGame.bind(this);
  }

  async createGame(data) {
    const gameEngine = new GameEngine();
    try {
      const result = await gameEngine.createGame({
        player: data,
        minimumPlayers: 2,
      });

      window.location.href = `/${result.id}`;
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  render() {
    const path = new URL(document.location.href).pathname;

    if (path === "/") {
      return (
        <div>
          <h1>Offensive Cards</h1>
          <p>
            Created in the era of coronavirus, this is a simple online
            multiplayer version of Cards Against Humanity.
          </p>
          <p>
            To get started, you just need at least 2 friends (3+ players). You
            can create a new game by entering your name and initials below. Then
            you just need to share the URL with your friends - they'll be able
            to join the game until you start it.
          </p>
          <NewPlayerForm
            submitted={this.createGame}
            buttonText="Start new game"
          />
        </div>
      );
    }

    const match = path.match(/^\/(\w{64})$/);

    if (match.length === 2) {
      const gameId = match[1];
      return <PlayGame gameId={gameId} />;
    }

    return (
      <div>
        Invalid URL, go <a href="/">here</a> and create your own game{" "}
      </div>
    );
  }
}

export default App;
