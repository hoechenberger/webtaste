import React, { Component } from 'react';
import 'url-search-params-polyfill';
import { withRouter, Link } from 'react-router-dom'


class EmailConfirmation extends Component {
  state = {
    emailConfirmationSuccessful: null,
    emailAlreadyConfirmed: false
  };

  componentDidMount = () => {this.confirmEmailViaApi()};

  confirmEmailViaApi = async () => {
    const queryParams = new URLSearchParams(this.props.location.search);
    const token = queryParams.get("token");

    let emailConfirmationSuccessful;
    let emailAlreadyConfirmed;

    if (!token) {
      emailConfirmationSuccessful = false;
    } else {
      const uri = `/api/user/activate?token=${token}`;
      const response = await fetch(uri, {
        method: 'get',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
      });

      if (response.status === 200) {
        emailConfirmationSuccessful = true;
        emailAlreadyConfirmed = false;
      } else if (response.status === 403) {
        emailConfirmationSuccessful = false;
        emailAlreadyConfirmed = false;
      } else if (response.status === 409) {
        emailConfirmationSuccessful = false;
        emailAlreadyConfirmed = true;
      }
    }

    this.setState({
      emailConfirmationSuccessful: emailConfirmationSuccessful,
      emailAlreadyConfirmed: emailAlreadyConfirmed
    });
  };

  render () {
    let response;

    if (this.state.emailConfirmationSuccessful) {
      response = (
          <div>
            <p>Your email address was successfully confirmed.</p>
            <p><Link to="/"><strong>Proceed to login.</strong></Link></p>
          </div>
      )
    } else {
      if (this.state.emailAlreadyConfirmed) {
        response = (
            <div>
              <p>Your email address has already been confirmed previously.</p>
              <p><Link to="/"><strong>Proceed to login.</strong></Link></p>
            </div>
        )
      } else {
        response = (
            <div>
              <p>
                Email address confirmation failed.
              </p>
            </div>
        )
      }
    }

    return response;
  }
}


export default withRouter(EmailConfirmation);
