import React, { Component } from 'react';
import { Button, Card, CardBody, CardHeader } from "reactstrap";
import { withRouter } from 'react-router-dom'


class MeasurementsOverview extends Component {
  state = {
    studyIds: [],
    studyNames: [],
    measurements: []
  };

  componentDidMount = async () => {
    await this.fetchStudies();
  };

  fetchStudies = async () => {
    const uri = '/api/studies';
    const response = await fetch(uri, {method: 'get'});
    const json = await response.json();
    const studyIds = json.data.studies.map( (study) => { return study.id });
    const studyNames = json.data.studies.map( (study) => { return study.name });

    const measurements = await Promise.all(
      studyIds.map( (studyId) => { return this.fetchMeasurements(studyId) })
    );

    if (response.ok) {
      this.setState({
        studyIds: studyIds,
        studyNames: studyNames,
        measurements: measurements
      });
    } else {
      console.log('Could not retrieve studies!')
    }
  };

  fetchMeasurements = async (studyId) => {
    const uri = `/api/studies/${studyId}/measurements`;
    const response = await fetch(uri, {method: 'get'});
    const json = await response.json();
    const measurements = json.data.map( (measurement) => {
      const data = {
        algorithm: measurement.metadata.algorithm,
        participant: measurement.metadata.participant
      };
      return data;
    });

    if (response.ok) {
      return measurements;
    } else {
      console.log('Could not retrieve measurements!')
    }
  };


  navigateToLanding = () => {
    this.props.history.push('/landing')
  };

  render = () => {
    if (!this.props.loggedIn) {
      return null
    }

    return(
      <div>
        <Card className="measurements-overview-card">
          <CardHeader>Completed Measurements</CardHeader>
          <CardBody>
            {/*{this.state.studyNames.map( (studyName, index) => {*/}
            {/*  const measurements = this.state.measurements[index];*/}

            {/*  const row = measurements.map( (measurement, index) => {*/}
            {/*    return (*/}
            {/*      <div key={index}>*/}
            {/*        {`${studyName}: ${measurement.participant}, ${measurement.algorithm}`}*/}
            {/*      </div>)*/}
            {/*  });*/}

            {/*  return row;*/}
            {/*})}*/}

            <Button color="primary" size="lg"
                    onClick={this.navigateToLanding}>Back</Button>
          </CardBody>
        </Card>
      </div>
    );
  }
}

export default withRouter(MeasurementsOverview);
