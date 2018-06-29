import React, { Component } from 'react';
import Startup from './Startup'
import Experiment from './Experiment'
// import './App.css';



class App extends Component {
  initialState = {
    staircaseStarted: false,
    staircaseFinished: false,
    expInfo: {
      participant: null,
      age: null,
      gender: null,
      session: null,
      lateralization: null,
      substance: null
    },
    trial: null,
    concentration: null,
    concentrations: null,
    jar: null,
    threshold: null,
    questHandler: null,
    date: null
  };

  state = this.initialState;

  resetState = () => this.setState(this.initialState);

  componentDidMount = () => document.title = 'Threshold Estimation';


  _initQuestFromApi = async (expInfo) => {
    const response = await fetch('/quest', {
      method: 'post',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        participant: expInfo.participant,
        age: expInfo.age,
        gender: expInfo.gender,
        substance: expInfo.substance,
        lateralization: expInfo.lateralization,
        session: expInfo.session,
        date: expInfo.date
      })
    });

    return await response.json();
  };

  _updateQuestFromApi = async (participantResponse) => {
    const payload = {
      questHandler: this.state.questHandler,
      concentration: this.state.concentration,
      responseCorrect: participantResponse,
      comment: ''
    };

    const response = await fetch('/quest/update', {
      method: 'post',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    return await response.json();
  };



  // componentDidMount() {
  //   const foo = x('foo', 'citric acid', 'left', 'Retest');
  //   foo.then(f => console.log(f));
  //   // this.startStaircase();
  // };

  startStaircase = (expInfo) => {
    this.setState({expInfo: expInfo},
      () => {
        const expInfo = this.state.expInfo;
        const response = this._initQuestFromApi(expInfo);
        response.then(e => {
          this.setState({
            trial: e.trial,
            concentration: e.concentration,
            concentrations: e.questHandler.attributes.otherData.Concentration,
            jar: e.jar,
            questHandler: e.questHandler,
            date: e.date,
            staircaseStarted: true});
        });

      })
  };

  handleParticipantResponse = (response) => {
    const serverResponse = this._updateQuestFromApi(response);
    serverResponse.then( (e) => {
      console.log(e);
      this.setState({
        trial: e.trial,
        concentration: e.concentration,
        concentrations: e.questHandler.attributes.otherData.Concentration,
        jar: e.jar,
        threshold: e.threshold,
        questHandler: e.questHandler,
        staircaseFinished: e.finished
      })
    })
  };


  finishStaircase = () => {this.setState({staircaseFinished: true})};

  renderExperiment = () =>
  {
    return (
      <div>
        <Experiment trial={this.state.trial}
                    concentration={this.state.concentration}
                    concentrations={this.state.concentrations}
                    jar={this.state.jar}
                    threshold={this.state.threshold}
                    finished={this.state.staircaseFinished}
                    expInfo={this.state.expInfo}
                    questHandler={this.state.questHandler}
                    onResponse={this.handleParticipantResponse}
                    onRestart={this.resetState}/>
      </div>
    );
  };

  renderMainView = () => {
    if (!this.state.staircaseStarted) {
      return (
          <div className="exp-info">
            <Startup startStaircase={this.startStaircase}
                     dateSetter={this.setDate}/>
          </div>
      )
    } else {
      return <div className='experiment'>{this.renderExperiment()}</div>
    }
  };


  render() {
    return (
      <div className="app">
        <h2>Threshold Estimation</h2>
        {this.renderMainView()}
      </div>
    );
  }
}

export default App;
