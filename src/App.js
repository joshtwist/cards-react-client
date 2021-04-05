import React from "react";
import PlayGame from "./PlayGame";
import GameEngine from "./GameEngine.js";
import NewPlayerForm from "./NewPlayerForm"

class App extends React.Component {
  constructor(props) {
    super(props);

    this.createGame = this.createGame.bind(this);
  }

  async createGame(data) {
    const gameEngine = new GameEngine();
    const result = await gameEngine.createGame({
      player: data,
    });

    window.location.href = `/${result.id}`;
  }

  render() {
    const path = new URL(document.location.href).pathname;

    if (path === "/") {
      return <NewPlayerForm submitted={this.createGame} buttonText="Start new game" />;
    }

    const match = path.match(/^\/(\w{64})$/);

    if (match.length === 2) {
      const gameId = match[1];
      return <PlayGame gameId={gameId} />;
    }

    return <div>Invalid URL, go <a href="/">here</a> and create your own game </div>;
  }
}

export default App;
