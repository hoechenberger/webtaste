#!/usr/bin/env python

from .utils import gen_concentration_steps, get_start_val


CONCENTRATION_STEPS = gen_concentration_steps()
SUBSTANCES = list(CONCENTRATION_STEPS.keys())
