import React, { Component } from 'react';
import Startup from './Startup'
import Measurement from './Measurement'
import RegisterLogin from './RegisterLogin'
import EmailConfirmation from './EmailConfirmation'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

// import './App.css';



class App extends Component {
  initialState = {
    loggedIn: false,
    metadata: {}
  };

  state = this.initialState;

  // resetState = () => this.setState(this.initialState);

  resetState = () => this.setState({
    metadata: {}
  });

  // componentDidMount() {
  //   const foo = x('foo', 'citric acid', 'left', 'Retest');
  //   foo.then(f => console.log(f));
  //   // this.startMeasurement();
  // };

  onStartupSubmit = (studyId, metadata) => this.setState({
    studyId: studyId,
    metadata: metadata
  });

  onLogin = () => this.setState({loggedIn: true});
  onLogout = () => this.setState({loggedIn: false});

  // renderMainView = () => {
  //   if (!this.state.loggedIn) {
  //     return <RegisterLogin onLogin={this.onLogin}/>
  //   } else {
  //     if (!this.state.metadataSubmitted) {
  //       return <Startup onMetadataSubmit={this.onMetadataSubmit}/>
  //     } else {
  //       return (
  //             <Measurement
  //                 metadata={this.state.metadata}
  //                 onRestart={this.resetState}/>
  //       )
  //     }
  //   }
  // };

  genTitle = () => {
    if (Object.keys(this.state.metadata).length > 0) {
      if (this.state.metadata.modality === 'gustatory') {
        return 'Gustatory Threshold Estimation'
      } else if (this.state.metadata.modality === 'olfactory') {
        return 'Olfactory Threshold Estimation'
      }
    } else {
      return 'Threshold Estimation'
    }
  };

  render() {
    return (
      <div className="app">
        <h2>{this.genTitle()}</h2>
        {/*{this.renderMainView()}*/}
        <Router>
          <Switch>
            <Route path="/startup" exact
                   render={() => (
                       <Startup
                           onSubmit={this.onStartupSubmit}
                           loggedIn={this.state.loggedIn}/>
                   )}
            />
            <Route path="/measurement" exact
                   render={() => (
                       <Measurement
                           loggedIn={this.state.loggedIn}
                           studyId={this.state.studyId}
                           metadata={this.state.metadata}
                           onRestart={this.resetState} />
                   )}
            />
            <Route path="/confirm_email" exact
                   component={EmailConfirmation}
            />
            <Route path="/" exact
                   render={() => (
                       <RegisterLogin
                           onLogin={this.onLogin}
                           loggedIn={this.state.loggedIn} />
                   )}
            />
          </Switch>
        </Router>
      </div>
    )
  }
}

export default App;
