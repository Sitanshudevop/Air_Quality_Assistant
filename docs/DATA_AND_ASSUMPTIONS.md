# Data Sources, Physical Coefficients, and Mathematical Assumptions

This document catalogs every scientific assumption, mathematical model, physical coefficient, uncertainty bound, and literature citation powering the **Saans (सांस)** Urban Air Quality Assistant domain calculation engine (`src/domain/`).

---

## 1. Regulatory Air Quality Breakpoints (CPCB India)

All Indian National Air Quality Index (AQI) values and category categorizations are calculated using the official Central Pollution Control Board (CPCB) India piecewise linear interpolation formula:

$$I = \frac{I_{hi} - I_{lo}}{B_{hi} - B_{lo}} \times (C - B_{lo}) + I_{lo}$$

Where:
- $C$ = Pollutant concentration ($\mu\text{g/m}^3$, or $\text{mg/m}^3$ for $\text{CO}$)
- $B_{hi}, B_{lo}$ = Breakpoint concentration boundaries
- $I_{hi}, I_{lo}$ = Sub-index boundaries corresponding to $(B_{hi}, B_{lo})$

### Breakpoint Table (CPCB 2014 Standard)

| AQI Category | Sub-Index Range | $\text{PM}_{2.5}$ (24h) | $\text{PM}_{10}$ (24h) | $\text{NO}_2$ (24h) | $\text{SO}_2$ (24h) | $\text{CO}$ (8h, $\text{mg/m}^3$) | $\text{O}_3$ (8h) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Good** | 0 – 50 | 0 – 30 | 0 – 50 | 0 – 40 | 0 – 40 | 0.0 – 1.0 | 0 – 50 |
| **Satisfactory** | 51 – 100 | 31 – 60 | 51 – 100 | 41 – 80 | 41 – 80 | 1.1 – 2.0 | 51 – 100 |
| **Moderate** | 101 – 200 | 61 – 90 | 101 – 250 | 81 – 180 | 81 – 380 | 2.1 – 10.0 | 101 – 168 |
| **Poor** | 201 – 300 | 91 – 120 | 251 – 350 | 181 – 280 | 381 – 800 | 10.1 – 17.0 | 169 – 208 |
| **Very Poor** | 301 – 400 | 121 – 250 | 351 – 430 | 281 – 400 | 801 – 1600 | 17.1 – 34.0 | 209 – 748 |
| **Severe** | 401 – 500 | 250+ | 430+ | 400+ | 1600+ | 34.0+ | 748+ |

*Note: In the application, instantaneous hourly sensor or forecast readings are displayed with an explicit tag: **"estimated"**, as formal statutory CPCB AQI is defined over 24-hour averages.*

---

## 2. Inhaled Dose Exposure Model (`src/domain/exposure.ts`)

Relative inhaled particulate dose is computed using the standard US EPA / WHO respiratory intake equation:

$$\text{Dose} = \text{PM}_{2.5} \times V_E(\text{activity}) \times t \times f_{\text{env}} \times (1 - \eta_{\text{mask}}) \times w_{\text{vuln}}$$

Where:
- $\text{PM}_{2.5}$ = Ambient fine particulate concentration ($\mu\text{g/m}^3$)
- $V_E$ = Minute ventilation rate (liters per minute, $\text{L/min}$)
- $t$ = Duration of exposure in minutes
- $f_{\text{env}}$ = Microenvironment penetration factor (fraction of outdoor concentration present)
- $\eta_{\text{mask}}$ = Infiltration filtration efficiency of protective face wear ($0.0 \le \eta \le 0.95$)
- $w_{\text{vuln}}$ = Physiological vulnerability weighting factor

*Crucial Medical Disclaimer: All dose calculations express relative exposure percentages ($\%$) and comparative differentials. The application explicitly never diagnoses, predicts clinical endpoints, or forecasts individual morbidity.*

---

## 3. Assumptions Registry (`src/domain/assumptions.ts`)

Every single parameter used by the domain engine is registered with units, low/high uncertainty bounds, and scientific citations:

### A. Minute Ventilation Rates ($V_E$)

