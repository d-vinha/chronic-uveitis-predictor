# Predictor of Chronic Uveitis Risk in JIA patients (chronic-uveitis-predictor)

## Live Demo
Find the app at: [chronic-uveitis-predictor.vercel.app](https://chronic-uveitis-predictor.vercel.app/)

Web application was developed using Next.js and deployed using Vercel.

## Overview
chronic-uveitis-predictor is a small web application designed to output predictions of the risk of Chronic Uveitis in patients with Juvenile Idiopathic Arthritis (JIA). This is based on a decision tree ML model built in a study done with anonymized data from Reuma.pt (Rheumatic Diseases Portuguese Registry). 

**Important Notice:** This tool is intended to function as a helper tool and its use HAS NOT BEEN CLINICALLY VALIDATED.

## Model Creation Details

### Development Process
Decision Tree (DT) created using 3-fold, 10-repeats cross-validation, with prior systematic comparison of DT performance across different maximum depths (2-7). This was done to understand how model complexity affects performance and stability, and to achieve the best balance in terms of sensitivity, specificity, area under the curve (AUC-ROC), positive predictive value (PPV) & negative predictive value (NPV).

### Performance Summary
* **Sensitivity:** 0.729 (±0.156)
* **Specificity:** 0.744 (±0.051)
* **PPV:** 0.199 (±0.027)
* **AUC-ROC:** 0.788

### Feature Importance
Global Feature Importance was evaluated:

| Feature | Importance |
|---------|------------|
| JIA Form | 0.534 |
| ANA Result | 0.189 |
| Number of Biologic switches | 0.154 |
| Early Onset (≤ 6Yrs) | 0.123 |

Individual feature importance for each patient was calculated using SHAP (SHapley Additive exPlanations) values and are presented for each individual case.

## Copyright and License
Copyright (C) 2024 Duarte Vinha

Author's contact: duartevinha@gmail.com

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the [GNU General Public License](https://www.gnu.org/licenses/gpl-3.0.txt) in this repository for more details.
