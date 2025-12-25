from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer,OAuth2PasswordRequestForm

from app.core.database import get_db
from app.auth.models import User
from app.auth.security import hash_password, verify_password,create_token
from app.auth.schemas import RegisterResponse, LoginResponse,RegisterRequest


router = APIRouter(prefix="/auth",tags=["auth"])

oauth_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.post("/register",response_model=RegisterResponse,status_code=201)
def register(userData:RegisterRequest,db:Session=Depends(get_db)):
    if db.query(User).filter(User.email==userData.email).first():
        raise HTTPException(status_code=400,detail="Email already registered")
    
    new_user = User(email=userData.email,hashed_password=hash_password(userData.password))
    db.add(new_user)
    db.commit()
    
    return {"message":"User registered Successfully"}


@router.post("/login",response_model=LoginResponse,status_code=200)
def login(form_data:OAuth2PasswordRequestForm=Depends(),db:Session=Depends(get_db)):
    user = db.query(User).filter(User.email==form_data.username).first()
    if not user:
        raise HTTPException(status_code=404,detail="User does not exist")
    if not verify_password(form_data.password,user.hashed_password):
        raise HTTPException(status_code=401,detail="Invalid Credentials")
    
    token = create_token(user.id)
    return {"access_token":token,"token_type":"bearer"}
