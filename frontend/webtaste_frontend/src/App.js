import React, { Component } from 'react';
import Startup from './Startup'
import Experiment from './Experiment'
// import './App.css';



class App extends Component {
  initialState = {
    measurementStarted: false,
    measurementFinished: false,
    measurementId: null,
    metadata: {
      participant: null,
      age: null,
      gender: null,
      modality: null,
      algorithm: null,
      substance: null,
      lateralization: null,
      startVal: null,
      session: null,
      date: null
    },
    currentTrialNumber: null,
    trialsCompletedCount: null,
    concentration: null,
    concentrations: [],
    sampleNumber: null,
    threshold: null,
    date: null
  };

  state = this.initialState;

  resetState = () => this.setState(this.initialState);

  // componentDidMount = () => document.title = 'Threshold Estimation';


  _initStaircaseFromApi = async (expInfo) => {
    const response = await fetch('/api/measurements/', {
      method: 'post',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(expInfo)
    });

    return await response.json()
    // return json.measurement_id;
  };

  // _updateStaircaseFromApi = async (participantResponse) => {
  //   const payload = {
  //     staircaseHandler: this.state.staircaseHandler,
  //     concentration: this.state.concentration,
  //     responseCorrect: participantResponse,
  //     comment: ''
  //   };
  //
  //   const response = await fetch('/api/measurements/', {
  //     method: 'put',
  //     headers: {
  //       'Accept': 'application/json, text/plain, */*',
  //       'Content-Type': 'application/json'
  //     },
  //     body: JSON.stringify(payload)
  //   });
  //
  //   return await response.json();
  // };



  // componentDidMount() {
  //   const foo = x('foo', 'citric acid', 'left', 'Retest');
  //   foo.then(f => console.log(f));
  //   // this.startStaircase();
  // };

  startStaircase = async (expInfo) => {
    const r = await this._initStaircaseFromApi(expInfo);
    this.setState({
      measurementId: r.data.id,
      measurementStarted: r.data.started,
      measurementFinished: r.data.finished,
      trialsCompletedCount: 0,
      metadata: r.data.metadata
    });

    this.createNewTrial();
  };

  createNewTrial = async () => {
    const uri = '/api/measurements/' + this.state.measurementId + '/trials/';
    const response = await fetch(uri, {
      method: 'post',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: {}
    });

    if (response.status === 201) {
      const json = await response.json();
      this.setState({
        sampleNumber: json.data.sampleNumber,
        concentration: json.data.concentration,
        currentTrialNumber: json.data.trialNumber,
        measurementStarted: true
      });

      let concentrations = this.state.concentrations;
      concentrations.push(json.data.concentration);
      this.setState({concentrations: concentrations});

      return true
    } else {
      return false
    }

    // if (this.state.concentrations === null) {
    //   this.setState({
    //     concentrations: [json.data.concentration]
    //   })
    // } else {
    //   this.setState({
    //     concentrations: this.state.concentrations.push(json.data.concentration)
    //   })
    // }
  };

  submitParticipantResponse = async (participantResponse) => {
    const uri = '/api/measurements/' + this.state.measurementId + '/trials/' + this.state.currentTrialNumber;

    const payload = {
      response: "",
      responseCorrect: participantResponse,
    };

    await fetch(uri, {
      method: 'put',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const newTrial = await this.createNewTrial();
    if (!newTrial) {
      this.setState({measurementFinished: true})
    }
  };

  renderExperiment = () =>
  {
    return (
      <div>
        <Experiment trial={this.state.currentTrialNumber}
                    measurementId={this.state.measurementId}
                    concentration={this.state.concentration}
                    concentrations={this.state.concentrations}
                    sampleNumber={this.state.sampleNumber}
                    threshold={this.state.threshold}
                    finished={this.state.measurementFinished}
                    expInfo={this.state.metadata}
                    onResponse={this.submitParticipantResponse}
                    onRestart={this.resetState}/>
      </div>
    );
  };

  renderMainView = () => {
    if (!this.state.measurementStarted) {
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
