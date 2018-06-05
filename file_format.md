File format specification
============

The data file format is based on simple UTF-8 text with comma-separated
values (CSV). Two data files are generated:

* an experimental run file, containing information about every single
  trial (stimulation & response)
* a summary file, containing the estimated threshold and summary
  information about the experimental run.

Experimental run file
--------

The file contains the following columns:

* **Participant** The unique alphanumerical 
  identifier of the tested participant oder patient.
* **Substance** The substance being tested.
* **Trial** The trial number.
* **Concentration** The presented stimulus concentration, in `log10 M`.
* **Date** The local date (YYYY-MM-DD) the trial was run.
* **Time** The local time (HH:MM:SS, 24h format) the trial was run.
* **Start** The starting concentration (used in the very first trial),
  in `log10 M`. This is the mean of the Gaussian prior used for
  threshold estimation.
* **SD** The standard deviation of the Gaussian prior, in `log10 M`.
* **pCorrect** The proportion of *Yes* responses at threshold level,
  in the interval [0, 1].

Each row corresponds to a single trial.


Summary file
--------

The file contains the following columns:

* **Participant** The unique alphanumerical 
  identifier of the tested participant oder patient.
* **Substance** The substance being tested.
* **Threshold**
* **Date** The local date (YYYY-MM-DD) the trial was run.
* **Time** The local time (HH:MM:SS, 24h format) of the trial was run.
* **Start** The starting concentration (used in the very first trial),
  in `log10 M`. This is the mean of the Gaussian prior used for
  threshold estimation.
* **SD** The standard deviation of the Gaussian prior, in `log10 M`.
* **pCorrect** The proportion of *Yes* responses at threshold level,
  in the interval [0, 1].
