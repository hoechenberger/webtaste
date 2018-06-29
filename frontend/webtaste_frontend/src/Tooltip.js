import React, { Component } from "react";
import { UncontrolledTooltip } from "reactstrap";


class Tooltip extends Component {
  render () {
    const id = this.props.id;
    const text = this.props.text;

    return (
      <div className="tooltip-element" id={id}>
        <UncontrolledTooltip placement="right" target={id}>
          {text}
        </UncontrolledTooltip>
      </div>
    )
  }
}

export default Tooltip;
