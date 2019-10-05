import { Input } from "reactstrap";
import React from "react";

const GustatorySubstanceInput = (props) => {
  return (
    <Input type="select" name="substance" id={props.id}
          // Disabled if no modality has been selected so far
           disabled={props.modality === ""}
           value={props.value}
           onChange={props.onChange}
           required>
      <option disabled value="" hidden>– select –</option>
      <option>citric acid</option>
      <option>sodium chloride</option>
      <option>sucrose</option>
      <option>quinine hydrochloride</option>
    </Input>
  )
};

const OlfactorySubstanceInput = (props) => {
  return (
    <Input type="select" name="substance" id={props.id}
          // Disabled if no modality has been selected so far
           disabled={props.modality === ""}
           value={props.value}
           onChange={props.onChange}
           required>
      <option disabled value="" hidden>– select –</option>
      <option>2-phenylethanol</option>
      <option>n-butanol</option>
    </Input>
  )
};

export const SubstanceInput = (props) => {
  return (
    props.modality === "gustatory" ?
      <GustatorySubstanceInput /> :
      <OlfactorySubstanceInput />
  )
};