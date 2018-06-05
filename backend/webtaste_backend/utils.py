#!/usr/bin/env python

import numpy as np


def find_nearest(a, a0):
    """
    Return the element in ndarray closest to a scalar value.

    Parameters
    ----------
    a : ndarray

    a0 : float

    Returns
    -------
    The element in `a` closest to the scalar `a0`.

    """
    idx = np.abs(a - a0).argmin()
    return a.flat[idx]


def gen_concentration_steps():
    """
    Generate the concentration_steps for the used solutions, in log10 mol / L.

    Returns
    -------
    concentration_steps : dict
        Dictionary of dilutions steps.

    """
    sucrose_conc = np.log10(np.geomspace(20,
                                         0.002510803515528001,
                                         num=14))

    citric_acid_conc = np.log10(np.geomspace(0.9,
                                             0.00029031200707790503,
                                             num=14))

    sodium_chloride_conc = np.log10(np.geomspace(2,
                                                 0.002,
                                                 num=12))

    quinine_conc = np.log10(np.geomspace(0.12255644907247643,
                                         1.5000000000000004e-05,
                                         num=18))

    concentrations = {'sucrose': sucrose_conc,
                      'citric acid': citric_acid_conc,
                      'sodium chloride': sodium_chloride_conc,
                      'quinine hydrochloride': quinine_conc}

    return concentrations


def get_start_val(substance):
    """
    Return the starting concentration for the specified substance.

    Parameters
    ----------
    substance : str
        The substance of interest

    Returns
    -------
    float
        The starting concentration.

    """
    c = gen_concentration_steps()

    start_val = {
        'sucrose': c['sucrose'][3],
        'citric acid': c['citric acid'][3],
        'sodium chloride': c['sodium chloride'][2],
        'quinine hydrochloride': c['quinine hydrochloride'][7]
    }

    return start_val[substance]


def get_jar_index(steps, conc):
    """
    Get the index of a jar corresponding to a concentration.

    Parameters
    ----------
    steps : array-like
        The concentration steps.

    conc : float
        The concentration for which to find the matching jar index.

    Returns
    -------
    int
        The index of the jar (zero-based).

    """
    return np.where(steps == conc)[0][0]

