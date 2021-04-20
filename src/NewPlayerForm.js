import React from "react"

class NewPlayerForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "",
      short: "",
    };

    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleShortChange = this.handleShortChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleNameChange(evt) {
    this.setState({
      name: evt.target.value,
    });
  }

  handleShortChange(evt) {
    this.setState({
      short: evt.target.value,
    });
  }

  handleSubmit(evt) {
    evt.preventDefault();

    const player = {
      name: this.state.name,
      short: this.state.short,
    };

    this.props.submitted(player);
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <div>Enter your name, e.g. "Jenny Sanders"</div>
        <div>
          <input
            autoComplete="off"
            type="text"
            placeholder="Your name"
            value={this.state.name}
            onChange={this.handleNameChange}
            maxLength="30"
          />
        </div>
        <div>Enter two initials, e.g. JS</div>
        <div>
          <input
            className="upper"
            autoComplete="off"
            placeholder="AB"
            onChange={this.handleShortChange}
            maxLength="2"
            value={this.state.short}
          />
        </div>
        <div>
          <button type="submit">{this.props.buttonText}</button>
        </div>
      </form>
    );
  }
}

export default NewPlayerForm