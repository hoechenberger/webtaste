import { saveAs } from "file-saver";
import { Button } from "reactstrap";
import React, { Component } from 'react';


class DownloadReportButton extends Component {
  state = {
    disabled: false,
  };

  _getQuestReportFromApi = async () => {
    const uri = `/api/studies/${this.props.studyId}` +
                `/measurements/${this.props.measurementId}/report`;

    const response = await fetch(uri, {
      method: 'get',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    });

    return response;
  };

  _prepareAndDeliverDownload = async () => {
    const response = await this._getQuestReportFromApi();
    const contentDispositionHeader = response.headers.get('content-disposition');
    const filename = contentDispositionHeader.split('=')[1];
    const blob = await response.blob();

    saveAs(blob, filename);
  };

  handleClick = async () => {
    this.setState({disabled: true},
        async () => {
          await this._prepareAndDeliverDownload();
          this.setState({disabled: false});
        })
  };

  render () {
    return (
        <Button color='success'
                disabled={this.state.disabled}
                onClick={this.handleClick}>
          {this.props.text}
        </Button>
    );
  }
}

export default DownloadReportButton;
