from typing import List, Literal, Optional

from pydantic import BaseModel, Field

Age = Literal["[40-50)", "[50-60)", "[60-70)", "[70-80)", "[80-90)", "[90-100)"]
YesNo = Literal["yes", "no"]
GlucoseA1c = Literal["high", "normal", "no"]


class PatientInput(BaseModel):
    age: Age
    time_in_hospital: int = Field(..., ge=1, le=14, description="Days in hospital")
    n_lab_procedures: int = Field(..., ge=0, le=130)
    n_procedures: int = Field(..., ge=0, le=10)
    n_medications: int = Field(..., ge=0, le=100)
    n_outpatient: int = Field(..., ge=0, le=40)
    n_inpatient: int = Field(..., ge=0, le=20)
    n_emergency: int = Field(..., ge=0, le=70)
    medical_specialty: str
    diag_1: str
    diag_2: str
    diag_3: str
    glucose_test: GlucoseA1c
    A1Ctest: GlucoseA1c
    change: YesNo
    diabetes_med: YesNo

    class Config:
        json_schema_extra = {
            "example": {
                "age": "[70-80)",
                "time_in_hospital": 5,
                "n_lab_procedures": 45,
                "n_procedures": 1,
                "n_medications": 18,
                "n_outpatient": 0,
                "n_inpatient": 2,
                "n_emergency": 0,
                "medical_specialty": "Cardiology",
                "diag_1": "Circulatory",
                "diag_2": "Diabetes",
                "diag_3": "Other",
                "glucose_test": "normal",
                "A1Ctest": "high",
                "change": "yes",
                "diabetes_med": "yes",
            }
        }


class ComparisonPoint(BaseModel):
    feature: str
    patient_value: float
    average_value: float
    direction: Literal["above_average", "below_average", "at_average"]


class PredictionResponse(BaseModel):
    readmission_probability: float
    risk_level: Literal["Low", "Medium", "High"]
    risk_band_floor: int
    model_used: str
    comparisons: List[ComparisonPoint]
    message: str
