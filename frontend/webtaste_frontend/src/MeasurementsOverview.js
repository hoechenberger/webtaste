import React, { Component } from 'react';
import { Button, Card, CardBody, CardHeader } from "reactstrap";
import BootstrapTable from 'react-bootstrap-table-next';
import DownloadReportButton from './DownloadReportButton'
import DeleteMeasurementButton from "./DeleteMeasurementButton";
import { withRouter } from 'react-router-dom'


class MeasurementsOverview extends Component {
  state = {
    studyIds: [],
    studyNames: [],
    measurements: []
  };

  componentDidMount = async () => {
    if (!this.props.loggedIn) {
      this.navigateToLogin();
    } else {
      await this.fetchStudies();
    }
  };

  genDateString = (measurementDate) => {
    const d = new Date(measurementDate);
    return (
      `${d.getUTCFullYear()}-` +
      `${('0' + (d.getUTCMonth() + 1)).slice(-2)}-` +
      `${('0' + d.getUTCDate()).slice(-2)} ` +
      `${('0' + d.getHours()).slice(-2)}:` +
      `${('0' + d.getMinutes()).slice(-2)}`
    )
  };

  fetchStudies = async () => {
    const uri = '/api/studies';
    const response = await fetch(uri, {method: 'get'});
    const json = await response.json();
    const studyIds = json.data.studies.map( (study) => { return study.id });
    const studyNames = json.data.studies.map( (study) => { return study.name });

    let measurements = await Promise.all(
      studyIds.map( (studyId) => { return this.fetchMeasurements(studyId) })
    );

    measurements = measurements.flat(1);

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
        number: measurement.number,
        id: measurement.id,
        studyId: studyId,
        participant: measurement.metadata.participant,
        modality: measurement.metadata.modality,
        substance: measurement.metadata.substance,
        algorithm: measurement.metadata.algorithm,
        session: measurement.metadata.sessionName,
        // date: measurement.metadata.date
        date: this.genDateString(measurement.metadata.date)
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

  navigateToLogin = () => {
    this.props.history.push('/')
  };

  downloadButtonFormatter = (cell, row) => {
    const studyId = row.studyId;
    const measurementNumber = row.number;
    return <DownloadReportButton studyId={studyId}
                                 measurementId={measurementNumber}
                                 text="↓" />
  };

  deleteButtonFormatter = (cell, row) => {
    const studyId = row.studyId;
    const measurementNumber = row.number;
    return <DeleteMeasurementButton studyId={studyId}
                                    measurementId={measurementNumber}
                                    text="✕"
                                    callBack={this.fetchStudies} />
  };

  render = () => {
    const columns = [
      { dataField: 'participant',
        text: 'Participant',
        sort: true },
      // { dataField: 'modality',
      //   text: 'Mod',
      //   sort: true },
      { dataField: 'substance',
        text: 'Substance',
        sort: true },
      // { dataField: 'algorithm',
      //   text: 'Algor.',
      //   sort: true },
      { dataField: 'date',
        text: 'Date',
        sort: true },
      { dataField: 'download',
        text: 'Download',
        isDummyField: true,
        csvExport: false,
        // formatter: (cell, row) => <Button color="success">↓</Button>
        formatter: this.downloadButtonFormatter
      },
      { dataField: 'delete',
        text: 'Delete',
        isDummyField: true,
        csvExport: false,
        formatter: this.deleteButtonFormatter
      }
    ];

    const defaultSorted = [{
      dataField: 'date',
      order: 'desc'
    }];

    return(
      <div>
        <Card className="measurements-overview-card">
          <CardHeader>Completed Measurements</CardHeader>
          <CardBody>
              <BootstrapTable bootstrap4
                              striped
                              hover
                              condensed
                              keyField='id'
                              data={this.state.measurements}
                              defaultSorted={defaultSorted}
                              columns={columns} />

            <Button color="primary" size="lg"
                    onClick={this.navigateToLanding}>Back</Button>
          </CardBody>
        </Card>
      </div>
    );
  }
}

export default withRouter(MeasurementsOverview);
