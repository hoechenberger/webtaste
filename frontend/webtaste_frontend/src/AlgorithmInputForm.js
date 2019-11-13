import {Input} from "reactstrap";
import React from "react";

const GustatoryAlgorithmInput = (props) => {
  return (
    <Input type="select" name="algorithm" id={props.id}
           disabled={props.disabled}
           value={props.value}
           onChange={props.onChange}
           required>
      <option disabled value="" hidden>– select –</option>
      <option>QUEST+</option>
      <option>QUEST</option>
    </Input>
  )
};

const OlfactoryAlgorithmInput = (props) => {
  return (
    <Input type="select" name="algorithm" id={props.id}
           disabled={props.disabled}
           value={props.value}
           onChange={props.onChange}
           required>
      <option disabled value="" hidden>– select –</option>
      <option>QUEST</option>
      {/*<option>Hummel</option>*/}
    </Input>
  )
};

export const AlgorithmInput = (props) => {
  if (props.modality === "gustatory") {
    return  <GustatoryAlgorithmInput value={props.value}
                                     onChange={props.onChange} />;
  } else if (props.modality === "olfactory") {
    return <OlfactoryAlgorithmInput value={props.value}
                                    onChange={props.onChange} />;
  } else {
    return  <GustatoryAlgorithmInput disabled={true}/>;
  }
};
