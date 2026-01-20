# Signature Date Generator

This app automatically adds dates to your signature image for the current week (Monday through Friday).

## Features

- Automatically generates 5 dated signatures for the week (Monday-Friday)
- Date format: M.D.YY (e.g., 1.14.26)
- Dates are positioned at the bottom right of the signature
- Outputs all signatures to the `dated_signatures` folder

## Setup

1. Install required packages:
```bash
pip install -r requirements.txt
```

2. Make sure your signature image is in the `assets` folder as `testsign.png`

## Usage

Run the script:
```bash
python signature_dater.py
```

The app will:
- Load the signature from `assets/testsign.png`
- Generate 5 signatures with dates for Monday-Friday of the current week
- Save them in the `dated_signatures` folder

## Output

Each signature will be saved with a filename like:
- `signature_monday_1_14_26.png`
- `signature_tuesday_1_15_26.png`
- etc.
