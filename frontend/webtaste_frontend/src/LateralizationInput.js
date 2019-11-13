import React from 'react';
import { Input } from "reactstrap";

export const LateralizationInputField = (props) => {
  return (
    <Input type="select"
           name="lateralization"
           id={props.id}
           value={props.value}
           onChange={props.onChange}
           required>
      <option disabled value="" hidden>– select –</option>
      <option>both sides</option>
      <option>left side</option>
      <option>right side</option>
    </Input>
  )
};
