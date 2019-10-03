import React, {Component} from 'react';
import Startup from './Startup'
import Measurement from './Measurement'
import RegisterLogin from './RegisterLogin'
import EmailConfirmation from './EmailConfirmation'
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';
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

  componentDidMount = async () => {
    await this._checkIfLoggedInAlready();
  };


  _checkIfLoggedInAlready = async () => {
    // Try to access the user settings page, which requires a valid cookie to
    // be set. We cannot check for the cookie directly in JS, as it's set to
    // HttpOnly, that's why we're doing this workaround.
    const uri = '/api/user/settings';
    const response = await fetch(uri, {method: 'get'});
    const json = await response.json();

    if (response.ok) {
      this.setState({
        loggedIn: true,
        userName: json.data.name
      })
    }
  };
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

  onLogout = async () => {
    const uri = '/api/user/logout';
    const response = await fetch(uri, {method: 'get'});
    if (response.ok) {
      this.setState({
        userName: null,
        loggedIn: false
      });
    }
  };

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
        <Router>
          <Switch>
            <Route path="/startup" exact>
              <Startup
                onSubmit={this.onStartupSubmit}
                loggedIn={this.state.loggedIn} />
            </Route>

            <Route path="/account" exact>
              <AccountSettings
                loggedIn={this.state.loggedIn} />
            </Route>

            <Route path="/measurement" exact>
              <Measurement
                loggedIn={this.state.loggedIn}
                studyId={this.state.studyId}
                metadata={this.state.metadata}
                onRestart={this.resetState} />
            </Route>

            <Route path="/confirm_email" exact
                   component={EmailConfirmation} />

            <Route path="/measurements_overview" exact>
              <MeasurementsOverview loggedIn={this.state.loggedIn} />
            </Route>

            <Route path="/landing" exact>
              <Landing
                loggedIn={this.state.loggedIn}
                userName={this.state.userName}
                onLogout={this.onLogout} />
            </Route>

            <Route path="/" exact>
              <RegisterLogin
                onLogin={this.onLogin}
                loggedIn={this.state.loggedIn} />
            </Route>
          </Switch>
        </Router>
      </div>
    )
  }
}

export default App;
