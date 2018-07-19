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
      modality: null,
      algorithm: null,
      substance: null,
      lateralization: null,
      startVal: null,
      session: null,
      date: null
    },
    trial: null,
    concentration: null,
    concentrations: null,
    jar: null,
    threshold: null,
    staircaseHandler: null,
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

    const json = await response.json();
    return json.measurement_id;
  };

  _updateStaircaseFromApi = async (participantResponse) => {
    const payload = {
      staircaseHandler: this.state.staircaseHandler,
      concentration: this.state.concentration,
      responseCorrect: participantResponse,
      comment: ''
    };

    const response = await fetch('/api/measurements/', {
      method: 'patch',
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

  startStaircase = async (expInfo) => {
    const measurementId = await this._initStaircaseFromApi(expInfo);
    console.log(measurementId);

    // this.setState({expInfo: expInfo},
    //   () => {
    //     const expInfo = this.state.expInfo;
    //     // const foo = await this._initStaircaseFromApi(expInfo);
    //     console.log(foo)
    //     // this._initStaircaseFromApi(expInfo).then(response => {
    //     //   this.setState({measurement_id: response.measurement_id});
    //     //     // trial: e.trial,
    //     //     // concentration: e.concentration,
    //     //     // concentrations: e.staircaseHandler.attributes.otherData.Concentration,
    //     //     // jar: e.jar,
    //     //     // staircaseHandler: e.staircaseHandler,
    //     //     // date: e.date,
    //     //     // staircaseStarted: true});
    //     //     console.log(response.measurement_id);
    //     // });
    //
    //   })
  };

  handleParticipantResponse = (response) => {
    const serverResponse = this._updateStaircaseFromApi(response);
    serverResponse.then( (e) => {
      console.log(e);
      this.setState({
        trial: e.trial,
        concentration: e.concentration,
        concentrations: e.staircaseHandler.attributes.otherData.Concentration,
        jar: e.jar,
        threshold: e.threshold,
        staircaseHandler: e.staircaseHandler,
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
                    questHandler={this.state.staircaseHandler}
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
