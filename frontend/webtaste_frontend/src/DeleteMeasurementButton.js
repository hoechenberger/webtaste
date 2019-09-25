import { Button } from "reactstrap";
import React, { Component } from 'react';


class DeleteMeasurementButton extends Component {
  state = {
    disabled: false,
  };

  _sendDeleteRequest = async () => {
    const uri = `/api/studies/${this.props.studyId}` +
                `/measurements/${this.props.measurementId}`;

    const response = await fetch(uri, {
      method: 'delete',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    });

    return response;
  };

  handleClick = async () => {
    this.setState({disabled: true},
      async () => {
        await this._sendDeleteRequest();
        if (this.props.callBack) {
          await this.props.callBack();
        }
        this.setState({disabled: false})
      }
    )
  };

  render () {
    return (
        <Button color='danger'
                disabled={this.state.disabled}
                onClick={this.handleClick}>
          {this.props.text}
        </Button>
    );
  }
}

export default DeleteMeasurementButton;
