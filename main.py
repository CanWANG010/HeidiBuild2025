"""
EMR + RPA Backend API
Patient Management Panel 后端服务
"""
import json
from pathlib import Path
from typing import Literal, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="EMR + RPA Backend", version="1.0.0")

# CORS 配置 - 允许前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据文件路径
DATA_DIR = Path(__file__).parent / "data"
HEIDI_FILE = DATA_DIR / "heidi_patients.json"
STATE_FILE = DATA_DIR / "patient_state.json"

# 类型定义
RunStatus = Literal["NOT_RUN", "IN_FLOW", "COMPLETED"]


class PatientListItem(BaseModel):
    """前端列表视图需要的格式"""
    id: str
    fullName: str
    birthDate: str
    gender: str
    phone: str
    email: str
    demographic: str
    runStatus: RunStatus


class PatientDetail(PatientListItem):
    """详情视图 - 包含更多 Heidi 字段"""
    # snake_case 字段供表单编辑使用
    first_name: str
    last_name: str
    additional_context: str
    current_medications: str
    allergies: str
    past_medical_history: str
    # 原始 Heidi 数据供前端使用
    rawHeidi: dict


class PatientUpdate(BaseModel):
    """PATCH 请求体"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    additional_context: Optional[str] = None
    current_medications: Optional[str] = None
    allergies: Optional[str] = None
    past_medical_history: Optional[str] = None
    runStatus: Optional[RunStatus] = None


def load_heidi_data() -> list[dict]:
    """读取 Heidi 患者数据"""
    with open(HEIDI_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_heidi_data(data: list[dict]) -> None:
    """写回 Heidi 患者数据"""
    with open(HEIDI_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def load_state_data() -> list[dict]:
    """读取状态数据"""
    with open(STATE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_state_data(data: list[dict]) -> None:
    """写回状态数据"""
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def get_run_status(patient_id: str, state_data: list[dict]) -> RunStatus:
    """获取患者的运行状态"""
    for item in state_data:
        if item["id"] == patient_id:
            return item["runStatus"]
    return "NOT_RUN"


def set_run_status(patient_id: str, status: RunStatus, state_data: list[dict]) -> list[dict]:
    """设置患者的运行状态"""
    for item in state_data:
        if item["id"] == patient_id:
            item["runStatus"] = status
            return state_data
    # 如果不存在则添加
    state_data.append({"id": patient_id, "runStatus": status})
    return state_data


def transform_to_list_item(heidi: dict, run_status: RunStatus) -> PatientListItem:
    """将 Heidi 数据转换为列表项格式"""
    return PatientListItem(
        id=heidi["id"],
        fullName=f"{heidi['first_name']} {heidi['last_name']}",
        birthDate=heidi["birth_date"],
        gender=heidi["gender"],
        phone=heidi["phone"],
        email=heidi["email"],
        demographic=heidi["demographic_string"],
        runStatus=run_status,
    )


def transform_to_detail(heidi: dict, run_status: RunStatus) -> PatientDetail:
    """将 Heidi 数据转换为详情格式"""
    return PatientDetail(
        id=heidi["id"],
        fullName=f"{heidi['first_name']} {heidi['last_name']}",
        birthDate=heidi["birth_date"],
        gender=heidi["gender"],
        phone=heidi["phone"],
        email=heidi["email"],
        demographic=heidi["demographic_string"],
        runStatus=run_status,
        first_name=heidi["first_name"],
        last_name=heidi["last_name"],
        additional_context=heidi["additional_context"],
        current_medications=heidi["current_medications"],
        allergies=heidi["allergies"],
        past_medical_history=heidi["past_medical_history"],
        rawHeidi=heidi,
    )


# ============ API 端点 ============

@app.get("/api/patients", response_model=list[PatientListItem])
def get_patients():
    """
    获取所有患者列表
    GET /api/patients
    """
    heidi_data = load_heidi_data()
    state_data = load_state_data()

    result = []
    for patient in heidi_data:
        run_status = get_run_status(patient["id"], state_data)
        result.append(transform_to_list_item(patient, run_status))

    return result


@app.get("/api/patients/{patient_id}", response_model=PatientDetail)
def get_patient(patient_id: str):
    """
    获取单个患者详情
    GET /api/patients/:id
    """
    heidi_data = load_heidi_data()
    state_data = load_state_data()

    for patient in heidi_data:
        if patient["id"] == patient_id:
            run_status = get_run_status(patient_id, state_data)
            return transform_to_detail(patient, run_status)

    raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")


@app.patch("/api/patients/{patient_id}", response_model=PatientDetail)
def update_patient(patient_id: str, update: PatientUpdate):
    """
    更新患者信息 (Human-In-The-Loop)
    PATCH /api/patients/:id

    可修改字段:
    - first_name, last_name, phone, email
    - additional_context, current_medications, allergies, past_medical_history
    - runStatus
    """
    heidi_data = load_heidi_data()
    state_data = load_state_data()

    # 找到目标患者
    target_patient = None
    for patient in heidi_data:
        if patient["id"] == patient_id:
            target_patient = patient
            break

    if target_patient is None:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    # 更新 Heidi 字段
    heidi_fields = ["first_name", "last_name", "phone", "email",
                    "additional_context", "current_medications",
                    "allergies", "past_medical_history"]

    heidi_updated = False
    for field in heidi_fields:
        value = getattr(update, field, None)
        if value is not None:
            target_patient[field] = value
            heidi_updated = True
            # 如果更新了名字，同步更新 demographic_string
            if field in ["first_name", "last_name"]:
                gender_char = "M" if target_patient["gender"] == "male" else "F"
                target_patient["demographic_string"] = (
                    f"{target_patient['first_name']} {target_patient['last_name']}, "
                    f"{gender_char}, {target_patient['birth_date']}"
                )

    if heidi_updated:
        save_heidi_data(heidi_data)

    # 更新 runStatus (写入 patient_state.json)
    if update.runStatus is not None:
        state_data = set_run_status(patient_id, update.runStatus, state_data)
        save_state_data(state_data)

    # 返回更新后的详情
    run_status = get_run_status(patient_id, state_data)
    return transform_to_detail(target_patient, run_status)


@app.post("/api/patients/reset-run-status")
def reset_all_run_status():
    """
    重置所有患者的 runStatus 为 NOT_RUN
    POST /api/patients/reset-run-status
    """
    heidi_data = load_heidi_data()
    state_data = [{"id": p["id"], "runStatus": "NOT_RUN"} for p in heidi_data]
    save_state_data(state_data)
    return {"message": "All run statuses reset to NOT_RUN", "count": len(state_data)}


@app.get("/")
def root():
    """健康检查"""
    return {"status": "ok", "message": "EMR + RPA Backend is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
