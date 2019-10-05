import {Input} from "reactstrap";
import React from "react";

const GustatoryAlgorithmInput = (props) => {
  return (
    <Input type="select" name="algorithm" id={props.id}
          // Disabled if no modality has been selected so far
           disabled={props.modality === ""}
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
          // Disabled if no modality has been selected so far
           disabled={props.modality === ""}
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
  return (
    props.modality === "gustatory" ?
      <GustatoryAlgorithmInput /> :
      <OlfactoryAlgorithmInput />
  )
};
