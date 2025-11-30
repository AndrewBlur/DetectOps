from pydantic import BaseModel,EmailStr

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterResponse(BaseModel):
    message: str

class LoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
