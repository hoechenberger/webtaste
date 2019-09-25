import {Button, Modal, ModalBody, ModalFooter, ModalHeader} from "reactstrap";
import React, { Component } from 'react';


class ConfirmDeleteModal extends Component {
  handleConfirm = () => {
    this.props.onConfirm();
    this.props.toggle();
  };

  render() {
    return (
      <span>
        <Modal isOpen={this.props.show} toggle={this.props.toggle}
               className={this.props.className}>
          <ModalHeader toggle={this.props.toggle}>{this.props.header}</ModalHeader>
          <ModalBody>{this.props.body}</ModalBody>
          <ModalFooter>
            <Button color="danger"
                    onClick={this.handleConfirm}>
              {this.props.confirmButtonText}
            </Button>{' '}
            <Button color="secondary"
                    onClick={this.props.toggle}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      </span>
    );
  }
}

class DeleteMeasurementButton extends Component {
  state = {
    disabled: false,
    showConfirmDeleteModal: false
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

  deleteMeasurement = async () => {
    await this._sendDeleteRequest();
    if (this.props.callBack) {
      await this.props.callBack();
    }
  };

  handleClick = () =>  this.setState({showConfirmDeleteModal: true })

  toggleConfirmDeleteModal = () => {
    this.setState({showConfirmDeleteModal: !this.state.showConfirmDeleteModal})
  };

  render () {
    return (
      <div>
        <ConfirmDeleteModal show={this.state.showConfirmDeleteModal}
                            toggle={this.toggleConfirmDeleteModal}
                            onConfirm={this.deleteMeasurement}
                            header='Delete Measurement'
                            body='Would you like to delete the selected measurement? Deleted data cannot be recovered!'
                            confirmButtonText='Delete Measurement'/>

        <Button color='danger'
                disabled={this.state.disabled}
                onClick={this.handleClick}>
          {this.props.text}
        </Button>
      </div>
    );
  }
}

export default DeleteMeasurementButton;
