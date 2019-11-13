import React from 'react'
import { Input } from "reactstrap";


export const AgeInputField = (props) => {
  return (
    <Input type="number"
           name="age"
           id="age"
           min="0"
           max="120"
           placeholder="Age in years"
           value={props.value}
           onChange={props.onChange}
           required />
  )
};