| ID | Activity Level | Baseline Value | Uncertainty Range | Unit | Citation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ventilation_sleep` | Sleep / Recumbent | 7.0 | 5.0 – 9.0 | L/min | US EPA Exposure Factors Handbook (2011) Table 6-1 |
| `ventilation_rest` | Sedentary / Resting | 8.0 | 6.0 – 10.0 | L/min | US EPA Exposure Factors Handbook (2011) Table 6-1 |
| `ventilation_light` | Light Activity (Walking, Desk) | 14.0 | 10.0 – 19.0 | L/min | US EPA Exposure Factors Handbook (2011) Chapter 6 |
| `ventilation_moderate` | Moderate (Brisk Walking, Commute) | 27.0 | 22.0 – 35.0 | L/min | US EPA Exposure Factors Handbook (2011) Chapter 6 |
| `ventilation_heavy` | Heavy Exercise (Running, Cycling) | 48.0 | 38.0 – 60.0 | L/min | US EPA Exposure Factors Handbook (2011) Chapter 6 |

### B. Microenvironment Concentration Ratios ($f_{\text{env}}$)

| ID | Microenvironment | Factor ($C_{\text{in}} / C_{\text{out}}$) | Range | Tag | Citation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `env_outdoors` | Ambient Outdoors | 1.00 | 1.00 – 1.00 | Measured | Reference ambient baseline |
| `env_indoor_closed` | Indoors (Windows Closed) | 0.60 | 0.45 – 0.75 | Literature | Goel & Kumar (2015) Atmos Environ; Pant et al. (2017) |
| `env_indoor_hepa` | Indoors with Active HEPA | 0.15 | 0.08 – 0.25 | Literature | Srikrishna (2022) Sci Total Environ; AHAM AC-1 |
| `env_car_recirc` | In-Car (AC Recirculation ON) | 0.25 | 0.15 – 0.40 | Literature | Goel & Kumar (2015) Atmos Environ |
| `env_car_open` | In-Car (Windows Open) | 0.85 | 0.70 – 0.95 | Literature | Goel & Kumar (2015) Atmos Environ |
| `env_auto_rickshaw`| Open-Air 3-Wheeler On-Road | 0.95 | 0.85 – 1.00 | Literature | Apte et al. (2011) Atmos Environ |
| `env_bus` | Public Bus Transit | 0.75 | 0.60 – 0.90 | Literature | Pant et al. (2017); CRRI bus exposure study |
| `env_metro` | Underground/Elevated Metro Coach | 0.20 | 0.12 – 0.30 | Literature | Goel & Kumar (2015); DMRC Environmental Audit |

### C. Mask Filtration Efficiencies ($\eta_{\text{mask}}$)

| ID | Mask Type | Efficiency ($\eta$) | Effective Range | Tag | Citation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `mask_none` | None / Unmasked | 0.00 | 0.00 – 0.00 | Baseline | Physical zero-protection baseline |
| `mask_cloth` | Double-Layer Cloth Mask | 0.25 | 0.15 – 0.40 | Literature | Shakya et al. (2017) J Expo Sci Environ Epidemiol |
| `mask_surgical` | 3-Ply Disposable Surgical | 0.55 | 0.40 – 0.70 | Literature | Pan et al. (2021) ACS Nano; Shakya et al. (2017) |
| `mask_n95` | N95 / FFP2 Respirator | 0.95 | 0.90 – 0.98 | Certified | NIOSH 42 CFR Part 84 / EN 149:2001 |

### D. Physiological Vulnerability Multipliers ($w_{\text{vuln}}$)

| ID | Vulnerability Group | Weight | Range | Tag | Citation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `vuln_healthy_adult` | Healthy Adult (18–64) | 1.00 | 1.00 – 1.00 | Baseline | Reference baseline |
| `vuln_child` | Children & Infants (0–12) | 1.40 | 1.20 – 1.60 | Literature | WHO Air Quality Guidelines (2021); Bateson & Schwartz |
| `vuln_elderly` | Senior Citizens (65+) | 1.30 | 1.15 – 1.50 | Literature | US EPA Integrated Science Assessment for PM (2019) |
| `vuln_respiratory` | Asthma / COPD / Cardiac | 1.50 | 1.30 – 1.80 | Literature | Global Burden of Disease (2019); Pope & Dockery (2006) |
| `vuln_pregnant` | Pregnancy | 1.25 | 1.10 – 1.40 | Literature | Bekkar et al. (2020) JAMA Network Open |

### E. Transportation Emission Factors ($\text{g CO}_2\text{e/passenger-km}$)

| ID | Travel Mode | Emissions ($\text{g CO}_2\text{e/pkm}$) | Range | Citation |
| :--- | :--- | :--- | :--- | :--- |
| `emission_walk` | Walking / Cycling | 0 | 0 – 0 | Active mobility zero-emission baseline |
| `emission_metro` | Metro Rail Transit | 28 | 20 – 35 | TERI / DMRC Life-Cycle Carbon Audit (2020) |
| `emission_bus` | Public City Bus | 75 | 50 – 105 | India GHG Program / WRI-TERI (2015) |
| `emission_two_wheeler`| Petrol 2-Wheeler | 45 | 35 – 60 | India GHG Program (2015); ARAI |
| `emission_auto_rickshaw`| CNG Auto-Rickshaw | 65 | 45 – 90 | TERI / CPCB Urban Transport Energy Study (2018) |
| `emission_car` | Private Petrol/Diesel Car | 140 | 110 – 190 | India GHG Program / ARAI passenger vehicle average |

---

## 4. Outdoor Weather Mixing & Inversion Rules

Atmospheric mixing capability is categorized using thermal and aerodynamic boundary indicators from Open-Meteo:
1. **Severe Inversion Trap**: Wind speed $< 1.5\text{ m/s}$ ($< 5.4\text{ km/h}$) + surface temperature $\le 12^\circ\text{C}$ + relative humidity $\ge 75\%$. Indicates strong nocturnal boundary layer inversion preventing pollutant dispersion.
2. **Moderate Stagnation**: Wind speed $< 3.0\text{ m/s}$ ($< 10.8\text{ km/h}$) + high humidity.
3. **Active Dispersion**: Wind speed $\ge 4.5\text{ m/s}$ ($16.2\text{ km/h}$) or solar convective mixing between 12:00 PM and 3:30 PM.
