import React, { Component } from 'react';
import Startup from './Startup'
import Measurement from './Measurement'
import RegisterLogin from './RegisterLogin'
// import './App.css';



class App extends Component {
  initialState = {
    loggedIn: false,
    metadataSubmitted: false,
    metadata: {}
  };

  state = this.initialState;

  // resetState = () => this.setState(this.initialState);

  resetState = () => this.setState({
    metadataSubmitted: false,
    metadata: {}
  });

  // componentDidMount() {
  //   const foo = x('foo', 'citric acid', 'left', 'Retest');
  //   foo.then(f => console.log(f));
  //   // this.startMeasurement();
  // };

  onMetadataSubmit = (metadata) => this.setState({
    metadataSubmitted: true,
    metadata: metadata
  });

  onLogin = () => this.setState({loggedIn: true});
  onLogout = () => this.setState({loggedIn: false});

  renderMainView = () => {
    if (!this.state.loggedIn) {
      return (
        <div className="register-login">
          <RegisterLogin onLogin={this.onLogin}/>
        </div>
      )
    } else {
      if (!this.state.metadataSubmitted) {
        return (
            <div className="measurement-info">
              <Startup onMetadataSubmit={this.onMetadataSubmit}/>
            </div>
        )
      } else {
        return (
            <div className="measurement">
              <Measurement
                  metadata={this.state.metadata}
                  onRestart={this.resetState}/>
            </div>
        )
      }
    }
  };

  render() {
    return (
      <div className="app">
        <h2>Threshold Estimation</h2>
        {this.renderMainView()}
      </div>
    )
  }
}

export default App;
