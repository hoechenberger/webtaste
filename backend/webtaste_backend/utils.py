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


def gen_concentration_steps(modality, substance):
    """
    Generate the concentration_steps for the used solutions, in log10 mol / L.

    Parameters
    ----------
    modality : str
        The modality, either `gustatory` or `olfactory`.

    substance : str
        The substance for which to generate the concentration steps.

    Returns
    -------
    concentration_steps : dict
        Dictionary of dilutions steps.

    """
    if modality == 'gustatory':
        if substance == 'sucrose':
            return np.log10(np.geomspace(20,
                                         0.002510803515528001,
                                         num=14))
        elif substance == 'citric acid':
            return np.log10(np.geomspace(0.9,
                                         0.00029031200707790503,
                                         num=14))
        elif substance == 'sodium chloride':
            return np.log10(np.geomspace(2,
                                         0.002,
                                         num=12))
        elif substance == 'quinine hydrochloride':
            return np.log10(np.geomspace(0.12255644907247643,
                                         1.5000000000000004e-05,
                                         num=18))
        else:
            raise ValueError('Invalid substance specified.')
    elif modality == 'olfactory':
        num = 4.0
        denom = np.array([2 ** x for x in range(16)])
        concentrations = num / denom

        if (substance == '2-phenylethanol') or (substance == 'n-butanol'):
            return concentrations
        else:
            raise ValueError('Invalid substance specified.')
    else:
        raise ValueError('Invalid modality specified.')


def get_start_val(modality, substance):
    """
    Return the starting concentration for the specified substance.

    Parameters
    ----------
    modality : str
        `gustatory` or `olfactory`.
    substance : str
        The substance of interest

    Returns
    -------
    float
        The starting concentration.

    """
    c = gen_concentration_steps(modality, substance)

    if modality == 'gustatory':
        if substance == 'sucrose':
            return c[3]
        elif substance == 'citric acid':
            return c[3]
        elif substance == 'sodium chloride':
            return c[2]
        elif substance == 'quinine hydrochloride':
            return c[7]
        else:
            raise ValueError('Invalid substance specified.')
    elif modality == 'olfactory':
        if (substance == '2-phenylethanol') or (substance == 'n-butanol'):
            return c[7]
        else:
            raise ValueError('Invalid substance specified.')
    else:
        raise ValueError('Invalid modality specified.')


def get_sample_number(concentration_steps, concentration):
    """
    Get the index of a prepared stimulus sample corresponding to a
    concentration.

    Parameters
    ----------
    concentration_steps : array-like
        The concentration steps.

    concentration : float
        The concentration for which to find the matching sample number.

    Returns
    -------
    sample_number
        The number of the matching stimulus sample in the
        `concentration_steps` array, with a is 1-based index.

    """
    mask = concentration_steps == concentration
    sample_number = int(np.where(mask)[0][0]) + 1
    return sample_number
