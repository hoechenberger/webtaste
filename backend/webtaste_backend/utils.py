#!/usr/bin/env python

import numpy as np
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from .app import app


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
    Generate the concentration_steps for the used solutions, in log10 mol/L
    for gustatory and in log10 percent for  olfactory stimuli.

    Parameters
    ----------
    modality : str
        The modality, either `gustatory` or `olfactory`.

    substance : str
        The substance for which to generate the concentration steps.

    Returns
    -------
    concentration_steps : np.ndarray
        The concentration steps.

    """
    if modality == 'gustatory':
        if substance == 'sucrose':
            # return np.log10(np.geomspace(20,
            #                              0.002510803515528001,
            #                              num=14))
            return np.flipud(np.arange(-4.25, -0.25+0.25, 0.25))
        elif substance == 'citric acid':
            # return np.log10(np.geomspace(0.9,
            #                              0.00029031200707790503,
            #                              num=14))
            return np.flipud(np.arange(-4.8, -1.3+0.25, 0.25))
        elif substance == 'sodium chloride':
            # return np.log10(np.geomspace(2,
            #                              0.002,
            #                              num=12))
            return np.flipud(np.arange(-3.5, -0.5+0.25, 0.25))
        elif substance == 'quinine hydrochloride':
            # return np.log10(np.geomspace(0.12255644907247643,
            #                              1.5000000000000004e-05,
            #                              num=18))
            return np.flipud(np.arange(-6.75, -2.5+0.25, 0.25))
        else:
            raise ValueError('Invalid substance specified.')
    elif modality == 'olfactory':
        concentrations = np.log10(np.geomspace(4/(2**0), 4/(2**15), num=16))

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
            return c[6]
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


def send_email(user, to_address, message_type, token=None):
    from_address = app.config['SENSORY_TESTING_MAIL_FROM']
    smtp_server_address = app.config['SMTP_SERVER']
    smtp_user = app.config['SMTP_USER']
    smtp_password = app.config['SMTP_PASSWORD']

    msg = MIMEMultipart()
    msg['From'] = from_address
    msg['To'] = to_address

    if message_type == 'confirm_address':
        confirmation_uri = (f'https://sensory-testing.org/'
                            f'confirm_email/?token={token}')

        msg['Subject'] = 'sensory-testing.org: Please activate your account'
        body = (f'Why, hello there!\n\n'
                f'You have registered an account at '
                f'sensory-testing.org with your email address '
                f'{to_address}.\n\n'
                f'        User name: {user}\n\n'
                f'To activate this account, visit the following address:\n\n '
                f'{confirmation_uri}')

    elif message_type == 'account_activated':
        msg['Subject'] = 'Welcome to sensory-testing.org!'

        body = (f'Your account at sensory-testing.org was successfully '
                f'activated.\n\n'
                f'        User name: {user}\n\n'
                f'If you have any questions, please do not hesitate to '
                f'contact me at {from_address}.\n\n'
                f'Enjoy the Science!\n\n'
                f'      —Richard, on behalf of sensory-testing.org')
    else:
        raise ValueError('Invalid message_type specified.')

    msg.attach(MIMEText(body, 'plain'))

    server = smtplib.SMTP(smtp_server_address, 587)
    server.starttls()
    server.login(user=smtp_user, password=smtp_password)
    text = msg.as_string()

    try:
        server.sendmail(from_address, to_address, text)
    except Exception:  # FIXME
        msg = (f'Something went wrong while trying to send {message_type} '
               f'email to {to_address}.')
        print(msg)
    server.quit()


def threshold_to_sample_num(concentration_steps, threshold_param):
    # Find sample number corresponding to threshold
    # Find nearest concentration
    idx = np.abs(concentration_steps - threshold_param).argmin()
    # Difference > 0: threshold is LOWER than concentration,
    # i.e. to be found at a higher dilution step
    # Difference < 0: threshold is HIGHER than concentration,
    # i.e. to be found at a lower dilution step
    diff = concentration_steps[idx] - threshold_param
    # Relative difference, i.e., in numbers of dilutions steps.
    diff_abs = np.abs(diff)
    diff_rel = diff_abs / (concentration_steps[0] -
                           concentration_steps[1])
    if diff > 0:
        threshold_param_sample_num = idx + 1 + diff_rel
    elif diff < 0:
        threshold_param_sample_num = idx + 1 - diff_rel
    else:
        threshold_param_sample_num = idx + 1
    return threshold_param_sample_num
