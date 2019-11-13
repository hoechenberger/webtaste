import React from "react";
import { UncontrolledTooltip } from "reactstrap";


const Tooltip = (props) => {
  return (
    <div className="tooltip-element" id={props.id}>
      <UncontrolledTooltip placement="right" target={props.id}>
        {props.text}
      </UncontrolledTooltip>
    </div>
  )
};

export default Tooltip;
