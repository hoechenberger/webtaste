import React from 'react'
import { Input } from "reactstrap";


export const MaxTrialCountInputField = (props) => {
  return (
    <Input type="number"
           name="max-trial-count"
           id="max-trial-count"
           min="1"
           max="1000"
           placeholder="Max. number of trials"
           value={props.value}
           onChange={props.onChange}
           required />
  )
};
