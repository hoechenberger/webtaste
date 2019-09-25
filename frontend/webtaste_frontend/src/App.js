import React, { Component } from 'react';
import Startup from './Startup'
import Measurement from './Measurement'
import RegisterLogin from './RegisterLogin'
import EmailConfirmation from './EmailConfirmation'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import AccountSettings from "./AccountSettings";
import Landing from "./Landing";
import MeasurementsOverview from "./MeasurementsOverview";


class App extends Component {
  initialState = {
    loggedIn: false,
    userName: null,
    metadata: {}
  };

  state = this.initialState;

  // resetState = () => this.setState(this.initialState);

  resetState = () => this.setState({
    metadata: {}
  });

  onStartupSubmit = (studyId, metadata) => this.setState({
    studyId: studyId,
    metadata: metadata
  });

  onLogin = (userName) => this.setState({
    userName: userName,
    loggedIn: true
  });

  onLogout = () => this.setState({
    userName: null,
    loggedIn: false
  });

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
            <Route path="/account" exact
                   render={() => (
                       <AccountSettings
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
            <Route path="/measurements_overview" exact
                   render={() => (
                       <MeasurementsOverview
                           loggedIn={this.state.loggedIn}
                       />
                   )}
            />
            <Route path="/landing" exact
                   render={() => (
                       <Landing
                           loggedIn={this.state.loggedIn}
                           userName={this.state.userName}
                           onLogout={this.onLogout}
                       />
                   )}
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
