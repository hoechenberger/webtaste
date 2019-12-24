import { Input, Label } from "reactstrap";
import React from "react";
import Tooltip from "./Tooltip";

export const SubstanceInputLabel = () => {
  return (
    <Label for="substance"  className="input-label-required">
      Substance
    </Label>
  )
};

export const SubstanceInputTooltip = () => {
  return (
    <Tooltip text={"Which substance to test. See the documentation for an overview " +
    "of required dilutions."}
             id="tooltip-substance"/>
  )
};

const GustatorySubstanceInputOptions = () => {
  return (
    <React.Fragment>
      <option>citric acid</option>
      <option>sodium chloride</option>
      <option>sucrose</option>
      <option>quinine hydrochloride</option>
      <option>quinine hemisulfate</option>
    </React.Fragment>
  )
};

const OlfactorySubstanceInputOptions = () => {
  return (
    <React.Fragment>
      <option disabled value="" hidden>– select –</option>
      <option>2-phenylethanol</option>
      <option>n-butanol</option>
    </React.Fragment>
  )
};

export const SubstanceInputField = (props) => {
  let options;
  let disabled;

  if (props.modality === "gustatory") {
    options = <GustatorySubstanceInputOptions />;
    disabled = false;
  } else if (props.modality === "olfactory") {
    options = <OlfactorySubstanceInputOptions />;
    disabled = false;
  } else {
    options = <option></option>;
    disabled = true;
  }

  return (
    <Input name="substance"
           type="select"
           id={props.id}
           value={props.value}
           onChange={props.onChange}
           disabled={disabled}
           required>
      {options}
    </Input>
  )
};
